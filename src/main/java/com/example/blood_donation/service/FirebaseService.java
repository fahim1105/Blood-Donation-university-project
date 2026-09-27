package com.example.blood_donation.service;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

@Service
public class FirebaseService {

    private static final Logger log = LoggerFactory.getLogger(FirebaseService.class);

    @Value("${firebase.service-account-path}")
    private Resource serviceAccountResource;

    @Value("${firebase.credentials.json:#{null}}")
    private String firebaseCredentialsJson;

    @PostConstruct
    public void initialize() {
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                GoogleCredentials credentials;
                
                // Try to load from environment variable first (for production/Render)
                if (firebaseCredentialsJson != null && !firebaseCredentialsJson.trim().isEmpty()) {
                    log.info("Loading Firebase credentials from environment variable...");
                    InputStream stream = new ByteArrayInputStream(
                        firebaseCredentialsJson.getBytes(StandardCharsets.UTF_8)
                    );
                    credentials = GoogleCredentials.fromStream(stream);
                    log.info("Firebase credentials loaded from environment variable successfully.");
                } 
                // Fall back to file resource (for local development)
                else {
                    log.info("Loading Firebase credentials from file resource...");
                    InputStream serviceAccount = serviceAccountResource.getInputStream();
                    credentials = GoogleCredentials.fromStream(serviceAccount);
                    log.info("Firebase credentials loaded from file successfully.");
                }
                
                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(credentials)
                        .build();
                FirebaseApp.initializeApp(options);
                log.info("✅ Firebase Admin SDK initialized successfully.");
            }
        } catch (IOException e) {
            log.error("❌ Firebase initialization failed: {}", e.getMessage());
            log.warn("Firebase service account not found. Firebase token validation disabled. " +
                     "Set FIREBASE_CREDENTIALS_JSON environment variable or place " +
                     "firebase-service-account.json in src/main/resources/");
        }
    }

    /**
     * Verifies a Firebase ID token and returns the decoded token.
     * Returns null if Firebase is not initialized or token is invalid.
     */
    public FirebaseToken verifyToken(String idToken) {
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                log.warn("Firebase not initialized — skipping token verification.");
                return null;
            }
            return FirebaseAuth.getInstance().verifyIdToken(idToken);
        } catch (FirebaseAuthException e) {
            log.error("Firebase token verification failed: {}", e.getMessage());
            return null;
        }
    }
}
