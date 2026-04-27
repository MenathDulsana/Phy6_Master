package com.example.Phy6_Master.controller;

import com.example.Phy6_Master.model.LearningMaterial;
import com.example.Phy6_Master.model.Lesson;
import com.example.Phy6_Master.repository.LearningMaterialRepository;
import com.example.Phy6_Master.service.LessonService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class MaterialController {

    private static final String UPLOAD_DIR = "uploads";

    @Autowired
    private LearningMaterialRepository materialRepository;

    @Autowired
    private LessonService lessonService;

    /**
     * Upload a file and create a LearningMaterial linked to a lesson.
     */
    @PostMapping("/lessons/{lessonId}/materials/uploads")
    public ResponseEntity<LearningMaterial> uploadMaterial(
            @PathVariable Long lessonId,
            @RequestParam("title") String title,
            @RequestParam("type") String type,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "url", required = false) String url) throws IOException {

        Lesson lesson = lessonService.getLessonById(lessonId)
                .orElseThrow(() -> new RuntimeException("Lesson not found with id: " + lessonId));

        LearningMaterial material = new LearningMaterial();
        material.setTitle(title);
        material.setType(LearningMaterial.MaterialType.valueOf(type.toUpperCase()));
        material.setLesson(lesson);

        if ("LINK".equalsIgnoreCase(type)) {
            // For LINK type, store the URL directly — no file needed
            material.setUrl(url != null ? url : "");
        } else {
            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest().build();
            }

            // Determine storage sub-folder based on type
            String subFolder;
            switch (type.toUpperCase()) {
                case "VIDEO": subFolder = "video"; break;
                case "NOTE":  subFolder = "note";  break;
                default:      subFolder = "pdf";   break;
            }

            // Generate unique file name to avoid collisions
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String storedFilename = UUID.randomUUID().toString() + extension;

            // Save to disk
            Path uploadPath = Paths.get(UPLOAD_DIR, subFolder);
            Files.createDirectories(uploadPath);
            Path filePath = uploadPath.resolve(storedFilename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            material.setUrl(filePath.toString());  // e.g. uploads/pdf/abc.pdf
        }

        LearningMaterial saved = materialRepository.save(material);
        return ResponseEntity.ok(saved);
    }

    /**
     * Download / preview a material file by its entity id.
     */
    @GetMapping("/materials/{id}/downloads")
    public ResponseEntity<Resource> downloadMaterial(@PathVariable Long id) throws MalformedURLException {
        LearningMaterial material = materialRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Material not found with id: " + id));

        // Normalise path — older records may lack the "uploads/" prefix
        String storedUrl = material.getUrl().replace("\\", "/");
        if (!storedUrl.startsWith(UPLOAD_DIR + "/") && !storedUrl.startsWith(UPLOAD_DIR + "\\")) {
            storedUrl = UPLOAD_DIR + "/" + storedUrl;
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
    public ResponseEntity<LearningMaterial> updateMaterial(
            @PathVariable Long id,
            @RequestParam("title") String title,
            @RequestParam("type") String type,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "url", required = false) String url) throws IOException {

        LearningMaterial material = materialRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Material not found with id: " + id));

        material.setTitle(title);
        material.setType(LearningMaterial.MaterialType.valueOf(type.toUpperCase()));

        if ("LINK".equalsIgnoreCase(type)) {
            // For LINK type, store the URL directly
            if (url != null) {
                // Delete old file from disk if it was a file-based material
                tryDeleteOldFile(material.getUrl());
                material.setUrl(url);
            }
        } else if (file != null && !file.isEmpty()) {
            // Delete old file
            tryDeleteOldFile(material.getUrl());

            // Determine sub-folder based on new type
            String subFolder;
            switch (type.toUpperCase()) {
                case "VIDEO": subFolder = "video"; break;
                case "NOTE":  subFolder = "note";  break;
                default:      subFolder = "pdf";   break;
            }

            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String storedFilename = UUID.randomUUID().toString() + extension;

            Path uploadPath = Paths.get(UPLOAD_DIR, subFolder);
            Files.createDirectories(uploadPath);
            Path filePath = uploadPath.resolve(storedFilename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            material.setUrl(filePath.toString());
        }

        LearningMaterial saved = materialRepository.save(material);
        return ResponseEntity.ok(saved);
    }

    /**
     * Delete a material and its file from disk.
     */
    @DeleteMapping("/materials/{id}")
    public ResponseEntity<Void> deleteMaterial(@PathVariable Long id) {
        LearningMaterial material = materialRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Material not found with id: " + id));

        // Delete file from disk — normalise path like download
        try {
            String storedPath = material.getUrl().replace("\\", "/");
            if (!storedPath.startsWith(UPLOAD_DIR + "/") && !storedPath.startsWith(UPLOAD_DIR + "\\")) {
                storedPath = UPLOAD_DIR + "/" + storedPath;
            }
            Path filePath = Paths.get(storedPath);
            Files.deleteIfExists(filePath);
        } catch (IOException ignored) {
            // File may already be gone — proceed to delete entity
        }

        materialRepository.delete(material);
        return ResponseEntity.noContent().build();
    }

    private void tryDeleteOldFile(String storedUrl) {
        if (storedUrl == null || storedUrl.startsWith("http://") || storedUrl.startsWith("https://")) return;
        try {
            String oldPath = storedUrl.replace("\\", "/");
            if (!oldPath.startsWith(UPLOAD_DIR + "/")) {
                oldPath = UPLOAD_DIR + "/" + oldPath;
            }
            Files.deleteIfExists(Paths.get(oldPath));
        } catch (IOException ignored) { }
    }

    private String getExtension(String path) {
        if (path != null && path.contains(".")) {
            return path.substring(path.lastIndexOf("."));
        }
        return "";
    }
}
