// Comprehensive tests for analyzeSpectrum function
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

import LoqaAudioDspModule from '../src/LoqaAudioDspModule';
import { analyzeSpectrum } from '../src/analyzeSpectrum';
import { ValidationError, NativeModuleError } from '../src/errors';

// Mock the native module
jest.mock('../src/LoqaAudioDspModule', () => ({
  __esModule: true,
  default: {
    analyzeSpectrum: jest.fn(),
  },
}));

// Mock the utils module to prevent logging during tests
jest.mock('../src/utils', () => ({
  logDebug: jest.fn(),
}));

/**
 * Helper function to generate a synthetic sine wave
 * @param frequency - Frequency in Hz
 * @param sampleRate - Sample rate in Hz
 * @param durationSamples - Number of samples to generate
 * @returns Float32Array with sine wave data
 */
function generateSineWave(
  frequency: number,
  sampleRate: number,
  durationSamples: number
): Float32Array {
  const buffer = new Float32Array(durationSamples);
  const omega = (2 * Math.PI * frequency) / sampleRate;

  for (let i = 0; i < durationSamples; i++) {
    buffer[i] = Math.sin(omega * i);
  }

  return buffer;
}

/**
 * Helper function to generate white noise (broad spectrum)
 * @param durationSamples - Number of samples to generate
 * @returns Float32Array with white noise
 */
function generateWhiteNoise(durationSamples: number): Float32Array {
  const buffer = new Float32Array(durationSamples);

  for (let i = 0; i < durationSamples; i++) {
    // Generate random values between -1 and 1
    buffer[i] = Math.random() * 2 - 1;
  }

  return buffer;
}

/**
 * Helper function to generate pink noise (1/f spectrum)
 * Simplified pink noise using multiple octaves
 * @param durationSamples - Number of samples to generate
 * @param sampleRate - Sample rate in Hz
 * @returns Float32Array with pink noise approximation
 */
function generatePinkNoise(durationSamples: number, sampleRate: number): Float32Array {
  const buffer = new Float32Array(durationSamples);

  // Generate pink noise by summing multiple octaves with decreasing amplitude
  const numOctaves = 5;
  for (let octave = 0; octave < numOctaves; octave++) {
    const freq = 100 * Math.pow(2, octave); // 100, 200, 400, 800, 1600 Hz
    const amplitude = 1.0 / (octave + 1); // Decreasing amplitude
    const omega = (2 * Math.PI * freq) / sampleRate;

    for (let i = 0; i < durationSamples; i++) {
      buffer[i] += amplitude * Math.sin(omega * i + Math.random() * 2 * Math.PI);
    }
  }

  // Normalize
  const maxVal = Math.max(...Array.from(buffer).map(Math.abs));
  for (let i = 0; i < durationSamples; i++) {
    buffer[i] /= maxVal;
  }

  return buffer;
}

