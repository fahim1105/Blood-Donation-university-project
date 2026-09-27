package com.example.blood_donation.model;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "blood_requests")
public class BloodRequest {

    @Id
    private String id;

    private String patientName;
    private String bloodGroup;
    private String hospitalName;
    private String division;
    private String district;
    private String upazila;
    private int unitsNeeded;
    private String contactNumber;
    private LocalDate dateNeeded;
    private Status status = Status.PENDING;
    private LocalDateTime createdAt = LocalDateTime.now();
    private String requestedByUid;
    private String requestedByName;

    /** Donors who responded "I can donate" to this request */
    private List<DonorResponse> donorResponses = new ArrayList<>();

    public enum Status { PENDING, FULFILLED, CANCELLED }

    // ── Embedded DonorResponse ────────────────────────────────────────────────

    public static class DonorResponse {
        private String donorUid;
        private String donorName;
        private String donorPhone;
        private String donorBloodGroup;
        private LocalDateTime respondedAt;
        private ResponseStatus status = ResponseStatus.OFFERED;

        public enum ResponseStatus { OFFERED, WITHDRAWN }

        public DonorResponse() {}

        public String getDonorUid() { return donorUid; }
        public void setDonorUid(String donorUid) { this.donorUid = donorUid; }

        public String getDonorName() { return donorName; }
        public void setDonorName(String donorName) { this.donorName = donorName; }

        public String getDonorPhone() { return donorPhone; }
        public void setDonorPhone(String donorPhone) { this.donorPhone = donorPhone; }

        public String getDonorBloodGroup() { return donorBloodGroup; }
        public void setDonorBloodGroup(String donorBloodGroup) { this.donorBloodGroup = donorBloodGroup; }

        public LocalDateTime getRespondedAt() { return respondedAt; }
        public void setRespondedAt(LocalDateTime respondedAt) { this.respondedAt = respondedAt; }

        public ResponseStatus getStatus() { return status; }
        public void setStatus(ResponseStatus status) { this.status = status; }
    }

    // ── Main getters / setters ────────────────────────────────────────────────

    public BloodRequest() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

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

    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getRequestedByUid() { return requestedByUid; }
    public void setRequestedByUid(String requestedByUid) { this.requestedByUid = requestedByUid; }

    public String getRequestedByName() { return requestedByName; }
    public void setRequestedByName(String requestedByName) { this.requestedByName = requestedByName; }

    public List<DonorResponse> getDonorResponses() { return donorResponses; }
    public void setDonorResponses(List<DonorResponse> donorResponses) { this.donorResponses = donorResponses; }
}
