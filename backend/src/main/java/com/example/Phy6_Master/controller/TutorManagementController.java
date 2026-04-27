package com.example.Phy6_Master.controller;

import com.example.Phy6_Master.dto.*;
import com.example.Phy6_Master.service.TutorManagementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * TutorManagementController
 * 
 * RESTful API endpoints for Tutor Management System
 * Follows REST principles and clean code practices:
 * - Clear endpoint naming conventions
 * - Appropriate HTTP status codes
 * - Comprehensive exception handling
 * - Request/Response validation
 */
@RestController
@RequestMapping("/api/tutor-management")
@RequiredArgsConstructor
@Slf4j
public class TutorManagementController {

    private final TutorManagementService tutorManagementService;

    // ===================== DASHBOARD ENDPOINTS =====================

    /**
     * Get dashboard statistics
     * GET /api/tutor-management/dashboard/stats
     */
    @GetMapping("/dashboard/stats")
    public ResponseEntity<TutorDashboardStatsDTO> getDashboardStats() {
        try {
            log.info("Fetching dashboard statistics");
            TutorDashboardStatsDTO stats = tutorManagementService.getDashboardStats();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Error fetching dashboard stats", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get recent tutoring requests
     * GET /api/tutor-management/dashboard/recent-requests?limit=10
     */
    @GetMapping("/dashboard/recent-requests")
    public ResponseEntity<List<RecentTutorRequestDTO>> getRecentRequests(
            @RequestParam(defaultValue = "10") int limit) {
        try {
            log.info("Fetching recent requests with limit: {}", limit);
            List<RecentTutorRequestDTO> recentRequests = tutorManagementService.getRecentRequests(limit);
            return ResponseEntity.ok(recentRequests);
        } catch (Exception e) {
            log.error("Error fetching recent requests", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ===================== INCOMING REQUESTS ENDPOINTS =====================

    /**
     * Get all incoming (pending) tutoring requests with pagination
     * GET /api/tutor-management/requests/incoming?page=0&size=10
     */
    @GetMapping("/requests/incoming")
    public ResponseEntity<Page<TutorRequestDTO>> getIncomingRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            log.info("Fetching incoming requests - page: {}, size: {}", page, size);
            Pageable pageable = PageRequest.of(page, size);
            Page<TutorRequestDTO> requests = tutorManagementService.getIncomingRequests(pageable);
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            log.error("Error fetching incoming requests", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Accept a tutoring request (assign tutor)
     * POST /api/tutor-management/requests/{requestId}/accept
     */
    @PostMapping("/requests/{requestId}/accept")
    public ResponseEntity<?> acceptRequest(
            @PathVariable Long requestId,
            @RequestParam Long tutorId) {
        try {
            log.info("Accepting request {} for tutor {}", requestId, tutorId);
            TutorRequestDTO updatedRequest = tutorManagementService.acceptRequest(requestId, tutorId);
            return ResponseEntity.ok(updatedRequest);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid request or tutor ID: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        } catch (IllegalStateException e) {
            log.warn("Invalid state transition: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            log.error("Error accepting request", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error accepting request"));
        }
    }

    /**
     * Reject a tutoring request
     * POST /api/tutor-management/requests/{requestId}/reject
     */
    @PostMapping("/requests/{requestId}/reject")
    public ResponseEntity<?> rejectRequest(
            @PathVariable Long requestId,
            @RequestParam(required = false, defaultValue = "") String reason) {
        try {
            log.info("Rejecting request {}", requestId);
            TutorRequestDTO updatedRequest = tutorManagementService.rejectRequest(requestId, reason);
            return ResponseEntity.ok(updatedRequest);
        } catch (IllegalArgumentException e) {
            log.warn("Request not found: {}", requestId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", e.getMessage()));
        } catch (IllegalStateException e) {
            log.warn("Invalid state transition: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            log.error("Error rejecting request", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error rejecting request"));
        }
    }

    // ===================== ACTIVE REQUESTS ENDPOINTS =====================

    /**
     * Get active requests for a tutor
     * GET /api/tutor-management/requests/active?tutorId=1&page=0&size=10
     */
    @GetMapping("/requests/active")
    public ResponseEntity<Page<TutorRequestDTO>> getActiveRequests(
            @RequestParam(required = false) Long tutorId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            log.info("Fetching active requests - tutorId: {}, page: {}, size: {}", tutorId, page, size);
            Pageable pageable = PageRequest.of(page, size);
            Page<TutorRequestDTO> requests = tutorId == null
                    ? tutorManagementService.getActiveRequests(pageable)
                    : tutorManagementService.getActiveRequests(tutorId, pageable);
            return ResponseEntity.ok(requests);
        } catch (IllegalArgumentException e) {
            log.warn("Tutor not found: {}", tutorId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(null);
        } catch (Exception e) {
            log.error("Error fetching active requests", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Mark request as in progress
     * POST /api/tutor-management/requests/{requestId}/start
     */
    @PostMapping("/requests/{requestId}/start")
    public ResponseEntity<?> markAsInProgress(@PathVariable Long requestId) {
        try {
            log.info("Marking request {} as in progress", requestId);
            TutorRequestDTO updatedRequest = tutorManagementService.markAsInProgress(requestId);
            return ResponseEntity.ok(updatedRequest);
        } catch (IllegalArgumentException e) {
            log.warn("Request not found: {}", requestId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", e.getMessage()));
        } catch (IllegalStateException e) {
            log.warn("Invalid state transition: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            log.error("Error updating request status", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error updating request"));
        }
    }

    /**
     * Complete a tutoring request
     * POST /api/tutor-management/requests/{requestId}/complete
     */
    @PostMapping("/requests/{requestId}/complete")
    public ResponseEntity<?> completeRequest(
            @PathVariable Long requestId,
            @RequestParam Double sessionDuration,
            @RequestParam(required = false, defaultValue = "") String tutorNotes) {
        try {
            log.info("Completing request {} with duration: {} hours", requestId, sessionDuration);
            TutorRequestDTO completedRequest = tutorManagementService.completeRequest(
                    requestId, sessionDuration, tutorNotes);
            return ResponseEntity.ok(completedRequest);
        } catch (IllegalArgumentException e) {
            log.warn("Request not found: {}", requestId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", e.getMessage()));
        } catch (IllegalStateException e) {
            log.warn("Invalid state transition: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            log.error("Error completing request", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error completing request"));
        }
    }

    /**
     * Mark a request as delivered with a single action
     * POST /api/tutor-management/requests/{requestId}/deliver
     */
    @PostMapping("/requests/{requestId}/deliver")
    public ResponseEntity<?> markAsDelivered(@PathVariable Long requestId) {
        try {
            log.info("Marking request {} as delivered", requestId);
            TutorRequestDTO deliveredRequest = tutorManagementService.markAsDelivered(requestId);
            return ResponseEntity.ok(deliveredRequest);
        } catch (IllegalArgumentException e) {
            log.warn("Request not found: {}", requestId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", e.getMessage()));
        } catch (IllegalStateException e) {
            log.warn("Invalid state transition: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            log.error("Error marking request as delivered", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error marking request as delivered"));
        }
    }

    // ===================== DELIVERY RECORDS ENDPOINTS =====================

    /**
     * Get delivery records (completed requests)
     * GET /api/tutor-management/records/delivery?page=0&size=10
     */
    @GetMapping("/records/delivery")
    public ResponseEntity<Page<TutorRequestDTO>> getDeliveryRecords(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            log.info("Fetching delivery records - page: {}, size: {}", page, size);
            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "completedDate"));
            Page<TutorRequestDTO> records = tutorManagementService.getDeliveryRecords(pageable);
            return ResponseEntity.ok(records);
        } catch (Exception e) {
            log.error("Error fetching delivery records", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get declined requests (rejected requests)
     * GET /api/tutor-management/records/declined?page=0&size=10
     */
    @GetMapping("/records/declined")
    public ResponseEntity<Page<TutorRequestDTO>> getDeclinedRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            log.info("Fetching declined requests - page: {}, size: {}", page, size);
            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt"));
            Page<TutorRequestDTO> records = tutorManagementService.getDeclinedRequests(pageable);
            return ResponseEntity.ok(records);
        } catch (Exception e) {
            log.error("Error fetching declined requests", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get request details by ID
     * GET /api/tutor-management/requests/{requestId}
     */
    @GetMapping("/requests/{requestId}")
    public ResponseEntity<?> getRequestById(@PathVariable Long requestId) {
        try {
            log.info("Fetching request details for ID: {}", requestId);
            TutorRequestDTO request = tutorManagementService.getRequestById(requestId);
            return ResponseEntity.ok(request);
        } catch (IllegalArgumentException e) {
            log.warn("Request not found: {}", requestId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            log.error("Error fetching request details", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error fetching request"));
        }
    }

    /**
     * Cancel a tutoring request
     * POST /api/tutor-management/requests/{requestId}/cancel
     */
    @PostMapping("/requests/{requestId}/cancel")
    public ResponseEntity<?> cancelRequest(
            @PathVariable Long requestId,
            @RequestParam(required = false, defaultValue = "") String reason) {
        try {
            log.info("Cancelling request {}", requestId);
            TutorRequestDTO cancelledRequest = tutorManagementService.cancelRequest(requestId, reason);
            return ResponseEntity.ok(cancelledRequest);
        } catch (IllegalArgumentException e) {
            log.warn("Request not found: {}", requestId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", e.getMessage()));
        } catch (IllegalStateException e) {
            log.warn("Cannot cancel request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            log.error("Error cancelling request", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error cancelling request"));
        }
    }

    // ===================== ANALYTICS ENDPOINTS =====================

    /**
     * Get tutor performance metrics
     * GET /api/tutor-management/tutor/{tutorId}/performance
     */
    @GetMapping("/tutor/{tutorId}/performance")
    public ResponseEntity<?> getTutorPerformance(@PathVariable Long tutorId) {
        try {
            log.info("Fetching performance metrics for tutor: {}", tutorId);
            TutorPerformanceDTO performance = tutorManagementService.getTutorPerformance(tutorId);
            return ResponseEntity.ok(performance);
        } catch (IllegalArgumentException e) {
            log.warn("Tutor not found: {}", tutorId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            log.error("Error fetching tutor performance", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error fetching performance metrics"));
        }
    }
}
