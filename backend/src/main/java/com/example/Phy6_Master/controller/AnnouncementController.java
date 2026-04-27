package com.example.Phy6_Master.controller;

import com.example.Phy6_Master.dto.AnnouncementResponse;
import com.example.Phy6_Master.model.Announcement;
import com.example.Phy6_Master.service.AnnouncementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/announcements")
public class AnnouncementController {

    @Autowired
    private AnnouncementService announcementService;

    @PostMapping
    public ResponseEntity<?> createAnnouncement(@RequestBody Map<String, Object> request) {
        try {
            Object rawCourseId = request.get("courseId");
            Object rawTeacherId = request.get("teacherId");
            if (!(rawCourseId instanceof Number) || !(rawTeacherId instanceof Number)) {
                return ResponseEntity.badRequest().body(Map.of("message", "courseId and teacherId are required numeric fields"));
            }
            Long courseId = ((Number) rawCourseId).longValue();
            Long teacherId = ((Number) rawTeacherId).longValue();
            String title = (String) request.get("title");
            String content = (String) request.get("content");
            if (title == null || title.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("message", "title is required"));
            }

            Announcement announcement = announcementService.createAnnouncement(courseId, teacherId, title, content);
            return ResponseEntity.status(HttpStatus.CREATED).body(convertToResponse(announcement));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<AnnouncementResponse>> getAnnouncementsByCourse(@PathVariable Long courseId) {
        List<AnnouncementResponse> announcements = announcementService.getAnnouncementsByCourse(courseId)
                .stream().map(this::convertToResponse).collect(Collectors.toList());
        return ResponseEntity.ok(announcements);
    }

    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<List<AnnouncementResponse>> getAnnouncementsByTeacher(@PathVariable Long teacherId) {
        List<AnnouncementResponse> announcements = announcementService.getAnnouncementsByTeacher(teacherId)
                .stream().map(this::convertToResponse).collect(Collectors.toList());
        return ResponseEntity.ok(announcements);
    }

    @GetMapping("/student/{userId}")
    public ResponseEntity<List<AnnouncementResponse>> getAnnouncementsForStudent(@PathVariable Long userId) {
        List<AnnouncementResponse> announcements = announcementService.getAnnouncementsForStudent(userId)
                .stream().map(this::convertToResponse).collect(Collectors.toList());
        return ResponseEntity.ok(announcements);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getAnnouncementById(@PathVariable Long id) {
        try {
            Announcement announcement = announcementService.getAnnouncementById(id)
                    .orElseThrow(() -> new RuntimeException("Announcement not found with id: " + id));
            return ResponseEntity.ok(convertToResponse(announcement));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateAnnouncement(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        try {
            Object rawTeacherId = request.get("teacherId");
            if (!(rawTeacherId instanceof Number)) {
                return ResponseEntity.badRequest().body(Map.of("message", "teacherId is required"));
            }
            Long teacherId = ((Number) rawTeacherId).longValue();
            String title = (String) request.get("title");
            String content = (String) request.get("content");

            Announcement announcement = announcementService.updateAnnouncement(id, teacherId, title, content);
            return ResponseEntity.ok(convertToResponse(announcement));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAnnouncement(@PathVariable Long id, @RequestParam Long teacherId) {
        try {
            announcementService.deleteAnnouncement(id, teacherId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Converts an Announcement entity to an AnnouncementResponse DTO.
     */
    private AnnouncementResponse convertToResponse(Announcement announcement) {
        AnnouncementResponse response = new AnnouncementResponse();
        response.setId(announcement.getId());
        response.setTitle(announcement.getTitle());
        response.setContent(announcement.getContent());
        response.setCourseId(announcement.getCourse().getId());
        response.setCourseName(announcement.getCourse().getTitle());
        response.setTeacherId(announcement.getTeacher().getId());
        response.setTeacherName(announcement.getTeacher().getName());
        response.setCreatedAt(announcement.getCreatedAt());
        response.setUpdatedAt(announcement.getUpdatedAt());
        return response;
    }
}