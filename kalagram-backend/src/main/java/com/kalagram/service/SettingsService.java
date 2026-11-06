package com.kalagram.service;

import com.kalagram.entity.SiteSetting;
import com.kalagram.exception.ApiException;
import com.kalagram.repository.Repositories.SiteSettingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

@Service
public class SettingsService {

    /** Settings and the values a fresh install starts with. Business details come from the project brief. */
    public static final Map<String, String> DEFAULTS;

    static {
        Map<String, String> d = new LinkedHashMap<>();
        d.put("phone", "+91 9011059088");
        d.put("whatsapp", "919011059088");
        d.put("email", "hello@kalagram.org");
        d.put("address", "Kalagram, Pune, Maharashtra");
        // Other places are also named Kalagram: searching the name pins them, so stay on the city until the exact spot is set.
        d.put("mapsQuery", "Pune, Maharashtra");
        d.put("facebookUrl", "");
        d.put("instagramUrl", "");
        d.put("youtubeUrl", "");
        d.put("heroTitle", "Mud House Building Workshops");
        d.put("heroSubtitle", "Learn the traditional art of building healthy, beautiful and sustainable homes with earth.");
        d.put("aboutPreview", "Kalagram is a learning platform dedicated to reviving India's natural building traditions. "
                + "Through hands-on workshops, we share the knowledge of mud house construction, local materials and sustainable living.");
        d.put("ctaTitle", "Build with Earth. Learn from Tradition.");
        d.put("ctaText", "Join our hands-on workshops and discover the beauty of natural construction.");
        d.put("stat1Value", "20+");
        d.put("stat1Label", "Mud House Projects");
        d.put("stat2Value", "50+");
        d.put("stat2Label", "Workshop Batches");
        d.put("stat3Value", "500+");
        d.put("stat3Label", "Learners & Visitors");
        d.put("stat4Value", "100%");
        d.put("stat4Label", "Natural & Local Materials");
        DEFAULTS = Map.copyOf(d);
    }

    private static final Set<String> URL_KEYS = Set.of("facebookUrl", "instagramUrl", "youtubeUrl");
    private static final Pattern WHATSAPP = Pattern.compile("^[1-9][0-9]{7,14}$");
    private static final Pattern EMAIL = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    private final SiteSettingRepository repository;

    public SettingsService(SiteSettingRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public Map<String, String> all() {
        Map<String, String> values = new LinkedHashMap<>(DEFAULTS);
        repository.findAll().forEach(s -> {
            if (DEFAULTS.containsKey(s.getKey())) {
                values.put(s.getKey(), s.getValue() == null ? "" : s.getValue());
            }
        });
        return values;
    }

    @Transactional
    public Map<String, String> update(Map<String, String> changes) {
        changes.forEach(SettingsService::validate);
        changes.forEach((key, value) -> {
            String clean = value == null ? "" : value.trim();
            SiteSetting setting = repository.findById(key).orElseGet(() -> new SiteSetting(key, clean));
            setting.setValue(clean);
            repository.save(setting);
        });
        return all();
    }

    private static void validate(String key, String value) {
        if (!DEFAULTS.containsKey(key)) {
            throw ApiException.badRequest("Unknown setting: " + key);
        }
        String v = value == null ? "" : value.trim();
        if (v.length() > 5000) {
            throw ApiException.badRequest("The value for " + key + " is too long.");
        }
        if (key.equals("whatsapp") && !WHATSAPP.matcher(v).matches()) {
            throw ApiException.badRequest("WhatsApp number must be digits only with the country code, e.g. 919011059088.");
        }
        if (key.equals("email") && !EMAIL.matcher(v).matches()) {
            throw ApiException.badRequest("Enter a valid email address.");
        }
        if (key.equals("phone") && v.isBlank()) {
            throw ApiException.badRequest("Phone number cannot be empty.");
        }
        if (URL_KEYS.contains(key) && !v.isEmpty() && !v.matches("^https?://\\S+$")) {
            throw ApiException.badRequest("Social links must start with http:// or https://.");
        }
    }
}
