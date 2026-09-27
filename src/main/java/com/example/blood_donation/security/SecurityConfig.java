package com.example.blood_donation.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final FirebaseTokenFilter firebaseTokenFilter;
    private final RateLimitFilter rateLimitFilter;

    public SecurityConfig(FirebaseTokenFilter firebaseTokenFilter,
                          RateLimitFilter rateLimitFilter) {
        this.firebaseTokenFilter = firebaseTokenFilter;
        this.rateLimitFilter     = rateLimitFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .headers(h -> h.frameOptions(HeadersConfigurer.FrameOptionsConfig::sameOrigin))
            .authorizeHttpRequests(auth -> auth
                // All page routes — auth handled client-side via Firebase JS SDK
                .requestMatchers(
                    "/", "/login", "/register",
                    "/search", "/request-blood",
                    "/profile", "/my-requests", "/inbox",
                    "/error", "/css/**", "/js/**",
                    "/images/**", "/favicon.ico", "/webjars/**"
                ).permitAll()
                // Public REST (GET only - for viewing requests)
                .requestMatchers(
                    "/api/v1/donors/search",
                    "/api/v1/requests",
                    "/api/v1/requests/paged",
                    "/api/v1/users/register",
                    "/api/v1/stats"
                ).permitAll()
                // Admin page — server-side role check in PageController
                .requestMatchers("/admin/**").permitAll()
                // Protected REST endpoints (need Bearer token)
                .requestMatchers(
                    "/api/v1/users/me",
                    "/api/v1/users/me/location",
                    "/api/v1/requests/my",
                    "/api/v1/requests/*/status",
                    "/api/v1/requests/*/respond",
                    "/api/v1/requests/*/responses",
                    "/api/v1/requests/*",
                    "/api/v1/requests/direct",
                    "/api/v1/requests/direct/**",
                    "/api/v1/donations/log",
                    "/api/v1/donations/my",
                    "/api/v1/donations/my/count"
                ).authenticated()
                // POST to /api/v1/requests requires authentication
                .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/v1/requests").authenticated()
                // Admin API endpoints require ADMIN role
                .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                // Everything else open
                .anyRequest().permitAll()
            )
            // RateLimitFilter runs first (rejects abusers before token verification)
            // then FirebaseTokenFilter verifies the token
            .addFilterBefore(firebaseTokenFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(rateLimitFilter,     firebaseTokenFilter.getClass())
            .formLogin(AbstractHttpConfigurer::disable)
            .httpBasic(AbstractHttpConfigurer::disable)
            .logout(AbstractHttpConfigurer::disable);

        return http.build();
    }
}
