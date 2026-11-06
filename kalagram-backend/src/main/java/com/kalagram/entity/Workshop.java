package com.kalagram.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "workshops")
@Getter
@Setter
public class Workshop extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String category;

    @Column(name = "short_description", nullable = false)
    private String shortDescription;

    @Column(nullable = false)
    private String overview;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "banner_url")
    private String bannerUrl;

    @Column(nullable = false)
    private String duration;

    @Enumerated(EnumType.STRING)
    @Column(name = "skill_level", nullable = false)
    private Enums.SkillLevel skillLevel;

    @Column(name = "price_inr")
    private BigDecimal priceInr;

    private String location;

    @Convert(converter = JsonConverters.StringList.class)
    @Column(name = "learning_outcomes")
    private List<String> learningOutcomes = new ArrayList<>();

    @Convert(converter = JsonConverters.StringList.class)
    private List<String> curriculum = new ArrayList<>();

    @Convert(converter = JsonConverters.ScheduleList.class)
    private List<JsonConverters.ScheduleDay> schedule = new ArrayList<>();

    @Convert(converter = JsonConverters.StringList.class)
    @Column(name = "materials_provided")
    private List<String> materialsProvided = new ArrayList<>();

    @Convert(converter = JsonConverters.StringList.class)
    @Column(name = "what_to_bring")
    private List<String> whatToBring = new ArrayList<>();

    @Convert(converter = JsonConverters.FaqList.class)
    private List<JsonConverters.Faq> faqs = new ArrayList<>();

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @Column(nullable = false)
    private boolean active = true;

    @OneToMany(mappedBy = "workshop", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("startDate ASC")
    private List<WorkshopBatch> batches = new ArrayList<>();
}
