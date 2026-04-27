package com.example.Phy6_Master.controller;

import com.example.Phy6_Master.model.Course;
import com.example.Phy6_Master.repository.EnrollmentRepository;
import com.example.Phy6_Master.service.CourseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/courses")
public class CourseController {

    @Autowired
    private CourseService courseService;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @PostMapping
    public Course createCourse(@RequestBody Map<String, Object> request) {
        Long teacherId = request.get("teacherId") != null ?
            Long.valueOf(request.get("teacherId").toString()) : null;
        String title = (String) request.get("title");
        String description = (String) request.get("description");
        String batch = (String) request.get("batch");
        String subject = (String) request.get("subject");
        String type = (String) request.get("type");
        String imageUrl = (String) request.get("imageUrl");

        return courseService.createCourse(teacherId, title, description, batch, subject, type, imageUrl);
    }

    @GetMapping
    public List<Course> getAllCourses() {
        return courseService.getAllCourses();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Course> getCourseById(@PathVariable Long id) {
        return courseService.getCourseById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Course> updateCourse(@PathVariable Long id, @RequestBody Course courseDetails) {
        try {
            Course updatedCourse = courseService.updateCourse(id, courseDetails);
            return ResponseEntity.ok(updatedCourse);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCourse(@PathVariable Long id) {
        try {
            courseService.deleteCourse(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{id}/enrollment-count")
    public ResponseEntity<Long> getEnrollmentCount(@PathVariable Long id) {
        return courseService.getCourseById(id)
                .map(course -> ResponseEntity.ok((long) enrollmentRepository.findByCourse(course).size()))
                .orElse(ResponseEntity.notFound().build());
    }
}
