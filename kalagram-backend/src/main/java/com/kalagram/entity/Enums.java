package com.kalagram.entity;

public final class Enums {

    private Enums() {}

    public enum SkillLevel { BEGINNER, INTERMEDIATE, ADVANCED, ALL_LEVELS }

    public enum RegistrationStatus {
        PENDING, CONFIRMED, CANCELLED, COMPLETED;

        /** Cancelled registrations give their seats back; every other status holds them. */
        public boolean holdsSeats() {
            return this != CANCELLED;
        }
    }

    public enum EnquiryStatus { NEW, IN_PROGRESS, RESOLVED, CLOSED }

    public enum GalleryCategory { MUD_HOUSES, WORKSHOPS, MATERIALS, SPACES_INTERIORS, CAMPUS_NATURE }

    public enum ResourceType { ARTICLE, GUIDE, VIDEO, DOWNLOAD }
}
