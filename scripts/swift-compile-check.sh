#!/bin/bash
# Swift compile check for LoqaExpoDsp iOS module
# This script verifies that all Swift files compile without errors

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
IOS_DIR="$PROJECT_ROOT/ios"
TMP_DIR=$(mktemp -d)

cleanup() {
    rm -rf "$TMP_DIR"
}
trap cleanup EXIT

echo "=== Swift Compile Check for LoqaExpoDsp ==="
echo "Checking Swift files in: $IOS_DIR"

# Create mock ExpoModulesCore types to allow compilation check
cat > "$TMP_DIR/MockExpo.swift" << 'EOF'
import Foundation

// Mock ExpoModulesCore types for compile checking
open class Module {
    public init() {}
}

@resultBuilder
public struct ModuleDefinitionBuilder {
    public static func buildBlock(_ components: Any...) -> [Any] { components }
}

public struct ModuleDefinition {
    public init(@ModuleDefinitionBuilder _ build: () -> [Any]) {}
}

public class Promise {
    public init() {}
    public func resolve(_ value: Any?) {}
    public func reject(_ code: String, _ message: String) {}
}

public func Name(_ name: String) -> Any { name }

public func AsyncFunction(_ name: String, _ handler: @escaping ([Float], [String: Any], Promise) -> Void) -> Any {
    return name
}

public func AsyncFunction(_ name: String, _ handler: @escaping ([Float], Int, [String: Any], Promise) -> Void) -> Any {
    return name
}
EOF

# Create mock C types for FFI
cat > "$TMP_DIR/MockFFI.swift" << 'EOF'
import Foundation

// Mock FFI types for compile checking
public struct PitchResultC {
    public var frequency: Float
    public var confidence: Float
    public var is_voiced: Bool
    public init(frequency: Float, confidence: Float, is_voiced: Bool) {
        self.frequency = frequency
        self.confidence = confidence
        self.is_voiced = is_voiced
    }
}

public struct FormantsResultC {
    public var f1: Float
    public var f2: Float
    public var f3: Float
    public var bw1: Float
    public var bw2: Float
    public var bw3: Float
    public init(f1: Float, f2: Float, f3: Float, bw1: Float, bw2: Float, bw3: Float) {
        self.f1 = f1; self.f2 = f2; self.f3 = f3
        self.bw1 = bw1; self.bw2 = bw2; self.bw3 = bw3
    }
}

public struct SpectrumResultC {
    public var centroid: Float
    public var rolloff: Float
    public var tilt: Float
    public init(centroid: Float, rolloff: Float, tilt: Float) {
        self.centroid = centroid
        self.rolloff = rolloff
        self.tilt = tilt
    }
}

public struct HNRResultC {
    public var hnr: Float
    public var f0: Float
    public var is_voiced: Bool
    public init(hnr: Float, f0: Float, is_voiced: Bool) {
        self.hnr = hnr
        self.f0 = f0
        self.is_voiced = is_voiced
    }
}

public struct H1H2ResultC {
    public var h1h2: Float
    public var h1_amplitude_db: Float
    public var h2_amplitude_db: Float
    public var f0: Float
    public init(h1h2: Float, h1_amplitude_db: Float, h2_amplitude_db: Float, f0: Float) {
        self.h1h2 = h1h2
        self.h1_amplitude_db = h1_amplitude_db
        self.h2_amplitude_db = h2_amplitude_db
        self.f0 = f0
    }
}

// Mock FFI functions
public func compute_fft_rust(_ buffer: UnsafePointer<Float>?, _ length: Int32, _ fftSize: Int32, _ windowType: Int32) -> UnsafePointer<Float>? { nil }
public func free_fft_result_rust(_ ptr: UnsafePointer<Float>?) {}
public func detect_pitch_rust(_ buffer: UnsafePointer<Float>?, _ length: Int32, _ sampleRate: Int32) -> PitchResultC { PitchResultC(frequency: 0, confidence: 0, is_voiced: false) }
public func extract_formants_rust(_ buffer: UnsafePointer<Float>?, _ length: Int32, _ sampleRate: Int32, _ lpcOrder: Int32) -> FormantsResultC { FormantsResultC(f1: 0, f2: 0, f3: 0, bw1: 0, bw2: 0, bw3: 0) }
public func analyze_spectrum_rust(_ buffer: UnsafePointer<Float>?, _ length: Int32, _ sampleRate: Int32) -> SpectrumResultC { SpectrumResultC(centroid: 0, rolloff: 0, tilt: 0) }
public func calculate_hnr_rust(_ buffer: UnsafePointer<Float>?, _ length: Int32, _ sampleRate: Int32, _ minFreq: Float, _ maxFreq: Float) -> HNRResultC { HNRResultC(hnr: 0, f0: 0, is_voiced: false) }
public func calculate_h1h2_rust(_ buffer: UnsafePointer<Float>?, _ length: Int32, _ sampleRate: Int32, _ f0: Float) -> H1H2ResultC { H1H2ResultC(h1h2: 0, h1_amplitude_db: 0, h2_amplitude_db: 0, f0: 0) }
EOF

# Copy Swift files to temp dir (excluding the actual module import)
echo "Preparing Swift files for compilation check..."

# Process RustBridge.swift
cp "$IOS_DIR/RustFFI/RustBridge.swift" "$TMP_DIR/RustBridge.swift"

# Process LoqaExpoDspModule.swift - replace ExpoModulesCore import with Foundation
sed 's/import ExpoModulesCore/import Foundation/' "$IOS_DIR/LoqaExpoDspModule.swift" > "$TMP_DIR/LoqaExpoDspModule.swift"

# Run swift compiler in type-check mode
echo "Running Swift type check..."
cd "$TMP_DIR"

SWIFT_FILES=(
    MockExpo.swift
    MockFFI.swift
    RustBridge.swift
    LoqaExpoDspModule.swift
)

# Run type check and capture output
OUTPUT=$(swiftc -typecheck "${SWIFT_FILES[@]}" 2>&1)
EXIT_CODE=$?

# Filter out expected warnings from our mock (unused results)
ERRORS=$(echo "$OUTPUT" | grep -E "error:" || true)

if [ -n "$ERRORS" ]; then
    echo "$OUTPUT"
    echo ""
    echo "❌ FAILED: Swift type check errors found"
    exit 1
else
    echo ""
    echo "✅ SUCCESS: All Swift files pass type checking (no errors)"
    echo "   (Warnings about unused results in mock are expected)"
    exit 0
fi
