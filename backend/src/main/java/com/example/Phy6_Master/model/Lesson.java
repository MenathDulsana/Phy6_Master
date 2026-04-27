package com.example.Phy6_Master.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "lessons")
public class Lesson {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(length = 2000)
    private String content;

    // Month in "YYYY-MM" format, e.g. "2026-03"
    @Column(length = 7)
    private String month;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @OneToMany(mappedBy = "lesson", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<LearningMaterial> learningMaterials = new ArrayList<>();

    public Lesson() {}

    public Lesson(Long id, String title, String content, Course course, String month) {
        this.id = id;
        this.title = title;
        this.content = content;
        this.course = course;
        this.month = month;
    }

    // Expose courseId in JSON even though course is @JsonIgnore
    @JsonProperty("courseId")
    public Long getCourseId() {
        return course != null ? course.getId() : null;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getMonth() { return month; }
    public void setMonth(String month) { this.month = month; }
    public Course getCourse() { return course; }
    public void setCourse(Course course) { this.course = course; }
    public List<LearningMaterial> getLearningMaterials() { return learningMaterials; }
    public void setLearningMaterials(List<LearningMaterial> learningMaterials) { this.learningMaterials = learningMaterials; }
}
