package com.example.Phy6_Master.controller;

import com.example.Phy6_Master.model.Course;
import com.example.Phy6_Master.model.Enrollment;
import com.example.Phy6_Master.model.User;
import com.example.Phy6_Master.repository.CourseRepository;
import com.example.Phy6_Master.repository.EnrollmentRepository;
import com.example.Phy6_Master.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@RestController
@RequestMapping("/api/enrollments")
public class EnrollmentController {

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CourseRepository courseRepository;

    /** Enroll a student (User) into a course. */
    @PostMapping
    public ResponseEntity<?> enroll(@RequestParam Long userId, @RequestParam Long courseId) {
        User user = userRepository.findById(userId).orElse(null);
        Course course = courseRepository.findById(courseId).orElse(null);
        if (user == null || course == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid user or course"));
        }
        if (enrollmentRepository.existsByStudentAndCourse(user, course)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Already enrolled"));
        }
        Enrollment enrollment = new Enrollment();
        enrollment.setStudent(user);
        enrollment.setCourse(course);
        enrollmentRepository.save(enrollment);
        return ResponseEntity.ok(Map.of("message", "Enrolled successfully"));
    }

    /** Check if a student is enrolled in a course. */
    @GetMapping("/check")
    public ResponseEntity<Boolean> isEnrolled(@RequestParam Long userId, @RequestParam Long courseId) {
        User user = userRepository.findById(userId).orElse(null);
        Course course = courseRepository.findById(courseId).orElse(null);
        if (user == null || course == null) {
            return ResponseEntity.ok(false);
        }
        return ResponseEntity.ok(enrollmentRepository.existsByStudentAndCourse(user, course));
    }

    /** Unenroll a student from a course. */
    @DeleteMapping
    @Transactional
    public ResponseEntity<?> unenroll(@RequestParam Long userId, @RequestParam Long courseId) {
        User user = userRepository.findById(userId).orElse(null);
        Course course = courseRepository.findById(courseId).orElse(null);
        if (user == null || course == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid user or course"));
        }
        enrollmentRepository.findByStudentAndCourse(user, course).ifPresent(enrollmentRepository::delete);
        return ResponseEntity.ok(Map.of("message", "Unenrolled successfully"));
    }
}
