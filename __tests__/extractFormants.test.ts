// Comprehensive tests for extractFormants function
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { extractFormants } from '../src/extractFormants';
import { ValidationError, NativeModuleError } from '../src/errors';

// Mock the native module
jest.mock('../src/LoqaAudioDspModule', () => ({
  __esModule: true,
  default: {
    extractFormants: jest.fn(),
  },
}));

// Mock the utils module to prevent logging during tests
jest.mock('../src/utils', () => ({
  logDebug: jest.fn(),
}));

import LoqaAudioDspModule from '../src/LoqaAudioDspModule';

/**
 * Helper function to generate synthetic vowel-like audio
 * This generates a simple approximation by combining formant frequencies
 * @param f1 - First formant frequency in Hz
 * @param f2 - Second formant frequency in Hz
 * @param f3 - Third formant frequency in Hz
 * @param sampleRate - Sample rate in Hz
 * @param durationSamples - Number of samples to generate
 * @returns Float32Array with synthetic vowel data
 */
function generateVowelLikeAudio(
  f1: number,
  f2: number,
  f3: number,
  sampleRate: number,
  durationSamples: number
): Float32Array {
  const buffer = new Float32Array(durationSamples);

  // Generate a simple additive synthesis with three formants
  // Real formants would need proper resonance modeling, but this is sufficient for testing
  for (let i = 0; i < durationSamples; i++) {
    const t = i / sampleRate;
    const omega1 = 2 * Math.PI * f1 * t;
    const omega2 = 2 * Math.PI * f2 * t;
    const omega3 = 2 * Math.PI * f3 * t;

    // Combine formants with decreasing amplitudes
    buffer[i] = 0.5 * Math.sin(omega1) + 0.3 * Math.sin(omega2) + 0.2 * Math.sin(omega3);
  }

  return buffer;
}

