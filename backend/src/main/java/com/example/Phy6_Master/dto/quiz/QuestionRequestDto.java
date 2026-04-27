package com.example.Phy6_Master.dto.quiz;

import java.util.List;

public class QuestionRequestDto {
    private String text;
    private List<AnswerOptionRequestDto> options;

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public List<AnswerOptionRequestDto> getOptions() {
        return options;
    }

    public void setOptions(List<AnswerOptionRequestDto> options) {
        this.options = options;
    }
}
