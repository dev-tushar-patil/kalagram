package com.kalagram.dto;

import com.kalagram.entity.Enquiry;
import com.kalagram.entity.Enums;
import com.kalagram.entity.GalleryImage;
import com.kalagram.entity.JsonConverters.Faq;
import com.kalagram.entity.JsonConverters.ScheduleDay;
import com.kalagram.entity.Resource;
import com.kalagram.entity.ResourceCategory;
import com.kalagram.entity.Workshop;
import com.kalagram.entity.WorkshopBatch;
import com.kalagram.entity.WorkshopRegistration;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/** Request and response shapes for the REST API. */
public final class Dtos {

    /** Accepts 10-15 digits with an optional + and common separators. */
    private static final String PHONE = "^\\+?[0-9][0-9 ()-]{8,18}[0-9]$";
    private static final String PHONE_MESSAGE = "Enter a valid mobile number";
    /** Site-relative paths or http(s) URLs only: these end up in href/src attributes. */
    private static final String SAFE_URL = "^(/[^/\\\\].*|https?://.+)?$";
    private static final String SAFE_URL_MESSAGE = "Must be a site path or an http(s) URL";

    private Dtos() {}

    // ---- Auth ----------------------------------------------------------------------------------

    public record LoginRequest(
            @NotBlank(message = "Email is required") @Email(message = "Enter a valid email") String email,
            @NotBlank(message = "Password is required") String password) {}

    public record LoginResponse(String token, Instant expiresAt, String email, String displayName) {}

    public record AdminProfile(String email, String displayName) {}

    // ---- Workshops -----------------------------------------------------------------------------

    public record BatchResponse(Long id, Long workshopId, String label, LocalDate startDate, LocalDate endDate,
                                int totalSeats, int bookedSeats, int availableSeats, boolean active, boolean open) {
        public static BatchResponse of(WorkshopBatch b, Long workshopId) {
            return new BatchResponse(b.getId(), workshopId, b.getLabel(), b.getStartDate(), b.getEndDate(),
                    b.getTotalSeats(), b.getBookedSeats(), b.availableSeats(), b.isActive(),
                    b.isOpenForRegistration(LocalDate.now()));
        }
    }

    public record BatchRequest(
            @NotNull(message = "Workshop is required") Long workshopId,
            @Size(max = 120) String label,
            @NotNull(message = "Start date is required") LocalDate startDate,
            @NotNull(message = "End date is required") LocalDate endDate,
            @NotNull(message = "Total seats is required") @Min(value = 1, message = "At least 1 seat")
            @Max(value = 1000, message = "At most 1000 seats") Integer totalSeats,
            boolean active) {}

    public record WorkshopSummary(Long id, String slug, String title, String category, String shortDescription,
                                  String imageUrl, String duration, Enums.SkillLevel skillLevel, BigDecimal priceInr,
                                  String location, boolean active, List<BatchResponse> upcomingBatches) {
        public static WorkshopSummary of(Workshop w, List<BatchResponse> upcoming) {
            return new WorkshopSummary(w.getId(), w.getSlug(), w.getTitle(), w.getCategory(), w.getShortDescription(),
                    w.getImageUrl(), w.getDuration(), w.getSkillLevel(), w.getPriceInr(), w.getLocation(),
                    w.isActive(), upcoming);
        }
    }

    public record WorkshopDetail(Long id, String slug, String title, String category, String shortDescription,
                                 String overview, String imageUrl, String bannerUrl, String duration,
                                 Enums.SkillLevel skillLevel, BigDecimal priceInr, String location,
                                 List<String> learningOutcomes, List<String> curriculum, List<ScheduleDay> schedule,
                                 List<String> materialsProvided, List<String> whatToBring, List<Faq> faqs,
                                 int displayOrder, boolean active, List<BatchResponse> batches) {
        public static WorkshopDetail of(Workshop w, List<BatchResponse> batches) {
            return new WorkshopDetail(w.getId(), w.getSlug(), w.getTitle(), w.getCategory(), w.getShortDescription(),
                    w.getOverview(), w.getImageUrl(), w.getBannerUrl(), w.getDuration(), w.getSkillLevel(),
                    w.getPriceInr(), w.getLocation(), w.getLearningOutcomes(), w.getCurriculum(), w.getSchedule(),
                    w.getMaterialsProvided(), w.getWhatToBring(), w.getFaqs(), w.getDisplayOrder(), w.isActive(),
                    batches);
        }
    }

