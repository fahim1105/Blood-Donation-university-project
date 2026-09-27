package com.example.blood_donation.repository;

import com.example.blood_donation.model.DonationHistory;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DonationHistoryRepository extends MongoRepository<DonationHistory, String> {

    List<DonationHistory> findByDonorUidOrderByDonatedAtDesc(String donorUid);

    long countByDonorUid(String donorUid);
}
