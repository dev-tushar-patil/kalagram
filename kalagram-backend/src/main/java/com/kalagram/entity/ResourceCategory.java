package com.kalagram.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "resource_categories")
@Getter
@Setter
public class ResourceCategory extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String name;

    private String description;

    /** Name of the icon the frontend shows for this category. */
    private String icon;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;
}
