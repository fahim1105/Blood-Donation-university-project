package com.example.blood_donation.model;

import java.time.LocalDate;
import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * DirectRequest - User A sends a direct request to User B (Donor)
 * Status flow: PENDING -> ACCEPTED/DECLINED
 */
@Document(collection = "direct_requests")
public class DirectRequest {

    @Id
    private String id;

    // Requester (User A)
    private String requesterUid;
    private String requesterName;
    private String requesterEmail;
    private String requesterPhone;

    // Donor (User B)
    private String donorUid;
    private String donorName;
    private String donorEmail;

    // Request Details
    private String patientName;
    private String bloodGroup;
    private String hospitalName;
    private String division;
    private String district;
    private String upazila;
    private int unitsNeeded;
    private String contactPhone;
    private LocalDate requiredDate;

    // Status & Tracking
    private Status status = Status.PENDING;
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime respondedAt;
    private String responseMessage;

    public enum Status {
        PENDING,    // Initial state - waiting for donor response
        ACCEPTED,   // Donor accepted the request
        DECLINED,   // Donor declined the request
        EXPIRED     // Request expired (optional - for auto-expiry after X days)
    }

    // Constructors
    public DirectRequest() {}

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getRequesterUid() { return requesterUid; }
    public void setRequesterUid(String requesterUid) { this.requesterUid = requesterUid; }

    public String getRequesterName() { return requesterName; }
    public void setRequesterName(String requesterName) { this.requesterName = requesterName; }

    public String getRequesterEmail() { return requesterEmail; }
    public void setRequesterEmail(String requesterEmail) { this.requesterEmail = requesterEmail; }

    public String getRequesterPhone() { return requesterPhone; }
    public void setRequesterPhone(String requesterPhone) { this.requesterPhone = requesterPhone; }

    public String getDonorUid() { return donorUid; }
    public void setDonorUid(String donorUid) { this.donorUid = donorUid; }

    public String getDonorName() { return donorName; }
    public void setDonorName(String donorName) { this.donorName = donorName; }

    public String getDonorEmail() { return donorEmail; }
    public void setDonorEmail(String donorEmail) { this.donorEmail = donorEmail; }

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

    public String getContactPhone() { return contactPhone; }
    public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }

    public LocalDate getRequiredDate() { return requiredDate; }
    public void setRequiredDate(LocalDate requiredDate) { this.requiredDate = requiredDate; }

    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getRespondedAt() { return respondedAt; }
    public void setRespondedAt(LocalDateTime respondedAt) { this.respondedAt = respondedAt; }

    public String getResponseMessage() { return responseMessage; }
    public void setResponseMessage(String responseMessage) { this.responseMessage = responseMessage; }
}
