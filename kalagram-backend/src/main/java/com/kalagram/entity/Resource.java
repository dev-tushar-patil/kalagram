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
@Table(name = "resources")
@Getter
@Setter
public class Resource extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(nullable = false)
    private String title;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private ResourceCategory category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Enums.ResourceType type;

    @Column(name = "short_description", nullable = false)
    private String shortDescription;

    private String body;

    @Column(name = "thumbnail_url")
    private String thumbnailUrl;

    @Column(name = "file_url")
    private String fileUrl;

    @Column(name = "video_url")
    private String videoUrl;

    @Column(name = "reading_minutes")
    private Integer readingMinutes;

    @Column(nullable = false)
    private boolean featured;

    @Column(nullable = false)
    private boolean published = true;
}
