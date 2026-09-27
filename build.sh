#!/usr/bin/env bash
# Render build script

set -e

echo "🚀 Starting build process..."

# Make Maven wrapper executable
chmod +x ./mvnw

echo "📦 Installing dependencies..."
./mvnw clean install -DskipTests

echo "✅ Build completed successfully!"
