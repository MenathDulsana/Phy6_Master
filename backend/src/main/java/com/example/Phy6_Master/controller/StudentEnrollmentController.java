package com.example.Phy6_Master.controller;

import com.example.Phy6_Master.dto.ClassAccessResponseDTO;
import com.example.Phy6_Master.dto.EnrollmentStatusItemDTO;
import com.example.Phy6_Master.dto.PendingEnrollmentResponseDTO;
import com.example.Phy6_Master.model.User;
import com.example.Phy6_Master.repository.UserRepository;
import com.example.Phy6_Master.service.StudentEnrollmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/student/enrollments")
@RequiredArgsConstructor
public class StudentEnrollmentController {

    private final StudentEnrollmentService studentEnrollmentService;
    private final UserRepository userRepository;

    @GetMapping("/pending/{userId}")
    public ResponseEntity<List<PendingEnrollmentResponseDTO>> getPendingEnrollments(@PathVariable Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(studentEnrollmentService.getPendingEnrollments(user));
    }

    @GetMapping("/status/{userId}")
    public ResponseEntity<List<EnrollmentStatusItemDTO>> getAllEnrollmentStatuses(@PathVariable Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(studentEnrollmentService.getAllEnrollmentStatuses(user));
    }

    @GetMapping("/access/{userId}/{courseId}")
    public ResponseEntity<ClassAccessResponseDTO> checkAccess(@PathVariable Long userId, @PathVariable Long courseId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.ok(new ClassAccessResponseDTO(false, "NOT_FOUND", "User not found"));
        }
        return ResponseEntity.ok(studentEnrollmentService.checkAccess(user, courseId));
    }
}
