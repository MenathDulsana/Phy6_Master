package com.example.Phy6_Master.controller;

import com.example.Phy6_Master.dto.StudentProfileUpdateRequest;
import com.example.Phy6_Master.dto.StudentResponse;
import com.example.Phy6_Master.dto.quiz.QuizAttemptDto;
import com.example.Phy6_Master.dto.quiz.QuizResultSummaryDto;
import com.example.Phy6_Master.dto.quiz.StudentDashboardResponseDto;
import com.example.Phy6_Master.model.Course;
import com.example.Phy6_Master.model.Student;
import com.example.Phy6_Master.repository.StudentRepository;
import com.example.Phy6_Master.service.StudentDashboardService;
import com.example.Phy6_Master.service.StudentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/students")
public class StudentController {

    @Autowired
    private StudentService studentService;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private StudentDashboardService studentDashboardService;

    @GetMapping("/{userId}/courses")
    public ResponseEntity<List<Course>> getEnrolledCourses(@PathVariable Long userId) {
        List<Course> courses = studentService.getEnrolledCourses(userId);
        return ResponseEntity.ok(courses);
    }

    @GetMapping("/all")
    public ResponseEntity<List<Student>> getAllStudents() {
        List<Student> students = studentRepository.findAll();
        return ResponseEntity.ok(students);
    }

    // Look up Student entity by User ID (needed because auth stores userId, not
    // studentId)
    @GetMapping("/by-user/{userId}")
    public ResponseEntity<Student> getStudentByUserId(@PathVariable Long userId) {
        return studentRepository.findByUser_Id(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Convenience: get enrolled courses by User ID
    @GetMapping("/by-user/{userId}/courses")
    public ResponseEntity<List<Course>> getEnrolledCoursesByUserId(@PathVariable Long userId) {
        List<Course> courses = studentService.getEnrolledCourses(userId);
        return ResponseEntity.ok(courses);
    }

    @PutMapping("/by-user/{userId}")
    public ResponseEntity<?> updateStudentProfileByUserId(@PathVariable Long userId,
                                                         @RequestBody StudentProfileUpdateRequest request) {
        try {
            StudentResponse response = studentService.updateStudentProfileByUserId(userId, request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", exception.getMessage()));
        }
    }

    @GetMapping("/{userId}/quiz-results/latest")
    public ResponseEntity<List<QuizResultSummaryDto>> getLatestQuizResults(@PathVariable Long userId) {
        return ResponseEntity.ok(studentDashboardService.getLatestResultsByQuiz(userId));
    }

    @GetMapping("/{userId}/dashboard")
    public ResponseEntity<StudentDashboardResponseDto> getStudentDashboard(@PathVariable Long userId) {
        return ResponseEntity.ok(studentDashboardService.getDashboard(userId));
    }

    @GetMapping("/{userId}/quiz-results/{quizId}")
    public ResponseEntity<List<QuizAttemptDto>> getQuizAttempts(@PathVariable Long userId, @PathVariable Long quizId) {
        return ResponseEntity.ok(studentDashboardService.getQuizAttempts(userId, quizId));
    }
}
