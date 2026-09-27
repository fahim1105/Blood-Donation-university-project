package com.example.blood_donation.controller;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import com.example.blood_donation.model.BloodRequest;
import com.example.blood_donation.model.User;
import com.example.blood_donation.service.BloodRequestService;
import com.example.blood_donation.service.UserService;

@Controller
public class PageController {

    private final BloodRequestService bloodRequestService;
    private final UserService userService;

    public PageController(BloodRequestService bloodRequestService, UserService userService) {
        this.bloodRequestService = bloodRequestService;
        this.userService = userService;
    }

    @GetMapping("/")
    public String home(Model model) {
        List<BloodRequest> urgentRequests;
        long totalDonors = 1247, livesSaved = 892, pendingCount = 3;
        boolean isDemo = true;

        try {
            urgentRequests = new ArrayList<>(bloodRequestService.getPendingRequests());
            totalDonors    = userService.getTotalDonors();
            livesSaved     = bloodRequestService.countFulfilled();
            pendingCount   = bloodRequestService.countPending();
            isDemo         = urgentRequests.isEmpty();
            if (urgentRequests.isEmpty()) urgentRequests = demoUrgentRequests();
            if (totalDonors == 0) totalDonors = 1247;
            if (livesSaved  == 0) livesSaved  = 892;
        } catch (Exception e) {
            urgentRequests = demoUrgentRequests();
        }

        model.addAttribute("urgentRequests",   urgentRequests.stream().limit(6).toList());
        model.addAttribute("totalDonors",      totalDonors);
        model.addAttribute("livesSaved",       livesSaved);
        model.addAttribute("districtsCovered", 64);
        model.addAttribute("pendingRequests",  pendingCount);
        model.addAttribute("isDemoData",       isDemo);
        return "index";
    }

    private List<BloodRequest> demoUrgentRequests() {
        List<BloodRequest> demos = new ArrayList<>();
        BloodRequest r1 = new BloodRequest();
        r1.setPatientName("Rahim Khan"); r1.setBloodGroup("O-");
        r1.setHospitalName("Dhaka Medical College"); r1.setDistrict("Dhaka");
        r1.setUnitsNeeded(3); r1.setContactNumber("01700000001");
        r1.setDateNeeded(LocalDate.now()); demos.add(r1);

        BloodRequest r2 = new BloodRequest();
        r2.setPatientName("Fatima Begum"); r2.setBloodGroup("A+");
        r2.setHospitalName("Square Hospital"); r2.setDistrict("Dhaka");
        r2.setUnitsNeeded(2); r2.setContactNumber("01700000002");
        r2.setDateNeeded(LocalDate.now().plusDays(1)); demos.add(r2);

        BloodRequest r3 = new BloodRequest();
        r3.setPatientName("Karim Ahmed"); r3.setBloodGroup("B+");
        r3.setHospitalName("Chittagong Medical"); r3.setDistrict("Chittagong");
        r3.setUnitsNeeded(1); r3.setContactNumber("01700000003");
        r3.setDateNeeded(LocalDate.now()); demos.add(r3);
        return demos;
    }

    @GetMapping("/login")
    public String login() {
        return "login";
    }

    @GetMapping("/register")
    public String register() {
        return "register";
    }

    @GetMapping("/search")
    public String search(Model model) {
        model.addAttribute("bloodGroups",
                List.of("A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"));
        return "search";
    }

    @GetMapping("/profile")
    public String profile(Model model, Authentication auth) {
        if (auth != null) {
            String uid = (String) auth.getPrincipal();
            Optional<User> userOpt = userService.findByFirebaseUid(uid);
            userOpt.ifPresent(user -> model.addAttribute("user", user));
        }
        return "profile";
    }

    @GetMapping("/request-blood")
    public String requestBloodPage(Model model) {
        model.addAttribute("bloodGroups",
                List.of("A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"));
        return "request-blood";
    }

    @GetMapping("/my-requests")
    public String myRequests(Model model, Authentication auth) {
        if (auth != null) {
            String uid = (String) auth.getPrincipal();
            model.addAttribute("requests", bloodRequestService.getRequestsByUser(uid));
        }
        return "my-requests";
    }

    @GetMapping("/inbox")
    public String inbox() {
        return "inbox";
    }

    @GetMapping("/admin/dashboard")
    public String adminDashboard(Model model) {
        // Auth is handled client-side via Firebase JS SDK + admin/dashboard.html inline check
        // Server-side auth is enforced on /api/v1/admin/** REST endpoints (hasRole ADMIN)
        return "admin/dashboard";
    }

    // ═══════════════════════════════════════════════════════════
    // ⭐ ERROR PAGES
    // ═══════════════════════════════════════════════════════════

    /**
     * 404 - Not Found
     * Handles requests to non-existent routes
     */
    @GetMapping("/404")
    public String notFound() {
        return "error/404";
    }

    /**
     * 403 - Forbidden
     * Displayed when user lacks necessary permissions
     */
    @GetMapping("/403")
    public String forbidden() {
        return "error/403";
    }

    /**
     * 500 - Internal Server Error (optional)
     */
    @GetMapping("/500")
    public String serverError() {
        return "error/500";
    }

    /**
     * Privacy Policy page
     */
    @GetMapping("/privacy-policy")
    public String privacyPolicy() {
        return "privacy-policy";
    }

    /**
     * Terms & Conditions page
     */
    @GetMapping("/terms-conditions")
    public String termsConditions() {
        return "terms-conditions";
    }
}
