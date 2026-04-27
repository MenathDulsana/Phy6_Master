package com.example.Phy6_Master.controller;

import com.example.Phy6_Master.dto.quiz.QuestionRequestDto;
import com.example.Phy6_Master.dto.quiz.QuestionResponseDto;
import com.example.Phy6_Master.dto.quiz.QuestionUpdateRequestDto;
import com.example.Phy6_Master.dto.quiz.QuizCreateRequestDto;
import com.example.Phy6_Master.dto.quiz.QuizResponseDto;
import com.example.Phy6_Master.dto.quiz.QuizUpdateRequestDto;
import com.example.Phy6_Master.service.QuizService;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class QuizController {

    @Autowired
    private QuizService quizService;

    @Operation(summary = "Create a new quiz with questions")
    @PostMapping("/quizzes")
    public ResponseEntity<QuizResponseDto> createQuiz(@RequestBody QuizCreateRequestDto request) {
        QuizResponseDto response = quizService.createQuiz(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "Get a quiz by id")
    @GetMapping("/quizzes/{id}")
    public ResponseEntity<QuizResponseDto> getQuizById(
            @PathVariable Long id,
            @RequestParam(required = false) Long teacherId,
            @RequestParam(required = false) Long studentId
    ) {
        return ResponseEntity.ok(quizService.getQuizById(id, teacherId, studentId));
    }

    @Operation(summary = "Update quiz, including its questions")
    @PutMapping("/quizzes/{id}")
    public ResponseEntity<QuizResponseDto> updateQuiz(@PathVariable Long id, @RequestBody QuizUpdateRequestDto request) {
        return ResponseEntity.ok(quizService.updateQuiz(id, request));
    }

    @Operation(summary = "Delete an entire quiz")
    @DeleteMapping("/quizzes/{id}")
    public ResponseEntity<Map<String, String>> deleteQuiz(@PathVariable Long id, @RequestParam Long teacherId) {
        quizService.deleteQuiz(id, teacherId);
        return ResponseEntity.ok(Map.of("message", "Quiz deleted successfully"));
    }

    @Operation(summary = "Add a question to a quiz")
    @PostMapping("/quizzes/{id}/questions")
    public ResponseEntity<QuestionResponseDto> addQuestion(
            @PathVariable Long id,
            @RequestParam Long teacherId,
            @RequestBody QuestionRequestDto request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(quizService.addQuestion(id, teacherId, request));
    }

    @Operation(summary = "Update a question")
    @PutMapping("/questions/{id}")
    public ResponseEntity<QuestionResponseDto> updateQuestion(
            @PathVariable Long id,
            @RequestBody QuestionUpdateRequestDto request
    ) {
        return ResponseEntity.ok(quizService.updateQuestion(id, request));
    }

    @Operation(summary = "Delete a question")
    @DeleteMapping("/questions/{id}")
    public ResponseEntity<Map<String, String>> deleteQuestion(@PathVariable Long id, @RequestParam Long teacherId) {
        quizService.deleteQuestion(id, teacherId);
        return ResponseEntity.ok(Map.of("message", "Question deleted successfully"));
    }

    @Operation(summary = "Get quizzes visible to an enrolled student")
    @GetMapping("/quizzes/visible")
    public ResponseEntity<Page<QuizResponseDto>> visibleQuizzes(
            @RequestParam Long studentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(quizService.getVisibleQuizzesForStudent(studentId, page, size));
    }

    @Operation(summary = "Get all quizzes created by a teacher")
    @GetMapping("/teachers/{teacherId}/quizzes")
    public ResponseEntity<List<QuizResponseDto>> quizzesForTeacher(@PathVariable Long teacherId) {
        return ResponseEntity.ok(quizService.getQuizzesForTeacher(teacherId));
    }
}
