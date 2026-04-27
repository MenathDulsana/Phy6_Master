package com.example.Phy6_Master.dto.quiz;

import java.util.List;

public class QuizReviewQuestionDto {
    private Long id;
    private String text;
    private Integer questionIndex;
    private Long selectedOptionId;
    private List<QuizReviewOptionDto> options;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public Integer getQuestionIndex() {
        return questionIndex;
    }

    public void setQuestionIndex(Integer questionIndex) {
        this.questionIndex = questionIndex;
    }

    public Long getSelectedOptionId() {
        return selectedOptionId;
    }

    public void setSelectedOptionId(Long selectedOptionId) {
        this.selectedOptionId = selectedOptionId;
    }

    public List<QuizReviewOptionDto> getOptions() {
        return options;
    }

    public void setOptions(List<QuizReviewOptionDto> options) {
        this.options = options;
    }
}
