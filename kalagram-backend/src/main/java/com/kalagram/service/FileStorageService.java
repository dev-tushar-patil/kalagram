package com.kalagram.service;

import com.kalagram.config.KalagramProperties;
import com.kalagram.dto.Dtos.UploadResponse;
import com.kalagram.exception.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.UUID;

/**
 * Stores admin uploads under the upload directory. The type is decided from the file's leading bytes and the
 * stored name is random, so a mislabelled upload (for example HTML or SVG named .jpg) is never served as such.
 */
@Service
public class FileStorageService {

    private static final Logger log = LoggerFactory.getLogger(FileStorageService.class);
    private static final String PUBLIC_PREFIX = "/uploads/";

    private final Path root;

    public FileStorageService(KalagramProperties properties) throws IOException {
        this.root = Path.of(properties.uploadDir()).toAbsolutePath().normalize();
        Files.createDirectories(root);
    }

    public UploadResponse store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw ApiException.badRequest("Please choose a file to upload.");
        }
        try (InputStream in = file.getInputStream()) {
            byte[] head = in.readNBytes(12);
            String extension = detectExtension(head);
            if (extension == null) {
                throw ApiException.badRequest("Only JPG, PNG, WebP images and PDF files can be uploaded.");
            }
            String name = UUID.randomUUID() + "." + extension;
            try (InputStream full = file.getInputStream()) {
                Files.copy(full, root.resolve(name), StandardCopyOption.REPLACE_EXISTING);
            }
            return new UploadResponse(PUBLIC_PREFIX + name, file.getOriginalFilename(), file.getSize());
        } catch (IOException e) {
            log.error("Upload failed", e);
            throw new IllegalStateException("Could not store the uploaded file", e);
        }
    }

    /** Sample content points at bundled /images/ paths, so only files under /uploads/ are removed. */
    public void deleteIfUploaded(String url) {
        if (url == null || !url.startsWith(PUBLIC_PREFIX)) {
            return;
        }
        Path target = root.resolve(url.substring(PUBLIC_PREFIX.length())).normalize();
        if (!target.startsWith(root) || target.equals(root)) {
            return;
        }
        try {
            Files.deleteIfExists(target);
        } catch (IOException e) {
            log.warn("Could not delete upload {}: {}", target, e.getMessage());
        }
    }

    static String detectExtension(byte[] h) {
        if (h.length >= 3 && (h[0] & 0xFF) == 0xFF && (h[1] & 0xFF) == 0xD8 && (h[2] & 0xFF) == 0xFF) {
            return "jpg";
        }
        if (h.length >= 8 && Arrays.equals(Arrays.copyOf(h, 8),
                new byte[]{(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A})) {
            return "png";
        }
        if (h.length >= 12 && ascii(h, 0, 4).equals("RIFF") && ascii(h, 8, 12).equals("WEBP")) {
            return "webp";
        }
        if (h.length >= 5 && ascii(h, 0, 5).equals("%PDF-")) {
            return "pdf";
        }
        return null;
    }

    private static String ascii(byte[] bytes, int from, int to) {
        return new String(bytes, from, to - from, StandardCharsets.ISO_8859_1);
    }
}
