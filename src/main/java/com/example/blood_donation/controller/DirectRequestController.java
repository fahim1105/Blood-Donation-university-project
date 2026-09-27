package com.example.blood_donation.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.blood_donation.dto.DirectRequestDto;
import com.example.blood_donation.model.DirectRequest;
import com.example.blood_donation.service.DirectRequestService;

/**
 * REST API Controller for Direct Blood Donation Requests
 * Handles User A -> User B direct request workflow
 */
@RestController
@RequestMapping("/api/v1/requests/direct")
public class DirectRequestController {

    private final DirectRequestService directRequestService;

    public DirectRequestController(DirectRequestService directRequestService) {
        this.directRequestService = directRequestService;
    }

    /**
     * Create a direct request from User A to User B (Donor)
     * POST /api/v1/requests/direct
     * Requires: Authentication
     */
    @PostMapping
    public ResponseEntity<?> createDirectRequest(@RequestBody DirectRequestDto dto,
                                                  Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
        }

        try {
            String requesterUid = (String) auth.getPrincipal();
            DirectRequest request = directRequestService.createDirectRequest(requesterUid, dto);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Direct request sent successfully. Donor will be notified via email.",
                    "requestId", request.getId(),
                    "status", request.getStatus().toString()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    /**
     * Donor accepts the request
     * PUT /api/v1/requests/direct/{requestId}/accept
     * Requires: Authentication (must be the donor)
     */
    @PutMapping("/{requestId}/accept")
    public ResponseEntity<?> acceptRequest(@PathVariable String requestId,
                                            Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
        }

        try {
            String donorUid = (String) auth.getPrincipal();
            DirectRequest updated = directRequestService.acceptRequest(requestId, donorUid);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Request accepted successfully. Requester has been notified.",
                    "status", updated.getStatus().toString()
            ));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(400).body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    /**
     * Donor declines the request
     * PUT /api/v1/requests/direct/{requestId}/decline
     * Requires: Authentication (must be the donor)
     * Optional body: { "message": "reason for declining" }
     */
    @PutMapping("/{requestId}/decline")
    public ResponseEntity<?> declineRequest(@PathVariable String requestId,
                                             @RequestBody(required = false) Map<String, String> body,
                                             Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
        }

        try {
            String donorUid = (String) auth.getPrincipal();
            String message = body != null ? body.get("message") : null;
            
            DirectRequest updated = directRequestService.declineRequest(requestId, donorUid, message);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Request declined. Requester has been notified.",
                    "status", updated.getStatus().toString()
            ));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(400).body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    /**
     * Get all requests sent by current user
     * GET /api/v1/requests/direct/sent
     */
    @GetMapping("/sent")
    public ResponseEntity<?> getRequestsSent(Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
        }

        try {
            String requesterUid = (String) auth.getPrincipal();
            List<DirectRequest> requests = directRequestService.getRequestsSentByUser(requesterUid);
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch sent requests"));
        }
    }

    /**
     * Get all requests received by current user (as donor)
     * GET /api/v1/requests/direct/received
     */
    @GetMapping("/received")
    public ResponseEntity<?> getRequestsReceived(Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
        }

        try {
            String donorUid = (String) auth.getPrincipal();
            List<DirectRequest> requests = directRequestService.getRequestsReceivedByDonor(donorUid);
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch received requests"));
        }
    }

    /**
     * Get pending requests for current user (as donor)
     * GET /api/v1/requests/direct/pending
     */
    @GetMapping("/pending")
    public ResponseEntity<?> getPendingRequests(Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
        }

        try {
            String donorUid = (String) auth.getPrincipal();
            List<DirectRequest> requests = directRequestService.getPendingRequestsForDonor(donorUid);
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch pending requests"));
        }
    }

    /**
     * Get count of pending requests for current user
     * GET /api/v1/requests/direct/pending/count
     */
    @GetMapping("/pending/count")
    public ResponseEntity<?> getPendingCount(Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
        }

        try {
            String donorUid = (String) auth.getPrincipal();
            long count = directRequestService.countPendingRequestsForDonor(donorUid);
            return ResponseEntity.ok(Map.of("count", count));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("count", 0));
        }
    }

    /**
     * Get specific request details
     * GET /api/v1/requests/direct/{requestId}
     */
    @GetMapping("/{requestId}")
    public ResponseEntity<?> getRequestById(@PathVariable String requestId,
                                             Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
        }

        try {
            DirectRequest request = directRequestService.getRequestById(requestId);
            String uid = (String) auth.getPrincipal();

            // Verify user is either requester or donor
            if (!uid.equals(request.getRequesterUid()) && !uid.equals(request.getDonorUid())) {
                return ResponseEntity.status(403).body(Map.of("error", "Unauthorized access"));
            }

            return ResponseEntity.ok(request);
        } catch (Exception e) {
            return ResponseEntity.status(404).body(Map.of("error", "Request not found"));
        }
    }
}
