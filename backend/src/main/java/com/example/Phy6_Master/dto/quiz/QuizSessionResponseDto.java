package com.example.Phy6_Master.dto.quiz;

import com.example.Phy6_Master.model.QuizSessionStatus;

import java.time.LocalDateTime;

public class QuizSessionResponseDto {
    private Long id;
    private Long studentId;
    private Long quizId;
    private QuizSessionStatus status;
    private Integer currentQuestionIndex;
    private Integer totalQuestions;
    private Integer score;
    private LocalDateTime completedAt;
    private boolean hasAnswers;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public Long getQuizId() {
        return quizId;
    }

    public void setQuizId(Long quizId) {
        this.quizId = quizId;
    }

    public QuizSessionStatus getStatus() {
        return status;
    }

    public void setStatus(QuizSessionStatus status) {
        this.status = status;
    }

    public Integer getCurrentQuestionIndex() {
        return currentQuestionIndex;
    }

    public void setCurrentQuestionIndex(Integer currentQuestionIndex) {
        this.currentQuestionIndex = currentQuestionIndex;
    }

    public Integer getTotalQuestions() {
        return totalQuestions;
    }

    public void setTotalQuestions(Integer totalQuestions) {
        this.totalQuestions = totalQuestions;
    }

    public Integer getScore() {
        return score;
    }

    public void setScore(Integer score) {
        this.score = score;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }

    public boolean isHasAnswers() {
        return hasAnswers;
    }

    public void setHasAnswers(boolean hasAnswers) {
        this.hasAnswers = hasAnswers;
    }
}
