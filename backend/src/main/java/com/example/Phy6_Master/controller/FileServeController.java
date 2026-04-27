package com.example.Phy6_Master.controller;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Serves uploaded payment-proof files (bank slips, ATM receipts) stored in the
 * "uploads/" directory on the backend.
 *
 * Endpoint: GET /api/files/{filename}
 * Used by the accountant's PaymentVerificationDetail page to display proof images/PDFs.
 */
@RestController
@RequestMapping("/api/files")
public class FileServeController {

    private static final String UPLOAD_DIR = "uploads";

    @GetMapping("/{filename:.+}")
    public ResponseEntity<Resource> serveFile(@PathVariable String filename) {
        try {
            // Resolve file path safely — strip any path traversal attempts
            String safeName = Paths.get(filename).getFileName().toString();
            Path filePath = Paths.get(UPLOAD_DIR).resolve(safeName).normalize().toAbsolutePath();
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            // Determine Content-Type from extension
            String lower = safeName.toLowerCase();
            String contentType;
            if (lower.endsWith(".pdf")) {
                contentType = "application/pdf";
            } else if (lower.endsWith(".png")) {
                contentType = "image/png";
            } else if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
                contentType = "image/jpeg";
            } else if (lower.endsWith(".gif")) {
                contentType = "image/gif";
            } else if (lower.endsWith(".webp")) {
                contentType = "image/webp";
            } else {
                contentType = "application/octet-stream";
            }

            // Use "inline" so browsers can display images and PDFs directly
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + safeName + "\"")
                    .body(resource);

        } catch (MalformedURLException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
