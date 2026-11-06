package com.kalagram.service;

import com.kalagram.dto.Dtos.BatchRequest;
import com.kalagram.dto.Dtos.BatchResponse;
import com.kalagram.dto.Dtos.WorkshopDetail;
import com.kalagram.dto.Dtos.WorkshopRequest;
import com.kalagram.dto.Dtos.WorkshopSummary;
import com.kalagram.entity.Workshop;
import com.kalagram.entity.WorkshopBatch;
import com.kalagram.exception.ApiException;
import com.kalagram.repository.Repositories.RegistrationRepository;
import com.kalagram.repository.Repositories.WorkshopBatchRepository;
import com.kalagram.repository.Repositories.WorkshopRepository;
import com.kalagram.util.SlugUtil;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class WorkshopService {

    private final WorkshopRepository workshops;
    private final WorkshopBatchRepository batches;
    private final RegistrationRepository registrations;

    public WorkshopService(WorkshopRepository workshops, WorkshopBatchRepository batches,
                           RegistrationRepository registrations) {
        this.workshops = workshops;
        this.batches = batches;
        this.registrations = registrations;
    }

    // ---- Public --------------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<WorkshopSummary> listActive() {
        return summaries(workshops.findByActiveTrueOrderByDisplayOrderAscIdAsc());
    }

    @Transactional(readOnly = true)
    public WorkshopDetail getPublic(String idOrSlug) {
        Workshop workshop = find(idOrSlug);
        if (!workshop.isActive()) {
            throw ApiException.notFound("Workshop");
        }
        return WorkshopDetail.of(workshop, upcoming(workshop.getId()));
    }

    /** Active batches that have not started yet, including full ones so visitors can see them sold out. */
    @Transactional(readOnly = true)
    public List<BatchResponse> upcoming(Long workshopId) {
        LocalDate today = LocalDate.now();
        return batches.findByWorkshopIdOrderByStartDateAsc(workshopId).stream()
                .filter(b -> b.isActive() && b.getStartDate().isAfter(today))
                .map(b -> BatchResponse.of(b, workshopId))
                .toList();
    }

    private List<WorkshopSummary> summaries(List<Workshop> list) {
        LocalDate today = LocalDate.now();
        Map<Long, List<WorkshopBatch>> byWorkshop = batches
                .findByWorkshopIdInOrderByStartDateAsc(list.stream().map(Workshop::getId).toList())
                .stream()
                .collect(Collectors.groupingBy(b -> b.getWorkshop().getId()));
        return list.stream().map(w -> WorkshopSummary.of(w, byWorkshop.getOrDefault(w.getId(), List.of()).stream()
                .filter(b -> b.isActive() && b.getStartDate().isAfter(today))
                .map(b -> BatchResponse.of(b, w.getId()))
                .toList())).toList();
    }

    private Workshop find(String idOrSlug) {
        var found = idOrSlug.matches("\\d{1,18}")
                ? workshops.findById(Long.parseLong(idOrSlug))
                : workshops.findBySlug(idOrSlug);
        return found.orElseThrow(() -> ApiException.notFound("Workshop"));
    }

    // ---- Admin ---------------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<WorkshopSummary> listAll() {
        return summaries(workshops.findAllByOrderByDisplayOrderAscIdAsc());
    }

    @Transactional(readOnly = true)
    public WorkshopDetail getForAdmin(Long id) {
        Workshop workshop = workshops.findById(id).orElseThrow(() -> ApiException.notFound("Workshop"));
        return WorkshopDetail.of(workshop, allBatches(id));
    }

    @Transactional
    public WorkshopDetail create(WorkshopRequest request) {
        Workshop workshop = new Workshop();
        workshop.setSlug(SlugUtil.unique(request.title(), workshops::existsBySlug));
        apply(workshop, request);
        workshops.save(workshop);
        return WorkshopDetail.of(workshop, List.of());
    }

    @Transactional
    public WorkshopDetail update(Long id, WorkshopRequest request) {
        Workshop workshop = workshops.findById(id).orElseThrow(() -> ApiException.notFound("Workshop"));
        apply(workshop, request);
        return WorkshopDetail.of(workshop, allBatches(id));
    }

    private void apply(Workshop w, WorkshopRequest r) {
        w.setTitle(r.title().trim());
        w.setCategory(r.category().trim());
        w.setShortDescription(r.shortDescription().trim());
        w.setOverview(r.overview().trim());
        w.setImageUrl(blankToNull(r.imageUrl()));
        w.setBannerUrl(blankToNull(r.bannerUrl()));
        w.setDuration(r.duration().trim());
        w.setSkillLevel(r.skillLevel());
        w.setPriceInr(r.priceInr());
        w.setLocation(blankToNull(r.location()));
        w.setLearningOutcomes(orEmpty(r.learningOutcomes()));
        w.setCurriculum(orEmpty(r.curriculum()));
        w.setSchedule(orEmpty(r.schedule()));
        w.setMaterialsProvided(orEmpty(r.materialsProvided()));
        w.setWhatToBring(orEmpty(r.whatToBring()));
        w.setFaqs(orEmpty(r.faqs()));
        w.setDisplayOrder(r.displayOrder());
        w.setActive(r.active());
    }

    @Transactional
    public void delete(Long id) {
        Workshop workshop = workshops.findById(id).orElseThrow(() -> ApiException.notFound("Workshop"));
        if (registrations.existsByWorkshopId(id)) {
            throw ApiException.conflict(
                    "This workshop has registrations and cannot be deleted. Mark it inactive to hide it from the website.");
        }
        workshops.delete(workshop);
    }

    @Transactional(readOnly = true)
    public List<BatchResponse> allBatches(Long workshopId) {
        return batches.findByWorkshopIdOrderByStartDateAsc(workshopId).stream()
                .map(b -> BatchResponse.of(b, workshopId))
                .toList();
    }

    @Transactional
    public BatchResponse createBatch(BatchRequest request) {
        validateDates(request);
        Workshop workshop = workshops.findById(request.workshopId())
                .orElseThrow(() -> ApiException.notFound("Workshop"));
        WorkshopBatch batch = new WorkshopBatch();
        batch.setWorkshop(workshop);
        applyBatch(batch, request);
        batches.save(batch);
        return BatchResponse.of(batch, workshop.getId());
    }

    @Transactional
    public BatchResponse updateBatch(Long id, BatchRequest request) {
        validateDates(request);
        WorkshopBatch batch = batches.findByIdForUpdate(id).orElseThrow(() -> ApiException.notFound("Batch"));
        if (!batch.getWorkshop().getId().equals(request.workshopId())) {
            throw ApiException.badRequest("A batch cannot be moved to a different workshop.");
        }
        if (request.totalSeats() < batch.getBookedSeats()) {
            throw ApiException.conflict("This batch already has " + batch.getBookedSeats()
                    + " seats booked, so total seats cannot be lower than that.");
        }
        applyBatch(batch, request);
        return BatchResponse.of(batch, batch.getWorkshop().getId());
    }

    @Transactional
    public void deleteBatch(Long id) {
        WorkshopBatch batch = batches.findById(id).orElseThrow(() -> ApiException.notFound("Batch"));
        if (registrations.existsByBatchId(id)) {
            throw ApiException.conflict(
                    "This batch has registrations and cannot be deleted. Mark it inactive to close it instead.");
        }
        batches.delete(batch);
    }

    private static void validateDates(BatchRequest request) {
        if (request.endDate().isBefore(request.startDate())) {
            throw ApiException.badRequest("End date cannot be before the start date.");
        }
    }

    private static void applyBatch(WorkshopBatch batch, BatchRequest r) {
        batch.setLabel(blankToNull(r.label()));
        batch.setStartDate(r.startDate());
        batch.setEndDate(r.endDate());
        batch.setTotalSeats(r.totalSeats());
        batch.setActive(r.active());
    }

    private static <T> List<T> orEmpty(List<T> list) {
        return list == null ? new ArrayList<>() : new ArrayList<>(list);
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
