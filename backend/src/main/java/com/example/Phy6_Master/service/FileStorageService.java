package com.example.Phy6_Master.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Slf4j
@Service
public class FileStorageService {

    @Value("${storage.provider:local}")
    private String storageProvider;

    @Value("${storage.local.upload-dir:uploads}")
    private String uploadDir;

    @Value("${supabase.url:}")
    private String supabaseUrl;

    @Value("${supabase.service-key:}")
    private String supabaseServiceKey;

    @Value("${supabase.storage.bucket:phy6-files}")
    private String supabaseBucket;

    @Value("${supabase.storage.public-url:}")
    private String supabasePublicUrl;

    public String storeFile(MultipartFile file) throws IOException {
        return storeFile(file, null);
    }

    public String storeFile(MultipartFile file, String subFolder) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Cannot store empty file.");
        }

        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String uniqueFilename = UUID.randomUUID().toString() + extension;

        return storeStream(file.getInputStream(), file.getContentType(), subFolder, uniqueFilename);
    }

    public String storeBytes(byte[] bytes, String contentType, String subFolder, String fileName) throws IOException {
        if (bytes == null || bytes.length == 0) {
            throw new IllegalArgumentException("Cannot store empty content.");
        }
        return storeStream(new ByteArrayInputStream(bytes), contentType, subFolder, fileName);
    }

    public void deleteFile(String storedLocation) throws IOException {
        if (storedLocation == null || storedLocation.isBlank()) {
            return;
        }
        if (isRemoteUrl(storedLocation)) {
            if (!useSupabase()) {
                throw new IllegalStateException("Remote file deletion requires Supabase storage provider.");
            }
            ensureSupabaseConfigured();
            String objectPath = extractSupabaseObjectPath(storedLocation);
            if (objectPath == null || objectPath.isBlank()) {
                throw new IllegalArgumentException("Unsupported Supabase file URL: " + storedLocation);
            }
            deleteFromSupabase(objectPath);
            return;
        }

        String normalized = storedLocation.replace("\\", "/");
        Path path = Paths.get(storedLocation);
        if (!path.isAbsolute() && !normalized.startsWith(uploadDir.replace("\\", "/") + "/")) {
            path = Paths.get(uploadDir).resolve(normalized);
        }
        Files.deleteIfExists(path.normalize().toAbsolutePath());
    }

    public boolean isRemoteUrl(String location) {
        return location != null && (location.startsWith("http://") || location.startsWith("https://"));
    }

    public boolean isSupabaseUrl(String location) {
        if (!isRemoteUrl(location)) {
            return false;
        }
        return extractSupabaseObjectPath(location) != null;
    }

    public boolean isSupabaseEnabled() {
        return useSupabase();
    }

    private String storeStream(InputStream inputStream, String contentType, String subFolder, String fileName) throws IOException {
        if (useSupabase()) {
            ensureSupabaseConfigured();
            String objectPath = buildObjectPath(subFolder, fileName);
            uploadToSupabase(objectPath, inputStream, contentType);
            return publicUrlFor(objectPath);
        }

        Path uploadPath = resolveLocalFolder(subFolder);
        Files.createDirectories(uploadPath);
        Path filePath = uploadPath.resolve(fileName);
        Files.copy(inputStream, filePath, StandardCopyOption.REPLACE_EXISTING);
        return filePath.toString();
    }

    private Path resolveLocalFolder(String subFolder) {
        Path path = Paths.get(uploadDir);
        if (subFolder == null || subFolder.isBlank()) {
            return path;
        }
        String normalized = subFolder.replace("\\", "/");
        for (String part : normalized.split("/")) {
            if (!part.isBlank()) {
                path = path.resolve(part);
            }
        }
        return path;
    }

    private boolean useSupabase() {
        return "supabase".equalsIgnoreCase(storageProvider);
    }

    private void ensureSupabaseConfigured() {
        if (supabaseUrl == null || supabaseUrl.isBlank()) {
            throw new IllegalStateException("Supabase URL is not configured.");
        }
        if (supabaseServiceKey == null || supabaseServiceKey.isBlank()) {
            throw new IllegalStateException("Supabase service key is not configured.");
        }
        if (supabaseBucket == null || supabaseBucket.isBlank()) {
            throw new IllegalStateException("Supabase bucket is not configured.");
        }
    }

    private String buildObjectPath(String subFolder, String fileName) {
        String cleanedFolder = subFolder == null ? "" : subFolder.replace("\\", "/").replaceAll("^/+", "").replaceAll("/+$", "");
        if (cleanedFolder.isBlank()) {
            return fileName;
        }
        return cleanedFolder + "/" + fileName;
    }

    private void uploadToSupabase(String objectPath, InputStream inputStream, String contentType) throws IOException {
        String apiBase = normalizeBaseUrl(supabaseUrl);
        URL url = new URL(apiBase + "/storage/v1/object/" + supabaseBucket + "/" + objectPath);
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        connection.setRequestMethod("PUT");
        connection.setDoOutput(true);
        connection.setRequestProperty("Authorization", "Bearer " + supabaseServiceKey);
        connection.setRequestProperty("apikey", supabaseServiceKey);
        connection.setRequestProperty("x-upsert", "true");
        if (contentType != null && !contentType.isBlank()) {
            connection.setRequestProperty("Content-Type", contentType);
        } else {
            connection.setRequestProperty("Content-Type", "application/octet-stream");
        }

        try (OutputStream outputStream = connection.getOutputStream()) {
            inputStream.transferTo(outputStream);
        }

        int status = connection.getResponseCode();
        if (status < 200 || status >= 300) {
            String errorBody = readErrorBody(connection);
            throw new IOException("Supabase upload failed with status " + status + (errorBody.isBlank() ? "" : ": " + errorBody));
        }
    }

    private void deleteFromSupabase(String objectPath) throws IOException {
        String apiBase = normalizeBaseUrl(supabaseUrl);
        URL url = new URL(apiBase + "/storage/v1/object/" + supabaseBucket + "/" + objectPath);
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        connection.setRequestMethod("DELETE");
        connection.setRequestProperty("Authorization", "Bearer " + supabaseServiceKey);
        connection.setRequestProperty("apikey", supabaseServiceKey);

        int status = connection.getResponseCode();
        if (status < 200 || status >= 300) {
            String errorBody = readErrorBody(connection);
            throw new IOException("Supabase delete failed with status " + status + (errorBody.isBlank() ? "" : ": " + errorBody));
        }
    }

    private String publicUrlFor(String objectPath) {
        String base = supabasePublicUrl != null && !supabasePublicUrl.isBlank()
                ? supabasePublicUrl
                : normalizeBaseUrl(supabaseUrl) + "/storage/v1/object/public/" + supabaseBucket;
        return normalizeBaseUrl(base) + "/" + objectPath;
    }

    private String extractSupabaseObjectPath(String storedLocation) {
        String clean = storedLocation.split("\\?")[0];
        String publicBase = normalizeBaseUrl(supabasePublicUrl != null ? supabasePublicUrl : "");
        if (!publicBase.isBlank() && clean.startsWith(publicBase)) {
            return trimLeadingSlash(clean.substring(publicBase.length()));
        }
        String fallbackPublicBase = normalizeBaseUrl(supabaseUrl) + "/storage/v1/object/public/" + supabaseBucket;
        if (clean.startsWith(fallbackPublicBase)) {
            return trimLeadingSlash(clean.substring(fallbackPublicBase.length()));
        }
        String fallbackBase = normalizeBaseUrl(supabaseUrl) + "/storage/v1/object/" + supabaseBucket;
        if (clean.startsWith(fallbackBase)) {
            return trimLeadingSlash(clean.substring(fallbackBase.length()));
        }
        return null;
    }

    private String normalizeBaseUrl(String url) {
        if (url == null) {
            return "";
        }
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }

    private String trimLeadingSlash(String value) {
        if (value == null) {
            return "";
        }
        return value.startsWith("/") ? value.substring(1) : value;
    }

    private String readErrorBody(HttpURLConnection connection) {
        try (InputStream errorStream = connection.getErrorStream()) {
            if (errorStream == null) {
                return "";
            }
            return new String(errorStream.readAllBytes());
        } catch (IOException e) {
            log.warn("Failed to read Supabase error response", e);
            return "";
        }
    }
}
