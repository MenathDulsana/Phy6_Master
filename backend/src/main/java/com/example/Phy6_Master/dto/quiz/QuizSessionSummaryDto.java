package com.example.Phy6_Master.dto.quiz;

import java.util.List;

public class QuizSessionSummaryDto {
    private Long sessionId;
    private Integer totalQuestions;
    private List<QuizQuestionSummaryDto> questions;

    public Long getSessionId() {
        return sessionId;
    }

    public void setSessionId(Long sessionId) {
        this.sessionId = sessionId;
    }

    public Integer getTotalQuestions() {
        return totalQuestions;
    }

    public void setTotalQuestions(Integer totalQuestions) {
        this.totalQuestions = totalQuestions;
    }

    public List<QuizQuestionSummaryDto> getQuestions() {
        return questions;
    }

    public void setQuestions(List<QuizQuestionSummaryDto> questions) {
        this.questions = questions;
    }
}
