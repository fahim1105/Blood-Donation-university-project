package com.example.blood_donation.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.example.blood_donation.model.User;

/**
 * Read-only projection of a User returned from donor search.
 * Includes an optional distanceKm field computed server-side via Haversine.
 * Phone is included only for authenticated callers — scrubbing is done at the
 * controller level if needed; for now we return it and let the frontend decide.
 */
public class DonorSearchResultDto {

    private String id;
    private String firebaseUid;  // Firebase UID for direct requests
    private String name;
    private String bloodGroup;
    private String district;
    private String upazila;
    private String division;
    private String phone;
    private LocalDate lastDonationDate;
    private boolean available;
    private Double latitude;
    private Double longitude;
    private LocalDateTime locationUpdatedAt;
    private String profilePhotoUrl;

    /** Computed by UserService via Haversine — null if either party has no GPS. */
    private Double distanceKm;

    public DonorSearchResultDto() {}

    /** Build from a User entity. distanceKm is set separately. */
    public static DonorSearchResultDto from(User u) {
        DonorSearchResultDto dto = new DonorSearchResultDto();
        dto.id                = u.getId();
        dto.firebaseUid       = u.getFirebaseUid();  // Add Firebase UID
        dto.name              = u.getName();
        dto.bloodGroup        = u.getBloodGroup();
        dto.district          = u.getDistrict();
        dto.upazila           = u.getUpazila();
        dto.division          = u.getDivision();
        dto.phone             = u.getPhone();
        dto.lastDonationDate  = u.getLastDonationDate();
        dto.available         = u.isAvailable();
        dto.latitude          = u.getLatitude();
        dto.longitude         = u.getLongitude();
        dto.locationUpdatedAt = u.getLocationUpdatedAt();
        dto.profilePhotoUrl   = u.getProfilePhotoUrl();
        return dto;
    }

    // ── Getters & Setters ─────────────────────────────────────────────────────

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getFirebaseUid() { return firebaseUid; }
    public void setFirebaseUid(String firebaseUid) { this.firebaseUid = firebaseUid; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getBloodGroup() { return bloodGroup; }
    public void setBloodGroup(String bloodGroup) { this.bloodGroup = bloodGroup; }

    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }

    public String getUpazila() { return upazila; }
    public void setUpazila(String upazila) { this.upazila = upazila; }

    public String getDivision() { return division; }
    public void setDivision(String division) { this.division = division; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public LocalDate getLastDonationDate() { return lastDonationDate; }
    public void setLastDonationDate(LocalDate lastDonationDate) { this.lastDonationDate = lastDonationDate; }

    public boolean isAvailable() { return available; }
    public void setAvailable(boolean available) { this.available = available; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public LocalDateTime getLocationUpdatedAt() { return locationUpdatedAt; }
    public void setLocationUpdatedAt(LocalDateTime locationUpdatedAt) { this.locationUpdatedAt = locationUpdatedAt; }

    public Double getDistanceKm() { return distanceKm; }
    public void setDistanceKm(Double distanceKm) { this.distanceKm = distanceKm; }

    public String getProfilePhotoUrl() { return profilePhotoUrl; }
    public void setProfilePhotoUrl(String profilePhotoUrl) { this.profilePhotoUrl = profilePhotoUrl; }
}
