#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "Starting Maven build..."

# Build the project
./mvnw clean install -DskipTests

echo "Build completed successfully!"
