import {
  computeFFT,
  detectPitch,
  extractFormants,
  analyzeSpectrum,
} from '@loqalabs/loqa-audio-dsp';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

// Performance NFR targets (in milliseconds)
const NFR_TARGETS = {
  computeFFT: 50,
  detectPitch: 100,
  extractFormants: 150,
  analyzeSpectrum: 75,
};

interface BenchmarkResult {
  functionName: string;
  min: number;
  max: number;
  avg: number;
  median: number;
  target: number;
  passed: boolean;
  fps: number;
}

export function BenchmarkScreen() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<BenchmarkResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Generate synthetic audio test data
  function generateTestAudio(samples: number, frequency: number = 440): Float32Array {
    const sampleRate = 16000;
    const audio = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
      audio[i] = Math.sin((2 * Math.PI * frequency * i) / sampleRate);
    }
    return audio;
  }

  async function runBenchmarks() {
    try {
      setRunning(true);
      setError(null);
      setResults([]);

      const testBuffer = generateTestAudio(2048);
      const sampleRate = 16000;
      const iterations = 100;

      // Benchmark computeFFT
      const fftTimes = await benchmarkFunction(
        'computeFFT',
        async () => {
          await computeFFT(testBuffer, { fftSize: 2048 });
        },
        iterations
      );
      const fftResult = calculateStats('computeFFT', fftTimes, NFR_TARGETS.computeFFT);
      setResults((prev) => [...prev, fftResult]);

      // Benchmark detectPitch
      const pitchTimes = await benchmarkFunction(
        'detectPitch',
        async () => {
          await detectPitch(testBuffer, sampleRate);
        },
        iterations
      );
      const pitchResult = calculateStats('detectPitch', pitchTimes, NFR_TARGETS.detectPitch);
      setResults((prev) => [...prev, pitchResult]);

      // Benchmark extractFormants
      const formantsTimes = await benchmarkFunction(
        'extractFormants',
        async () => {
          await extractFormants(testBuffer, sampleRate);
        },
        iterations
      );
      const formantsResult = calculateStats(
        'extractFormants',
        formantsTimes,
        NFR_TARGETS.extractFormants
      );
      setResults((prev) => [...prev, formantsResult]);

      // Benchmark analyzeSpectrum
      const spectrumTimes = await benchmarkFunction(
        'analyzeSpectrum',
        async () => {
          await analyzeSpectrum(testBuffer, sampleRate);
        },
        iterations
      );
      const spectrumResult = calculateStats(
        'analyzeSpectrum',
        spectrumTimes,
        NFR_TARGETS.analyzeSpectrum
      );
      setResults((prev) => [...prev, spectrumResult]);

      setRunning(false);
    } catch (err) {
      setError(`Benchmark failed: ${err instanceof Error ? err.message : String(err)}`);
      setRunning(false);
    }
  }

  async function benchmarkFunction(
    name: string,
    fn: () => Promise<void>,
    iterations: number
  ): Promise<number[]> {
    const times: number[] = [];

    // Warm up (discard first few runs)
    for (let i = 0; i < 5; i++) {
      await fn();
    }

    // Actual benchmark runs
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await fn();
      const end = performance.now();
      times.push(end - start);
    }

    return times;
  }

  function calculateStats(functionName: string, times: number[], target: number): BenchmarkResult {
    const sorted = [...times].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const avg = times.reduce((sum, t) => sum + t, 0) / times.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    const fps = 1000 / avg; // Frames per second capability
    const passed = avg < target;

    return {
      functionName,
      min,
      max,
      avg,
      median,
      target,
      passed,
      fps,
    };
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Performance Benchmarks</Text>
        <Text style={styles.subtitle}>Validate NFR Performance Targets</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, running && styles.buttonDisabled]}
          onPress={runBenchmarks}
          disabled={running}
        >
          <Text style={styles.buttonText}>
            {running ? 'Running Benchmarks...' : 'Run Benchmarks (100 iterations)'}
          </Text>
        </TouchableOpacity>
      </View>

      {running && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>
            Running benchmarks... ({results.length}/4 complete)
          </Text>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {results.length > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Benchmark Results</Text>
          <Text style={styles.resultsSubtitle}>Buffer Size: 2048 samples @ 16kHz</Text>

          {results.map((result, index) => (
            <BenchmarkResultCard key={index} result={result} />
          ))}

          {results.length === 4 && (
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryTitle}>Summary</Text>
              <Text style={styles.summaryText}>
                Passed: {results.filter((r) => r.passed).length} / {results.length}
              </Text>
              {results.every((r) => r.passed) && (
                <Text style={styles.summarySuccess}>✅ All functions meet NFR targets!</Text>
              )}
              {!results.every((r) => r.passed) && (
                <Text style={styles.summaryWarning}>
                  ⚠️ Some functions did not meet target performance
                </Text>
              )}
            </View>
          )}
        </View>
      )}

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>About Benchmarks</Text>
        <Text style={styles.infoText}>
          These benchmarks measure the execution time of each DSP function over 100 iterations using
          synthetic audio data (sine wave @ 440Hz).
        </Text>
        <Text style={styles.infoText}>
          Performance targets are based on NFR requirements defined in the architecture:
        </Text>
        <Text style={styles.infoText}>• computeFFT: {'<'}50ms</Text>
        <Text style={styles.infoText}>• detectPitch: {'<'}100ms</Text>
        <Text style={styles.infoText}>• extractFormants: {'<'}150ms</Text>
        <Text style={styles.infoText}>• analyzeSpectrum: {'<'}75ms</Text>
        <Text style={styles.infoText}>
          {'\n'}FPS (frames per second) capability shows how many times per second the function can
          process audio in real-time scenarios.
        </Text>
      </View>
    </ScrollView>
  );
}

