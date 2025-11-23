import {
  startAudioStream,
  stopAudioStream,
  addAudioSampleListener,
} from '@loqalabs/loqa-audio-bridge';
import { computeFFT } from '@loqalabs/loqa-audio-dsp';
import type { EventSubscription } from 'expo-modules-core';
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';

export function FFTScreen() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [fftResult, setFFTResult] = useState<{
    magnitude: Float32Array;
    frequencies: Float32Array;
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
      setFFTResult(null);

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

          // Run FFT on the audio samples
          const result = await computeFFT(audioBuffer, {
            fftSize: BUFFER_SIZE,
          });

          setFFTResult(result);
        } catch (err) {
          console.error('FFT processing error:', err);
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

  // Find peak frequency
  const peakFrequency = fftResult
    ? (() => {
        let maxIndex = 0;
        let maxValue = 0;
        for (let i = 0; i < fftResult.magnitude.length; i++) {
          if (fftResult.magnitude[i] > maxValue) {
            maxValue = fftResult.magnitude[i];
            maxIndex = i;
          }
        }
        return fftResult.frequencies[maxIndex];
      })()
    : null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>FFT Analyzer</Text>
        <Text style={styles.subtitle}>Fast Fourier Transform Demo</Text>
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

      {fftResult && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>FFT Results</Text>

          {peakFrequency !== null && (
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Peak Frequency:</Text>
              <Text style={styles.statValue}>{peakFrequency.toFixed(2)} Hz</Text>
            </View>
          )}

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Bins:</Text>
            <Text style={styles.statValue}>{fftResult.magnitude.length}</Text>
          </View>

          <Text style={styles.visualizationTitle}>Frequency Spectrum</Text>
          <FrequencyVisualization
            magnitude={fftResult.magnitude}
            frequencies={fftResult.frequencies}
          />
        </View>
      )}

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>About FFT</Text>
        <Text style={styles.infoText}>
          The Fast Fourier Transform (FFT) converts audio from the time domain to the frequency
          domain, showing which frequencies are present in the signal.
        </Text>
        <Text style={styles.infoText}>
          This demo uses real-time audio from your microphone via @loqalabs/loqa-audio-bridge,
          providing live frequency analysis of actual sounds.
        </Text>
      </View>
    </ScrollView>
  );
}

// Simple visualization component
function FrequencyVisualization({
  magnitude,
  frequencies,
}: {
  magnitude: Float32Array;
  frequencies: Float32Array;
}) {
  const screenWidth = Dimensions.get('window').width - 40;
  const barWidth = screenWidth / Math.min(magnitude.length, 64); // Show max 64 bins
  const maxMagnitude = Math.max(...Array.from(magnitude));

  // Sample down to 64 bins for visualization
  const step = Math.max(1, Math.floor(magnitude.length / 64));
  const displayBins = [];
  for (let i = 0; i < magnitude.length; i += step) {
    displayBins.push({ magnitude: magnitude[i], frequency: frequencies[i] });
  }

  return (
    <View style={styles.visualization}>
      <View style={styles.barsContainer}>
        {displayBins.map((bin, index) => {
          const heightPercent = (bin.magnitude / maxMagnitude) * 100;
          return (
            <View
              key={index}
              style={[
                styles.bar,
                {
                  width: barWidth - 1,
                  height: `${Math.max(heightPercent, 2)}%`,
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    backgroundColor: '#4A90E2',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#E0F0FF',
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
    marginBottom: 12,
    color: '#333',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
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
  visualizationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 12,
    color: '#333',
  },
  visualization: {
    height: 200,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
  },
  bar: {
    backgroundColor: '#4A90E2',
    marginHorizontal: 0.5,
  },
  infoContainer: {
    margin: 20,
    padding: 16,
    backgroundColor: '#E8F4F8',
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
