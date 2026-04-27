package com.example.Phy6_Master.dto.quiz;

import java.util.List;

public class QuestionResponseDto {
    private Long id;
    private String text;
    private List<AnswerOptionResponseDto> options;

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

    public List<AnswerOptionResponseDto> getOptions() {
        return options;
    }

    public void setOptions(List<AnswerOptionResponseDto> options) {
        this.options = options;
    }
}