describe('extractFormants', () => {
  const mockExtractFormants = LoqaAudioDspModule.extractFormants as jest.MockedFunction<
    typeof LoqaAudioDspModule.extractFormants
  >;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('Valid Input Tests (AC3)', () => {
    it('should extract formants from vowel /a/ (F1~700Hz, F2~1200Hz, F3~2600Hz)', async () => {
      // Arrange: Generate synthetic /a/ vowel
      const sampleRate = 44100;
      const bufferSize = 2048;
      const audioBuffer = generateVowelLikeAudio(700, 1220, 2600, sampleRate, bufferSize);

      // Mock native response for /a/ vowel formants
      mockExtractFormants.mockResolvedValueOnce({
        f1: 700,
        f2: 1220,
        f3: 2600,
        bandwidths: {
          f1: 50,
          f2: 70,
          f3: 100,
        },
      });

      // Act
      const result = await extractFormants(audioBuffer, sampleRate);

      // Assert
      expect(result).toBeDefined();
      expect(result.f1).toBeCloseTo(700, 0);
      expect(result.f2).toBeCloseTo(1220, 0);
      expect(result.f3).toBeCloseTo(2600, 0);
      expect(result.bandwidths).toBeDefined();
      expect(mockExtractFormants).toHaveBeenCalledTimes(1);
    });

    it('should return F1/F2/F3 in expected ranges for typical vowel', async () => {
      // Arrange
      const audioBuffer = new Float32Array(2048).fill(0.1);

      mockExtractFormants.mockResolvedValueOnce({
        f1: 500,
        f2: 1500,
        f3: 2500,
        bandwidths: {
          f1: 60,
          f2: 80,
          f3: 120,
        },
      });

      // Act
      const result = await extractFormants(audioBuffer, 44100);

      // Assert: Formants should be in typical human voice ranges
      expect(result.f1).toBeGreaterThanOrEqual(200);
      expect(result.f1).toBeLessThanOrEqual(1000);
      expect(result.f2).toBeGreaterThanOrEqual(800);
      expect(result.f2).toBeLessThanOrEqual(2500);
      expect(result.f3).toBeGreaterThanOrEqual(2000);
      expect(result.f3).toBeLessThanOrEqual(4000);
    });

    it('should return bandwidth information for each formant', async () => {
      // Arrange
      const audioBuffer = new Float32Array(2048);

      mockExtractFormants.mockResolvedValueOnce({
        f1: 600,
        f2: 1400,
        f3: 2800,
        bandwidths: {
          f1: 55,
          f2: 75,
          f3: 110,
        },
      });

      // Act
      const result = await extractFormants(audioBuffer, 44100);

      // Assert
      expect(result.bandwidths).toBeDefined();
      expect(result.bandwidths.f1).toBeGreaterThan(0);
      expect(result.bandwidths.f2).toBeGreaterThan(0);
      expect(result.bandwidths.f3).toBeGreaterThan(0);
    });

    it('should work with Float32Array input', async () => {
      // Arrange
      const audioBuffer = new Float32Array(2048).fill(0.1);

      mockExtractFormants.mockResolvedValueOnce({
        f1: 650,
        f2: 1300,
        f3: 2700,
        bandwidths: { f1: 50, f2: 70, f3: 100 },
      });

      // Act
      const result = await extractFormants(audioBuffer, 44100);

      // Assert
      expect(result).toBeDefined();
      expect(mockExtractFormants).toHaveBeenCalledWith(
        expect.any(Array),
        44100,
        expect.objectContaining({
          lpcOrder: expect.any(Number),
        })
      );
    });

    it('should work with number[] input', async () => {
      // Arrange
      const audioBuffer = new Array(2048).fill(0.1);

      mockExtractFormants.mockResolvedValueOnce({
        f1: 650,
        f2: 1300,
        f3: 2700,
        bandwidths: { f1: 50, f2: 70, f3: 100 },
      });

      // Act
      const result = await extractFormants(audioBuffer, 44100);

      // Assert
      expect(result).toBeDefined();
      expect(mockExtractFormants).toHaveBeenCalledWith(
        audioBuffer,
        44100,
        expect.any(Object)
      );
    });

    it('should validate input is appropriate for various sample rates', async () => {
      // Arrange
      const audioBuffer = new Float32Array(2048);
      const validSampleRates = [8000, 16000, 22050, 44100, 48000];

      for (const sampleRate of validSampleRates) {
        mockExtractFormants.mockResolvedValueOnce({
          f1: 600,
          f2: 1400,
          f3: 2800,
          bandwidths: { f1: 50, f2: 70, f3: 100 },
        });

        // Act
        const result = await extractFormants(audioBuffer, sampleRate);

        // Assert
        expect(result).toBeDefined();
        expect(mockExtractFormants).toHaveBeenCalledWith(
          expect.any(Array),
          sampleRate,
          expect.any(Object)
        );

        jest.clearAllMocks();
      }
    });
  });

  describe('LPC Order Configuration Tests', () => {
    it('should calculate default LPC order based on sample rate', async () => {
      // Arrange
      const audioBuffer = new Float32Array(2048);
      const sampleRate = 44100;
      const expectedDefaultLpcOrder = Math.floor(sampleRate / 1000) + 2; // 44 + 2 = 46

      mockExtractFormants.mockResolvedValueOnce({
        f1: 650,
        f2: 1300,
        f3: 2700,
        bandwidths: { f1: 50, f2: 70, f3: 100 },
      });

      // Act
      await extractFormants(audioBuffer, sampleRate);

      // Assert
      expect(mockExtractFormants).toHaveBeenCalledWith(
        expect.any(Array),
        sampleRate,
        expect.objectContaining({
          lpcOrder: expectedDefaultLpcOrder,
        })
      );
    });

    it('should use different default LPC order for different sample rates', async () => {
      // Arrange
      const audioBuffer = new Float32Array(2048);
      const testCases = [
        { sampleRate: 8000, expectedLpcOrder: 10 }, // 8 + 2
        { sampleRate: 16000, expectedLpcOrder: 18 }, // 16 + 2
        { sampleRate: 22050, expectedLpcOrder: 24 }, // 22 + 2
        { sampleRate: 44100, expectedLpcOrder: 46 }, // 44 + 2
        { sampleRate: 48000, expectedLpcOrder: 50 }, // 48 + 2
      ];

      for (const { sampleRate, expectedLpcOrder } of testCases) {
        mockExtractFormants.mockResolvedValueOnce({
          f1: 600,
          f2: 1400,
          f3: 2800,
          bandwidths: { f1: 50, f2: 70, f3: 100 },
        });

        // Act
        await extractFormants(audioBuffer, sampleRate);

        // Assert
        expect(mockExtractFormants).toHaveBeenCalledWith(
          expect.any(Array),
          sampleRate,
          expect.objectContaining({
            lpcOrder: expectedLpcOrder,
          })
        );

        jest.clearAllMocks();
      }
    });

    it('should respect custom lpcOrder option', async () => {
      // Arrange
      const audioBuffer = new Float32Array(2048);
      const customLpcOrder = 20;

      mockExtractFormants.mockResolvedValueOnce({
        f1: 650,
        f2: 1300,
        f3: 2700,
        bandwidths: { f1: 50, f2: 70, f3: 100 },
      });

      // Act
      await extractFormants(audioBuffer, 44100, { lpcOrder: customLpcOrder });

      // Assert
      expect(mockExtractFormants).toHaveBeenCalledWith(
        expect.any(Array),
        44100,
        expect.objectContaining({
          lpcOrder: customLpcOrder,
        })
      );
    });
  });

  describe('Validation Error Tests', () => {
    it('should throw ValidationError for empty buffer', async () => {
      // Arrange
      const emptyBuffer = new Float32Array(0);

      // Act & Assert
      await expect(extractFormants(emptyBuffer, 44100)).rejects.toThrow(ValidationError);
      await expect(extractFormants(emptyBuffer, 44100)).rejects.toThrow(
        'Audio buffer cannot be empty'
      );
    });

    it('should throw ValidationError for buffer larger than 16384 samples', async () => {
      // Arrange
      const largeBuffer = new Float32Array(16385);

      // Act & Assert
      await expect(extractFormants(largeBuffer, 44100)).rejects.toThrow(ValidationError);
      await expect(extractFormants(largeBuffer, 44100)).rejects.toThrow(
        'Buffer too large (max 16384 samples)'
      );
    });

    it('should throw ValidationError for buffer with NaN values', async () => {
      // Arrange
      const bufferWithNaN = new Float32Array([0.1, 0.2, NaN, 0.4]);

      // Act & Assert
      await expect(extractFormants(bufferWithNaN, 44100)).rejects.toThrow(ValidationError);
      await expect(extractFormants(bufferWithNaN, 44100)).rejects.toThrow(
        'Buffer contains NaN or Infinity values'
      );
    });

    it('should throw ValidationError for buffer with Infinity values', async () => {
      // Arrange
      const bufferWithInfinity = new Float32Array([0.1, Infinity, 0.3]);

      // Act & Assert
      await expect(extractFormants(bufferWithInfinity, 44100)).rejects.toThrow(ValidationError);
      await expect(extractFormants(bufferWithInfinity, 44100)).rejects.toThrow(
        'Buffer contains NaN or Infinity values'
      );
    });

    it('should throw ValidationError for sample rate below minimum (8000 Hz)', async () => {
      // Arrange
      const audioBuffer = new Float32Array(2048);
      const invalidSampleRate = 7999;

      // Act & Assert
      await expect(extractFormants(audioBuffer, invalidSampleRate)).rejects.toThrow(
        ValidationError
      );
      await expect(extractFormants(audioBuffer, invalidSampleRate)).rejects.toThrow(
        'Sample rate must be between 8000 and 48000 Hz'
      );
    });

    it('should throw ValidationError for sample rate above maximum (48000 Hz)', async () => {
      // Arrange
      const audioBuffer = new Float32Array(2048);
      const invalidSampleRate = 48001;

      // Act & Assert
      await expect(extractFormants(audioBuffer, invalidSampleRate)).rejects.toThrow(
        ValidationError
      );
      await expect(extractFormants(audioBuffer, invalidSampleRate)).rejects.toThrow(
        'Sample rate must be between 8000 and 48000 Hz'
      );
    });

    it('should throw ValidationError for non-integer sample rate', async () => {
      // Arrange
      const audioBuffer = new Float32Array(2048);
      const invalidSampleRate = 44100.5;

      // Act & Assert
      await expect(extractFormants(audioBuffer, invalidSampleRate)).rejects.toThrow(
        ValidationError
      );
      await expect(extractFormants(audioBuffer, invalidSampleRate)).rejects.toThrow(
        'Sample rate must be an integer'
      );
    });

    it('should throw NativeModuleError for negative LPC order', async () => {
      // Arrange
      const audioBuffer = new Float32Array(2048);

      // Act & Assert
      await expect(
        extractFormants(audioBuffer, 44100, { lpcOrder: -5 })
      ).rejects.toThrow(NativeModuleError);
      await expect(
        extractFormants(audioBuffer, 44100, { lpcOrder: -5 })
      ).rejects.toThrow('LPC order must be positive');
    });

    it('should throw NativeModuleError for zero LPC order', async () => {
      // Arrange
      const audioBuffer = new Float32Array(2048);

      // Act & Assert
      await expect(extractFormants(audioBuffer, 44100, { lpcOrder: 0 })).rejects.toThrow(
        NativeModuleError
      );
      await expect(extractFormants(audioBuffer, 44100, { lpcOrder: 0 })).rejects.toThrow(
        'LPC order must be positive'
      );
    });
  });

  describe('Native Module Error Handling', () => {
    it('should wrap native module errors in NativeModuleError', async () => {
      // Arrange
      const audioBuffer = new Float32Array(2048);
      mockExtractFormants.mockRejectedValueOnce(
        new Error('Native formant extraction failed')
      );

      // Act & Assert
      await expect(extractFormants(audioBuffer, 44100)).rejects.toThrow(NativeModuleError);
      await expect(extractFormants(audioBuffer, 44100)).rejects.toThrow(
        'Formant extraction failed'
      );
    });

    it('should include context in NativeModuleError', async () => {
      // Arrange
      const audioBuffer = new Float32Array(2048);
      mockExtractFormants.mockRejectedValueOnce(new Error('Native error'));

      // Act & Assert
      try {
        await extractFormants(audioBuffer, 44100, { lpcOrder: 20 });
        fail('Should have thrown NativeModuleError');
      } catch (error) {
        expect(error).toBeInstanceOf(NativeModuleError);
        if (error instanceof NativeModuleError) {
          expect(error.details).toMatchObject({
            sampleRate: 44100,
            lpcOrder: 20,
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
      mockExtractFormants.mockResolvedValueOnce({
        f1: 650,
        f2: 1300,
        f3: 2700,
        bandwidths: { f1: 50, f2: 70, f3: 100 },
      });

      // Act
      await extractFormants(audioBuffer, 44100);

      // Assert
      const callArgs = mockExtractFormants.mock.calls[0];
      expect(Array.isArray(callArgs[0])).toBe(true);
      expect(callArgs[0].length).toBe(2048);
    });

    it('should pass number[] directly to native bridge', async () => {
      // Arrange
      const audioBuffer = new Array(2048).fill(0.1);
      mockExtractFormants.mockResolvedValueOnce({
        f1: 650,
        f2: 1300,
        f3: 2700,
        bandwidths: { f1: 50, f2: 70, f3: 100 },
      });

      // Act
      await extractFormants(audioBuffer, 44100);

      // Assert
      const callArgs = mockExtractFormants.mock.calls[0];
      expect(callArgs[0]).toBe(audioBuffer); // Same reference
    });

    it('should properly structure bandwidths object from native result', async () => {
      // Arrange
      const audioBuffer = new Float32Array(2048);
      mockExtractFormants.mockResolvedValueOnce({
        f1: 700,
        f2: 1200,
        f3: 2600,
        bandwidths: {
          f1: 55,
          f2: 75,
          f3: 110,
        },
      });

      // Act
      const result = await extractFormants(audioBuffer, 44100);

      // Assert
      expect(result.bandwidths).toEqual({
        f1: 55,
        f2: 75,
        f3: 110,
      });
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
        await expect(extractFormants(buffer, 44100)).rejects.toThrow(ValidationError);
        // Native module should never be called for invalid inputs
        expect(mockExtractFormants).not.toHaveBeenCalled();
        jest.clearAllMocks();
      }
    });

    it('should call native module with identical parameters regardless of input type', async () => {
      // Arrange
      const float32Buffer = new Float32Array(2048).fill(0.1);
      const numberBuffer = new Array(2048).fill(0.1);

      const mockResponse = {
        f1: 650,
        f2: 1300,
        f3: 2700,
        bandwidths: { f1: 50, f2: 70, f3: 100 },
      };

      // Act
      mockExtractFormants.mockResolvedValueOnce(mockResponse);
      await extractFormants(float32Buffer, 44100);
      const call1 = mockExtractFormants.mock.calls[0];

      jest.clearAllMocks();

      mockExtractFormants.mockResolvedValueOnce(mockResponse);
      await extractFormants(numberBuffer, 44100);
      const call2 = mockExtractFormants.mock.calls[0];

      // Assert: Both should result in identical call parameters
      expect(call1[1]).toBe(call2[1]); // Same sample rate
      expect(call1[2]).toEqual(call2[2]); // Same options
      expect(call1[0].length).toBe(call2[0].length); // Same buffer length
    });
  });

  describe('Real-World Vowel Examples', () => {
    it('should extract formants for vowel /a/ (as in "father")', async () => {
      // Arrange: Typical /a/ formants
      const audioBuffer = generateVowelLikeAudio(700, 1220, 2600, 44100, 2048);

      mockExtractFormants.mockResolvedValueOnce({
        f1: 700,
        f2: 1220,
        f3: 2600,
        bandwidths: { f1: 50, f2: 70, f3: 100 },
      });

      // Act
      const result = await extractFormants(audioBuffer, 44100);

      // Assert: /a/ has low F1, mid-high F2
      expect(result.f1).toBeCloseTo(700, 0);
      expect(result.f2).toBeCloseTo(1220, 0);
    });

    it('should extract formants for vowel /i/ (as in "see")', async () => {
      // Arrange: Typical /i/ formants - high F2, low F1
      const audioBuffer = generateVowelLikeAudio(240, 2400, 3000, 44100, 2048);

      mockExtractFormants.mockResolvedValueOnce({
        f1: 240,
        f2: 2400,
        f3: 3000,
        bandwidths: { f1: 40, f2: 90, f3: 120 },
      });

      // Act
      const result = await extractFormants(audioBuffer, 44100);

      // Assert: /i/ has very low F1, very high F2
      expect(result.f1).toBeLessThan(400);
      expect(result.f2).toBeGreaterThan(2000);
    });

    it('should extract formants for vowel /u/ (as in "too")', async () => {
      // Arrange: Typical /u/ formants - low F1, low F2
      const audioBuffer = generateVowelLikeAudio(250, 595, 2400, 44100, 2048);

      mockExtractFormants.mockResolvedValueOnce({
        f1: 250,
        f2: 595,
        f3: 2400,
        bandwidths: { f1: 45, f2: 60, f3: 110 },
      });

      // Act
      const result = await extractFormants(audioBuffer, 44100);

      // Assert: /u/ has low F1 and low F2 (back vowel)
      expect(result.f1).toBeLessThan(400);
      expect(result.f2).toBeLessThan(800);
    });

    it('should extract formants for vowel /e/ (as in "see")', async () => {
      // Arrange: Typical /e/ formants - mid-low F1, high F2
      const audioBuffer = generateVowelLikeAudio(390, 2300, 3000, 44100, 2048);

      mockExtractFormants.mockResolvedValueOnce({
        f1: 390,
        f2: 2300,
        f3: 3000,
        bandwidths: { f1: 55, f2: 85, f3: 115 },
      });

      // Act
      const result = await extractFormants(audioBuffer, 44100);

      // Assert
      expect(result.f1).toBeGreaterThan(300);
      expect(result.f1).toBeLessThan(500);
      expect(result.f2).toBeGreaterThan(2000);
    });
  });
});
