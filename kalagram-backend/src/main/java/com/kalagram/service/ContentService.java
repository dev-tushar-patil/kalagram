package com.kalagram.service;

import com.kalagram.dto.Dtos.CategoryRequest;
import com.kalagram.dto.Dtos.CategoryView;
import com.kalagram.dto.Dtos.EnquiryCreated;
import com.kalagram.dto.Dtos.EnquiryRequest;
import com.kalagram.dto.Dtos.EnquiryUpdate;
import com.kalagram.dto.Dtos.EnquiryView;
import com.kalagram.dto.Dtos.GalleryRequest;
import com.kalagram.dto.Dtos.GalleryView;
import com.kalagram.dto.Dtos.PageResponse;
import com.kalagram.dto.Dtos.ResourceRequest;
import com.kalagram.dto.Dtos.ResourceView;
import com.kalagram.entity.Enquiry;
import com.kalagram.entity.Enums;
import com.kalagram.entity.GalleryImage;
import com.kalagram.entity.Resource;
import com.kalagram.entity.ResourceCategory;
import com.kalagram.exception.ApiException;
import com.kalagram.repository.Repositories.EnquiryRepository;
import com.kalagram.repository.Repositories.GalleryImageRepository;
import com.kalagram.repository.Repositories.ResourceCategoryRepository;
import com.kalagram.repository.Repositories.ResourceRepository;
import com.kalagram.util.SlugUtil;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Enquiries, gallery images and the resource library: plain CRUD with no shared state. */
@Service
public class ContentService {

    private final EnquiryRepository enquiries;
    private final GalleryImageRepository gallery;
    private final ResourceRepository resources;
    private final ResourceCategoryRepository categories;
    private final FileStorageService files;

    public ContentService(EnquiryRepository enquiries, GalleryImageRepository gallery, ResourceRepository resources,
                          ResourceCategoryRepository categories, FileStorageService files) {
        this.enquiries = enquiries;
        this.gallery = gallery;
        this.resources = resources;
        this.categories = categories;
        this.files = files;
    }

    // ---- Enquiries -----------------------------------------------------------------------------

    @Transactional
    public EnquiryCreated createEnquiry(EnquiryRequest r) {
        Enquiry enquiry = new Enquiry();
        enquiry.setName(r.name().trim());
        enquiry.setEmail(r.email().trim());
        enquiry.setPhone(r.phone().trim());
        enquiry.setEnquiryFor(r.enquiryFor().trim());
        enquiry.setMessage(r.message().trim());
        return new EnquiryCreated(enquiries.save(enquiry).getId());
    }

