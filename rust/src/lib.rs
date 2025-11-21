// FFI wrapper for loqa-voice-dsp crate
// Provides C-compatible exports for iOS (Swift FFI) and Android (Kotlin JNI)

use std::os::raw::c_float;

/// Placeholder FFI function for testing build infrastructure
/// This will be replaced with actual DSP function implementations in subsequent stories
#[no_mangle]
pub extern "C" fn test_ffi_bridge() -> i32 {
    42
}

/// Free memory allocated by Rust and returned to native code
/// CRITICAL: Must be called by Swift/Kotlin to prevent memory leaks
#[no_mangle]
pub extern "C" fn free_buffer(ptr: *mut c_float, len: usize) {
    if !ptr.is_null() {
        unsafe {
            let _ = Vec::from_raw_parts(ptr, len, len);
            // Vec will be dropped here, freeing the memory
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ffi_placeholder() {
        assert_eq!(test_ffi_bridge(), 42);
    }
}
