# Rust Build Configuration

This directory contains the Rust build infrastructure for compiling the loqa-voice-dsp native libraries for iOS and Android.

## Prerequisites

### Rust Toolchain

Ensure Rust is installed:
```bash
rustc --version  # Should be 1.70+
cargo --version
```

### iOS Build Requirements

- macOS with Xcode 15.0+
- Xcode Command Line Tools
- iOS targets:
  ```bash
  rustup target add aarch64-apple-ios x86_64-apple-ios aarch64-apple-ios-sim
  ```

### Android Build Requirements

- Android NDK r26+
- Android targets:
  ```bash
  rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android
  ```
- NDK toolchain must be in PATH:
  ```bash
  export PATH=$PATH:$HOME/Library/Android/sdk/ndk/26.0.10792818/toolchains/llvm/prebuilt/darwin-x86_64/bin
  ```

## Building

### iOS
```bash
./build-ios.sh
```

Output: `../ios/RustFFI/LoqaVoiceDSP.xcframework`

### Android
```bash
./build-android.sh
```

Output:
- `../android/src/main/jniLibs/arm64-v8a/libloqua_voice_dsp.so`
- `../android/src/main/jniLibs/armeabi-v7a/libloqua_voice_dsp.so`
- `../android/src/main/jniLibs/x86_64/libloqua_voice_dsp.so`

## Library Configuration

- **Release mode**: Optimizations enabled (`--release`)
- **LTO**: Link-Time Optimization enabled
- **Codegen units**: 1 (maximum optimization)

## Testing

Run Rust unit tests:
```bash
cargo test
```

## Troubleshooting

### iOS Build Fails

- Ensure Xcode is installed: `xcode-select --install`
- Check targets are installed: `rustup target list --installed`

### Android Build Fails

- Verify NDK is installed: `ls $HOME/Library/Android/sdk/ndk/`
- Check NDK toolchain is in PATH: `which aarch64-linux-android-clang`
- Install NDK via Android Studio SDK Manager if missing

## Architecture

The Rust code provides C-compatible FFI exports that are called from:
- iOS: Swift via FFI (in `ios/RustFFI/RustBridge.swift`)
- Android: Kotlin via JNI (in `android/.../RustJNI/RustBridge.kt`)

See [Architecture Document](../docs/architecture.md) for detailed integration patterns.
