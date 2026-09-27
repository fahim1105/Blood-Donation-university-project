package com.example.blood_donation.dto;

import java.time.LocalDate;

public class DonationHistoryDto {

    private String    hospitalName;
    private String    division;
    private String    district;
    private String    upazila;
    private int       unitsGiven = 1;
    private LocalDate donatedAt;
    private String    notes;

    public DonationHistoryDto() {}

    public String getHospitalName() { return hospitalName; }
    public void setHospitalName(String hospitalName) { this.hospitalName = hospitalName; }

    public String getDivision() { return division; }
    public void setDivision(String division) { this.division = division; }

    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }

    public String getUpazila() { return upazila; }
    public void setUpazila(String upazila) { this.upazila = upazila; }

    public int getUnitsGiven() { return unitsGiven; }
    public void setUnitsGiven(int unitsGiven) { this.unitsGiven = unitsGiven; }

    public LocalDate getDonatedAt() { return donatedAt; }
    public void setDonatedAt(LocalDate donatedAt) { this.donatedAt = donatedAt; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
