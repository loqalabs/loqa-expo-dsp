import {
  startAudioStream,
  stopAudioStream,
  addAudioSampleListener,
} from '@loqalabs/loqa-audio-bridge';
import { detectPitch } from '@loqalabs/loqa-audio-dsp';
import type { EventSubscription } from 'expo-modules-core';
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function frequencyToNote(frequency: number): { note: string; octave: number; cents: number } {
  const a4 = 440;
  const c0 = a4 * Math.pow(2, -4.75);
  const halfSteps = 12 * Math.log2(frequency / c0);
  const octave = Math.floor(halfSteps / 12);
  const noteIndex = Math.round(halfSteps) % 12;
  const exactNote = halfSteps % 12;
  const cents = Math.round((exactNote - noteIndex) * 100);

  return {
    note: NOTE_NAMES[noteIndex],
    octave,
    cents,
  };
}

export function PitchScreen() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [pitchResult, setPitchResult] = useState<{
    frequency: number | null;
    confidence: number;
    isVoiced: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const subscriptionRef = useRef<EventSubscription | null>(null);
  const SAMPLE_RATE = 16000;
  const BUFFER_SIZE = 2048;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
      }
      stopAudioStream();
    };
  }, []);

  async function startStreaming() {
    try {
      setError(null);
      setPitchResult(null);

      // Start audio streaming
      const success = await startAudioStream({
        sampleRate: SAMPLE_RATE,
        bufferSize: BUFFER_SIZE,
        channels: 1,
      });

      if (!success) {
        throw new Error('Failed to start audio stream');
      }

      // Subscribe to audio samples
      subscriptionRef.current = addAudioSampleListener(async (event) => {
        try {
          // Convert samples array to Float32Array
          const audioBuffer = new Float32Array(event.samples);

          // Run pitch detection on the audio samples
          const result = await detectPitch(audioBuffer, SAMPLE_RATE, {
            minFrequency: 80,
            maxFrequency: 400,
          });

          setPitchResult(result);
        } catch (err) {
          console.error('Pitch detection error:', err);
        }
      });

      setIsStreaming(true);
    } catch (err) {
      setError(`Failed to start streaming: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  function stopStreaming() {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
    stopAudioStream();
    setIsStreaming(false);
  }

  const musicalNote = pitchResult?.frequency ? frequencyToNote(pitchResult.frequency) : null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pitch Detector</Text>
        <Text style={styles.subtitle}>Real-Time Pitch Detection with YIN</Text>
      </View>

      <View style={styles.controls}>
        {!isStreaming && (
          <TouchableOpacity style={styles.recordButton} onPress={startStreaming}>
            <Text style={styles.buttonText}>Start Real-Time Analysis</Text>
          </TouchableOpacity>
        )}

        {isStreaming && (
          <TouchableOpacity style={styles.stopButton} onPress={stopStreaming}>
            <Text style={styles.buttonText}>Stop Analysis</Text>
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {pitchResult && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Pitch Results</Text>

          {pitchResult.frequency && musicalNote ? (
            <>
              <View style={styles.noteDisplay}>
                <Text style={styles.noteText}>
                  {musicalNote.note}
                  <Text style={styles.octaveText}>{musicalNote.octave}</Text>
                </Text>
                <Text style={styles.frequencyText}>{pitchResult.frequency.toFixed(2)} Hz</Text>
              </View>

              <View style={styles.tunerContainer}>
                <Text style={styles.tunerLabel}>Tuning</Text>
                <View style={styles.tunerBar}>
                  <View style={styles.tunerCenter} />
                  <View
                    style={[
                      styles.tunerNeedle,
                      {
                        left: `${50 + musicalNote.cents / 2}%`,
                      },
                    ]}
                  />
                </View>
                <View style={styles.tunerLabels}>
                  <Text style={styles.tunerLabelText}>-50¢</Text>
                  <Text style={styles.tunerLabelText}>0¢</Text>
                  <Text style={styles.tunerLabelText}>+50¢</Text>
                </View>
                <Text style={styles.centsText}>
                  {musicalNote.cents > 0 ? '+' : ''}
                  {musicalNote.cents}¢ {musicalNote.cents === 0 ? '(in tune!)' : ''}
                </Text>
              </View>

              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Confidence:</Text>
                <View style={styles.confidenceContainer}>
                  <View style={styles.confidenceBar}>
                    <View
                      style={[
                        styles.confidenceFill,
                        {
                          width: `${pitchResult.confidence * 100}%`,
                          backgroundColor:
                            pitchResult.confidence > 0.7
                              ? '#27AE60'
                              : pitchResult.confidence > 0.4
                                ? '#F39C12'
                                : '#E74C3C',
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.confidenceText}>
                    {(pitchResult.confidence * 100).toFixed(0)}%
                  </Text>
                </View>
              </View>

              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Voiced:</Text>
                <Text
                  style={[
                    styles.statValue,
                    { color: pitchResult.isVoiced ? '#27AE60' : '#E74C3C' },
                  ]}
                >
                  {pitchResult.isVoiced ? 'Yes' : 'No'}
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.noResultContainer}>
              <Text style={styles.noResultText}>No pitch detected</Text>
              <Text style={styles.noResultSubtext}>
                {pitchResult.isVoiced
                  ? 'Audio might be too quiet or noisy'
                  : 'Unvoiced audio segment detected'}
              </Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>About Pitch Detection</Text>
        <Text style={styles.infoText}>
          This demo uses the YIN algorithm to detect the fundamental frequency (pitch) of audio
          signals. Perfect for tuner apps and voice analysis.
        </Text>
        <Text style={styles.infoText}>
          This uses real-time audio from your microphone via @loqalabs/loqa-audio-bridge, providing
          live pitch detection. Try humming or singing a note!
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    backgroundColor: '#9B59B6',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#E8D5F2',
    marginTop: 4,
  },
  controls: {
    padding: 20,
    alignItems: 'center',
  },
  recordButton: {
    backgroundColor: '#E74C3C',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    minWidth: 200,
  },
  stopButton: {
    backgroundColor: '#95A5A6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    minWidth: 200,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  processingContainer: {
    padding: 20,
  },
  processingText: {
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    margin: 20,
    padding: 16,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#E74C3C',
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
  },
  resultsContainer: {
    margin: 20,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  noteDisplay: {
    alignItems: 'center',
    marginBottom: 24,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#9B59B6',
  },
  noteText: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#9B59B6',
  },
  octaveText: {
    fontSize: 32,
  },
  frequencyText: {
    fontSize: 20,
    color: '#666',
    marginTop: 8,
  },
  tunerContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  tunerLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  tunerBar: {
    height: 40,
    backgroundColor: '#ECF0F1',
    borderRadius: 8,
    position: 'relative',
    justifyContent: 'center',
  },
  tunerCenter: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#27AE60',
    transform: [{ translateX: -1 }],
  },
  tunerNeedle: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#9B59B6',
    borderRadius: 2,
    transform: [{ translateX: -2 }],
  },
  tunerLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  tunerLabelText: {
    fontSize: 12,
    color: '#666',
  },
  centsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginTop: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 16,
  },
  confidenceBar: {
    flex: 1,
    height: 20,
    backgroundColor: '#ECF0F1',
    borderRadius: 10,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 10,
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
    minWidth: 40,
  },
  noResultContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noResultText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  noResultSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  infoContainer: {
    margin: 20,
    padding: 16,
    backgroundColor: '#F4ECF7',
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
});
