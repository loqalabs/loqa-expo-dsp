# API Reference

**@loqalabs/loqa-expo-dsp**
Version: 0.5.0

This document provides complete API reference for all functions, types, and options in the @loqalabs/loqa-expo-dsp module.

> **Note**: Version 0.3.0 includes breaking changes from the underlying loqa-voice-dsp v0.4.0 library. See [Version History](#version-history) for details.

---

## Table of Contents

- [Functions](#functions)
  - [computeFFT](#computefft)
  - [detectPitch](#detectpitch)
  - [extractFormants](#extractformants)
  - [analyzeSpectrum](#analyzespectrum)
  - [calculateHNR](#calculatehnr)
  - [calculateH1H2](#calculateh1h2)
- [VoiceAnalyzer API](#voiceanalyzer-api)
  - [createVoiceAnalyzer](#createvoiceanalyzer)
  - [analyzeClip](#analyzeclip)
  - [processBuffer](#processbuffer)
  - [resetVoiceAnalyzer](#resetvoiceanalyzer)
  - [freeVoiceAnalyzer](#freevoiceanalyzer)
- [Types](#types)
  - [FFTOptions](#fftoptions)
  - [FFTResult](#fftresult)
  - [PitchDetectionOptions](#pitchdetectionoptions)
  - [PitchResult](#pitchresult)
  - [FormantExtractionOptions](#formantextractionoptions)
  - [FormantsResult](#formantsresult)
  - [SpectrumAnalysisOptions](#spectrumanalysisoptions)
  - [SpectrumResult](#spectrumresult)
  - [HNROptions](#hnroptions)
  - [HNRResult](#hnrresult)
  - [H1H2Options](#h1h2options)
  - [H1H2Result](#h1h2result)
  - [VoiceAnalyzerConfig](#voiceanalyzerconfig)
  - [VoiceAnalyzerHandle](#voiceanalyzerhandle)
  - [VoiceAnalyzerResult](#voiceanalyzerresult)
  - [PitchTrack](#pitchtrack)
- [Error Handling](#error-handling)
  - [LoqaExpoDspError](#loqaexpodsperror)
  - [ValidationError](#validationerror)
  - [NativeModuleError](#nativemoduleerror)
- [Validation Rules](#validation-rules)

---

## Functions

### computeFFT

Computes Fast Fourier Transform (FFT) of audio buffer.

This function performs frequency analysis on audio data using the FFT algorithm. It accepts audio buffers as Float32Array or number[], validates the input, and returns magnitude and frequency information.

```typescript
async function computeFFT(
  audioBuffer: Float32Array | number[],
  options?: FFTOptions
): Promise<FFTResult>;
```

#### Parameters

| Parameter     | Type                       | Required | Description                                                                                                                         |
| ------------- | -------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `audioBuffer` | `Float32Array \| number[]` | Yes      | Audio samples to analyze. Must be non-empty and contain no more than 16384 samples. All values must be finite (no NaN or Infinity). |
| `options`     | `FFTOptions`               | No       | Configuration options for FFT computation. See [FFTOptions](#fftoptions).                                                           |

#### Returns

`Promise<FFTResult>` - Resolves to an [FFTResult](#fftresult) containing magnitude spectrum, frequency bins, and optional phase information.

#### Throws

- `ValidationError` - If buffer is null, empty, too large, contains invalid values, or if FFT size is invalid
- `NativeModuleError` - If native computation fails

#### Example

```typescript
import { computeFFT } from '@loqalabs/loqa-expo-dsp';

// Basic usage with defaults
const audioData = new Float32Array(1024);
// ... fill with audio samples ...

const result = await computeFFT(audioData);
console.log('Magnitude:', result.magnitude);
console.log('Frequencies:', result.frequencies);

// Advanced usage with options
const result2 = await computeFFT(audioData, {
  fftSize: 2048, // Use 2048-point FFT
  windowType: 'hanning', // Apply Hanning window
  includePhase: false, // Omit phase for performance
});

// Find peak frequency
const peakIndex = result2.magnitude.indexOf(Math.max(...result2.magnitude));
const peakFrequency = result2.frequencies[peakIndex];
console.log(`Peak at ${peakFrequency} Hz`);
```

---

### detectPitch

Detects pitch using pYIN (probabilistic YIN) algorithm.

This function performs fundamental frequency (F0) detection on audio data using the pYIN algorithm, which provides improved accuracy for breathy or noisy signals compared to standard YIN. It accepts audio buffers as Float32Array or number[], validates the input, and returns pitch information with confidence scores and voiced probability.

As of loqa-voice-dsp v0.4.0, the pYIN implementation includes:

- Beta distribution threshold sampling for probabilistic candidate generation
- HMM with Viterbi decoding for smooth pitch tracks
- Voice-specific optimizations (default 80-400 Hz range, ±20% transition constraints)

> **Important: Buffer Size Recommendations**
>
> The pYIN algorithm works best with buffer sizes of **2048-4096 samples** (~46-93ms at 44100 Hz). Larger buffers (e.g., 16384 samples) may fail to detect pitch reliably due to pitch variations within the window. For continuous pitch tracking, use overlapping frames of 2048-4096 samples with 50% overlap.

```typescript
async function detectPitch(
  audioBuffer: Float32Array | number[],
  sampleRate: number,
  options?: Partial<PitchDetectionOptions>
): Promise<PitchResult>;
```

#### Parameters

| Parameter     | Type                             | Required | Description                                                                                                    |
| ------------- | -------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------- |
| `audioBuffer` | `Float32Array \| number[]`       | Yes      | Audio samples to analyze. Must be non-empty and contain no more than 16384 samples. All values must be finite. |
| `sampleRate`  | `number`                         | Yes      | Sample rate in Hz. Must be an integer between 8000 and 48000.                                                  |
| `options`     | `Partial<PitchDetectionOptions>` | No       | Configuration options for pitch detection. See [PitchDetectionOptions](#pitchdetectionoptions).                |

#### Returns

`Promise<PitchResult>` - Resolves to a [PitchResult](#pitchresult) containing detected pitch frequency, confidence score, and voicing information.

#### Throws

- `ValidationError` - If buffer or sample rate are invalid
- `NativeModuleError` - If native computation fails or frequency range is invalid

#### Example

```typescript
import { detectPitch } from '@loqalabs/loqa-expo-dsp';

// Basic usage with defaults (human voice range: 80-400 Hz)
const audioData = new Float32Array(2048);
// ... fill with audio samples ...

const result = await detectPitch(audioData, 44100);

if (result.isVoiced) {
  console.log(`Detected pitch: ${result.frequency} Hz`);
  console.log(`Confidence: ${result.confidence}`);
  console.log(`Voiced probability: ${result.voicedProbability}`);
} else {
  console.log('No pitch detected (unvoiced segment)');
}

// Custom frequency range for bass instruments
const bassResult = await detectPitch(audioData, 44100, {
  minFrequency: 40, // Lower bound for bass
  maxFrequency: 250, // Upper bound for bass
});
```

---

### extractFormants

Extracts formants (F1, F2, F3) using LPC analysis.

This function performs Linear Predictive Coding (LPC) analysis to extract the first three formant frequencies from audio data. Formants are resonant frequencies of the vocal tract and are essential for vowel identification and speech analysis.

As of loqa-voice-dsp v0.4.0, this returns a confidence score instead of individual bandwidth values. The confidence score indicates the reliability of the formant detection (0-1, higher is better).

```typescript
async function extractFormants(
  audioBuffer: Float32Array | number[],
  sampleRate: number,
  options?: Partial<FormantExtractionOptions>
): Promise<FormantsResult>;
```

#### Parameters

| Parameter     | Type                                | Required | Description                                                                                                                        |
| ------------- | ----------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `audioBuffer` | `Float32Array \| number[]`          | Yes      | Audio samples to analyze. Must be non-empty and contain no more than 16384 samples. Should contain voiced speech for best results. |
| `sampleRate`  | `number`                            | Yes      | Sample rate in Hz. Must be an integer between 8000 and 48000.                                                                      |
| `options`     | `Partial<FormantExtractionOptions>` | No       | Configuration options for formant extraction. See [FormantExtractionOptions](#formantextractionoptions).                           |

#### Returns

`Promise<FormantsResult>` - Resolves to a [FormantsResult](#formantsresult) containing F1, F2, F3 frequencies and a confidence score.

#### Throws

- `ValidationError` - If buffer or sample rate are invalid
- `NativeModuleError` - If native computation fails or LPC order is invalid

#### Example

```typescript
import { extractFormants } from '@loqalabs/loqa-expo-dsp';

// Basic usage with automatic LPC order
const audioData = new Float32Array(2048);
// ... fill with voiced audio samples ...

const result = await extractFormants(audioData, 44100);

console.log(`F1: ${result.f1} Hz`);
console.log(`F2: ${result.f2} Hz`);
console.log(`F3: ${result.f3} Hz`);
console.log(`Confidence: ${result.confidence}`);

// Custom LPC order for high sample rates
const result2 = await extractFormants(audioData, 48000, {
  lpcOrder: 16, // Higher order for 48kHz audio
});

// Vowel identification example (only trust high-confidence results)
if (result.confidence > 0.7) {
  if (result.f1 < 400 && result.f2 > 2000) {
    console.log('Likely vowel: /i/ (as in "beat")');
  } else if (result.f1 > 700 && result.f2 < 1200) {
    console.log('Likely vowel: /ɑ/ (as in "father")');
  }
}
```

---

### analyzeSpectrum

Analyzes spectral features (centroid, rolloff, tilt).

This function computes spectral characteristics of audio data, including:

- **Spectral centroid**: "center of mass" of the spectrum (brightness measure)
- **Spectral rolloff**: frequency below which 95% of energy is concentrated
- **Spectral tilt**: overall slope of the spectrum (timbre indicator)

All features are computed in a single call for efficiency.

```typescript
async function analyzeSpectrum(
  audioBuffer: Float32Array | number[],
  sampleRate: number,
  options?: Partial<SpectrumAnalysisOptions>
): Promise<SpectrumResult>;
```

#### Parameters

| Parameter     | Type                               | Required | Description                                                                                                                                                |
| ------------- | ---------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `audioBuffer` | `Float32Array \| number[]`         | Yes      | Audio samples to analyze. Must be non-empty and contain no more than 16384 samples. All values must be finite.                                             |
| `sampleRate`  | `number`                           | Yes      | Sample rate in Hz. Must be an integer between 8000 and 48000.                                                                                              |
| `options`     | `Partial<SpectrumAnalysisOptions>` | No       | Configuration options for spectrum analysis. See [SpectrumAnalysisOptions](#spectrumanalysisoptions). Currently unused but reserved for future extensions. |

#### Returns

`Promise<SpectrumResult>` - Resolves to a [SpectrumResult](#spectrumresult) containing spectral centroid, rolloff, and tilt values.

#### Throws

- `ValidationError` - If buffer or sample rate are invalid
- `NativeModuleError` - If native computation fails

#### Example

```typescript
import { analyzeSpectrum } from '@loqalabs/loqa-expo-dsp';

// Basic usage
const audioData = new Float32Array(2048);
// ... fill with audio samples ...

const result = await analyzeSpectrum(audioData, 44100);

console.log(`Spectral centroid: ${result.centroid} Hz`);
console.log(`Spectral rolloff: ${result.rolloff} Hz`);
console.log(`Spectral tilt: ${result.tilt}`);

// Brightness classification
if (result.centroid > 4000) {
  console.log('Bright sound (high-frequency dominant)');
} else if (result.centroid < 1500) {
  console.log('Dark sound (low-frequency dominant)');
} else {
  console.log('Balanced sound');
}

// Timbre analysis
if (result.tilt > 0) {
  console.log('More energy in high frequencies');
} else {
  console.log('More energy in low frequencies');
}
```

---

### calculateHNR

Calculates Harmonics-to-Noise Ratio (HNR) for breathiness analysis.

HNR measures the ratio of harmonic (periodic) to noise (aperiodic) energy in voice, providing a quantitative measure of breathiness. It uses Boersma's autocorrelation-based method.

Typical HNR ranges:
- **18-25 dB**: Clear, less breathy voice
- **12-18 dB**: Softer, more breathy voice
- **<10 dB**: Very breathy or pathological voice

```typescript
async function calculateHNR(
  audioBuffer: Float32Array | number[],
  options: HNROptions
): Promise<HNRResult>;
```

#### Parameters

| Parameter     | Type                       | Required | Description                                                                                                    |
| ------------- | -------------------------- | -------- | -------------------------------------------------------------------------------------------------------------- |
| `audioBuffer` | `Float32Array \| number[]` | Yes      | Audio samples to analyze. Must be non-empty and contain no more than 16384 samples. All values must be finite. |
| `options`     | `HNROptions`               | Yes      | Configuration options including sampleRate and optional frequency range. See [HNROptions](#hnroptions).        |

#### Returns

`Promise<HNRResult>` - Resolves to an [HNRResult](#hnrresult) containing HNR in dB, detected F0, and voicing status.

#### Throws

- `ValidationError` - If buffer or sample rate are invalid
- `NativeModuleError` - If native computation fails

#### Example

```typescript
import { calculateHNR } from '@loqalabs/loqa-expo-dsp';

const audioData = new Float32Array(4096);
// ... fill with audio samples ...

const result = await calculateHNR(audioData, { sampleRate: 44100 });

if (result.isVoiced) {
  console.log(`HNR: ${result.hnr} dB`);
  console.log(`Detected F0: ${result.f0} Hz`);

  if (result.hnr > 20) {
    console.log('Clear voice detected');
  } else if (result.hnr < 15) {
    console.log('Breathy voice detected');
  }
} else {
  console.log('Signal is unvoiced');
}

// With custom frequency range for low voices
const lowVoiceResult = await calculateHNR(audioData, {
  sampleRate: 44100,
  minFreq: 50,   // Lower bound for bass voices
  maxFreq: 300
});
```

---

### calculateH1H2

Calculates H1-H2 amplitude difference for vocal weight analysis.

H1-H2 measures the difference in amplitude between the first harmonic (fundamental) and second harmonic. It's a key acoustic correlate of vocal weight:
- **>5 dB**: Lighter, breathier vocal quality
- **0-5 dB**: Balanced vocal weight
- **<0 dB**: Fuller, heavier vocal quality

The function uses parabolic interpolation around the harmonic peaks for accurate sub-bin amplitude estimation.

```typescript
async function calculateH1H2(
  audioBuffer: Float32Array | number[],
  options: H1H2Options
): Promise<H1H2Result>;
```

#### Parameters

| Parameter     | Type                       | Required | Description                                                                                                    |
| ------------- | -------------------------- | -------- | -------------------------------------------------------------------------------------------------------------- |
| `audioBuffer` | `Float32Array \| number[]` | Yes      | Audio samples to analyze. Must be non-empty and contain no more than 16384 samples. All values must be finite. |
| `options`     | `H1H2Options`              | Yes      | Configuration options including sampleRate and optional pre-calculated F0. See [H1H2Options](#h1h2options).    |

#### Returns

`Promise<H1H2Result>` - Resolves to an [H1H2Result](#h1h2result) containing H1-H2 difference, individual harmonic amplitudes, and F0.

#### Throws

- `ValidationError` - If buffer or sample rate are invalid
- `NativeModuleError` - If native computation fails (e.g., unvoiced signal without provided F0)

#### Example

```typescript
import { calculateH1H2, detectPitch } from '@loqalabs/loqa-expo-dsp';

const audioData = new Float32Array(4096);
// ... fill with audio samples ...

// Option 1: Auto-detect F0
const result = await calculateH1H2(audioData, { sampleRate: 44100 });

console.log(`H1-H2: ${result.h1h2} dB`);
console.log(`H1 amplitude: ${result.h1AmplitudeDb} dB`);
console.log(`H2 amplitude: ${result.h2AmplitudeDb} dB`);

if (result.h1h2 > 5) {
  console.log('Lighter voice quality');
} else if (result.h1h2 < 0) {
  console.log('Fuller voice quality');
}

// Option 2: Provide pre-calculated F0 (more efficient if you already have it)
const pitch = await detectPitch(audioData, 44100);
if (pitch.isVoiced && pitch.frequency) {
  const result2 = await calculateH1H2(audioData, {
    sampleRate: 44100,
    f0: pitch.frequency
  });
}
```

---

## VoiceAnalyzer API

The VoiceAnalyzer API provides stateful, HMM-smoothed pitch tracking for analyzing longer audio clips. Unlike the single-shot `detectPitch()` function, the VoiceAnalyzer maintains internal state across frames for temporal coherence and provides aggregate statistics.

**Benefits over single-shot `detectPitch()`:**
- HMM state persistence between frames for smoother pitch tracks
- Better accuracy through temporal context
- Aggregate statistics (median, mean, std dev) across all frames
- Efficient batch processing of large audio clips

**Typical workflow:**
1. Create an analyzer with `createVoiceAnalyzer()`
2. Analyze clips with `analyzeClip()`
3. Reset state between independent clips with `resetVoiceAnalyzer()`
4. Free resources when done with `freeVoiceAnalyzer()`

---

### createVoiceAnalyzer

Creates a new VoiceAnalyzer instance for stateful pitch tracking.

```typescript
async function createVoiceAnalyzer(
  config: VoiceAnalyzerConfig
): Promise<VoiceAnalyzerHandle>;
```

#### Parameters

| Parameter | Type                  | Required | Description                                                      |
| --------- | --------------------- | -------- | ---------------------------------------------------------------- |
| `config`  | `VoiceAnalyzerConfig` | Yes      | Configuration options. See [VoiceAnalyzerConfig](#voiceanalyzerconfig). |

#### Returns

`Promise<VoiceAnalyzerHandle>` - Resolves to a [VoiceAnalyzerHandle](#voiceanalyzerhandle) that can be used with other VoiceAnalyzer functions.

#### Throws

- `ValidationError` - If config parameters are invalid
- `NativeModuleError` - If native creation fails

#### Example

```typescript
import { createVoiceAnalyzer, analyzeClip, freeVoiceAnalyzer } from '@loqalabs/loqa-expo-dsp';

// Create analyzer for 44.1kHz audio with default settings
const analyzer = await createVoiceAnalyzer({ sampleRate: 44100 });

try {
  // Use analyzer...
  const result = await analyzeClip(analyzer, audioSamples);
} finally {
  // Always free when done
  await freeVoiceAnalyzer(analyzer);
}

// Custom configuration for bass voices
const bassAnalyzer = await createVoiceAnalyzer({
  sampleRate: 44100,
  minFrequency: 50,   // Lower for bass voices
  maxFrequency: 300,
  frameSize: 4096,    // Larger for better low-frequency resolution
  hopSize: 1024
});
```

---

### analyzeClip

Analyzes an audio clip using the VoiceAnalyzer, returning frame-by-frame results plus aggregate statistics.

The analyzer processes the audio frame-by-frame with HMM smoothing, providing temporally coherent pitch tracking. The analyzer maintains internal state, so consecutive calls build on previous state. Call `resetVoiceAnalyzer()` to start fresh with a new independent clip.

```typescript
async function analyzeClip(
  analyzer: VoiceAnalyzerHandle,
  audioBuffer: Float32Array | number[]
): Promise<VoiceAnalyzerResult>;
```

#### Parameters

| Parameter     | Type                       | Required | Description                                                    |
| ------------- | -------------------------- | -------- | -------------------------------------------------------------- |
| `analyzer`    | `VoiceAnalyzerHandle`      | Yes      | Analyzer handle from `createVoiceAnalyzer()`                   |
| `audioBuffer` | `Float32Array \| number[]` | Yes      | Audio samples to analyze. No maximum size limit for this API.  |

#### Returns

`Promise<VoiceAnalyzerResult>` - Resolves to a [VoiceAnalyzerResult](#voiceanalyzerresult) containing frame results and aggregate statistics.

#### Throws

- `ValidationError` - If analyzer handle or buffer is invalid
- `NativeModuleError` - If native analysis fails

#### Example

```typescript
import { createVoiceAnalyzer, analyzeClip, freeVoiceAnalyzer } from '@loqalabs/loqa-expo-dsp';

const analyzer = await createVoiceAnalyzer({ sampleRate: 44100 });

try {
  // Analyze a recorded clip (can be much larger than 16384 samples)
  const result = await analyzeClip(analyzer, audioSamples);

  console.log(`Analyzed ${result.frameCount} frames`);
  console.log(`Voiced: ${result.voicedFrameCount} frames`);

  if (result.medianPitch !== null) {
    console.log(`Median pitch: ${result.medianPitch.toFixed(1)} Hz`);
    console.log(`Mean pitch: ${result.meanPitch?.toFixed(1)} Hz`);
    console.log(`Pitch std dev: ${result.pitchStdDev?.toFixed(1)} Hz`);
    console.log(`Mean confidence: ${result.meanConfidence?.toFixed(2)}`);
  }

  // Access individual frames for detailed analysis
  for (const frame of result.frames) {
    if (frame.isVoiced && frame.frequency !== null) {
      console.log(`${frame.frequency.toFixed(1)} Hz (conf: ${frame.confidence.toFixed(2)})`);
    }
  }
} finally {
  await freeVoiceAnalyzer(analyzer);
}
```

---

### processBuffer

Processes a complete audio buffer with HMM-smoothed Viterbi decoding for globally optimal pitch tracking.

Unlike `analyzeClip()` which processes frames independently, `processBuffer()` uses Viterbi decoding to find the globally optimal pitch track across all frames. This significantly reduces octave jump errors (from ~8-12% to ≤3%) and produces smoother pitch contours.

**Key differences from `analyzeClip()`:**

- Uses Viterbi decoding for globally optimal pitch track
- Octave jump rate reduced from ~8-12% to ≤3%
- Always uses pYIN algorithm regardless of config settings
- Higher latency (must see entire buffer) but better accuracy
- Returns raw pitch data as Float32Arrays (more memory efficient)

Best suited for offline analysis of complete utterances (typically < 60 seconds). For longer recordings, segment into utterances first.

```typescript
async function processBuffer(
  analyzer: VoiceAnalyzerHandle,
  audioBuffer: Float32Array | number[]
): Promise<PitchTrack>;
```

#### Parameters

| Parameter     | Type                       | Required | Description                                                     |
| ------------- | -------------------------- | -------- | --------------------------------------------------------------- |
| `analyzer`    | `VoiceAnalyzerHandle`      | Yes      | Analyzer handle from `createVoiceAnalyzer()`                    |
| `audioBuffer` | `Float32Array \| number[]` | Yes      | Complete audio buffer to analyze (< 60 seconds recommended)     |

#### Returns

`Promise<PitchTrack>` - Resolves to a [PitchTrack](#pitchtrack) containing the optimal pitch track and statistics.

#### Throws

- `ValidationError` - If analyzer handle or buffer is invalid
- `NativeModuleError` - If native processing fails

#### Example

```typescript
import { createVoiceAnalyzer, processBuffer, freeVoiceAnalyzer } from '@loqalabs/loqa-expo-dsp';

const analyzer = await createVoiceAnalyzer({ sampleRate: 44100 });

try {
  // Process with Viterbi decoding for optimal pitch track
  const track = await processBuffer(analyzer, audioSamples);

  console.log(`Analyzed ${track.frameCount} frames`);
  console.log(`Voiced: ${track.voicedFrameCount} frames`);

  if (track.medianPitch !== null) {
    console.log(`Median pitch: ${track.medianPitch.toFixed(1)} Hz`);
  }

  // Access raw pitch track data (Float32Arrays for efficiency)
  for (let i = 0; i < track.pitchTrack.length; i++) {
    const pitch = track.pitchTrack[i];
    const prob = track.voicedProbabilities[i];
    const time = track.timestamps[i];

    if (pitch > 0) {
      console.log(`t=${time.toFixed(3)}s: ${pitch.toFixed(1)} Hz (${(prob * 100).toFixed(0)}% voiced)`);
    }
  }
} finally {
  await freeVoiceAnalyzer(analyzer);
}
```

---

### resetVoiceAnalyzer

Resets the VoiceAnalyzer state for reuse with new, independent audio.

Call this between analyzing different audio clips to ensure the HMM state from one clip doesn't affect the next. If analyzing consecutive segments of the same audio (e.g., streaming), do NOT reset - let the state carry over for temporal continuity.

```typescript
async function resetVoiceAnalyzer(
  analyzer: VoiceAnalyzerHandle
): Promise<void>;
```

#### Parameters

| Parameter  | Type                  | Required | Description                                  |
| ---------- | --------------------- | -------- | -------------------------------------------- |
| `analyzer` | `VoiceAnalyzerHandle` | Yes      | Analyzer handle from `createVoiceAnalyzer()` |

#### Throws

- `ValidationError` - If analyzer handle is invalid
- `NativeModuleError` - If native reset fails

#### Example

```typescript
import { createVoiceAnalyzer, analyzeClip, resetVoiceAnalyzer, freeVoiceAnalyzer } from '@loqalabs/loqa-expo-dsp';

const analyzer = await createVoiceAnalyzer({ sampleRate: 44100 });

try {
  // Analyze first clip
  const result1 = await analyzeClip(analyzer, clip1Samples);
  console.log(`Clip 1 median: ${result1.medianPitch} Hz`);

  // Reset for independent second clip
  await resetVoiceAnalyzer(analyzer);

  // Analyze second clip with fresh state
  const result2 = await analyzeClip(analyzer, clip2Samples);
  console.log(`Clip 2 median: ${result2.medianPitch} Hz`);
} finally {
  await freeVoiceAnalyzer(analyzer);
}
```

---

### freeVoiceAnalyzer

Frees a VoiceAnalyzer instance and releases native resources.

Always call this when done with an analyzer to prevent memory leaks. After calling this, the analyzer handle should not be used again.

```typescript
async function freeVoiceAnalyzer(
  analyzer: VoiceAnalyzerHandle
): Promise<void>;
```

#### Parameters

| Parameter  | Type                  | Required | Description                                  |
| ---------- | --------------------- | -------- | -------------------------------------------- |
| `analyzer` | `VoiceAnalyzerHandle` | Yes      | Analyzer handle from `createVoiceAnalyzer()` |

#### Throws

- `ValidationError` - If analyzer handle is invalid
- `NativeModuleError` - If native free fails

#### Example

```typescript
import { createVoiceAnalyzer, analyzeClip, freeVoiceAnalyzer } from '@loqalabs/loqa-expo-dsp';

// Pattern 1: try/finally
const analyzer = await createVoiceAnalyzer({ sampleRate: 44100 });
try {
  const result = await analyzeClip(analyzer, samples);
  // ... use result ...
} finally {
  await freeVoiceAnalyzer(analyzer);
}

// Pattern 2: React useEffect cleanup
useEffect(() => {
  let analyzer: VoiceAnalyzerHandle | null = null;

  const init = async () => {
    analyzer = await createVoiceAnalyzer({ sampleRate: 44100 });
    // ... use analyzer ...
  };

  init();

  return () => {
    if (analyzer) {
      freeVoiceAnalyzer(analyzer);
    }
  };
}, []);
```

---

## Types

### FFTOptions

Configuration options for FFT computation.

```typescript
interface FFTOptions {
  fftSize?: number;
  windowType?: 'hanning' | 'hamming' | 'blackman' | 'none';
  includePhase?: boolean;
}
```

#### Properties

| Property       | Type                                             | Default              | Description                                                                                                                                                                                                                                                                           |
| -------------- | ------------------------------------------------ | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fftSize`      | `number`                                         | `audioBuffer.length` | FFT size. Must be a power of 2 between 256 and 8192. Larger sizes provide better frequency resolution but lower time resolution.                                                                                                                                                      |
| `windowType`   | `'hanning' \| 'hamming' \| 'blackman' \| 'none'` | `'hanning'`          | Window function type. **'hanning'**: Good general-purpose window (default). **'hamming'**: Similar to Hanning, slightly different sidelobe behavior. **'blackman'**: Better frequency resolution, more attenuation. **'none'**: Rectangular window (use only for perfect sine waves). |
| `includePhase` | `boolean`                                        | `false`              | Whether to return phase information. Set to `true` only if you need phase data, as it increases computation time.                                                                                                                                                                     |

#### Validation Rules

- `fftSize` must be an integer
- `fftSize` must be a power of 2
- `fftSize` must be between 256 and 8192

---

### FFTResult

Result of FFT computation.

Contains frequency-domain representation of the input audio signal.

```typescript
interface FFTResult {
  magnitude: Float32Array;
  phase?: Float32Array;
  frequencies: Float32Array;
}
```

#### Properties

| Property      | Type                      | Description                                                                                                                                                                                          |
| ------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `magnitude`   | `Float32Array`            | Magnitude spectrum (length = `fftSize / 2`). Each element represents the amplitude at the corresponding frequency. Higher values indicate stronger presence of that frequency component.             |
| `phase`       | `Float32Array` (optional) | Phase spectrum (only present if `includePhase: true`). Each element represents the phase angle in radians at the corresponding frequency. Useful for signal reconstruction and phase-based analysis. |
| `frequencies` | `Float32Array`            | Frequency bin centers in Hz (length = `fftSize / 2`). Each element corresponds to the center frequency of each magnitude/phase bin. Use this array to map magnitude values to their frequencies.     |

---

### PitchDetectionOptions

Configuration options for pitch detection.

```typescript
interface PitchDetectionOptions {
  sampleRate: number;
  minFrequency?: number;
  maxFrequency?: number;
}
```

#### Properties

| Property       | Type     | Default    | Description                                                                                                                                                    |
| -------------- | -------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sampleRate`   | `number` | (required) | Sample rate in Hz. Must be an integer between 8000 and 48000.                                                                                                  |
| `minFrequency` | `number` | `80`       | Minimum detectable frequency in Hz. Default value is optimized for human voice (80 Hz ≈ low male voice). Passed to the pYIN algorithm for efficient search.    |
| `maxFrequency` | `number` | `400`      | Maximum detectable frequency in Hz. Default value is optimized for human voice (400 Hz ≈ high female voice). Passed to the pYIN algorithm for efficient search. |

#### Validation Rules

- `sampleRate` must be an integer between 8000 and 48000
- `minFrequency` and `maxFrequency` must be positive
- `minFrequency` must be less than `maxFrequency`

---

### PitchResult

Result of pitch detection.

```typescript
interface PitchResult {
  frequency: number | null;
  confidence: number;
  isVoiced: boolean;
  voicedProbability: number;
}
```

#### Properties

| Property            | Type             | Description                                                                                                                                                                            |
| ------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `frequency`         | `number \| null` | Detected pitch in Hz. `null` if no pitch was detected (unvoiced segment or below confidence threshold).                                                                                |
| `confidence`        | `number`         | Confidence score (0-1). Values closer to 1 indicate higher confidence in the detected pitch. Values below ~0.5 typically indicate unvoiced segments or unreliable pitch.               |
| `isVoiced`          | `boolean`        | Whether the audio segment is voiced. `true` indicates periodic signal (likely speech or musical note), `false` indicates non-periodic signal (silence, noise, or unvoiced consonants). |
| `voicedProbability` | `number`         | Probabilistic voiced/unvoiced decision (0-1). Added in v0.3.0 with pYIN algorithm. Values closer to 1 indicate higher probability of voiced speech. Provides a "soft" decision compared to the binary `isVoiced` flag. |

---

### FormantExtractionOptions

Configuration options for formant extraction.

```typescript
interface FormantExtractionOptions {
  sampleRate: number;
  lpcOrder?: number;
}
```

#### Properties

| Property     | Type     | Default                             | Description                                                                                                                                                                                                                |
| ------------ | -------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sampleRate` | `number` | (required)                          | Sample rate in Hz. Must be an integer between 8000 and 48000.                                                                                                                                                              |
| `lpcOrder`   | `number` | `min(24, Math.floor(sampleRate / 1000) + 2)` | LPC (Linear Predictive Coding) order. Must be between 10 and 24. Higher values provide better formant resolution but can cause numerical instability. Values outside 10-24 are automatically clamped. |

#### Default LPC Order Values

| Sample Rate | Default LPC Order |
| ----------- | ----------------- |
| 8000 Hz     | 10                |
| 16000 Hz    | 18                |
| 22050 Hz    | 24                |
| 44100 Hz    | 24 (capped)       |
| 48000 Hz    | 24 (capped)       |

#### Validation Rules

- `sampleRate` must be an integer between 8000 and 48000
- `lpcOrder` must be between 10 and 24 (values outside this range are clamped)

---

### FormantsResult

Result of formant extraction.

> **Breaking Change in v0.3.0**: The `bandwidths` object has been replaced with a single `confidence` score. This change reflects the upstream loqa-voice-dsp v0.4.0 API.

```typescript
interface FormantsResult {
  f1: number;
  f2: number;
  f3: number;
  confidence: number;
}
```

#### Properties

| Property     | Type     | Description                                                                                                                                                      |
| ------------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `f1`         | `number` | First formant (F1) in Hz. Typically 200-1000 Hz for speech. Correlates with vowel height (low F1 = high vowels like /i/, high F1 = low vowels like /a/).         |
| `f2`         | `number` | Second formant (F2) in Hz. Typically 600-3000 Hz for speech. Correlates with vowel frontness (low F2 = back vowels like /u/, high F2 = front vowels like /i/).   |
| `f3`         | `number` | Third formant (F3) in Hz. Typically 1500-4000 Hz for speech. Less variable than F1/F2 but useful for distinguishing certain consonants (especially /r/ and /l/). |
| `confidence` | `number` | Confidence score (0-1) indicating reliability of formant detection. Higher values indicate more reliable detection. Added in v0.3.0, replacing the previous `bandwidths` object. |

---

### SpectrumAnalysisOptions

Configuration options for spectrum analysis.

```typescript
interface SpectrumAnalysisOptions {
  sampleRate: number;
}
```

#### Properties

| Property     | Type     | Description                                                   |
| ------------ | -------- | ------------------------------------------------------------- |
| `sampleRate` | `number` | Sample rate in Hz. Must be an integer between 8000 and 48000. |

#### Validation Rules

- `sampleRate` must be an integer between 8000 and 48000

---

### SpectrumResult

Result of spectrum analysis.

```typescript
interface SpectrumResult {
  centroid: number;
  rolloff: number;
  tilt: number;
}
```

#### Properties

| Property   | Type     | Description                                                                                                                                                                                                                                                                                                                                        |
| ---------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `centroid` | `number` | Spectral centroid in Hz (brightness measure). Represents the "center of mass" of the spectrum. Higher values indicate brighter sounds (more high-frequency content), lower values indicate darker sounds (more low-frequency content). Typical ranges: Speech ~1500-3000 Hz, Bright instruments (cymbals) ~6000+ Hz, Bass instruments ~200-500 Hz. |
| `rolloff`  | `number` | Spectral rolloff in Hz (95% energy threshold). Frequency below which 95% of the signal's energy is concentrated. Useful for distinguishing harmonic content from noise. Lower values indicate most energy is in low frequencies.                                                                                                                   |
| `tilt`     | `number` | Spectral tilt (slope of spectrum). Measures the overall slope of the magnitude spectrum. **Positive values**: More energy in high frequencies (bright timbre). **Negative values**: More energy in low frequencies (dark timbre). **Near zero**: Balanced spectrum (white noise-like).                                                             |

---

### HNROptions

Configuration options for HNR (Harmonics-to-Noise Ratio) calculation.

```typescript
interface HNROptions {
  sampleRate: number;
  minFreq?: number;
  maxFreq?: number;
}
```

#### Properties

| Property     | Type     | Default | Description                                                                                                 |
| ------------ | -------- | ------- | ----------------------------------------------------------------------------------------------------------- |
| `sampleRate` | `number` | (required) | Sample rate in Hz. Must be an integer between 8000 and 48000.                                            |
| `minFreq`    | `number` | `75`    | Minimum fundamental frequency to search in Hz. Lower values may be needed for very low voices.              |
| `maxFreq`    | `number` | `500`   | Maximum fundamental frequency to search in Hz. Higher values may be needed for very high voices or children. |

---

### HNRResult

Result of HNR (Harmonics-to-Noise Ratio) calculation.

```typescript
interface HNRResult {
  hnr: number;
  f0: number;
  isVoiced: boolean;
}
```

#### Properties

| Property   | Type      | Description                                                                                                                                                              |
| ---------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `hnr`      | `number`  | Harmonics-to-Noise Ratio in decibels (dB). Typical ranges: 12-18 dB (breathy voice), 18-25 dB (clear voice), 0 dB (returned for unvoiced signals).                       |
| `f0`       | `number`  | Detected fundamental frequency in Hz. This is the F0 used for HNR calculation. Returns 0 if signal is unvoiced.                                                         |
| `isVoiced` | `boolean` | Whether the signal is voiced (periodic). If false, the signal is either unvoiced (noise, whisper) or below the voicing threshold.                                        |

---

### H1H2Options

Configuration options for H1-H2 amplitude difference calculation.

```typescript
interface H1H2Options {
  sampleRate: number;
  f0?: number;
}
```

#### Properties

| Property     | Type     | Default    | Description                                                                                                                              |
| ------------ | -------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `sampleRate` | `number` | (required) | Sample rate in Hz. Must be an integer between 8000 and 48000.                                                                            |
| `f0`         | `number` | (auto)     | Optional pre-calculated fundamental frequency in Hz. If provided, skips F0 detection (faster). If omitted or 0, F0 will be auto-detected. |

---

### H1H2Result

Result of H1-H2 amplitude difference calculation.

```typescript
interface H1H2Result {
  h1h2: number;
  h1AmplitudeDb: number;
  h2AmplitudeDb: number;
  f0: number;
}
```

#### Properties

| Property        | Type     | Description                                                                                                                          |
| --------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `h1h2`          | `number` | H1-H2 amplitude difference in dB (H1_amplitude - H2_amplitude). >5 dB = lighter quality, 0-5 dB = balanced, <0 dB = fuller quality.  |
| `h1AmplitudeDb` | `number` | First harmonic (fundamental) amplitude in dB. This is the amplitude at the F0 frequency.                                            |
| `h2AmplitudeDb` | `number` | Second harmonic amplitude in dB. This is the amplitude at 2*F0 frequency.                                                            |
| `f0`            | `number` | Fundamental frequency used for calculation in Hz. Either the provided F0 or the auto-detected value.                                 |

---

### VoiceAnalyzerConfig

Configuration options for VoiceAnalyzer creation.

```typescript
interface VoiceAnalyzerConfig {
  sampleRate: number;
  minFrequency?: number;
  maxFrequency?: number;
  frameSize?: number;
  hopSize?: number;
}
```

#### Properties

| Property       | Type     | Default          | Description                                                                                                                                           |
| -------------- | -------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sampleRate`   | `number` | (required)       | Sample rate in Hz. Must be an integer between 8000 and 48000.                                                                                         |
| `minFrequency` | `number` | `80`             | Minimum detectable frequency in Hz. Default is optimized for human voice (80 Hz ≈ low male voice).                                                    |
| `maxFrequency` | `number` | `400`            | Maximum detectable frequency in Hz. Default is optimized for human voice (400 Hz ≈ high female voice).                                                |
| `frameSize`    | `number` | `2048`           | Frame size in samples (~46ms at 44100 Hz). Larger frames provide better frequency resolution but lower time resolution.                               |
| `hopSize`      | `number` | `frameSize / 4`  | Hop size in samples between consecutive frames. Default gives 75% overlap. Smaller hop sizes provide smoother pitch tracks but more computation.      |

#### Config Validation

- `sampleRate` must be an integer between 8000 and 48000
- `minFrequency` must be positive
- `maxFrequency` must be greater than `minFrequency`
- `frameSize` must be a positive integer
- `hopSize` must be a positive integer

---

### VoiceAnalyzerHandle

Opaque handle to a VoiceAnalyzer instance.

```typescript
interface VoiceAnalyzerHandle {
  id: string;
  config: VoiceAnalyzerConfig;
}
```

#### Properties

| Property | Type                  | Description                                  |
| -------- | --------------------- | -------------------------------------------- |
| `id`     | `string`              | Unique identifier for this analyzer instance |
| `config` | `VoiceAnalyzerConfig` | Configuration used to create this analyzer   |

> **Note**: The handle contains an internal reference to native resources. Always call `freeVoiceAnalyzer()` when done to release these resources.

---

### VoiceAnalyzerResult

Result of analyzing a clip with VoiceAnalyzer.

Contains an array of pitch results for each frame, plus aggregate statistics across all voiced frames.

```typescript
interface VoiceAnalyzerResult {
  frames: PitchResult[];
  frameCount: number;
  voicedFrameCount: number;
  medianPitch: number | null;
  meanPitch: number | null;
  pitchStdDev: number | null;
  meanConfidence: number | null;
  meanVoicedProbability: number;
}
```

#### Properties

| Property                | Type             | Description                                                                                                       |
| ----------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------- |
| `frames`                | `PitchResult[]`  | Array of pitch results for each analyzed frame. Frames are analyzed with HMM smoothing for temporal coherence.    |
| `frameCount`            | `number`         | Total number of frames analyzed.                                                                                  |
| `voicedFrameCount`      | `number`         | Number of frames detected as voiced.                                                                              |
| `medianPitch`           | `number \| null` | Median pitch across all voiced frames in Hz. `null` if no voiced frames. Use this as the primary pitch estimate.  |
| `meanPitch`             | `number \| null` | Mean pitch across all voiced frames in Hz. `null` if no voiced frames.                                            |
| `pitchStdDev`           | `number \| null` | Standard deviation of pitch across voiced frames in Hz. `null` if fewer than 2 voiced frames. Lower = more stable. |
| `meanConfidence`        | `number \| null` | Mean confidence across all voiced frames (0-1). `null` if no voiced frames.                                       |
| `meanVoicedProbability` | `number`         | Mean voiced probability across all frames (0-1). Higher values indicate more of the clip was voiced.              |

#### Usage Notes

- **`medianPitch`** is recommended over `meanPitch` as it's more robust to outliers
- **`pitchStdDev`** indicates pitch stability - lower values suggest steady pitch, higher values suggest variation or vibrato
- **`meanVoicedProbability`** helps assess overall signal quality - very low values may indicate background noise or silence

---

### PitchTrack

Result of processing a buffer with Viterbi decoding via `processBuffer()`.

Contains the globally optimal pitch track computed via HMM-smoothed Viterbi decoding, along with voiced probabilities and timestamps. Unlike `VoiceAnalyzerResult`, this uses Float32Arrays for memory efficiency.

```typescript
interface PitchTrack {
  pitchTrack: Float32Array;
  voicedProbabilities: Float32Array;
  timestamps: Float32Array;
  frameCount: number;
  voicedFrameCount: number;
  medianPitch: number | null;
  meanPitch: number | null;
}
```

#### Properties

| Property              | Type             | Description                                                                                              |
| --------------------- | ---------------- | -------------------------------------------------------------------------------------------------------- |
| `pitchTrack`          | `Float32Array`   | Pitch estimates per frame in Hz (0.0 = unvoiced). Globally optimal track via Viterbi decoding.          |
| `voicedProbabilities` | `Float32Array`   | Voiced probability per frame [0.0, 1.0]. Higher values indicate higher confidence in voicing.           |
| `timestamps`          | `Float32Array`   | Frame timestamps in seconds from buffer start. Computed as `frame_index * hop_size / sample_rate`.      |
| `frameCount`          | `number`         | Total number of frames analyzed.                                                                         |
| `voicedFrameCount`    | `number`         | Number of voiced frames (where pitch > 0).                                                               |
| `medianPitch`         | `number \| null` | Median pitch across voiced frames in Hz. `null` if no voiced frames.                                     |
| `meanPitch`           | `number \| null` | Mean pitch across voiced frames in Hz. `null` if no voiced frames.                                       |

#### Usage Notes

- **`pitchTrack`** contains the globally optimal pitch track - octave jumps are reduced from ~8-12% to ≤3% compared to frame-by-frame analysis
- Use **Float32Array** methods like `forEach()`, indexing with `[]`, or spread operator `[...track.pitchTrack]` to access data
- **`timestamps`** allows plotting pitch contours over time
- For real-time streaming, use `analyzeClip()` instead; `processBuffer()` is best for offline analysis

---

## Error Handling

All functions in @loqalabs/loqa-expo-dsp throw typed errors that extend the base `LoqaExpoDspError` class. Errors include detailed context information to help diagnose issues.

### LoqaExpoDspError

Base error class for all LoqaExpoDsp errors.

```typescript
class LoqaExpoDspError extends Error {
  constructor(message: string, public code: string, public details?: Record<string, unknown>);
}
```

#### Properties

| Property  | Type                      | Description                                |
| --------- | ------------------------- | ------------------------------------------ |
| `message` | `string`                  | Human-readable error message               |
| `code`    | `string`                  | Error code for programmatic error handling |
| `details` | `Record<string, unknown>` | Additional error details for debugging     |
| `name`    | `string`                  | Error class name (`'LoqaExpoDspError'`)    |

---

### ValidationError

Error thrown when input validation fails.

This error indicates that the provided input parameters did not meet the required constraints (e.g., buffer size, sample rate range, FFT size).

```typescript
class ValidationError extends LoqaExpoDspError {
  constructor(message: string, details?: Record<string, unknown>);
}
```

#### Properties

| Property  | Type                      | Description                                                |
| --------- | ------------------------- | ---------------------------------------------------------- |
| `code`    | `string`                  | Always `'VALIDATION_ERROR'`                                |
| `name`    | `string`                  | Always `'ValidationError'`                                 |
| `message` | `string`                  | Description of the validation failure                      |
| `details` | `Record<string, unknown>` | Additional context (e.g., invalid values, expected ranges) |

#### Common Validation Errors

| Error Message                                     | Cause                              | Solution                                                     |
| ------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------ |
| `'Audio buffer cannot be null or undefined'`      | Buffer parameter is null/undefined | Provide a valid Float32Array or number[]                     |
| `'Audio buffer cannot be empty'`                  | Buffer has length 0                | Ensure buffer contains audio samples                         |
| `'Buffer too large (max 16384 samples)'`          | Buffer exceeds maximum size        | Split buffer into chunks ≤16384 samples                      |
| `'Buffer contains NaN or Infinity values'`        | Invalid numeric values in buffer   | Check audio source for corruption                            |
| `'Sample rate must be an integer'`                | Non-integer sample rate            | Use integer sample rate (e.g., 44100, not 44100.5)           |
| `'Sample rate must be between 8000 and 48000 Hz'` | Sample rate out of range           | Use standard sample rates (8000, 16000, 22050, 44100, 48000) |
| `'FFT size must be a power of 2'`                 | Invalid FFT size                   | Use powers of 2 (256, 512, 1024, 2048, 4096, 8192)           |
| `'FFT size must be between 256 and 8192'`         | FFT size out of range              | Use FFT size between 256 and 8192                            |

#### Example

```typescript
import { computeFFT, ValidationError } from '@loqalabs/loqa-expo-dsp';

try {
  const result = await computeFFT(audioBuffer, { fftSize: 1000 });
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation failed:', error.message);
    console.error('Error code:', error.code); // 'VALIDATION_ERROR'
    console.error('Details:', error.details); // { fftSize: 1000 }
  }
}
```

---

### NativeModuleError

Error thrown when native module operations fail.

This error wraps errors that occur in the native iOS or Android code, providing context about the failure and suggestions for resolution.

```typescript
class NativeModuleError extends LoqaExpoDspError {
  constructor(message: string, details?: Record<string, unknown>);
}
```

#### Properties

| Property  | Type                      | Description                                                  |
| --------- | ------------------------- | ------------------------------------------------------------ |
| `code`    | `string`                  | Always `'NATIVE_MODULE_ERROR'`                               |
| `name`    | `string`                  | Always `'NativeModuleError'`                                 |
| `message` | `string`                  | Description of the native module failure                     |
| `details` | `Record<string, unknown>` | Additional context (e.g., original native error, parameters) |

#### Common Native Module Errors

| Error Prefix                   | Cause                             | Solution                                                        |
| ------------------------------ | --------------------------------- | --------------------------------------------------------------- |
| `'FFT computation failed:'`    | Native FFT computation error      | Check buffer data validity, ensure module is properly installed |
| `'Pitch detection failed:'`    | Native pitch detection error      | Ensure audio contains periodic signal, check frequency range    |
| `'Formant extraction failed:'` | Native LPC analysis error         | Ensure audio contains voiced speech, check LPC order            |
| `'Spectrum analysis failed:'`  | Native spectrum computation error | Check buffer data validity                                      |

#### Example

```typescript
import { computeFFT, NativeModuleError } from '@loqalabs/loqa-expo-dsp';

try {
  const result = await computeFFT(audioBuffer);
} catch (error) {
  if (error instanceof NativeModuleError) {
    console.error('Native module failed:', error.message);
    console.error('Error code:', error.code); // 'NATIVE_MODULE_ERROR'
    console.error('Details:', error.details);
    // Details include: originalError, fftSize, windowType, bufferLength, etc.
  }
}
```

---

## Validation Rules

### Audio Buffer Validation

All audio buffers passed to API functions must meet these requirements:

| Rule              | Constraint                                      | Validation                                   |
| ----------------- | ----------------------------------------------- | -------------------------------------------- |
| **Non-null**      | Buffer cannot be null or undefined              | `if (!buffer)`                               |
| **Non-empty**     | Buffer must contain at least 1 sample           | `buffer.length > 0`                          |
| **Maximum size**  | Buffer cannot exceed 16384 samples              | `buffer.length <= 16384`                     |
| **Finite values** | All samples must be finite (no NaN or Infinity) | `Array.from(buffer).every(v => isFinite(v))` |
| **Type**          | Must be Float32Array or number[]                | Accepted by all functions                    |

### Sample Rate Validation

Sample rates must meet these requirements:

| Rule        | Constraint                | Common Values                    |
| ----------- | ------------------------- | -------------------------------- |
| **Integer** | Must be a whole number    | Use `Math.round()` if needed     |
| **Range**   | Between 8000 and 48000 Hz | 8000, 16000, 22050, 44100, 48000 |

### FFT Size Validation

FFT sizes must meet these requirements:

| Rule           | Constraint                     | Valid Values                                    |
| -------------- | ------------------------------ | ----------------------------------------------- |
| **Integer**    | Must be a whole number         | 256, 512, 1024, 2048, 4096, 8192                |
| **Power of 2** | Must be 2^n where n is integer | Use formula: `2 ** Math.round(Math.log2(size))` |
| **Range**      | Between 256 and 8192           | Common: 512, 1024, 2048, 4096                   |

### Frequency Range Validation (Pitch Detection)

Frequency ranges must meet these requirements:

| Rule         | Constraint                   | Typical Ranges                                                                           |
| ------------ | ---------------------------- | ---------------------------------------------------------------------------------------- |
| **Positive** | Both min and max must be > 0 | Human voice: 80-400 Hz<br>Bass instruments: 40-250 Hz<br>Musical instruments: 27-4186 Hz |
| **Ordered**  | minFrequency < maxFrequency  | Ensure min is always less than max                                                       |

### LPC Order Validation (Formant Extraction)

LPC order must meet these requirements:

| Rule         | Constraint       | Recommended Values                                                                              |
| ------------ | ---------------- | ----------------------------------------------------------------------------------------------- |
| **Range**    | Must be 10-24    | Values outside this range are automatically clamped to prevent numerical instability            |
| **Default**  | Auto-calculated  | `min(24, Math.floor(sampleRate / 1000) + 2)` - capped at 24 for high sample rates              |

---

## Performance Considerations

### Processing Latency

All functions are optimized for sub-5ms processing latency on typical mobile devices:

| Function          | Typical Latency (2048 samples) | Notes                                        |
| ----------------- | ------------------------------ | -------------------------------------------- |
| `computeFFT`      | 1-3 ms                         | Depends on FFT size and includePhase option  |
| `detectPitch`     | 2-4 ms                         | YIN algorithm is optimized for real-time use |
| `extractFormants` | 2-5 ms                         | LPC analysis with default order              |
| `analyzeSpectrum` | 1-3 ms                         | Efficient spectral feature extraction        |

### Memory Usage

Memory usage is proportional to buffer size and options:

| Function          | Memory Usage (2048 samples) | Scalability     |
| ----------------- | --------------------------- | --------------- |
| `computeFFT`      | ~8-16 KB                    | O(fftSize)      |
| `detectPitch`     | ~4-8 KB                     | O(bufferLength) |
| `extractFormants` | ~4-8 KB                     | O(lpcOrder)     |
| `analyzeSpectrum` | ~4-8 KB                     | O(bufferLength) |

### Best Practices

1. **Buffer Size**: Use buffers between 1024-2048 samples for real-time analysis
2. **Reuse Buffers**: Reuse Float32Array instances to minimize allocations
3. **Batch Processing**: Process multiple buffers in parallel for offline analysis
4. **Error Handling**: Always catch errors to prevent crashes
5. **Validation**: Validate inputs early to fail fast with clear messages

---

## Version History

- **0.3.0** (2025-12-08): **BREAKING CHANGES** - Updated for loqa-voice-dsp v0.4.0:
  - **NEW**: VoiceAnalyzer streaming API for analyzing longer audio clips with HMM-smoothed pitch tracking
    - `createVoiceAnalyzer()`, `analyzeClip()`, `resetVoiceAnalyzer()`, `freeVoiceAnalyzer()`
    - Provides aggregate statistics (median, mean, std dev) across all frames
    - Better accuracy for full-clip analysis vs single-shot `detectPitch()`
  - `detectPitch` now uses pYIN algorithm with HMM smoothing (improved accuracy)
  - `detectPitch` now passes `minFrequency`/`maxFrequency` to the native algorithm
  - Added `voicedProbability` to `PitchResult` for soft voiced/unvoiced decisions
  - **BREAKING**: `FormantsResult.bandwidths` replaced with `FormantsResult.confidence`
  - All native FFI function names updated from `*_rust` to `loqa_*`
- **0.2.11** (2025-12-07): Fixed LPC order stability (capped at 10-24), added buffer size guidance for pitch detection
- **0.2.0** (2025-11-25): Added calculateHNR and calculateH1H2 functions for voice quality analysis
- **0.1.0** (2025-11-20): Initial release with computeFFT, detectPitch, extractFormants, analyzeSpectrum

---

For integration patterns and usage examples, see [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md).
For general information and quick start, see [README.md](../README.md).
