package com.example.blood_donation.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.example.blood_donation.dto.DirectRequestDto;
import com.example.blood_donation.model.DirectRequest;
import com.example.blood_donation.model.User;
import com.example.blood_donation.repository.DirectRequestRepository;
import com.example.blood_donation.repository.UserRepository;

/**
 * DirectRequestService - Handles direct blood donation requests between users
 * Flow: User A -> Send Request -> User B (Donor) -> Accept/Decline
 */
@Service
public class DirectRequestService {

    private final DirectRequestRepository directRequestRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    public DirectRequestService(DirectRequestRepository directRequestRepository,
                                 UserRepository userRepository,
                                 EmailService emailService) {
        this.directRequestRepository = directRequestRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    /**
     * Create a direct request from requester to donor
     * Sends email notification to donor
     */
    public DirectRequest createDirectRequest(String requesterUid, DirectRequestDto dto) {
        // Get requester details
        User requester = userRepository.findByFirebaseUid(requesterUid)
                .orElseThrow(() -> new RuntimeException("Requester not found"));

        // Get donor details
        User donor = userRepository.findByFirebaseUid(dto.getDonorUid())
                .orElseThrow(() -> new RuntimeException("Donor not found"));

        // Validate donor has email
        if (donor.getEmail() == null || donor.getEmail().isEmpty()) {
            throw new RuntimeException("Donor email not available");
        }

        // Create direct request
        DirectRequest request = new DirectRequest();
        request.setRequesterUid(requester.getFirebaseUid());
        request.setRequesterName(requester.getName());
        request.setRequesterEmail(requester.getEmail());
        request.setRequesterPhone(requester.getPhone());

        request.setDonorUid(donor.getFirebaseUid());
        request.setDonorName(donor.getName());
        request.setDonorEmail(donor.getEmail());

        request.setPatientName(dto.getPatientName());
        request.setBloodGroup(dto.getBloodGroup());
        request.setHospitalName(dto.getHospitalName());
        request.setDivision(dto.getDivision());
        request.setDistrict(dto.getDistrict());
        request.setUpazila(dto.getUpazila());
        request.setUnitsNeeded(dto.getUnitsNeeded());
        request.setContactPhone(dto.getContactPhone());
        request.setRequiredDate(dto.getRequiredDate());

        request.setStatus(DirectRequest.Status.PENDING);
        request.setCreatedAt(LocalDateTime.now());

        // Save request
        DirectRequest saved = directRequestRepository.save(request);

        // Send email notification to donor (async)
        emailService.sendDirectRequestToDonor(saved);

        return saved;
    }

    /**
     * Donor accepts the request
     * Sends confirmation email to requester with donor contact info
     */
    public DirectRequest acceptRequest(String requestId, String donorUid) {
        DirectRequest request = directRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        // Verify the person accepting is the actual donor
        if (!donorUid.equals(request.getDonorUid())) {
            throw new SecurityException("Only the requested donor can accept this request");
        }

        // Check if already responded
        if (request.getStatus() != DirectRequest.Status.PENDING) {
            throw new IllegalStateException("This request has already been responded to");
        }

        // Update status
        request.setStatus(DirectRequest.Status.ACCEPTED);
        request.setRespondedAt(LocalDateTime.now());

        DirectRequest updated = directRequestRepository.save(request);

        // Send confirmation email to requester (async)
        emailService.sendAcceptanceConfirmationToRequester(updated);

        return updated;
    }

    /**
     * Donor declines the request
     * Sends notification email to requester
     */
    public DirectRequest declineRequest(String requestId, String donorUid, String message) {
        DirectRequest request = directRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        // Verify the person declining is the actual donor
        if (!donorUid.equals(request.getDonorUid())) {
            throw new SecurityException("Only the requested donor can decline this request");
        }

        // Check if already responded
        if (request.getStatus() != DirectRequest.Status.PENDING) {
            throw new IllegalStateException("This request has already been responded to");
        }

        // Update status
        request.setStatus(DirectRequest.Status.DECLINED);
        request.setRespondedAt(LocalDateTime.now());
        request.setResponseMessage(message);

        DirectRequest updated = directRequestRepository.save(request);

        // Send notification email to requester (async)
        emailService.sendDeclinationNotificationToRequester(updated);

        return updated;
    }

    /**
     * Get all requests sent by a user
     */
    public List<DirectRequest> getRequestsSentByUser(String requesterUid) {
        return directRequestRepository.findByRequesterUidOrderByCreatedAtDesc(requesterUid);
    }

    /**
     * Get all requests received by a donor
     */
    public List<DirectRequest> getRequestsReceivedByDonor(String donorUid) {
        return directRequestRepository.findByDonorUidOrderByCreatedAtDesc(donorUid);
    }

    /**
     * Get pending requests for a donor
     */
    public List<DirectRequest> getPendingRequestsForDonor(String donorUid) {
        return directRequestRepository.findByDonorUidAndStatusOrderByCreatedAtDesc(
                donorUid, DirectRequest.Status.PENDING);
    }

    /**
     * Get request by ID
     */
    public DirectRequest getRequestById(String requestId) {
        return directRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));
    }

    /**
     * Count pending requests for a donor
     */
    public long countPendingRequestsForDonor(String donorUid) {
        return directRequestRepository.countByDonorUidAndStatus(
                donorUid, DirectRequest.Status.PENDING);
    }
}
