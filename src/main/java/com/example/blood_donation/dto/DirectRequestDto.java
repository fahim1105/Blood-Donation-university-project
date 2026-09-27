package com.example.blood_donation.dto;

import java.time.LocalDate;

/**
 * DTO for creating a Direct Request from User A to User B (Donor)
 */
public class DirectRequestDto {

    private String donorUid;        // Target donor's Firebase UID
    private String patientName;     // Patient who needs blood
    private String hospitalName;    // Hospital location
    private String division;
    private String district;
    private String upazila;
    private String bloodGroup;      // Required blood group
    private int unitsNeeded;        // Units of blood needed
    private String contactPhone;    // Contact number for this request
    private LocalDate requiredDate; // When blood is needed

    public DirectRequestDto() {}

    // Getters and Setters
    public String getDonorUid() { return donorUid; }
    public void setDonorUid(String donorUid) { this.donorUid = donorUid; }

    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }

    public String getHospitalName() { return hospitalName; }
    public void setHospitalName(String hospitalName) { this.hospitalName = hospitalName; }

    public String getDivision() { return division; }
    public void setDivision(String division) { this.division = division; }

    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }

    public String getUpazila() { return upazila; }
    public void setUpazila(String upazila) { this.upazila = upazila; }

    public String getBloodGroup() { return bloodGroup; }
    public void setBloodGroup(String bloodGroup) { this.bloodGroup = bloodGroup; }

    public int getUnitsNeeded() { return unitsNeeded; }
    public void setUnitsNeeded(int unitsNeeded) { this.unitsNeeded = unitsNeeded; }

    public String getContactPhone() { return contactPhone; }
    public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }

    public LocalDate getRequiredDate() { return requiredDate; }
    public void setRequiredDate(LocalDate requiredDate) { this.requiredDate = requiredDate; }
}