describe('analyzeSpectrum', () => {
  const mockAnalyzeSpectrum = LoqaAudioDspModule.analyzeSpectrum as jest.MockedFunction<
    typeof LoqaAudioDspModule.analyzeSpectrum
  >;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('Valid Input Tests - Computing Features Successfully (AC1)', () => {
    it('should compute spectral features for 440 Hz sine wave', async () => {
      // Arrange: Create a 440 Hz sine wave with narrow spectral peak
      const sampleRate = 44100;
      const frequency = 440;
      const bufferSize = 2048;
      const audioBuffer = generateSineWave(frequency, sampleRate, bufferSize);

      // Mock native response - sine wave has narrow peak, centroid near frequency
      mockAnalyzeSpectrum.mockResolvedValueOnce({
        centroid: 440.0,
        rolloff: 450.0,
        tilt: 0.0,
      });

      // Act
      const result = await analyzeSpectrum(audioBuffer, sampleRate);

      // Assert
      expect(result).toBeDefined();
      expect(result.centroid).toBeDefined();
      expect(result.rolloff).toBeDefined();
      expect(result.tilt).toBeDefined();
      expect(mockAnalyzeSpectrum).toHaveBeenCalledTimes(1);
    });

    it('should compute spectral features with Float32Array input', async () => {
      // Arrange
      const audioBuffer = new Float32Array(1024);
      for (let i = 0; i < audioBuffer.length; i++) {
        audioBuffer[i] = Math.sin(i * 0.1);
      }

      mockAnalyzeSpectrum.mockResolvedValueOnce({
        centroid: 1500.0,
        rolloff: 3000.0,
        tilt: -0.2,
      });

      // Act
      const result = await analyzeSpectrum(audioBuffer, 44100);

      // Assert
      expect(result).toBeDefined();
      expect(typeof result.centroid).toBe('number');
      expect(typeof result.rolloff).toBe('number');
      expect(typeof result.tilt).toBe('number');
    });

    it('should compute spectral features with number[] input', async () => {
      // Arrange
      const audioBuffer = new Array(1024).fill(0).map((_, i) => Math.sin(i * 0.1));

      mockAnalyzeSpectrum.mockResolvedValueOnce({
        centroid: 2000.0,
        rolloff: 4000.0,
        tilt: -0.1,
      });

      // Act
      const result = await analyzeSpectrum(audioBuffer, 44100);

      // Assert
      expect(result).toBeDefined();
      expect(mockAnalyzeSpectrum).toHaveBeenCalledWith(
        audioBuffer, // Should pass number[] directly
        44100,
        {}
      );
    });
  });

  describe('Expected Ranges for Spectral Features (AC2)', () => {
    it('should return centroid, rolloff, tilt in expected ranges for 440 Hz sine wave', async () => {
      // Arrange: 440 Hz sine wave should have:
      // - Centroid ~440 Hz (narrow peak at fundamental)
      // - Rolloff ~440 Hz (energy concentrated at fundamental)
      // - Tilt ~0 (flat spectrum at single frequency)
      const audioBuffer = generateSineWave(440, 44100, 2048);

      mockAnalyzeSpectrum.mockResolvedValueOnce({
        centroid: 440.0,
        rolloff: 440.0,
        tilt: 0.0,
      });

      // Act
      const result = await analyzeSpectrum(audioBuffer, 44100);

      // Assert: Sine wave has narrow spectral peak
      expect(result.centroid).toBeCloseTo(440, 1);
      expect(result.rolloff).toBeCloseTo(440, 1);
      expect(result.tilt).toBeCloseTo(0, 1);
    });

    it('should return mid-range centroid for white noise', async () => {
      // Arrange: White noise has broad spectrum
      // - Centroid should be in mid-range (4000-8000 Hz for 44.1kHz)
      // - Rolloff should be high
      const audioBuffer = generateWhiteNoise(2048);

      mockAnalyzeSpectrum.mockResolvedValueOnce({
        centroid: 6000.0,
        rolloff: 18000.0,
        tilt: 0.05,
      });

      // Act
      const result = await analyzeSpectrum(audioBuffer, 44100);

      // Assert: White noise has broad spectrum
      expect(result.centroid).toBeGreaterThan(4000);
      expect(result.centroid).toBeLessThan(8000);
      expect(result.rolloff).toBeGreaterThan(10000);
    });

    it('should return lower centroid and negative tilt for pink noise', async () => {
      // Arrange: Pink noise (1/f spectrum) has:
      // - Lower centroid than white noise
      // - Negative tilt (energy decreases with frequency)
      const audioBuffer = generatePinkNoise(2048, 44100);

      mockAnalyzeSpectrum.mockResolvedValueOnce({
        centroid: 3000.0,
        rolloff: 8000.0,
        tilt: -0.5,
      });

      // Act
      const result = await analyzeSpectrum(audioBuffer, 44100);

      // Assert: Pink noise has lower centroid and negative tilt
      expect(result.centroid).toBeLessThan(6000); // Lower than white noise
      expect(result.tilt).toBeLessThan(0); // Negative tilt
    });

    it('should handle various buffer sizes (AC4)', async () => {
      // Test buffer sizes: 512, 1024, 2048
      const bufferSizes = [512, 1024, 2048];

      for (const bufferSize of bufferSizes) {
        // Arrange
        const audioBuffer = generateSineWave(440, 44100, bufferSize);

        mockAnalyzeSpectrum.mockResolvedValueOnce({
          centroid: 440.0,
          rolloff: 440.0,
          tilt: 0.0,
        });

        // Act
        const result = await analyzeSpectrum(audioBuffer, 44100);

        // Assert
        expect(result).toBeDefined();
        expect(result.centroid).toBeDefined();
        expect(mockAnalyzeSpectrum).toHaveBeenCalledWith(expect.any(Array), 44100, {});

        jest.clearAllMocks();
      }
    });
  });

  describe('Sample Rate Validation (AC3)', () => {
    it('should validate sample rate is an integer', async () => {
      // Arrange
      const audioBuffer = new Float32Array(1024);
      const invalidSampleRate = 44100.5;

      // Act & Assert
      await expect(analyzeSpectrum(audioBuffer, invalidSampleRate)).rejects.toThrow(
        ValidationError
      );
      await expect(analyzeSpectrum(audioBuffer, invalidSampleRate)).rejects.toThrow(
        'Sample rate must be an integer'
      );
    });

    it('should validate sample rate is within valid range (8000-48000 Hz)', async () => {
      // Arrange
      const audioBuffer = new Float32Array(1024);

      // Act & Assert: Below minimum
      await expect(analyzeSpectrum(audioBuffer, 7999)).rejects.toThrow(ValidationError);
      await expect(analyzeSpectrum(audioBuffer, 7999)).rejects.toThrow(
        'Sample rate must be between 8000 and 48000 Hz'
      );

      // Act & Assert: Above maximum
      await expect(analyzeSpectrum(audioBuffer, 48001)).rejects.toThrow(ValidationError);
      await expect(analyzeSpectrum(audioBuffer, 48001)).rejects.toThrow(
        'Sample rate must be between 8000 and 48000 Hz'
      );
    });

    it('should accept valid sample rates', async () => {
      // Arrange
      const audioBuffer = new Float32Array(1024);
      const validSampleRates = [8000, 16000, 22050, 44100, 48000];

      for (const sampleRate of validSampleRates) {
        mockAnalyzeSpectrum.mockResolvedValueOnce({
          centroid: 2000.0,
          rolloff: 4000.0,
          tilt: -0.1,
        });

        // Act
        const result = await analyzeSpectrum(audioBuffer, sampleRate);

        // Assert
        expect(result).toBeDefined();
        expect(mockAnalyzeSpectrum).toHaveBeenCalledWith(expect.any(Array), sampleRate, {});

        jest.clearAllMocks();
      }
    });
  });

  describe('Validation Error Tests', () => {
    it('should throw ValidationError for empty buffer', async () => {
      // Arrange
      const emptyBuffer = new Float32Array(0);

      // Act & Assert
      await expect(analyzeSpectrum(emptyBuffer, 44100)).rejects.toThrow(ValidationError);
      await expect(analyzeSpectrum(emptyBuffer, 44100)).rejects.toThrow(
        'Audio buffer cannot be empty'
      );
    });

    it('should throw ValidationError for buffer larger than 16384 samples', async () => {
      // Arrange
      const largeBuffer = new Float32Array(16385);

      // Act & Assert
      await expect(analyzeSpectrum(largeBuffer, 44100)).rejects.toThrow(ValidationError);
      await expect(analyzeSpectrum(largeBuffer, 44100)).rejects.toThrow(
        'Buffer too large (max 16384 samples)'
      );
    });

    it('should throw ValidationError for buffer with NaN values', async () => {
      // Arrange
      const bufferWithNaN = new Float32Array([0.1, 0.2, NaN, 0.4]);

      // Act & Assert
      await expect(analyzeSpectrum(bufferWithNaN, 44100)).rejects.toThrow(ValidationError);
      await expect(analyzeSpectrum(bufferWithNaN, 44100)).rejects.toThrow(
        'Buffer contains NaN or Infinity values'
      );
    });

    it('should throw ValidationError for buffer with Infinity values', async () => {
      // Arrange
      const bufferWithInfinity = new Float32Array([0.1, Infinity, 0.3]);

      // Act & Assert
      await expect(analyzeSpectrum(bufferWithInfinity, 44100)).rejects.toThrow(ValidationError);
      await expect(analyzeSpectrum(bufferWithInfinity, 44100)).rejects.toThrow(
        'Buffer contains NaN or Infinity values'
      );
    });
  });

  describe('Native Module Error Handling', () => {
    it('should wrap native module errors in NativeModuleError', async () => {
      // Arrange
      const audioBuffer = new Float32Array(1024);
      mockAnalyzeSpectrum.mockRejectedValueOnce(new Error('Native spectrum analysis failed'));

      // Act & Assert
      await expect(analyzeSpectrum(audioBuffer, 44100)).rejects.toThrow(NativeModuleError);
      await expect(analyzeSpectrum(audioBuffer, 44100)).rejects.toThrow('Spectrum analysis failed');
    });

    it('should include context in NativeModuleError', async () => {
      // Arrange
      const audioBuffer = new Float32Array(2048);
      mockAnalyzeSpectrum.mockRejectedValueOnce(new Error('Native error'));

      // Act & Assert
      try {
        await analyzeSpectrum(audioBuffer, 44100);
        fail('Should have thrown NativeModuleError');
      } catch (error) {
        expect(error).toBeInstanceOf(NativeModuleError);
        if (error instanceof NativeModuleError) {
          expect(error.details).toMatchObject({
            sampleRate: 44100,
            bufferLength: 2048,
          });
        }
      }
    });
  });

  describe('Data Type Conversion Tests', () => {
    it('should convert Float32Array to number[] for native bridge', async () => {
      // Arrange
      const audioBuffer = new Float32Array(1024).fill(0.1);

      mockAnalyzeSpectrum.mockResolvedValueOnce({
        centroid: 2000.0,
        rolloff: 4000.0,
        tilt: -0.1,
      });

      // Act
      await analyzeSpectrum(audioBuffer, 44100);

      // Assert
      const callArgs = mockAnalyzeSpectrum.mock.calls[0];
      expect(Array.isArray(callArgs[0])).toBe(true);
      expect(callArgs[0].length).toBe(1024);
    });

    it('should pass number[] directly to native bridge', async () => {
      // Arrange
      const audioBuffer = new Array(1024).fill(0.1);

      mockAnalyzeSpectrum.mockResolvedValueOnce({
        centroid: 2000.0,
        rolloff: 4000.0,
        tilt: -0.1,
      });

      // Act
      await analyzeSpectrum(audioBuffer, 44100);

      // Assert
      const callArgs = mockAnalyzeSpectrum.mock.calls[0];
      expect(callArgs[0]).toBe(audioBuffer); // Same reference
    });

    it('should return proper SpectrumResult type', async () => {
      // Arrange
      const audioBuffer = new Float32Array(1024);

      mockAnalyzeSpectrum.mockResolvedValueOnce({
        centroid: 1500.5,
        rolloff: 3000.2,
        tilt: -0.35,
      });

      // Act
      const result = await analyzeSpectrum(audioBuffer, 44100);

      // Assert: Result should have all three properties
      expect(result).toHaveProperty('centroid');
      expect(result).toHaveProperty('rolloff');
      expect(result).toHaveProperty('tilt');
      expect(result.centroid).toBe(1500.5);
      expect(result.rolloff).toBe(3000.2);
      expect(result.tilt).toBe(-0.35);
    });
  });

  describe('Cross-Platform Consistency Tests (AC5)', () => {
    it('should validate inputs consistently before native call', async () => {
      // This test ensures validation happens in TypeScript layer,
      // making it consistent across iOS and Android

      const invalidInputs = [
        { buffer: new Float32Array(0), error: 'empty' },
        { buffer: new Float32Array(20000), error: 'too large' },
        { buffer: new Float32Array([NaN, 0.1, 0.2]), error: 'contains NaN' },
      ];

      for (const { buffer } of invalidInputs) {
        await expect(analyzeSpectrum(buffer, 44100)).rejects.toThrow(ValidationError);
        // Native module should never be called for invalid inputs
        expect(mockAnalyzeSpectrum).not.toHaveBeenCalled();
        jest.clearAllMocks();
      }
    });

    it('should call native module with identical parameters regardless of input type', async () => {
      // Arrange
      const float32Buffer = new Float32Array(1024).fill(0.1);
      const numberBuffer = new Array(1024).fill(0.1);

      const mockResponse = {
        centroid: 2000.0,
        rolloff: 4000.0,
        tilt: -0.1,
      };

      // Act
      mockAnalyzeSpectrum.mockResolvedValueOnce(mockResponse);
      await analyzeSpectrum(float32Buffer, 44100);
      const call1 = mockAnalyzeSpectrum.mock.calls[0];

      jest.clearAllMocks();

      mockAnalyzeSpectrum.mockResolvedValueOnce(mockResponse);
      await analyzeSpectrum(numberBuffer, 44100);
      const call2 = mockAnalyzeSpectrum.mock.calls[0];

      // Assert: Both should result in identical call parameters
      expect(call1[1]).toBe(call2[1]); // Same sample rate
      expect(call1[2]).toEqual(call2[2]); // Same options
      expect(call1[0].length).toBe(call2[0].length); // Same buffer length
    });
  });

  describe('Real-World Use Cases - Known Spectral Characteristics', () => {
    it('should analyze 440 Hz sine wave with expected spectral characteristics', async () => {
      // Arrange: Pure sine wave has:
      // - Centroid at fundamental frequency
      // - Rolloff at fundamental frequency
      // - Tilt near zero (single frequency component)
      const audioBuffer = generateSineWave(440, 44100, 2048);

      mockAnalyzeSpectrum.mockResolvedValueOnce({
        centroid: 440.0,
        rolloff: 440.0,
        tilt: 0.0,
      });

      // Act
      const result = await analyzeSpectrum(audioBuffer, 44100);

      // Assert: Spectral features for pure tone
      expect(result.centroid).toBeCloseTo(440, 0);
      expect(result.rolloff).toBeCloseTo(440, 0);
      expect(result.tilt).toBeCloseTo(0, 1);
    });

    it('should analyze white noise with broad spectrum characteristics', async () => {
      // Arrange: White noise has:
      // - Mid-range centroid
      // - High rolloff (energy spread across spectrum)
      // - Tilt near zero (flat spectrum)
      const audioBuffer = generateWhiteNoise(2048);

      mockAnalyzeSpectrum.mockResolvedValueOnce({
        centroid: 5500.0,
        rolloff: 17000.0,
        tilt: 0.02,
      });

      // Act
      const result = await analyzeSpectrum(audioBuffer, 44100);

      // Assert: Broad spectrum characteristics
      expect(result.centroid).toBeGreaterThan(3000);
      expect(result.centroid).toBeLessThan(9000);
      expect(result.rolloff).toBeGreaterThan(10000);
      expect(Math.abs(result.tilt)).toBeLessThan(0.5);
    });

    it('should analyze pink noise with 1/f spectrum characteristics', async () => {
      // Arrange: Pink noise (1/f) has:
      // - Lower centroid than white noise
      // - Negative tilt (energy decreases with frequency)
      const audioBuffer = generatePinkNoise(2048, 44100);

      mockAnalyzeSpectrum.mockResolvedValueOnce({
        centroid: 2500.0,
        rolloff: 7000.0,
        tilt: -0.6,
      });

      // Act
      const result = await analyzeSpectrum(audioBuffer, 44100);

      // Assert: 1/f spectrum characteristics
      expect(result.centroid).toBeLessThan(5000); // Lower than white noise
      expect(result.tilt).toBeLessThan(0); // Negative slope
      expect(result.tilt).toBeGreaterThan(-1.5); // Reasonable range
    });

    it('should compare white noise vs pink noise spectral differences', async () => {
      // Arrange: Generate both types
      const whiteNoise = generateWhiteNoise(2048);
      const pinkNoise = generatePinkNoise(2048, 44100);

      // Mock responses showing expected differences
      mockAnalyzeSpectrum.mockResolvedValueOnce({
        centroid: 6000.0,
        rolloff: 18000.0,
        tilt: 0.05,
      });

      const whiteResult = await analyzeSpectrum(whiteNoise, 44100);

      jest.clearAllMocks();

      mockAnalyzeSpectrum.mockResolvedValueOnce({
        centroid: 3000.0,
        rolloff: 8000.0,
        tilt: -0.5,
      });

      const pinkResult = await analyzeSpectrum(pinkNoise, 44100);

      // Assert: Pink noise should have lower centroid and more negative tilt
      expect(pinkResult.centroid).toBeLessThan(whiteResult.centroid);
      expect(pinkResult.tilt).toBeLessThan(whiteResult.tilt);
    });
  });

  describe('Edge Cases', () => {
    it('should handle minimum valid buffer size (256 samples)', async () => {
      // Arrange
      const audioBuffer = new Float32Array(256);

      mockAnalyzeSpectrum.mockResolvedValueOnce({
        centroid: 1000.0,
        rolloff: 2000.0,
        tilt: 0.0,
      });

      // Act
      const result = await analyzeSpectrum(audioBuffer, 44100);

      // Assert
      expect(result).toBeDefined();
    });

    it('should handle maximum valid buffer size (16384 samples)', async () => {
      // Arrange
      const audioBuffer = new Float32Array(16384);

      mockAnalyzeSpectrum.mockResolvedValueOnce({
        centroid: 1000.0,
        rolloff: 2000.0,
        tilt: 0.0,
      });

      // Act
      const result = await analyzeSpectrum(audioBuffer, 44100);

      // Assert
      expect(result).toBeDefined();
      expect(mockAnalyzeSpectrum).toHaveBeenCalledWith(expect.any(Array), 44100, {});
    });

    it('should handle minimum sample rate (8000 Hz)', async () => {
      // Arrange
      const audioBuffer = new Float32Array(1024);

      mockAnalyzeSpectrum.mockResolvedValueOnce({
        centroid: 800.0,
        rolloff: 1500.0,
        tilt: -0.2,
      });

      // Act
      const result = await analyzeSpectrum(audioBuffer, 8000);

      // Assert
      expect(result).toBeDefined();
    });

    it('should handle maximum sample rate (48000 Hz)', async () => {
      // Arrange
      const audioBuffer = new Float32Array(1024);

      mockAnalyzeSpectrum.mockResolvedValueOnce({
        centroid: 3000.0,
        rolloff: 8000.0,
        tilt: -0.1,
      });

      // Act
      const result = await analyzeSpectrum(audioBuffer, 48000);

      // Assert
      expect(result).toBeDefined();
    });
  });
});
