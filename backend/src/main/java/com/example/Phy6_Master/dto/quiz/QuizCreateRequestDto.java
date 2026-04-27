package com.example.Phy6_Master.dto.quiz;

import com.example.Phy6_Master.model.QuizStatus;

import java.util.List;

public class QuizCreateRequestDto {
    private Long teacherId;
    private String title;
    private Long courseId;
    private Long lessonId;
    private QuizStatus status;
    private List<QuestionRequestDto> questions;

    public Long getTeacherId() {
        return teacherId;
    }

    public void setTeacherId(Long teacherId) {
        this.teacherId = teacherId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public Long getCourseId() {
        return courseId;
    }

    public void setCourseId(Long courseId) {
        this.courseId = courseId;
    }

    public Long getLessonId() {
        return lessonId;
    }

    public void setLessonId(Long lessonId) {
        this.lessonId = lessonId;
    }

    public QuizStatus getStatus() {
        return status;
    }

    public void setStatus(QuizStatus status) {
        this.status = status;
    }

    public List<QuestionRequestDto> getQuestions() {
        return questions;
    }

    public void setQuestions(List<QuestionRequestDto> questions) {
        this.questions = questions;
    }
}
