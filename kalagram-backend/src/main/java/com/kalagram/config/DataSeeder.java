package com.kalagram.config;

import com.kalagram.entity.AdminUser;
import com.kalagram.entity.Enums;
import com.kalagram.entity.Enums.GalleryCategory;
import com.kalagram.entity.Enums.ResourceType;
import com.kalagram.entity.GalleryImage;
import com.kalagram.entity.JsonConverters.Faq;
import com.kalagram.entity.JsonConverters.ScheduleDay;
import com.kalagram.entity.Resource;
import com.kalagram.entity.ResourceCategory;
import com.kalagram.entity.Workshop;
import com.kalagram.entity.WorkshopBatch;
import com.kalagram.repository.Repositories.AdminUserRepository;
import com.kalagram.repository.Repositories.GalleryImageRepository;
import com.kalagram.repository.Repositories.ResourceCategoryRepository;
import com.kalagram.repository.Repositories.ResourceRepository;
import com.kalagram.repository.Repositories.WorkshopRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;

/**
 * Creates the first admin from environment variables and, when each table is empty, inserts sample content.
 * Sample dates and copy are placeholders for the business to replace through the admin panel. Prices are left
 * unset so no invented fee can reach a visitor: the site shows "Price on request" until one is configured.
 */
@Component
public class DataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);
    private static final String LOCATION = "Kalagram, Pune, Maharashtra";

    private final KalagramProperties properties;
    private final AdminUserRepository admins;
    private final PasswordEncoder encoder;
    private final WorkshopRepository workshops;
    private final GalleryImageRepository gallery;
    private final ResourceRepository resources;
    private final ResourceCategoryRepository categories;

    public DataSeeder(KalagramProperties properties, AdminUserRepository admins, PasswordEncoder encoder,
                      WorkshopRepository workshops, GalleryImageRepository gallery, ResourceRepository resources,
                      ResourceCategoryRepository categories) {
        this.properties = properties;
        this.admins = admins;
        this.encoder = encoder;
        this.workshops = workshops;
        this.gallery = gallery;
        this.resources = resources;
        this.categories = categories;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        seedAdmin();
        if (properties.seedSampleData()) {
            if (workshops.count() == 0) {
                seedWorkshops();
            }
            if (gallery.count() == 0) {
                seedGallery();
            }
            if (categories.count() == 0) {
                seedResources();
            }
        }
    }

    private void seedAdmin() {
        if (admins.count() > 0) {
            return;
        }
        String email = properties.admin().email();
        String password = properties.admin().password();
        if (email == null || email.isBlank() || password == null || password.length() < 10) {
            log.warn("No admin account exists. Set ADMIN_EMAIL and ADMIN_PASSWORD (10+ characters) and restart to create one.");
            return;
        }
        AdminUser admin = new AdminUser();
        admin.setEmail(email.trim().toLowerCase(Locale.ROOT));
        admin.setPasswordHash(encoder.encode(password));
        admin.setDisplayName("Kalagram Admin");
        admins.save(admin);
        log.info("Created first admin account {}", admin.getEmail());
    }

    private void seedWorkshops() {
        LocalDate base = LocalDate.now().plusWeeks(3);

        Workshop mud = workshop(1, "mud-house-building-workshop", "Mud House Building Workshop", "Mud House Building",
                "Learn the complete process of building a mud house, from foundation to finish.",
                """
                An immersive, hands-on programme covering the full journey of an earthen home. You will read a site, test soil, \
                lay foundations, raise walls and finish them, working alongside experienced builders on a real structure.

                The workshop suits first-time builders, homeowners, architects and anyone curious about living closer to the earth.\
                """,
                "/images/workshops/mud-house.webp", "5-7 Days", Enums.SkillLevel.BEGINNER,
                List.of("Reading a site and testing soil by hand", "Laying foundations and plinths for earthen walls",
                        "Making and laying sun-dried earth blocks", "Raising walls, lintels and openings",
                        "Understanding roofing options for mud houses", "Maintaining an earthen home through the seasons"),
                List.of("Principles of natural building", "Soil identification and field tests", "Foundations and plinth protection",
                        "Earth block making and masonry", "Wall openings, lintels and roof connections", "Plaster basics and care of the finished home"),
                List.of(new ScheduleDay("Day 1", "Earth and site", "Introduction, site reading and soil tests."),
                        new ScheduleDay("Day 2", "Foundations", "Setting out, trenches and the stone plinth."),
                        new ScheduleDay("Day 3", "Blocks", "Mixing, moulding and curing earth blocks."),
                        new ScheduleDay("Day 4", "Walls", "Block laying, bonding and corners."),
                        new ScheduleDay("Day 5", "Openings", "Doors, windows and lintels."),
                        new ScheduleDay("Day 6", "Roof and plaster", "Roof connections and first plaster coat."),
                        new ScheduleDay("Day 7", "Finishing", "Finishes, maintenance and sharing session.")),
                List.of("All tools and building materials", "Printed workshop notes", "Safety gloves"),
                List.of("Comfortable work clothes you don't mind muddying", "Closed footwear", "Hat and water bottle", "Notebook"),
                mudFaqs());
        batch(mud, "Upcoming batch", base, base.plusDays(6), 20);
        batch(mud, "Following batch", base.plusWeeks(8), base.plusWeeks(8).plusDays(6), 20);

        Workshop materials = workshop(2, "natural-materials-mix-design", "Natural Materials & Mix Design", "Natural Materials",
                "Understand soil, clay, sand, lime and other local materials and how to prepare the right mixes.",
                """
                A focused material workshop on what goes into a durable earthen wall. Test local soils, work out proportions and \
                compare stabilisers, then take home a method you can repeat on any site.\
                """,
                "/images/workshops/materials.webp", "2-3 Days", Enums.SkillLevel.ALL_LEVELS,
                List.of("Identifying soil, clay and sand by hand", "Running simple field tests", "Designing mixes for walls, blocks and plaster", "Working with lime and natural additives"),
                List.of("Understanding earth as a material", "Field testing methods", "Mix proportions and trial samples", "Lime and natural additives"),
                List.of(new ScheduleDay("Day 1", "Know your soil", "Field tests and soil identification."),
                        new ScheduleDay("Day 2", "Mix design", "Preparing samples and comparing results."),
                        new ScheduleDay("Day 3", "Application", "Using mixes in blocks and plaster.")),
                List.of("Soil samples, lime and additives", "Testing equipment", "Workshop notes"),
                List.of("Work clothes", "Notebook", "A soil sample from your own site, if you have one"),
                commonFaqs());
        batch(materials, "Upcoming batch", base.plusWeeks(2), base.plusWeeks(2).plusDays(2), 24);

        Workshop plaster = workshop(3, "earthen-plaster-finishes", "Earthen Plaster & Finishes", "Plaster & Finishes",
                "Hands-on training in wall plastering, natural finishes, textures and protective coats.",
                """
                Learn to prepare and apply earthen plasters, from base coat to decorative finish. You will practise on real walls \
                and try traditional textures and motifs along the way.\
                """,
                "/images/workshops/plaster.webp", "3 Days", Enums.SkillLevel.BEGINNER,
                List.of("Preparing walls for plaster", "Mixing base and finish coats", "Applying textures and traditional motifs", "Protective coats and repairs"),
                List.of("Plaster science and surface preparation", "Base coat application", "Finish coats and textures", "Decorative motifs and protective treatments"),
                List.of(new ScheduleDay("Day 1", "Preparing", "Surface preparation and base coat."),
                        new ScheduleDay("Day 2", "Finishing", "Finish coats and textures."),
                        new ScheduleDay("Day 3", "Detail", "Motifs, protective coats and repairs.")),
                List.of("Plaster materials", "Trowels and floats", "Workshop notes"),
                List.of("Work clothes", "Closed footwear", "Water bottle"),
                commonFaqs());
        batch(plaster, "Upcoming batch", base.plusWeeks(4), base.plusWeeks(4).plusDays(2), 18);

        Workshop living = workshop(4, "sustainable-living-spaces", "Sustainable Living Spaces", "Sustainable Design",
                "Designing healthy, comfortable and climate-responsive spaces with natural building principles.",
                """
                A design-led workshop on orientation, daylight, ventilation and thermal comfort. Study built examples and sketch a \
                climate-responsive plan for a home of your own.\
                """,
                "/images/workshops/living.webp", "2-3 Days", Enums.SkillLevel.INTERMEDIATE,
                List.of("Passive cooling and ventilation", "Daylight and orientation", "Planning for local climate", "Choosing low-impact materials"),
                List.of("Climate and site response", "Passive design strategies", "Material choices", "Sketch design studio"),
                List.of(new ScheduleDay("Day 1", "Climate and site", "Orientation, sun and wind."),
                        new ScheduleDay("Day 2", "Design studio", "Sketching a climate-responsive plan."),
                        new ScheduleDay("Day 3", "Review", "Presentations and discussion.")),
                List.of("Drawing materials", "Reference notes"),
                List.of("Notebook", "Any site drawings you would like to discuss"),
                commonFaqs());
        batch(living, "Upcoming batch", base.plusWeeks(6), base.plusWeeks(6).plusDays(2), 20);

        workshops.saveAll(List.of(mud, materials, plaster, living));
    }

    private static List<Faq> commonFaqs() {
        return List.of(
                new Faq("Do I need any prior experience?", "No prior building experience is needed unless the skill level says otherwise. Our facilitators guide you at every step."),
                new Faq("Is accommodation included?", "Please contact us before registering and we will share the arrangements for your batch."),
                new Faq("How is my seat confirmed?", "Your registration starts as pending. The Kalagram team will contact you with the details and next steps to confirm your seat."));
    }

    private static List<Faq> mudFaqs() {
        return List.of(
                new Faq("Will I be able to build my own mud house after this?", "You will leave with practical experience of each stage and the confidence to plan a small earthen structure. Larger projects should still involve an experienced builder."),
                new Faq("Is the work physically demanding?", "It involves lifting, mixing and working outdoors, at a pace that suits the group. Please tell us about any health conditions when you register."),
                new Faq("How is my seat confirmed?", "Your registration starts as pending. The Kalagram team will contact you with the details and next steps to confirm your seat."));
    }

    private static Workshop workshop(int order, String slug, String title, String category, String shortDescription,
                                     String overview, String image, String duration, Enums.SkillLevel level,
                                     List<String> outcomes, List<String> curriculum, List<ScheduleDay> schedule,
                                     List<String> materials, List<String> bring, List<Faq> faqs) {
        Workshop w = new Workshop();
        w.setSlug(slug);
        w.setTitle(title);
        w.setCategory(category);
        w.setShortDescription(shortDescription);
        w.setOverview(overview);
        w.setImageUrl(image);
        w.setBannerUrl(image);
        w.setDuration(duration);
        w.setSkillLevel(level);
        w.setLocation(LOCATION);
        w.setLearningOutcomes(outcomes);
        w.setCurriculum(curriculum);
        w.setSchedule(schedule);
        w.setMaterialsProvided(materials);
        w.setWhatToBring(bring);
        w.setFaqs(faqs);
        w.setDisplayOrder(order);
        return w;
    }

    private static void batch(Workshop w, String label, LocalDate start, LocalDate end, int seats) {
        WorkshopBatch b = new WorkshopBatch();
        b.setWorkshop(w);
        b.setLabel(label);
        b.setStartDate(start);
        b.setEndDate(end);
        b.setTotalSeats(seats);
        w.getBatches().add(b);
    }

    private void seedGallery() {
        Object[][] rows = {
                {"Veranda of a finished mud house", "house-veranda", GalleryCategory.MUD_HOUSES},
                {"Hands shaping an earth block", "brick-hands", GalleryCategory.MATERIALS},
                {"Thatched learning pavilion", "pavilion", GalleryCategory.CAMPUS_NATURE},
                {"Arched living room with earthen walls", "interior-arch", GalleryCategory.SPACES_INTERIORS},
                {"Traditional white motifs on a mud wall", "wall-art", GalleryCategory.SPACES_INTERIORS},
                {"Workshop circle around fresh earth", "workshop-circle", GalleryCategory.WORKSHOPS},
                {"Close view of earth blocks", "brick-texture", GalleryCategory.MATERIALS},
                {"Timber rafters under a pavilion roof", "roof-rafters", GalleryCategory.SPACES_INTERIORS},
                {"Terracotta pot against an earthen wall", "terracotta-pot", GalleryCategory.SPACES_INTERIORS},
                {"Forest path through the campus", "forest-path", GalleryCategory.CAMPUS_NATURE},
                {"Texture of a hand-finished plaster", "plaster-texture", GalleryCategory.MATERIALS},
        };
        int order = 0;
        for (Object[] row : rows) {
            GalleryImage image = new GalleryImage();
            image.setTitle((String) row[0]);
            image.setAltText((String) row[0]);
            image.setImageUrl("/images/gallery/" + row[1] + ".webp");
            image.setCategory((GalleryCategory) row[2]);
            image.setDisplayOrder(order++);
            gallery.save(image);
        }
    }

    private void seedResources() {
        ResourceCategory guides = category("Guides & Manuals", "Step-by-step learning resources", "book", 1);
        ResourceCategory videos = category("Video Learning", "Watch workshops, techniques and talks", "video", 2);
        ResourceCategory downloads = category("Downloads", "Checklists, templates and reference material", "download", 3);
        ResourceCategory articles = category("Articles & Insights", "Thoughts, stories and learning from the field", "article", 4);

        resource("choosing-natural-building-materials", "Choosing the Right Natural Building Materials", guides, ResourceType.GUIDE,
                "How to read the soil, sand and lime around you and match them to the part of the house you are building.",
                """
                Good earthen building starts with what is already on your land. Before buying anything, dig a small test pit and look at the layers: topsoil full of roots is not suitable for building, but the subsoil beneath it often is.

                Try the jar test. Fill a clear jar one third with soil, top up with water, shake it and leave it overnight. Sand settles first, then silt, then clay. This gives you a rough idea of the proportions you have to work with.

                Use the ribbon test for clay content. Roll a moist handful into a ribbon between thumb and finger. A ribbon that holds to a few centimetres suggests a useful amount of clay; one that breaks at once needs more binder, and one that grows very long may need sand to prevent cracking.

                Always make trial blocks and plaster patches, let them dry fully and check for cracks before committing to a mix. Local builders know their soil well, so ask them too.
                """, "/images/resources/materials.webp", 8, true);
        resource("beginners-guide-earthen-plastering", "A Beginner's Guide to Earthen Plastering", guides, ResourceType.GUIDE,
                "Surface preparation, simple mixes and the hand movements behind a smooth earthen finish.",
                """
                Earthen plaster protects a wall and lets it breathe. Start by brushing off loose material and dampening the wall evenly, so that it does not pull water out of the fresh plaster too quickly.

                A base coat is usually coarser, with more sand and sometimes chopped straw to control cracking. Press it firmly on and leave the surface rough so that the next coat can grip.

                The finish coat uses finer, sieved material. Apply it thinly, then compact it with a float once it has begun to firm up. Many small circular movements give a denser and smoother surface than a few long strokes.

                Keep the plaster out of strong sun and wind while it dries. Slow drying means fewer cracks. Small hairline cracks can be worked closed with a damp float.
                """, "/images/resources/plaster.webp", 10, true);
        resource("why-mud-houses-are-sustainable", "Why Mud Houses Are a Sustainable Choice", articles, ResourceType.ARTICLE,
                "Low embodied energy, natural comfort and a building that can return to the earth.",
                """
                Earth is usually dug from the site itself or close to it, which avoids much of the energy spent on firing, processing and transporting conventional materials.

                Thick earthen walls change temperature slowly. They absorb heat during the day and release it at night, which helps keep rooms comfortable in many Indian climates with less need for mechanical cooling. They also help moderate indoor humidity.

                A well-kept mud house can serve for generations, given a good plinth to keep rising damp out and generous eaves to keep rain off the walls. When an unstabilised earthen building finally reaches the end of its life, its walls can return to the ground or be reused.

                Above all, natural building keeps skills, labour and money within the local community.
                """, "/images/resources/sustainable.webp", 6, true);
        resource("site-readiness-checklist", "Site Readiness Checklist", downloads, ResourceType.ARTICLE,
                "A short checklist of what to look at on your land before planning an earthen home.",
                """
                Use this list when you first walk your site.

                Water: Where does rain flow and collect? Is the groundwater high?
                Soil: Have you dug a test pit and tried the jar and ribbon tests?
                Sun and wind: Which way do the summer sun and the prevailing breeze come from?
                Access: Can materials reach the site? Is water available during construction?
                Trees: Which trees can you keep and build around?
                """, "/images/gallery/house-veranda.webp", 3, false);
        resource("building-with-earth-video-library", "Building With Earth: Video Library", videos, ResourceType.ARTICLE,
                "Workshop films and technique demonstrations will be published here as they are released.",
                """
                We are preparing short films on block making, plaster techniques and stories from past workshops. Please check back soon, or contact us for details of upcoming sessions.
                """, "/images/gallery/workshop-circle.webp", 2, false);
    }

    private ResourceCategory category(String name, String description, String icon, int order) {
        ResourceCategory category = new ResourceCategory();
        category.setName(name);
        category.setDescription(description);
        category.setIcon(icon);
        category.setDisplayOrder(order);
        return categories.save(category);
    }

    private void resource(String slug, String title, ResourceCategory category, ResourceType type, String description,
                          String body, String thumbnail, int minutes, boolean featured) {
        Resource resource = new Resource();
        resource.setSlug(slug);
        resource.setTitle(title);
        resource.setCategory(category);
        resource.setType(type);
        resource.setShortDescription(description);
        resource.setBody(body);
        resource.setThumbnailUrl(thumbnail);
        resource.setReadingMinutes(minutes);
        resource.setFeatured(featured);
        resources.save(resource);
    }
}
