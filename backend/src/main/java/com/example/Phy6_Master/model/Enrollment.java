package com.example.Phy6_Master.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "enrollments")
public class Enrollment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    private LocalDateTime enrollmentDate;

    private LocalDateTime submittedDate;

    // Status: PENDING (payment submitted, awaiting approval)
    //         PAYMENT_SUBMITTED (payment being verified)
    //         ACTIVE (approved, student can access)
    //         REJECTED (payment rejected)
    private String status = "PENDING";

    @OneToMany(mappedBy = "enrollment", cascade = CascadeType.ALL, orphanRemoval = true)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private java.util.List<Payment> payments;

    @PrePersist
    protected void onCreate() {
        enrollmentDate = LocalDateTime.now();
        submittedDate = LocalDateTime.now();
    }

    public Course getCourse() {
        return course;
    }
}
