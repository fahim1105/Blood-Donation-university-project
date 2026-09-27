package com.example.blood_donation.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.example.blood_donation.dto.DonorSearchResultDto;
import com.example.blood_donation.dto.LocationUpdateDto;
import com.example.blood_donation.dto.UserRegistrationDto;
import com.example.blood_donation.dto.UserUpdateDto;
import com.example.blood_donation.model.User;
import com.example.blood_donation.repository.UserRepository;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Create a DB profile for a Firebase-authenticated user if one does not exist yet
     * (Google sign-in, email login before completing registration, DB reset, etc.).
     */
    public User ensureUser(String firebaseUid, String email, String name, String photoUrl) {
        Optional<User> byUid = userRepository.findByFirebaseUid(firebaseUid);
        if (byUid.isPresent()) {
            return byUid.get();
        }

        if (email != null && !email.isBlank()) {
            Optional<User> byEmail = userRepository.findByEmail(email);
            if (byEmail.isPresent()) {
                User existing = byEmail.get();
                existing.setFirebaseUid(firebaseUid);
                if ((existing.getName() == null || existing.getName().isBlank()) && name != null) {
                    existing.setName(name);
                }
                if ((existing.getProfilePhotoUrl() == null || existing.getProfilePhotoUrl().isBlank())
                        && photoUrl != null) {
                    existing.setProfilePhotoUrl(photoUrl);
                }
                return userRepository.save(existing);
            }
        }

        User user = new User();
        user.setFirebaseUid(firebaseUid);
        user.setEmail(email);
        user.setName(name != null && !name.isBlank() ? name : "User");
        user.setProfilePhotoUrl(photoUrl);
        user.setAvailable(true);
        user.setRole(User.Role.DONOR);
        user.setActive(true);
        return userRepository.save(user);
    }

    public User registerUser(UserRegistrationDto dto) {
        // Return existing profile if already registered
        if (userRepository.existsByFirebaseUid(dto.getFirebaseUid())) {
            return userRepository.findByFirebaseUid(dto.getFirebaseUid()).orElseThrow();
        }

        User user = new User();
        user.setFirebaseUid(dto.getFirebaseUid());
        user.setName(dto.getName());
        user.setEmail(dto.getEmail());
        user.setPhone(dto.getPhone());
        user.setBloodGroup(dto.getBloodGroup());
        user.setGender(dto.getGender());
        user.setDateOfBirth(dto.getDateOfBirth());
        user.setDivision(dto.getDivision());
        user.setDistrict(dto.getDistrict());
        user.setUpazila(dto.getUpazila());
        user.setLastDonationDate(dto.getLastDonationDate());
        user.setAvailable(true);
        user.setRole(User.Role.DONOR);
        user.setActive(true);

        return userRepository.save(user);
    }

    public Optional<User> findByFirebaseUid(String uid) {
        return userRepository.findByFirebaseUid(uid);
    }

    public Optional<User> findById(String id) {
        return userRepository.findById(id);
    }

    public User updateUser(String firebaseUid, UserUpdateDto dto) {
        User user = userRepository.findByFirebaseUid(firebaseUid)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (dto.getName() != null)             user.setName(dto.getName());
        if (dto.getPhone() != null)            user.setPhone(dto.getPhone());
        if (dto.getBloodGroup() != null)       user.setBloodGroup(dto.getBloodGroup());
        if (dto.getGender() != null)           user.setGender(dto.getGender());
        if (dto.getDateOfBirth() != null)      user.setDateOfBirth(dto.getDateOfBirth());
        if (dto.getDistrict() != null)         user.setDistrict(dto.getDistrict());
        if (dto.getUpazila() != null)          user.setUpazila(dto.getUpazila());
        if (dto.getLastDonationDate() != null) user.setLastDonationDate(dto.getLastDonationDate());
        if (dto.getIsAvailable() != null)      user.setAvailable(dto.getIsAvailable());
        // Location fields
        if (dto.getDivision() != null)         user.setDivision(dto.getDivision());
        if (dto.getLatitude() != null)         user.setLatitude(dto.getLatitude());
        if (dto.getLongitude() != null)        user.setLongitude(dto.getLongitude());
        // Profile photo
        if (dto.getProfilePhotoUrl() != null)  user.setProfilePhotoUrl(dto.getProfilePhotoUrl());

        return userRepository.save(user);
    }

    /**
     * Save donor location: GPS + administrative area.
     * Updates locationUpdatedAt timestamp.
     */
    public User updateLocation(String firebaseUid, LocationUpdateDto dto) {
        User user = userRepository.findByFirebaseUid(firebaseUid)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (dto.getLatitude()  != null) user.setLatitude(dto.getLatitude());
        if (dto.getLongitude() != null) user.setLongitude(dto.getLongitude());
        if (dto.getDivision()  != null) user.setDivision(dto.getDivision());
        if (dto.getDistrict()  != null) user.setDistrict(dto.getDistrict());
        if (dto.getUpazila()   != null) user.setUpazila(dto.getUpazila());
        user.setLocationUpdatedAt(LocalDateTime.now());

        return userRepository.save(user);
    }

    /**
     * Search available donors: blood group + district,
     * last donation > 90 days ago (or never donated).
     * Excludes the current user from results.
     */
    public List<User> searchDonors(String bloodGroup, String district, String currentUserUid) {
        LocalDate cutoff = LocalDate.now().minusDays(90);

        boolean hasBg   = bloodGroup != null && !bloodGroup.isBlank();
        boolean hasDist = district   != null && !district.isBlank();

        List<User> results;
        if (hasBg && hasDist) {
            results = userRepository.findAvailableDonors(bloodGroup, district, cutoff);
        } else if (hasDist) {
            results = userRepository.findAvailableDonorsByDistrict(district, cutoff);
        } else if (hasBg) {
            results = userRepository.findAvailableDonorsByBloodGroup(bloodGroup, cutoff);
        } else {
            results = Collections.emptyList();
        }

        // ✅ Filter out current user from search results
        if (currentUserUid != null && !currentUserUid.isBlank()) {
            results = results.stream()
                .filter(user -> !currentUserUid.equals(user.getFirebaseUid()))
                .collect(Collectors.toList());
        }

        return results;
    }

    /**
     * Location-aware donor search.
     * Filters by blood group, division, district, upazila (any combination).
     * If seekerLat/seekerLng provided, computes Haversine distance for each
     * donor that has GPS coordinates, and sorts results by distance ascending.
     * Excludes the current user from results.
     */
    public List<DonorSearchResultDto> searchDonorsByLocation(
            String bloodGroup, String division, String district,
            String upazila, Double seekerLat, Double seekerLng, String currentUserUid) {

        LocalDate cutoff = LocalDate.now().minusDays(90);
        boolean hasBg   = bloodGroup != null && !bloodGroup.isBlank();
        boolean hasDiv  = division   != null && !division.isBlank();
        boolean hasDist = district   != null && !district.isBlank();
        boolean hasUpa  = upazila    != null && !upazila.isBlank();

        List<User> users;

        // Pick the most specific query available
        if (hasBg && hasDiv && hasDist) {
            users = userRepository.findAvailableDonorsByLocation(bloodGroup, division, district, cutoff);
        } else if (hasBg && hasDist && hasUpa) {
            users = userRepository.findAvailableDonorsByDistrictAndUpazila(bloodGroup, district, upazila, cutoff);
        } else if (hasBg && hasDist) {
            users = userRepository.findAvailableDonors(bloodGroup, district, cutoff);
        } else if (hasBg && hasDiv) {
            users = userRepository.findAvailableDonorsByBloodGroupAndDivision(bloodGroup, division, cutoff);
        } else if (hasDiv && hasDist) {
            users = userRepository.findAvailableDonorsByDivisionAndDistrict(division, district, cutoff);
        } else if (hasDiv) {
            users = userRepository.findAvailableDonorsByDivision(division, cutoff);
        } else if (hasDist) {
            users = userRepository.findAvailableDonorsByDistrict(district, cutoff);
        } else if (hasBg) {
            users = userRepository.findAvailableDonorsByBloodGroup(bloodGroup, cutoff);
        } else {
            return Collections.emptyList();
        }

        // ✅ Filter out current user from search results
        if (currentUserUid != null && !currentUserUid.isBlank()) {
            users = users.stream()
                .filter(user -> !currentUserUid.equals(user.getFirebaseUid()))
                .collect(Collectors.toList());
        }

        // Map to DTOs and compute distance if seeker has GPS
        List<DonorSearchResultDto> results = users.stream()
                .map(DonorSearchResultDto::from)
                .collect(Collectors.toList());

        boolean seekerHasGps = seekerLat != null && seekerLng != null;
        if (seekerHasGps) {
            results.forEach(dto -> {
                if (dto.getLatitude() != null && dto.getLongitude() != null) {
                    double dist = haversineDistance(seekerLat, seekerLng,
                                                    dto.getLatitude(), dto.getLongitude());
                    // Round to 1 decimal place
                    dto.setDistanceKm(Math.round(dist * 10.0) / 10.0);
                }
            });
            // Sort: donors with GPS first (by distance asc), then donors without GPS
            results.sort(Comparator.comparing(
                    dto -> dto.getDistanceKm() != null ? dto.getDistanceKm() : Double.MAX_VALUE
            ));
        }

        return results;
    }

    /**
     * Haversine formula — returns great-circle distance in kilometres.
     */
    private static double haversineDistance(double lat1, double lng1, double lat2, double lng2) {
        final double R = 6371.0; // Earth radius in km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                 + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                 * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    public long getTotalDonors() {
        return userRepository.countByActiveTrue();
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Page<User> getAllUsersPaged(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return userRepository.findAll(pageable);
    }

    public void deactivateUser(String id) {
        userRepository.findById(id).ifPresent(user -> {
            user.setActive(false);
            userRepository.save(user);
        });
    }

    public User changeUserRole(String id, User.Role role) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setRole(role);
        return userRepository.save(user);
    }

    public void reactivateUser(String id) {
        userRepository.findById(id).ifPresent(user -> {
            user.setActive(true);
            userRepository.save(user);
        });
    }
}
