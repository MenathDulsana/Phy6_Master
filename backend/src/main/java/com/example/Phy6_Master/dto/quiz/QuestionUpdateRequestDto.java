package com.example.Phy6_Master.dto.quiz;

public class QuestionUpdateRequestDto extends QuestionRequestDto {
    private Long teacherId;

    public Long getTeacherId() {
        return teacherId;
    }

    public void setTeacherId(Long teacherId) {
        this.teacherId = teacherId;
    }
}
