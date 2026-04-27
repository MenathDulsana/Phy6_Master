package com.example.Phy6_Master.dto.quiz;

import com.example.Phy6_Master.model.QuizResultStatus;

import java.time.LocalDateTime;

public class QuizResultSummaryDto {
    private Long quizId;
    private String quizTitle;
    private Double scorePercentage;
    private Integer correctAnswers;
    private Integer totalQuestions;
    private QuizResultStatus status;
    private LocalDateTime attemptedAt;

    public Long getQuizId() {
        return quizId;
    }

    public void setQuizId(Long quizId) {
        this.quizId = quizId;
    }

    public String getQuizTitle() {
        return quizTitle;
    }

    public void setQuizTitle(String quizTitle) {
        this.quizTitle = quizTitle;
    }

    public Double getScorePercentage() {
        return scorePercentage;
    }

    public void setScorePercentage(Double scorePercentage) {
        this.scorePercentage = scorePercentage;
    }

    public Integer getCorrectAnswers() {
        return correctAnswers;
    }

    public void setCorrectAnswers(Integer correctAnswers) {
        this.correctAnswers = correctAnswers;
    }

    public Integer getTotalQuestions() {
        return totalQuestions;
    }

    public void setTotalQuestions(Integer totalQuestions) {
        this.totalQuestions = totalQuestions;
    }

    public QuizResultStatus getStatus() {
        return status;
    }

    public void setStatus(QuizResultStatus status) {
        this.status = status;
    }

    public LocalDateTime getAttemptedAt() {
        return attemptedAt;
    }

    public void setAttemptedAt(LocalDateTime attemptedAt) {
        this.attemptedAt = attemptedAt;
    }
}