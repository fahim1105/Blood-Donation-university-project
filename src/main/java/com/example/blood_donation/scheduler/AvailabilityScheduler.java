package com.example.blood_donation.scheduler;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.example.blood_donation.model.DirectRequest;
import com.example.blood_donation.model.User;
import com.example.blood_donation.repository.DirectRequestRepository;
import com.example.blood_donation.repository.UserRepository;

@Component
public class AvailabilityScheduler {

    private static final Logger log = LoggerFactory.getLogger(AvailabilityScheduler.class);
    private final UserRepository userRepository;
    private final DirectRequestRepository directRequestRepository;

    public AvailabilityScheduler(UserRepository userRepository,
                                  DirectRequestRepository directRequestRepository) {
        this.userRepository = userRepository;
        this.directRequestRepository = directRequestRepository;
    }

    /**
     * Runs daily at midnight to reset donor availability after 90 days
     */
    @Scheduled(cron = "0 0 0 * * *")
    public void resetDonorAvailability() {
        LocalDate cutoff = LocalDate.now().minusDays(90);
        List<User> donors = userRepository.findDonorsToReset(cutoff);
        
        int count = 0;
        for (User user : donors) {
            user.setAvailable(true);
            userRepository.save(user);
            count++;
        }
        
        if (count > 0) {
            log.info("✅ Donor availability reset: {} donors are now available to donate", count);
        }
    }

    /**
     * Runs daily at 1 AM to expire old pending DirectRequests (after 7 days)
     */
    @Scheduled(cron = "0 0 1 * * *")
    public void expirePendingDirectRequests() {
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
        List<DirectRequest> expiredRequests = directRequestRepository
            .findByStatusAndCreatedAtBefore(DirectRequest.Status.PENDING, sevenDaysAgo);
        
        int count = 0;
        for (DirectRequest req : expiredRequests) {
            req.setStatus(DirectRequest.Status.EXPIRED);
            directRequestRepository.save(req);
            count++;
        }
        
        if (count > 0) {
            log.info("⏰ DirectRequest expiry: {} pending requests have been marked as EXPIRED", count);
        }
    }
}
