package com.example.blood_donation.service;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.example.blood_donation.dto.BloodRequestDto;
import com.example.blood_donation.model.BloodRequest;
import com.example.blood_donation.model.User;
import com.example.blood_donation.repository.BloodRequestRepository;
import com.example.blood_donation.repository.UserRepository;

@Service
public class BloodRequestService {

    private final BloodRequestRepository bloodRequestRepository;
    private final UserRepository         userRepository;
    private final EmailService          emailService;
    private final DonationHistoryService donationHistoryService;

    public BloodRequestService(BloodRequestRepository bloodRequestRepository,
                                UserRepository userRepository,
                                EmailService emailService,
                                DonationHistoryService donationHistoryService) {
        this.bloodRequestRepository = bloodRequestRepository;
        this.userRepository         = userRepository;
        this.emailService           = emailService;
        this.donationHistoryService = donationHistoryService;
    }

    public BloodRequest createRequest(BloodRequestDto dto, String requestedByUid, String requestedByName) {
        BloodRequest request = new BloodRequest();
        request.setPatientName(dto.getPatientName());
        request.setBloodGroup(dto.getBloodGroup());
        request.setHospitalName(dto.getHospitalName());
        request.setDivision(dto.getDivision());
        request.setDistrict(dto.getDistrict());
        request.setUpazila(dto.getUpazila());
        request.setUnitsNeeded(dto.getUnitsNeeded());
        request.setContactNumber(dto.getContactNumber());
        request.setDateNeeded(dto.getDateNeeded());
        request.setStatus(BloodRequest.Status.PENDING);
        request.setRequestedByUid(requestedByUid);
        request.setRequestedByName(requestedByName);
        return bloodRequestRepository.save(request);
    }

    public List<BloodRequest> getPendingRequests() {
        return bloodRequestRepository.findByStatusOrderByCreatedAtDesc(BloodRequest.Status.PENDING);
    }

