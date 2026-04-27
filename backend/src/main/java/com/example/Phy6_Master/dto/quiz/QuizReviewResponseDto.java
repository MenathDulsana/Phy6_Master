package com.example.Phy6_Master.dto.quiz;

import java.util.List;

public class QuizReviewResponseDto {
    private Long sessionId;
    private Long quizId;
    private Integer totalQuestions;
    private List<QuizReviewQuestionDto> questions;

    public Long getSessionId() {
        return sessionId;
    }

    public void setSessionId(Long sessionId) {
        this.sessionId = sessionId;
    }

    public Long getQuizId() {
        return quizId;
    }

    public void setQuizId(Long quizId) {
        this.quizId = quizId;
    }

    public Integer getTotalQuestions() {
        return totalQuestions;
    }

    public void setTotalQuestions(Integer totalQuestions) {
        this.totalQuestions = totalQuestions;
    }

    public List<QuizReviewQuestionDto> getQuestions() {
        return questions;
    }

    public void setQuestions(List<QuizReviewQuestionDto> questions) {
        this.questions = questions;
    }
}
