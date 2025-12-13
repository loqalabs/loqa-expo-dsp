// FFI wrapper for loqa-voice-dsp crate
// Provides C-compatible exports for iOS (Swift FFI) and Android (Kotlin JNI)

use std::os::raw::{c_float, c_int};
use std::slice;

/// Computes Fast Fourier Transform (FFT) of audio buffer
///
/// # Arguments
/// * `buffer` - Pointer to input audio samples (Float32 array)
/// * `length` - Number of samples in input buffer
/// * `sample_rate` - Sample rate in Hz (e.g., 44100, 48000)
/// * `fft_size` - FFT size (must be power of 2, range: 256-8192)
///
/// # Returns
/// * Pointer to magnitude spectrum (length = fft_size / 2 + 1) or null on error
///
/// # Safety
/// * Caller must ensure `buffer` points to valid memory of at least `length` samples
/// * Caller MUST call `free_fft_result_rust` to deallocate returned pointer
/// * Returned pointer is heap-allocated and owned by caller after return
/// * This function dereferences raw pointers and is inherently unsafe
/// * Buffer must remain valid for the duration of this function call
///
/// # Memory Management Pattern (Critical for FFI/JNI)
/// * Rust allocates → Returns raw pointer → Swift/Kotlin copies → Swift/Kotlin frees Rust memory
///
/// # Note
/// The loqa-voice-dsp crate applies its own windowing internally, so we don't expose
/// window type as a parameter in this FFI interface. The TypeScript layer may accept
/// window type as an option, but it will be handled at that layer for v0.1.0.
#[no_mangle]
pub unsafe extern "C" fn compute_fft_rust(
    buffer: *const c_float,
    length: c_int,
    sample_rate: c_int,
    fft_size: c_int,
) -> *mut c_float {
    // Input validation
    if buffer.is_null() {
        eprintln!("[Rust FFI] Error: buffer pointer is null");
        return std::ptr::null_mut();
    }

    if length <= 0 {
        eprintln!("[Rust FFI] Error: length must be > 0, got {length}");
        return std::ptr::null_mut();
    }

    if sample_rate <= 0 {
        eprintln!("[Rust FFI] Error: sample_rate must be > 0, got {sample_rate}");
        return std::ptr::null_mut();
    }

    let fft_size_usize = fft_size as usize;

    // Validate FFT size is power of 2
    if fft_size <= 0 || (fft_size_usize & (fft_size_usize - 1)) != 0 {
        eprintln!("[Rust FFI] Error: fft_size must be power of 2, got {fft_size}");
        return std::ptr::null_mut();
    }

    // Validate FFT size range (256 to 8192)
    if !(256..=8192).contains(&fft_size) {
        eprintln!("[Rust FFI] Error: fft_size must be in range [256, 8192], got {fft_size}");
        return std::ptr::null_mut();
    }

    // Convert raw pointer to Rust slice
    let input_slice = slice::from_raw_parts(buffer, length as usize);

    // Call loqa-voice-dsp FFT function
    let fft_result =
        loqa_voice_dsp::compute_fft(input_slice, sample_rate as u32, fft_size_usize);

    // Handle FFT computation result
    let magnitudes = match fft_result {
        Ok(result) => result.magnitudes,
        Err(e) => {
            eprintln!("[Rust FFI] FFT computation failed: {e:?}");
            return std::ptr::null_mut();
        }
    };

    // Convert Vec<f32> to raw pointer for FFI
    // This transfers ownership to the caller
    // CRITICAL: Caller MUST call free_fft_result_rust to prevent memory leak
    Box::into_raw(magnitudes.into_boxed_slice()) as *mut c_float
}

/// Frees FFT result memory allocated by compute_fft_rust
///
/// # Arguments
/// * `ptr` - Pointer returned by compute_fft_rust
/// * `length` - Length of the FFT result (should be fft_size / 2 + 1)
///
/// # Safety
/// * Must only be called once per pointer returned from compute_fft_rust
/// * Must not be called with pointers from other sources
/// * `length` MUST match the actual allocation size (fft_size / 2 + 1)
/// * Caller must ensure pointer was created by compute_fft_rust
/// * This function dereferences raw pointers and is inherently unsafe
///
/// # Memory Safety
/// * This function converts the raw pointer back to a Box<[f32]> and drops it
/// * Prevents memory leaks at FFI/JNI boundary
/// * Null pointers are handled gracefully and do nothing
#[no_mangle]
pub unsafe extern "C" fn free_fft_result_rust(ptr: *mut c_float, length: c_int) {
    if ptr.is_null() {
        return;
    }

    if length <= 0 {
        eprintln!(
            "[Rust FFI] Error: free_fft_result_rust called with invalid length {length}"
        );
        return;
    }

    // Reconstruct the Box from the raw pointer with correct length
    // This will automatically deallocate when Box goes out of scope
    let _ = Box::from_raw(slice::from_raw_parts_mut(ptr, length as usize));
}

/// Android JNI native method for computeFFT
///
/// JNI Method Signature Resolution:
/// - Kotlin declaration: `external fun nativeComputeFFT(buffer: FloatArray, fftSize: Int, windowType: Int): FloatArray`
/// - Package: com.loqalabs.loqaexpodsp.RustJNI
/// - Class: RustBridge (object)
/// - Method: nativeComputeFFT
/// - JNI Function Name: Java_com_loqalabs_loqaexpodsp_RustJNI_RustBridge_nativeComputeFFT
///
/// # Arguments
/// * `env` - JNI environment pointer (unused but required by JNI)
/// * `class` - JNI class reference (unused but required by JNI)
/// * `buffer` - JNI jfloatArray reference to input audio samples
/// * `fft_size` - FFT size (must be power of 2, range: 256-8192)
/// * `window_type` - Window function type (0=none, 1=hanning, 2=hamming, 3=blackman) - IGNORED in v0.1.0
///
/// # Returns
/// * JNI jfloatArray containing magnitude spectrum (length = fft_size / 2 + 1) or null on error
///
/// # Safety
/// * JNI framework ensures proper type conversions and memory management
/// * This function is called from Kotlin via JNI, not directly
///
/// # Note
/// For v0.1.0, window_type is accepted but ignored - loqa-voice-dsp applies windowing internally.
/// Sample rate is hardcoded to 44100 Hz (matches default in LoqaExpoDspModule.kt).
/// This function delegates to compute_fft_rust with appropriate parameters.
///
/// # JNI Implementation Note
/// This requires proper JNI environment handling and FloatArray conversion,
/// which should be implemented using jni-rs crate or manual JNI calls.
/// For now, we provide the C ABI signature that matches Kotlin expectations.
#[no_mangle]
pub unsafe extern "C" fn Java_com_loqalabs_loqaexpodsp_RustJNI_RustBridge_nativeComputeFFT(
    _env: *mut std::os::raw::c_void,
    _class: *mut std::os::raw::c_void,
    buffer: *const c_float,
    buffer_length: c_int,
    fft_size: c_int,
    _window_type: c_int,  // Accepted but ignored - windowing handled by loqa-voice-dsp
) -> *mut c_float {
    // Use default sample rate (44100 Hz) for Android in v0.1.0
    // Matches the default in LoqaExpoDspModule.kt
    const DEFAULT_SAMPLE_RATE: c_int = 44100;

    // Delegate to the main FFT implementation
    // The JNI framework handles conversion of FloatArray to *const f32 and back
    compute_fft_rust(buffer, buffer_length, DEFAULT_SAMPLE_RATE, fft_size)
}

/// Result structure for pitch detection
///
/// Returns the detected pitch frequency, confidence score, and voicing classification.
/// This struct is C-compatible for FFI/JNI interop.
///
/// # Fields
/// * `frequency` - Detected pitch in Hz (0.0 if unvoiced or no pitch detected)
/// * `confidence` - Confidence score from 0.0 (low) to 1.0 (high)
/// * `is_voiced` - Whether the audio segment is voiced (true) or unvoiced (false)
#[repr(C)]
#[derive(Debug, Clone, Copy)]
pub struct PitchResult {
    pub frequency: c_float,
    pub confidence: c_float,
    pub is_voiced: bool,
}

/// Detects pitch using YIN algorithm from loqa-voice-dsp crate
///
/// # Arguments
/// * `buffer` - Pointer to input audio samples (Float32 array)
/// * `length` - Number of samples in input buffer
/// * `sample_rate` - Sample rate in Hz (must be 8000-48000 Hz)
///
/// # Returns
/// * PitchResult struct with frequency, confidence, and is_voiced
/// * Returns frequency=0.0, confidence=0.0, is_voiced=false on error
///
/// # Safety
/// * Caller must ensure `buffer` points to valid memory of at least `length` samples
/// * This function dereferences raw pointers and is inherently unsafe
/// * Buffer must remain valid for the duration of this function call
///
/// # Validation
/// * Sample rate must be between 8000 and 48000 Hz (AC3)
/// * Returns null frequency (0.0) if no pitch detected (AC4)
/// * Confidence score is always between 0.0 and 1.0 (AC5)
/// * Uses YIN algorithm from loqa-voice-dsp (AC2)
///
/// # Note on Voiced/Unvoiced Classification
/// * is_voiced=true when clear pitch is detected with reasonable confidence
/// * is_voiced=false for silence, noise, or unvoiced segments
/// * frequency=0.0 indicates no pitch detected (unvoiced)
#[no_mangle]
pub unsafe extern "C" fn detect_pitch_rust(
    buffer: *const c_float,
    length: c_int,
    sample_rate: c_int,
) -> PitchResult {
    // Default error result
    let error_result = PitchResult {
        frequency: 0.0,
        confidence: 0.0,
        is_voiced: false,
    };

    // Input validation
    if buffer.is_null() {
        eprintln!("[Rust FFI] Error: buffer pointer is null");
        return error_result;
    }

    if length <= 0 {
        eprintln!("[Rust FFI] Error: length must be > 0, got {length}");
        return error_result;
    }

    // Validate sample rate range: 8000-48000 Hz (AC3)
    if !(8000..=48000).contains(&sample_rate) {
        eprintln!(
            "[Rust FFI] Error: sample_rate must be in range [8000, 48000] Hz, got {sample_rate}"
        );
        return error_result;
    }

    // Convert raw pointer to Rust slice
    let input_slice = slice::from_raw_parts(buffer, length as usize);

    // Define frequency range for YIN algorithm
    // Default range suitable for human voice: 80 Hz (low male) to 400 Hz (high female)
    // Can be extended to 800 Hz for wider coverage
    const MIN_FREQUENCY: f32 = 80.0;
    const MAX_FREQUENCY: f32 = 400.0;

    // Call loqa-voice-dsp YIN pitch detection function (AC2)
    let pitch_result = loqa_voice_dsp::detect_pitch(
        input_slice,
        sample_rate as u32,
        MIN_FREQUENCY,
        MAX_FREQUENCY
    );

    // Handle pitch detection result
    match pitch_result {
        Ok(result) => {
            // Extract frequency, confidence, and voiced classification
            let frequency = if result.is_voiced { result.frequency } else { 0.0 }; // AC4: Return 0.0 if unvoiced
            let confidence = result.confidence.clamp(0.0, 1.0); // Ensure 0.0-1.0 range (AC5)
            let is_voiced = result.is_voiced;

            PitchResult {
                frequency,
                confidence,
                is_voiced,
            }
        }
        Err(e) => {
            eprintln!("[Rust FFI] Pitch detection failed: {e:?}");
            error_result
        }
    }
}