    public List<BloodRequest> getAllRequests() {
        return bloodRequestRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<BloodRequest> getRequestsByUser(String uid) {
        return bloodRequestRepository.findByRequestedByUidOrderByCreatedAtDesc(uid);
    }

    public Optional<BloodRequest> findById(String id) {
        return bloodRequestRepository.findById(id);
    }

    public BloodRequest updateStatus(String id, BloodRequest.Status status,
                                      String callerUid, boolean isAdmin) {
        BloodRequest req = bloodRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (!isAdmin) {
            if (callerUid == null) {
                throw new SecurityException("Unauthorized");
            }
            if (req.getRequestedByUid() != null
                    && !callerUid.equals(req.getRequestedByUid())) {
                throw new SecurityException("You can only update your own requests");
            }
        }

        req.setStatus(status);
        return bloodRequestRepository.save(req);
    }

    // ── Donor Response ────────────────────────────────────────────────────────

    public BloodRequest addDonorResponse(String requestId, String donorUid) {
        BloodRequest req = bloodRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (req.getStatus() != BloodRequest.Status.PENDING) {
            throw new IllegalStateException("This request is no longer accepting responses");
        }

        User donor = userRepository.findByFirebaseUid(donorUid)
                .orElseThrow(() -> new RuntimeException("Donor profile not found"));

        // Check blood group compatibility
        if (req.getBloodGroup() != null && donor.getBloodGroup() != null
                && !req.getBloodGroup().equalsIgnoreCase(donor.getBloodGroup())) {
            throw new IllegalArgumentException(
                "Your blood group (" + donor.getBloodGroup() + ") does not match "
                + "the required blood group (" + req.getBloodGroup() + ")");
        }

        // ✅ NEW: Strict 90-day eligibility check
        java.time.LocalDate lastDonation = donor.getLastDonationDate();
        if (lastDonation != null) {
            long daysSinceLastDonation = java.time.temporal.ChronoUnit.DAYS.between(
                lastDonation, java.time.LocalDate.now()
            );
            if (daysSinceLastDonation < 90) {
                throw new IllegalStateException(
                    "You are not eligible to donate yet. You donated " + daysSinceLastDonation + 
                    " days ago. Please wait " + (90 - daysSinceLastDonation) + 
                    " more days before donating again."
                );
            }
        }

        // ✅ NEW: Check availability status
        if (!donor.isAvailable()) {
            throw new IllegalStateException(
                "You are currently marked as unavailable for donation. " +
                "Please update your availability status in your profile."
            );
        }

        List<BloodRequest.DonorResponse> responses = req.getDonorResponses();
        if (responses == null) responses = new java.util.ArrayList<>();

        // Idempotent: if already OFFERED, return as-is
        for (BloodRequest.DonorResponse r : responses) {
            if (donorUid.equals(r.getDonorUid())
                    && r.getStatus() == BloodRequest.DonorResponse.ResponseStatus.OFFERED) {
                return req;
            }
        }

        // Update existing WITHDRAWN → OFFERED, or create new
        boolean found = false;
        for (BloodRequest.DonorResponse r : responses) {
            if (donorUid.equals(r.getDonorUid())) {
                r.setStatus(BloodRequest.DonorResponse.ResponseStatus.OFFERED);
                r.setRespondedAt(java.time.LocalDateTime.now());
                found = true;
                break;
            }
        }
        if (!found) {
            BloodRequest.DonorResponse resp = new BloodRequest.DonorResponse();
            resp.setDonorUid(donorUid);
            resp.setDonorName(donor.getName());
            resp.setDonorPhone(donor.getPhone());
            resp.setDonorBloodGroup(donor.getBloodGroup());
            resp.setRespondedAt(java.time.LocalDateTime.now());
            resp.setStatus(BloodRequest.DonorResponse.ResponseStatus.OFFERED);
            responses.add(resp);
        }

        req.setDonorResponses(responses);
        BloodRequest saved = bloodRequestRepository.save(req);

        // Send email notification to request owner (async)
        try {
            User requester = userRepository.findByFirebaseUid(req.getRequestedByUid()).orElse(null);
            if (requester != null && requester.getEmail() != null && !requester.getEmail().isEmpty()) {
                emailService.sendDonorResponseNotification(
                    requester.getEmail(),
                    requester.getName(),
                    donor.getName(),
                    donor.getPhone() != null ? donor.getPhone() : "Not provided",
                    donor.getBloodGroup(),
                    req.getHospitalName()
                );
            }
        } catch (Exception e) {
            // Log error but don't fail the request
            System.err.println("Failed to send email notification: " + e.getMessage());
        }

        return saved;
    }

    public BloodRequest withdrawDonorResponse(String requestId, String donorUid) {
        BloodRequest req = bloodRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        List<BloodRequest.DonorResponse> responses = req.getDonorResponses();
        if (responses != null) {
            responses.stream()
                .filter(r -> donorUid.equals(r.getDonorUid()))
                .forEach(r -> r.setStatus(BloodRequest.DonorResponse.ResponseStatus.WITHDRAWN));
        }
        req.setDonorResponses(responses);
        return bloodRequestRepository.save(req);
    }

    public List<BloodRequest.DonorResponse> getResponses(String requestId, String requesterUid) {
        BloodRequest req = bloodRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (!requesterUid.equals(req.getRequestedByUid())) {
            throw new SecurityException("Only the requester can view responses");
        }

        List<BloodRequest.DonorResponse> all = req.getDonorResponses();
        if (all == null) return java.util.Collections.emptyList();

        return all.stream()
                .filter(r -> r.getStatus() == BloodRequest.DonorResponse.ResponseStatus.OFFERED)
                .collect(java.util.stream.Collectors.toList());
    }

    public long countActiveResponses(String requestId) {
        return bloodRequestRepository.findById(requestId)
                .map(req -> req.getDonorResponses() == null ? 0L :
                    req.getDonorResponses().stream()
                        .filter(r -> r.getStatus() == BloodRequest.DonorResponse.ResponseStatus.OFFERED)
                        .count())
                .orElse(0L);
    }

    /**
     * Edit an existing PENDING request.
     * Only the owner (requestedByUid) may edit, and only while status is PENDING.
     */
    public BloodRequest editRequest(String id, String uid, BloodRequestDto dto) {
        BloodRequest req = bloodRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (req.getStatus() != BloodRequest.Status.PENDING) {
            throw new IllegalStateException("Only PENDING requests can be edited");
        }
        if (uid == null || !uid.equals(req.getRequestedByUid())) {
            throw new SecurityException("Not authorized to edit this request");
        }

        if (dto.getPatientName()   != null) req.setPatientName(dto.getPatientName());
        if (dto.getBloodGroup()    != null) req.setBloodGroup(dto.getBloodGroup());
        if (dto.getHospitalName()  != null) req.setHospitalName(dto.getHospitalName());
        if (dto.getDivision()      != null) req.setDivision(dto.getDivision());
        if (dto.getDistrict()      != null) req.setDistrict(dto.getDistrict());
        if (dto.getUpazila()       != null) req.setUpazila(dto.getUpazila());
        if (dto.getUnitsNeeded()   > 0)     req.setUnitsNeeded(dto.getUnitsNeeded());
        if (dto.getContactNumber() != null) req.setContactNumber(dto.getContactNumber());
        if (dto.getDateNeeded()    != null) req.setDateNeeded(dto.getDateNeeded());

        return bloodRequestRepository.save(req);
    }

    public void deleteRequest(String id) {
        bloodRequestRepository.deleteById(id);
    }

    public long countPending() {
        return bloodRequestRepository.countByStatus(BloodRequest.Status.PENDING);
    }

    public long countFulfilled() {
        return bloodRequestRepository.countByStatus(BloodRequest.Status.FULFILLED);
    }

    // ── Paged methods ─────────────────────────────────────────────────────────

    public Page<BloodRequest> getPendingRequestsPaged(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return bloodRequestRepository.findByStatusOrderByCreatedAtDesc(BloodRequest.Status.PENDING, pageable);
    }

    public Page<BloodRequest> getAllRequestsPaged(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return bloodRequestRepository.findAllByOrderByCreatedAtDesc(pageable);
    }

    public Page<BloodRequest> getRequestsByStatusPaged(BloodRequest.Status status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return bloodRequestRepository.findByStatusOrderByCreatedAtDesc(status, pageable);
    }

    /**
     * Complete a blood request and update the selected donor's last donation date
     * This marks the request as FULFILLED and sets donor unavailable for 90 days
     * 
     * @param requestId The blood request ID
     * @param selectedDonorUid The UID of the donor who actually donated
     * @param requesterUid The UID of the requester (for authorization)
     * @return Updated BloodRequest
     */
    public BloodRequest completeRequestWithDonor(String requestId, String selectedDonorUid, String requesterUid) {
        // Get request
        BloodRequest req = bloodRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        
        // Verify requester ownership
        if (requesterUid == null || !requesterUid.equals(req.getRequestedByUid())) {
            throw new SecurityException("Only the request owner can mark this request as complete");
        }
        
        // Verify request is still pending
        if (req.getStatus() != BloodRequest.Status.PENDING) {
            throw new IllegalStateException("Only PENDING requests can be marked as complete");
        }
        
        // Get donor
        User donor = userRepository.findByFirebaseUid(selectedDonorUid)
                .orElseThrow(() -> new RuntimeException("Selected donor not found"));
        
        // Verify donor actually responded to this request
        boolean donorResponded = req.getDonorResponses() != null && 
            req.getDonorResponses().stream()
                .anyMatch(r -> selectedDonorUid.equals(r.getDonorUid()) && 
                              r.getStatus() == BloodRequest.DonorResponse.ResponseStatus.OFFERED);
        
        if (!donorResponded) {
            throw new IllegalArgumentException(
                "The selected donor has not responded to this request or has withdrawn their response"
            );
        }
        
        // Update donor's donation record
        donor.setLastDonationDate(java.time.LocalDate.now());
        donor.setAvailable(false); // Will be auto-reset by scheduler after 90 days
        userRepository.save(donor);
        
        // Mark request as fulfilled
        req.setStatus(BloodRequest.Status.FULFILLED);
        BloodRequest saved = bloodRequestRepository.save(req);
        
        // Optional: Log donation history
        try {
            com.example.blood_donation.dto.DonationHistoryDto historyDto = 
                new com.example.blood_donation.dto.DonationHistoryDto();
            historyDto.setHospitalName(req.getHospitalName());
            historyDto.setDistrict(req.getDistrict() != null ? req.getDistrict() : req.getDivision());
            historyDto.setUnitsGiven(req.getUnitsNeeded());
            historyDto.setDonatedAt(java.time.LocalDate.now());
            
            donationHistoryService.logDonation(selectedDonorUid, historyDto);
        } catch (Exception e) {
            // Don't fail if history logging fails
            System.err.println("Failed to log donation history: " + e.getMessage());
        }
        
        return saved;
    }
}
