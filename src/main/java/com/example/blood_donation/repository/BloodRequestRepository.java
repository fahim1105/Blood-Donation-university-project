package com.example.blood_donation.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.example.blood_donation.model.BloodRequest;

@Repository
public interface BloodRequestRepository extends MongoRepository<BloodRequest, String> {

    // ── Non-paged (kept for backward compatibility) ───────────────────────────
    List<BloodRequest> findByStatusOrderByCreatedAtDesc(BloodRequest.Status status);

    List<BloodRequest> findByRequestedByUidOrderByCreatedAtDesc(String uid);

    List<BloodRequest> findAllByOrderByCreatedAtDesc();

    long countByStatus(BloodRequest.Status status);

    // ── Paged variants ────────────────────────────────────────────────────────
    Page<BloodRequest> findByStatusOrderByCreatedAtDesc(BloodRequest.Status status, Pageable pageable);

    Page<BloodRequest> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
