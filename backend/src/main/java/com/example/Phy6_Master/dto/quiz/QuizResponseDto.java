package com.example.Phy6_Master.dto.quiz;

import com.example.Phy6_Master.model.QuizStatus;

import java.time.LocalDateTime;
import java.util.List;

public class QuizResponseDto {
    private Long id;
    private String title;
    private Long courseId;
    private Long lessonId;
    private QuizStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<QuestionResponseDto> questions;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public List<QuestionResponseDto> getQuestions() {
        return questions;
    }

    public void setQuestions(List<QuestionResponseDto> questions) {
        this.questions = questions;
    }
}
