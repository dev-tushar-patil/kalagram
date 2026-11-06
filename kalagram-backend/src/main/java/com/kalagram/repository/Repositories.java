package com.kalagram.repository;

import com.kalagram.entity.AdminUser;
import com.kalagram.entity.Enquiry;
import com.kalagram.entity.Enums;
import com.kalagram.entity.GalleryImage;
import com.kalagram.entity.Resource;
import com.kalagram.entity.ResourceCategory;
import com.kalagram.entity.SiteSetting;
import com.kalagram.entity.Workshop;
import com.kalagram.entity.WorkshopBatch;
import com.kalagram.entity.WorkshopRegistration;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

/** All Spring Data repositories. They are thin enough to read better side by side. */
public final class Repositories {

    private Repositories() {}

    public interface AdminUserRepository extends JpaRepository<AdminUser, Long> {
        Optional<AdminUser> findByEmailIgnoreCase(String email);
    }

    public interface WorkshopRepository extends JpaRepository<Workshop, Long> {
        List<Workshop> findByActiveTrueOrderByDisplayOrderAscIdAsc();

        List<Workshop> findAllByOrderByDisplayOrderAscIdAsc();

        Optional<Workshop> findBySlug(String slug);

        boolean existsBySlug(String slug);
    }

    public interface WorkshopBatchRepository extends JpaRepository<WorkshopBatch, Long> {
        List<WorkshopBatch> findByWorkshopIdOrderByStartDateAsc(Long workshopId);

        List<WorkshopBatch> findByWorkshopIdInOrderByStartDateAsc(Collection<Long> workshopIds);

        /** Serialises seat accounting per batch: concurrent bookings queue on this row lock. */
        @Lock(LockModeType.PESSIMISTIC_WRITE)
        @Query("select b from WorkshopBatch b join fetch b.workshop where b.id = :id")
        Optional<WorkshopBatch> findByIdForUpdate(@Param("id") Long id);

        long countByActiveTrueAndStartDateAfter(LocalDate date);
    }

    public interface RegistrationRepository
            extends JpaRepository<WorkshopRegistration, Long>, JpaSpecificationExecutor<WorkshopRegistration> {

        @EntityGraph(attributePaths = {"workshop", "batch"})
        List<WorkshopRegistration> findTop8ByOrderByCreatedAtDesc();

        boolean existsByRegistrationId(String registrationId);

        boolean existsByBatchId(Long batchId);

        boolean existsByWorkshopId(Long workshopId);

        @Query("select coalesce(sum(r.participants), 0) from WorkshopRegistration r where r.status <> :excluded")
        long sumParticipantsExcluding(@Param("excluded") Enums.RegistrationStatus excluded);

        long countByCreatedAtAfter(Instant after);
    }

    public interface EnquiryRepository extends JpaRepository<Enquiry, Long> {
        Page<Enquiry> findByStatus(Enums.EnquiryStatus status, Pageable pageable);

        long countByStatus(Enums.EnquiryStatus status);
    }

    public interface GalleryImageRepository extends JpaRepository<GalleryImage, Long> {
        List<GalleryImage> findAllByOrderByDisplayOrderAscIdDesc();

        List<GalleryImage> findByCategoryOrderByDisplayOrderAscIdDesc(Enums.GalleryCategory category);
    }

    public interface ResourceCategoryRepository extends JpaRepository<ResourceCategory, Long> {
        List<ResourceCategory> findAllByOrderByDisplayOrderAscIdAsc();
    }

    public interface ResourceRepository extends JpaRepository<Resource, Long> {
        @EntityGraph(attributePaths = "category")
        List<Resource> findByPublishedTrueOrderByFeaturedDescCreatedAtDesc();

        @EntityGraph(attributePaths = "category")
        List<Resource> findAllByOrderByCreatedAtDesc();

        @EntityGraph(attributePaths = "category")
        Optional<Resource> findBySlug(String slug);

        boolean existsBySlug(String slug);

        boolean existsByCategoryId(Long categoryId);
    }

    public interface SiteSettingRepository extends JpaRepository<SiteSetting, String> {}
}
