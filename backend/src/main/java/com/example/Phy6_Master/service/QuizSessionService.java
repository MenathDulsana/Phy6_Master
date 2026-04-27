package com.example.Phy6_Master.service;

import com.example.Phy6_Master.dto.quiz.AnswerCurrentQuestionRequestDto;
import com.example.Phy6_Master.dto.quiz.CurrentQuestionResponseDto;
import com.example.Phy6_Master.dto.quiz.OptionForPlayResponseDto;
import com.example.Phy6_Master.dto.quiz.QuestionForPlayResponseDto;
import com.example.Phy6_Master.dto.quiz.QuizQuestionSummaryDto;
import com.example.Phy6_Master.dto.quiz.QuizResultResponseDto;
import com.example.Phy6_Master.dto.quiz.QuizReviewOptionDto;
import com.example.Phy6_Master.dto.quiz.QuizReviewQuestionDto;
import com.example.Phy6_Master.dto.quiz.QuizReviewResponseDto;
import com.example.Phy6_Master.dto.quiz.QuizSessionResponseDto;
import com.example.Phy6_Master.dto.quiz.QuizSessionSummaryDto;
import com.example.Phy6_Master.dto.quiz.StartQuizSessionRequestDto;
import com.example.Phy6_Master.exception.BadRequestException;
import com.example.Phy6_Master.exception.ForbiddenException;
import com.example.Phy6_Master.exception.NotFoundException;
import com.example.Phy6_Master.model.AnswerOption;
import com.example.Phy6_Master.model.Question;
import com.example.Phy6_Master.model.Quiz;
import com.example.Phy6_Master.model.QuizResult;
import com.example.Phy6_Master.model.QuizSession;
import com.example.Phy6_Master.model.QuizSessionStatus;
import com.example.Phy6_Master.model.StudentAnswer;
import com.example.Phy6_Master.model.User;
import com.example.Phy6_Master.repository.EnrollmentRepository;
import com.example.Phy6_Master.repository.QuizRepository;
import com.example.Phy6_Master.repository.QuizResultRepository;
import com.example.Phy6_Master.repository.QuizSessionRepository;
import com.example.Phy6_Master.repository.StudentAnswerRepository;
import com.example.Phy6_Master.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class QuizSessionService {

    @Autowired
    private QuizSessionRepository quizSessionRepository;

    @Autowired
    private QuizRepository quizRepository;

    @Autowired
    private StudentAnswerRepository studentAnswerRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private QuizResultRepository quizResultRepository;

    @Autowired
    private QuizScoringService quizScoringService;

    @Value("${quiz.pass-threshold-percentage:50}")
    private int passThresholdPercentage;

    @Transactional
    public QuizSessionResponseDto startSession(StartQuizSessionRequestDto request) {
        if (request.getStudentId() == null || request.getQuizId() == null) {
            throw new BadRequestException("studentId and quizId are required");
        }

        User student = loadStudent(request.getStudentId());
        Quiz quiz = loadQuiz(request.getQuizId());
        ensureStudentCanAccessQuiz(student, quiz);

        QuizSession existing = quizSessionRepository
                .findByStudent_IdAndQuiz_IdAndStatus(student.getId(), quiz.getId(), QuizSessionStatus.ACTIVE)
                .orElse(null);

        if (existing != null) {
            return toResponse(existing);
        }

        List<Question> questions = sortedQuestions(quiz);
        if (questions.isEmpty()) {
            throw new BadRequestException("Quiz has no questions");
        }

        QuizSession session = new QuizSession();
        session.setStudent(student);
        session.setQuiz(quiz);
        session.setStatus(QuizSessionStatus.ACTIVE);
        session.setCurrentQuestionIndex(0);
        session.setTotalQuestions(questions.size());

        QuizSession saved = quizSessionRepository.save(session);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public QuizSessionResponseDto getSession(Long sessionId, Long studentId) {
        QuizSession session = loadOwnedSession(sessionId, studentId);
        return toResponse(session);
    }

    @Transactional(readOnly = true)
    public QuizSessionResponseDto getActiveSession(Long studentId, Long quizId) {
        if (studentId == null || quizId == null) {
            throw new BadRequestException("studentId and quizId are required");
        }
        QuizSession session = quizSessionRepository
                .findByStudent_IdAndQuiz_IdAndStatus(studentId, quizId, QuizSessionStatus.ACTIVE)
                .orElseThrow(() -> new NotFoundException("No active session found"));
        return toResponse(session);
    }

    @Transactional(readOnly = true)
    public CurrentQuestionResponseDto getCurrentQuestion(Long sessionId, Long studentId) {
        QuizSession session = loadOwnedSession(sessionId, studentId);
        ensureActive(session);

        List<Question> questions = sortedQuestions(session.getQuiz());
        int index = session.getCurrentQuestionIndex();
        if (index < 0 || index >= questions.size()) {
            throw new BadRequestException("No current question available");
        }

        Question question = questions.get(index);

        CurrentQuestionResponseDto response = new CurrentQuestionResponseDto();
        response.setSessionId(session.getId());
        response.setQuestionIndex(index + 1);
        response.setTotalQuestions(questions.size());
        response.setLastQuestion(index == questions.size() - 1);
        response.setQuestion(toPlayQuestion(question));
        studentAnswerRepository.findBySession_IdAndQuestion_Id(session.getId(), question.getId())
                .map(answer -> answer.getSelectedOption().getId())
                .ifPresent(response::setSelectedOptionId);
        return response;
    }

    @Transactional(readOnly = true)
    public QuizSessionSummaryDto getSessionSummary(Long sessionId, Long studentId) {
        QuizSession session = loadOwnedSession(sessionId, studentId);
        ensureActive(session);

        List<Question> questions = sortedQuestions(session.getQuiz());
        Map<Long, StudentAnswer> answerByQuestion = studentAnswerRepository.findBySession_Id(session.getId()).stream()
                .collect(Collectors.toMap(a -> a.getQuestion().getId(), Function.identity(), (a, b) -> b));

        List<QuizQuestionSummaryDto> questionSummaries = new java.util.ArrayList<>();
        for (int i = 0; i < questions.size(); i++) {
            Question question = questions.get(i);
            StudentAnswer answer = answerByQuestion.get(question.getId());
            QuizQuestionSummaryDto dto = new QuizQuestionSummaryDto();
            dto.setQuestionId(question.getId());
            dto.setQuestionIndex(i + 1);
            dto.setAnswered(answer != null && answer.getSelectedOption() != null);
            if (answer != null && answer.getSelectedOption() != null) {
                dto.setSelectedOptionId(answer.getSelectedOption().getId());
            }
            questionSummaries.add(dto);
        }

        QuizSessionSummaryDto response = new QuizSessionSummaryDto();
        response.setSessionId(session.getId());
        response.setTotalQuestions(questions.size());
        response.setQuestions(questionSummaries);
        return response;
    }

    @Transactional
    public QuizSessionResponseDto submitAnswer(Long sessionId, AnswerCurrentQuestionRequestDto request) {
        if (request.getStudentId() == null || request.getSelectedOptionId() == null) {
            throw new BadRequestException("studentId and selectedOptionId are required");
        }

        QuizSession session = loadOwnedSession(sessionId, request.getStudentId());
        ensureActive(session);

        List<Question> questions = sortedQuestions(session.getQuiz());
        int index = session.getCurrentQuestionIndex();
        if (index < 0 || index >= questions.size()) {
            throw new BadRequestException("No current question available");
        }

        Question currentQuestion = questions.get(index);
        AnswerOption selectedOption = currentQuestion.getAnswerOptions().stream()
                .filter(option -> option.getId().equals(request.getSelectedOptionId()))
                .findFirst()
                .orElseThrow(() -> new BadRequestException("Selected option does not belong to current question"));

        StudentAnswer answer = studentAnswerRepository
                .findBySession_IdAndQuestion_Id(session.getId(), currentQuestion.getId())
                .orElseGet(StudentAnswer::new);

        answer.setSession(session);
        answer.setQuestion(currentQuestion);
        answer.setSelectedOption(selectedOption);
        answer.setAnsweredAt(LocalDateTime.now());
        studentAnswerRepository.save(answer);

        return toResponse(session);
    }

    @Transactional
    public QuizSessionResponseDto moveToNextQuestion(Long sessionId, Long studentId) {
        QuizSession session = loadOwnedSession(sessionId, studentId);
        ensureActive(session);

        List<Question> questions = sortedQuestions(session.getQuiz());
        int current = session.getCurrentQuestionIndex();
        if (current >= questions.size() - 1) {
            throw new BadRequestException("Already at the final question");
        }

        session.setCurrentQuestionIndex(current + 1);
        QuizSession saved = quizSessionRepository.save(session);
        return toResponse(saved);
    }

    @Transactional
    public QuizSessionResponseDto moveToPreviousQuestion(Long sessionId, Long studentId) {
        QuizSession session = loadOwnedSession(sessionId, studentId);
        ensureActive(session);

        int current = session.getCurrentQuestionIndex();
        if (current <= 0) {
            throw new BadRequestException("Already at the first question");
        }

        session.setCurrentQuestionIndex(current - 1);
        QuizSession saved = quizSessionRepository.save(session);
        return toResponse(saved);
    }

    @Transactional
    public QuizSessionResponseDto jumpToQuestion(Long sessionId, Long studentId, Integer questionIndex) {
        if (questionIndex == null) {
            throw new BadRequestException("questionIndex is required");
        }
        QuizSession session = loadOwnedSession(sessionId, studentId);
        ensureActive(session);

        List<Question> questions = sortedQuestions(session.getQuiz());
        int zeroIndex = questionIndex - 1;
        if (zeroIndex < 0 || zeroIndex >= questions.size()) {
            throw new BadRequestException("Question index is out of range");
        }

        session.setCurrentQuestionIndex(zeroIndex);
        QuizSession saved = quizSessionRepository.save(session);
        return toResponse(saved);
    }

    @Transactional
    public QuizResultResponseDto submitSession(Long sessionId, Long studentId) {
        QuizSession session = loadOwnedSession(sessionId, studentId);
        ensureActive(session);

        List<Question> questions = sortedQuestions(session.getQuiz());
        List<StudentAnswer> answers = studentAnswerRepository.findBySession_Id(session.getId());
        Map<Long, StudentAnswer> answerByQuestion = answers.stream()
                .collect(Collectors.toMap(a -> a.getQuestion().getId(), Function.identity(), (a, b) -> b));

        if (answerByQuestion.size() < questions.size()) {
            throw new BadRequestException("Please answer all questions before submitting");
        }

        int threshold = Math.max(0, Math.min(100, passThresholdPercentage));
        QuizScoringService.ScoreResult scoreResult = quizScoringService.score(questions, answerByQuestion, threshold);

        session.setScore(scoreResult.correctAnswersCount());
        session.setStatus(QuizSessionStatus.COMPLETED);
        session.setCompletedAt(LocalDateTime.now());
        session.setCurrentQuestionIndex(questions.size() - 1);

        QuizSession savedSession = quizSessionRepository.save(session);

        QuizResult quizResult = quizResultRepository.findBySession_Id(savedSession.getId()).orElseGet(QuizResult::new);
        quizResult.setSession(savedSession);
        quizResult.setStudent(savedSession.getStudent());
        quizResult.setQuiz(savedSession.getQuiz());
        quizResult.setCorrectAnswersCount(scoreResult.correctAnswersCount());
        quizResult.setTotalQuestions(scoreResult.totalQuestions());
        quizResult.setScorePercentage(scoreResult.scorePercentage());
        quizResult.setStatus(scoreResult.status());
        quizResult.setEvaluatedAt(LocalDateTime.now());

        QuizResult savedResult = quizResultRepository.save(quizResult);
        return toResultResponse(savedResult);
    }

    @Transactional(readOnly = true)
    public QuizReviewResponseDto getReview(Long sessionId, Long studentId) {
        QuizSession session = loadOwnedSession(sessionId, studentId);
        if (session.getStatus() != QuizSessionStatus.COMPLETED) {
            throw new BadRequestException("Quiz session is not completed");
        }

        List<Question> questions = sortedQuestions(session.getQuiz());
        Map<Long, StudentAnswer> answerByQuestion = studentAnswerRepository.findBySession_Id(session.getId()).stream()
                .collect(Collectors.toMap(a -> a.getQuestion().getId(), Function.identity(), (a, b) -> b));

        List<QuizReviewQuestionDto> reviewQuestions = new java.util.ArrayList<>();
        for (int i = 0; i < questions.size(); i++) {
            Question question = questions.get(i);
            StudentAnswer answer = answerByQuestion.get(question.getId());

            QuizReviewQuestionDto dto = new QuizReviewQuestionDto();
            dto.setId(question.getId());
            dto.setText(question.getText());
            dto.setQuestionIndex(i + 1);
            if (answer != null && answer.getSelectedOption() != null) {
                dto.setSelectedOptionId(answer.getSelectedOption().getId());
            }

            List<QuizReviewOptionDto> options = question.getAnswerOptions().stream()
                    .sorted(Comparator.comparing(AnswerOption::getId))
                    .map(option -> {
                        QuizReviewOptionDto o = new QuizReviewOptionDto();
                        o.setId(option.getId());
                        o.setText(option.getText());
                        o.setCorrect(option.isCorrect());
                        return o;
                    }).toList();
            dto.setOptions(options);
            reviewQuestions.add(dto);
        }

        QuizReviewResponseDto response = new QuizReviewResponseDto();
        response.setSessionId(session.getId());
        response.setQuizId(session.getQuiz().getId());
        response.setTotalQuestions(questions.size());
        response.setQuestions(reviewQuestions);
        return response;
    }

    @Transactional(readOnly = true)
    public QuizResultResponseDto getResult(Long sessionId, Long studentId) {
        QuizSession session = loadOwnedSession(sessionId, studentId);
        QuizResult result = quizResultRepository.findBySession_Id(session.getId())
                .orElseThrow(() -> new NotFoundException("Quiz result not found for session id: " + sessionId));
        return toResultResponse(result);
    }

    private Quiz loadQuiz(Long quizId) {
        return quizRepository.findById(quizId)
                .orElseThrow(() -> new NotFoundException("Quiz not found with id: " + quizId));
    }

    private User loadStudent(Long studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new NotFoundException("Student not found with id: " + studentId));
        if (student.getRole() != User.Role.STUDENT) {
            throw new ForbiddenException("User is not a student");
        }
        return student;
    }

    private QuizSession loadOwnedSession(Long sessionId, Long studentId) {
        if (studentId == null) {
            throw new BadRequestException("studentId is required");
        }

        QuizSession session = quizSessionRepository.findByIdAndStudent_Id(sessionId, studentId)
                .orElseThrow(() -> new NotFoundException("Quiz session not found with id: " + sessionId));

        ensureStudentCanAccessQuiz(loadStudent(studentId), session.getQuiz());
        return session;
    }

    private void ensureStudentCanAccessQuiz(User student, Quiz quiz) {
        boolean enrolled = enrollmentRepository.existsByStudentAndCourse(student, quiz.getCourse());
        if (!enrolled) {
            throw new ForbiddenException("Student is not enrolled in the linked class");
        }
        if (quiz.getStatus() != com.example.Phy6_Master.model.QuizStatus.PUBLISHED) {
            throw new ForbiddenException("Quiz is not published for students");
        }
    }

    private void ensureActive(QuizSession session) {
        if (session.getStatus() != QuizSessionStatus.ACTIVE) {
            throw new BadRequestException("Quiz session is already completed");
        }
    }

    private List<Question> sortedQuestions(Quiz quiz) {
        return quiz.getQuestions().stream()
                .sorted(Comparator.comparing(Question::getId))
                .toList();
    }

    private QuestionForPlayResponseDto toPlayQuestion(Question question) {
        QuestionForPlayResponseDto dto = new QuestionForPlayResponseDto();
        dto.setId(question.getId());
        dto.setText(question.getText());
        dto.setOptions(question.getAnswerOptions().stream()
                .sorted(Comparator.comparing(AnswerOption::getId))
                .map(option -> {
                    OptionForPlayResponseDto o = new OptionForPlayResponseDto();
                    o.setId(option.getId());
                    o.setText(option.getText());
                    return o;
                }).toList());
        return dto;
    }

    private QuizSessionResponseDto toResponse(QuizSession session) {
        QuizSessionResponseDto response = new QuizSessionResponseDto();
        response.setId(session.getId());
        response.setStudentId(session.getStudent().getId());
        response.setQuizId(session.getQuiz().getId());
        response.setStatus(session.getStatus());
        response.setCurrentQuestionIndex(session.getCurrentQuestionIndex());
        response.setTotalQuestions(session.getTotalQuestions());
        response.setScore(session.getScore());
        response.setCompletedAt(session.getCompletedAt());
        response.setHasAnswers(studentAnswerRepository.existsBySession_Id(session.getId()));
        return response;
    }

    private QuizResultResponseDto toResultResponse(QuizResult result) {
        QuizResultResponseDto response = new QuizResultResponseDto();
        response.setId(result.getId());
        response.setSessionId(result.getSession().getId());
        response.setStudentId(result.getStudent().getId());
        response.setQuizId(result.getQuiz().getId());
        response.setCorrectAnswersCount(result.getCorrectAnswersCount());
        response.setTotalQuestions(result.getTotalQuestions());
        response.setScorePercentage(result.getScorePercentage());
        response.setStatus(result.getStatus());
        response.setEvaluatedAt(result.getEvaluatedAt());
        return response;
    }
}