function BenchmarkResultCard({ result }: { result: BenchmarkResult }) {
  return (
    <View style={[styles.resultCard, result.passed ? styles.cardPassed : styles.cardFailed]}>
      <View style={styles.cardHeader}>
        <Text style={styles.functionName}>{result.functionName}</Text>
        <View style={[styles.badge, result.passed ? styles.badgePassed : styles.badgeFailed]}>
          <Text style={styles.badgeText}>{result.passed ? 'PASS' : 'FAIL'}</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Min</Text>
          <Text style={styles.statValue}>{result.min.toFixed(2)} ms</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Max</Text>
          <Text style={styles.statValue}>{result.max.toFixed(2)} ms</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Avg</Text>
          <Text style={[styles.statValue, result.passed ? styles.statPassed : styles.statFailed]}>
            {result.avg.toFixed(2)} ms
          </Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Median</Text>
          <Text style={styles.statValue}>{result.median.toFixed(2)} ms</Text>
        </View>
      </View>

      <View style={styles.additionalStats}>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Target:</Text>
          <Text style={styles.statValue}>
            {'<'}
            {result.target} ms
          </Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>FPS Capability:</Text>
          <Text style={styles.statValue}>{result.fps.toFixed(1)} fps</Text>
        </View>
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
  button: {
    backgroundColor: '#E74C3C',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    minWidth: 250,
  },
  buttonDisabled: {
    backgroundColor: '#95A5A6',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
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
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  resultsSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  resultCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  cardPassed: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  cardFailed: {
    backgroundColor: '#FFEBEE',
    borderColor: '#F44336',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  functionName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgePassed: {
    backgroundColor: '#4CAF50',
  },
  badgeFailed: {
    backgroundColor: '#F44336',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  statPassed: {
    color: '#4CAF50',
  },
  statFailed: {
    color: '#F44336',
  },
  additionalStats: {
    borderTopWidth: 1,
    borderTopColor: '#DDD',
    paddingTop: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryContainer: {
    marginTop: 8,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  summarySuccess: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  summaryWarning: {
    fontSize: 16,
    color: '#FF9800',
    fontWeight: 'bold',
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
    marginBottom: 4,
  },
});
