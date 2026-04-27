package com.example.Phy6_Master.controller;

import com.example.Phy6_Master.model.LearningMaterial;
import com.example.Phy6_Master.model.Lesson;
import com.example.Phy6_Master.repository.LearningMaterialRepository;
import com.example.Phy6_Master.service.FileStorageService;
import com.example.Phy6_Master.service.LessonService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api")
public class MaterialController {

    @Value("${storage.local.upload-dir:uploads}")
    private String uploadDir;

    @Autowired
    private LearningMaterialRepository materialRepository;

    @Autowired
    private LessonService lessonService;

    @Autowired
    private FileStorageService fileStorageService;

    /**
     * Upload a file and create a LearningMaterial linked to a lesson.
     */
    @PostMapping("/lessons/{lessonId}/materials/uploads")
    public ResponseEntity<?> uploadMaterial(
            @PathVariable Long lessonId,
            @RequestParam("title") String title,
            @RequestParam("type") String type,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "url", required = false) String url) throws IOException {
        try {
            Lesson lesson = lessonService.getLessonById(lessonId)
                    .orElseThrow(() -> new IllegalArgumentException("Lesson not found with id: " + lessonId));

            LearningMaterial.MaterialType materialType = parseMaterialType(type);

            LearningMaterial material = new LearningMaterial();
            material.setTitle(title);
            material.setType(materialType);
            material.setLesson(lesson);

            if (materialType == LearningMaterial.MaterialType.LINK) {
                if (url == null || url.isBlank()) {
                    throw new IllegalArgumentException("URL is required for LINK material.");
                }
                material.setUrl(url);
            } else {
                if (file == null || file.isEmpty()) {
                    throw new IllegalArgumentException("File is required for non-LINK material.");
                }
                String storedLocation = fileStorageService.storeFile(file, resolveSubFolder(materialType));
                material.setUrl(storedLocation);
            }

            LearningMaterial saved = materialRepository.save(material);
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (IllegalStateException e) {
            log.error("Material upload failed due to storage configuration: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of("message", e.getMessage()));
        } catch (IOException e) {
            log.error("Material upload I/O failed for lesson {}: {}", lessonId, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Download / preview a material file by its entity id.
     */
    @GetMapping("/materials/{id}/downloads")
    public ResponseEntity<Resource> downloadMaterial(@PathVariable Long id) throws MalformedURLException {
        LearningMaterial material = materialRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Material not found with id: " + id));

        String storedUrl = material.getUrl();
        if (storedUrl == null || storedUrl.isBlank()) {
            return ResponseEntity.notFound().build();
        }

        if (fileStorageService.isRemoteUrl(storedUrl)) {
            return ResponseEntity.status(HttpStatus.FOUND)
                    .header(HttpHeaders.LOCATION, storedUrl)
                    .build();
        }

        // Normalise path — older records may lack the "uploads/" prefix
        storedUrl = storedUrl.replace("\\", "/");
        if (!storedUrl.startsWith(uploadDir + "/") && !storedUrl.startsWith(uploadDir + "\\")) {
            storedUrl = uploadDir + "/" + storedUrl;
        }

        Path filePath = Paths.get(storedUrl).toAbsolutePath().normalize();
        Resource resource = new UrlResource(filePath.toUri());

        if (!resource.exists()) {
            return ResponseEntity.notFound().build();
        }

        // Derive content type
        String contentType = "application/octet-stream";
        String url = storedUrl.toLowerCase();
        if (url.endsWith(".pdf")) {
            contentType = "application/pdf";
        } else if (url.endsWith(".mp4")) {
            contentType = "video/mp4";
        } else if (url.endsWith(".png")) {
            contentType = "image/png";
        } else if (url.endsWith(".jpg") || url.endsWith(".jpeg")) {
            contentType = "image/jpeg";
        } else if (url.endsWith(".docx")) {
            contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        }

        // Use "inline" so browsers can preview PDFs / images / videos instead of forcing download
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + material.getTitle() + getExtension(storedUrl) + "\"")
                .body(resource);
    }

    /**
     * Update material metadata (title, type) and optionally replace the file.
     */
    @PutMapping("/materials/{id}")
    public ResponseEntity<?> updateMaterial(
            @PathVariable Long id,
            @RequestParam("title") String title,
            @RequestParam("type") String type,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "url", required = false) String url) throws IOException {
        try {
            LearningMaterial material = materialRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Material not found with id: " + id));

            LearningMaterial.MaterialType materialType = parseMaterialType(type);
            material.setTitle(title);
            material.setType(materialType);

            if (materialType == LearningMaterial.MaterialType.LINK) {
                if (url == null || url.isBlank()) {
                    throw new IllegalArgumentException("URL is required for LINK material.");
                }
                tryDeleteOldFile(material.getUrl());
                material.setUrl(url);
            } else if (file != null && !file.isEmpty()) {
                tryDeleteOldFile(material.getUrl());
                String storedLocation = fileStorageService.storeFile(file, resolveSubFolder(materialType));
                material.setUrl(storedLocation);
            }

            LearningMaterial saved = materialRepository.save(material);
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (IllegalStateException e) {
            log.error("Material update failed due to storage configuration: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of("message", e.getMessage()));
        } catch (IOException e) {
            log.error("Material update I/O failed for material {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Delete a material and its file from disk.
     */
    @DeleteMapping("/materials/{id}")
    public ResponseEntity<Void> deleteMaterial(@PathVariable Long id) {
        LearningMaterial material = materialRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Material not found with id: " + id));

        tryDeleteOldFile(material.getUrl());

        materialRepository.delete(material);
        return ResponseEntity.noContent().build();
    }

    private void tryDeleteOldFile(String storedUrl) {
        if (storedUrl == null || storedUrl.isBlank()) {
            return;
        }
        if (fileStorageService.isRemoteUrl(storedUrl)) {
            if (!fileStorageService.isSupabaseEnabled() || !fileStorageService.isSupabaseUrl(storedUrl)) {
                return;
            }
        }
        try {
            fileStorageService.deleteFile(storedUrl);
        } catch (IOException e) {
            log.warn("Failed to delete material file: {}", e.getMessage());
        }
    }

    private LearningMaterial.MaterialType parseMaterialType(String type) {
        if (type == null || type.isBlank()) {
            throw new IllegalArgumentException("Material type is required.");
        }
        try {
            return LearningMaterial.MaterialType.valueOf(type.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid material type: " + type + ". Allowed values: PDF, VIDEO, NOTE, LINK.");
        }
    }

    private String resolveSubFolder(LearningMaterial.MaterialType materialType) {
        return switch (materialType) {
            case VIDEO -> "materials/video";
            case NOTE -> "materials/note";
            case PDF -> "materials/pdf";
            default -> throw new IllegalArgumentException("LINK type does not use file storage.");
        };
    }

    private String getExtension(String path) {
        if (path != null && path.contains(".")) {
            return path.substring(path.lastIndexOf("."));
        }
        return "";
    }
}
