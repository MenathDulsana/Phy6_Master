package com.example.Phy6_Master.service;

import com.example.Phy6_Master.dto.quiz.AnswerOptionRequestDto;
import com.example.Phy6_Master.dto.quiz.AnswerOptionResponseDto;
import com.example.Phy6_Master.dto.quiz.QuestionRequestDto;
import com.example.Phy6_Master.dto.quiz.QuestionResponseDto;
import com.example.Phy6_Master.dto.quiz.QuestionUpdateRequestDto;
import com.example.Phy6_Master.dto.quiz.QuizCreateRequestDto;
import com.example.Phy6_Master.dto.quiz.QuizResponseDto;
import com.example.Phy6_Master.dto.quiz.QuizUpdateRequestDto;
import com.example.Phy6_Master.exception.BadRequestException;
import com.example.Phy6_Master.exception.ForbiddenException;
import com.example.Phy6_Master.exception.NotFoundException;
import com.example.Phy6_Master.exception.ValidationException;
import com.example.Phy6_Master.model.AnswerOption;
import com.example.Phy6_Master.model.Course;
import com.example.Phy6_Master.model.Enrollment;
import com.example.Phy6_Master.model.Lesson;
import com.example.Phy6_Master.model.Question;
import com.example.Phy6_Master.model.Quiz;
import com.example.Phy6_Master.model.QuizStatus;
import com.example.Phy6_Master.model.User;
import com.example.Phy6_Master.repository.CourseRepository;
import com.example.Phy6_Master.repository.EnrollmentRepository;
import com.example.Phy6_Master.repository.LessonRepository;
import com.example.Phy6_Master.repository.QuestionRepository;
import com.example.Phy6_Master.repository.QuizRepository;
import com.example.Phy6_Master.repository.QuizResultRepository;
import com.example.Phy6_Master.repository.QuizSessionRepository;
import com.example.Phy6_Master.repository.StudentAnswerRepository;
import com.example.Phy6_Master.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class QuizService {

    @Autowired
    private QuizRepository quizRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private LessonRepository lessonRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private QuizSessionRepository quizSessionRepository;

    @Autowired
    private QuizResultRepository quizResultRepository;

    @Autowired
    private StudentAnswerRepository studentAnswerRepository;

    @Transactional
    public QuizResponseDto createQuiz(QuizCreateRequestDto request) {
        validateQuizRequest(request);
        User teacher = loadTeacher(request.getTeacherId());
        Course linkedCourse = resolveLinkedCourse(request.getCourseId(), request.getLessonId());
        Lesson linkedLesson = resolveOptionalLesson(request.getLessonId());

        assertTeacherOwnsCourse(teacher, linkedCourse);

        Quiz quiz = new Quiz();
        quiz.setTitle(request.getTitle().trim());
        quiz.setCourse(linkedCourse);
        quiz.setLesson(linkedLesson);
        quiz.setStatus(request.getStatus() != null ? request.getStatus() : QuizStatus.DRAFT);

        List<Question> questions = buildQuestionsForQuiz(quiz, request.getQuestions());
        quiz.setQuestions(questions);

        Quiz saved = quizRepository.save(quiz);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public QuizResponseDto getQuizById(Long quizId, Long teacherId, Long studentId) {
        Quiz quiz = loadQuiz(quizId);

        if (teacherId != null) {
            User teacher = loadTeacher(teacherId);
            assertTeacherOwnsCourse(teacher, quiz.getCourse());
        }

        if (studentId != null) {
            ensureStudentCanView(studentId, quiz);
        }

        return toResponse(quiz);
    }

    @Transactional
    public QuizResponseDto updateQuiz(Long quizId, QuizUpdateRequestDto request) {
        validateQuizRequest(request);
        User teacher = loadTeacher(request.getTeacherId());
        Quiz quiz = loadQuiz(quizId);

        Course linkedCourse = resolveLinkedCourse(request.getCourseId(), request.getLessonId());
        Lesson linkedLesson = resolveOptionalLesson(request.getLessonId());

        assertTeacherOwnsCourse(teacher, quiz.getCourse());
        assertTeacherOwnsCourse(teacher, linkedCourse);

        clearQuizAttempts(quizId);

        quiz.setTitle(request.getTitle().trim());
        quiz.setCourse(linkedCourse);
        quiz.setLesson(linkedLesson);
        if (request.getStatus() != null) {
            quiz.setStatus(request.getStatus());
        }

        quiz.getQuestions().clear();
        List<Question> questions = buildQuestionsForQuiz(quiz, request.getQuestions());
        quiz.getQuestions().addAll(questions);

        Quiz saved = quizRepository.save(quiz);
        return toResponse(saved);
    }

    @Transactional
    public void deleteQuiz(Long quizId, Long teacherId) {
        User teacher = loadTeacher(teacherId);
        Quiz quiz = loadQuiz(quizId);
        assertTeacherOwnsCourse(teacher, quiz.getCourse());
        clearQuizAttempts(quizId);
        quizRepository.delete(quiz);
    }

    @Transactional
    public QuestionResponseDto addQuestion(Long quizId, Long teacherId, QuestionRequestDto request) {
        Quiz quiz = loadQuiz(quizId);
        User teacher = loadTeacher(teacherId);
        assertTeacherOwnsCourse(teacher, quiz.getCourse());
        validateQuestionRequest(request, "questions[0]");

        Question question = buildQuestion(quiz, request);
        Question saved = questionRepository.save(question);
        return toResponse(saved);
    }

    @Transactional
    public QuestionResponseDto updateQuestion(Long questionId, QuestionUpdateRequestDto request) {
        if (request.getTeacherId() == null) {
            throw new BadRequestException("teacherId is required");
        }
        validateQuestionRequest(request, "question");

        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new NotFoundException("Question not found with id: " + questionId));

        User teacher = loadTeacher(request.getTeacherId());
        assertTeacherOwnsCourse(teacher, question.getQuiz().getCourse());

        clearQuizAttempts(question.getQuiz().getId());

        question.setText(request.getText().trim());
        question.getAnswerOptions().clear();
        question.getAnswerOptions().addAll(buildOptions(question, request.getOptions()));

        Question saved = questionRepository.save(question);
        return toResponse(saved);
    }

    @Transactional
    public void deleteQuestion(Long questionId, Long teacherId) {
        User teacher = loadTeacher(teacherId);
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new NotFoundException("Question not found with id: " + questionId));

        assertTeacherOwnsCourse(teacher, question.getQuiz().getCourse());
        clearQuizAttempts(question.getQuiz().getId());
        questionRepository.delete(question);
    }

    @Transactional(readOnly = true)
    public Page<QuizResponseDto> getVisibleQuizzesForStudent(Long studentId, int page, int size) {
        User student = loadStudent(studentId);
        List<Enrollment> enrollments = enrollmentRepository.findByStudent(student);
        List<Course> courses = enrollments.stream().map(Enrollment::getCourse).toList();

        if (courses.isEmpty()) {
            return Page.empty(PageRequest.of(page, size));
        }

        return quizRepository.findByCourseInAndStatus(courses, QuizStatus.PUBLISHED, PageRequest.of(page, size))
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public List<QuizResponseDto> getQuizzesForTeacher(Long teacherId) {
        User teacher = loadTeacher(teacherId);
        return quizRepository.findByCourse_Teacher_IdOrderByUpdatedAtDesc(teacher.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private Quiz loadQuiz(Long quizId) {
        return quizRepository.findById(quizId)
                .orElseThrow(() -> new NotFoundException("Quiz not found with id: " + quizId));
    }

    private void clearQuizAttempts(Long quizId) {
        studentAnswerRepository.deleteBySession_Quiz_Id(quizId);
        quizResultRepository.deleteByQuiz_Id(quizId);
        quizSessionRepository.deleteByQuiz_Id(quizId);
    }

    private User loadTeacher(Long teacherId) {
        if (teacherId == null) {
            throw new BadRequestException("teacherId is required");
        }
        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new NotFoundException("Teacher not found with id: " + teacherId));
        if (teacher.getRole() != User.Role.TEACHER) {
            throw new ForbiddenException("User is not a teacher");
        }
        return teacher;
    }

    private User loadStudent(Long studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new NotFoundException("Student not found with id: " + studentId));
        if (student.getRole() != User.Role.STUDENT) {
            throw new ForbiddenException("User is not a student");
        }
        return student;
    }

    private Course resolveLinkedCourse(Long courseId, Long lessonId) {
        if (courseId == null && lessonId == null) {
            throw new BadRequestException("Either courseId or lessonId must be provided");
        }
        if (courseId != null && lessonId != null) {
            Lesson lesson = resolveOptionalLesson(lessonId);
            if (!Objects.equals(lesson.getCourse().getId(), courseId)) {
                throw new BadRequestException("Provided courseId does not match lesson's course");
            }
            return lesson.getCourse();
        }
        if (courseId != null) {
            return courseRepository.findById(courseId)
                    .orElseThrow(() -> new NotFoundException("Course not found with id: " + courseId));
        }
        return resolveOptionalLesson(lessonId).getCourse();
    }

    private Lesson resolveOptionalLesson(Long lessonId) {
        if (lessonId == null) {
            return null;
        }
        return lessonRepository.findById(lessonId)
                .orElseThrow(() -> new NotFoundException("Lesson not found with id: " + lessonId));
    }

    private void assertTeacherOwnsCourse(User teacher, Course course) {
        if (course.getTeacher() == null || !Objects.equals(course.getTeacher().getId(), teacher.getId())) {
            throw new ForbiddenException("Teacher can only manage quizzes for their own classes");
        }
    }

    private void ensureStudentCanView(Long studentId, Quiz quiz) {
        User student = loadStudent(studentId);
        boolean enrolled = enrollmentRepository.existsByStudentAndCourse(student, quiz.getCourse());
        if (!enrolled) {
            throw new ForbiddenException("Student is not enrolled in the linked class");
        }
        if (quiz.getStatus() != QuizStatus.PUBLISHED) {
            throw new ForbiddenException("Quiz is not published for students");
        }
    }

    private List<Question> buildQuestionsForQuiz(Quiz quiz, List<QuestionRequestDto> questionDtos) {
        List<Question> questions = new ArrayList<>();
        for (QuestionRequestDto questionDto : questionDtos) {
            questions.add(buildQuestion(quiz, questionDto));
        }
        return questions;
    }

    private Question buildQuestion(Quiz quiz, QuestionRequestDto dto) {
        Question question = new Question();
        question.setQuiz(quiz);
        question.setText(dto.getText().trim());
        question.setAnswerOptions(buildOptions(question, dto.getOptions()));
        return question;
    }

    private List<AnswerOption> buildOptions(Question question, List<AnswerOptionRequestDto> optionDtos) {
        List<AnswerOption> options = new ArrayList<>();
        for (AnswerOptionRequestDto optionDto : optionDtos) {
            AnswerOption option = new AnswerOption();
            option.setQuestion(question);
            option.setText(optionDto.getText().trim());
            option.setCorrect(Boolean.TRUE.equals(optionDto.getCorrect()));
            options.add(option);
        }
        return options;
    }

    private void validateQuizRequest(QuizCreateRequestDto request) {
        Map<String, String> errors = new LinkedHashMap<>();

        if (request.getTitle() == null || request.getTitle().trim().isEmpty()) {
            errors.put("title", "Quiz title is required");
        }

        if (request.getCourseId() == null && request.getLessonId() == null) {
            errors.put("link", "Either class (courseId) or lessonId is required");
        }

        if (request.getQuestions() == null || request.getQuestions().isEmpty()) {
            errors.put("questions", "At least one question is required");
        } else {
            for (int i = 0; i < request.getQuestions().size(); i++) {
                validateQuestionRequest(request.getQuestions().get(i), "questions[" + i + "]", errors);
            }
        }

        if (!errors.isEmpty()) {
            throw new ValidationException("Validation failed", errors);
        }
    }

    private void validateQuestionRequest(QuestionRequestDto request, String prefix) {
        Map<String, String> errors = new LinkedHashMap<>();
        validateQuestionRequest(request, prefix, errors);
        if (!errors.isEmpty()) {
            throw new ValidationException("Validation failed", errors);
        }
    }

    private void validateQuestionRequest(QuestionRequestDto request, String prefix, Map<String, String> errors) {
        if (request.getText() == null || request.getText().trim().isEmpty()) {
            errors.put(prefix + ".text", "Question text is required");
        }

        if (request.getOptions() == null || request.getOptions().size() < 2) {
            errors.put(prefix + ".options", "At least 2 answer options are required");
            return;
        }

        int correctCount = 0;
        for (int i = 0; i < request.getOptions().size(); i++) {
            AnswerOptionRequestDto option = request.getOptions().get(i);
            String key = prefix + ".options[" + i + "]";

            if (option.getText() == null || option.getText().trim().isEmpty()) {
                errors.put(key + ".text", "Answer option text is required");
            }
            if (Boolean.TRUE.equals(option.getCorrect())) {
                correctCount++;
            }
        }

        if (correctCount == 0) {
            errors.put(prefix + ".correct", "One correct answer must be selected");
        }
        if (correctCount > 1) {
            errors.put(prefix + ".correct", "Only one correct answer is allowed");
        }
    }

    private QuizResponseDto toResponse(Quiz quiz) {
        QuizResponseDto response = new QuizResponseDto();
        response.setId(quiz.getId());
        response.setTitle(quiz.getTitle());
        response.setCourseId(quiz.getCourse() != null ? quiz.getCourse().getId() : null);
        response.setLessonId(quiz.getLesson() != null ? quiz.getLesson().getId() : null);
        response.setStatus(quiz.getStatus());
        response.setCreatedAt(quiz.getCreatedAt());
        response.setUpdatedAt(quiz.getUpdatedAt());
        response.setQuestions(quiz.getQuestions().stream().map(this::toResponse).toList());
        return response;
    }

    private QuestionResponseDto toResponse(Question question) {
        QuestionResponseDto response = new QuestionResponseDto();
        response.setId(question.getId());
        response.setText(question.getText());
        response.setOptions(question.getAnswerOptions().stream().map(this::toResponse).toList());
        return response;
    }

    private AnswerOptionResponseDto toResponse(AnswerOption option) {
        AnswerOptionResponseDto response = new AnswerOptionResponseDto();
        response.setId(option.getId());
        response.setText(option.getText());
        response.setCorrect(option.isCorrect());
        return response;
    }
}
