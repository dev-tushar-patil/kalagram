package com.kalagram.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "enquiries")
@Getter
@Setter
public class Enquiry extends BaseEntity {

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String phone;

    @Column(name = "enquiry_for", nullable = false)
    private String enquiryFor;

    @Column(nullable = false)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Enums.EnquiryStatus status = Enums.EnquiryStatus.NEW;

    @Column(name = "internal_notes")
    private String internalNotes;
}
