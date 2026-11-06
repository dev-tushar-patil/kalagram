package com.kalagram.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties(prefix = "kalagram")
public record KalagramProperties(
        List<String> corsAllowedOrigins,
        String uploadDir,
        boolean seedSampleData,
        int rateLimitPerMinute,
        Jwt jwt,
        Admin admin,
        Mail mail,
        Whatsapp whatsapp) {

    public record Jwt(String secret, int expiryHours) {}

    public record Admin(String email, String password) {}

    public record Mail(boolean enabled, String from) {}

    public record Whatsapp(boolean enabled, String apiVersion, String phoneNumberId, String accessToken,
                           String templateName, String templateLanguage, String notifyTo) {}
}
