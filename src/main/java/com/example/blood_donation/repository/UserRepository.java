package com.example.blood_donation.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import com.example.blood_donation.model.User;

@Repository
public interface UserRepository extends MongoRepository<User, String> {

    Optional<User> findByFirebaseUid(String firebaseUid);

    Optional<User> findByEmail(String email);

    boolean existsByFirebaseUid(String firebaseUid);

    boolean existsByEmail(String email);

    // Blood group + district — null lastDonationDate = never donated = always eligible
    @Query("{ 'bloodGroup': ?0, 'district': ?1, 'available': true, 'active': true, " +
           "$or: [ { 'lastDonationDate': null }, { 'lastDonationDate': { $lte: ?2 } } ] }")
    List<User> findAvailableDonors(String bloodGroup, String district, LocalDate cutoffDate);

    // District only
    @Query("{ 'district': ?0, 'available': true, 'active': true, " +
           "$or: [ { 'lastDonationDate': null }, { 'lastDonationDate': { $lte: ?1 } } ] }")
    List<User> findAvailableDonorsByDistrict(String district, LocalDate cutoffDate);

    // Blood group only
    @Query("{ 'bloodGroup': ?0, 'available': true, 'active': true, " +
           "$or: [ { 'lastDonationDate': null }, { 'lastDonationDate': { $lte: ?1 } } ] }")
    List<User> findAvailableDonorsByBloodGroup(String bloodGroup, LocalDate cutoffDate);

    long countByActiveTrue();

    long countByRoleAndActiveTrue(User.Role role);

    // Find donors to auto-reset: available=false but donated 90+ days ago
    @Query("{ 'available': false, 'active': true, 'lastDonationDate': { $lte: ?0 } }")
    List<User> findDonorsToReset(java.time.LocalDate cutoffDate);

    // ── Location-based queries ─────────────────────────────────────────────────

    // Blood group + division + district
    @Query("{ 'bloodGroup': ?0, 'division': ?1, 'district': ?2, 'available': true, 'active': true, " +
           "$or: [ { 'lastDonationDate': null }, { 'lastDonationDate': { $lte: ?3 } } ] }")
    List<User> findAvailableDonorsByLocation(String bloodGroup, String division,
                                              String district, LocalDate cutoffDate);

    // Division + district (no blood group)
    @Query("{ 'division': ?0, 'district': ?1, 'available': true, 'active': true, " +
           "$or: [ { 'lastDonationDate': null }, { 'lastDonationDate': { $lte: ?2 } } ] }")
    List<User> findAvailableDonorsByDivisionAndDistrict(String division, String district, LocalDate cutoffDate);

    // Blood group + division (no district)
    @Query("{ 'bloodGroup': ?0, 'division': ?1, 'available': true, 'active': true, " +
           "$or: [ { 'lastDonationDate': null }, { 'lastDonationDate': { $lte: ?2 } } ] }")
    List<User> findAvailableDonorsByBloodGroupAndDivision(String bloodGroup, String division, LocalDate cutoffDate);

    // Division only
    @Query("{ 'division': ?0, 'available': true, 'active': true, " +
           "$or: [ { 'lastDonationDate': null }, { 'lastDonationDate': { $lte: ?1 } } ] }")
    List<User> findAvailableDonorsByDivision(String division, LocalDate cutoffDate);

    // Blood group + district + upazila
    @Query("{ 'bloodGroup': ?0, 'district': ?1, 'upazila': ?2, 'available': true, 'active': true, " +
           "$or: [ { 'lastDonationDate': null }, { 'lastDonationDate': { $lte: ?3 } } ] }")
    List<User> findAvailableDonorsByDistrictAndUpazila(String bloodGroup, String district,
                                                        String upazila, LocalDate cutoffDate);
}
