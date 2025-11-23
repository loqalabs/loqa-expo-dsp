import {
  startAudioStream,
  stopAudioStream,
  addAudioSampleListener,
} from '@loqalabs/loqa-audio-bridge';
import { analyzeSpectrum } from '@loqalabs/loqa-audio-dsp';
import type { EventSubscription } from 'expo-modules-core';
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

export function SpectrumScreen() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [spectrumResult, setSpectrumResult] = useState<{
    centroid: number;
    rolloff: number;
    tilt: number;
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
      setSpectrumResult(null);

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

          // Run spectral analysis on the audio samples
          const result = await analyzeSpectrum(audioBuffer, SAMPLE_RATE);

          setSpectrumResult(result);
        } catch (err) {
          console.error('Spectral analysis error:', err);
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

  // Interpret spectral features
  const interpretation = spectrumResult
    ? {
        brightness:
          spectrumResult.centroid > 2000
            ? { label: 'Very Bright', color: '#F39C12' }
            : spectrumResult.centroid > 1000
              ? { label: 'Bright', color: '#3498DB' }
              : { label: 'Dark', color: '#9B59B6' },
        energy:
          spectrumResult.rolloff > 3000
            ? { label: 'High Energy', color: '#E74C3C' }
            : spectrumResult.rolloff > 1500
              ? { label: 'Medium Energy', color: '#F39C12' }
              : { label: 'Low Energy', color: '#27AE60' },
        timbre:
          spectrumResult.tilt > 0
            ? { label: 'Rising (Bright)', color: '#3498DB' }
            : spectrumResult.tilt < -0.5
              ? { label: 'Falling (Muffled)', color: '#95A5A6' }
              : { label: 'Flat (Balanced)', color: '#27AE60' },
      }
    : null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Spectral Analyzer</Text>
        <Text style={styles.subtitle}>Spectral Features Analysis</Text>
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

      {spectrumResult && interpretation && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Spectral Features</Text>

          <View style={styles.featureCard}>
            <View style={styles.featureHeader}>
              <Text style={styles.featureName}>Spectral Centroid</Text>
              <View style={[styles.badge, { backgroundColor: interpretation.brightness.color }]}>
                <Text style={styles.badgeText}>{interpretation.brightness.label}</Text>
              </View>
            </View>
            <Text style={styles.featureValue}>{spectrumResult.centroid.toFixed(2)} Hz</Text>
            <Text style={styles.featureDescription}>
              The "center of mass" of the spectrum. Higher values indicate brighter, sharper sounds.
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min((spectrumResult.centroid / 3000) * 100, 100)}%`,
                    backgroundColor: interpretation.brightness.color,
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureHeader}>
              <Text style={styles.featureName}>Spectral Rolloff</Text>
              <View style={[styles.badge, { backgroundColor: interpretation.energy.color }]}>
                <Text style={styles.badgeText}>{interpretation.energy.label}</Text>
              </View>
            </View>
            <Text style={styles.featureValue}>{spectrumResult.rolloff.toFixed(2)} Hz</Text>
            <Text style={styles.featureDescription}>
              Frequency below which 95% of energy is concentrated. Indicates overall energy
              distribution.
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min((spectrumResult.rolloff / 4000) * 100, 100)}%`,
                    backgroundColor: interpretation.energy.color,
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureHeader}>
              <Text style={styles.featureName}>Spectral Tilt</Text>
              <View style={[styles.badge, { backgroundColor: interpretation.timbre.color }]}>
                <Text style={styles.badgeText}>{interpretation.timbre.label}</Text>
              </View>
            </View>
            <Text style={styles.featureValue}>{spectrumResult.tilt.toFixed(3)}</Text>
            <Text style={styles.featureDescription}>
              Overall slope of the spectrum. Positive = rising (bright), negative = falling
              (muffled).
            </Text>
            <View style={styles.tiltIndicator}>
              <View style={styles.tiltBar}>
                <View
                  style={[
                    styles.tiltMarker,
                    {
                      left: `${50 + Math.max(-50, Math.min(50, spectrumResult.tilt * 50))}%`,
                      backgroundColor: interpretation.timbre.color,
                    },
                  ]}
                />
              </View>
              <View style={styles.tiltLabels}>
                <Text style={styles.tiltLabel}>Falling</Text>
                <Text style={styles.tiltLabel}>Flat</Text>
                <Text style={styles.tiltLabel}>Rising</Text>
              </View>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Audio Characteristics</Text>
            <Text style={styles.summaryText}>
              Brightness:{' '}
              <Text style={{ fontWeight: 'bold' }}>{interpretation.brightness.label}</Text>
            </Text>
            <Text style={styles.summaryText}>
              Energy: <Text style={{ fontWeight: 'bold' }}>{interpretation.energy.label}</Text>
            </Text>
            <Text style={styles.summaryText}>
              Timbre: <Text style={{ fontWeight: 'bold' }}>{interpretation.timbre.label}</Text>
            </Text>
          </View>
        </View>
      )}

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>About Spectral Analysis</Text>
        <Text style={styles.infoText}>
          Spectral features describe the frequency distribution and overall timbre of audio signals.
          Useful for audio classification, timbre analysis, and sound quality assessment.
        </Text>
        <Text style={styles.infoText}>
          • Centroid: Indicates brightness (low = dark, high = bright)
        </Text>
        <Text style={styles.infoText}>• Rolloff: Shows energy distribution across frequencies</Text>
        <Text style={styles.infoText}>• Tilt: Describes the overall spectral slope</Text>
        <Text style={styles.infoText}>
          This demo uses real-time audio from your microphone via @loqalabs/loqa-audio-bridge,
          providing live spectral analysis. Try different sounds to see how their characteristics
          change!
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
    backgroundColor: '#16A085',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#A8E6CF',
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
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  featureCard: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  featureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  featureValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#16A085',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
    lineHeight: 18,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#ECF0F1',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  tiltIndicator: {
    marginTop: 8,
  },
  tiltBar: {
    height: 8,
    backgroundColor: '#ECF0F1',
    borderRadius: 4,
    position: 'relative',
  },
  tiltMarker: {
    position: 'absolute',
    width: 4,
    height: 16,
    borderRadius: 2,
    top: -4,
    transform: [{ translateX: -2 }],
  },
  tiltLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  tiltLabel: {
    fontSize: 11,
    color: '#666',
  },
  summaryCard: {
    backgroundColor: '#E8F8F5',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#16A085',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#16A085',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  infoContainer: {
    margin: 20,
    padding: 16,
    backgroundColor: '#E8F8F5',
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
    marginBottom: 6,
  },
});
