# @loqalabs/loqa-audio-dsp

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

```typescript
import { detectPitch, computeFFT, extractFormants, analyzeSpectrum } from '@loqalabs/loqa-audio-dsp';

// Example: Analyze pre-recorded audio samples
const samples = new Float32Array([/* your audio data */]);
const sampleRate = 16000;

// Pitch detection
const pitch = detectPitch(samples, sampleRate, { minFreq: 80, maxFreq: 400 });
console.log(`Pitch: ${pitch.frequency} Hz`);

// FFT analysis
const fft = computeFFT(samples, 2048);
console.log(`Frequency spectrum has ${fft.length} bins`);

// Formant extraction
const formants = extractFormants(samples, sampleRate, { lpcOrder: 12 });
console.log(`F1: ${formants.f1} Hz, F2: ${formants.f2} Hz, F3: ${formants.f3} Hz`);

// Spectral analysis
const spectral = analyzeSpectrum(samples, sampleRate, 2048);
console.log(`Spectral centroid: ${spectral.centroid} Hz`);
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

## License

MIT License - see [LICENSE](LICENSE) for details.

## Contributing

Contributions welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Support

- **Issues**: [GitHub Issues](https://github.com/loqalabs/loqa-audio-dsp/issues)
- **Documentation**: [GitHub Wiki](https://github.com/loqalabs/loqa-audio-dsp/wiki)

---

**Status**: 🚧 Under Development

This package is currently being developed to provide DSP functionality previously available in VoicelineDSP v0.2.0. Expected first release: v0.1.0 (Q1 2025).

For real-time audio streaming capabilities, see [@loqalabs/loqa-audio-bridge](https://github.com/loqalabs/loqa-audio-bridge).
