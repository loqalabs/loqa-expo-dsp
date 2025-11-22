import { describe, it, expect } from '@jest/globals';

import { ValidationError } from '../src/errors';
import { validateAudioBuffer, validateSampleRate, validateFFTSize } from '../src/validation';

describe('validateAudioBuffer', () => {
  describe('valid inputs', () => {
    it('should pass for valid Float32Array', () => {
      const buffer = new Float32Array(1024);
      expect(() => validateAudioBuffer(buffer)).not.toThrow();
    });

    it('should pass for valid number array', () => {
      const buffer = [0.1, 0.2, 0.3, 0.4];
      expect(() => validateAudioBuffer(buffer)).not.toThrow();
    });

    it('should pass for buffer with exactly 16384 samples (max size)', () => {
      const buffer = new Float32Array(16384);
      expect(() => validateAudioBuffer(buffer)).not.toThrow();
    });

    it('should pass for buffer with negative values', () => {
      const buffer = new Float32Array([-0.5, -0.2, 0.3, 0.8]);
      expect(() => validateAudioBuffer(buffer)).not.toThrow();
    });

    it('should pass for buffer with zero values', () => {
      const buffer = new Float32Array([0, 0, 0, 0]);
      expect(() => validateAudioBuffer(buffer)).not.toThrow();
    });
  });

  describe('invalid inputs', () => {
    it('should throw ValidationError for null buffer', () => {
      expect(() => validateAudioBuffer(null as any)).toThrow(ValidationError);
      expect(() => validateAudioBuffer(null as any)).toThrow(
        'Audio buffer cannot be null or undefined'
      );
    });

    it('should throw ValidationError for undefined buffer', () => {
      expect(() => validateAudioBuffer(undefined as any)).toThrow(ValidationError);
    });

    it('should throw ValidationError for empty buffer', () => {
      const buffer = new Float32Array(0);
      expect(() => validateAudioBuffer(buffer)).toThrow(ValidationError);
      expect(() => validateAudioBuffer(buffer)).toThrow('Audio buffer cannot be empty');
    });

    it('should throw ValidationError for buffer exceeding 16384 samples', () => {
      const buffer = new Float32Array(16385);
      expect(() => validateAudioBuffer(buffer)).toThrow(ValidationError);
      expect(() => validateAudioBuffer(buffer)).toThrow('Buffer too large (max 16384 samples)');
    });

    it('should include buffer length in error details for oversized buffer', () => {
      const buffer = new Float32Array(20000);
      try {
        validateAudioBuffer(buffer);
        fail('Expected ValidationError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).details).toEqual({
          bufferLength: 20000,
          maxLength: 16384,
        });
      }
    });

    it('should throw ValidationError for buffer with NaN values', () => {
      const buffer = new Float32Array([0.1, 0.2, NaN, 0.4]);
      expect(() => validateAudioBuffer(buffer)).toThrow(ValidationError);
      expect(() => validateAudioBuffer(buffer)).toThrow('Buffer contains NaN or Infinity values');
    });

    it('should throw ValidationError for buffer with Infinity values', () => {
      const buffer = new Float32Array([0.1, 0.2, Infinity, 0.4]);
      expect(() => validateAudioBuffer(buffer)).toThrow(ValidationError);
    });

    it('should throw ValidationError for buffer with negative Infinity', () => {
      const buffer = new Float32Array([0.1, 0.2, -Infinity, 0.4]);
      expect(() => validateAudioBuffer(buffer)).toThrow(ValidationError);
    });

    it('should throw ValidationError for number array with NaN', () => {
      const buffer = [0.1, 0.2, NaN, 0.4];
      expect(() => validateAudioBuffer(buffer)).toThrow(ValidationError);
    });
  });
});

describe('validateSampleRate', () => {
  describe('valid inputs', () => {
    it('should pass for 44100 Hz (standard rate)', () => {
      expect(() => validateSampleRate(44100)).not.toThrow();
    });

    it('should pass for 8000 Hz (minimum)', () => {
      expect(() => validateSampleRate(8000)).not.toThrow();
    });

    it('should pass for 48000 Hz (maximum)', () => {
      expect(() => validateSampleRate(48000)).not.toThrow();
    });

    it('should pass for 16000 Hz', () => {
      expect(() => validateSampleRate(16000)).not.toThrow();
    });

    it('should pass for 22050 Hz', () => {
      expect(() => validateSampleRate(22050)).not.toThrow();
    });
  });

  describe('invalid inputs', () => {
    it('should throw ValidationError for non-integer sample rate', () => {
      expect(() => validateSampleRate(44100.5)).toThrow(ValidationError);
      expect(() => validateSampleRate(44100.5)).toThrow('Sample rate must be an integer');
    });

    it('should throw ValidationError for sample rate below 8000 Hz', () => {
      expect(() => validateSampleRate(7999)).toThrow(ValidationError);
      expect(() => validateSampleRate(7999)).toThrow(
        'Sample rate must be between 8000 and 48000 Hz'
      );
    });

    it('should throw ValidationError for sample rate above 48000 Hz', () => {
      expect(() => validateSampleRate(48001)).toThrow(ValidationError);
      expect(() => validateSampleRate(96000)).toThrow(ValidationError);
    });

    it('should include sample rate in error details for out of range', () => {
      try {
        validateSampleRate(96000);
        fail('Expected ValidationError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).details).toEqual({
          sampleRate: 96000,
          minSampleRate: 8000,
          maxSampleRate: 48000,
        });
      }
    });

    it('should throw ValidationError for negative sample rate', () => {
      expect(() => validateSampleRate(-44100)).toThrow(ValidationError);
    });

    it('should throw ValidationError for zero sample rate', () => {
      expect(() => validateSampleRate(0)).toThrow(ValidationError);
    });
  });
});

