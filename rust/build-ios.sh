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
# IMPORTANT: Use same binary name as device library for CocoaPods compatibility
# CocoaPods requires all slices in an XCFramework to have identical binary names
echo "Creating universal simulator library..."
SIMULATOR_LIB="target/release/libloqa_voice_dsp_universal_sim.a"
lipo -create \
    target/x86_64-apple-ios/release/libloqa_voice_dsp.a \
    target/aarch64-apple-ios-sim/release/libloqa_voice_dsp.a \
    -output "$SIMULATOR_LIB"

# Create XCFramework (supports both device and simulator)
echo "Creating XCFramework..."
rm -rf "$OUTPUT_DIR/LoqaVoiceDSP.xcframework"
xcodebuild -create-xcframework \
    -library target/aarch64-apple-ios/release/libloqa_voice_dsp.a \
    -library "$SIMULATOR_LIB" \
    -output "$OUTPUT_DIR/LoqaVoiceDSP.xcframework"

# Rename simulator binary to match device binary name (required by CocoaPods)
echo "Renaming simulator binary for CocoaPods compatibility..."
mv "$OUTPUT_DIR/LoqaVoiceDSP.xcframework/ios-arm64_x86_64-simulator/libloqa_voice_dsp_universal_sim.a" \
   "$OUTPUT_DIR/LoqaVoiceDSP.xcframework/ios-arm64_x86_64-simulator/libloqa_voice_dsp.a"

# Update Info.plist to reference correct binary name
echo "Updating XCFramework Info.plist..."
sed -i '' 's/libloqa_voice_dsp_universal_sim\.a/libloqa_voice_dsp.a/g' "$OUTPUT_DIR/LoqaVoiceDSP.xcframework/Info.plist"

echo "✅ iOS library built successfully"
echo "  XCFramework: $OUTPUT_DIR/LoqaVoiceDSP.xcframework"

# Verify the xcframework
echo "Verifying XCFramework contents:"
ls -la "$OUTPUT_DIR/LoqaVoiceDSP.xcframework"
