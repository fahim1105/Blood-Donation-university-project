#!/usr/bin/env bash

echo "Starting HEMO Blood Donation Application..."

# Start the Spring Boot application with production profile
java -Dserver.port=$PORT \
     -Dspring.profiles.active=prod \
     -Xmx400m \
     -Xss512k \
     -jar target/Blood_Donation-0.0.1-SNAPSHOT.jar
