package com.example.blood_donation.service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.example.blood_donation.model.DirectRequest;

import jakarta.mail.internet.MimeMessage;

/**
 * EmailService - Handles all email notifications asynchronously
 * Uses JavaMailSender with HTML templates
 */
@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    private static final String FROM_EMAIL = "hemo.blood.donation.web.service@gmail.com";
    private static final String APP_NAME = "HEMO®";
    
    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Send email to donor when they receive a direct request
     */
    @Async("emailTaskExecutor")
    public void sendDirectRequestToDonor(DirectRequest request) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(FROM_EMAIL, APP_NAME);
            helper.setTo(request.getDonorEmail());
            helper.setSubject("🩸 New Blood Donation Request from " + request.getRequesterName());

            String htmlContent = buildDirectRequestEmailHtml(request);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            logger.info("✅ Direct request email sent to donor: {}", request.getDonorEmail());

        } catch (Exception e) {
            logger.error("❌ Failed to send direct request email to donor: {}", request.getDonorEmail(), e);
        }
    }

    /**
     * Send confirmation email to requester when donor accepts
     */
    @Async("emailTaskExecutor")
    public void sendAcceptanceConfirmationToRequester(DirectRequest request) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(FROM_EMAIL, APP_NAME);
            helper.setTo(request.getRequesterEmail());
            helper.setSubject("✅ " + request.getDonorName() + " Accepted Your Blood Request!");

            String htmlContent = buildAcceptanceEmailHtml(request);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            logger.info("✅ Acceptance confirmation email sent to requester: {}", request.getRequesterEmail());

        } catch (Exception e) {
            logger.error("❌ Failed to send acceptance email to requester: {}", request.getRequesterEmail(), e);
        }
    }

    /**
     * Send notification email to requester when donor declines
     */
    @Async("emailTaskExecutor")
    public void sendDeclinationNotificationToRequester(DirectRequest request) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(FROM_EMAIL, APP_NAME);
            helper.setTo(request.getRequesterEmail());
            helper.setSubject("Blood Request Update from " + request.getDonorName());

            String htmlContent = buildDeclinationEmailHtml(request);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            logger.info("✅ Declination notification email sent to requester: {}", request.getRequesterEmail());

        } catch (Exception e) {
            logger.error("❌ Failed to send declination email to requester: {}", request.getRequesterEmail(), e);
        }
    }

    /**
     * Send notification to request owner when someone clicks "I Can Donate"
     */
    @Async("emailTaskExecutor")
    public void sendDonorResponseNotification(String requesterEmail, String requesterName,
                                               String donorName, String donorPhone, 
                                               String donorBloodGroup, String hospitalName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(FROM_EMAIL, APP_NAME);
            helper.setTo(requesterEmail);
            helper.setSubject("🩸 " + donorName + " Can Donate Blood!");

            String htmlContent = buildDonorResponseEmailHtml(
                requesterName, donorName, donorPhone, donorBloodGroup, hospitalName
            );
            helper.setText(htmlContent, true);

            mailSender.send(message);
            logger.info("✅ Donor response notification sent to requester: {}", requesterEmail);

        } catch (Exception e) {
            logger.error("❌ Failed to send donor response notification: {}", requesterEmail, e);
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // HTML EMAIL TEMPLATES
    // ═══════════════════════════════════════════════════════════════════

    private String buildDirectRequestEmailHtml(DirectRequest request) {
        String location = buildLocationString(request.getDivision(), request.getDistrict(), request.getUpazila());
        String formattedDate = request.getRequiredDate() != null 
            ? request.getRequiredDate().format(DateTimeFormatter.ofPattern("MMMM dd, yyyy")) 
            : "As soon as possible";

        String acceptUrl = "http://localhost:8080/direct-requests/" + request.getId() + "/accept";
        String declineUrl = "http://localhost:8080/direct-requests/" + request.getId() + "/decline";

        return "<!DOCTYPE html>" +
            "<html><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1.0'></head>" +
            "<body style='margin:0;padding:0;font-family:Arial,sans-serif;background:#f5f5f5;'>" +
            "<div style='max-width:600px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);'>" +
            
            "<!-- Header -->" +
            "<div style='background:linear-gradient(135deg,#DC2626,#b91c1c);padding:32px;text-align:center;'>" +
            "<h1 style='margin:0;color:#ffffff;font-size:32px;font-weight:700;'>HEMO®</h1>" +
            "<p style='margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:16px;'>Blood Donation Request</p>" +
            "</div>" +
            
            "<!-- Content -->" +
            "<div style='padding:32px;'>" +
            "<p style='margin:0 0 24px;color:#333;font-size:16px;line-height:1.6;'>Hi <strong>" + request.getDonorName() + "</strong>,</p>" +
            "<p style='margin:0 0 24px;color:#555;font-size:15px;line-height:1.6;'>" +
            "<strong>" + request.getRequesterName() + "</strong> has sent you a blood donation request. " +
            "A patient urgently needs your help.</p>" +
            
            "<!-- Request Details Card -->" +
            "<div style='background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:24px;'>" +
            "<h3 style='margin:0 0 16px;color:#DC2626;font-size:18px;'>Request Details</h3>" +
            "<table style='width:100%;border-collapse:collapse;'>" +
            "<tr><td style='padding:8px 0;color:#666;font-size:14px;'>👤 Patient:</td><td style='padding:8px 0;color:#333;font-size:14px;font-weight:600;'>" + request.getPatientName() + "</td></tr>" +
            "<tr><td style='padding:8px 0;color:#666;font-size:14px;'>🩸 Blood Group:</td><td style='padding:8px 0;color:#DC2626;font-size:16px;font-weight:700;'>" + request.getBloodGroup() + "</td></tr>" +
            "<tr><td style='padding:8px 0;color:#666;font-size:14px;'>🏥 Hospital:</td><td style='padding:8px 0;color:#333;font-size:14px;font-weight:600;'>" + request.getHospitalName() + "</td></tr>" +
            "<tr><td style='padding:8px 0;color:#666;font-size:14px;'>📍 Location:</td><td style='padding:8px 0;color:#333;font-size:14px;'>" + location + "</td></tr>" +
            "<tr><td style='padding:8px 0;color:#666;font-size:14px;'>💧 Units Needed:</td><td style='padding:8px 0;color:#333;font-size:14px;font-weight:600;'>" + request.getUnitsNeeded() + " unit(s)</td></tr>" +
            "<tr><td style='padding:8px 0;color:#666;font-size:14px;'>📅 Needed By:</td><td style='padding:8px 0;color:#333;font-size:14px;font-weight:600;'>" + formattedDate + "</td></tr>" +
            "<tr><td style='padding:8px 0;color:#666;font-size:14px;'>📞 Contact:</td><td style='padding:8px 0;color:#333;font-size:14px;font-weight:600;'>" + request.getContactPhone() + "</td></tr>" +
            "</table></div>" +
            
            "<!-- Action Buttons -->" +
            "<p style='margin:0 0 16px;color:#555;font-size:15px;'>Can you help?</p>" +
            "<div style='text-align:center;margin-bottom:24px;'>" +
            "<a href='" + acceptUrl + "' style='display:inline-block;background:#22c55e;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:16px;margin:0 8px 12px;'>✅ Accept Request</a>" +
            "<a href='" + declineUrl + "' style='display:inline-block;background:#6b7280;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:16px;margin:0 8px 12px;'>❌ Decline</a>" +
            "</div>" +
            
            "<p style='margin:24px 0 0;padding:16px;background:#fef3c7;border-left:4px solid #f59e0b;color:#92400e;font-size:14px;line-height:1.5;border-radius:4px;'>" +
            "⚠️ <strong>Important:</strong> Please respond only if you're eligible to donate (donated 90+ days ago).</p>" +
            "</div>" +
            
            "<!-- Footer -->" +
            "<div style='background:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;'>" +
            "<p style='margin:0;color:#6b7280;font-size:13px;'>This email was sent by <strong>HEMO®</strong> Blood Donation Platform</p>" +
            "<p style='margin:8px 0 0;color:#9ca3af;font-size:12px;'>© 2026 HEMO. All rights reserved.</p>" +
            "</div></div></body></html>";
    }

    private String buildAcceptanceEmailHtml(DirectRequest request) {
        String location = buildLocationString(request.getDivision(), request.getDistrict(), request.getUpazila());

        return "<!DOCTYPE html>" +
            "<html><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1.0'></head>" +
            "<body style='margin:0;padding:0;font-family:Arial,sans-serif;background:#f5f5f5;'>" +
            "<div style='max-width:600px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);'>" +
            
            "<!-- Header -->" +
            "<div style='background:linear-gradient(135deg,#22c55e,#16a34a);padding:32px;text-align:center;'>" +
            "<div style='font-size:64px;margin-bottom:16px;'>✅</div>" +
            "<h1 style='margin:0;color:#ffffff;font-size:28px;font-weight:700;'>Request Accepted!</h1>" +
            "</div>" +
            
            "<!-- Content -->" +
            "<div style='padding:32px;'>" +
            "<p style='margin:0 0 24px;color:#333;font-size:16px;line-height:1.6;'>Hi <strong>" + request.getRequesterName() + "</strong>,</p>" +
            "<p style='margin:0 0 24px;color:#555;font-size:15px;line-height:1.6;'>" +
            "Great news! <strong>" + request.getDonorName() + "</strong> has accepted your blood donation request.</p>" +
            
            "<!-- Donor Contact Card -->" +
            "<div style='background:#f0fdf4;border:2px solid #22c55e;border-radius:8px;padding:20px;margin-bottom:24px;'>" +
            "<h3 style='margin:0 0 16px;color:#16a34a;font-size:18px;'>📞 Contact the Donor</h3>" +
            "<table style='width:100%;border-collapse:collapse;'>" +
            "<tr><td style='padding:8px 0;color:#666;font-size:14px;'>Donor Name:</td><td style='padding:8px 0;color:#333;font-size:14px;font-weight:600;'>" + request.getDonorName() + "</td></tr>" +
            "<tr><td style='padding:8px 0;color:#666;font-size:14px;'>Blood Group:</td><td style='padding:8px 0;color:#DC2626;font-size:16px;font-weight:700;'>" + request.getBloodGroup() + "</td></tr>" +
            "<tr><td style='padding:8px 0;color:#666;font-size:14px;'>Email:</td><td style='padding:8px 0;color:#333;font-size:14px;font-weight:600;'>" + request.getDonorEmail() + "</td></tr>" +
            "</table></div>" +
            
            "<!-- Request Summary -->" +
            "<div style='background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:24px;'>" +
            "<h3 style='margin:0 0 16px;color:#333;font-size:18px;'>Your Request Details</h3>" +
            "<table style='width:100%;border-collapse:collapse;'>" +
            "<tr><td style='padding:8px 0;color:#666;font-size:14px;'>Patient:</td><td style='padding:8px 0;color:#333;font-size:14px;'>" + request.getPatientName() + "</td></tr>" +
            "<tr><td style='padding:8px 0;color:#666;font-size:14px;'>Hospital:</td><td style='padding:8px 0;color:#333;font-size:14px;'>" + request.getHospitalName() + "</td></tr>" +
            "<tr><td style='padding:8px 0;color:#666;font-size:14px;'>Location:</td><td style='padding:8px 0;color:#333;font-size:14px;'>" + location + "</td></tr>" +
            "</table></div>" +
            
            "<p style='margin:24px 0 0;padding:16px;background:#dbeafe;border-left:4px solid#3b82f6;color:#1e40af;font-size:14px;line-height:1.5;border-radius:4px;'>" +
            "💡 <strong>Next Steps:</strong> Please coordinate with the donor to arrange the blood donation at the hospital.</p>" +
            "</div>" +
            
            "<!-- Footer -->" +
            "<div style='background:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;'>" +
            "<p style='margin:0;color:#6b7280;font-size:13px;'>Thank you for using <strong>HEMO®</strong></p>" +
            "<p style='margin:8px 0 0;color:#9ca3af;font-size:12px;'>© 2026 HEMO. All rights reserved.</p>" +
            "</div></div></body></html>";
    }

    private String buildDeclinationEmailHtml(DirectRequest request) {
        return "<!DOCTYPE html>" +
            "<html><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1.0'></head>" +
            "<body style='margin:0;padding:0;font-family:Arial,sans-serif;background:#f5f5f5;'>" +
            "<div style='max-width:600px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);'>" +
            
            "<!-- Header -->" +
            "<div style='background:linear-gradient(135deg,#f59e0b,#d97706);padding:32px;text-align:center;'>" +
            "<h1 style='margin:0;color:#ffffff;font-size:28px;font-weight:700;'>HEMO®</h1>" +
            "<p style='margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:16px;'>Request Status Update</p>" +
            "</div>" +
            
            "<!-- Content -->" +
            "<div style='padding:32px;'>" +
            "<p style='margin:0 0 24px;color:#333;font-size:16px;line-height:1.6;'>Hi <strong>" + request.getRequesterName() + "</strong>,</p>" +
            "<p style='margin:0 0 24px;color:#555;font-size:15px;line-height:1.6;'>" +
            "Unfortunately, <strong>" + request.getDonorName() + "</strong> is unable to donate at this time.</p>" +
            
            (request.getResponseMessage() != null && !request.getResponseMessage().isEmpty() ?
            "<div style='background:#fef3c7;border-left:4px solid #f59e0b;padding:16px;margin-bottom:24px;border-radius:4px;'>" +
            "<p style='margin:0;color:#92400e;font-size:14px;'><strong>Message from donor:</strong></p>" +
            "<p style='margin:8px 0 0;color:#78350f;font-size:14px;font-style:italic;'>" + request.getResponseMessage() + "</p>" +
            "</div>" : "") +
            
            "<p style='margin:0;padding:16px;background:#dbeafe;border-left:4px solid #3b82f6;color:#1e40af;font-size:14px;line-height:1.5;border-radius:4px;'>" +
            "💡 <strong>Don't worry!</strong> Please continue searching for other donors on the platform. You can also post a public blood request.</p>" +
            
            "<div style='text-align:center;margin-top:32px;'>" +
            "<a href='http://localhost:8080/search' style='display:inline-block;background:#DC2626;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:16px;'>Find Other Donors</a>" +
            "</div></div>" +
            
            "<!-- Footer -->" +
            "<div style='background:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;'>" +
            "<p style='margin:0;color:#6b7280;font-size:13px;'>This email was sent by <strong>HEMO®</strong></p>" +
            "<p style='margin:8px 0 0;color:#9ca3af;font-size:12px;'>© 2026 HEMO. All rights reserved.</p>" +
            "</div></div></body></html>";
    }

    private String buildDonorResponseEmailHtml(String requesterName, String donorName, 
                                                 String donorPhone, String donorBloodGroup, 
                                                 String hospitalName) {
        return "<!DOCTYPE html>" +
            "<html><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1.0'></head>" +
            "<body style='margin:0;padding:0;font-family:Arial,sans-serif;background:#f5f5f5;'>" +
            "<div style='max-width:600px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);'>" +
            
            "<!-- Header -->" +
            "<div style='background:linear-gradient(135deg,#22c55e,#16a34a);padding:32px;text-align:center;'>" +
            "<div style='font-size:64px;margin-bottom:16px;'>🩸</div>" +
            "<h1 style='margin:0;color:#ffffff;font-size:28px;font-weight:700;'>Someone Can Donate!</h1>" +
            "</div>" +
            
            "<!-- Content -->" +
            "<div style='padding:32px;'>" +
            "<p style='margin:0 0 24px;color:#333;font-size:16px;line-height:1.6;'>Hi <strong>" + requesterName + "</strong>,</p>" +
            "<p style='margin:0 0 24px;color:#555;font-size:15px;line-height:1.6;'>" +
            "Great news! <strong>" + donorName + "</strong> has responded to your blood request and is willing to donate!</p>" +
            
            "<!-- Donor Info Card -->" +
            "<div style='background:#f0fdf4;border:2px solid #22c55e;border-radius:8px;padding:20px;margin-bottom:24px;'>" +
            "<h3 style='margin:0 0 16px;color:#16a34a;font-size:18px;'>Donor Information</h3>" +
            "<table style='width:100%;border-collapse:collapse;'>" +
            "<tr><td style='padding:8px 0;color:#666;font-size:14px;'>👤 Name:</td><td style='padding:8px 0;color:#333;font-size:14px;font-weight:600;'>" + donorName + "</td></tr>" +
            "<tr><td style='padding:8px 0;color:#666;font-size:14px;'>🩸 Blood Group:</td><td style='padding:8px 0;color:#DC2626;font-size:16px;font-weight:700;'>" + donorBloodGroup + "</td></tr>" +
            "<tr><td style='padding:8px 0;color:#666;font-size:14px;'>📞 Phone:</td><td style='padding:8px 0;color:#333;font-size:14px;font-weight:600;'>" + donorPhone + "</td></tr>" +
            "<tr><td style='padding:8px 0;color:#666;font-size:14px;'>🏥 Hospital:</td><td style='padding:8px 0;color:#333;font-size:14px;'>" + hospitalName + "</td></tr>" +
            "</table></div>" +
            
            "<p style='margin:0;padding:16px;background:#dbeafe;border-left:4px solid #3b82f6;color:#1e40af;font-size:14px;line-height:1.5;border-radius:4px;'>" +
            "💡 <strong>Next Steps:</strong> Please contact the donor directly to coordinate the blood donation at " + hospitalName + ".</p>" +
            "</div>" +
            
            "<!-- Footer -->" +
            "<div style='background:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;'>" +
            "<p style='margin:0;color:#6b7280;font-size:13px;'>This email was sent by <strong>HEMO®</strong></p>" +
            "<p style='margin:8px 0 0;color:#9ca3af;font-size:12px;'>© 2026 HEMO. All rights reserved.</p>" +
            "</div></div></body></html>";
    }

    private String buildLocationString(String division, String district, String upazila) {
        StringBuilder location = new StringBuilder();
        if (upazila != null && !upazila.isEmpty()) location.append(upazila).append(", ");
        if (district != null && !district.isEmpty()) location.append(district).append(", ");
        if (division != null && !division.isEmpty()) location.append(division);
        return location.length() > 0 ? location.toString() : "Not specified";
    }
}
