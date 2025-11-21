#!/bin/bash

# Build Rust library for iOS (arm64 devices + x86_64/arm64 simulators)
# Creates universal static library combining all architectures

set -e

echo "Building Rust library for iOS..."

# Change to rust directory
cd "$(dirname "$0")"

# Output directory
OUTPUT_DIR="../ios/RustFFI"
mkdir -p "$OUTPUT_DIR"

# Build for iOS device (arm64)
echo "Building for iOS arm64 (device)..."
cargo build --release --target aarch64-apple-ios

# Build for iOS simulator (x86_64 - Intel Macs)
echo "Building for iOS x86_64 simulator (Intel)..."
cargo build --release --target x86_64-apple-ios

# Build for iOS simulator (arm64 - Apple Silicon Macs)
echo "Building for iOS arm64 simulator (Apple Silicon)..."
cargo build --release --target aarch64-apple-ios-sim

# Create universal simulator library
echo "Creating universal simulator library..."
lipo -create \
    target/x86_64-apple-ios/release/libloqua_voice_dsp.a \
    target/aarch64-apple-ios-sim/release/libloqua_voice_dsp.a \
    -output target/release/libloqua_voice_dsp_sim.a

# Create XCFramework (supports both device and simulator)
echo "Creating XCFramework..."
rm -rf "$OUTPUT_DIR/LoqaVoiceDSP.xcframework"
xcodebuild -create-xcframework \
    -library target/aarch64-apple-ios/release/libloqua_voice_dsp.a \
    -library target/release/libloqua_voice_dsp_sim.a \
    -output "$OUTPUT_DIR/LoqaVoiceDSP.xcframework"

echo "✅ iOS library built successfully"
echo "  XCFramework: $OUTPUT_DIR/LoqaVoiceDSP.xcframework"

# Verify the xcframework
echo "Verifying XCFramework contents:"
ls -la "$OUTPUT_DIR/LoqaVoiceDSP.xcframework"