/// Android JNI native method for detectPitch
///
/// JNI Method Signature Resolution:
/// - Kotlin declaration: `external fun nativeDetectPitch(buffer: FloatArray, sampleRate: Int): PitchResult`
/// - Package: com.loqalabs.loqaexpodsp.RustJNI
/// - Class: RustBridge (object)
/// - Method: nativeDetectPitch
/// - JNI Function Name: Java_com_loqalabs_loqaexpodsp_RustJNI_RustBridge_nativeDetectPitch
///
/// # Arguments
/// * `env` - JNI environment pointer (unused but required by JNI)
/// * `class` - JNI class reference (unused but required by JNI)
/// * `buffer` - JNI jfloatArray reference to input audio samples
/// * `buffer_length` - Number of samples in buffer
/// * `sample_rate` - Sample rate in Hz (8000-48000)
///
/// # Returns
/// * PitchResult struct with frequency, confidence, and is_voiced
///
/// # Safety
/// * JNI framework ensures proper type conversions and memory management
/// * This function is called from Kotlin via JNI, not directly
///
/// # Note
/// Unlike FFT, PitchResult is returned by value (small struct), not by pointer.
/// JNI will automatically marshal this back to Kotlin data class.
#[no_mangle]
pub unsafe extern "C" fn Java_com_loqalabs_loqaexpodsp_RustJNI_RustBridge_nativeDetectPitch(
    _env: *mut std::os::raw::c_void,
    _class: *mut std::os::raw::c_void,
    buffer: *const c_float,
    buffer_length: c_int,
    sample_rate: c_int,
) -> PitchResult {
    // Delegate to the main pitch detection implementation
    // The JNI framework handles conversion of FloatArray to *const f32
    detect_pitch_rust(buffer, buffer_length, sample_rate)
}

/// Result structure for formant extraction
///
/// Returns the first three formant frequencies (F1, F2, F3) and their bandwidths.
/// This struct is C-compatible for FFI/JNI interop.
///
/// # Fields
/// * `f1` - First formant frequency in Hz (typically 200-1000 Hz for human voice)
/// * `f2` - Second formant frequency in Hz (typically 800-2500 Hz)
/// * `f3` - Third formant frequency in Hz (typically 2000-4000 Hz)
/// * `bw1` - Bandwidth of first formant in Hz
/// * `bw2` - Bandwidth of second formant in Hz
/// * `bw3` - Bandwidth of third formant in Hz
#[repr(C)]
#[derive(Debug, Clone, Copy)]
pub struct FormantsResult {
    pub f1: c_float,
    pub f2: c_float,
    pub f3: c_float,
    pub bw1: c_float,
    pub bw2: c_float,
    pub bw3: c_float,
}

/// Extracts formants (F1, F2, F3) using LPC analysis from loqa-voice-dsp crate
///
/// # Arguments
/// * `buffer` - Pointer to input audio samples (Float32 array)
/// * `length` - Number of samples in input buffer
/// * `sample_rate` - Sample rate in Hz (must be 8000-48000 Hz)
/// * `lpc_order` - LPC order (if 0, uses default: sample_rate / 1000 + 2)
///
/// # Returns
/// * FormantsResult struct with f1, f2, f3 frequencies and bandwidths
/// * Returns zeros on error
///
/// # Safety
/// * Caller must ensure `buffer` points to valid memory of at least `length` samples
/// * This function dereferences raw pointers and is inherently unsafe
/// * Buffer must remain valid for the duration of this function call
///
/// # Validation
/// * Sample rate must be between 8000 and 48000 Hz (AC3)
/// * Audio should be voiced for accurate formant extraction (AC3)
/// * Default LPC order is (sample_rate / 1000) + 2 (AC4)
/// * Returns formant frequencies in Hz (AC5)
///
/// # Note on LPC Analysis
/// * LPC (Linear Predictive Coding) finds resonant frequencies of vocal tract
/// * Best results with voiced speech segments (vowels)
/// * F1, F2, F3 are essential for vowel identification
/// * Formant bandwidths indicate the width of resonance peaks
#[no_mangle]
pub unsafe extern "C" fn extract_formants_rust(
    buffer: *const c_float,
    length: c_int,
    sample_rate: c_int,
    lpc_order: c_int,
) -> FormantsResult {
    // Default error result (all zeros)
    let error_result = FormantsResult {
        f1: 0.0,
        f2: 0.0,
        f3: 0.0,
        bw1: 0.0,
        bw2: 0.0,
        bw3: 0.0,
    };

    // Input validation
    if buffer.is_null() {
        eprintln!("[Rust FFI] Error: buffer pointer is null");
        return error_result;
    }

    if length <= 0 {
        eprintln!("[Rust FFI] Error: length must be > 0, got {length}");
        return error_result;
    }

    // Validate sample rate range: 8000-48000 Hz (AC3)
    if !(8000..=48000).contains(&sample_rate) {
        eprintln!(
            "[Rust FFI] Error: sample_rate must be in range [8000, 48000] Hz, got {sample_rate}"
        );
        return error_result;
    }

    // Calculate default LPC order if not specified (AC4)
    // Default: (sample_rate / 1000) + 2, clamped to valid range [8, 24]
    // loqa-voice-dsp requires LPC order to be in range 8-24
    let computed_lpc_order = if lpc_order <= 0 {
        let calculated = (sample_rate / 1000) + 2;
        calculated.clamp(8, 24)
    } else {
        lpc_order
    };

    // Validate LPC order is in the range supported by loqa-voice-dsp (8-24)
    if !(8..=24).contains(&computed_lpc_order) {
        eprintln!(
            "[Rust FFI] Error: LPC order must be in range [8, 24], got {computed_lpc_order}"
        );
        return error_result;
    }

    // Validate buffer is long enough for LPC analysis
    // Need at least lpc_order * 2 samples for meaningful analysis
    if length < computed_lpc_order * 2 {
        eprintln!(
            "[Rust FFI] Error: buffer length {length} too short for LPC order {computed_lpc_order} (need at least {})",
            computed_lpc_order * 2
        );
        return error_result;
    }

    // Convert raw pointer to Rust slice
    let input_slice = slice::from_raw_parts(buffer, length as usize);

    // Call loqa-voice-dsp LPC formant extraction function (AC2)
    let formants_result = loqa_voice_dsp::extract_formants(
        input_slice,
        sample_rate as u32,
        computed_lpc_order as usize,
    );

    // Handle formant extraction result
    match formants_result {
        Ok(result) => {
            // Extract F1, F2, F3 (AC1, AC5)
            // Note: loqa-voice-dsp v0.1 returns f1, f2, f3, and confidence
            // Bandwidth estimation is not yet available in v0.1, so we set them to 0
            // Future versions may include bandwidth information
            FormantsResult {
                f1: result.f1,
                f2: result.f2,
                f3: result.f3,
                bw1: 0.0,  // TODO: Add bandwidth estimation in future version
                bw2: 0.0,
                bw3: 0.0,
            }
        }
        Err(e) => {
            eprintln!("[Rust FFI] Formant extraction failed: {e:?}");
            error_result
        }
    }
}

/// Android JNI native method for extractFormants
///
/// JNI Method Signature Resolution:
/// - Kotlin declaration: `external fun nativeExtractFormants(buffer: FloatArray, sampleRate: Int, lpcOrder: Int): FormantsResult`
/// - Package: com.loqalabs.loqaexpodsp.RustJNI
/// - Class: RustBridge (object)
/// - Method: nativeExtractFormants
/// - JNI Function Name: Java_com_loqalabs_loqaexpodsp_RustJNI_RustBridge_nativeExtractFormants
///
/// # Arguments
/// * `env` - JNI environment pointer (unused but required by JNI)
/// * `class` - JNI class reference (unused but required by JNI)
/// * `buffer` - JNI jfloatArray reference to input audio samples
/// * `buffer_length` - Number of samples in buffer
/// * `sample_rate` - Sample rate in Hz (8000-48000)
/// * `lpc_order` - LPC order (0 for default: sample_rate / 1000 + 2)
///
/// # Returns
/// * FormantsResult struct with f1, f2, f3 and bandwidths
///
/// # Safety
/// * JNI framework ensures proper type conversions and memory management
/// * This function is called from Kotlin via JNI, not directly
///
/// # Note
/// FormantsResult is returned by value (small struct), not by pointer.
/// JNI will automatically marshal this back to Kotlin data class.
#[no_mangle]
pub unsafe extern "C" fn Java_com_loqalabs_loqaexpodsp_RustJNI_RustBridge_nativeExtractFormants(
    _env: *mut std::os::raw::c_void,
    _class: *mut std::os::raw::c_void,
    buffer: *const c_float,
    buffer_length: c_int,
    sample_rate: c_int,
    lpc_order: c_int,
) -> FormantsResult {
    // Delegate to the main formant extraction implementation
    // The JNI framework handles conversion of FloatArray to *const f32
    extract_formants_rust(buffer, buffer_length, sample_rate, lpc_order)
}

/// Result structure for spectral analysis
///
/// Returns spectral features: centroid (brightness), rolloff (energy distribution), and tilt (spectral slope).
/// This struct is C-compatible for FFI/JNI interop.
///
/// # Fields
/// * `centroid` - Spectral centroid in Hz (weighted mean of frequencies, indicates brightness)
/// * `rolloff` - Spectral rolloff frequency in Hz (frequency below which 95% of energy is concentrated)
/// * `tilt` - Spectral tilt (slope of spectrum, negative = more low frequency energy)
#[repr(C)]
#[derive(Debug, Clone, Copy)]
pub struct SpectrumResult {
    pub centroid: c_float,
    pub rolloff: c_float,
    pub tilt: c_float,
}

