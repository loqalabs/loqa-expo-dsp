# @loqalabs/loqa-audio-dsp

[![npm version](https://img.shields.io/npm/v/@loqalabs/loqa-audio-dsp.svg)](https://www.npmjs.com/package/@loqalabs/loqa-audio-dsp)
[![license](https://img.shields.io/npm/l/@loqalabs/loqa-audio-dsp.svg)](https://github.com/loqalabs/loqa-audio-dsp/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@loqalabs/loqa-audio-dsp.svg)](https://www.npmjs.com/package/@loqalabs/loqa-audio-dsp)

Production-grade Expo native module for audio DSP analysis.

## Overview

**@loqalabs/loqa-audio-dsp** provides high-performance audio Digital Signal Processing (DSP) functions for React Native/Expo applications. It wraps the [loqa-voice-dsp](https://github.com/loqalabs/loqa) Rust crate with native iOS (Swift) and Android (Kotlin) bindings.

### DSP Functions

- **FFT Analysis** - `computeFFT()`: Fast Fourier Transform for frequency spectrum
- **Pitch Detection** - `detectPitch()`: YIN algorithm for fundamental frequency
- **Formant Extraction** - `extractFormants()`: LPC-based formant analysis (F1, F2, F3)
- **Spectral Analysis** - `analyzeSpectrum()`: Spectral centroid, tilt, rolloff

### Companion Package

Works seamlessly with [@loqalabs/loqa-audio-bridge](https://github.com/loqalabs/loqa-audio-bridge) for real-time audio streaming:

```typescript
import { startAudioStream, addAudioSampleListener } from '@loqalabs/loqa-audio-bridge';
import { detectPitch, computeFFT } from '@loqalabs/loqa-audio-dsp';

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
npx expo install @loqalabs/loqa-audio-dsp
```

## Quick Start

### FFT Analysis Example

```typescript
import { computeFFT } from '@loqalabs/loqa-audio-dsp';

// Example: Analyze audio frequency content
const audioBuffer = new Float32Array(2048); // Your audio samples
// ... fill buffer with audio data from microphone or file ...

// Compute FFT with options
const result = await computeFFT(audioBuffer, {
  fftSize: 2048,
  windowType: 'hanning',
  includePhase: false
});

// Find the dominant frequency
const maxMagnitudeIndex = result.magnitude.indexOf(
  Math.max(...result.magnitude)
);
const dominantFrequency = result.frequencies[maxMagnitudeIndex];

console.log(`Dominant frequency: ${dominantFrequency.toFixed(2)} Hz`);
console.log(`Magnitude bins: ${result.magnitude.length}`);
console.log(`Frequency range: ${result.frequencies[0]} Hz - ${result.frequencies[result.frequencies.length - 1]} Hz`);
```

### Pitch Detection Example (Voice Analysis)

```typescript
import { detectPitch } from '@loqalabs/loqa-audio-dsp';

// Example: Real-time pitch detection for a tuner app
const audioBuffer = new Float32Array(2048); // Your audio samples
// ... fill buffer with microphone data ...

const pitch = await detectPitch(audioBuffer, 44100, {
  minFrequency: 80,   // Minimum pitch (human voice range)
  maxFrequency: 400   // Maximum pitch (human voice range)
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
import { extractFormants } from '@loqalabs/loqa-audio-dsp';

// Example: Analyze vowel formants for pronunciation feedback
const voiceBuffer = new Float32Array(2048); // Your voice samples
// ... fill buffer with voiced audio (vowel sound) ...

const formants = await extractFormants(voiceBuffer, 16000, {
  lpcOrder: 14  // Optional: defaults to sampleRate/1000 + 2
});

console.log(`Formant frequencies:`);
console.log(`  F1: ${formants.f1.toFixed(1)} Hz (bandwidth: ${formants.bandwidths.f1.toFixed(1)} Hz)`);
console.log(`  F2: ${formants.f2.toFixed(1)} Hz (bandwidth: ${formants.bandwidths.f2.toFixed(1)} Hz)`);
console.log(`  F3: ${formants.f3.toFixed(1)} Hz (bandwidth: ${formants.bandwidths.f3.toFixed(1)} Hz)`);

// Identify vowel based on F1/F2 values (simplified example)
if (formants.f1 < 400 && formants.f2 > 2000) {
  console.log('Detected vowel: /i/ (as in "see")');
} else if (formants.f1 > 700 && formants.f2 < 1200) {
  console.log('Detected vowel: /a/ (as in "father")');
}
```

### Spectral Analysis Example (Audio Classification)

```typescript
import { analyzeSpectrum } from '@loqalabs/loqa-audio-dsp';

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

### Complete Voice Analysis Example

```typescript
import { detectPitch, extractFormants, computeFFT } from '@loqalabs/loqa-audio-dsp';

// Example: Comprehensive voice analysis for coaching apps
async function analyzeVoice(samples: Float32Array, sampleRate: number) {
  // 1. Detect pitch
  const pitch = await detectPitch(samples, sampleRate, {
    minFrequency: 80,
    maxFrequency: 400
  });

  // 2. Extract formants (for voiced segments only)
  let formants = null;
  if (pitch.isVoiced) {
    formants = await extractFormants(samples, sampleRate);
  }

  // 3. Compute frequency spectrum
  const fft = await computeFFT(samples, { fftSize: 2048 });

  return {
    pitch: {
      frequency: pitch.frequency,
      confidence: pitch.confidence,
      isVoiced: pitch.isVoiced
    },
    formants: formants ? {
      f1: formants.f1,
      f2: formants.f2,
      f3: formants.f3
    } : null,
    spectrum: {
      bins: fft.magnitude.length,
      dominantFreq: fft.frequencies[
        fft.magnitude.indexOf(Math.max(...fft.magnitude))
      ]
    }
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

**@loqalabs/loqa-audio-dsp** wraps the high-performance [loqa-voice-dsp](https://github.com/loqalabs/loqa) Rust library:

```
┌─────────────────────────────────────────┐
│  React Native / Expo Application        │
│  ┌───────────────────────────────────┐  │
│  │  @loqalabs/loqa-audio-dsp (TS)   │  │
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
        └────────────────┘
```

## Performance

DSP algorithms are implemented in Rust for optimal performance:

- **Pitch Detection**: <1ms latency for 2048-sample buffer
- **FFT Analysis**: <2ms for 4096-point FFT
- **Formant Extraction**: <3ms with LPC order 12
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

- **Issues**: [GitHub Issues](https://github.com/loqalabs/loqa-audio-dsp/issues)
- **Documentation**: [GitHub Wiki](https://github.com/loqalabs/loqa-audio-dsp/wiki)

---

For real-time audio streaming capabilities, see [@loqalabs/loqa-audio-bridge](https://github.com/loqalabs/loqa-audio-bridge).
