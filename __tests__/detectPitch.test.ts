// Comprehensive tests for detectPitch function
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { detectPitch } from '../src/detectPitch';
import { ValidationError, NativeModuleError } from '../src/errors';

// Mock the native module
jest.mock('../src/LoqaAudioDspModule', () => ({
  __esModule: true,
  default: {
    detectPitch: jest.fn(),
  },
}));

// Mock the utils module to prevent logging during tests
jest.mock('../src/utils', () => ({
  logDebug: jest.fn(),
}));

import LoqaAudioDspModule from '../src/LoqaAudioDspModule';

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
 * Helper function to generate silence (all zeros)
 * @param durationSamples - Number of samples to generate
 * @returns Float32Array of zeros
 */
function generateSilence(durationSamples: number): Float32Array {
  return new Float32Array(durationSamples);
}

describe('detectPitch', () => {
  const mockDetectPitch = LoqaAudioDspModule.detectPitch as jest.MockedFunction<
    typeof LoqaAudioDspModule.detectPitch
  >;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('Valid Input Tests (AC2)', () => {
    it('should detect pitch from 440 Hz sine wave', async () => {
      // Arrange: Generate 440 Hz sine wave
      const sampleRate = 44100;
      const frequency = 440;
      const bufferSize = 2048;
      const audioBuffer = generateSineWave(frequency, sampleRate, bufferSize);

      // Mock native response for A4 (440 Hz)
      mockDetectPitch.mockResolvedValueOnce({
        frequency: 440.0,
        confidence: 0.95,
        isVoiced: true,
      });

      // Act
      const result = await detectPitch(audioBuffer, sampleRate);

      // Assert
      expect(result).toBeDefined();
      expect(result.frequency).toBeCloseTo(440, 1);
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.isVoiced).toBe(true);
      expect(mockDetectPitch).toHaveBeenCalledTimes(1);
    });

    it('should return high confidence for clean sine wave', async () => {
      // Arrange
      const audioBuffer = generateSineWave(220, 44100, 2048);

      mockDetectPitch.mockResolvedValueOnce({
        frequency: 220.0,
        confidence: 0.98,
        isVoiced: true,
      });

      // Act
      const result = await detectPitch(audioBuffer, 44100);

      // Assert
      expect(result.confidence).toBeGreaterThan(0.9);
      expect(result.confidence).toBeLessThanOrEqual(1.0);
    });

    it('should identify silence as unvoiced', async () => {
      // Arrange: Generate silence
      const audioBuffer = generateSilence(2048);

      mockDetectPitch.mockResolvedValueOnce({
        frequency: null,
        confidence: 0.0,
        isVoiced: false,
      });

      // Act
      const result = await detectPitch(audioBuffer, 44100);

      // Assert
      expect(result.isVoiced).toBe(false);
      expect(result.frequency).toBeNull();
    });

    it('should work with Float32Array input', async () => {
      // Arrange
      const audioBuffer = new Float32Array(2048).fill(0.1);
      mockDetectPitch.mockResolvedValueOnce({
        frequency: 150.0,
        confidence: 0.7,
        isVoiced: true,
      });

      // Act
      const result = await detectPitch(audioBuffer, 44100);

      // Assert
      expect(result).toBeDefined();
      expect(mockDetectPitch).toHaveBeenCalledWith(
        expect.any(Array),
        44100,
        expect.objectContaining({
          minFrequency: 80,
          maxFrequency: 400,
        })
      );
    });

    it('should work with number[] input', async () => {
      // Arrange
      const audioBuffer = new Array(2048).fill(0.1);
      mockDetectPitch.mockResolvedValueOnce({
        frequency: 150.0,
        confidence: 0.7,
        isVoiced: true,
      });

      // Act
      const result = await detectPitch(audioBuffer, 44100);

      // Assert
      expect(result).toBeDefined();
      expect(mockDetectPitch).toHaveBeenCalledWith(
        audioBuffer,
        44100,
        expect.any(Object)
      );
    });

    it('should validate sample rate is within valid range', async () => {
      // Arrange
      const audioBuffer = new Float32Array(2048);
      const validSampleRates = [8000, 16000, 22050, 44100, 48000];

      for (const sampleRate of validSampleRates) {
        mockDetectPitch.mockResolvedValueOnce({
          frequency: 200.0,
          confidence: 0.8,
          isVoiced: true,
        });

        // Act
        const result = await detectPitch(audioBuffer, sampleRate);

        // Assert
        expect(result).toBeDefined();
        expect(mockDetectPitch).toHaveBeenCalledWith(
          expect.any(Array),
          sampleRate,
          expect.any(Object)
        );

        jest.clearAllMocks();
      }
    });
  });

  describe('Configuration Options Tests (AC2)', () => {
    it('should use default frequency range (80-400 Hz) when not specified', async () => {
      // Arrange
      const audioBuffer = new Float32Array(2048);
      mockDetectPitch.mockResolvedValueOnce({
        frequency: 150.0,
        confidence: 0.8,
        isVoiced: true,
      });

      // Act
      await detectPitch(audioBuffer, 44100);

      // Assert
      expect(mockDetectPitch).toHaveBeenCalledWith(
        expect.any(Array),
        44100,
        expect.objectContaining({
          minFrequency: 80,
          maxFrequency: 400,
        })
      );
    });

    it('should respect custom minFrequency option', async () => {
      // Arrange
      const audioBuffer = new Float32Array(2048);
      mockDetectPitch.mockResolvedValueOnce({
        frequency: 50.0,
        confidence: 0.75,
        isVoiced: true,
      });

      // Act
      await detectPitch(audioBuffer, 44100, { minFrequency: 40 });

      // Assert
      expect(mockDetectPitch).toHaveBeenCalledWith(
        expect.any(Array),
        44100,
        expect.objectContaining({
          minFrequency: 40,
        })
      );
    });

    it('should respect custom maxFrequency option', async () => {
      // Arrange
      const audioBuffer = new Float32Array(2048);
      mockDetectPitch.mockResolvedValueOnce({
        frequency: 500.0,
        confidence: 0.85,
        isVoiced: true,
      });

      // Act
      await detectPitch(audioBuffer, 44100, { maxFrequency: 600 });

      // Assert
      expect(mockDetectPitch).toHaveBeenCalledWith(
        expect.any(Array),
        44100,
        expect.objectContaining({
          maxFrequency: 600,
        })
      );
    });

    it('should accept both minFrequency and maxFrequency', async () => {
      // Arrange
      const audioBuffer = new Float32Array(2048);
      mockDetectPitch.mockResolvedValueOnce({
        frequency: 120.0,
        confidence: 0.9,
        isVoiced: true,
      });

      // Act
      await detectPitch(audioBuffer, 44100, {
        minFrequency: 100,
        maxFrequency: 300,
      });

      // Assert
      expect(mockDetectPitch).toHaveBeenCalledWith(
        expect.any(Array),
        44100,
        expect.objectContaining({
          minFrequency: 100,
          maxFrequency: 300,
        })
      );
    });
  });

  describe('Validation Error Tests', () => {
    it('should throw ValidationError for empty buffer', async () => {
      // Arrange
      const emptyBuffer = new Float32Array(0);

      // Act & Assert
      await expect(detectPitch(emptyBuffer, 44100)).rejects.toThrow(ValidationError);
      await expect(detectPitch(emptyBuffer, 44100)).rejects.toThrow(
        'Audio buffer cannot be empty'
      );
    });

    it('should throw ValidationError for buffer larger than 16384 samples', async () => {
      // Arrange
      const largeBuffer = new Float32Array(16385);

      // Act & Assert
      await expect(detectPitch(largeBuffer, 44100)).rejects.toThrow(ValidationError);
      await expect(detectPitch(largeBuffer, 44100)).rejects.toThrow(
        'Buffer too large (max 16384 samples)'
      );
    });

    it('should throw ValidationError for buffer with NaN values', async () => {
      // Arrange
      const bufferWithNaN = new Float32Array([0.1, 0.2, NaN, 0.4]);

      // Act & Assert
      await expect(detectPitch(bufferWithNaN, 44100)).rejects.toThrow(ValidationError);
      await expect(detectPitch(bufferWithNaN, 44100)).rejects.toThrow(
        'Buffer contains NaN or Infinity values'
      );
    });

    it('should throw ValidationError for buffer with Infinity values', async () => {
      // Arrange
      const bufferWithInfinity = new Float32Array([0.1, Infinity, 0.3]);

      // Act & Assert
      await expect(detectPitch(bufferWithInfinity, 44100)).rejects.toThrow(ValidationError);
      await expect(detectPitch(bufferWithInfinity, 44100)).rejects.toThrow(
        'Buffer contains NaN or Infinity values'
      );
    });

    it('should throw ValidationError for sample rate below minimum (8000 Hz)', async () => {
      // Arrange
      const audioBuffer = new Float32Array(2048);
      const invalidSampleRate = 7999;

      // Act & Assert
      await expect(detectPitch(audioBuffer, invalidSampleRate)).rejects.toThrow(
        ValidationError
      );
      await expect(detectPitch(audioBuffer, invalidSampleRate)).rejects.toThrow(
        'Sample rate must be between 8000 and 48000 Hz'
      );
    });

    it('should throw ValidationError for sample rate above maximum (48000 Hz)', async () => {
      // Arrange
      const audioBuffer = new Float32Array(2048);
      const invalidSampleRate = 48001;

      // Act & Assert
      await expect(detectPitch(audioBuffer, invalidSampleRate)).rejects.toThrow(
        ValidationError
      );
      await expect(detectPitch(audioBuffer, invalidSampleRate)).rejects.toThrow(
        'Sample rate must be between 8000 and 48000 Hz'
      );
    });

    it('should throw ValidationError for non-integer sample rate', async () => {
      // Arrange
      const audioBuffer = new Float32Array(2048);
      const invalidSampleRate = 44100.5;

      // Act & Assert
      await expect(detectPitch(audioBuffer, invalidSampleRate)).rejects.toThrow(
        ValidationError
      );
      await expect(detectPitch(audioBuffer, invalidSampleRate)).rejects.toThrow(
        'Sample rate must be an integer'
      );
    });

    it('should throw NativeModuleError for negative frequency range', async () => {
      // Arrange
      const audioBuffer = new Float32Array(2048);

      // Act & Assert
      await expect(
        detectPitch(audioBuffer, 44100, { minFrequency: -10, maxFrequency: 400 })
      ).rejects.toThrow(NativeModuleError);
      await expect(
        detectPitch(audioBuffer, 44100, { minFrequency: -10, maxFrequency: 400 })
      ).rejects.toThrow('Frequency range must be positive');
    });

    it('should throw NativeModuleError when minFrequency >= maxFrequency', async () => {
      // Arrange
      const audioBuffer = new Float32Array(2048);

      // Act & Assert
      await expect(
        detectPitch(audioBuffer, 44100, { minFrequency: 400, maxFrequency: 200 })
      ).rejects.toThrow(NativeModuleError);
      await expect(
        detectPitch(audioBuffer, 44100, { minFrequency: 400, maxFrequency: 200 })
      ).rejects.toThrow('minFrequency must be less than maxFrequency');
    });

    it('should throw NativeModuleError when minFrequency equals maxFrequency', async () => {
      // Arrange
      const audioBuffer = new Float32Array(2048);

      // Act & Assert
      await expect(
        detectPitch(audioBuffer, 44100, { minFrequency: 200, maxFrequency: 200 })
      ).rejects.toThrow(NativeModuleError);
    });
  });

  describe('Native Module Error Handling', () => {
    it('should wrap native module errors in NativeModuleError', async () => {
      // Arrange
      const audioBuffer = new Float32Array(2048);
      mockDetectPitch.mockRejectedValueOnce(new Error('Native pitch detection failed'));

      // Act & Assert
      await expect(detectPitch(audioBuffer, 44100)).rejects.toThrow(NativeModuleError);
      await expect(detectPitch(audioBuffer, 44100)).rejects.toThrow('Pitch detection failed');
    });

    it('should include context in NativeModuleError', async () => {
      // Arrange
      const audioBuffer = new Float32Array(2048);
      mockDetectPitch.mockRejectedValueOnce(new Error('Native error'));

      // Act & Assert
      try {
        await detectPitch(audioBuffer, 44100, { minFrequency: 100, maxFrequency: 300 });
        fail('Should have thrown NativeModuleError');
      } catch (error) {
        expect(error).toBeInstanceOf(NativeModuleError);
        if (error instanceof NativeModuleError) {
          expect(error.details).toMatchObject({
            sampleRate: 44100,
            minFrequency: 100,
            maxFrequency: 300,
            bufferLength: 2048,
          });
        }
      }
    });
  });

  describe('Data Type Conversion Tests', () => {
    it('should convert Float32Array to number[] for native bridge', async () => {
      // Arrange
      const audioBuffer = new Float32Array(2048).fill(0.1);
      mockDetectPitch.mockResolvedValueOnce({
        frequency: 150.0,
        confidence: 0.8,
        isVoiced: true,
      });

      // Act
      await detectPitch(audioBuffer, 44100);

      // Assert
      const callArgs = mockDetectPitch.mock.calls[0];
      expect(Array.isArray(callArgs[0])).toBe(true);
      expect(callArgs[0].length).toBe(2048);
    });

    it('should pass number[] directly to native bridge', async () => {
      // Arrange
      const audioBuffer = new Array(2048).fill(0.1);
      mockDetectPitch.mockResolvedValueOnce({
        frequency: 150.0,
        confidence: 0.8,
        isVoiced: true,
      });

      // Act
      await detectPitch(audioBuffer, 44100);

      // Assert
      const callArgs = mockDetectPitch.mock.calls[0];
      expect(callArgs[0]).toBe(audioBuffer); // Same reference
    });

    it('should handle null frequency from native module', async () => {
      // Arrange
      const audioBuffer = new Float32Array(2048);
      mockDetectPitch.mockResolvedValueOnce({
        frequency: null,
        confidence: 0.0,
        isVoiced: false,
      });

      // Act
      const result = await detectPitch(audioBuffer, 44100);

      // Assert
      expect(result.frequency).toBeNull();
      expect(result.isVoiced).toBe(false);
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
        await expect(detectPitch(buffer, 44100)).rejects.toThrow(ValidationError);
        // Native module should never be called for invalid inputs
        expect(mockDetectPitch).not.toHaveBeenCalled();
        jest.clearAllMocks();
      }
    });

    it('should call native module with identical parameters regardless of input type', async () => {
      // Arrange
      const float32Buffer = new Float32Array(2048).fill(0.1);
      const numberBuffer = new Array(2048).fill(0.1);

      const mockResponse = {
        frequency: 150.0,
        confidence: 0.8,
        isVoiced: true,
      };

      // Act
      mockDetectPitch.mockResolvedValueOnce(mockResponse);
      await detectPitch(float32Buffer, 44100);
      const call1 = mockDetectPitch.mock.calls[0];

      jest.clearAllMocks();

      mockDetectPitch.mockResolvedValueOnce(mockResponse);
      await detectPitch(numberBuffer, 44100);
      const call2 = mockDetectPitch.mock.calls[0];

      // Assert: Both should result in identical call parameters
      expect(call1[1]).toBe(call2[1]); // Same sample rate
      expect(call1[2]).toEqual(call2[2]); // Same options
      expect(call1[0].length).toBe(call2[0].length); // Same buffer length
    });
  });

  describe('Real-World Use Cases', () => {
    it('should detect pitch for low male voice (100-150 Hz)', async () => {
      // Arrange
      const audioBuffer = generateSineWave(120, 44100, 2048);
      mockDetectPitch.mockResolvedValueOnce({
        frequency: 120.0,
        confidence: 0.9,
        isVoiced: true,
      });

      // Act
      const result = await detectPitch(audioBuffer, 44100);

      // Assert
      expect(result.frequency).toBeGreaterThanOrEqual(100);
      expect(result.frequency).toBeLessThanOrEqual(150);
      expect(result.isVoiced).toBe(true);
    });

    it('should detect pitch for high female voice (200-300 Hz)', async () => {
      // Arrange
      const audioBuffer = generateSineWave(250, 44100, 2048);
      mockDetectPitch.mockResolvedValueOnce({
        frequency: 250.0,
        confidence: 0.92,
        isVoiced: true,
      });

      // Act
      const result = await detectPitch(audioBuffer, 44100);

      // Assert
      expect(result.frequency).toBeGreaterThanOrEqual(200);
      expect(result.frequency).toBeLessThanOrEqual(300);
      expect(result.isVoiced).toBe(true);
    });

    it('should handle musical note A4 (440 Hz)', async () => {
      // Arrange: Musical tuning standard
      const audioBuffer = generateSineWave(440, 44100, 2048);
      mockDetectPitch.mockResolvedValueOnce({
        frequency: 440.0,
        confidence: 0.98,
        isVoiced: true,
      });

      // Act
      const result = await detectPitch(audioBuffer, 44100);

      // Assert: Should be very close to 440 Hz
      expect(result.frequency).toBeCloseTo(440, 0);
      expect(result.confidence).toBeGreaterThan(0.95);
    });
  });
});
