package com.example.Phy6_Master.controller;

import com.example.Phy6_Master.dto.AccountantPaymentDetailResponseDTO;
import com.example.Phy6_Master.dto.PaymentPendingListResponseDTO;
import com.example.Phy6_Master.service.AccountantPaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/accountant/payments")
@RequiredArgsConstructor
public class AccountantPaymentController {

    private final AccountantPaymentService accountantPaymentService;

    @GetMapping("/pending")
    public ResponseEntity<List<PaymentPendingListResponseDTO>> getPendingPayments() {
        return ResponseEntity.ok(accountantPaymentService.getPendingPayments());
    }

    @GetMapping("/{paymentId}")
    public ResponseEntity<AccountantPaymentDetailResponseDTO> getPaymentDetail(@PathVariable Long paymentId) {
        try {
            return ResponseEntity.ok(accountantPaymentService.getPaymentDetail(paymentId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{paymentId}/approve")
    public ResponseEntity<?> approvePayment(
            @PathVariable Long paymentId,
            @RequestParam(required = false) Long accountantId) {
        try {
            accountantPaymentService.approvePayment(paymentId, accountantId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Payment approved successfully"));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", ex.getMessage()));
        }
    }

    @PostMapping("/{paymentId}/reject")
    public ResponseEntity<?> rejectPayment(
            @PathVariable Long paymentId,
            @RequestParam(required = false) Long accountantId,
            @RequestBody(required = false) Map<String, String> payload) {
        try {
            String reason = (payload != null) ? payload.get("rejectionReason") : null;
            accountantPaymentService.rejectPayment(paymentId, reason, accountantId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Payment rejected successfully"));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", ex.getMessage()));
        }
    }

    @GetMapping("/history")
    public ResponseEntity<?> getPaymentHistory(
            @RequestParam(required = false) String studentName,
            @RequestParam(required = false) String courseName,
            @RequestParam(required = false) String paymentMethod,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime startDate,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime endDate) {
        
        return ResponseEntity.ok(accountantPaymentService.getFilteredPaymentHistory(
                studentName, courseName, paymentMethod, status, startDate, endDate));
    }
}
