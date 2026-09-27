package com.example.blood_donation.service;

import com.example.blood_donation.dto.DonationHistoryDto;
import com.example.blood_donation.model.DonationHistory;
import com.example.blood_donation.model.User;
import com.example.blood_donation.repository.DonationHistoryRepository;
import com.example.blood_donation.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Service
public class DonationHistoryService {

    private final DonationHistoryRepository donationHistoryRepository;
    private final UserRepository            userRepository;

    public DonationHistoryService(DonationHistoryRepository donationHistoryRepository,
                                   UserRepository userRepository) {
        this.donationHistoryRepository = donationHistoryRepository;
        this.userRepository            = userRepository;
    }

    /**
     * Log a donation.
     * Also updates user.lastDonationDate and sets user.available = false
     * (donor cannot donate again until 90 days pass — scheduler will reset).
     */
    public DonationHistory logDonation(String donorUid, DonationHistoryDto dto) {
        User user = userRepository.findByFirebaseUid(donorUid)
                .orElseThrow(() -> new RuntimeException("User not found"));

        DonationHistory history = new DonationHistory();
        history.setDonorUid(donorUid);
        history.setDonorName(user.getName());
        history.setBloodGroup(user.getBloodGroup());
        history.setHospitalName(dto.getHospitalName());
        history.setDivision(dto.getDivision() != null ? dto.getDivision() : user.getDivision());
        history.setDistrict(dto.getDistrict() != null ? dto.getDistrict() : user.getDistrict());
        history.setUpazila(dto.getUpazila() != null ? dto.getUpazila() : user.getUpazila());
        history.setUnitsGiven(dto.getUnitsGiven() > 0 ? dto.getUnitsGiven() : 1);
        history.setDonatedAt(dto.getDonatedAt());
        history.setNotes(dto.getNotes());

        DonationHistory saved = donationHistoryRepository.save(history);

        // Update user: record last donation date + mark unavailable
        if (dto.getDonatedAt() != null) {
            user.setLastDonationDate(dto.getDonatedAt());
        }
        user.setAvailable(false);
        userRepository.save(user);

        return saved;
    }

    public List<DonationHistory> getHistory(String donorUid) {
        return donationHistoryRepository.findByDonorUidOrderByDonatedAtDesc(donorUid);
    }

    public long getCount(String donorUid) {
        return donationHistoryRepository.countByDonorUid(donorUid);
    }
}
