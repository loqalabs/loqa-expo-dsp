// Comprehensive tests for computeFFT function
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

import LoqaAudioDspModule from '../src/LoqaAudioDspModule';
import { computeFFT } from '../src/computeFFT';
import { ValidationError, NativeModuleError } from '../src/errors';

// Mock the native module
jest.mock('../src/LoqaAudioDspModule', () => ({
  __esModule: true,
  default: {
    computeFFT: jest.fn(),
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
 * Helper function to find the bin index with maximum magnitude
 * @param magnitudes - Array of magnitude values
 * @returns Index of the maximum value
 */
function findPeakBin(magnitudes: Float32Array): number {
  let maxIndex = 0;
  let maxValue = magnitudes[0];

  for (let i = 1; i < magnitudes.length; i++) {
    if (magnitudes[i] > maxValue) {
      maxValue = magnitudes[i];
      maxIndex = i;
    }
  }

  return maxIndex;
}

describe('computeFFT', () => {
  const mockComputeFFT = LoqaAudioDspModule.computeFFT as jest.MockedFunction<
    typeof LoqaAudioDspModule.computeFFT
  >;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('Valid Input Tests (AC2)', () => {
    it('should compute FFT correctly with Float32Array input', async () => {
      // Arrange: Create a 440 Hz sine wave
      const sampleRate = 44100;
      const frequency = 440;
      const bufferSize = 1024;
      const audioBuffer = generateSineWave(frequency, sampleRate, bufferSize);

      // Mock native response
      const mockMagnitude = new Array(bufferSize / 2).fill(0);
      mockMagnitude[10] = 1.0; // Simulate peak at bin 10

      const mockFrequencies = new Array(bufferSize / 2)
        .fill(0)
        .map((_, i) => (i * sampleRate) / bufferSize);

      mockComputeFFT.mockResolvedValueOnce({
        magnitude: mockMagnitude,
        frequencies: mockFrequencies,
      });

      // Act
      const result = await computeFFT(audioBuffer);

      // Assert
      expect(result).toBeDefined();
      expect(result.magnitude).toBeInstanceOf(Float32Array);
      expect(result.magnitude.length).toBe(bufferSize / 2);
      expect(result.frequencies).toBeInstanceOf(Float32Array);
      expect(result.frequencies.length).toBe(bufferSize / 2);
      expect(mockComputeFFT).toHaveBeenCalledTimes(1);
    });

    it('should compute FFT correctly with number[] input', async () => {
      // Arrange - use minimum valid FFT size (256)
      const audioBuffer = new Array(256).fill(0).map((_, i) => Math.sin(i * 0.1));
      const fftSize = 256;

      // Mock native response
      mockComputeFFT.mockResolvedValueOnce({
        magnitude: new Array(fftSize / 2).fill(0.5),
        frequencies: new Array(fftSize / 2).fill(0).map((_, i) => (i * 44100) / fftSize),
      });

      // Act
      const result = await computeFFT(audioBuffer);

      // Assert
      expect(result).toBeDefined();
      expect(result.magnitude).toBeInstanceOf(Float32Array);
      expect(result.frequencies).toBeInstanceOf(Float32Array);
      expect(mockComputeFFT).toHaveBeenCalledWith(
        audioBuffer,
        expect.objectContaining({
          fftSize: 256,
          windowType: 'hanning',
          includePhase: false,
          sampleRate: 44100,
        })
      );
    });

    it('should return proper magnitude and frequencies for 440 Hz sine wave', async () => {
      // Arrange: 440 Hz at 44100 Hz sample rate, 2048 samples
      const sampleRate = 44100;
      const frequency = 440;
      const bufferSize = 2048;
      const audioBuffer = generateSineWave(frequency, sampleRate, bufferSize);

      // Expected peak bin: 440 / (44100 / 2048) ≈ 20.4 → bin 20
      const expectedBin = Math.round((frequency * bufferSize) / sampleRate);

      // Mock realistic FFT response with peak at expected bin
      const mockMagnitude = new Array(bufferSize / 2).fill(0.01);
      mockMagnitude[expectedBin] = 1.0;

      const mockFrequencies = new Array(bufferSize / 2)
        .fill(0)
        .map((_, i) => (i * sampleRate) / bufferSize);

      mockComputeFFT.mockResolvedValueOnce({
        magnitude: mockMagnitude,
        frequencies: mockFrequencies,
      });

      // Act
      const result = await computeFFT(audioBuffer);

      // Assert
      const peakBin = findPeakBin(result.magnitude);

      expect(peakBin).toBe(expectedBin);
      // Peak should be at the expected bin for 440 Hz
      expect(result.frequencies[expectedBin]).toBeGreaterThan(430);
      expect(result.frequencies[expectedBin]).toBeLessThan(450);
    });

    it('should accept all window types', async () => {
      const audioBuffer = new Float32Array(512);
      const windowTypes: ('hanning' | 'hamming' | 'blackman' | 'none')[] = [
        'hanning',
        'hamming',
        'blackman',
        'none',
      ];

      for (const windowType of windowTypes) {
        // Mock response
        mockComputeFFT.mockResolvedValueOnce({
          magnitude: new Array(256).fill(0.5),
          frequencies: new Array(256).fill(0),
        });

        // Act
        await computeFFT(audioBuffer, { windowType });

        // Assert
        expect(mockComputeFFT).toHaveBeenCalledWith(
          expect.any(Array),
          expect.objectContaining({ windowType })
        );

        jest.clearAllMocks();
      }
    });

    it('should include phase information when requested', async () => {
      // Arrange
      const audioBuffer = new Float32Array(512);

      mockComputeFFT.mockResolvedValueOnce({
        magnitude: new Array(256).fill(0.5),
        phase: new Array(256).fill(0.1), // Phase data included
        frequencies: new Array(256).fill(0),
      });

      // Act
      const result = await computeFFT(audioBuffer, { includePhase: true });

      // Assert
      expect(result.phase).toBeDefined();
      expect(result.phase).toBeInstanceOf(Float32Array);
      expect(result.phase!.length).toBe(256);
      expect(mockComputeFFT).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({ includePhase: true })
      );
    });

    it('should not include phase when not requested', async () => {
      // Arrange
      const audioBuffer = new Float32Array(512);

      mockComputeFFT.mockResolvedValueOnce({
        magnitude: new Array(256).fill(0.5),
        frequencies: new Array(256).fill(0),
        // No phase property
      });

      // Act
      const result = await computeFFT(audioBuffer, { includePhase: false });

      // Assert
      expect(result.phase).toBeUndefined();
    });

    it('should accept custom fftSize (power of 2)', async () => {
      // Arrange
      const audioBuffer = new Float32Array(1024);
      const customFFTSize = 2048;

      mockComputeFFT.mockResolvedValueOnce({
        magnitude: new Array(customFFTSize / 2).fill(0.5),
        frequencies: new Array(customFFTSize / 2).fill(0),
      });

      // Act
      const result = await computeFFT(audioBuffer, { fftSize: customFFTSize });

      // Assert
      expect(result.magnitude.length).toBe(customFFTSize / 2);
      expect(mockComputeFFT).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({ fftSize: customFFTSize })
      );
    });
  });

  describe('Validation Error Tests (AC3)', () => {
    it('should throw ValidationError for empty buffer', async () => {
      // Arrange
      const emptyBuffer = new Float32Array(0);

      // Act & Assert
      await expect(computeFFT(emptyBuffer)).rejects.toThrow(ValidationError);
      await expect(computeFFT(emptyBuffer)).rejects.toThrow('Audio buffer cannot be empty');
    });

    it('should throw ValidationError for buffer larger than 16384 samples', async () => {
      // Arrange
      const largeBuffer = new Float32Array(16385); // One over the limit

      // Act & Assert
      await expect(computeFFT(largeBuffer)).rejects.toThrow(ValidationError);
      await expect(computeFFT(largeBuffer)).rejects.toThrow('Buffer too large (max 16384 samples)');
    });

    it('should throw ValidationError for buffer with NaN values', async () => {
      // Arrange
      const bufferWithNaN = new Float32Array([0.1, 0.2, NaN, 0.4]);

      // Act & Assert
      await expect(computeFFT(bufferWithNaN)).rejects.toThrow(ValidationError);
      await expect(computeFFT(bufferWithNaN)).rejects.toThrow(
        'Buffer contains NaN or Infinity values'
      );
    });

    it('should throw ValidationError for buffer with Infinity values', async () => {
      // Arrange
      const bufferWithInfinity = new Float32Array([0.1, 0.2, Infinity, 0.4]);

      // Act & Assert
      await expect(computeFFT(bufferWithInfinity)).rejects.toThrow(ValidationError);
      await expect(computeFFT(bufferWithInfinity)).rejects.toThrow(
        'Buffer contains NaN or Infinity values'
      );
    });

    it('should throw ValidationError for non-power-of-2 fftSize', async () => {
      // Arrange
      const audioBuffer = new Float32Array(512);
      const invalidFFTSize = 1000; // Not a power of 2

      // Act & Assert
      await expect(computeFFT(audioBuffer, { fftSize: invalidFFTSize })).rejects.toThrow(
        ValidationError
      );
      await expect(computeFFT(audioBuffer, { fftSize: invalidFFTSize })).rejects.toThrow(
        'FFT size must be a power of 2'
      );
    });

    it('should throw ValidationError for fftSize below minimum (256)', async () => {
      // Arrange
      const audioBuffer = new Float32Array(512);
      const tooSmallFFTSize = 128; // Below minimum

      // Act & Assert
      await expect(computeFFT(audioBuffer, { fftSize: tooSmallFFTSize })).rejects.toThrow(
        ValidationError
      );
      await expect(computeFFT(audioBuffer, { fftSize: tooSmallFFTSize })).rejects.toThrow(
        'FFT size must be between 256 and 8192'
      );
    });

    it('should throw ValidationError for fftSize above maximum (8192)', async () => {
      // Arrange
      const audioBuffer = new Float32Array(512);
      const tooLargeFFTSize = 16384; // Above maximum

      // Act & Assert
      await expect(computeFFT(audioBuffer, { fftSize: tooLargeFFTSize })).rejects.toThrow(
        ValidationError
      );
      await expect(computeFFT(audioBuffer, { fftSize: tooLargeFFTSize })).rejects.toThrow(
        'FFT size must be between 256 and 8192'
      );
    });
  });

  describe('Native Module Error Handling', () => {
    it('should wrap native module errors in NativeModuleError', async () => {
      // Arrange
      const audioBuffer = new Float32Array(512);
      mockComputeFFT.mockRejectedValueOnce(new Error('Native FFT computation failed'));

      // Act & Assert
      await expect(computeFFT(audioBuffer)).rejects.toThrow(NativeModuleError);
      await expect(computeFFT(audioBuffer)).rejects.toThrow('FFT computation failed');
    });

    it('should include context in NativeModuleError', async () => {
      // Arrange
      const audioBuffer = new Float32Array(512);
      mockComputeFFT.mockRejectedValueOnce(new Error('Native error'));

      // Act & Assert
      try {
        await computeFFT(audioBuffer, { fftSize: 1024, windowType: 'hamming' });
        fail('Should have thrown NativeModuleError');
      } catch (error) {
        expect(error).toBeInstanceOf(NativeModuleError);
        if (error instanceof NativeModuleError) {
          expect(error.details).toMatchObject({
            fftSize: 1024,
            windowType: 'hamming',
            bufferLength: 512,
          });
        }
      }
    });
  });

  describe('Data Type Conversion Tests', () => {
    it('should convert Float32Array to number[] for native bridge', async () => {
      // Arrange - use valid FFT size
      const audioBuffer = new Float32Array(256).fill(0.1);

      mockComputeFFT.mockResolvedValueOnce({
        magnitude: new Array(128).fill(0.5),
        frequencies: new Array(128).fill(0),
      });

      // Act
      await computeFFT(audioBuffer);

      // Assert
      const callArgs = mockComputeFFT.mock.calls[0];
      expect(Array.isArray(callArgs[0])).toBe(true);
      expect(callArgs[0].length).toBe(256);
    });

    it('should pass number[] directly to native bridge', async () => {
      // Arrange - use valid FFT size
      const audioBuffer = new Array(256).fill(0.1);

      mockComputeFFT.mockResolvedValueOnce({
        magnitude: new Array(128).fill(0.5),
        frequencies: new Array(128).fill(0),
      });

      // Act
      await computeFFT(audioBuffer);

      // Assert
      const callArgs = mockComputeFFT.mock.calls[0];
      expect(callArgs[0]).toBe(audioBuffer); // Same reference
    });

    it('should convert native result arrays to Float32Array', async () => {
      // Arrange
      const audioBuffer = new Float32Array(512);

      mockComputeFFT.mockResolvedValueOnce({
        magnitude: new Array(256).fill(0.5), // Plain array from native
        frequencies: new Array(256).fill(100), // Plain array from native
      });

      // Act
      const result = await computeFFT(audioBuffer);

      // Assert
      expect(result.magnitude).toBeInstanceOf(Float32Array);
      expect(result.frequencies).toBeInstanceOf(Float32Array);
    });
  });

  describe('Default Values Tests', () => {
    it('should use buffer length as default fftSize', async () => {
      // Arrange
      const audioBuffer = new Float32Array(1024);

      mockComputeFFT.mockResolvedValueOnce({
        magnitude: new Array(512).fill(0.5),
        frequencies: new Array(512).fill(0),
      });

      // Act
      await computeFFT(audioBuffer);

      // Assert
      expect(mockComputeFFT).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({ fftSize: 1024 })
      );
    });

    it('should use "hanning" as default windowType', async () => {
      // Arrange
      const audioBuffer = new Float32Array(512);

      mockComputeFFT.mockResolvedValueOnce({
        magnitude: new Array(256).fill(0.5),
        frequencies: new Array(256).fill(0),
      });

      // Act
      await computeFFT(audioBuffer);

      // Assert
      expect(mockComputeFFT).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({ windowType: 'hanning' })
      );
    });

    it('should use false as default includePhase', async () => {
      // Arrange
      const audioBuffer = new Float32Array(512);

      mockComputeFFT.mockResolvedValueOnce({
        magnitude: new Array(256).fill(0.5),
        frequencies: new Array(256).fill(0),
      });

      // Act
      await computeFFT(audioBuffer);

      // Assert
      expect(mockComputeFFT).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({ includePhase: false })
      );
    });
  });

  describe('Cross-Platform Behavior (AC1, AC5)', () => {
    it('should validate inputs consistently before native call', async () => {
      // This test ensures validation happens in TypeScript layer,
      // making it consistent across iOS and Android

      const invalidInputs = [
        { buffer: new Float32Array(0), error: 'empty' },
        { buffer: new Float32Array(20000), error: 'too large' },
        {
          buffer: new Float32Array([NaN, 0.1, 0.2]),
          error: 'contains NaN',
        },
      ];

      for (const { buffer } of invalidInputs) {
        await expect(computeFFT(buffer)).rejects.toThrow(ValidationError);
        // Native module should never be called for invalid inputs
        expect(mockComputeFFT).not.toHaveBeenCalled();
        jest.clearAllMocks();
      }
    });

    it('should call native module with identical parameters regardless of input type', async () => {
      // Arrange - use valid FFT size
      const float32Buffer = new Float32Array(256).fill(0.1);
      const numberBuffer = new Array(256).fill(0.1);

      const mockResponse = {
        magnitude: new Array(128).fill(0.5),
        frequencies: new Array(128).fill(0),
      };

      // Act
      mockComputeFFT.mockResolvedValueOnce(mockResponse);
      await computeFFT(float32Buffer);
      const call1 = mockComputeFFT.mock.calls[0];

      jest.clearAllMocks();

      mockComputeFFT.mockResolvedValueOnce(mockResponse);
      await computeFFT(numberBuffer);
      const call2 = mockComputeFFT.mock.calls[0];

      // Assert: Both should result in identical options (buffer values are equal even if different types)
      expect(call1[1]).toEqual(call2[1]); // Same options
      // Buffer values should be equal even though types differ (Float32Array vs Array)
      expect(call1[0].length).toBe(call2[0].length);
    });
  });
});
