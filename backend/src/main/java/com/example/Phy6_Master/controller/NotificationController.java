package com.example.Phy6_Master.controller;

import com.example.Phy6_Master.dto.NotificationResponse;
import com.example.Phy6_Master.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/student/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/{studentId}")
    public ResponseEntity<List<NotificationResponse>> getStudentNotifications(@PathVariable Long studentId) {
        // In a real app, studentId should come from JWT/Auth context.
        // Using path variable to match the existing frontend patterns.
        return ResponseEntity.ok(notificationService.getStudentNotifications(studentId));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id, @RequestParam Long studentId) {
        try {
            notificationService.markAsRead(id, studentId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Notification marked as read"));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", ex.getMessage()));
        }
    }
}
