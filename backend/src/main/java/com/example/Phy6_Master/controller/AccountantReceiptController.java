package com.example.Phy6_Master.controller;

import com.example.Phy6_Master.dto.ReceiptResponseDTO;
import com.example.Phy6_Master.service.ReceiptService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Path;
import java.util.Map;

@RestController
@RequestMapping("/api/accountant")
@RequiredArgsConstructor
public class AccountantReceiptController {

    private final ReceiptService receiptService;

    // Generate receipt for approved payment
    @PostMapping("/payments/{paymentId}/receipt")
    public ResponseEntity<?> generateReceipt(@PathVariable Long paymentId) {
        try {
            ReceiptResponseDTO receipt = receiptService.generateReceipt(paymentId);
            return ResponseEntity.ok(receipt);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404)
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // Get receipt metadata details
    @GetMapping("/payments/{paymentId}/receipt")
    public ResponseEntity<ReceiptResponseDTO> getReceiptInfo(@PathVariable Long paymentId) {
        try {
            ReceiptResponseDTO receipt = receiptService.getReceiptInfo(paymentId);
            return ResponseEntity.ok(receipt);
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Download the PDF stream
    @GetMapping("/receipts/{paymentId}/download")
    public ResponseEntity<Resource> downloadReceipt(@PathVariable Long paymentId) {
        try {
            Path filePath = receiptService.getReceiptFilePath(paymentId);
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() || resource.isReadable()) {
                return ResponseEntity.ok()
                        .contentType(MediaType.APPLICATION_PDF)
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
