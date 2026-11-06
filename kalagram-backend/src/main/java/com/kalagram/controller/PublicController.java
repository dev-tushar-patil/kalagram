package com.kalagram.controller;

import com.kalagram.dto.Dtos.BatchResponse;
import com.kalagram.dto.Dtos.CategoryView;
import com.kalagram.dto.Dtos.EnquiryCreated;
import com.kalagram.dto.Dtos.EnquiryRequest;
import com.kalagram.dto.Dtos.GalleryView;
import com.kalagram.dto.Dtos.RegistrationConfirmation;
import com.kalagram.dto.Dtos.RegistrationRequest;
import com.kalagram.dto.Dtos.ResourceView;
import com.kalagram.dto.Dtos.WorkshopDetail;
import com.kalagram.dto.Dtos.WorkshopSummary;
import com.kalagram.entity.Enums;
import com.kalagram.service.ContentService;
import com.kalagram.service.RegistrationService;
import com.kalagram.service.SettingsService;
import com.kalagram.service.WorkshopService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class PublicController {

    private final WorkshopService workshops;
    private final RegistrationService registrations;
    private final ContentService content;
    private final SettingsService settings;

    public PublicController(WorkshopService workshops, RegistrationService registrations, ContentService content,
                            SettingsService settings) {
        this.workshops = workshops;
        this.registrations = registrations;
        this.content = content;
        this.settings = settings;
    }

    @GetMapping("/workshops")
    List<WorkshopSummary> workshops() {
        return workshops.listActive();
    }

    @GetMapping("/workshops/{idOrSlug}")
    WorkshopDetail workshop(@PathVariable String idOrSlug) {
        return workshops.getPublic(idOrSlug);
    }

    @GetMapping("/workshops/{id}/batches")
    List<BatchResponse> batches(@PathVariable Long id) {
        return workshops.upcoming(id);
    }

    @PostMapping("/registrations")
    @ResponseStatus(HttpStatus.CREATED)
    RegistrationConfirmation register(@Valid @RequestBody RegistrationRequest request) {
        return registrations.create(request);
    }

    @PostMapping("/enquiries")
    @ResponseStatus(HttpStatus.CREATED)
    EnquiryCreated enquire(@Valid @RequestBody EnquiryRequest request) {
        return content.createEnquiry(request);
    }

    @GetMapping("/gallery")
    List<GalleryView> gallery(@RequestParam(required = false) Enums.GalleryCategory category) {
        return content.listGallery(category);
    }

    @GetMapping("/resources")
    List<ResourceView> resources(@RequestParam(required = false) Long categoryId) {
        return content.listPublishedResources(categoryId);
    }

    @GetMapping("/resources/{idOrSlug}")
    ResourceView resource(@PathVariable String idOrSlug) {
        return content.getPublishedResource(idOrSlug);
    }

    @GetMapping("/resource-categories")
    List<CategoryView> resourceCategories() {
        return content.listCategories();
    }

    @GetMapping("/settings")
    Map<String, String> settings() {
        return settings.all();
    }
}
