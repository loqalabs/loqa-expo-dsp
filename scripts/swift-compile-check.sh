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

public func AsyncFunction(_ name: String, _ handler: @escaping ([String: Any], Promise) -> Void) -> Any {
    return name
}

public func AsyncFunction(_ name: String, _ handler: @escaping (String, [Float], Promise) -> Void) -> Any {
    return name
}

public func AsyncFunction(_ name: String, _ handler: @escaping (String, Promise) -> Void) -> Any {
    return name
}
EOF

# Create mock C types for FFI (matching loqa-voice-dsp v0.4.0 C header)
cat > "$TMP_DIR/MockFFI.swift" << 'EOF'
import Foundation

// Mock FFI types for compile checking (matching loqa_voice_dsp.h v0.4.0)

public struct PitchResultFFI {
    public var success: Bool
    public var frequency: Float
    public var confidence: Float
    public var is_voiced: Bool
    public var voiced_probability: Float
    public init(success: Bool, frequency: Float, confidence: Float, is_voiced: Bool, voiced_probability: Float) {
        self.success = success
        self.frequency = frequency
        self.confidence = confidence
        self.is_voiced = is_voiced
        self.voiced_probability = voiced_probability
    }
}

public struct FormantResultFFI {
    public var success: Bool
    public var f1: Float
    public var f2: Float
    public var f3: Float
    public var confidence: Float
    public init(success: Bool, f1: Float, f2: Float, f3: Float, confidence: Float) {
        self.success = success
        self.f1 = f1; self.f2 = f2; self.f3 = f3
        self.confidence = confidence
    }
}

public struct FFTResultFFI {
    public var success: Bool
    public var magnitudes_ptr: UnsafeMutablePointer<Float>?
    public var frequencies_ptr: UnsafeMutablePointer<Float>?
    public var length: Int
    public var sample_rate: UInt32
    public init(success: Bool, magnitudes_ptr: UnsafeMutablePointer<Float>?, frequencies_ptr: UnsafeMutablePointer<Float>?, length: Int, sample_rate: UInt32) {
        self.success = success
        self.magnitudes_ptr = magnitudes_ptr
        self.frequencies_ptr = frequencies_ptr
        self.length = length
        self.sample_rate = sample_rate
    }
}

public struct SpectralFeaturesFFI {
    public var success: Bool
    public var centroid: Float
    public var tilt: Float
    public var rolloff_95: Float
    public init(success: Bool, centroid: Float, tilt: Float, rolloff_95: Float) {
        self.success = success
        self.centroid = centroid
        self.tilt = tilt
        self.rolloff_95 = rolloff_95
    }
}

public struct HNRResultFFI {
    public var success: Bool
    public var hnr: Float
    public var f0: Float
    public var is_voiced: Bool
    public init(success: Bool, hnr: Float, f0: Float, is_voiced: Bool) {
        self.success = success
        self.hnr = hnr
        self.f0 = f0
        self.is_voiced = is_voiced
    }
}

public struct H1H2ResultFFI {
    public var success: Bool
    public var h1h2: Float
    public var h1_amplitude_db: Float
    public var h2_amplitude_db: Float
    public var f0: Float
    public init(success: Bool, h1h2: Float, h1_amplitude_db: Float, h2_amplitude_db: Float, f0: Float) {
        self.success = success
        self.h1h2 = h1h2
        self.h1_amplitude_db = h1_amplitude_db
        self.h2_amplitude_db = h2_amplitude_db
        self.f0 = f0
    }
}

public struct AnalysisConfigFFI {
    public var sample_rate: UInt32
    public var frame_size: UInt32
    public var hop_size: UInt32
    public var min_frequency: Float
    public var max_frequency: Float
    public var algorithm: UInt32
    public var threshold: Float
    public var min_confidence: Float
    public var interpolate: Bool
    public init(sample_rate: UInt32, frame_size: UInt32, hop_size: UInt32, min_frequency: Float, max_frequency: Float, algorithm: UInt32, threshold: Float, min_confidence: Float, interpolate: Bool) {
        self.sample_rate = sample_rate
        self.frame_size = frame_size
        self.hop_size = hop_size
        self.min_frequency = min_frequency
        self.max_frequency = max_frequency
        self.algorithm = algorithm
        self.threshold = threshold
        self.min_confidence = min_confidence
        self.interpolate = interpolate
    }
}