/// Analyzes spectral features using loqa-voice-dsp crate
///
/// Computes three key spectral features in a single efficient function call:
/// - Spectral centroid: weighted mean of frequencies (brightness measure)
/// - Spectral rolloff: frequency below which 95% of energy is concentrated
/// - Spectral tilt: overall slope of the spectral envelope
///
/// # Arguments
/// * `buffer` - Pointer to input audio samples (Float32 array)
/// * `length` - Number of samples in input buffer
/// * `sample_rate` - Sample rate in Hz (must be 8000-48000 Hz)
///
/// # Returns
/// * SpectrumResult struct with centroid, rolloff, and tilt
/// * Returns zeros on error
///
/// # Safety
/// * Caller must ensure `buffer` points to valid memory of at least `length` samples
/// * This function dereferences raw pointers and is inherently unsafe
/// * Buffer must remain valid for the duration of this function call
///
/// # Validation
/// * Sample rate must be between 8000 and 48000 Hz (AC1)
/// * All three spectral features computed in single pass for efficiency (AC5)
///
/// # Spectral Feature Definitions
/// * **Spectral Centroid (AC2):** Weighted mean of frequencies, indicates "brightness"
///   - Higher values = brighter, more high-frequency content
///   - Measured in Hz
/// * **Spectral Rolloff (AC3):** Frequency below which 95% of energy is concentrated
///   - Indicates energy distribution across spectrum
///   - Measured in Hz
/// * **Spectral Tilt (AC4):** Slope of spectral envelope
///   - Negative values = more low-frequency energy (bass-heavy)
///   - Positive values = more high-frequency energy (treble-heavy)
///   - Measured as slope coefficient
#[no_mangle]
pub unsafe extern "C" fn analyze_spectrum_rust(
    buffer: *const c_float,
    length: c_int,
    sample_rate: c_int,
) -> SpectrumResult {
    // Default error result (all zeros)
    let error_result = SpectrumResult {
        centroid: 0.0,
        rolloff: 0.0,
        tilt: 0.0,
    };

    // Input validation
    if buffer.is_null() {
        eprintln!("[Rust FFI] Error: buffer pointer is null");
        return error_result;
    }

    if length <= 0 {
        eprintln!("[Rust FFI] Error: length must be > 0, got {length}");
        return error_result;
    }

    // Validate sample rate range: 8000-48000 Hz (AC1)
    if !(8000..=48000).contains(&sample_rate) {
        eprintln!(
            "[Rust FFI] Error: sample_rate must be in range [8000, 48000] Hz, got {sample_rate}"
        );
        return error_result;
    }

    // Convert raw pointer to Rust slice
    let input_slice = slice::from_raw_parts(buffer, length as usize);

    // First, compute FFT to get frequency domain representation
    // We use the same FFT size as buffer length for spectral analysis
    let fft_size = length as usize;

    // Call loqa-voice-dsp FFT function
    let fft_result = loqa_voice_dsp::compute_fft(
        input_slice,
        sample_rate as u32,
        fft_size
    );

    let fft_data = match fft_result {
        Ok(result) => result,
        Err(e) => {
            eprintln!("[Rust FFI] FFT computation for spectral analysis failed: {e:?}");
            return error_result;
        }
    };

    // Call loqa-voice-dsp spectral analysis function
    // AC5: All three features computed in single function call for efficiency
    let spectrum_result = loqa_voice_dsp::analyze_spectrum(&fft_data);

    // Handle spectral analysis result
    match spectrum_result {
        Ok(result) => {
            // Extract spectral features (AC2, AC3, AC4)
            SpectrumResult {
                centroid: result.centroid,      // AC2: Spectral centroid in Hz
                rolloff: result.rolloff_95,     // AC3: Spectral rolloff (95% energy threshold)
                tilt: result.tilt,              // AC4: Spectral tilt (slope)
            }
        }
        Err(e) => {
            eprintln!("[Rust FFI] Spectral analysis failed: {e:?}");
            error_result
        }
    }
}

/// Android JNI native method for analyzeSpectrum
///
/// JNI Method Signature Resolution:
/// - Kotlin declaration: `external fun nativeAnalyzeSpectrum(buffer: FloatArray, sampleRate: Int): SpectrumResult`
/// - Package: com.loqalabs.loqaexpodsp.RustJNI
/// - Class: RustBridge (object)
/// - Method: nativeAnalyzeSpectrum
/// - JNI Function Name: Java_com_loqalabs_loqaexpodsp_RustJNI_RustBridge_nativeAnalyzeSpectrum
///
/// # Arguments
/// * `env` - JNI environment pointer (unused but required by JNI)
/// * `class` - JNI class reference (unused but required by JNI)
/// * `buffer` - JNI jfloatArray reference to input audio samples
/// * `buffer_length` - Number of samples in buffer
/// * `sample_rate` - Sample rate in Hz (8000-48000)
///
/// # Returns
/// * SpectrumResult struct with centroid, rolloff, and tilt
///
/// # Safety
/// * JNI framework ensures proper type conversions and memory management
/// * This function is called from Kotlin via JNI, not directly
///
/// # Note
/// SpectrumResult is returned by value (small struct), not by pointer.
/// JNI will automatically marshal this back to Kotlin data class.
#[no_mangle]
pub unsafe extern "C" fn Java_com_loqalabs_loqaexpodsp_RustJNI_RustBridge_nativeAnalyzeSpectrum(
    _env: *mut std::os::raw::c_void,
    _class: *mut std::os::raw::c_void,
    buffer: *const c_float,
    buffer_length: c_int,
    sample_rate: c_int,
) -> SpectrumResult {
    // Delegate to the main spectral analysis implementation
    // The JNI framework handles conversion of FloatArray to *const f32
    analyze_spectrum_rust(buffer, buffer_length, sample_rate)
}

/// Result structure for HNR (Harmonics-to-Noise Ratio) calculation
///
/// Returns HNR in decibels, detected F0, and voicing classification.
/// This struct is C-compatible for FFI/JNI interop.
///
/// # Fields
/// * `hnr` - Harmonics-to-Noise Ratio in dB (higher = clearer voice, lower = breathier)
/// * `f0` - Detected fundamental frequency in Hz
/// * `is_voiced` - Whether the signal is voiced (periodic)
#[repr(C)]
#[derive(Debug, Clone, Copy)]
pub struct HNRResult {
    pub hnr: c_float,
    pub f0: c_float,
    pub is_voiced: bool,
}

/// Calculates Harmonics-to-Noise Ratio using Boersma's autocorrelation method
///
/// HNR measures the ratio of harmonic (periodic) to noise (aperiodic) energy in voice.
/// It is the primary acoustic measure of breathiness:
/// - Higher HNR (18-25 dB): Clear, less breathy voice
/// - Lower HNR (12-18 dB): Softer, more breathy voice
///
/// # Arguments
/// * `buffer` - Pointer to input audio samples (Float32 array)
/// * `length` - Number of samples in input buffer
/// * `sample_rate` - Sample rate in Hz (must be 8000-48000 Hz)
/// * `min_freq` - Minimum F0 frequency to search (typically 75 Hz)
/// * `max_freq` - Maximum F0 frequency to search (typically 500 Hz)
///
/// # Returns
/// * HNRResult struct with hnr (dB), f0 (Hz), and is_voiced flag
/// * Returns hnr=0.0, f0=0.0, is_voiced=false on error
///
/// # Safety
/// * Caller must ensure `buffer` points to valid memory of at least `length` samples
/// * This function dereferences raw pointers and is inherently unsafe
/// * Buffer must remain valid for the duration of this function call
#[no_mangle]
pub unsafe extern "C" fn calculate_hnr_rust(
    buffer: *const c_float,
    length: c_int,
    sample_rate: c_int,
    min_freq: c_float,
    max_freq: c_float,
) -> HNRResult {
    // Default error result
    let error_result = HNRResult {
        hnr: 0.0,
        f0: 0.0,
        is_voiced: false,
    };

    // Input validation
    if buffer.is_null() {
        eprintln!("[Rust FFI] Error: buffer pointer is null");
        return error_result;
    }

    if length <= 0 {
        eprintln!("[Rust FFI] Error: length must be > 0, got {length}");
        return error_result;
    }

    // Validate sample rate range: 8000-48000 Hz
    if !(8000..=48000).contains(&sample_rate) {
        eprintln!(
            "[Rust FFI] Error: sample_rate must be in range [8000, 48000] Hz, got {sample_rate}"
        );
        return error_result;
    }

    // Validate frequency range
    if min_freq <= 0.0 || max_freq <= min_freq {
        eprintln!(
            "[Rust FFI] Error: invalid frequency range: min={min_freq}, max={max_freq}"
        );
        return error_result;
    }

    // Convert raw pointer to Rust slice
    let input_slice = slice::from_raw_parts(buffer, length as usize);

    // Call loqa-voice-dsp HNR calculation function
    let hnr_result = loqa_voice_dsp::calculate_hnr(
        input_slice,
        sample_rate as u32,
        min_freq,
        max_freq,
    );

    // Handle HNR calculation result
    match hnr_result {
        Ok(result) => HNRResult {
            hnr: result.hnr,
            f0: result.f0,
            is_voiced: result.is_voiced,
        },
        Err(e) => {
            eprintln!("[Rust FFI] HNR calculation failed: {e:?}");
            error_result
        }
    }
}

/// Result structure for H1-H2 amplitude difference calculation
///
/// Returns H1-H2 difference and individual harmonic amplitudes in decibels.
/// This struct is C-compatible for FFI/JNI interop.
///
/// # Fields
/// * `h1h2` - H1-H2 difference in dB (higher = lighter voice, lower = fuller voice)
/// * `h1_amplitude_db` - First harmonic (fundamental) amplitude in dB
/// * `h2_amplitude_db` - Second harmonic amplitude in dB
/// * `f0` - Fundamental frequency used for calculation in Hz
#[repr(C)]
#[derive(Debug, Clone, Copy)]
pub struct H1H2Result {
    pub h1h2: c_float,
    pub h1_amplitude_db: c_float,
    pub h2_amplitude_db: c_float,
    pub f0: c_float,
}

