package com.example.blood_donation.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Tracks each individual blood donation made by a donor.
 * Separate collection so it can grow independently of the User document.
 */
@Document(collection = "donation_history")
public class DonationHistory {

    @Id
    private String id;

    private String donorUid;
    private String donorName;
    private String bloodGroup;
    private String division;
    private String district;
    private String upazila;
    private String hospitalName;
    private int    unitsGiven  = 1;
    private LocalDate donatedAt;
    private String notes;
    private LocalDateTime createdAt = LocalDateTime.now();

    public DonationHistory() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getDonorUid() { return donorUid; }
    public void setDonorUid(String donorUid) { this.donorUid = donorUid; }

    public String getDonorName() { return donorName; }
    public void setDonorName(String donorName) { this.donorName = donorName; }

    public String getBloodGroup() { return bloodGroup; }
    public void setBloodGroup(String bloodGroup) { this.bloodGroup = bloodGroup; }

    public String getDivision() { return division; }
    public void setDivision(String division) { this.division = division; }

    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }

    public String getUpazila() { return upazila; }
    public void setUpazila(String upazila) { this.upazila = upazila; }

    public String getHospitalName() { return hospitalName; }
    public void setHospitalName(String hospitalName) { this.hospitalName = hospitalName; }

    public int getUnitsGiven() { return unitsGiven; }
    public void setUnitsGiven(int unitsGiven) { this.unitsGiven = unitsGiven; }

    public LocalDate getDonatedAt() { return donatedAt; }
    public void setDonatedAt(LocalDate donatedAt) { this.donatedAt = donatedAt; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