    public record WorkshopRequest(
            @NotBlank(message = "Title is required") @Size(max = 160) String title,
            @NotBlank(message = "Category is required") @Size(max = 120) String category,
            @NotBlank(message = "Short description is required") @Size(max = 500) String shortDescription,
            @NotBlank(message = "Overview is required") @Size(max = 20000) String overview,
            @Size(max = 500) @Pattern(regexp = SAFE_URL, message = SAFE_URL_MESSAGE) String imageUrl,
            @Size(max = 500) @Pattern(regexp = SAFE_URL, message = SAFE_URL_MESSAGE) String bannerUrl,
            @NotBlank(message = "Duration is required") @Size(max = 60) String duration,
            @NotNull(message = "Skill level is required") Enums.SkillLevel skillLevel,
            @DecimalMin(value = "0", message = "Price cannot be negative") BigDecimal priceInr,
            @Size(max = 200) String location,
            List<String> learningOutcomes,
            List<String> curriculum,
            List<ScheduleDay> schedule,
            List<String> materialsProvided,
            List<String> whatToBring,
            List<Faq> faqs,
            int displayOrder,
            boolean active) {}

    // ---- Registrations -------------------------------------------------------------------------

    public record RegistrationRequest(
            @NotBlank(message = "Full name is required") @Size(max = 120, message = "Name is too long") String fullName,
            @NotBlank(message = "Email is required") @Email(message = "Enter a valid email address")
            @Size(max = 160) String email,
            @NotBlank(message = "Mobile number is required") @Pattern(regexp = PHONE, message = PHONE_MESSAGE) String mobile,
            @NotNull(message = "Please select a workshop") Long workshopId,
            @NotNull(message = "Please select a batch") Long batchId,
            @NotNull(message = "Number of participants is required") @Min(value = 1, message = "At least 1 participant")
            @Max(value = 20, message = "For more than 20 participants, please contact us") Integer participants,
            @Size(max = 100) String city,
            @Size(max = 2000, message = "Message is too long") String message) {}

    /** What the participant sees on confirmation, including what the WhatsApp message needs. */
    public record RegistrationConfirmation(String registrationId, String status, String fullName, String mobile,
                                           String email, String workshopTitle, LocalDate startDate, LocalDate endDate,
                                           String batchLabel, int participants, String city, String message) {
        public static RegistrationConfirmation of(WorkshopRegistration r) {
            return new RegistrationConfirmation(r.getRegistrationId(), r.getStatus().name(), r.getFullName(),
                    r.getMobile(), r.getEmail(), r.getWorkshop().getTitle(), r.getBatch().getStartDate(),
                    r.getBatch().getEndDate(), r.getBatch().getLabel(), r.getParticipants(), r.getCity(), r.getMessage());
        }
    }

    public record RegistrationAdminView(Long id, String registrationId, Enums.RegistrationStatus status, String fullName,
                                        String email, String mobile, Long workshopId, String workshopTitle, Long batchId,
                                        LocalDate startDate, LocalDate endDate, int participants, String city,
                                        String message, Instant createdAt) {
        public static RegistrationAdminView of(WorkshopRegistration r) {
            return new RegistrationAdminView(r.getId(), r.getRegistrationId(), r.getStatus(), r.getFullName(),
                    r.getEmail(), r.getMobile(), r.getWorkshop().getId(), r.getWorkshop().getTitle(),
                    r.getBatch().getId(), r.getBatch().getStartDate(), r.getBatch().getEndDate(), r.getParticipants(),
                    r.getCity(), r.getMessage(), r.getCreatedAt());
        }
    }

    public record StatusUpdate(@NotNull(message = "Status is required") Enums.RegistrationStatus status) {}

    // ---- Enquiries -----------------------------------------------------------------------------

    public record EnquiryRequest(
            @NotBlank(message = "Name is required") @Size(max = 120, message = "Name is too long") String name,
            @NotBlank(message = "Email is required") @Email(message = "Enter a valid email address")
            @Size(max = 160) String email,
            @NotBlank(message = "Phone is required") @Pattern(regexp = PHONE, message = PHONE_MESSAGE) String phone,
            @NotBlank(message = "Please choose what your enquiry is for") @Size(max = 120) String enquiryFor,
            @NotBlank(message = "Message is required") @Size(max = 2000, message = "Message is too long") String message) {}

    public record EnquiryCreated(Long id) {}

