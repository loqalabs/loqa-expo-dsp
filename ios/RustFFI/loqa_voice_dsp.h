// loqa_voice_dsp.h
// C header for Rust FFI functions exported by loqa-voice-dsp v0.4.0
// This header allows Swift to call Rust extern "C" functions with proper C ABI
//
// BREAKING CHANGES from v0.2.x:
// - All structs now have 'success' field first
// - PitchResultFFI adds 'voiced_probability' field
// - FormantResultFFI replaces bandwidths with 'confidence'
// - Function names changed from *_rust to loqa_*
// - loqa_detect_pitch now takes min_frequency and max_frequency

#ifndef loqa_voice_dsp_h
#define loqa_voice_dsp_h

#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>

// MARK: - Result Structs (matching Rust #[repr(C)] layout)

/// Pitch detection result (v0.4.0 - includes voiced_probability)
typedef struct {
    bool success;
    float frequency;
    float confidence;
    bool is_voiced;
    float voiced_probability;
} PitchResultFFI;

/// Formant extraction result (v0.4.0 - confidence instead of bandwidths)
typedef struct {
    bool success;
    float f1;
    float f2;
    float f3;
    float confidence;
} FormantResultFFI;

/// FFT result (caller must free with loqa_free_fft_result)
typedef struct {
    bool success;
    float* magnitudes_ptr;
    float* frequencies_ptr;
    size_t length;
    uint32_t sample_rate;
} FFTResultFFI;

/// Spectral features result
typedef struct {
    bool success;
    float centroid;
    float tilt;
    float rolloff_95;
} SpectralFeaturesFFI;

/// HNR (Harmonics-to-Noise Ratio) result
typedef struct {
    bool success;
    float hnr;
    float f0;
    bool is_voiced;
} HNRResultFFI;

/// H1-H2 (Harmonic Amplitude Difference) result
typedef struct {
    bool success;
    float h1h2;
    float h1_amplitude_db;
    float h2_amplitude_db;
    float f0;
} H1H2ResultFFI;

/// VoiceAnalyzer configuration (must match Rust struct layout exactly)
typedef struct {
    uint32_t sample_rate;
    uint32_t frame_size;
    uint32_t hop_size;
    float min_frequency;
    float max_frequency;
    uint32_t algorithm;      // 0=Auto, 1=PYIN, 2=YIN, 3=Autocorr
    float threshold;
    float min_confidence;
    bool interpolate;
} AnalysisConfigFFI;

/// Get default analysis configuration
AnalysisConfigFFI loqa_analysis_config_default(void);

// MARK: - FFI Function Declarations

/// Pitch detection using pYIN algorithm with min/max frequency bounds
/// Returns PitchResultFFI by value with success=true if detection succeeded
PitchResultFFI loqa_detect_pitch(
    const float* audio_ptr,
    size_t audio_len,
    uint32_t sample_rate,
    float min_frequency,
    float max_frequency
);

/// Formant extraction using LPC analysis
/// Returns FormantResultFFI by value with success=true if extraction succeeded
FormantResultFFI loqa_extract_formants(
    const float* audio_ptr,
    size_t audio_len,
    uint32_t sample_rate,
    size_t lpc_order
);

/// FFT computation
/// Returns FFTResultFFI - caller must free with loqa_free_fft_result
FFTResultFFI loqa_compute_fft(
    const float* audio_ptr,
    size_t audio_len,
    uint32_t sample_rate,
    size_t fft_size
);

/// Free FFT result memory allocated by loqa_compute_fft
void loqa_free_fft_result(FFTResultFFI* result);

/// Spectral analysis (centroid, tilt, rolloff)
/// Takes pointer to FFTResultFFI, returns SpectralFeaturesFFI by value
SpectralFeaturesFFI loqa_analyze_spectrum(
    const FFTResultFFI* fft_result
);

/// HNR calculation using Boersma's autocorrelation method
/// Returns HNRResultFFI by value with success=true if calculation succeeded
HNRResultFFI loqa_calculate_hnr(
    const float* audio_ptr,
    size_t audio_len,
    uint32_t sample_rate,
    float min_frequency,
    float max_frequency
);

/// H1-H2 calculation for vocal weight analysis
/// Pass f0=0.0 for auto-detection of fundamental frequency
/// Returns H1H2ResultFFI by value with success=true if calculation succeeded
H1H2ResultFFI loqa_calculate_h1h2(
    const float* audio_ptr,
    size_t audio_len,
    uint32_t sample_rate,
    float f0
);

// MARK: - Stateful VoiceAnalyzer API (v0.4.0)

/// Create a new VoiceAnalyzer instance
/// Returns opaque pointer to analyzer (caller must free with loqa_voice_analyzer_free)
void* loqa_voice_analyzer_new(AnalysisConfigFFI config);

/// Process a single frame with the VoiceAnalyzer
/// Returns PitchResultFFI for the frame
PitchResultFFI loqa_voice_analyzer_process_frame(
    void* analyzer,
    const float* samples,
    size_t len
);

/// Process streaming audio, writing results to output buffer
/// Returns number of results written (up to max_results)
size_t loqa_voice_analyzer_process_stream(
    void* analyzer,
    const float* samples,
    size_t len,
    PitchResultFFI* results_out,
    size_t max_results
);

/// Reset the VoiceAnalyzer state
void loqa_voice_analyzer_reset(void* analyzer);

/// Free a VoiceAnalyzer instance
void loqa_voice_analyzer_free(void* analyzer);

// MARK: - PitchTrack result for HMM-smoothed Viterbi decoding (v0.5.0)

/// PitchTrack result from process_buffer (Viterbi decoding)
/// Caller must free with loqa_free_pitch_track
typedef struct {
    bool success;
    float* pitch_track_ptr;      // Pitch estimates per frame (Hz, 0.0 = unvoiced)
    float* voiced_probs_ptr;     // Voiced probability per frame [0.0, 1.0]
    float* timestamps_ptr;       // Frame timestamps in seconds
    size_t length;               // Number of frames
} PitchTrackFFI;

/// Process buffer with HMM-smoothed Viterbi decoding for globally optimal pitch track
/// Returns PitchTrackFFI - caller must free with loqa_free_pitch_track
/// Unlike process_stream which treats frames independently, this uses Viterbi
/// decoding to find the globally optimal pitch track, reducing octave errors.
PitchTrackFFI loqa_voice_analyzer_process_buffer(
    void* analyzer,
    const float* samples,
    size_t len
);

/// Free PitchTrackFFI memory allocated by loqa_voice_analyzer_process_buffer
void loqa_free_pitch_track(PitchTrackFFI* result);

#endif /* loqa_voice_dsp_h */