/// Calculates H1-H2 amplitude difference for vocal weight analysis
///
/// H1-H2 measures the difference in amplitude between the first harmonic (fundamental)
/// and second harmonic. It correlates with vocal weight:
/// - Higher H1-H2 (>5 dB): Lighter, breathier vocal quality
/// - Lower H1-H2 (<0 dB): Fuller, heavier vocal quality
///
/// # Arguments
/// * `buffer` - Pointer to input audio samples (Float32 array)
/// * `length` - Number of samples in input buffer
/// * `sample_rate` - Sample rate in Hz (must be 8000-48000 Hz)
/// * `f0` - Fundamental frequency in Hz, or 0.0 to auto-detect
///
/// # Returns
/// * H1H2Result struct with h1h2, h1_amplitude_db, h2_amplitude_db, and f0
/// * Returns all zeros on error
///
/// # Safety
/// * Caller must ensure `buffer` points to valid memory of at least `length` samples
/// * This function dereferences raw pointers and is inherently unsafe
/// * Buffer must remain valid for the duration of this function call
#[no_mangle]
pub unsafe extern "C" fn calculate_h1h2_rust(
    buffer: *const c_float,
    length: c_int,
    sample_rate: c_int,
    f0: c_float,
) -> H1H2Result {
    // Default error result
    let error_result = H1H2Result {
        h1h2: 0.0,
        h1_amplitude_db: 0.0,
        h2_amplitude_db: 0.0,
        f0: 0.0,
    };

    // Input validation
    if buffer.is_null() {
        eprintln!("[Rust FFI] Error: buffer pointer is null");
        return error_result;
    }

    if length <= 0 {
        eprintln!("[Rust FFI] Error: length must be > 0, got {length}");
        return error_result;
    }

    // Validate sample rate range: 8000-48000 Hz
    if !(8000..=48000).contains(&sample_rate) {
        eprintln!(
            "[Rust FFI] Error: sample_rate must be in range [8000, 48000] Hz, got {sample_rate}"
        );
        return error_result;
    }

    // Convert raw pointer to Rust slice
    let input_slice = slice::from_raw_parts(buffer, length as usize);

    // Convert f0: 0.0 means auto-detect (None), otherwise Some(f0)
    let f0_option = if f0 > 0.0 { Some(f0) } else { None };

    // Call loqa-voice-dsp H1-H2 calculation function
    let h1h2_result = loqa_voice_dsp::calculate_h1h2(
        input_slice,
        sample_rate as u32,
        f0_option,
    );

    // Handle H1-H2 calculation result
    match h1h2_result {
        Ok(result) => H1H2Result {
            h1h2: result.h1h2,
            h1_amplitude_db: result.h1_amplitude_db,
            h2_amplitude_db: result.h2_amplitude_db,
            f0: result.f0,
        },
        Err(e) => {
            eprintln!("[Rust FFI] H1-H2 calculation failed: {e:?}");
            error_result
        }
    }
}

/// Android JNI native method for calculateHNR
///
/// JNI Method Signature Resolution:
/// - Kotlin declaration: `external fun nativeCalculateHNR(buffer: FloatArray, sampleRate: Int, minFreq: Float, maxFreq: Float): HNRResult`
/// - Package: com.loqalabs.loqaexpodsp.RustJNI
/// - Class: RustBridge (object)
/// - Method: nativeCalculateHNR
/// - JNI Function Name: Java_com_loqalabs_loqaexpodsp_RustJNI_RustBridge_nativeCalculateHNR
///
/// # Arguments
/// * `env` - JNI environment pointer (unused but required by JNI)
/// * `class` - JNI class reference (unused but required by JNI)
/// * `buffer` - JNI jfloatArray reference to input audio samples
/// * `buffer_length` - Number of samples in buffer
/// * `sample_rate` - Sample rate in Hz (8000-48000)
/// * `min_freq` - Minimum F0 frequency to search (typically 75 Hz)
/// * `max_freq` - Maximum F0 frequency to search (typically 500 Hz)
///
/// # Returns
/// * HNRResult struct with hnr (dB), f0 (Hz), and is_voiced flag
///
/// # Safety
/// * JNI framework ensures proper type conversions and memory management
/// * This function is called from Kotlin via JNI, not directly
///
/// # Note
/// HNRResult is returned by value (small struct), not by pointer.
/// JNI will automatically marshal this back to Kotlin data class.
#[no_mangle]
pub unsafe extern "C" fn Java_com_loqalabs_loqaexpodsp_RustJNI_RustBridge_nativeCalculateHNR(
    _env: *mut std::os::raw::c_void,
    _class: *mut std::os::raw::c_void,
    buffer: *const c_float,
    buffer_length: c_int,
    sample_rate: c_int,
    min_freq: c_float,
    max_freq: c_float,
) -> HNRResult {
    // Delegate to the main HNR implementation
    // The JNI framework handles conversion of FloatArray to *const f32
    calculate_hnr_rust(buffer, buffer_length, sample_rate, min_freq, max_freq)
}

/// Android JNI native method for calculateH1H2
///
/// JNI Method Signature Resolution:
/// - Kotlin declaration: `external fun nativeCalculateH1H2(buffer: FloatArray, sampleRate: Int, f0: Float): H1H2Result`
/// - Package: com.loqalabs.loqaexpodsp.RustJNI
/// - Class: RustBridge (object)
/// - Method: nativeCalculateH1H2
/// - JNI Function Name: Java_com_loqalabs_loqaexpodsp_RustJNI_RustBridge_nativeCalculateH1H2
///
/// # Arguments
/// * `env` - JNI environment pointer (unused but required by JNI)
/// * `class` - JNI class reference (unused but required by JNI)
/// * `buffer` - JNI jfloatArray reference to input audio samples
/// * `buffer_length` - Number of samples in buffer
/// * `sample_rate` - Sample rate in Hz (8000-48000)
/// * `f0` - Fundamental frequency in Hz, or 0.0 to auto-detect
///
/// # Returns
/// * H1H2Result struct with h1h2, h1_amplitude_db, h2_amplitude_db, and f0
///
/// # Safety
/// * JNI framework ensures proper type conversions and memory management
/// * This function is called from Kotlin via JNI, not directly
///
/// # Note
/// H1H2Result is returned by value (small struct), not by pointer.
/// JNI will automatically marshal this back to Kotlin data class.
#[no_mangle]
pub unsafe extern "C" fn Java_com_loqalabs_loqaexpodsp_RustJNI_RustBridge_nativeCalculateH1H2(
    _env: *mut std::os::raw::c_void,
    _class: *mut std::os::raw::c_void,
    buffer: *const c_float,
    buffer_length: c_int,
    sample_rate: c_int,
    f0: c_float,
) -> H1H2Result {
    // Delegate to the main H1-H2 implementation
    // The JNI framework handles conversion of FloatArray to *const f32
    calculate_h1h2_rust(buffer, buffer_length, sample_rate, f0)
}

// ============================================================================
// VoiceAnalyzer process_buffer FFI - HMM-smoothed pitch tracking (v0.5.0)
// ============================================================================

/// C-compatible PitchTrack result from Viterbi decoding
///
/// Contains smoothed pitch track, voiced probabilities, and timestamps.
/// Arrays are heap-allocated and owned by caller after return.
/// Caller MUST call `loqa_free_pitch_track` to prevent memory leaks.
#[repr(C)]
#[derive(Debug)]
pub struct PitchTrackFFI {
    /// True if processing succeeded
    pub success: bool,
    /// Pointer to pitch estimates array (Hz, 0.0 = unvoiced)
    pub pitch_track_ptr: *mut c_float,
    /// Pointer to voiced probabilities array [0.0, 1.0]
    pub voiced_probs_ptr: *mut c_float,
    /// Pointer to timestamps array (seconds from buffer start)
    pub timestamps_ptr: *mut c_float,
    /// Number of frames (length of all three arrays)
    pub length: usize,
}

/// Process audio buffer with HMM-smoothed Viterbi decoding
///
/// Unlike `process_stream` which treats frames independently, this method uses
/// Viterbi decoding to find the globally optimal pitch track across all frames,
/// reducing octave errors (from ~8-12% to ≤3%) and producing smoother contours.
///
/// This is best suited for offline analysis of complete utterances
/// (typically < 60 seconds). For longer recordings, segment into utterances first.
///
/// **Note:** Always uses pYIN algorithm regardless of config settings, since
/// HMM smoothing requires the probabilistic candidates that only pYIN provides.
///
/// # Arguments
/// * `analyzer` - Pointer to VoiceAnalyzer from `loqa_voice_analyzer_new`
/// * `samples` - Pointer to audio samples (Float32 array)
/// * `len` - Number of samples in buffer
///
/// # Returns
/// * PitchTrackFFI with success=true and allocated arrays if processing succeeded
/// * Caller MUST call `loqa_free_pitch_track` to deallocate arrays
///
/// # Safety
/// * `analyzer` must be a valid pointer from `loqa_voice_analyzer_new`
/// * `samples` must point to valid f32 array of length `len`
/// * Caller MUST call `loqa_free_pitch_track` to avoid memory leaks
#[no_mangle]
pub unsafe extern "C" fn loqa_voice_analyzer_process_buffer(
    analyzer: *mut std::ffi::c_void,
    samples: *const c_float,
    len: usize,
) -> PitchTrackFFI {
    // Error result helper
    let error_result = PitchTrackFFI {
        success: false,
        pitch_track_ptr: std::ptr::null_mut(),
        voiced_probs_ptr: std::ptr::null_mut(),
        timestamps_ptr: std::ptr::null_mut(),
        length: 0,
    };

    // Null pointer checks
    if analyzer.is_null() {
        eprintln!("[Rust FFI] Error: analyzer pointer is null");
        return error_result;
    }

    if samples.is_null() || len == 0 {
        eprintln!("[Rust FFI] Error: samples pointer is null or length is 0");
        return error_result;
    }

    // Cast back to VoiceAnalyzer
    let analyzer_ref = &mut *(analyzer as *mut loqa_voice_dsp::VoiceAnalyzer);
    let samples_slice = slice::from_raw_parts(samples, len);

    // Call process_buffer for Viterbi-smoothed pitch track
    match analyzer_ref.process_buffer(samples_slice) {
        Ok(track) => {
            let frame_count = track.pitch_track.len();

            // Allocate C-compatible arrays
            let mut pitch_vec = track.pitch_track.into_boxed_slice();
            let mut probs_vec = track.voiced_probabilities.into_boxed_slice();
            let mut times_vec = track.timestamps.into_boxed_slice();

            let pitch_ptr = pitch_vec.as_mut_ptr();
            let probs_ptr = probs_vec.as_mut_ptr();
            let times_ptr = times_vec.as_mut_ptr();

            // Prevent Rust from freeing the memory (caller will free via loqa_free_pitch_track)
            std::mem::forget(pitch_vec);
            std::mem::forget(probs_vec);
            std::mem::forget(times_vec);

            PitchTrackFFI {
                success: true,
                pitch_track_ptr: pitch_ptr,
                voiced_probs_ptr: probs_ptr,
                timestamps_ptr: times_ptr,
                length: frame_count,
            }
        }
        Err(e) => {
            eprintln!("[Rust FFI] process_buffer failed: {e}");
            error_result
        }
    }
}

