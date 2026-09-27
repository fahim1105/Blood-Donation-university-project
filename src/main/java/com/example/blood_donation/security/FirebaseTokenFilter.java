package com.example.blood_donation.security;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.example.blood_donation.model.User;
import com.example.blood_donation.service.FirebaseService;
import com.example.blood_donation.service.UserService;
import com.google.firebase.auth.FirebaseToken;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Verifies Firebase ID tokens and maps them to Spring Security authorities.
 *
 * Role resolution order:
 *   1. Try MongoDB (live) — most accurate
 *   2. Fall back to in-memory role cache — used when MongoDB is temporarily down
 *   3. Fall back to ROLE_USER if uid is not yet registered
 */
@Component
public class FirebaseTokenFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(FirebaseTokenFilter.class);

    /** In-memory cache: Firebase UID → role name (e.g. "ADMIN", "DONOR") */
    private final ConcurrentHashMap<String, String> roleCache = new ConcurrentHashMap<>();

    private final FirebaseService firebaseService;
    private final UserService     userService;

    public FirebaseTokenFilter(FirebaseService firebaseService, UserService userService) {
        this.firebaseService = firebaseService;
        this.userService     = userService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String idToken = authHeader.substring(7);
            FirebaseToken decodedToken = firebaseService.verifyToken(idToken);

            if (decodedToken != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                String uid = decodedToken.getUid();
                String roleName = resolveRole(uid);

                List<SimpleGrantedAuthority> authorities =
                        List.of(new SimpleGrantedAuthority("ROLE_" + roleName));

                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(uid, null, authorities);
                auth.setDetails(decodedToken);
                SecurityContextHolder.getContext().setAuthentication(auth);
                log.debug("Authenticated uid={} role={}", uid, roleName);
            }
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Resolves the role for a Firebase UID.
     * Tries MongoDB first; on failure uses in-memory cache; defaults to USER.
     */
    private String resolveRole(String uid) {
        try {
            Optional<User> userOpt = userService.findByFirebaseUid(uid);
            if (userOpt.isPresent()) {
                String role = userOpt.get().getRole().name(); // ADMIN / DONOR / USER
                roleCache.put(uid, role); // update cache with fresh value
                return role;
            }
            // User not in DB yet (first-time registration in progress)
            return roleCache.getOrDefault(uid, "USER");
        } catch (Exception e) {
            // MongoDB unavailable — use cached role if available
            String cached = roleCache.get(uid);
            if (cached != null) {
                log.warn("MongoDB unavailable, using cached role={} for uid={}", cached, uid);
                return cached;
            }
            log.warn("MongoDB unavailable and no cached role for uid={}, defaulting to USER", uid);
            return "USER";
        }
    }
}