    public record EnquiryUpdate(@NotNull(message = "Status is required") Enums.EnquiryStatus status,
                                @Size(max = 10000) String internalNotes) {}

    public record EnquiryView(Long id, String name, String email, String phone, String enquiryFor, String message,
                              Enums.EnquiryStatus status, String internalNotes, Instant createdAt) {
        public static EnquiryView of(Enquiry e) {
            return new EnquiryView(e.getId(), e.getName(), e.getEmail(), e.getPhone(), e.getEnquiryFor(),
                    e.getMessage(), e.getStatus(), e.getInternalNotes(), e.getCreatedAt());
        }
    }

    // ---- Gallery -------------------------------------------------------------------------------

    public record GalleryRequest(
            @NotBlank(message = "Title is required") @Size(max = 160) String title,
            @Size(max = 300) String altText,
            @NotBlank(message = "Image is required") @Size(max = 500)
            @Pattern(regexp = SAFE_URL, message = SAFE_URL_MESSAGE) String imageUrl,
            @NotNull(message = "Category is required") Enums.GalleryCategory category,
            int displayOrder) {}

    public record GalleryView(Long id, String title, String altText, String imageUrl, Enums.GalleryCategory category,
                              int displayOrder) {
        public static GalleryView of(GalleryImage g) {
            return new GalleryView(g.getId(), g.getTitle(), g.getAltText(), g.getImageUrl(), g.getCategory(),
                    g.getDisplayOrder());
        }
    }

    // ---- Resources -----------------------------------------------------------------------------

    public record CategoryRequest(
            @NotBlank(message = "Name is required") @Size(max = 100) String name,
            @Size(max = 255) String description,
            @Size(max = 40) String icon,
            int displayOrder) {}

    public record CategoryView(Long id, String name, String description, String icon, int displayOrder) {
        public static CategoryView of(ResourceCategory c) {
            return new CategoryView(c.getId(), c.getName(), c.getDescription(), c.getIcon(), c.getDisplayOrder());
        }
    }

    public record ResourceRequest(
            @NotBlank(message = "Title is required") @Size(max = 180) String title,
            @NotNull(message = "Category is required") Long categoryId,
            @NotNull(message = "Type is required") Enums.ResourceType type,
            @NotBlank(message = "Short description is required") @Size(max = 500) String shortDescription,
            @Size(max = 200000) String body,
            @Size(max = 500) @Pattern(regexp = SAFE_URL, message = SAFE_URL_MESSAGE) String thumbnailUrl,
            @Size(max = 500) @Pattern(regexp = SAFE_URL, message = SAFE_URL_MESSAGE) String fileUrl,
            @Size(max = 500) @Pattern(regexp = SAFE_URL, message = SAFE_URL_MESSAGE) String videoUrl,
            @Min(value = 1, message = "Reading time must be at least 1 minute") Integer readingMinutes,
            boolean featured,
            boolean published) {}

    public record ResourceView(Long id, String slug, String title, Long categoryId, String categoryName,
                               Enums.ResourceType type, String shortDescription, String body, String thumbnailUrl,
                               String fileUrl, String videoUrl, Integer readingMinutes, boolean featured,
                               boolean published, Instant createdAt) {
        public static ResourceView of(Resource r, boolean withBody) {
            return new ResourceView(r.getId(), r.getSlug(), r.getTitle(), r.getCategory().getId(),
                    r.getCategory().getName(), r.getType(), r.getShortDescription(), withBody ? r.getBody() : null,
                    r.getThumbnailUrl(), r.getFileUrl(), r.getVideoUrl(), r.getReadingMinutes(), r.isFeatured(),
                    r.isPublished(), r.getCreatedAt());
        }
    }

    // ---- Dashboard -----------------------------------------------------------------------------

    public record Dashboard(long totalRegistrations, long upcomingWorkshops, long totalEnquiries, long newEnquiries,
                            long totalParticipants, long registrationsLast30Days,
                            List<RegistrationAdminView> recentRegistrations) {}

    public record PageResponse<T>(List<T> content, int page, int size, long totalElements, int totalPages) {
        public static <T> PageResponse<T> of(org.springframework.data.domain.Page<T> page) {
            return new PageResponse<>(page.getContent(), page.getNumber(), page.getSize(), page.getTotalElements(),
                    page.getTotalPages());
        }
    }

    public record UploadResponse(String url, String fileName, long size) {}
}
