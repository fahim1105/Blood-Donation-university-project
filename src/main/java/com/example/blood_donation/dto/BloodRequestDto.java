package com.example.blood_donation.dto;

import java.time.LocalDate;

public class BloodRequestDto {

    private String patientName;
    private String bloodGroup;
    private String hospitalName;
    private String division;
    private String district;
    private String upazila;
    private int unitsNeeded;
    private String contactNumber;
    private LocalDate dateNeeded;

    public BloodRequestDto() {}

    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }

    public String getBloodGroup() { return bloodGroup; }
    public void setBloodGroup(String bloodGroup) { this.bloodGroup = bloodGroup; }

    public String getHospitalName() { return hospitalName; }
    public void setHospitalName(String hospitalName) { this.hospitalName = hospitalName; }

    public String getDivision() { return division; }
    public void setDivision(String division) { this.division = division; }

    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }

    public String getUpazila() { return upazila; }
    public void setUpazila(String upazila) { this.upazila = upazila; }

    public int getUnitsNeeded() { return unitsNeeded; }
    public void setUnitsNeeded(int unitsNeeded) { this.unitsNeeded = unitsNeeded; }

    public String getContactNumber() { return contactNumber; }
    public void setContactNumber(String contactNumber) { this.contactNumber = contactNumber; }

    public LocalDate getDateNeeded() { return dateNeeded; }
    public void setDateNeeded(LocalDate dateNeeded) { this.dateNeeded = dateNeeded; }
}
