package com.example.blood_donation.security;

import java.io.IOException;
import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Per-IP rate limiting for public endpoints using Bucket4j (in-memory, no cache).
 *
 * Rules:
 *   POST /api/v1/requests        →  5 requests / 60 seconds per IP
 *   GET  /api/v1/donors/search   → 30 requests / 60 seconds per IP
 *   POST /api/v1/users/register  →  3 requests / 60 seconds per IP
 *
 * All other paths pass through immediately without consuming a token.
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    // ── Per-endpoint bucket caches, keyed by client IP ────────────────────────
    private final ConcurrentHashMap<String, Bucket> requestBuckets  = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Bucket> searchBuckets   = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Bucket> registerBuckets = new ConcurrentHashMap<>();

    // ── Bucket factories ──────────────────────────────────────────────────────

    private static Bucket newRequestBucket() {
        // 5 tokens, refilled completely every 60 seconds
        return Bucket.builder()
                .addLimit(Bandwidth.classic(5, Refill.intervally(5, Duration.ofSeconds(60))))
                .build();
    }

    private static Bucket newSearchBucket() {
        // 30 tokens, refilled completely every 60 seconds
        return Bucket.builder()
                .addLimit(Bandwidth.classic(30, Refill.intervally(30, Duration.ofSeconds(60))))
                .build();
    }

    private static Bucket newRegisterBucket() {
        // 3 tokens, refilled completely every 60 seconds
        return Bucket.builder()
                .addLimit(Bandwidth.classic(3, Refill.intervally(3, Duration.ofSeconds(60))))
                .build();
    }

    // ── Filter logic ──────────────────────────────────────────────────────────

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String path   = request.getRequestURI();
        String method = request.getMethod();
        String ip     = extractClientIp(request);

        Bucket bucket = resolveBucket(path, method, ip);

        if (bucket == null) {
            // Path not rate-limited — pass through immediately
            filterChain.doFilter(request, response);
            return;
        }

        if (bucket.tryConsume(1)) {
            filterChain.doFilter(request, response);
        } else {
            response.setStatus(429);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write(
                "{\"error\":\"Too many requests. Please try again later.\",\"retryAfterSeconds\":60}"
            );
        }
    }

    /**
     * Maps a request path+method to the appropriate per-IP bucket.
     * Returns null if the path is not subject to rate limiting.
     */
    private Bucket resolveBucket(String path, String method, String ip) {
        if ("POST".equalsIgnoreCase(method) && "/api/v1/requests".equals(path)) {
            return requestBuckets.computeIfAbsent(ip, k -> newRequestBucket());
        }
        if ("GET".equalsIgnoreCase(method) && path.startsWith("/api/v1/donors/search")) {
            return searchBuckets.computeIfAbsent(ip, k -> newSearchBucket());
        }
        if ("POST".equalsIgnoreCase(method) && "/api/v1/users/register".equals(path)) {
            return registerBuckets.computeIfAbsent(ip, k -> newRegisterBucket());
        }
        return null;
    }

    /**
     * Extracts the real client IP address.
     * Checks X-Forwarded-For first (handles load balancers / reverse proxies),
     * then falls back to getRemoteAddr().
     */
    private static String extractClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            // X-Forwarded-For can be a comma-separated list — take the first (original client)
            return forwarded.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        return request.getRemoteAddr();
    }
}
