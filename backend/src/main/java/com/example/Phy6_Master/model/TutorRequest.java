package com.example.Phy6_Master.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * TutorRequest Entity
 * Represents tutoring session requests made by students
 * Follows OOP principles: Encapsulation through getters/setters, proper state management
 */
@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "tutor_requests")
public class TutorRequest {

    public enum RequestStatus {
        PENDING,      // Request created, awaiting tutor action
        ACCEPTED,     // Tutor has accepted the request
        REJECTED,     // Tutor rejected the request
        IN_PROGRESS,  // Session is ongoing
        COMPLETED,    // Session completed
        CANCELLED     // Request cancelled by student
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne
    @JoinColumn(name = "tutor_id", nullable = true)
    private Tutor assignedTutor;

    @Column(nullable = false)
    private String courseName;

    @Column(nullable = false, length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequestStatus status;

    @Column(nullable = false)
    private LocalDateTime requestedDate;

    private LocalDateTime scheduledDate;

    private LocalDateTime completedDate;

    private String notes;

    private Double sessionDuration; // in hours

    @Column(columnDefinition = "TEXT")
    private String tutorNotes;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Version
    private Long version; // Optimistic locking for handling concurrent updates

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = RequestStatus.PENDING;
        }
        if (this.requestedDate == null) {
            this.requestedDate = LocalDateTime.now();
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
