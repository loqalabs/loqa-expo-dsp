# @loqalabs/loqa-expo-dsp

[![npm version](https://img.shields.io/npm/v/@loqalabs/loqa-expo-dsp.svg)](https://www.npmjs.com/package/@loqalabs/loqa-expo-dsp)
[![license](https://img.shields.io/npm/l/@loqalabs/loqa-expo-dsp.svg)](https://github.com/loqalabs/loqa-expo-dsp/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@loqalabs/loqa-expo-dsp.svg)](https://www.npmjs.com/package/@loqalabs/loqa-expo-dsp)

Production-grade Expo native module for audio DSP analysis.

## Overview

**@loqalabs/loqa-expo-dsp** provides high-performance audio Digital Signal Processing (DSP) functions for React Native/Expo applications. It wraps the [loqa-voice-dsp](https://github.com/loqalabs/loqa) Rust crate with native iOS (Swift) and Android (Kotlin) bindings.

### DSP Functions

- **FFT Analysis** - `computeFFT()`: Fast Fourier Transform for frequency spectrum
- **Pitch Detection** - `detectPitch()`: pYIN algorithm for fundamental frequency
- **Formant Extraction** - `extractFormants()`: LPC-based formant analysis (F1, F2, F3)
- **Spectral Analysis** - `analyzeSpectrum()`: Spectral centroid, tilt, rolloff
- **HNR Analysis** - `calculateHNR()`: Harmonics-to-Noise Ratio for breathiness measurement
- **H1-H2 Calculation** - `calculateH1H2()`: First/second harmonic amplitude difference for vocal weight
- **VoiceAnalyzer** - `createVoiceAnalyzer()`: Streaming pitch analysis with HMM smoothing for accurate tracking across clips
- **Offline Pitch Tracking** - `processBuffer()`: Viterbi-decoded globally optimal pitch tracks (v0.5.0+)

### Companion Package

Works seamlessly with [@loqalabs/loqa-audio-bridge](https://github.com/loqalabs/loqa-audio-bridge) for real-time audio streaming:

```typescript
import { startAudioStream, addAudioSampleListener } from '@loqalabs/loqa-audio-bridge';
import { detectPitch, computeFFT } from '@loqalabs/loqa-expo-dsp';

// Stream audio from microphone
await startAudioStream({ sampleRate: 16000, bufferSize: 2048 });

// Analyze each audio buffer
addAudioSampleListener((event) => {
  const pitch = detectPitch(event.samples, event.sampleRate);
  const spectrum = computeFFT(event.samples, 2048);

  console.log(`Detected pitch: ${pitch.frequency} Hz (confidence: ${pitch.confidence})`);
});
```

## Installation

```bash
npx expo install @loqalabs/loqa-expo-dsp
```

## Quick Start

### FFT Analysis Example

```typescript
import { computeFFT } from '@loqalabs/loqa-expo-dsp';

// Example: Analyze audio frequency content
const audioBuffer = new Float32Array(2048); // Your audio samples
// ... fill buffer with audio data from microphone or file ...

// Compute FFT with options
const result = await computeFFT(audioBuffer, {
  fftSize: 2048,
  windowType: 'hanning',
  includePhase: false,
});

// Find the dominant frequency
const maxMagnitudeIndex = result.magnitude.indexOf(Math.max(...result.magnitude));
const dominantFrequency = result.frequencies[maxMagnitudeIndex];

console.log(`Dominant frequency: ${dominantFrequency.toFixed(2)} Hz`);
console.log(`Magnitude bins: ${result.magnitude.length}`);
console.log(
  `Frequency range: ${result.frequencies[0]} Hz - ${
    result.frequencies[result.frequencies.length - 1]
  } Hz`
);
```

### Pitch Detection Example (Voice Analysis)

```typescript
import { detectPitch } from '@loqalabs/loqa-expo-dsp';

// Example: Real-time pitch detection for a tuner app
const audioBuffer = new Float32Array(2048); // Your audio samples
// ... fill buffer with microphone data ...

const pitch = await detectPitch(audioBuffer, 44100, {
  minFrequency: 80, // Minimum pitch (human voice range)
  maxFrequency: 400, // Maximum pitch (human voice range)
});

if (pitch.isVoiced) {
  console.log(`Detected pitch: ${pitch.frequency.toFixed(2)} Hz`);
  console.log(`Confidence: ${(pitch.confidence * 100).toFixed(1)}%`);

  // Convert to musical note for tuner display
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const a4 = 440;
  const semitones = 12 * Math.log2(pitch.frequency / a4);
  const noteIndex = Math.round(semitones) % 12;
  console.log(`Closest note: ${noteNames[noteIndex]}`);
} else {
  console.log('No pitch detected (silence or unvoiced segment)');
}
```

### Formant Extraction Example (Vowel Analysis)

```typescript
import { extractFormants } from '@loqalabs/loqa-expo-dsp';

// Example: Analyze vowel formants for pronunciation feedback
const voiceBuffer = new Float32Array(2048); // Your voice samples
// ... fill buffer with voiced audio (vowel sound) ...

const formants = await extractFormants(voiceBuffer, 16000, {
  lpcOrder: 14, // Optional: defaults to sampleRate/1000 + 2
});

console.log(`Formant frequencies:`);
console.log(
  `  F1: ${formants.f1.toFixed(1)} Hz (bandwidth: ${formants.bandwidths.f1.toFixed(1)} Hz)`
);
console.log(
  `  F2: ${formants.f2.toFixed(1)} Hz (bandwidth: ${formants.bandwidths.f2.toFixed(1)} Hz)`
);
console.log(
  `  F3: ${formants.f3.toFixed(1)} Hz (bandwidth: ${formants.bandwidths.f3.toFixed(1)} Hz)`
);

// Identify vowel based on F1/F2 values (simplified example)
if (formants.f1 < 400 && formants.f2 > 2000) {
  console.log('Detected vowel: /i/ (as in "see")');
} else if (formants.f1 > 700 && formants.f2 < 1200) {
  console.log('Detected vowel: /a/ (as in "father")');
}
```

### Spectral Analysis Example (Audio Classification)

```typescript
import { analyzeSpectrum } from '@loqalabs/loqa-expo-dsp';

// Example: Analyze spectral features for audio classification
const audioBuffer = new Float32Array(2048); // Your audio samples
// ... fill buffer with audio data ...

const spectrum = await analyzeSpectrum(audioBuffer, 44100);

console.log(`Spectral centroid: ${spectrum.centroid.toFixed(1)} Hz`);
console.log(`Spectral rolloff: ${spectrum.rolloff.toFixed(1)} Hz`);
console.log(`Spectral tilt: ${spectrum.tilt.toFixed(3)}`);

// Use spectral features for audio classification
if (spectrum.centroid > 3000) {
  console.log('Bright sound (high-frequency content)');
} else if (spectrum.centroid < 1500) {
  console.log('Dark sound (low-frequency content)');
}

// Spectral tilt indicates timbre: negative = more bass, positive = more treble
if (spectrum.tilt < -0.01) {
  console.log('Bass-heavy timbre');
} else if (spectrum.tilt > 0.01) {
  console.log('Treble-heavy timbre');
}
```

### HNR Analysis Example (Breathiness Measurement)

```typescript
import { calculateHNR } from '@loqalabs/loqa-expo-dsp';

// Example: Measure voice breathiness using Harmonics-to-Noise Ratio
const voiceBuffer = new Float32Array(4096); // Your voice samples
// ... fill buffer with voiced audio ...

const hnrResult = await calculateHNR(voiceBuffer, { sampleRate: 44100 });

if (hnrResult.isVoiced) {
  console.log(`HNR: ${hnrResult.hnr.toFixed(1)} dB`);
  console.log(`Detected F0: ${hnrResult.f0.toFixed(1)} Hz`);

  // Interpret breathiness level
  if (hnrResult.hnr > 20) {
    console.log('Clear, less breathy voice');
  } else if (hnrResult.hnr > 12) {
    console.log('Moderately breathy voice');
  } else {
    console.log('Very breathy voice');
  }
} else {
  console.log('Signal is unvoiced');
}
```

### H1-H2 Analysis Example (Vocal Weight)

```typescript
import { calculateH1H2 } from '@loqalabs/loqa-expo-dsp';

// Example: Measure vocal weight using H1-H2 amplitude difference
const voiceBuffer = new Float32Array(4096); // Your voice samples
// ... fill buffer with voiced audio ...

const h1h2Result = await calculateH1H2(voiceBuffer, { sampleRate: 44100 });

console.log(`H1-H2: ${h1h2Result.h1h2.toFixed(1)} dB`);
console.log(`H1 amplitude: ${h1h2Result.h1AmplitudeDb.toFixed(1)} dB`);
console.log(`H2 amplitude: ${h1h2Result.h2AmplitudeDb.toFixed(1)} dB`);
console.log(`Detected F0: ${h1h2Result.f0.toFixed(1)} Hz`);

// Interpret vocal weight
if (h1h2Result.h1h2 > 5) {
  console.log('Lighter, breathier voice quality');
} else if (h1h2Result.h1h2 < -2) {
  console.log('Heavier, pressed voice quality');
} else {
  console.log('Balanced voice quality');
}
```

### VoiceAnalyzer Example (Streaming Pitch Tracking)

```typescript
import { createVoiceAnalyzer, analyzeClip, freeVoiceAnalyzer } from '@loqalabs/loqa-expo-dsp';

// Example: Track pitch across an audio recording with HMM smoothing
const audioSamples = new Float32Array(44100); // 1 second of audio
// ... fill buffer with audio data ...

// Create analyzer with config
const analyzer = await createVoiceAnalyzer({
  sampleRate: 44100,
  minPitch: 80,   // Hz (optional, default 50)
  maxPitch: 400,  // Hz (optional, default 550)
});

try {
  // Analyze the clip - get frame-by-frame results + aggregates
  const result = await analyzeClip(analyzer, audioSamples);

  console.log(`Analyzed ${result.frameCount} frames`);
  console.log(`Voiced frames: ${result.voicedFrameCount}`);
  console.log(`Median pitch: ${result.medianPitch?.toFixed(1)} Hz`);
  console.log(`Mean pitch: ${result.meanPitch?.toFixed(1)} Hz`);
  console.log(`Pitch std dev: ${result.stdDevPitch?.toFixed(1)} Hz`);

  // Access individual frames for detailed analysis
  result.frames.forEach((frame, i) => {
    if (frame.isVoiced) {
      console.log(`Frame ${i}: ${frame.pitch.toFixed(1)} Hz (confidence: ${frame.confidence.toFixed(2)})`);
    }
  });
} finally {
  // Always free the analyzer when done
  await freeVoiceAnalyzer(analyzer);
}
```

### Offline Pitch Tracking with Viterbi Decoding (v0.5.0+)

```typescript
import { createVoiceAnalyzer, processBuffer, freeVoiceAnalyzer } from '@loqalabs/loqa-expo-dsp';

// Example: Globally optimal pitch tracking with HMM-smoothed Viterbi decoding
// Reduces octave jump errors from ~8-12% to ≤3%
const audioSamples = new Float32Array(44100 * 5); // 5 seconds of audio
// ... fill buffer with complete audio recording ...

const analyzer = await createVoiceAnalyzer({
  sampleRate: 44100,
  minPitch: 80,
  maxPitch: 400,
});

try {
  // processBuffer uses Viterbi decoding for globally optimal pitch path
  // Best for offline analysis of complete recordings
  const track = await processBuffer(analyzer, audioSamples);

  console.log(`Analyzed ${track.frameCount} frames`);
  console.log(`Voiced frames: ${track.voicedFrameCount}`);
  console.log(`Median pitch: ${track.medianPitch?.toFixed(1)} Hz`);
  console.log(`Mean pitch: ${track.meanPitch?.toFixed(1)} Hz`);

  // Access per-frame data via Float32Arrays
  for (let i = 0; i < track.frameCount; i++) {
    const pitch = track.pitchTrack[i];
    const prob = track.voicedProbabilities[i];
    const time = track.timestamps[i];

    if (pitch > 0) { // 0.0 = unvoiced frame
      console.log(`${time.toFixed(3)}s: ${pitch.toFixed(1)} Hz (voiced prob: ${prob.toFixed(2)})`);
    }
  }
} finally {
  await freeVoiceAnalyzer(analyzer);
}
```

**Key differences from `analyzeClip`:**

- `processBuffer` uses Viterbi decoding for globally optimal pitch path (better for complete recordings)
- `analyzeClip` provides streaming/incremental analysis (better for real-time processing)
- `processBuffer` returns `Float32Array` for memory efficiency; `analyzeClip` returns structured frames

### Complete Voice Analysis Example

```typescript
import { detectPitch, extractFormants, computeFFT, calculateHNR, calculateH1H2 } from '@loqalabs/loqa-expo-dsp';

// Example: Comprehensive voice analysis for coaching apps
async function analyzeVoice(samples: Float32Array, sampleRate: number) {
  // 1. Detect pitch
  const pitch = await detectPitch(samples, sampleRate, {
    minFrequency: 80,
    maxFrequency: 400,
  });

  // 2. Extract formants (for voiced segments only)
  let formants = null;
  if (pitch.isVoiced) {
    formants = await extractFormants(samples, sampleRate);
  }

  // 3. Compute frequency spectrum
  const fft = await computeFFT(samples, { fftSize: 2048 });

  // 4. Calculate HNR (breathiness)
  const hnr = await calculateHNR(samples, { sampleRate });

  // 5. Calculate H1-H2 (vocal weight)
  const h1h2 = await calculateH1H2(samples, { sampleRate });

  return {
    pitch: {
      frequency: pitch.frequency,
      confidence: pitch.confidence,
      isVoiced: pitch.isVoiced,
    },
    formants: formants
      ? {
          f1: formants.f1,
          f2: formants.f2,
          f3: formants.f3,
        }
      : null,
    spectrum: {
      bins: fft.magnitude.length,
      dominantFreq: fft.frequencies[fft.magnitude.indexOf(Math.max(...fft.magnitude))],
    },
    breathiness: {
      hnr: hnr.hnr,
      isVoiced: hnr.isVoiced,
    },
    vocalWeight: {
      h1h2: h1h2.h1h2,
      f0: h1h2.f0,
    },
  };
}

// Usage
const result = await analyzeVoice(audioSamples, 16000);
console.log('Voice analysis:', result);
```

## Documentation

- **[API Reference](API.md)** - Complete function signatures and parameters
- **[Integration Guide](INTEGRATION_GUIDE.md)** - Step-by-step integration instructions
- **[CHANGELOG](CHANGELOG.md)** - Version history and migration guides

## Requirements

- Expo SDK 52+
- React Native 0.72+
- iOS 15.1+
- Android API 24+ (Android 7.0+)

## Architecture

**@loqalabs/loqa-expo-dsp** wraps the high-performance [loqa-voice-dsp](https://github.com/loqalabs/loqa) Rust library:

```text
┌─────────────────────────────────────────┐
│  React Native / Expo Application        │
│  ┌───────────────────────────────────┐  │
│  │  @loqalabs/loqa-expo-dsp (TS)     │  │
│  │  - TypeScript API                 │  │
│  └────────────┬──────────────────────┘  │
└───────────────┼──────────────────────────┘
                │ Expo Modules Core
       ┌────────┴────────┐
       │                 │
┌──────▼──────┐   ┌──────▼──────┐
│iOS (Swift)  │   │Android (Kt) │
│FFI bindings │   │JNI bindings │
└──────┬──────┘   └──────┬──────┘
       │                 │
       └────────┬────────┘
                │
        ┌───────▼────────┐
        │ loqa-voice-dsp │
        │  (Rust crate)  │
        │  - YIN pitch   │
        │  - LPC formants│
        │  - FFT/DFT     │
        │  - HNR         │
        │  - H1-H2       │
        └────────────────┘
```

## Performance

DSP algorithms are implemented in Rust for optimal performance:

- **Pitch Detection**: <1ms latency for 2048-sample buffer
- **FFT Analysis**: <2ms for 4096-point FFT
- **Formant Extraction**: <3ms with LPC order 12
- **HNR Calculation**: <2ms for 4096-sample buffer
- **H1-H2 Calculation**: <2ms for 4096-sample buffer
- **Memory**: Zero-copy where possible, minimal allocations

## Development

### Running Tests

**TypeScript Tests (Jest):**

```bash
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

**iOS Tests (XCTest):**

iOS tests are located in `ios/Tests/` and will run through the example app's Xcode test target:

```bash
cd example
npx expo run:ios
# Then run tests via Xcode's test navigator (Cmd+U)
```

**Android Tests (JUnit):**

Android tests are located in `android/src/test/` and will run through the example app's Gradle:

```bash
cd example
npx expo run:android
# Tests run via Gradle: ./gradlew testDebugUnitTest
```

## License

MIT License - see [LICENSE](LICENSE) for details.

## Contributing

Contributions welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Support

- **Issues**: [GitHub Issues](https://github.com/loqalabs/loqa-expo-dsp/issues)
- **Documentation**: [GitHub Wiki](https://github.com/loqalabs/loqa-expo-dsp/wiki)

---

For real-time audio streaming capabilities, see [@loqalabs/loqa-audio-bridge](https://github.com/loqalabs/loqa-audio-bridge).
