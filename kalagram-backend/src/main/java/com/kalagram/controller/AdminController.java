package com.kalagram.controller;

import com.kalagram.dto.Dtos.AdminProfile;
import com.kalagram.dto.Dtos.BatchRequest;
import com.kalagram.dto.Dtos.BatchResponse;
import com.kalagram.dto.Dtos.CategoryRequest;
import com.kalagram.dto.Dtos.CategoryView;
import com.kalagram.dto.Dtos.Dashboard;
import com.kalagram.dto.Dtos.EnquiryUpdate;
import com.kalagram.dto.Dtos.EnquiryView;
import com.kalagram.dto.Dtos.GalleryRequest;
import com.kalagram.dto.Dtos.GalleryView;
import com.kalagram.dto.Dtos.LoginRequest;
import com.kalagram.dto.Dtos.LoginResponse;
import com.kalagram.dto.Dtos.PageResponse;
import com.kalagram.dto.Dtos.RegistrationAdminView;
import com.kalagram.dto.Dtos.ResourceRequest;
import com.kalagram.dto.Dtos.ResourceView;
import com.kalagram.dto.Dtos.StatusUpdate;
import com.kalagram.dto.Dtos.UploadResponse;
import com.kalagram.dto.Dtos.WorkshopDetail;
import com.kalagram.dto.Dtos.WorkshopRequest;
import com.kalagram.dto.Dtos.WorkshopSummary;
import com.kalagram.entity.Enums;
import com.kalagram.service.AuthService;
import com.kalagram.service.ContentService;
import com.kalagram.service.DashboardService;
import com.kalagram.service.FileStorageService;
import com.kalagram.service.RegistrationService;
import com.kalagram.service.SettingsService;
import com.kalagram.service.WorkshopService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/** Everything under /api/admin requires a valid JWT, except login (see SecurityConfig). */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AuthService auth;
    private final DashboardService dashboard;
    private final WorkshopService workshops;
    private final RegistrationService registrations;
    private final ContentService content;
    private final FileStorageService files;
    private final SettingsService settings;

    public AdminController(AuthService auth, DashboardService dashboard, WorkshopService workshops,
                           RegistrationService registrations, ContentService content, FileStorageService files,
                           SettingsService settings) {
        this.auth = auth;
        this.dashboard = dashboard;
        this.workshops = workshops;
        this.registrations = registrations;
        this.content = content;
        this.files = files;
        this.settings = settings;
    }

    // ---- Auth & dashboard ----------------------------------------------------------------------

    @PostMapping("/auth/login")
    LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return auth.login(request);
    }

    @GetMapping("/auth/me")
    AdminProfile me(@AuthenticationPrincipal Jwt jwt) {
        return auth.profile(jwt.getSubject());
    }

    @GetMapping("/dashboard")
    Dashboard dashboard() {
        return dashboard.summary();
    }

    // ---- Workshops & batches -------------------------------------------------------------------

    @GetMapping("/workshops")
    List<WorkshopSummary> workshops() {
        return workshops.listAll();
    }

    @GetMapping("/workshops/{id}")
    WorkshopDetail workshop(@PathVariable Long id) {
        return workshops.getForAdmin(id);
    }

    @PostMapping("/workshops")
    @ResponseStatus(HttpStatus.CREATED)
    WorkshopDetail createWorkshop(@Valid @RequestBody WorkshopRequest request) {
        return workshops.create(request);
    }

    @PutMapping("/workshops/{id}")
    WorkshopDetail updateWorkshop(@PathVariable Long id, @Valid @RequestBody WorkshopRequest request) {
        return workshops.update(id, request);
    }

    @DeleteMapping("/workshops/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void deleteWorkshop(@PathVariable Long id) {
        workshops.delete(id);
    }

    @GetMapping("/workshops/{id}/batches")
    List<BatchResponse> workshopBatches(@PathVariable Long id) {
        return workshops.allBatches(id);
    }

    @PostMapping("/batches")
    @ResponseStatus(HttpStatus.CREATED)
    BatchResponse createBatch(@Valid @RequestBody BatchRequest request) {
        return workshops.createBatch(request);
    }

    @PutMapping("/batches/{id}")
    BatchResponse updateBatch(@PathVariable Long id, @Valid @RequestBody BatchRequest request) {
        return workshops.updateBatch(id, request);
    }

    @DeleteMapping("/batches/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void deleteBatch(@PathVariable Long id) {
        workshops.deleteBatch(id);
    }

    // ---- Registrations -------------------------------------------------------------------------

    @GetMapping("/registrations")
    PageResponse<RegistrationAdminView> registrations(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long workshopId,
            @RequestParam(required = false) Enums.RegistrationStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return registrations.search(q, workshopId, status, from, to, page, size);
    }

    @GetMapping("/registrations/export")
    ResponseEntity<byte[]> exportRegistrations(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long workshopId,
            @RequestParam(required = false) Enums.RegistrationStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        byte[] csv = registrations.exportCsv(q, workshopId, status, from, to).getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"kalagram-registrations.csv\"")
                .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
                .body(csv);
    }

    @GetMapping("/registrations/{id}")
    RegistrationAdminView registration(@PathVariable Long id) {
        return registrations.get(id);
    }

    @PutMapping("/registrations/{id}/status")
    RegistrationAdminView updateRegistrationStatus(@PathVariable Long id, @Valid @RequestBody StatusUpdate update) {
        return registrations.updateStatus(id, update.status());
    }

    // ---- Enquiries -----------------------------------------------------------------------------

    @GetMapping("/enquiries")
    PageResponse<EnquiryView> enquiries(@RequestParam(required = false) Enums.EnquiryStatus status,
                                        @RequestParam(defaultValue = "0") int page,
                                        @RequestParam(defaultValue = "20") int size) {
        return content.listEnquiries(status, page, size);
    }

    @PutMapping("/enquiries/{id}")
    EnquiryView updateEnquiry(@PathVariable Long id, @Valid @RequestBody EnquiryUpdate update) {
        return content.updateEnquiry(id, update);
    }

    // ---- Gallery -------------------------------------------------------------------------------

    @PostMapping("/gallery")
    @ResponseStatus(HttpStatus.CREATED)
    GalleryView createGallery(@Valid @RequestBody GalleryRequest request) {
        return content.createGalleryImage(request);
    }

    @PutMapping("/gallery/{id}")
    GalleryView updateGallery(@PathVariable Long id, @Valid @RequestBody GalleryRequest request) {
        return content.updateGalleryImage(id, request);
    }

    @DeleteMapping("/gallery/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void deleteGallery(@PathVariable Long id) {
        content.deleteGalleryImage(id);
    }

    // ---- Resources -----------------------------------------------------------------------------

    @GetMapping("/resources")
    List<ResourceView> resources() {
        return content.listAllResources();
    }

    @PostMapping("/resources")
    @ResponseStatus(HttpStatus.CREATED)
    ResourceView createResource(@Valid @RequestBody ResourceRequest request) {
        return content.createResource(request);
    }

    @PutMapping("/resources/{id}")
    ResourceView updateResource(@PathVariable Long id, @Valid @RequestBody ResourceRequest request) {
        return content.updateResource(id, request);
    }

    @DeleteMapping("/resources/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void deleteResource(@PathVariable Long id) {
        content.deleteResource(id);
    }

    @PostMapping("/resource-categories")
    @ResponseStatus(HttpStatus.CREATED)
    CategoryView createCategory(@Valid @RequestBody CategoryRequest request) {
        return content.createCategory(request);
    }

    @PutMapping("/resource-categories/{id}")
    CategoryView updateCategory(@PathVariable Long id, @Valid @RequestBody CategoryRequest request) {
        return content.updateCategory(id, request);
    }

    @DeleteMapping("/resource-categories/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void deleteCategory(@PathVariable Long id) {
        content.deleteCategory(id);
    }

    // ---- Uploads & settings --------------------------------------------------------------------

    @PostMapping(path = "/uploads", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    UploadResponse upload(@RequestParam("file") MultipartFile file) {
        return files.store(file);
    }

    @PutMapping("/settings")
    Map<String, String> updateSettings(@RequestBody Map<String, String> changes) {
        return settings.update(changes);
    }
}
