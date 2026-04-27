package com.example.Phy6_Master.dto.quiz;

public class SessionJumpRequestDto {
    private Long studentId;
    private Integer questionIndex;

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public Integer getQuestionIndex() {
        return questionIndex;
    }

    public void setQuestionIndex(Integer questionIndex) {
        this.questionIndex = questionIndex;
    }
}
