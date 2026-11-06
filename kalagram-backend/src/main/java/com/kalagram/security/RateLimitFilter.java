package com.kalagram.security;

import com.kalagram.config.KalagramProperties;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Per-IP fixed-window limit on the unauthenticated write endpoints: login attempts are brute-force
 * targets, and each registration can trigger a paid WhatsApp message. In-memory, so per instance.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RateLimitFilter extends OncePerRequestFilter {

    private static final Set<String> LIMITED = Set.of("/api/admin/auth/login", "/api/registrations", "/api/enquiries");
    private static final long WINDOW_MS = 60_000;

    private record Window(long start, int count) {}

    private final Map<String, Window> windows = new ConcurrentHashMap<>();
    private final int limit;

    public RateLimitFilter(KalagramProperties properties) {
        this.limit = properties.rateLimitPerMinute();
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !"POST".equals(request.getMethod()) || !LIMITED.contains(request.getRequestURI());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        long now = System.currentTimeMillis();
        if (windows.size() > 10_000) {
            windows.values().removeIf(w -> now - w.start() >= WINDOW_MS);
        }
        Window current = windows.compute(request.getRequestURI() + "|" + request.getRemoteAddr(), (key, w) ->
                w == null || now - w.start() >= WINDOW_MS ? new Window(now, 1) : new Window(w.start(), w.count() + 1));
        if (current.count() > limit) {
            response.setStatus(429);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("{\"status\":429,\"message\":\"Too many requests. Please wait a minute and try again.\"}");
            return;
        }
        chain.doFilter(request, response);
    }
}
