package com.example.blood_donation.controller;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.blood_donation.dto.BloodRequestDto;
import com.example.blood_donation.dto.DonationHistoryDto;
import com.example.blood_donation.dto.DonorSearchResultDto;
import com.example.blood_donation.dto.LocationUpdateDto;
import com.example.blood_donation.dto.UserRegistrationDto;
import com.example.blood_donation.dto.UserUpdateDto;
import com.example.blood_donation.model.BloodRequest;
import com.example.blood_donation.model.DonationHistory;
import com.example.blood_donation.model.User;
import com.example.blood_donation.service.BloodRequestService;
import com.example.blood_donation.service.DonationHistoryService;
import com.example.blood_donation.service.UserService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1")
public class ApiController {

    private final UserService            userService;
    private final BloodRequestService    bloodRequestService;
    private final DonationHistoryService donationHistoryService;

    public ApiController(UserService userService,
                         BloodRequestService bloodRequestService,
                         DonationHistoryService donationHistoryService) {
        this.userService            = userService;
        this.bloodRequestService    = bloodRequestService;
        this.donationHistoryService = donationHistoryService;
    }

    // ─── USER ENDPOINTS ──────────────────────────────────────────────────────

    @PostMapping("/users/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody UserRegistrationDto dto) {
        try {
            User user = userService.registerUser(dto);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/users/me")
    public ResponseEntity<?> getMyProfile(Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        String uid = (String) auth.getPrincipal();
        try {
            return userService.findByFirebaseUid(uid)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(503).body(Map.of("error", "Database unavailable. Please try again shortly."));
        }
    }

    @PutMapping("/users/me")
    public ResponseEntity<?> updateMyProfile(@RequestBody UserUpdateDto dto, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        String uid = (String) auth.getPrincipal();
        try {
            User updated = userService.updateUser(uid, dto);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ─── DONOR SEARCH ────────────────────────────────────────────────────────

    @GetMapping("/donors/search")
    public ResponseEntity<?> searchDonors(
            @RequestParam(required = false) String bloodGroup,
            @RequestParam(required = false) String district,
            @RequestParam(required = false) String division,
            @RequestParam(required = false) String upazila,
            @RequestParam(required = false) Double seekerLat,
            @RequestParam(required = false) Double seekerLng,
            Authentication auth) {
        try {
            // Get current user UID to exclude from results
            String currentUserUid = auth != null ? (String) auth.getPrincipal() : null;
            
            boolean hasLocationParam = (division != null && !division.isBlank())
                    || (upazila != null && !upazila.isBlank())
                    || seekerLat != null || seekerLng != null;

            if (hasLocationParam) {
                return ResponseEntity.ok(userService.searchDonorsByLocation(
                        bloodGroup, division, district, upazila, seekerLat, seekerLng, currentUserUid));
            }
            List<DonorSearchResultDto> results = userService.searchDonors(bloodGroup, district, currentUserUid)
                    .stream().map(DonorSearchResultDto::from).toList();
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            return ResponseEntity.status(503).body(Map.of("error", "Database unavailable. Please try again shortly."));
        }
    }

    // ─── LOCATION ────────────────────────────────────────────────────────────

    @PatchMapping("/users/me/location")
    public ResponseEntity<?> updateMyLocation(@RequestBody LocationUpdateDto dto,
                                               Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        String uid = (String) auth.getPrincipal();
        try {
            return ResponseEntity.ok(userService.updateLocation(uid, dto));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ─── BLOOD REQUEST ENDPOINTS ─────────────────────────────────────────────

    @PostMapping("/requests")
    public ResponseEntity<?> createRequest(@Valid @RequestBody BloodRequestDto dto,
                                           Authentication auth) {
        String uid  = auth != null ? (String) auth.getPrincipal() : null;
        String name = null;
        if (uid != null) {
            try {
                Optional<User> maybeUser = userService.findByFirebaseUid(uid);
                name = maybeUser.map(User::getName).orElse(null);
            } catch (Exception ignored) {}
        }
        try {
            BloodRequest request = bloodRequestService.createRequest(dto, uid, name);
            return ResponseEntity.ok(request);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/requests")
    public ResponseEntity<?> getUrgentRequests() {
        try {
            List<BloodRequest> requests = bloodRequestService.getPendingRequests();
            // Add active response count to each request
            List<Map<String, Object>> enrichedRequests = requests.stream()
                .map(req -> {
                    Map<String, Object> map = new java.util.HashMap<>();
                    map.put("request", req);
                    map.put("activeResponseCount", req.getDonorResponses() != null ? 
                        req.getDonorResponses().stream()
                            .filter(r -> r.getStatus() == BloodRequest.DonorResponse.ResponseStatus.OFFERED)
                            .count() : 0);
                    return map;
                })
                .toList();
            return ResponseEntity.ok(enrichedRequests);
        } catch (Exception e) {
            return ResponseEntity.status(503).body(Map.of("error", "Database unavailable."));
        }
    }

    @GetMapping("/requests/paged")
    public ResponseEntity<?> getUrgentRequestsPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            return ResponseEntity.ok(bloodRequestService.getPendingRequestsPaged(page, size));
        } catch (Exception e) {
            return ResponseEntity.status(503).body(Map.of("error", "Database unavailable."));
        }
    }

    @GetMapping("/requests/my")
    public ResponseEntity<?> getMyRequests(Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        String uid = (String) auth.getPrincipal();
        try {
            return ResponseEntity.ok(bloodRequestService.getRequestsByUser(uid));
        } catch (Exception e) {
            return ResponseEntity.status(503).body(Map.of("error", "Database unavailable."));
        }
    }

    @PatchMapping("/requests/{id}/status")
    public ResponseEntity<?> updateRequestStatus(@PathVariable String id,
                                                  @RequestBody Map<String, String> body,
                                                  Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        String uid = (String) auth.getPrincipal();
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        try {
            BloodRequest.Status status = BloodRequest.Status.valueOf(body.get("status").toUpperCase());
            BloodRequest updated = bloodRequestService.updateStatus(id, status, uid, isAdmin);
            return ResponseEntity.ok(updated);
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/requests/{id}")
    public ResponseEntity<?> editRequest(@PathVariable String id,
                                         @RequestBody BloodRequestDto dto,
                                         Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        String uid = (String) auth.getPrincipal();
        try {
            BloodRequest updated = bloodRequestService.editRequest(id, uid, dto);
            return ResponseEntity.ok(updated);
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ─── DONOR RESPONSE ──────────────────────────────────────────────────────

    @PostMapping("/requests/{id}/respond")
    public ResponseEntity<?> respondToRequest(@PathVariable String id, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        String uid = (String) auth.getPrincipal();
        try {
            BloodRequest updated = bloodRequestService.addDonorResponse(id, uid);
            return ResponseEntity.ok(updated);
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/requests/{id}/respond")
    public ResponseEntity<?> withdrawResponse(@PathVariable String id, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        String uid = (String) auth.getPrincipal();
        try {
            BloodRequest updated = bloodRequestService.withdrawDonorResponse(id, uid);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/requests/{id}/responses")
    public ResponseEntity<?> getRequestResponses(@PathVariable String id, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        String uid = (String) auth.getPrincipal();
        try {
            List<BloodRequest.DonorResponse> responses = bloodRequestService.getResponses(id, uid);
            return ResponseEntity.ok(responses);
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/requests/{id}/complete")
    public ResponseEntity<?> completeRequestWithDonor(
            @PathVariable String id,
            @RequestBody Map<String, String> body,
            Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        
        String requesterUid = (String) auth.getPrincipal();
        String selectedDonorUid = body.get("donorUid");
        
        if (selectedDonorUid == null || selectedDonorUid.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "donorUid is required to complete the request"
            ));
        }
        
        try {
            BloodRequest updated = bloodRequestService.completeRequestWithDonor(
                id, selectedDonorUid, requesterUid
            );
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Request marked as fulfilled. Donor's availability has been updated.",
                "request", updated
            ));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to complete request: " + e.getMessage()));
        }
    }

    // ─── STATS ───────────────────────────────────────────────────────────────

    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        try {
            return ResponseEntity.ok(Map.of(
                    "totalDonors",    userService.getTotalDonors(),
                    "livesSaved",     bloodRequestService.countFulfilled(),
                    "pendingRequests", bloodRequestService.countPending()
            ));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("totalDonors", 0L, "livesSaved", 0L, "pendingRequests", 0L));
        }
    }

    // ─── ADMIN ───────────────────────────────────────────────────────────────

    @GetMapping("/admin/requests")
    public ResponseEntity<?> getAdminRequestsPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "ALL") String status) {
        try {
            if ("ALL".equalsIgnoreCase(status)) {
                return ResponseEntity.ok(bloodRequestService.getAllRequestsPaged(page, size));
            }
            BloodRequest.Status s = BloodRequest.Status.valueOf(status.toUpperCase());
            return ResponseEntity.ok(bloodRequestService.getRequestsByStatusPaged(s, page, size));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.ok(bloodRequestService.getAllRequestsPaged(page, size));
        }
    }

    @GetMapping("/admin/users")
    public ResponseEntity<?> getAdminUsersPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(userService.getAllUsersPaged(page, size));
    }

    @DeleteMapping("/admin/requests/{id}")
    public ResponseEntity<?> deleteRequest(@PathVariable String id) {
        bloodRequestService.deleteRequest(id);
        return ResponseEntity.ok(Map.of("message", "Request deleted"));
    }

    @PatchMapping("/admin/users/{id}/deactivate")
    public ResponseEntity<?> deactivateUser(@PathVariable String id) {
        userService.deactivateUser(id);
        return ResponseEntity.ok(Map.of("message", "User deactivated"));
    }

    @PatchMapping("/admin/users/{id}/role")
    public ResponseEntity<?> changeUserRole(@PathVariable String id,
                                             @RequestBody Map<String, String> body) {
        try {
            User.Role role = User.Role.valueOf(body.get("role").toUpperCase());
            User updated = userService.changeUserRole(id, role);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/admin/users/{id}/reactivate")
    public ResponseEntity<?> reactivateUser(@PathVariable String id) {
        userService.reactivateUser(id);
        return ResponseEntity.ok(Map.of("message", "User reactivated"));
    }

    // ─── DONATION HISTORY ────────────────────────────────────────────────────

    @PostMapping("/donations/log")
    public ResponseEntity<?> logDonation(@RequestBody DonationHistoryDto dto, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        String uid = (String) auth.getPrincipal();
        try {
            DonationHistory saved = donationHistoryService.logDonation(uid, dto);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/donations/my")
    public ResponseEntity<?> getMyDonationHistory(Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        String uid = (String) auth.getPrincipal();
        try {
            return ResponseEntity.ok(donationHistoryService.getHistory(uid));
        } catch (Exception e) {
            return ResponseEntity.status(503).body(Map.of("error", "Database unavailable."));
        }
    }

    @GetMapping("/donations/my/count")
    public ResponseEntity<?> getMyDonationCount(Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        String uid = (String) auth.getPrincipal();
        try {
            return ResponseEntity.ok(Map.of("count", donationHistoryService.getCount(uid)));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("count", 0L));
        }
    }
}