public func loqa_analysis_config_default() -> AnalysisConfigFFI {
    AnalysisConfigFFI(sample_rate: 16000, frame_size: 2048, hop_size: 512, min_frequency: 80.0, max_frequency: 400.0, algorithm: 0, threshold: 0.1, min_confidence: 0.5, interpolate: true)
}

// Mock FFI functions (matching loqa-voice-dsp v0.4.0 API)
public func loqa_compute_fft(_ buffer: UnsafePointer<Float>?, _ length: Int, _ sampleRate: UInt32, _ fftSize: Int) -> FFTResultFFI {
    FFTResultFFI(success: true, magnitudes_ptr: nil, frequencies_ptr: nil, length: 0, sample_rate: sampleRate)
}
public func loqa_free_fft_result(_ result: UnsafeMutablePointer<FFTResultFFI>?) {}
public func loqa_detect_pitch(_ buffer: UnsafePointer<Float>?, _ length: Int, _ sampleRate: UInt32, _ minFreq: Float, _ maxFreq: Float) -> PitchResultFFI {
    PitchResultFFI(success: true, frequency: 0, confidence: 0, is_voiced: false, voiced_probability: 0)
}
public func loqa_extract_formants(_ buffer: UnsafePointer<Float>?, _ length: Int, _ sampleRate: UInt32, _ lpcOrder: Int) -> FormantResultFFI {
    FormantResultFFI(success: true, f1: 0, f2: 0, f3: 0, confidence: 0)
}
public func loqa_analyze_spectrum(_ fftResult: UnsafePointer<FFTResultFFI>?) -> SpectralFeaturesFFI {
    SpectralFeaturesFFI(success: true, centroid: 0, tilt: 0, rolloff_95: 0)
}
public func loqa_calculate_hnr(_ buffer: UnsafePointer<Float>?, _ length: Int, _ sampleRate: UInt32, _ minFreq: Float, _ maxFreq: Float) -> HNRResultFFI {
    HNRResultFFI(success: true, hnr: 0, f0: 0, is_voiced: false)
}
public func loqa_calculate_h1h2(_ buffer: UnsafePointer<Float>?, _ length: Int, _ sampleRate: UInt32, _ f0: Float) -> H1H2ResultFFI {
    H1H2ResultFFI(success: true, h1h2: 0, h1_amplitude_db: 0, h2_amplitude_db: 0, f0: 0)
}

// PitchTrackFFI for process_buffer (v0.5.0)
public struct PitchTrackFFI {
    public var success: Bool
    public var pitch_track_ptr: UnsafeMutablePointer<Float>?
    public var voiced_probs_ptr: UnsafeMutablePointer<Float>?
    public var timestamps_ptr: UnsafeMutablePointer<Float>?
    public var length: Int
    public init(success: Bool, pitch_track_ptr: UnsafeMutablePointer<Float>?, voiced_probs_ptr: UnsafeMutablePointer<Float>?, timestamps_ptr: UnsafeMutablePointer<Float>?, length: Int) {
        self.success = success
        self.pitch_track_ptr = pitch_track_ptr
        self.voiced_probs_ptr = voiced_probs_ptr
        self.timestamps_ptr = timestamps_ptr
        self.length = length
    }
}

// VoiceAnalyzer mock functions
public func loqa_voice_analyzer_new(_ config: AnalysisConfigFFI) -> UnsafeMutableRawPointer? { nil }
public func loqa_voice_analyzer_process_frame(_ analyzer: UnsafeMutableRawPointer?, _ samples: UnsafePointer<Float>?, _ len: Int) -> PitchResultFFI {
    PitchResultFFI(success: true, frequency: 0, confidence: 0, is_voiced: false, voiced_probability: 0)
}
public func loqa_voice_analyzer_process_stream(_ analyzer: UnsafeMutableRawPointer?, _ samples: UnsafePointer<Float>?, _ len: Int, _ results: UnsafeMutablePointer<PitchResultFFI>?, _ maxResults: Int) -> Int { 0 }
public func loqa_voice_analyzer_process_buffer(_ analyzer: UnsafeMutableRawPointer?, _ samples: UnsafePointer<Float>?, _ len: Int) -> PitchTrackFFI {
    PitchTrackFFI(success: true, pitch_track_ptr: nil, voiced_probs_ptr: nil, timestamps_ptr: nil, length: 0)
}
public func loqa_voice_analyzer_reset(_ analyzer: UnsafeMutableRawPointer?) {}
public func loqa_voice_analyzer_free(_ analyzer: UnsafeMutableRawPointer?) {}
public func loqa_free_pitch_track(_ result: UnsafeMutablePointer<PitchTrackFFI>?) {}
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
