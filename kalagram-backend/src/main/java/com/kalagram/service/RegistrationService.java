package com.kalagram.service;

import com.kalagram.dto.Dtos.PageResponse;
import com.kalagram.dto.Dtos.RegistrationAdminView;
import com.kalagram.dto.Dtos.RegistrationConfirmation;
import com.kalagram.dto.Dtos.RegistrationRequest;
import com.kalagram.entity.Enums.RegistrationStatus;
import com.kalagram.entity.WorkshopBatch;
import com.kalagram.entity.WorkshopRegistration;
import com.kalagram.exception.ApiException;
import com.kalagram.integration.RegistrationCreatedEvent;
import com.kalagram.repository.Repositories.RegistrationRepository;
import com.kalagram.repository.Repositories.WorkshopBatchRepository;
import com.kalagram.util.CsvUtil;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class RegistrationService {

    private static final String ID_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
    private static final ZoneId INDIA = ZoneId.of("Asia/Kolkata");

    private final SecureRandom random = new SecureRandom();
    private final RegistrationRepository registrations;
    private final WorkshopBatchRepository batches;
    private final ApplicationEventPublisher events;

    public RegistrationService(RegistrationRepository registrations, WorkshopBatchRepository batches,
                               ApplicationEventPublisher events) {
        this.registrations = registrations;
        this.batches = batches;
        this.events = events;
    }

    /**
     * Seats are taken while holding a row lock on the batch, so concurrent requests cannot overbook:
     * each one re-reads the seat count only after the previous transaction has committed.
     */
    @Transactional
    public RegistrationConfirmation create(RegistrationRequest request) {
        WorkshopBatch batch = batches.findByIdForUpdate(request.batchId())
                .orElseThrow(() -> ApiException.notFound("Batch"));
        if (!batch.getWorkshop().getId().equals(request.workshopId())) {
            throw ApiException.badRequest("That batch does not belong to the selected workshop.");
        }
        if (!batch.getWorkshop().isActive() || !batch.isActive() || !batch.getStartDate().isAfter(LocalDate.now(INDIA))) {
            throw ApiException.conflict("This batch is no longer open for registration. Please choose another date.");
        }
        int seatsLeft = batch.availableSeats();
        if (seatsLeft < request.participants()) {
            throw ApiException.conflict(seatsLeft == 0
                    ? "This batch is full. Please choose another date."
                    : "Only " + seatsLeft + (seatsLeft == 1 ? " seat is" : " seats are") + " left in this batch.");
        }
        batch.setBookedSeats(batch.getBookedSeats() + request.participants());

        WorkshopRegistration registration = new WorkshopRegistration();
        registration.setRegistrationId(newRegistrationId());
        registration.setWorkshop(batch.getWorkshop());
        registration.setBatch(batch);
        registration.setFullName(request.fullName().trim());
        registration.setEmail(request.email().trim());
        registration.setMobile(request.mobile().trim());
        registration.setParticipants(request.participants());
        registration.setCity(blankToNull(request.city()));
        registration.setMessage(blankToNull(request.message()));
        registrations.save(registration);

        RegistrationConfirmation confirmation = RegistrationConfirmation.of(registration);
        events.publishEvent(new RegistrationCreatedEvent(confirmation));
        return confirmation;
    }

    private String newRegistrationId() {
        String id;
        do {
            StringBuilder code = new StringBuilder("KG-").append(LocalDate.now(INDIA).getYear()).append('-');
            for (int i = 0; i < 6; i++) {
                code.append(ID_ALPHABET.charAt(random.nextInt(ID_ALPHABET.length())));
            }
            id = code.toString();
        } while (registrations.existsByRegistrationId(id));
        return id;
    }

    @Transactional(readOnly = true)
    public PageResponse<RegistrationAdminView> search(String q, Long workshopId, RegistrationStatus status,
                                                      LocalDate from, LocalDate to, int page, int size) {
        var pageable = PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, 100), Sort.by(Sort.Direction.DESC, "createdAt"));
        return PageResponse.of(registrations.findAll(filter(q, workshopId, status, from, to), pageable)
                .map(RegistrationAdminView::of));
    }

    @Transactional(readOnly = true)
    public RegistrationAdminView get(Long id) {
        return registrations.findById(id).map(RegistrationAdminView::of)
                .orElseThrow(() -> ApiException.notFound("Registration"));
    }

    /** Moving into or out of CANCELLED releases or re-takes seats, re-checking availability. */
    @Transactional
    public RegistrationAdminView updateStatus(Long id, RegistrationStatus next) {
        Long batchId = registrations.findById(id).orElseThrow(() -> ApiException.notFound("Registration"))
                .getBatch().getId();
        WorkshopBatch batch = batches.findByIdForUpdate(batchId).orElseThrow(() -> ApiException.notFound("Batch"));
        WorkshopRegistration registration = registrations.findById(id).orElseThrow();

        boolean heldSeats = registration.getStatus().holdsSeats();
        if (heldSeats && !next.holdsSeats()) {
            batch.setBookedSeats(Math.max(0, batch.getBookedSeats() - registration.getParticipants()));
        } else if (!heldSeats && next.holdsSeats()) {
            if (batch.availableSeats() < registration.getParticipants()) {
                throw ApiException.conflict("Not enough seats left in this batch to reinstate this registration.");
            }
            batch.setBookedSeats(batch.getBookedSeats() + registration.getParticipants());
        }
        registration.setStatus(next);
        return RegistrationAdminView.of(registration);
    }

    @Transactional(readOnly = true)
    public String exportCsv(String q, Long workshopId, RegistrationStatus status, LocalDate from, LocalDate to) {
        StringBuilder csv = new StringBuilder("﻿"); // BOM so Excel reads UTF-8 names correctly
        csv.append(CsvUtil.row("Registration ID", "Status", "Name", "Email", "Mobile", "Workshop", "Batch start",
                "Batch end", "Participants", "City", "Message", "Registered at (UTC)"));
        registrations.findAll(filter(q, workshopId, status, from, to), Sort.by(Sort.Direction.DESC, "createdAt"))
                .forEach(r -> csv.append(CsvUtil.row(r.getRegistrationId(), r.getStatus(), r.getFullName(), r.getEmail(),
                        r.getMobile(), r.getWorkshop().getTitle(), r.getBatch().getStartDate(), r.getBatch().getEndDate(),
                        r.getParticipants(), r.getCity(), r.getMessage(), r.getCreatedAt())));
        return csv.toString();
    }

    private Specification<WorkshopRegistration> filter(String q, Long workshopId, RegistrationStatus status,
                                                       LocalDate from, LocalDate to) {
        return (root, query, cb) -> {
            // Fetch for the row query only; count queries cannot fetch.
            if (query.getResultType() != Long.class && query.getResultType() != long.class) {
                root.fetch("workshop", JoinType.INNER);
                root.fetch("batch", JoinType.INNER);
            }
            List<Predicate> where = new ArrayList<>();
            if (q != null && !q.isBlank()) {
                String like = "%" + q.trim().toLowerCase(Locale.ROOT).replace("\\", "\\\\")
                        .replace("%", "\\%").replace("_", "\\_") + "%";
                where.add(cb.or(cb.like(cb.lower(root.get("fullName")), like, '\\'),
                        cb.like(root.get("mobile"), like, '\\'),
                        cb.like(cb.lower(root.get("registrationId")), like, '\\')));
            }
            if (workshopId != null) {
                where.add(cb.equal(root.get("workshop").get("id"), workshopId));
            }
            if (status != null) {
                where.add(cb.equal(root.get("status"), status));
            }
            if (from != null) {
                where.add(cb.greaterThanOrEqualTo(root.<Instant>get("createdAt"), from.atStartOfDay(INDIA).toInstant()));
            }
            if (to != null) {
                where.add(cb.lessThan(root.<Instant>get("createdAt"), to.plusDays(1).atStartOfDay(INDIA).toInstant()));
            }
            return cb.and(where.toArray(Predicate[]::new));
        };
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
