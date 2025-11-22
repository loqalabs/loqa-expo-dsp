#!/bin/bash

# Build Rust library for Android (arm64-v8a, armeabi-v7a, x86_64)
# Creates separate .so files for each architecture

set -e

echo "Building Rust library for Android..."

# Change to rust directory
cd "$(dirname "$0")"

# Output directories
JNI_LIBS="../android/src/main/jniLibs"
mkdir -p "$JNI_LIBS/arm64-v8a"
mkdir -p "$JNI_LIBS/armeabi-v7a"
mkdir -p "$JNI_LIBS/x86_64"

# Build for arm64-v8a (64-bit ARM devices)
echo "Building for Android arm64-v8a..."
cargo build --release --target aarch64-linux-android
cp target/aarch64-linux-android/release/libloqa_voice_dsp.so "$JNI_LIBS/arm64-v8a/"

# Build for armeabi-v7a (32-bit ARM devices)
echo "Building for Android armeabi-v7a..."
cargo build --release --target armv7-linux-androideabi
cp target/armv7-linux-androideabi/release/libloqa_voice_dsp.so "$JNI_LIBS/armeabi-v7a/"

# Build for x86_64 (64-bit Intel emulator)
echo "Building for Android x86_64..."
cargo build --release --target x86_64-linux-android
cp target/x86_64-linux-android/release/libloqa_voice_dsp.so "$JNI_LIBS/x86_64/"

echo "✅ Android libraries built successfully"
echo "  - $JNI_LIBS/arm64-v8a/libloqa_voice_dsp.so"
echo "  - $JNI_LIBS/armeabi-v7a/libloqa_voice_dsp.so"
echo "  - $JNI_LIBS/x86_64/libloqa_voice_dsp.so"

# Verify the libraries
echo "Verifying libraries..."
file "$JNI_LIBS/arm64-v8a/libloqa_voice_dsp.so"
file "$JNI_LIBS/armeabi-v7a/libloqa_voice_dsp.so"
file "$JNI_LIBS/x86_64/libloqa_voice_dsp.so"
