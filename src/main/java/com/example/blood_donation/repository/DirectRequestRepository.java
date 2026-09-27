package com.example.blood_donation.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.example.blood_donation.model.DirectRequest;

@Repository
public interface DirectRequestRepository extends MongoRepository<DirectRequest, String> {

    /**
     * Find all requests sent by a specific requester
     */
    List<DirectRequest> findByRequesterUidOrderByCreatedAtDesc(String requesterUid);

    /**
     * Find all requests received by a specific donor
     */
    List<DirectRequest> findByDonorUidOrderByCreatedAtDesc(String donorUid);

    /**
     * Find all pending requests for a donor
     */
    List<DirectRequest> findByDonorUidAndStatusOrderByCreatedAtDesc(String donorUid, DirectRequest.Status status);

    /**
     * Count pending requests for a donor
     */
    long countByDonorUidAndStatus(String donorUid, DirectRequest.Status status);

    /**
     * Find old pending requests for auto-expiry
     */
    List<DirectRequest> findByStatusAndCreatedAtBefore(DirectRequest.Status status, LocalDateTime createdAt);
}
