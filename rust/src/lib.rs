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
}
