package com.example.Phy6_Master.controller;

import com.example.Phy6_Master.dto.CreateTutorRequestDTO;
import com.example.Phy6_Master.dto.TutorRequestDTO;
import com.example.Phy6_Master.service.TutorManagementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/student/tutor-requests")
@RequiredArgsConstructor
@Slf4j
public class StudentTutorRequestController {

    private final TutorManagementService tutorManagementService;

    @GetMapping
    public ResponseEntity<?> getStudentTutorRequests(
            @RequestParam Long studentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
            Page<TutorRequestDTO> requests = tutorManagementService.getStudentRequests(studentId, pageable);
            return ResponseEntity.ok(requests);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            log.error("Error fetching student tutor requests", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error fetching tutor requests"));
        }
    }

    @PostMapping
    public ResponseEntity<?> createTutorRequest(
            @RequestParam Long studentId,
            @Valid @RequestBody CreateTutorRequestDTO dto) {
        try {
            TutorRequestDTO created = tutorManagementService.createTutorRequest(studentId, dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            log.error("Error creating tutor request", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error creating tutor request"));
        }
    }

    @GetMapping("/{requestId}")
    public ResponseEntity<?> getStudentTutorRequestById(
            @PathVariable Long requestId,
            @RequestParam Long studentId) {
        try {
            TutorRequestDTO request = tutorManagementService.getStudentRequestById(studentId, requestId);
            return ResponseEntity.ok(request);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            log.error("Error fetching tutor request details", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error fetching tutor request"));
        }
    }

    @PostMapping("/{requestId}/cancel")
    public ResponseEntity<?> cancelStudentTutorRequest(
            @PathVariable Long requestId,
            @RequestParam Long studentId,
            @RequestParam(required = false, defaultValue = "") String reason) {
        try {
            TutorRequestDTO cancelled = tutorManagementService.cancelStudentRequest(studentId, requestId, reason);
            return ResponseEntity.ok(cancelled);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            log.error("Error cancelling tutor request", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error cancelling tutor request"));
        }
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException ex) {
        String msg = ex.getBindingResult().getFieldErrors().stream()
                .map(err -> err.getField() + ": " + err.getDefaultMessage())
                .collect(Collectors.joining("; "));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message", msg.isEmpty() ? "Invalid request" : msg));
    }
}
