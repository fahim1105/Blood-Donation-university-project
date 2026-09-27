package com.example.blood_donation.dto;

/**
 * DTO for PATCH /api/v1/users/me/location
 * Accepts GPS coordinates and/or Bangladesh administrative area names.
 */
public class LocationUpdateDto {

    private Double latitude;
    private Double longitude;
    private String division;
    private String district;
    private String upazila;

    public LocationUpdateDto() {}

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public String getDivision() { return division; }
    public void setDivision(String division) { this.division = division; }

    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }

    public String getUpazila() { return upazila; }
    public void setUpazila(String upazila) { this.upazila = upazila; }
}
