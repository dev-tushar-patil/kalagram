CREATE TABLE admin_users (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    email         VARCHAR(160) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    display_name  VARCHAR(120) NOT NULL,
    active        BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    CONSTRAINT uq_admin_users_email UNIQUE (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE workshops (
    id                 BIGINT AUTO_INCREMENT PRIMARY KEY,
    slug               VARCHAR(160) NOT NULL,
    title              VARCHAR(160) NOT NULL,
    category           VARCHAR(120) NOT NULL,
    short_description  VARCHAR(500) NOT NULL,
    overview           TEXT         NOT NULL,
    image_url          VARCHAR(500),
    banner_url         VARCHAR(500),
    duration           VARCHAR(60)  NOT NULL,
    skill_level        VARCHAR(20)  NOT NULL,
    price_inr          DECIMAL(10, 2),
    location           VARCHAR(200),
    learning_outcomes  TEXT,
    curriculum         TEXT,
    schedule           TEXT,
    materials_provided TEXT,
    what_to_bring      TEXT,
    faqs               TEXT,
    display_order      INT          NOT NULL DEFAULT 0,
    active             BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    CONSTRAINT uq_workshops_slug UNIQUE (slug),
    INDEX idx_workshops_active_order (active, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE workshop_batches (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    workshop_id  BIGINT       NOT NULL,
    label        VARCHAR(120),
    start_date   DATE         NOT NULL,
    end_date     DATE         NOT NULL,
    total_seats  INT          NOT NULL,
    booked_seats INT          NOT NULL DEFAULT 0,
    active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    CONSTRAINT fk_batches_workshop FOREIGN KEY (workshop_id) REFERENCES workshops (id) ON DELETE CASCADE,
    CONSTRAINT chk_batches_seats CHECK (booked_seats >= 0 AND booked_seats <= total_seats),
    CONSTRAINT chk_batches_dates CHECK (end_date >= start_date),
    INDEX idx_batches_workshop_start (workshop_id, start_date),
    INDEX idx_batches_start (start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE workshop_registrations (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    registration_id VARCHAR(24)  NOT NULL,
    workshop_id     BIGINT       NOT NULL,
    batch_id        BIGINT       NOT NULL,
    full_name       VARCHAR(120) NOT NULL,
    email           VARCHAR(160) NOT NULL,
    mobile          VARCHAR(20)  NOT NULL,
    participants    INT          NOT NULL,
    city            VARCHAR(100),
    message         VARCHAR(2000),
    status          VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    created_at      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    CONSTRAINT uq_registrations_public_id UNIQUE (registration_id),
    CONSTRAINT fk_registrations_workshop FOREIGN KEY (workshop_id) REFERENCES workshops (id),
    CONSTRAINT fk_registrations_batch FOREIGN KEY (batch_id) REFERENCES workshop_batches (id),
    INDEX idx_registrations_created (created_at),
    INDEX idx_registrations_status (status),
    INDEX idx_registrations_mobile (mobile),
    INDEX idx_registrations_name (full_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE enquiries (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    name           VARCHAR(120) NOT NULL,
    email          VARCHAR(160) NOT NULL,
    phone          VARCHAR(20)  NOT NULL,
    enquiry_for    VARCHAR(120) NOT NULL,
    message        VARCHAR(2000) NOT NULL,
    status         VARCHAR(20)  NOT NULL DEFAULT 'NEW',
    internal_notes TEXT,
    created_at     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    INDEX idx_enquiries_status_created (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE gallery_images (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    title         VARCHAR(160) NOT NULL,
    alt_text      VARCHAR(300),
    image_url     VARCHAR(500) NOT NULL,
    category      VARCHAR(30)  NOT NULL,
    display_order INT          NOT NULL DEFAULT 0,
    created_at    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    INDEX idx_gallery_category_order (category, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE resource_categories (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    description   VARCHAR(255),
    icon          VARCHAR(40),
    display_order INT          NOT NULL DEFAULT 0,
    created_at    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    CONSTRAINT uq_resource_categories_name UNIQUE (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE resources (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    slug              VARCHAR(180) NOT NULL,
    title             VARCHAR(180) NOT NULL,
    category_id       BIGINT       NOT NULL,
    type              VARCHAR(20)  NOT NULL,
    short_description VARCHAR(500) NOT NULL,
    body              MEDIUMTEXT,
    thumbnail_url     VARCHAR(500),
    file_url          VARCHAR(500),
    video_url         VARCHAR(500),
    reading_minutes   INT,
    featured          BOOLEAN      NOT NULL DEFAULT FALSE,
    published         BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    CONSTRAINT uq_resources_slug UNIQUE (slug),
    CONSTRAINT fk_resources_category FOREIGN KEY (category_id) REFERENCES resource_categories (id),
    INDEX idx_resources_published (published, featured)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE site_settings (
    setting_key   VARCHAR(60) PRIMARY KEY,
    setting_value TEXT,
    updated_at    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
