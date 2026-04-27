package com.example.Phy6_Master.controller;

import com.example.Phy6_Master.model.Teacher;
import com.example.Phy6_Master.service.TeacherService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teachers")
public class TeacherController {

    @Autowired
    private TeacherService teacherService;

    @GetMapping("/profile/{userId}")
    public ResponseEntity<Teacher> getTeacherProfile(@PathVariable Long userId) {
        return teacherService.getTeacherByUserId(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/all")
    public List<Teacher> getAllTeachers() {
        return teacherService.getAllTeachers();
    }

    @PutMapping("/profile/{userId}")
    public ResponseEntity<Teacher> updateTeacherProfile(@PathVariable Long userId, @RequestBody Teacher teacherDetails) {
        try {
            Teacher updated = teacherService.updateTeacherProfile(userId, teacherDetails);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
