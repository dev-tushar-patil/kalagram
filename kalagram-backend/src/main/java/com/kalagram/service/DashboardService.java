package com.kalagram.service;

import com.kalagram.dto.Dtos.Dashboard;
import com.kalagram.dto.Dtos.RegistrationAdminView;
import com.kalagram.entity.Enums;
import com.kalagram.repository.Repositories.EnquiryRepository;
import com.kalagram.repository.Repositories.RegistrationRepository;
import com.kalagram.repository.Repositories.WorkshopBatchRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;

@Service
public class DashboardService {

    private final RegistrationRepository registrations;
    private final WorkshopBatchRepository batches;
    private final EnquiryRepository enquiries;

    public DashboardService(RegistrationRepository registrations, WorkshopBatchRepository batches,
                            EnquiryRepository enquiries) {
        this.registrations = registrations;
        this.batches = batches;
        this.enquiries = enquiries;
    }

    @Transactional(readOnly = true)
    public Dashboard summary() {
        return new Dashboard(
                registrations.count(),
                batches.countByActiveTrueAndStartDateAfter(LocalDate.now()),
                enquiries.count(),
                enquiries.countByStatus(Enums.EnquiryStatus.NEW),
                registrations.sumParticipantsExcluding(Enums.RegistrationStatus.CANCELLED),
                registrations.countByCreatedAtAfter(Instant.now().minus(Duration.ofDays(30))),
                registrations.findTop8ByOrderByCreatedAtDesc().stream().map(RegistrationAdminView::of).toList());
    }
}
