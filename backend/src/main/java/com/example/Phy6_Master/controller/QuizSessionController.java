package com.example.Phy6_Master.controller;

import com.example.Phy6_Master.dto.quiz.AnswerCurrentQuestionRequestDto;
import com.example.Phy6_Master.dto.quiz.CurrentQuestionResponseDto;
import com.example.Phy6_Master.dto.quiz.QuizResultResponseDto;
import com.example.Phy6_Master.dto.quiz.QuizReviewResponseDto;
import com.example.Phy6_Master.dto.quiz.QuizSessionResponseDto;
import com.example.Phy6_Master.dto.quiz.QuizSessionSummaryDto;
import com.example.Phy6_Master.dto.quiz.SessionActionRequestDto;
import com.example.Phy6_Master.dto.quiz.SessionJumpRequestDto;
import com.example.Phy6_Master.dto.quiz.StartQuizSessionRequestDto;
import com.example.Phy6_Master.service.QuizSessionService;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/quiz-sessions")
public class QuizSessionController {

    @Autowired
    private QuizSessionService quizSessionService;

    @Operation(summary = "Start a quiz session")
    @PostMapping
    public ResponseEntity<QuizSessionResponseDto> startSession(@RequestBody StartQuizSessionRequestDto request) {
        return ResponseEntity.ok(quizSessionService.startSession(request));
    }

    @Operation(summary = "Get a quiz session by id")
    @GetMapping("/{id}")
    public ResponseEntity<QuizSessionResponseDto> getSession(@PathVariable Long id, @RequestParam Long studentId) {
        return ResponseEntity.ok(quizSessionService.getSession(id, studentId));
    }

    @Operation(summary = "Get active session for student and quiz")
    @GetMapping("/active")
    public ResponseEntity<QuizSessionResponseDto> getActiveSession(@RequestParam Long studentId, @RequestParam Long quizId) {
        return ResponseEntity.ok(quizSessionService.getActiveSession(studentId, quizId));
    }

    @Operation(summary = "Get current question")
    @GetMapping("/{id}/current-question")
    public ResponseEntity<CurrentQuestionResponseDto> getCurrentQuestion(@PathVariable Long id, @RequestParam Long studentId) {
        return ResponseEntity.ok(quizSessionService.getCurrentQuestion(id, studentId));
    }

    @Operation(summary = "Get answer summary for session")
    @GetMapping("/{id}/summary")
    public ResponseEntity<QuizSessionSummaryDto> getSessionSummary(@PathVariable Long id, @RequestParam Long studentId) {
        return ResponseEntity.ok(quizSessionService.getSessionSummary(id, studentId));
    }

    @Operation(summary = "Submit answer for current question")
    @PostMapping("/{id}/answer")
    public ResponseEntity<QuizSessionResponseDto> answerCurrentQuestion(
            @PathVariable Long id,
            @RequestBody AnswerCurrentQuestionRequestDto request
    ) {
        return ResponseEntity.ok(quizSessionService.submitAnswer(id, request));
    }

    @Operation(summary = "Move to next question")
    @PostMapping("/{id}/next")
    public ResponseEntity<QuizSessionResponseDto> nextQuestion(
            @PathVariable Long id,
            @RequestBody SessionActionRequestDto request
    ) {
        return ResponseEntity.ok(quizSessionService.moveToNextQuestion(id, request.getStudentId()));
    }

    @Operation(summary = "Move to previous question")
    @PostMapping("/{id}/previous")
    public ResponseEntity<QuizSessionResponseDto> previousQuestion(
            @PathVariable Long id,
            @RequestBody SessionActionRequestDto request
    ) {
        return ResponseEntity.ok(quizSessionService.moveToPreviousQuestion(id, request.getStudentId()));
    }

    @Operation(summary = "Jump to a specific question")
    @PostMapping("/{id}/jump")
    public ResponseEntity<QuizSessionResponseDto> jumpToQuestion(
            @PathVariable Long id,
            @RequestBody SessionJumpRequestDto request
    ) {
        return ResponseEntity.ok(quizSessionService.jumpToQuestion(id, request.getStudentId(), request.getQuestionIndex()));
    }

    @Operation(summary = "Submit quiz session")
    @PostMapping("/{id}/submit")
    public ResponseEntity<QuizResultResponseDto> submitSession(
            @PathVariable Long id,
            @RequestBody SessionActionRequestDto request
    ) {
        return ResponseEntity.ok(quizSessionService.submitSession(id, request.getStudentId()));
    }

    @Operation(summary = "Get quiz result for a completed session")
    @GetMapping("/{id}/result")
    public ResponseEntity<QuizResultResponseDto> getSessionResult(
            @PathVariable Long id,
            @RequestParam Long studentId
    ) {
        return ResponseEntity.ok(quizSessionService.getResult(id, studentId));
    }

    @Operation(summary = "Review quiz answers for a completed session")
    @GetMapping("/{id}/review")
    public ResponseEntity<QuizReviewResponseDto> getSessionReview(
            @PathVariable Long id,
            @RequestParam Long studentId
    ) {
        return ResponseEntity.ok(quizSessionService.getReview(id, studentId));
    }
}
