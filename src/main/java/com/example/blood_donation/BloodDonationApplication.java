package com.example.blood_donation;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class BloodDonationApplication {

    public static void main(String[] args) {
        SpringApplication.run(BloodDonationApplication.class, args);
    }

}