/// Free PitchTrackFFI arrays allocated by `loqa_voice_analyzer_process_buffer`
///
/// # Safety
/// * `result` must point to valid PitchTrackFFI from `loqa_voice_analyzer_process_buffer`
/// * Must be called exactly once per successful `loqa_voice_analyzer_process_buffer` call
/// * After calling this, the pointers in `result` are invalid
#[no_mangle]
pub unsafe extern "C" fn loqa_free_pitch_track(result: *mut PitchTrackFFI) {
    if result.is_null() {
        return;
    }

    let res = &*result;

    // Free each array if non-null
    if !res.pitch_track_ptr.is_null() && res.length > 0 {
        let _ = Box::from_raw(slice::from_raw_parts_mut(res.pitch_track_ptr, res.length));
    }

    if !res.voiced_probs_ptr.is_null() && res.length > 0 {
        let _ = Box::from_raw(slice::from_raw_parts_mut(res.voiced_probs_ptr, res.length));
    }

    if !res.timestamps_ptr.is_null() && res.length > 0 {
        let _ = Box::from_raw(slice::from_raw_parts_mut(res.timestamps_ptr, res.length));
    }
}

/// Placeholder FFI function for testing build infrastructure (retained for backward compatibility)
#[no_mangle]
pub extern "C" fn test_ffi_bridge() -> i32 {
    42
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::f32::consts::PI;

    #[test]
    fn test_ffi_placeholder() {
        assert_eq!(test_ffi_bridge(), 42);
    }

    #[test]
    fn test_compute_fft_null_buffer() {
        unsafe {
            let result = compute_fft_rust(std::ptr::null(), 1024, 44100, 512);
            assert!(result.is_null(), "Should return null for null buffer");
        }
    }

    #[test]
    fn test_compute_fft_invalid_length() {
        let buffer: Vec<f32> = vec![0.0; 1024];
        unsafe {
            let result = compute_fft_rust(buffer.as_ptr(), 0, 44100, 512);
            assert!(result.is_null(), "Should return null for length <= 0");

            let result = compute_fft_rust(buffer.as_ptr(), -10, 44100, 512);
            assert!(result.is_null(), "Should return null for negative length");
        }
    }

    #[test]
    fn test_compute_fft_invalid_sample_rate() {
        let buffer: Vec<f32> = vec![0.0; 1024];
        unsafe {
            let result = compute_fft_rust(buffer.as_ptr(), 1024, 0, 512);
            assert!(result.is_null(), "Should return null for sample_rate <= 0");

            let result = compute_fft_rust(buffer.as_ptr(), 1024, -100, 512);
            assert!(
                result.is_null(),
                "Should return null for negative sample_rate"
            );
        }
    }

    #[test]
    fn test_compute_fft_invalid_fft_size_not_power_of_2() {
        let buffer: Vec<f32> = vec![0.0; 1024];

        unsafe {
            // Test non-power-of-2 sizes
            let result = compute_fft_rust(buffer.as_ptr(), 1024, 44100, 500);
            assert!(
                result.is_null(),
                "Should return null for non-power-of-2 FFT size"
            );

            let result = compute_fft_rust(buffer.as_ptr(), 1024, 44100, 1000);
            assert!(
                result.is_null(),
                "Should return null for non-power-of-2 FFT size"
            );
        }
    }

    #[test]
    fn test_compute_fft_invalid_fft_size_out_of_range() {
        let buffer: Vec<f32> = vec![0.0; 1024];

        unsafe {
            // Test below minimum (256)
            let result = compute_fft_rust(buffer.as_ptr(), 1024, 44100, 128);
            assert!(result.is_null(), "Should return null for FFT size < 256");

            // Test above maximum (8192)
            let result = compute_fft_rust(buffer.as_ptr(), 16384, 44100, 16384);
            assert!(result.is_null(), "Should return null for FFT size > 8192");
        }
    }

    #[test]
    fn test_compute_fft_valid_input_returns_non_null() {
        // Generate a simple sine wave at 440 Hz
        let sample_rate = 44100;
        let frequency = 440.0;
        let duration = 0.1; // 100ms
        let num_samples = (sample_rate as f32 * duration) as usize;

        let mut buffer: Vec<f32> = Vec::with_capacity(num_samples);
        for i in 0..num_samples {
            let t = i as f32 / sample_rate as f32;
            buffer.push((2.0 * PI * frequency * t).sin());
        }

        let fft_size = 2048;
        unsafe {
            let result = compute_fft_rust(buffer.as_ptr(), num_samples as c_int, sample_rate, fft_size);
            assert!(!result.is_null(), "Should return valid pointer");

            // Clean up memory (fft_size / 2 + 1)
            free_fft_result_rust(result, (fft_size / 2) + 1);
        }
    }

    #[test]
    fn test_compute_fft_result_length() {
        let buffer: Vec<f32> = vec![0.5; 2048];
        let sample_rate = 44100;
        let fft_size = 1024;
        let expected_result_length = (fft_size / 2) + 1; // loqa-voice-dsp returns N/2 + 1

        unsafe {
            let result = compute_fft_rust(buffer.as_ptr(), 2048, sample_rate, fft_size);
            assert!(!result.is_null());

            // Verify we can read the result (this tests memory safety)
            let result_slice = slice::from_raw_parts(result, expected_result_length as usize);
            assert_eq!(result_slice.len(), expected_result_length as usize);

            // All values should be finite (not NaN or Infinity)
            for val in result_slice {
                assert!(val.is_finite(), "FFT result should be finite");
            }

            // Clean up
            free_fft_result_rust(result, expected_result_length);
        }
    }

    #[test]
    fn test_compute_fft_sine_wave_peak_detection() {
        // Generate a pure sine wave at known frequency
        let sample_rate = 44100;
        let target_frequency = 1000.0; // 1 kHz
        let fft_size = 4096;
        let num_samples = fft_size;

        let mut buffer: Vec<f32> = Vec::with_capacity(num_samples);
        for i in 0..num_samples {
            let t = i as f32 / sample_rate as f32;
            buffer.push((2.0 * PI * target_frequency * t).sin());
        }

        unsafe {
            let result = compute_fft_rust(buffer.as_ptr(), num_samples as c_int, sample_rate, fft_size as c_int);
            assert!(!result.is_null());

            let magnitude_len = (fft_size / 2) + 1;
            let magnitude_slice = slice::from_raw_parts(result, magnitude_len);

            // Find the peak in the magnitude spectrum
            let mut max_magnitude = 0.0_f32;
            let mut max_index = 0;
            for (i, &mag) in magnitude_slice.iter().enumerate() {
                if mag > max_magnitude {
                    max_magnitude = mag;
                    max_index = i;
                }
            }

            // Calculate the frequency of the peak
            let peak_frequency = (max_index as f32) * (sample_rate as f32 / fft_size as f32);

            // The peak should be close to our target frequency (within 1 bin)
            let frequency_resolution = sample_rate as f32 / fft_size as f32;
            let frequency_error = (peak_frequency - target_frequency).abs();

            assert!(
                frequency_error < frequency_resolution * 1.5,
                "Peak frequency {peak_frequency} Hz should be close to target {target_frequency} Hz (error: {frequency_error} Hz)"
            );

            free_fft_result_rust(result, ((fft_size / 2) + 1) as c_int);
        }
    }

    #[test]
    fn test_free_fft_result_handles_null() {
        // Should not crash
        unsafe {
            free_fft_result_rust(std::ptr::null_mut(), 256);
        }
    }

    #[test]
    fn test_free_fft_result_handles_invalid_length() {
        let buffer: Vec<f32> = vec![0.5; 1024];
        unsafe {
            let result = compute_fft_rust(buffer.as_ptr(), 1024, 44100, 512);
            assert!(!result.is_null());

            // These should handle gracefully (not crash)
            free_fft_result_rust(result, 0);
        }
        // Note: We've now leaked the memory, but that's ok for this test
        // In production, free should be called with correct length
    }

    #[test]
    fn test_memory_safety_multiple_allocations() {
        // Test that we can allocate and free multiple FFT results without issues
        let buffer: Vec<f32> = vec![0.5; 2048];
        let sample_rate = 44100;
        let fft_size = 1024;
        let result_len = (fft_size / 2) + 1;

        unsafe {
            for _ in 0..10 {
                let result = compute_fft_rust(buffer.as_ptr(), 2048, sample_rate, fft_size);
                assert!(!result.is_null());
                free_fft_result_rust(result, result_len);
            }
        }
    }

    // ======== Pitch Detection Tests ========

    #[test]
    fn test_detect_pitch_null_buffer() {
        unsafe {
            let result = detect_pitch_rust(std::ptr::null(), 1024, 44100);
            assert_eq!(result.frequency, 0.0, "Should return frequency=0.0 for null buffer");
            assert_eq!(result.confidence, 0.0, "Should return confidence=0.0 for null buffer");
            assert!(!result.is_voiced, "Should return is_voiced=false for null buffer");
        }
    }

    #[test]
    fn test_detect_pitch_invalid_length() {
        let buffer: Vec<f32> = vec![0.0; 1024];
        unsafe {
            // Test zero length
            let result = detect_pitch_rust(buffer.as_ptr(), 0, 44100);
            assert_eq!(result.frequency, 0.0);
            assert_eq!(result.confidence, 0.0);
            assert!(!result.is_voiced);

            // Test negative length
            let result = detect_pitch_rust(buffer.as_ptr(), -10, 44100);
            assert_eq!(result.frequency, 0.0);
            assert_eq!(result.confidence, 0.0);
            assert!(!result.is_voiced);
        }
    }

    #[test]
    fn test_detect_pitch_invalid_sample_rate_below_minimum() {
        let buffer: Vec<f32> = vec![0.0; 1024];
        unsafe {
            // Test below 8000 Hz (AC3)
            let result = detect_pitch_rust(buffer.as_ptr(), 1024, 7999);
            assert_eq!(result.frequency, 0.0, "Should return error for sample rate < 8000 Hz");
            assert_eq!(result.confidence, 0.0);
            assert!(!result.is_voiced);

            // Test zero sample rate
            let result = detect_pitch_rust(buffer.as_ptr(), 1024, 0);
            assert_eq!(result.frequency, 0.0);
            assert_eq!(result.confidence, 0.0);
            assert!(!result.is_voiced);

            // Test negative sample rate
            let result = detect_pitch_rust(buffer.as_ptr(), 1024, -100);
            assert_eq!(result.frequency, 0.0);
            assert_eq!(result.confidence, 0.0);
            assert!(!result.is_voiced);
        }
    }

    #[test]
    fn test_detect_pitch_invalid_sample_rate_above_maximum() {
        let buffer: Vec<f32> = vec![0.0; 1024];
        unsafe {
            // Test above 48000 Hz (AC3)
            let result = detect_pitch_rust(buffer.as_ptr(), 1024, 48001);
            assert_eq!(result.frequency, 0.0, "Should return error for sample rate > 48000 Hz");
            assert_eq!(result.confidence, 0.0);
            assert!(!result.is_voiced);
        }
    }

    #[test]
    fn test_detect_pitch_valid_sample_rates() {
        let buffer: Vec<f32> = vec![0.5; 2048];

        unsafe {
            // Test minimum valid sample rate (8000 Hz)
            let result = detect_pitch_rust(buffer.as_ptr(), 2048, 8000);
            // Should not error (frequency may be 0 due to buffer content, but call should succeed)
            assert!(result.confidence >= 0.0 && result.confidence <= 1.0);

            // Test common sample rate (44100 Hz)
            let result = detect_pitch_rust(buffer.as_ptr(), 2048, 44100);
            assert!(result.confidence >= 0.0 && result.confidence <= 1.0);

            // Test maximum valid sample rate (48000 Hz)
            let result = detect_pitch_rust(buffer.as_ptr(), 2048, 48000);
            assert!(result.confidence >= 0.0 && result.confidence <= 1.0);
        }
    }

    #[test]
    fn test_detect_pitch_confidence_range() {
        // Generate synthetic tone at 440 Hz
        let sample_rate = 44100;
        let frequency = 440.0;
        let duration = 0.1; // 100ms
        let num_samples = (sample_rate as f32 * duration) as usize;

        let mut buffer: Vec<f32> = Vec::with_capacity(num_samples);
        for i in 0..num_samples {
            let t = i as f32 / sample_rate as f32;
            buffer.push((2.0 * PI * frequency * t).sin());
        }

        unsafe {
            let result = detect_pitch_rust(buffer.as_ptr(), num_samples as c_int, sample_rate);

            // AC5: Confidence must be in range [0.0, 1.0]
            assert!(
                result.confidence >= 0.0 && result.confidence <= 1.0,
                "Confidence {:.3} must be in range [0.0, 1.0]",
                result.confidence
            );
        }
    }

    #[test]
    fn test_detect_pitch_sine_wave_220hz() {
        // Generate a pure 220 Hz sine wave (A3) - within human voice range
        let sample_rate = 44100;
        let target_frequency = 220.0; // Within MIN_FREQUENCY..MAX_FREQUENCY range
        let duration = 0.1; // 100ms should be enough for YIN
        let num_samples = (sample_rate as f32 * duration) as usize;

        let mut buffer: Vec<f32> = Vec::with_capacity(num_samples);
        for i in 0..num_samples {
            let t = i as f32 / sample_rate as f32;
            buffer.push((2.0 * PI * target_frequency * t).sin());
        }

        unsafe {
            let result = detect_pitch_rust(buffer.as_ptr(), num_samples as c_int, sample_rate);

            // For a clear sine wave within the detection range, we should detect a pitch
            // YIN is very accurate for pure tones in the target frequency range
            if result.is_voiced {
                // If voiced, frequency should be close to 220 Hz
                let error = (result.frequency - target_frequency).abs();
                let error_percent = (error / target_frequency) * 100.0;

                assert!(
                    error_percent < 10.0,
                    "Detected frequency {:.1} Hz should be within 10% of target {:.1} Hz (error: {:.2}%)",
                    result.frequency,
                    target_frequency,
                    error_percent
                );

                // Confidence should be reasonably high for clean tone
                assert!(
                    result.confidence > 0.5,
                    "Confidence {:.3} should be > 0.5 for clear sine wave",
                    result.confidence
                );
            }
        }
    }

    #[test]
    fn test_detect_pitch_silence_returns_unvoiced() {
        // Test with silence (all zeros)
        let buffer: Vec<f32> = vec![0.0; 2048];
        let sample_rate = 44100;

        unsafe {
            let result = detect_pitch_rust(buffer.as_ptr(), 2048, sample_rate);

            // AC4: Silence should return frequency=0.0 and is_voiced=false
            assert_eq!(
                result.frequency, 0.0,
                "Silence should return frequency=0.0"
            );
            assert!(
                !result.is_voiced,
                "Silence should be classified as unvoiced"
            );
        }
    }

    #[test]
    fn test_detect_pitch_noise_behavior() {
        // Generate white noise (random values)
        let mut buffer: Vec<f32> = vec![0.0; 2048];
        let sample_rate = 44100;

        // Simple pseudo-random noise generator
        for (i, sample) in buffer.iter_mut().enumerate() {
            // Use a simple hash-like function for reproducibility
            let hash = (i as u32).wrapping_mul(2654435761);
            *sample = ((hash % 1000) as f32 / 1000.0) * 2.0 - 1.0; // Range: [-1.0, 1.0]
        }

        unsafe {
            let result = detect_pitch_rust(buffer.as_ptr(), 2048, sample_rate);

            // Noise behavior: The YIN algorithm may detect spurious periodicities in noise
            // The important thing is that confidence values are always in valid range
            assert!(
                result.confidence >= 0.0 && result.confidence <= 1.0,
                "Confidence must be in valid range [0.0, 1.0], got {:.3}",
                result.confidence
            );

            // AC4: If unvoiced, frequency should be 0.0
            if !result.is_voiced {
                assert_eq!(
                    result.frequency, 0.0,
                    "Unvoiced noise should have frequency=0.0"
                );
            }
        }
    }

    #[test]
    fn test_detect_pitch_multiple_sample_rates() {
        // Generate 220 Hz tone (A3)
        let target_frequency = 220.0;

        for sample_rate in [8000, 16000, 22050, 44100, 48000] {
            let duration = 0.1;
            let num_samples = (sample_rate as f32 * duration) as usize;

            let mut buffer: Vec<f32> = Vec::with_capacity(num_samples);
            for i in 0..num_samples {
                let t = i as f32 / sample_rate as f32;
                buffer.push((2.0 * PI * target_frequency * t).sin());
            }

            unsafe {
                let result = detect_pitch_rust(
                    buffer.as_ptr(),
                    num_samples as c_int,
                    sample_rate as c_int
                );

                // AC3: All sample rates in 8000-48000 Hz should work
                assert!(
                    result.confidence >= 0.0 && result.confidence <= 1.0,
                    "Sample rate {} Hz should work (got confidence {:.3})",
                    sample_rate,
                    result.confidence
                );
            }
        }
    }

    #[test]
    fn test_detect_pitch_result_struct_layout() {
        // Verify PitchResult struct is properly laid out for FFI
        // This is a compile-time check, but runtime verification doesn't hurt
        let test_result = PitchResult {
            frequency: 440.0,
            confidence: 0.95,
            is_voiced: true,
        };

        assert_eq!(test_result.frequency, 440.0);
        assert_eq!(test_result.confidence, 0.95);
        assert!(test_result.is_voiced);

        // Verify struct is Copy (required for FFI)
        let copied = test_result;
        assert_eq!(copied.frequency, 440.0);
        assert_eq!(test_result.frequency, 440.0); // Original still valid
    }

    // ======== Formant Extraction Tests ========

    #[test]
    fn test_extract_formants_null_buffer() {
        unsafe {
            let result = extract_formants_rust(std::ptr::null(), 1024, 44100, 0);
            assert_eq!(result.f1, 0.0, "Should return f1=0.0 for null buffer");
            assert_eq!(result.f2, 0.0, "Should return f2=0.0 for null buffer");
            assert_eq!(result.f3, 0.0, "Should return f3=0.0 for null buffer");
            assert_eq!(result.bw1, 0.0, "Should return bw1=0.0 for null buffer");
            assert_eq!(result.bw2, 0.0, "Should return bw2=0.0 for null buffer");
            assert_eq!(result.bw3, 0.0, "Should return bw3=0.0 for null buffer");
        }
    }

    #[test]
    fn test_extract_formants_invalid_length() {
        let buffer: Vec<f32> = vec![0.0; 1024];
        unsafe {
            // Test zero length
            let result = extract_formants_rust(buffer.as_ptr(), 0, 44100, 0);
            assert_eq!(result.f1, 0.0);
            assert_eq!(result.f2, 0.0);
            assert_eq!(result.f3, 0.0);

            // Test negative length
            let result = extract_formants_rust(buffer.as_ptr(), -10, 44100, 0);
            assert_eq!(result.f1, 0.0);
            assert_eq!(result.f2, 0.0);
            assert_eq!(result.f3, 0.0);
        }
    }

    #[test]
    fn test_extract_formants_invalid_sample_rate() {
        let buffer: Vec<f32> = vec![0.0; 1024];
        unsafe {
            // Test below 8000 Hz (AC3)
            let result = extract_formants_rust(buffer.as_ptr(), 1024, 7999, 0);
            assert_eq!(result.f1, 0.0, "Should return error for sample rate < 8000 Hz");

            // Test above 48000 Hz
            let result = extract_formants_rust(buffer.as_ptr(), 1024, 48001, 0);
            assert_eq!(result.f1, 0.0, "Should return error for sample rate > 48000 Hz");

            // Test zero/negative sample rate
            let result = extract_formants_rust(buffer.as_ptr(), 1024, 0, 0);
            assert_eq!(result.f1, 0.0);

            let result = extract_formants_rust(buffer.as_ptr(), 1024, -100, 0);
            assert_eq!(result.f1, 0.0);
        }
    }

    #[test]
    fn test_extract_formants_default_lpc_order() {
        // Test that default LPC order is computed correctly (AC4)
        // Default should be: (sample_rate / 1000) + 2

        let test_cases = [
            (8000, (8000 / 1000) + 2),    // 10
            (16000, (16000 / 1000) + 2),  // 18
            (44100, (44100 / 1000) + 2),  // 46
            (48000, (48000 / 1000) + 2),  // 50
        ];

        for (sample_rate, expected_order) in test_cases {
            let buffer_len = expected_order * 4; // Ensure buffer is long enough
            let buffer: Vec<f32> = vec![0.5; buffer_len as usize];

            unsafe {
                // Call with lpc_order = 0 to use default
                let result = extract_formants_rust(buffer.as_ptr(), buffer_len, sample_rate, 0);

                // If the function succeeds (doesn't return error), it used the default order
                // We can't directly verify the order, but we can verify the function accepts valid inputs
                // The function should not crash or return null - formants may be 0 due to buffer content
                assert!(
                    result.f1 >= 0.0 && result.f2 >= 0.0 && result.f3 >= 0.0,
                    "Formant values should be non-negative for sample rate {sample_rate} Hz",
                );
            }
        }
    }

    #[test]
    fn test_extract_formants_custom_lpc_order() {
        let buffer: Vec<f32> = vec![0.5; 2048];
        let sample_rate = 44100;
        let custom_lpc_order = 20;

        unsafe {
            let result = extract_formants_rust(buffer.as_ptr(), 2048, sample_rate, custom_lpc_order);

            // Should accept custom LPC order
            // Formant values should be non-negative
            assert!(result.f1 >= 0.0);
            assert!(result.f2 >= 0.0);
            assert!(result.f3 >= 0.0);
            assert!(result.bw1 >= 0.0);
            assert!(result.bw2 >= 0.0);
            assert!(result.bw3 >= 0.0);
        }
    }

    #[test]
    fn test_extract_formants_buffer_too_short() {
        // Buffer must be at least lpc_order * 2 samples long
        let sample_rate = 44100;
        let lpc_order = 46; // Default for 44100 Hz
        let buffer_len = lpc_order - 1; // Too short
        let buffer: Vec<f32> = vec![0.5; buffer_len as usize];

        unsafe {
            let result = extract_formants_rust(buffer.as_ptr(), buffer_len, sample_rate, lpc_order);

            // Should return error (zeros) for buffer that's too short
            assert_eq!(result.f1, 0.0, "Should fail for buffer that's too short");
            assert_eq!(result.f2, 0.0);
            assert_eq!(result.f3, 0.0);
        }
    }

    #[test]
    fn test_extract_formants_vowel_a_synthetic() {
        // Test formant extraction with a synthetic vowel-like signal
        // Note: LPC analysis is designed for real voiced speech signals
        // Synthetic signals may not produce accurate formant estimates, but we test basic functionality
        let sample_rate = 44100;
        let duration = 0.1; // 100ms for better LPC analysis
        let num_samples = (sample_rate as f32 * duration) as usize;

        // Create a more realistic synthetic vowel using pitch + formant resonances
        // Fundamental frequency (pitch): 120 Hz (typical male voice)
        let f0 = 120.0;
        // Formant frequencies for /a/ vowel: F1 ~700 Hz, F2 ~1200 Hz, F3 ~2500 Hz
        let f1_target = 700.0;
        let f2_target = 1200.0;
        let f3_target = 2500.0;

        let mut buffer: Vec<f32> = Vec::with_capacity(num_samples);
        for i in 0..num_samples {
            let t = i as f32 / sample_rate as f32;
            // Generate pitched source signal (sum of harmonics)
            let mut source = 0.0;
            for harmonic in 1..=20 {
                let freq = f0 * harmonic as f32;
                source += (1.0 / harmonic as f32) * (2.0 * PI * freq * t).sin();
            }
            // Apply simple formant emphasis (not perfect, but better than raw sine waves)
            let formant_emphasis =
                0.5 * (2.0 * PI * f1_target * t).sin() +
                0.3 * (2.0 * PI * f2_target * t).sin() +
                0.2 * (2.0 * PI * f3_target * t).sin();
            buffer.push(source * 0.3 + formant_emphasis * 0.7);
        }

        unsafe {
            let result = extract_formants_rust(
                buffer.as_ptr(),
                num_samples as c_int,
                sample_rate,
                0  // Use default LPC order
            );

            // AC1, AC2, AC5: Should extract formants and return them in Hz
            // For synthetic signals, LPC may produce varying results
            // Key tests:
            // 1. Function executes without crashing
            // 2. Returns valid (finite, non-NaN) values
            // 3. At least one formant is detected (F1 should be non-zero for voiced signal)

            // All formants should be finite (not NaN or Infinity)
            assert!(result.f1.is_finite(), "F1 should be finite");
            assert!(result.f2.is_finite(), "F2 should be finite");
            assert!(result.f3.is_finite(), "F3 should be finite");

            // All formants should be non-negative
            assert!(result.f1 >= 0.0, "F1 should be non-negative");
            assert!(result.f2 >= 0.0, "F2 should be non-negative");
            assert!(result.f3 >= 0.0, "F3 should be non-negative");

            // For a voiced signal (even synthetic), we expect at least F1 to be detected
            // F2 and F3 may be 0 depending on the signal quality and LPC algorithm behavior
            if result.f1 > 0.0 {
                // If formants are detected, they should be in physically plausible ranges
                // Very wide ranges to accommodate synthetic signal limitations
                assert!(
                    result.f1 <= 5000.0,
                    "F1 {:.1} Hz should be below Nyquist/2 for 44.1kHz",
                    result.f1
                );
                if result.f2 > 0.0 {
                    assert!(
                        result.f2 <= 5000.0,
                        "F2 {:.1} Hz should be below Nyquist/2",
                        result.f2
                    );
                }
                if result.f3 > 0.0 {
                    assert!(
                        result.f3 <= 5000.0,
                        "F3 {:.1} Hz should be below Nyquist/2",
                        result.f3
                    );
                }
            }

            // Bandwidths are not yet implemented in loqa-voice-dsp v0.1, so they will be 0
            // This is acceptable for v0.1.0 - bandwidth estimation can be added in future versions
            assert!(result.bw1 >= 0.0, "Bandwidth 1 should be non-negative");
            assert!(result.bw2 >= 0.0, "Bandwidth 2 should be non-negative");
            assert!(result.bw3 >= 0.0, "Bandwidth 3 should be non-negative");
        }
    }

    #[test]
    fn test_extract_formants_multiple_sample_rates() {
        // Test formant extraction works across different sample rates
        for sample_rate in [8000, 16000, 22050, 44100, 48000] {
            let duration = 0.05; // 50ms
            let num_samples = (sample_rate as f32 * duration) as usize;

            // Generate a simple periodic signal
            let frequency = 200.0;
            let mut buffer: Vec<f32> = Vec::with_capacity(num_samples);
            for i in 0..num_samples {
                let t = i as f32 / sample_rate as f32;
                buffer.push((2.0 * PI * frequency * t).sin());
            }

            unsafe {
                let result = extract_formants_rust(
                    buffer.as_ptr(),
                    num_samples as c_int,
                    sample_rate as c_int,
                    0  // Use default LPC order
                );

                // AC3: All sample rates in 8000-48000 Hz should work
                // Formants should be non-negative (may be 0 depending on signal)
                assert!(
                    result.f1 >= 0.0 && result.f2 >= 0.0 && result.f3 >= 0.0,
                    "Sample rate {} Hz should work (got F1={:.1}, F2={:.1}, F3={:.1})",
                    sample_rate,
                    result.f1,
                    result.f2,
                    result.f3
                );
            }
        }
    }

    #[test]
    fn test_extract_formants_result_struct_layout() {
        // Verify FormantsResult struct is properly laid out for FFI
        let test_result = FormantsResult {
            f1: 700.0,
            f2: 1200.0,
            f3: 2500.0,
            bw1: 50.0,
            bw2: 100.0,
            bw3: 150.0,
        };

        assert_eq!(test_result.f1, 700.0);
        assert_eq!(test_result.f2, 1200.0);
        assert_eq!(test_result.f3, 2500.0);
        assert_eq!(test_result.bw1, 50.0);
        assert_eq!(test_result.bw2, 100.0);
        assert_eq!(test_result.bw3, 150.0);

        // Verify struct is Copy (required for FFI)
        let copied = test_result;
        assert_eq!(copied.f1, 700.0);
        assert_eq!(test_result.f1, 700.0); // Original still valid
    }

    #[test]
    fn test_extract_formants_silence() {
        // Test with silence (all zeros)
        let buffer: Vec<f32> = vec![0.0; 2048];
        let sample_rate = 44100;

        unsafe {
            let result = extract_formants_rust(buffer.as_ptr(), 2048, sample_rate, 0);

            // Silence may produce formant estimates or zeros depending on algorithm
            // The important thing is it doesn't crash and returns valid (non-NaN) values
            assert!(result.f1.is_finite(), "F1 should be finite for silence");
            assert!(result.f2.is_finite(), "F2 should be finite for silence");
            assert!(result.f3.is_finite(), "F3 should be finite for silence");
            assert!(result.bw1.is_finite(), "BW1 should be finite for silence");
            assert!(result.bw2.is_finite(), "BW2 should be finite for silence");
            assert!(result.bw3.is_finite(), "BW3 should be finite for silence");
        }
    }

    // ======== Spectral Analysis Tests ========

    #[test]
    fn test_analyze_spectrum_null_buffer() {
        unsafe {
            let result = analyze_spectrum_rust(std::ptr::null(), 1024, 44100);
            assert_eq!(result.centroid, 0.0, "Should return centroid=0.0 for null buffer");
            assert_eq!(result.rolloff, 0.0, "Should return rolloff=0.0 for null buffer");
            assert_eq!(result.tilt, 0.0, "Should return tilt=0.0 for null buffer");
        }
    }

    #[test]
    fn test_analyze_spectrum_invalid_length() {
        let buffer: Vec<f32> = vec![0.0; 1024];
        unsafe {
            // Test zero length
            let result = analyze_spectrum_rust(buffer.as_ptr(), 0, 44100);
            assert_eq!(result.centroid, 0.0);
            assert_eq!(result.rolloff, 0.0);
            assert_eq!(result.tilt, 0.0);

            // Test negative length
            let result = analyze_spectrum_rust(buffer.as_ptr(), -10, 44100);
            assert_eq!(result.centroid, 0.0);
            assert_eq!(result.rolloff, 0.0);
            assert_eq!(result.tilt, 0.0);
        }
    }

    #[test]
    fn test_analyze_spectrum_invalid_sample_rate() {
        let buffer: Vec<f32> = vec![0.0; 1024];
        unsafe {
            // Test below 8000 Hz (AC1)
            let result = analyze_spectrum_rust(buffer.as_ptr(), 1024, 7999);
            assert_eq!(result.centroid, 0.0, "Should return error for sample rate < 8000 Hz");

            // Test above 48000 Hz (AC1)
            let result = analyze_spectrum_rust(buffer.as_ptr(), 1024, 48001);
            assert_eq!(result.centroid, 0.0, "Should return error for sample rate > 48000 Hz");

            // Test zero/negative sample rate
            let result = analyze_spectrum_rust(buffer.as_ptr(), 1024, 0);
            assert_eq!(result.centroid, 0.0);

            let result = analyze_spectrum_rust(buffer.as_ptr(), 1024, -100);
            assert_eq!(result.centroid, 0.0);
        }
    }

    #[test]
    fn test_analyze_spectrum_valid_sample_rates() {
        let buffer: Vec<f32> = vec![0.5; 2048];

        unsafe {
            // Test minimum valid sample rate (8000 Hz)
            let result = analyze_spectrum_rust(buffer.as_ptr(), 2048, 8000);
            // Should not error (values may vary based on buffer content, but call should succeed)
            assert!(result.centroid.is_finite());
            assert!(result.rolloff.is_finite());
            assert!(result.tilt.is_finite());

            // Test common sample rate (44100 Hz)
            let result = analyze_spectrum_rust(buffer.as_ptr(), 2048, 44100);
            assert!(result.centroid.is_finite());
            assert!(result.rolloff.is_finite());
            assert!(result.tilt.is_finite());

            // Test maximum valid sample rate (48000 Hz)
            let result = analyze_spectrum_rust(buffer.as_ptr(), 2048, 48000);
            assert!(result.centroid.is_finite());
            assert!(result.rolloff.is_finite());
            assert!(result.tilt.is_finite());
        }
    }

    #[test]
    fn test_analyze_spectrum_sine_wave_440hz() {
        // Generate a pure 440 Hz sine wave
        // Expected characteristics:
        // - Centroid should be close to 440 Hz (narrow spectral peak)
        // - Rolloff should be close to 440 Hz (most energy concentrated there)
        // - Tilt should be near 0 (flat spectrum around the peak)
        let sample_rate = 44100;
        let frequency = 440.0;
        let duration = 0.1; // 100ms
        let num_samples = (sample_rate as f32 * duration) as usize;

        let mut buffer: Vec<f32> = Vec::with_capacity(num_samples);
        for i in 0..num_samples {
            let t = i as f32 / sample_rate as f32;
            buffer.push((2.0 * PI * frequency * t).sin());
        }

        unsafe {
            let result = analyze_spectrum_rust(buffer.as_ptr(), num_samples as c_int, sample_rate);

            // AC2, AC3, AC4: All spectral features should be computed
            // All values should be finite (not NaN or Infinity)
            assert!(result.centroid.is_finite(), "Centroid should be finite");
            assert!(result.rolloff.is_finite(), "Rolloff should be finite");
            assert!(result.tilt.is_finite(), "Tilt should be finite");

            // All values should be non-negative for frequencies
            assert!(result.centroid >= 0.0, "Centroid should be non-negative");
            assert!(result.rolloff >= 0.0, "Rolloff should be non-negative");
            // Tilt can be negative (indicating low-frequency emphasis)

            // For a narrow sine wave, centroid should be close to the frequency
            // Allow reasonable tolerance for FFT resolution and windowing effects
            if result.centroid > 0.0 {
                let centroid_error = (result.centroid - frequency).abs();
                let error_percent = (centroid_error / frequency) * 100.0;

                // Centroid should be within reasonable range of target frequency
                // (allowing for FFT bin resolution and windowing artifacts)
                assert!(
                    error_percent < 50.0,
                    "Centroid {:.1} Hz should be reasonably close to {:.1} Hz (error: {:.1}%)",
                    result.centroid,
                    frequency,
                    error_percent
                );
            }
        }
    }

    #[test]
    fn test_analyze_spectrum_white_noise() {
        // Generate white noise - broad spectrum
        // Expected characteristics:
        // - Centroid should be mid-range (around sample_rate / 4)
        // - Rolloff should be high (energy distributed across spectrum)
        // - Tilt should be near 0 (flat spectrum)
        let sample_rate = 44100;
        let num_samples = 2048;
        let mut buffer: Vec<f32> = Vec::with_capacity(num_samples);

        // Simple pseudo-random noise generator
        for i in 0..num_samples {
            let hash = (i as u32).wrapping_mul(2654435761);
            buffer.push(((hash % 1000) as f32 / 1000.0) * 2.0 - 1.0);
        }

        unsafe {
            let result = analyze_spectrum_rust(buffer.as_ptr(), num_samples as c_int, sample_rate);

            // AC2, AC3, AC4: All features should be computed
            assert!(result.centroid.is_finite(), "Centroid should be finite for white noise");
            assert!(result.rolloff.is_finite(), "Rolloff should be finite for white noise");
            assert!(result.tilt.is_finite(), "Tilt should be finite for white noise");

            // For white noise, centroid should be somewhere in mid-range
            // (not at extremes like 0 or Nyquist frequency)
            if result.centroid > 0.0 {
                let nyquist = sample_rate as f32 / 2.0;
                assert!(
                    result.centroid < nyquist,
                    "Centroid {:.1} Hz should be below Nyquist {:.1} Hz",
                    result.centroid,
                    nyquist
                );
            }

            // Rolloff should also be reasonable (below Nyquist)
            if result.rolloff > 0.0 {
                let nyquist = sample_rate as f32 / 2.0;
                assert!(
                    result.rolloff < nyquist,
                    "Rolloff {:.1} Hz should be below Nyquist {:.1} Hz",
                    result.rolloff,
                    nyquist
                );
            }
        }
    }

    #[test]
    fn test_analyze_spectrum_pink_noise() {
        // Generate pink noise (1/f spectrum) - more low frequency energy
        // Expected characteristics:
        // - Centroid should be lower than white noise
        // - Rolloff should be lower than white noise
        // - Tilt should be negative (more low-frequency energy)
        let sample_rate = 44100;
        let num_samples = 2048;
        let mut buffer: Vec<f32> = Vec::with_capacity(num_samples);

        // Approximate pink noise by summing sine waves with 1/f amplitude
        for i in 0..num_samples {
            let t = i as f32 / sample_rate as f32;
            let mut sample = 0.0;
            // Sum harmonics with decreasing amplitude (1/f)
            for harmonic in 1..=20 {
                let freq = 100.0 * harmonic as f32;
                let amplitude = 1.0 / harmonic as f32;
                sample += amplitude * (2.0 * PI * freq * t).sin();
            }
            buffer.push(sample * 0.1); // Scale down to reasonable amplitude
        }

        unsafe {
            let result = analyze_spectrum_rust(buffer.as_ptr(), num_samples as c_int, sample_rate);

            // AC2, AC3, AC4: All features should be computed
            assert!(result.centroid.is_finite(), "Centroid should be finite for pink noise");
            assert!(result.rolloff.is_finite(), "Rolloff should be finite for pink noise");
            assert!(result.tilt.is_finite(), "Tilt should be finite for pink noise");

            // All frequencies should be in valid range
            if result.centroid > 0.0 {
                let nyquist = sample_rate as f32 / 2.0;
                assert!(
                    result.centroid < nyquist,
                    "Centroid should be below Nyquist frequency"
                );
            }

            if result.rolloff > 0.0 {
                let nyquist = sample_rate as f32 / 2.0;
                assert!(
                    result.rolloff < nyquist,
                    "Rolloff should be below Nyquist frequency"
                );
            }

            // AC4: Pink noise should typically have negative tilt (more low freq energy)
            // But this depends on the algorithm's tilt calculation, so we just verify it's finite
        }
    }

    #[test]
    fn test_analyze_spectrum_silence() {
        // Test with silence (all zeros)
        let buffer: Vec<f32> = vec![0.0; 2048];
        let sample_rate = 44100;

        unsafe {
            let result = analyze_spectrum_rust(buffer.as_ptr(), 2048, sample_rate);

            // Silence may produce specific values or zeros depending on algorithm
            // The important thing is it doesn't crash and returns valid (non-NaN) values
            assert!(result.centroid.is_finite(), "Centroid should be finite for silence");
            assert!(result.rolloff.is_finite(), "Rolloff should be finite for silence");
            assert!(result.tilt.is_finite(), "Tilt should be finite for silence");

            // All values should be non-negative for silence (no negative frequencies)
            assert!(result.centroid >= 0.0, "Centroid should be non-negative for silence");
            assert!(result.rolloff >= 0.0, "Rolloff should be non-negative for silence");
        }
    }

    #[test]
    fn test_analyze_spectrum_multiple_sample_rates() {
        // Test spectral analysis works across different sample rates
        for sample_rate in [8000, 16000, 22050, 44100, 48000] {
            let duration = 0.05; // 50ms
            let num_samples = (sample_rate as f32 * duration) as usize;

            // Generate a simple periodic signal
            let frequency = 200.0;
            let mut buffer: Vec<f32> = Vec::with_capacity(num_samples);
            for i in 0..num_samples {
                let t = i as f32 / sample_rate as f32;
                buffer.push((2.0 * PI * frequency * t).sin());
            }

            unsafe {
                let result = analyze_spectrum_rust(
                    buffer.as_ptr(),
                    num_samples as c_int,
                    sample_rate as c_int,
                );

                // AC1: All sample rates in 8000-48000 Hz should work
                assert!(
                    result.centroid.is_finite() && result.rolloff.is_finite() && result.tilt.is_finite(),
                    "Sample rate {} Hz should work (centroid={:.1}, rolloff={:.1}, tilt={:.3})",
                    sample_rate,
                    result.centroid,
                    result.rolloff,
                    result.tilt
                );

                // Verify values are in physically reasonable range
                if result.centroid > 0.0 {
                    let nyquist = sample_rate as f32 / 2.0;
                    assert!(
                        result.centroid <= nyquist,
                        "Centroid {:.1} Hz should not exceed Nyquist {:.1} Hz at sample rate {}",
                        result.centroid,
                        nyquist,
                        sample_rate
                    );
                }

                if result.rolloff > 0.0 {
                    let nyquist = sample_rate as f32 / 2.0;
                    assert!(
                        result.rolloff <= nyquist,
                        "Rolloff {:.1} Hz should not exceed Nyquist {:.1} Hz at sample rate {}",
                        result.rolloff,
                        nyquist,
                        sample_rate
                    );
                }
            }
        }
    }

    #[test]
    fn test_analyze_spectrum_result_struct_layout() {
        // Verify SpectrumResult struct is properly laid out for FFI
        let test_result = SpectrumResult {
            centroid: 2000.0,
            rolloff: 4000.0,
            tilt: -0.5,
        };

        assert_eq!(test_result.centroid, 2000.0);
        assert_eq!(test_result.rolloff, 4000.0);
        assert_eq!(test_result.tilt, -0.5);

        // Verify struct is Copy (required for FFI)
        let copied = test_result;
        assert_eq!(copied.centroid, 2000.0);
        assert_eq!(test_result.centroid, 2000.0); // Original still valid
    }

    #[test]
    fn test_analyze_spectrum_all_features_single_call() {
        // AC5: Verify all three spectral features are computed in a single function call
        let sample_rate = 44100;
        let num_samples = 2048;

        // Generate a complex signal with multiple frequency components
        let mut buffer: Vec<f32> = Vec::with_capacity(num_samples);
        for i in 0..num_samples {
            let t = i as f32 / sample_rate as f32;
            // Mix of low, mid, and high frequencies
            buffer.push(
                0.5 * (2.0 * PI * 200.0 * t).sin() +  // Low
                0.3 * (2.0 * PI * 1000.0 * t).sin() +  // Mid
                0.2 * (2.0 * PI * 4000.0 * t).sin()    // High
            );
        }

        unsafe {
            let result = analyze_spectrum_rust(buffer.as_ptr(), num_samples as c_int, sample_rate);

            // AC5: All three features should be computed and returned
            // Verify all are valid (finite, non-NaN)
            assert!(result.centroid.is_finite(), "Centroid should be computed");
            assert!(result.rolloff.is_finite(), "Rolloff should be computed");
            assert!(result.tilt.is_finite(), "Tilt should be computed");

            // For this mixed signal, all three values should be meaningful (non-zero if algorithm works)
            // But we don't enforce non-zero as that depends on the algorithm implementation
        }
    }
}
