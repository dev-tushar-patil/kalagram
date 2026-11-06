package com.kalagram.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "workshop_registrations")
@Getter
@Setter
public class WorkshopRegistration extends BaseEntity {

    @Column(name = "registration_id", nullable = false, unique = true, updatable = false)
    private String registrationId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "workshop_id", nullable = false)
    private Workshop workshop;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "batch_id", nullable = false)
    private WorkshopBatch batch;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String mobile;

    @Column(nullable = false)
    private int participants;

    private String city;

    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Enums.RegistrationStatus status = Enums.RegistrationStatus.PENDING;
}
