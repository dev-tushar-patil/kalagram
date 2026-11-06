package com.kalagram.integration;

import com.kalagram.config.KalagramProperties;
import com.kalagram.dto.Dtos.RegistrationConfirmation;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Stream;

/**
 * Sends the "new registration" template through the WhatsApp Business Cloud API.
 * The template must be approved in Meta Business Manager with these 8 body parameters, in order:
 * registration ID, name, phone, email, workshop, preferred date, participants, city.
 */
@Component
public class WhatsAppCloudClient {

    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("d MMM yyyy", Locale.ENGLISH);

    private final KalagramProperties.Whatsapp config;
    private final RestClient client;

    public WhatsAppCloudClient(KalagramProperties properties, RestClient.Builder builder) {
        this.config = properties.whatsapp();
        this.client = builder.baseUrl("https://graph.facebook.com").build();
    }

    public boolean isConfigured() {
        return config.enabled() && hasText(config.accessToken()) && hasText(config.phoneNumberId())
                && hasText(config.templateName()) && hasText(config.notifyTo());
    }

    public void sendRegistrationNotification(RegistrationConfirmation r) {
        client.post()
                .uri("/{version}/{phoneNumberId}/messages", config.apiVersion(), config.phoneNumberId())
                .header("Authorization", "Bearer " + config.accessToken())
                .contentType(MediaType.APPLICATION_JSON)
                .body(templatePayload(r))
                .retrieve()
                .toBodilessEntity();
    }

    Map<String, Object> templatePayload(RegistrationConfirmation r) {
        // Stream.of, not List.of: city is optional and may be null.
        List<Map<String, String>> parameters = Stream.of(
                        r.registrationId(), r.fullName(), r.mobile(), r.email(), r.workshopTitle(),
                        DATE.format(r.startDate()), String.valueOf(r.participants()), r.city())
                .map(WhatsAppCloudClient::templateText)
                .map(text -> Map.of("type", "text", "text", text))
                .toList();
        return Map.of(
                "messaging_product", "whatsapp",
                "to", config.notifyTo().replaceAll("\\D", ""),
                "type", "template",
                "template", Map.of(
                        "name", config.templateName(),
                        "language", Map.of("code", config.templateLanguage()),
                        "components", List.of(Map.of("type", "body", "parameters", parameters))));
    }

    /** The API rejects template values that are empty or contain newlines, tabs or 4+ consecutive spaces. */
    static String templateText(String value) {
        if (value == null || value.isBlank()) {
            return "-";
        }
        return value.replaceAll("\\s+", " ").trim();
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