describe('validateFFTSize', () => {
  describe('valid inputs', () => {
    it('should pass for 256 (minimum power of 2)', () => {
      expect(() => validateFFTSize(256)).not.toThrow();
    });

    it('should pass for 512', () => {
      expect(() => validateFFTSize(512)).not.toThrow();
    });

    it('should pass for 1024 (common size)', () => {
      expect(() => validateFFTSize(1024)).not.toThrow();
    });

    it('should pass for 2048', () => {
      expect(() => validateFFTSize(2048)).not.toThrow();
    });

    it('should pass for 4096', () => {
      expect(() => validateFFTSize(4096)).not.toThrow();
    });

    it('should pass for 8192 (maximum)', () => {
      expect(() => validateFFTSize(8192)).not.toThrow();
    });
  });

  describe('invalid inputs', () => {
    it('should throw ValidationError for non-integer FFT size', () => {
      expect(() => validateFFTSize(1024.5)).toThrow(ValidationError);
      expect(() => validateFFTSize(1024.5)).toThrow('FFT size must be an integer');
    });

    it('should throw ValidationError for non-power-of-2 FFT size', () => {
      expect(() => validateFFTSize(1000)).toThrow(ValidationError);
      expect(() => validateFFTSize(1000)).toThrow('FFT size must be a power of 2');
    });

    it('should throw ValidationError for 500 (not power of 2)', () => {
      expect(() => validateFFTSize(500)).toThrow(ValidationError);
    });

    it('should throw ValidationError for FFT size below 256', () => {
      expect(() => validateFFTSize(128)).toThrow(ValidationError);
      expect(() => validateFFTSize(128)).toThrow('FFT size must be between 256 and 8192');
    });

    it('should throw ValidationError for FFT size above 8192', () => {
      expect(() => validateFFTSize(16384)).toThrow(ValidationError);
    });

    it('should include FFT size in error details for out of range', () => {
      try {
        validateFFTSize(16384);
        fail('Expected ValidationError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).details).toEqual({
          fftSize: 16384,
          minFFTSize: 256,
          maxFFTSize: 8192,
        });
      }
    });

    it('should throw ValidationError for zero FFT size', () => {
      expect(() => validateFFTSize(0)).toThrow(ValidationError);
      expect(() => validateFFTSize(0)).toThrow('FFT size must be a power of 2');
    });

    it('should throw ValidationError for negative FFT size', () => {
      expect(() => validateFFTSize(-1024)).toThrow(ValidationError);
    });

    it('should throw ValidationError for 1 (edge case)', () => {
      expect(() => validateFFTSize(1)).toThrow(ValidationError);
      expect(() => validateFFTSize(1)).toThrow('FFT size must be between 256 and 8192');
    });

    it('should throw ValidationError for 3 (not power of 2)', () => {
      expect(() => validateFFTSize(3)).toThrow(ValidationError);
    });
  });

  describe('power of 2 check correctness', () => {
    it('should correctly identify all powers of 2 from 256 to 8192', () => {
      const powersOf2 = [256, 512, 1024, 2048, 4096, 8192];
      powersOf2.forEach((size) => {
        expect(() => validateFFTSize(size)).not.toThrow();
      });
    });

    it('should correctly reject non-powers of 2 in valid range', () => {
      const nonPowersOf2 = [300, 500, 1000, 1500, 3000, 5000, 7000];
      nonPowersOf2.forEach((size) => {
        expect(() => validateFFTSize(size)).toThrow(ValidationError);
      });
    });
  });
});

describe('ValidationError details', () => {
  it('should include invalid value in error details for validateAudioBuffer', () => {
    const buffer = new Float32Array(20000);
    try {
      validateAudioBuffer(buffer);
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).code).toBe('VALIDATION_ERROR');
      expect((error as ValidationError).details).toBeDefined();
    }
  });

  it('should include expected range in error details for validateSampleRate', () => {
    try {
      validateSampleRate(100000);
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      const details = (error as ValidationError).details;
      expect(details?.minSampleRate).toBe(8000);
      expect(details?.maxSampleRate).toBe(48000);
    }
  });

  it('should include expected range in error details for validateFFTSize', () => {
    // Use 16384 which is a power of 2 but out of range
    try {
      validateFFTSize(16384);
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      const details = (error as ValidationError).details;
      expect(details?.minFFTSize).toBe(256);
      expect(details?.maxFFTSize).toBe(8192);
    }
  });
});
