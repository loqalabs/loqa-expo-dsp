import {
  startAudioStream,
  stopAudioStream,
  addAudioSampleListener,
} from '@loqalabs/loqa-audio-bridge';
import { extractFormants } from '@loqalabs/loqa-audio-dsp';
import type { EventSubscription } from 'expo-modules-core';
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import Svg, { Circle, Text as SvgText, Line } from 'react-native-svg';

// Vowel reference points for F1/F2 plot (approximate)
const VOWEL_REFERENCES = [
  { vowel: 'i', f1: 270, f2: 2300, color: '#E74C3C' },
  { vowel: 'e', f1: 390, f2: 2100, color: '#3498DB' },
  { vowel: 'a', f1: 850, f2: 1200, color: '#2ECC71' },
  { vowel: 'o', f1: 590, f2: 850, color: '#F39C12' },
  { vowel: 'u', f1: 310, f2: 850, color: '#9B59B6' },
];

export function FormantScreen() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [formantResult, setFormantResult] = useState<{
    f1: number;
    f2: number;
    f3: number;
    bandwidths: { f1: number; f2: number; f3: number };
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
      setFormantResult(null);

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

          // Run formant extraction on the audio samples
          const result = await extractFormants(audioBuffer, SAMPLE_RATE);

          setFormantResult(result);
        } catch (err) {
          console.error('Formant extraction error:', err);
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Formant Extractor</Text>
        <Text style={styles.subtitle}>LPC Formant Analysis</Text>
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

      {formantResult && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Formant Results</Text>

          <View style={styles.formantValues}>
            <View style={styles.formantRow}>
              <Text style={styles.formantLabel}>F1 (First Formant):</Text>
              <Text style={styles.formantValue}>{formantResult.f1.toFixed(0)} Hz</Text>
            </View>
            <View style={styles.formantRow}>
              <Text style={styles.formantLabel}>F2 (Second Formant):</Text>
              <Text style={styles.formantValue}>{formantResult.f2.toFixed(0)} Hz</Text>
            </View>
            <View style={styles.formantRow}>
              <Text style={styles.formantLabel}>F3 (Third Formant):</Text>
              <Text style={styles.formantValue}>{formantResult.f3.toFixed(0)} Hz</Text>
            </View>
          </View>

          <Text style={styles.chartTitle}>F1-F2 Vowel Space</Text>
          <FormantChart f1={formantResult.f1} f2={formantResult.f2} />

          <View style={styles.bandwidthContainer}>
            <Text style={styles.bandwidthTitle}>Bandwidths</Text>
            <View style={styles.bandwidthRow}>
              <Text style={styles.bandwidthLabel}>F1 BW:</Text>
              <Text style={styles.bandwidthValue}>{formantResult.bandwidths.f1.toFixed(0)} Hz</Text>
            </View>
            <View style={styles.bandwidthRow}>
              <Text style={styles.bandwidthLabel}>F2 BW:</Text>
              <Text style={styles.bandwidthValue}>{formantResult.bandwidths.f2.toFixed(0)} Hz</Text>
            </View>
            <View style={styles.bandwidthRow}>
              <Text style={styles.bandwidthLabel}>F3 BW:</Text>
              <Text style={styles.bandwidthValue}>{formantResult.bandwidths.f3.toFixed(0)} Hz</Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>About Formants</Text>
        <Text style={styles.infoText}>
          Formants are resonant frequencies of the vocal tract. F1, F2, and F3 are the first three
          formants, which are crucial for vowel identification and speaker characteristics.
        </Text>
        <Text style={styles.infoText}>
          The F1-F2 plot shows where your sound falls in the vowel space, with reference vowels
          marked.
        </Text>
        <Text style={styles.infoText}>
          This demo uses real-time audio from your microphone via @loqalabs/loqa-audio-bridge,
          providing live formant analysis. Try singing different vowel sounds to see them plotted!
        </Text>
      </View>
    </ScrollView>
  );
}

function FormantChart({ f1, f2 }: { f1: number; f2: number }) {
  const width = Dimensions.get('window').width - 80;
  const height = 300;
  const padding = 40;

  // Scale: F1 (200-900 Hz) on Y-axis (inverted), F2 (700-2500 Hz) on X-axis (inverted)
  const f1Min = 200;
  const f1Max = 900;
  const f2Min = 700;
  const f2Max = 2500;

  const scaleX = (f2Val: number) =>
    padding + ((f2Max - f2Val) / (f2Max - f2Min)) * (width - 2 * padding);
  const scaleY = (f1Val: number) =>
    padding + ((f1Val - f1Min) / (f1Max - f1Min)) * (height - 2 * padding);

  const userX = scaleX(f2);
  const userY = scaleY(f1);

  return (
    <View style={styles.chartContainer}>
      <Svg width={width} height={height}>
        {/* Grid lines */}
        <Line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={height - padding}
          stroke="#CCC"
          strokeWidth="1"
        />
        <Line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="#CCC"
          strokeWidth="1"
        />

        {/* Reference vowels */}
        {VOWEL_REFERENCES.map((vowel, index) => {
          const x = scaleX(vowel.f2);
          const y = scaleY(vowel.f1);
          return (
            <React.Fragment key={index}>
              <Circle cx={x} cy={y} r="8" fill={vowel.color} opacity="0.6" />
              <SvgText
                x={x}
                y={y + 25}
                fontSize="14"
                fill={vowel.color}
                fontWeight="bold"
                textAnchor="middle"
              >
                {vowel.vowel}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* User's result */}
        <Circle cx={userX} cy={userY} r="12" fill="#27AE60" stroke="#fff" strokeWidth="2" />
        <SvgText
          x={userX}
          y={userY - 20}
          fontSize="12"
          fill="#27AE60"
          fontWeight="bold"
          textAnchor="middle"
        >
          You
        </SvgText>

        {/* Axis labels */}
        <SvgText x={width / 2} y={height - 5} fontSize="12" fill="#666" textAnchor="middle">
          F2 (Hz) →
        </SvgText>
        <SvgText
          x={15}
          y={height / 2}
          fontSize="12"
          fill="#666"
          textAnchor="middle"
          transform={`rotate(-90, 15, ${height / 2})`}
        >
          F1 (Hz) →
        </SvgText>
      </Svg>
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
    backgroundColor: '#E67E22',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#FCE5CD',
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
  formantValues: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  formantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  formantLabel: {
    fontSize: 14,
    color: '#666',
  },
  formantValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#E67E22',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  bandwidthContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
  },
  bandwidthTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  bandwidthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  bandwidthLabel: {
    fontSize: 12,
    color: '#666',
  },
  bandwidthValue: {
    fontSize: 12,
    color: '#333',
  },
  infoContainer: {
    margin: 20,
    padding: 16,
    backgroundColor: '#FFF3E0',
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