    @Transactional(readOnly = true)
    public PageResponse<EnquiryView> listEnquiries(Enums.EnquiryStatus status, int page, int size) {
        var pageable = PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, 100), Sort.by(Sort.Direction.DESC, "createdAt"));
        var result = status == null ? enquiries.findAll(pageable) : enquiries.findByStatus(status, pageable);
        return PageResponse.of(result.map(EnquiryView::of));
    }

    @Transactional
    public EnquiryView updateEnquiry(Long id, EnquiryUpdate update) {
        Enquiry enquiry = enquiries.findById(id).orElseThrow(() -> ApiException.notFound("Enquiry"));
        enquiry.setStatus(update.status());
        enquiry.setInternalNotes(update.internalNotes());
        return EnquiryView.of(enquiry);
    }

    // ---- Gallery -------------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<GalleryView> listGallery(Enums.GalleryCategory category) {
        var images = category == null
                ? gallery.findAllByOrderByDisplayOrderAscIdDesc()
                : gallery.findByCategoryOrderByDisplayOrderAscIdDesc(category);
        return images.stream().map(GalleryView::of).toList();
    }

    @Transactional
    public GalleryView createGalleryImage(GalleryRequest r) {
        GalleryImage image = new GalleryImage();
        applyGallery(image, r);
        return GalleryView.of(gallery.save(image));
    }

    @Transactional
    public GalleryView updateGalleryImage(Long id, GalleryRequest r) {
        GalleryImage image = gallery.findById(id).orElseThrow(() -> ApiException.notFound("Gallery image"));
        String previous = image.getImageUrl();
        applyGallery(image, r);
        if (!previous.equals(image.getImageUrl())) {
            files.deleteIfUploaded(previous);
        }
        return GalleryView.of(image);
    }

    @Transactional
    public void deleteGalleryImage(Long id) {
        GalleryImage image = gallery.findById(id).orElseThrow(() -> ApiException.notFound("Gallery image"));
        gallery.delete(image);
        files.deleteIfUploaded(image.getImageUrl());
    }

    private static void applyGallery(GalleryImage image, GalleryRequest r) {
        image.setTitle(r.title().trim());
        image.setAltText(r.altText());
        image.setImageUrl(r.imageUrl());
        image.setCategory(r.category());
        image.setDisplayOrder(r.displayOrder());
    }

    // ---- Resources -----------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<CategoryView> listCategories() {
        return categories.findAllByOrderByDisplayOrderAscIdAsc().stream().map(CategoryView::of).toList();
    }

    @Transactional
    public CategoryView createCategory(CategoryRequest r) {
        ResourceCategory category = new ResourceCategory();
        applyCategory(category, r);
        return CategoryView.of(categories.save(category));
    }

    @Transactional
    public CategoryView updateCategory(Long id, CategoryRequest r) {
        ResourceCategory category = categories.findById(id).orElseThrow(() -> ApiException.notFound("Category"));
        applyCategory(category, r);
        return CategoryView.of(category);
    }

    @Transactional
    public void deleteCategory(Long id) {
        ResourceCategory category = categories.findById(id).orElseThrow(() -> ApiException.notFound("Category"));
        if (resources.existsByCategoryId(id)) {
            throw ApiException.conflict("This category still has resources. Move or delete them first.");
        }
        categories.delete(category);
    }

    private static void applyCategory(ResourceCategory category, CategoryRequest r) {
        category.setName(r.name().trim());
        category.setDescription(r.description());
        category.setIcon(r.icon());
        category.setDisplayOrder(r.displayOrder());
    }

    @Transactional(readOnly = true)
    public List<ResourceView> listPublishedResources(Long categoryId) {
        return resources.findByPublishedTrueOrderByFeaturedDescCreatedAtDesc().stream()
                .filter(r -> categoryId == null || r.getCategory().getId().equals(categoryId))
                .map(r -> ResourceView.of(r, false))
                .toList();
    }

    @Transactional(readOnly = true)
    public ResourceView getPublishedResource(String idOrSlug) {
        var found = idOrSlug.matches("\\d{1,18}")
                ? resources.findById(Long.parseLong(idOrSlug))
                : resources.findBySlug(idOrSlug);
        Resource resource = found.filter(Resource::isPublished).orElseThrow(() -> ApiException.notFound("Resource"));
        return ResourceView.of(resource, true);
    }

    @Transactional(readOnly = true)
    public List<ResourceView> listAllResources() {
        return resources.findAllByOrderByCreatedAtDesc().stream().map(r -> ResourceView.of(r, true)).toList();
    }

    @Transactional
    public ResourceView createResource(ResourceRequest r) {
        Resource resource = new Resource();
        resource.setSlug(SlugUtil.unique(r.title(), resources::existsBySlug));
        applyResource(resource, r);
        return ResourceView.of(resources.save(resource), true);
    }

    @Transactional
    public ResourceView updateResource(Long id, ResourceRequest r) {
        Resource resource = resources.findById(id).orElseThrow(() -> ApiException.notFound("Resource"));
        applyResource(resource, r);
        return ResourceView.of(resource, true);
    }

    @Transactional
    public void deleteResource(Long id) {
        Resource resource = resources.findById(id).orElseThrow(() -> ApiException.notFound("Resource"));
        resources.delete(resource);
        files.deleteIfUploaded(resource.getThumbnailUrl());
        files.deleteIfUploaded(resource.getFileUrl());
    }

    private void applyResource(Resource resource, ResourceRequest r) {
        ResourceCategory category = categories.findById(r.categoryId())
                .orElseThrow(() -> ApiException.badRequest("That category no longer exists."));
        requireTypeContent(r);
        resource.setTitle(r.title().trim());
        resource.setCategory(category);
        resource.setType(r.type());
        resource.setShortDescription(r.shortDescription().trim());
        resource.setBody(r.body());
        resource.setThumbnailUrl(blankToNull(r.thumbnailUrl()));
        resource.setFileUrl(blankToNull(r.fileUrl()));
        resource.setVideoUrl(blankToNull(r.videoUrl()));
        resource.setReadingMinutes(r.readingMinutes());
        resource.setFeatured(r.featured());
        resource.setPublished(r.published());
    }

    private static void requireTypeContent(ResourceRequest r) {
        boolean missing = switch (r.type()) {
            case VIDEO -> blank(r.videoUrl());
            case DOWNLOAD -> blank(r.fileUrl());
            case ARTICLE, GUIDE -> blank(r.body()) && blank(r.fileUrl());
        };
        if (missing) {
            throw ApiException.badRequest(switch (r.type()) {
                case VIDEO -> "A video resource needs a video link.";
                case DOWNLOAD -> "A download resource needs an uploaded file.";
                case ARTICLE, GUIDE -> "Add the text of this resource, or attach a PDF.";
            });
        }
    }

    private static boolean blank(String value) {
        return value == null || value.isBlank();
    }

    private static String blankToNull(String value) {
        return blank(value) ? null : value.trim();
    }
}
