package com.kalagram.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "gallery_images")
@Getter
@Setter
public class GalleryImage extends BaseEntity {

    @Column(nullable = false)
    private String title;

    @Column(name = "alt_text")
    private String altText;

    @Column(name = "image_url", nullable = false)
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Enums.GalleryCategory category;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;
}
