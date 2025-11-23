# Integration Guide

**@loqalabs/loqa-audio-dsp**

This guide provides real-world integration patterns and complete examples for using @loqalabs/loqa-audio-dsp in your React Native/Expo applications.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Integration Patterns](#integration-patterns)
  - [Pattern 1: Voice Recording with expo-av](#pattern-1-voice-recording-with-expo-av)
  - [Pattern 2: Real-Time Analysis with Streaming Audio](#pattern-2-real-time-analysis-with-streaming-audio)
  - [Pattern 3: Batch Processing Pre-Recorded Files](#pattern-3-batch-processing-pre-recorded-files)
- [Complete Examples](#complete-examples)
  - [Pitch Tracking App](#pitch-tracking-app)
  - [Formant Visualization](#formant-visualization)
  - [Spectral Analyzer](#spectral-analyzer)
- [Performance & Memory Management](#performance--memory-management)
- [Error Handling Best Practices](#error-handling-best-practices)
- [Platform-Specific Considerations](#platform-specific-considerations)

---

## Quick Start

Install the package:

```bash
npx expo install @loqalabs/loqa-audio-dsp
```

Basic usage:

```typescript
import { detectPitch } from '@loqalabs/loqa-audio-dsp';

const audioBuffer = new Float32Array(2048);
// ... fill buffer with audio samples ...

const pitch = await detectPitch(audioBuffer, 44100);
console.log(`Pitch: ${pitch.frequency} Hz`);
```

---

## Integration Patterns

### Pattern 1: Voice Recording with expo-av

This pattern shows how to record audio using `expo-av` and analyze it with @loqalabs/loqa-audio-dsp.

#### Dependencies

```bash
npx expo install expo-av
```

#### Complete Implementation

```typescript
import { Audio } from 'expo-av';
import { detectPitch, extractFormants } from '@loqalabs/loqa-audio-dsp';
import { useState } from 'react';
import { View, Button, Text } from 'react-native';

export function VoiceRecorderWithAnalysis() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [analysis, setAnalysis] = useState<{
    pitch: number | null;
    formants: { f1: number; f2: number; f3: number } | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Request microphone permissions
  async function requestPermissions() {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Microphone permission denied');
      }
    } catch (error) {
      setError('Failed to request microphone permissions');
      throw error;
    }
  }

  // Start recording
  async function startRecording() {
    try {
      setError(null);
      await requestPermissions();

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start recording';
      setError(message);
      console.error('Recording start error:', error);
    }
  }

  // Stop recording and analyze
  async function stopRecordingAndAnalyze() {
    if (!recording) return;

    try {
      setIsProcessing(true);
      setError(null);

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      if (!uri) {
        throw new Error('Recording URI not available');
      }

      // Load recorded audio
      const { sound, status } = await Audio.Sound.createAsync({ uri });

      if (!status.isLoaded) {
        throw new Error('Failed to load recording');
      }

      // Get audio buffer from recording
      // Note: expo-av doesn't directly expose PCM data, so you need to:
      // 1. Save the file and decode it with expo-file-system + audio decoder
      // 2. Use @loqalabs/loqa-audio-bridge for direct PCM access
      // 3. Use a custom native module to extract PCM

      // For this example, assume we have audio samples in Float32Array
      const audioSamples = await extractPCMFromRecording(uri);
      const sampleRate = status.durationMillis ? 44100 : 16000; // Infer or get from metadata

      // Analyze pitch
      const pitchResult = await detectPitch(audioSamples, sampleRate, {
        minFrequency: 80,
        maxFrequency: 400
      });

      // Analyze formants (if voiced)
      let formantsResult = null;
      if (pitchResult.isVoiced) {
        formantsResult = await extractFormants(audioSamples, sampleRate);
      }

      setAnalysis({
        pitch: pitchResult.frequency,
        formants: formantsResult ? {
          f1: formantsResult.f1,
          f2: formantsResult.f2,
          f3: formantsResult.f3
        } : null
      });

      setRecording(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Analysis failed';
      setError(message);
      console.error('Analysis error:', error);
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <View>
      <Button
        title={recording ? "Stop & Analyze" : "Start Recording"}
        onPress={recording ? stopRecordingAndAnalyze : startRecording}
        disabled={isProcessing}
      />

      {isProcessing && <Text>Processing...</Text>}

      {error && (
        <View style={{ backgroundColor: '#ffebee', padding: 10 }}>
          <Text style={{ color: '#c62828' }}>Error: {error}</Text>
        </View>
      )}

      {analysis && (
        <View>
          <Text>Pitch: {analysis.pitch?.toFixed(1) ?? 'N/A'} Hz</Text>
          {analysis.formants && (
            <Text>
              Formants: F1={analysis.formants.f1.toFixed(0)}
              F2={analysis.formants.f2.toFixed(0)}
              F3={analysis.formants.f3.toFixed(0)} Hz
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

// ⚠️ IMPORTANT: This is an intentional placeholder function
// expo-av does not directly expose PCM data, so you'll need to choose one of these approaches:
async function extractPCMFromRecording(uri: string): Promise<Float32Array> {
  // RECOMMENDED APPROACH: Use @loqalabs/loqa-audio-bridge for direct PCM access
  // This eliminates the need for expo-av and provides real-time PCM streaming
  // See Pattern 2 below for complete implementation

  // ALTERNATIVE APPROACH 1: Server-side decoding
  // Upload the recording to your backend, decode to PCM, and download

  // ALTERNATIVE APPROACH 2: For WAV files only
  // Parse WAV file format using expo-file-system to extract PCM samples
  // Example: const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
  // Then decode WAV header and extract PCM data

  // ALTERNATIVE APPROACH 3: Use a third-party audio decoder library
  // Search npm for React Native audio decoder packages

  throw new Error(
    'PCM extraction not implemented. ' +
    'Use @loqalabs/loqa-audio-bridge for real-time analysis (see Pattern 2) ' +
    'or implement one of the alternative approaches listed in the function comments.'
  );
}
```

#### Key Points

- **expo-av limitations**: `expo-av` doesn't directly expose PCM audio data, making real-time analysis difficult
- **Recommended approach**: Use [@loqalabs/loqa-audio-bridge](https://github.com/loqalabs/loqa-audio-bridge) for direct PCM access
- **Alternative**: Save recordings and decode them to PCM using `expo-file-system` + audio decoders

---

### Pattern 2: Real-Time Analysis with Streaming Audio

This pattern demonstrates real-time audio analysis using [@loqalabs/loqa-audio-bridge](https://github.com/loqalabs/loqa-audio-bridge) for continuous audio streaming.

#### Dependencies

```bash
npx expo install @loqalabs/loqa-audio-bridge @loqalabs/loqa-audio-dsp
```

#### Complete Implementation

```typescript
import { startAudioStream, stopAudioStream, addAudioSampleListener, removeAudioSampleListener } from '@loqalabs/loqa-audio-bridge';
import { detectPitch, analyzeSpectrum } from '@loqalabs/loqa-audio-dsp';
import { useEffect, useState } from 'react';
import { View, Button, Text } from 'react-native';

// Define the audio sample event type from loqa-audio-bridge
interface AudioSampleEvent {
  samples: Float32Array;
  sampleRate: number;
}

export function RealtimePitchTracker() {
  const [currentPitch, setCurrentPitch] = useState<number | null>(null);
  const [spectralCentroid, setSpectralCentroid] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);

  // Audio analysis callback
  const handleAudioSample = async (event: AudioSampleEvent) => {
    const { samples, sampleRate } = event;

    try {
      // Detect pitch
      const pitch = await detectPitch(samples, sampleRate, {
        minFrequency: 80,
        maxFrequency: 1000
      });

      if (pitch.isVoiced && pitch.confidence > 0.5) {
        setCurrentPitch(pitch.frequency);
      } else {
        setCurrentPitch(null);
      }

      // Analyze spectrum for brightness
      const spectrum = await analyzeSpectrum(samples, sampleRate);
      setSpectralCentroid(spectrum.centroid);

    } catch (error) {
      console.error('Analysis failed:', error);
    }
  };

  // Start streaming
  async function startListening() {
    try {
      await startAudioStream({
        sampleRate: 16000,
        bufferSize: 2048,
        channels: 1
      });

      const listener = addAudioSampleListener(handleAudioSample);
      setIsListening(true);

      return listener;
    } catch (error) {
      console.error('Failed to start audio stream:', error);
    }
  }

  // Stop streaming
  async function stopListening() {
    await stopAudioStream();
    setIsListening(false);
    setCurrentPitch(null);
    setSpectralCentroid(null);
  }

  // Cleanup on unmount
  useEffect(() => {
    let listener: any;
    let isMounted = true;

    async function setupListener() {
      if (isListening && isMounted) {
        listener = await startListening();
      }
    }

    setupListener();

    return () => {
      isMounted = false;
      if (listener) {
        removeAudioSampleListener(listener);
      }
      stopListening();
    };
  }, [isListening]);

  return (
    <View>
      <Button
        title={isListening ? "Stop Listening" : "Start Listening"}
        onPress={() => setIsListening(!isListening)}
      />
      {isListening && (
        <View>
          <Text>
            Pitch: {currentPitch ? `${currentPitch.toFixed(1)} Hz` : 'No pitch detected'}
          </Text>
          <Text>
            Brightness: {spectralCentroid?.toFixed(0) ?? 'N/A'} Hz
          </Text>
        </View>
      )}
    </View>
  );
}
```

#### Key Points

- **Buffer size**: Use 2048 samples for good balance between latency and accuracy
- **Sample rate**: 16 kHz is sufficient for voice analysis (lower CPU usage than 44.1 kHz)
- **Performance**: Each analysis should complete in <5ms to avoid blocking the audio thread
- **Error handling**: Always wrap analysis in try-catch to handle edge cases gracefully
- **Cleanup**: Remove listeners and stop streams when component unmounts

---

### Pattern 3: Batch Processing Pre-Recorded Files

This pattern shows how to process pre-recorded audio files for offline analysis.

#### Dependencies

```bash
npx expo install expo-file-system expo-asset
```

#### Complete Implementation

```typescript
import * as FileSystem from 'expo-file-system';
import { computeFFT, detectPitch, extractFormants } from '@loqalabs/loqa-audio-dsp';

interface AudioAnalysisResult {
  pitch: { frequency: number | null; confidence: number };
  formants: { f1: number; f2: number; f3: number } | null;
  spectrum: { magnitude: Float32Array; frequencies: Float32Array };
}

export async function analyzeBatchAudioFile(
  fileUri: string,
  sampleRate: number = 16000
): Promise<AudioAnalysisResult[]> {

  // 1. Load and decode audio file to PCM
  const pcmData = await loadAndDecodeToPCM(fileUri, sampleRate);

  // 2. Split into analysis windows
  const windowSize = 2048;
  const hopSize = 512; // 75% overlap for smoother tracking
  const results: AudioAnalysisResult[] = [];

  for (let i = 0; i + windowSize <= pcmData.length; i += hopSize) {
    const window = pcmData.slice(i, i + windowSize);

    // Run all analyses in parallel for efficiency
    const [pitch, fft] = await Promise.all([
      detectPitch(window, sampleRate),
      computeFFT(window, { fftSize: 2048, windowType: 'hanning' })
    ]);

    // Extract formants only for voiced segments
    let formants = null;
    if (pitch.isVoiced && pitch.confidence > 0.6) {
      formants = await extractFormants(window, sampleRate);
    }

    results.push({
      pitch: {
        frequency: pitch.frequency,
        confidence: pitch.confidence
      },
      formants: formants ? {
        f1: formants.f1,
        f2: formants.f2,
        f3: formants.f3
      } : null,
      spectrum: {
        magnitude: fft.magnitude,
        frequencies: fft.frequencies
      }
    });
  }

  return results;
}

// ⚠️ IMPORTANT: This is an intentional placeholder function
// Audio file decoding depends on your file format. Choose an approach:
async function loadAndDecodeToPCM(
  fileUri: string,
  targetSampleRate: number
): Promise<Float32Array> {

  // EXAMPLE IMPLEMENTATION FOR WAV FILES:
  // This shows how to decode uncompressed WAV files using expo-file-system
  /*
  import * as FileSystem from 'expo-file-system';

  const base64 = await FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.Base64
  });

  const arrayBuffer = Uint8Array.from(atob(base64), c => c.charCodeAt(0)).buffer;
  const dataView = new DataView(arrayBuffer);

  // Parse WAV header (simplified - production code should validate format)
  const dataOffset = 44; // Standard WAV header size
  const numChannels = dataView.getUint16(22, true);
  const sampleRate = dataView.getUint32(24, true);
  const bitsPerSample = dataView.getUint16(34, true);

  // Extract PCM samples (assuming 16-bit mono)
  const numSamples = (arrayBuffer.byteLength - dataOffset) / 2;
  const pcmData = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const sample = dataView.getInt16(dataOffset + i * 2, true);
    pcmData[i] = sample / 32768.0; // Normalize to [-1, 1]
  }

  return pcmData;
  */

  // ALTERNATIVE APPROACH 1: Server-side decoding (recommended for production)
  // Upload file to your backend, decode using ffmpeg or similar, return PCM

  // ALTERNATIVE APPROACH 2: Use a React Native audio decoder library
  // Search npm for packages like react-native-audio-decoder-wav

  // ALTERNATIVE APPROACH 3: Use expo-av + custom native module
  // Load with expo-av, capture PCM during playback with native bridge

  throw new Error(
    'Audio decoding not implemented. ' +
    'See function comments for WAV file example and alternative approaches. ' +
    'For real-time analysis, use @loqalabs/loqa-audio-bridge (Pattern 2).'
  );
}

// Example: Analyze and extract statistics
export async function generateAudioReport(fileUri: string) {
  const results = await analyzeBatchAudioFile(fileUri, 16000);

  // Calculate statistics
  const pitches = results
    .map(r => r.pitch.frequency)
    .filter((f): f is number => f !== null);

  const avgPitch = pitches.reduce((a, b) => a + b, 0) / pitches.length;
  const minPitch = Math.min(...pitches);
  const maxPitch = Math.max(...pitches);

  const voicedFrames = results.filter(r => r.formants !== null).length;
  const voicedPercentage = (voicedFrames / results.length) * 100;

  return {
    duration: results.length * 512 / 16000, // in seconds
    avgPitch,
    minPitch,
    maxPitch,
    pitchRange: maxPitch - minPitch,
    voicedPercentage,
    totalFrames: results.length
  };
}
```

#### Key Points

- **Window overlap**: Use 50-75% overlap for smoother pitch tracking
- **Parallel processing**: Run independent analyses concurrently with `Promise.all()`
- **Memory management**: Process large files in chunks to avoid memory issues
- **Audio decoding**: You'll need a decoder to convert audio files to PCM (see options in code comments)

---

## Complete Examples

### Pitch Tracking App

A complete musical tuner application that detects pitch in real-time and displays note information.

```typescript
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { startAudioStream, stopAudioStream, addAudioSampleListener } from '@loqalabs/loqa-audio-bridge';
import { detectPitch } from '@loqalabs/loqa-audio-dsp';

// Musical note data
const NOTE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const A4_FREQUENCY = 440;

interface NoteInfo {
  note: string;
  octave: number;
  cents: number; // Cents deviation from perfect pitch
  frequency: number;
}

function frequencyToNote(frequency: number): NoteInfo {
  const semitones = 12 * Math.log2(frequency / A4_FREQUENCY);
  const semitonesFromA4 = Math.round(semitones);
  const cents = Math.round((semitones - semitonesFromA4) * 100);

  const noteIndex = (semitonesFromA4 + 9) % 12;
  const octave = Math.floor((semitonesFromA4 + 9) / 12) + 4;

  return {
    note: NOTE_NAMES[noteIndex < 0 ? noteIndex + 12 : noteIndex],
    octave,
    cents,
    frequency
  };
}

export default function PitchTrackerApp() {
  const [isActive, setIsActive] = useState(false);
  const [noteInfo, setNoteInfo] = useState<NoteInfo | null>(null);
  const [confidence, setConfidence] = useState(0);

  useEffect(() => {
    let listener: any;

    async function start() {
      await startAudioStream({
        sampleRate: 44100,
        bufferSize: 4096, // Larger buffer for better pitch accuracy
        channels: 1
      });

      listener = addAudioSampleListener(async (event) => {
        try {
          const pitch = await detectPitch(event.samples, event.sampleRate, {
            minFrequency: 82,   // E2 (low guitar string)
            maxFrequency: 1047  // C6 (high voice)
          });

          if (pitch.isVoiced && pitch.frequency && pitch.confidence > 0.7) {
            setNoteInfo(frequencyToNote(pitch.frequency));
            setConfidence(pitch.confidence);
          } else {
            setNoteInfo(null);
            setConfidence(0);
          }
        } catch (error) {
          console.error('Pitch detection error:', error);
        }
      });
    }

    if (isActive) {
      start();
    } else {
      stopAudioStream();
      setNoteInfo(null);
    }

    return () => {
      if (listener) {
        stopAudioStream();
      }
    };
  }, [isActive]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Musical Tuner</Text>

      <TouchableOpacity
        style={[styles.button, isActive && styles.buttonActive]}
        onPress={() => setIsActive(!isActive)}
      >
        <Text style={styles.buttonText}>
          {isActive ? 'Stop' : 'Start'}
        </Text>
      </TouchableOpacity>

      {isActive && (
        <View style={styles.display}>
          {noteInfo ? (
            <>
              <Text style={styles.noteText}>
                {noteInfo.note}
                <Text style={styles.octaveText}>{noteInfo.octave}</Text>
              </Text>
              <Text style={styles.frequencyText}>
                {noteInfo.frequency.toFixed(1)} Hz
              </Text>
              <View style={styles.tuningIndicator}>
                <View
                  style={[
                    styles.tuningNeedle,
                    { left: `${50 + noteInfo.cents / 2}%` }
                  ]}
                />
                <Text style={styles.centsText}>
                  {noteInfo.cents > 0 ? '+' : ''}{noteInfo.cents}¢
                </Text>
              </View>
              <Text style={styles.confidenceText}>
                Confidence: {(confidence * 100).toFixed(0)}%
              </Text>
            </>
          ) : (
            <Text style={styles.waitingText}>Listening...</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#1a1a1a'
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 40
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 40
  },
  buttonActive: {
    backgroundColor: '#f44336'
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  display: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%'
  },
  noteText: {
    fontSize: 120,
    fontWeight: 'bold',
    color: '#4CAF50'
  },
  octaveText: {
    fontSize: 60
  },
  frequencyText: {
    fontSize: 24,
    color: '#ccc',
    marginTop: 10
  },
  tuningIndicator: {
    width: '80%',
    height: 60,
    backgroundColor: '#333',
    borderRadius: 10,
    marginTop: 30,
    position: 'relative',
    justifyContent: 'center'
  },
  tuningNeedle: {
    position: 'absolute',
    width: 4,
    height: '100%',
    backgroundColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10
  },
  centsText: {
    textAlign: 'center',
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  confidenceText: {
    marginTop: 20,
    color: '#999',
    fontSize: 14
  },
  waitingText: {
    fontSize: 24,
    color: '#666'
  }
});
```

---

### Formant Visualization

A vowel analysis app that visualizes formants on an F1-F2 chart.

```typescript
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Svg, { Circle, Text as SvgText, Line } from 'react-native-svg';
import { startAudioStream, stopAudioStream, addAudioSampleListener } from '@loqalabs/loqa-audio-bridge';
import { extractFormants, detectPitch } from '@loqalabs/loqa-audio-dsp';

const { width } = Dimensions.get('window');
const CHART_SIZE = width - 40;

// Vowel reference points (F1, F2) for English vowels
const VOWEL_REFERENCES = {
  'i': { f1: 280, f2: 2250, label: 'i (beat)' },   // /i/ as in "beat"
  'ɪ': { f1: 400, f2: 1920, label: 'ɪ (bit)' },    // /ɪ/ as in "bit"
  'ɛ': { f1: 550, f2: 1770, label: 'ɛ (bet)' },    // /ɛ/ as in "bet"
  'æ': { f1: 690, f2: 1660, label: 'æ (bat)' },    // /æ/ as in "bat"
  'ɑ': { f1: 710, f2: 1100, label: 'ɑ (father)' }, // /ɑ/ as in "father"
  'ɔ': { f1: 590, f2: 880, label: 'ɔ (bought)' },  // /ɔ/ as in "bought"
  'ʊ': { f1: 450, f2: 1030, label: 'ʊ (book)' },   // /ʊ/ as in "book"
  'u': { f1: 310, f2: 870, label: 'u (boot)' }     // /u/ as in "boot"
};

interface FormantPoint {
  f1: number;
  f2: number;
  timestamp: number;
}

export default function FormantVisualizerApp() {
  const [isActive, setIsActive] = useState(false);
  const [currentFormants, setCurrentFormants] = useState<FormantPoint | null>(null);
  const [formantHistory, setFormantHistory] = useState<FormantPoint[]>([]);

  useEffect(() => {
    let listener: any;

    async function start() {
      await startAudioStream({
        sampleRate: 16000,
        bufferSize: 2048,
        channels: 1
      });

      listener = addAudioSampleListener(async (event) => {
        try {
          // First check if segment is voiced
          const pitch = await detectPitch(event.samples, event.sampleRate);

          if (pitch.isVoiced && pitch.confidence > 0.6) {
            // Extract formants from voiced segment
            const formants = await extractFormants(event.samples, event.sampleRate);

            const point: FormantPoint = {
              f1: formants.f1,
              f2: formants.f2,
              timestamp: Date.now()
            };

            setCurrentFormants(point);
            setFormantHistory(prev => [...prev.slice(-50), point]); // Keep last 50 points
          }
        } catch (error) {
          console.error('Formant extraction error:', error);
        }
      });
    }

    if (isActive) {
      start();
    } else {
      stopAudioStream();
      setCurrentFormants(null);
      setFormantHistory([]);
    }

    return () => {
      if (listener) {
        stopAudioStream();
      }
    };
  }, [isActive]);

  // Convert formant frequencies to chart coordinates
  function formantToCoords(f1: number, f2: number): { x: number; y: number } {
    // Invert F1 axis (high F1 = low vowels at bottom)
    const x = ((f2 - 600) / (2400 - 600)) * CHART_SIZE;
    const y = CHART_SIZE - ((f1 - 200) / (900 - 200)) * CHART_SIZE;
    return { x, y };
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vowel Formant Analyzer</Text>

      <TouchableOpacity
        style={[styles.button, isActive && styles.buttonActive]}
        onPress={() => setIsActive(!isActive)}
      >
        <Text style={styles.buttonText}>
          {isActive ? 'Stop' : 'Start'}
        </Text>
      </TouchableOpacity>

      <View style={styles.chartContainer}>
        <Svg width={CHART_SIZE} height={CHART_SIZE}>
          {/* Background grid */}
          <Line x1="0" y1={CHART_SIZE/2} x2={CHART_SIZE} y2={CHART_SIZE/2} stroke="#333" strokeWidth="1" />
          <Line x1={CHART_SIZE/2} y1="0" x2={CHART_SIZE/2} y2={CHART_SIZE} stroke="#333" strokeWidth="1" />

          {/* Vowel reference points */}
          {Object.entries(VOWEL_REFERENCES).map(([key, vowel]) => {
            const { x, y } = formantToCoords(vowel.f1, vowel.f2);
            return (
              <Circle
                key={key}
                cx={x}
                cy={y}
                r="6"
                fill="#666"
                opacity="0.5"
              />
            );
          })}

          {/* Formant history trail (fading) */}
          {formantHistory.map((point, idx) => {
            const { x, y } = formantToCoords(point.f1, point.f2);
            const opacity = (idx / formantHistory.length) * 0.5;
            return (
              <Circle
                key={point.timestamp}
                cx={x}
                cy={y}
                r="3"
                fill="#4CAF50"
                opacity={opacity}
              />
            );
          })}

          {/* Current formant point */}
          {currentFormants && (() => {
            const { x, y } = formantToCoords(currentFormants.f1, currentFormants.f2);
            return (
              <Circle
                cx={x}
                cy={y}
                r="8"
                fill="#4CAF50"
                stroke="#fff"
                strokeWidth="2"
              />
            );
          })()}
        </Svg>

        {/* Axis labels */}
        <Text style={styles.axisLabel}>F2 (Hz) →</Text>
        <Text style={[styles.axisLabel, styles.verticalLabel]}>F1 (Hz) →</Text>
      </View>

      {currentFormants && (
        <View style={styles.infoPanel}>
          <Text style={styles.infoText}>
            F1: {currentFormants.f1.toFixed(0)} Hz
          </Text>
          <Text style={styles.infoText}>
            F2: {currentFormants.f2.toFixed(0)} Hz
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1a1a1a'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 20
  },
  buttonActive: {
    backgroundColor: '#f44336'
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  chartContainer: {
    backgroundColor: '#222',
    borderRadius: 10,
    padding: 10,
    position: 'relative'
  },
  axisLabel: {
    color: '#999',
    fontSize: 12,
    marginTop: 5
  },
  verticalLabel: {
    position: 'absolute',
    left: 0,
    top: '50%',
    transform: [{ rotate: '-90deg' }]
  },
  infoPanel: {
    marginTop: 20,
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 10,
    width: '100%'
  },
  infoText: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 5
  }
});
```

---

### Spectral Analyzer

A frequency spectrum visualizer with real-time FFT display.

```typescript
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { startAudioStream, stopAudioStream, addAudioSampleListener } from '@loqalabs/loqa-audio-bridge';
import { computeFFT, analyzeSpectrum } from '@loqalabs/loqa-audio-dsp';

const { width } = Dimensions.get('window');
const SPECTRUM_WIDTH = width - 40;
const SPECTRUM_HEIGHT = 300;
const NUM_BARS = 64; // Number of frequency bars to display

export default function SpectralAnalyzerApp() {
  const [isActive, setIsActive] = useState(false);
  const [magnitudes, setMagnitudes] = useState<number[]>(new Array(NUM_BARS).fill(0));
  const [spectralFeatures, setSpectralFeatures] = useState({
    centroid: 0,
    rolloff: 0,
    tilt: 0
  });

  useEffect(() => {
    let listener: any;

    async function start() {
      await startAudioStream({
        sampleRate: 44100,
        bufferSize: 4096,
        channels: 1
      });

      listener = addAudioSampleListener(async (event) => {
        try {
          // Compute FFT
          const fft = await computeFFT(event.samples, {
            fftSize: 4096,
            windowType: 'hanning',
            includePhase: false
          });

          // Downsample magnitude spectrum to NUM_BARS
          const binSize = Math.floor(fft.magnitude.length / NUM_BARS);
          const bars = new Array(NUM_BARS).fill(0);

          for (let i = 0; i < NUM_BARS; i++) {
            let sum = 0;
            for (let j = 0; j < binSize; j++) {
              sum += fft.magnitude[i * binSize + j];
            }
            bars[i] = sum / binSize;
          }

          // Normalize to 0-1 range
          const maxMag = Math.max(...bars, 1);
          const normalized = bars.map(m => m / maxMag);

          setMagnitudes(normalized);

          // Analyze spectral features
          const spectrum = await analyzeSpectrum(event.samples, event.sampleRate);
          setSpectralFeatures({
            centroid: spectrum.centroid,
            rolloff: spectrum.rolloff,
            tilt: spectrum.tilt
          });

        } catch (error) {
          console.error('FFT error:', error);
        }
      });
    }

    if (isActive) {
      start();
    } else {
      stopAudioStream();
      setMagnitudes(new Array(NUM_BARS).fill(0));
    }

    return () => {
      if (listener) {
        stopAudioStream();
      }
    };
  }, [isActive]);

  const barWidth = SPECTRUM_WIDTH / NUM_BARS;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Spectral Analyzer</Text>

      <TouchableOpacity
        style={[styles.button, isActive && styles.buttonActive]}
        onPress={() => setIsActive(!isActive)}
      >
        <Text style={styles.buttonText}>
          {isActive ? 'Stop' : 'Start'}
        </Text>
      </TouchableOpacity>

      <View style={styles.spectrumContainer}>
        <Svg width={SPECTRUM_WIDTH} height={SPECTRUM_HEIGHT}>
          {magnitudes.map((magnitude, idx) => {
            const barHeight = magnitude * SPECTRUM_HEIGHT;
            const hue = (idx / NUM_BARS) * 280; // Color gradient from red to blue

            return (
              <Rect
                key={idx}
                x={idx * barWidth}
                y={SPECTRUM_HEIGHT - barHeight}
                width={barWidth - 1}
                height={barHeight}
                fill={`hsl(${hue}, 80%, 50%)`}
              />
            );
          })}
        </Svg>
        <Text style={styles.frequencyLabel}>0 Hz</Text>
        <Text style={[styles.frequencyLabel, styles.frequencyLabelRight]}>
          22 kHz
        </Text>
      </View>

      {isActive && (
        <View style={styles.featuresPanel}>
          <View style={styles.feature}>
            <Text style={styles.featureLabel}>Centroid (Brightness)</Text>
            <Text style={styles.featureValue}>
              {spectralFeatures.centroid.toFixed(0)} Hz
            </Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureLabel}>Rolloff (95% Energy)</Text>
            <Text style={styles.featureValue}>
              {spectralFeatures.rolloff.toFixed(0)} Hz
            </Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureLabel}>Tilt (Timbre)</Text>
            <Text style={styles.featureValue}>
              {spectralFeatures.tilt.toFixed(3)}
              <Text style={styles.featureHint}>
                {spectralFeatures.tilt > 0 ? ' (bright)' : ' (dark)'}
              </Text>
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1a1a1a'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 20
  },
  buttonActive: {
    backgroundColor: '#f44336'
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  spectrumContainer: {
    backgroundColor: '#111',
    borderRadius: 10,
    padding: 10,
    position: 'relative'
  },
  frequencyLabel: {
    color: '#666',
    fontSize: 10,
    position: 'absolute',
    bottom: 5,
    left: 10
  },
  frequencyLabelRight: {
    left: undefined,
    right: 10
  },
  featuresPanel: {
    marginTop: 20,
    width: '100%',
    backgroundColor: '#222',
    borderRadius: 10,
    padding: 15
  },
  feature: {
    marginVertical: 8
  },
  featureLabel: {
    color: '#999',
    fontSize: 12,
    marginBottom: 4
  },
  featureValue: {
    color: '#4CAF50',
    fontSize: 20,
    fontWeight: 'bold'
  },
  featureHint: {
    fontSize: 14,
    color: '#666'
  }
});
```

---

## Performance & Memory Management

### Buffer Sizing Strategies

**Real-Time Analysis (Low Latency):**
```typescript
// Optimize for responsiveness
const config = {
  bufferSize: 1024,    // ~23ms at 44.1kHz
  sampleRate: 16000,   // Lower sample rate for voice
  fftSize: 1024        // Match buffer size
};
```

**Pitch Detection (Accuracy):**
```typescript
// Optimize for pitch accuracy
const config = {
  bufferSize: 2048,    // ~46ms at 44.1kHz
  sampleRate: 44100,
  fftSize: 2048
};
```

**Spectral Analysis (Frequency Resolution):**
```typescript
// Optimize for frequency resolution
const config = {
  bufferSize: 4096,    // ~93ms at 44.1kHz
  sampleRate: 44100,
  fftSize: 4096        // More frequency bins
};
```

### Memory Optimization

**Reuse Buffers:**
```typescript
// Bad: Creates new array every frame
listener = addAudioSampleListener(async (event) => {
  const buffer = new Float32Array(event.samples); // ❌ New allocation
  await detectPitch(buffer, 16000);
});

// Good: Reuse existing buffer
listener = addAudioSampleListener(async (event) => {
  await detectPitch(event.samples, 16000); // ✅ Use directly
});
```

**Batch Processing:**
```typescript
// Process multiple analyses in parallel
const [pitch, spectrum, fft] = await Promise.all([
  detectPitch(samples, sampleRate),
  analyzeSpectrum(samples, sampleRate),
  computeFFT(samples, { fftSize: 2048 })
]);
```

**Throttle Updates:**
```typescript
// Avoid overwhelming UI with updates
let lastUpdateTime = 0;
const UPDATE_INTERVAL = 50; // Max 20 updates/second

listener = addAudioSampleListener(async (event) => {
  const now = Date.now();
  if (now - lastUpdateTime < UPDATE_INTERVAL) {
    return; // Skip this frame
  }
  lastUpdateTime = now;

  const pitch = await detectPitch(event.samples, event.sampleRate);
  setState({ pitch });
});
```

### CPU Optimization

**Sample Rate Selection:**
- **Voice analysis**: 16 kHz is sufficient (saves 64% CPU vs 44.1 kHz)
- **Music/instruments**: 44.1 kHz for full frequency range
- **High-fidelity**: 48 kHz only if absolutely necessary

**Conditional Analysis:**
```typescript
// Run expensive analyses only when needed
listener = addAudioSampleListener(async (event) => {
  // Always run cheap pitch detection
  const pitch = await detectPitch(event.samples, event.sampleRate);

  // Only extract formants for voiced segments
  if (pitch.isVoiced && pitch.confidence > 0.7) {
    const formants = await extractFormants(event.samples, event.sampleRate);
    setState({ pitch, formants });
  }
});
```

**Window Type Trade-offs:**
```typescript
// Fast but less accurate
await computeFFT(samples, { windowType: 'none' });

// Slower but better frequency resolution
await computeFFT(samples, { windowType: 'blackman' });

// Good balance (recommended)
await computeFFT(samples, { windowType: 'hanning' });
```

---

## Error Handling Best Practices

### Graceful Degradation

```typescript
async function analyzeWithFallback(samples: Float32Array, sampleRate: number) {
  try {
    // Try full analysis
    const [pitch, formants, spectrum] = await Promise.all([
      detectPitch(samples, sampleRate),
      extractFormants(samples, sampleRate),
      analyzeSpectrum(samples, sampleRate)
    ]);

    return { pitch, formants, spectrum, error: null };

  } catch (error) {
    // Fallback: Try simpler analysis
    console.warn('Full analysis failed, trying pitch only:', error);

    try {
      const pitch = await detectPitch(samples, sampleRate);
      return { pitch, formants: null, spectrum: null, error: 'partial' };
    } catch (fallbackError) {
      console.error('All analysis failed:', fallbackError);
      return { pitch: null, formants: null, spectrum: null, error: 'total' };
    }
  }
}
```

### Input Validation

```typescript
import { ValidationError } from '@loqalabs/loqa-audio-dsp';

function validateAudioInput(samples: Float32Array, sampleRate: number): boolean {
  // Check buffer
  if (!samples || samples.length === 0) {
    throw new ValidationError('Audio buffer is empty');
  }

  if (samples.length > 16384) {
    throw new ValidationError('Buffer too large (max 16384 samples)');
  }

  // Check for invalid values
  const hasInvalidValues = Array.from(samples).some(v => !isFinite(v));
  if (hasInvalidValues) {
    throw new ValidationError('Buffer contains NaN or Infinity');
  }

  // Check sample rate
  if (!Number.isInteger(sampleRate)) {
    throw new ValidationError('Sample rate must be an integer');
  }

  if (sampleRate < 8000 || sampleRate > 48000) {
    throw new ValidationError('Sample rate must be between 8000 and 48000 Hz');
  }

  return true;
}

// Usage
try {
  validateAudioInput(audioSamples, sampleRate);
  const pitch = await detectPitch(audioSamples, sampleRate);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Invalid input:', error.message);
  }
}
```

### Timeout Protection

```typescript
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Analysis timeout')), timeoutMs)
    )
  ]);
}

// Usage: Ensure analysis completes within 10ms
try {
  const pitch = await withTimeout(
    detectPitch(samples, sampleRate),
    10
  );
} catch (error) {
  console.error('Analysis took too long:', error);
}
```

---

## Platform-Specific Considerations

### iOS Considerations

**Audio Session Configuration:**
```typescript
// Configure audio session before starting analysis
import { Audio } from 'expo-av';

await Audio.setAudioModeAsync({
  allowsRecordingIOS: true,
  playsInSilentModeIOS: true,
  staysActiveInBackground: false,
  shouldDuckAndroid: false
});
```

**Background Processing:**
- iOS suspends apps in background - analysis will pause
- For continuous analysis, implement background audio session
- Consider using background tasks for batch processing

### Android Considerations

**Audio Permissions:**
```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

**Runtime Permission Request:**
```typescript
import { PermissionsAndroid, Platform } from 'react-native';

async function requestMicrophonePermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true; // iOS permissions handled by expo-av
  }

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      {
        title: 'Microphone Permission',
        message: 'This app needs access to your microphone for audio analysis.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      }
    );

    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (error) {
    console.error('Permission request failed:', error);
    return false;
  }
}

// Usage before starting audio stream
async function startAnalysis() {
  const hasPermission = await requestMicrophonePermission();

  if (!hasPermission) {
    Alert.alert('Permission Denied', 'Cannot analyze audio without microphone permission');
    return;
  }

  // Proceed with audio stream
  await startAudioStream({ sampleRate: 16000, bufferSize: 2048 });
}
```

**Buffer Size Limitations:**
- Some Android devices have minimum buffer size requirements
- Test on multiple devices (especially older ones)
- Use dynamic buffer sizing based on device capabilities

**Memory Constraints:**
- Lower-end Android devices may have limited memory
- Use smaller buffer sizes on older devices
- Monitor memory usage and throttle processing if needed

### Cross-Platform Testing

**Key Test Scenarios:**
1. **Different sample rates**: 8000, 16000, 22050, 44100, 48000 Hz
2. **Different buffer sizes**: 512, 1024, 2048, 4096, 8192 samples
3. **Edge cases**: Silence, noise, very low/high pitches
4. **Sustained load**: Run analysis for 5+ minutes continuously
5. **Memory leaks**: Monitor memory over long sessions

---

## Next Steps

- **API Reference**: See [API.md](../API.md) for complete function signatures
- **Example App**: Explore `example/` directory for working demos
- **Companion Package**: Check [@loqalabs/loqa-audio-bridge](https://github.com/loqalabs/loqa-audio-bridge) for audio streaming
- **Support**: Report issues at [GitHub Issues](https://github.com/loqalabs/loqa-audio-dsp/issues)
