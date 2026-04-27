package com.example.Phy6_Master.dto.quiz;

public class CurrentQuestionResponseDto {
    private Long sessionId;
    private Integer questionIndex;
    private Integer totalQuestions;
    private boolean isLastQuestion;
    private QuestionForPlayResponseDto question;
    private Long selectedOptionId;

    public Long getSessionId() {
        return sessionId;
    }

    public void setSessionId(Long sessionId) {
        this.sessionId = sessionId;
    }

    public Integer getQuestionIndex() {
        return questionIndex;
    }

    public void setQuestionIndex(Integer questionIndex) {
        this.questionIndex = questionIndex;
    }

    public Integer getTotalQuestions() {
        return totalQuestions;
    }

    public void setTotalQuestions(Integer totalQuestions) {
        this.totalQuestions = totalQuestions;
    }

    public boolean isLastQuestion() {
        return isLastQuestion;
    }

    public void setLastQuestion(boolean lastQuestion) {
        isLastQuestion = lastQuestion;
    }

    public QuestionForPlayResponseDto getQuestion() {
        return question;
    }

    public void setQuestion(QuestionForPlayResponseDto question) {
        this.question = question;
    }

    public Long getSelectedOptionId() {
        return selectedOptionId;
    }

    public void setSelectedOptionId(Long selectedOptionId) {
        this.selectedOptionId = selectedOptionId;
    }
}
