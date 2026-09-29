// ═══════════════════════════════════════════════════════════════
// PRISMA SONORO — Timbre Intelligence Engine
// Motor de análisis tímbrico nativo
// ═══════════════════════════════════════════════════════════════

export interface TimbreFeatures {
  spectralCentroid: number;
  spectralRolloff: number;
  spectralFlatness: number;
  zeroCrossingRate: number;
  attackTime: number;
  decayTime: number;
  sustainLevel: number;
  releaseTime: number;
}

export interface TimbreClassification {
  features: TimbreFeatures;
  predictedFamily: 'strings' | 'woodwind' | 'brass' | 'percussion' | 'keyboard' | 'voice' | 'bass' | 'unknown';
  confidence: number;
  alternatives: { family: string; confidence: number }[];
}

/**
 * Calcula centroide espectral
 */
export function calculateSpectralCentroid(magnitudes: Float32Array, sampleRate: number, fftSize: number): number {
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < magnitudes.length; i++) {
    const frequency = (i * sampleRate) / fftSize;
    numerator += frequency * magnitudes[i];
    denominator += magnitudes[i];
  }
  
  return denominator > 0 ? numerator / denominator : 0;
}

/**
 * Calcula spectral rolloff (frecuencia por debajo de la cual está el 85% de la energía)
 */
export function calculateSpectralRolloff(magnitudes: Float32Array, sampleRate: number, fftSize: number, threshold: number = 0.85): number {
  let totalEnergy = 0;
  for (let i = 0; i < magnitudes.length; i++) {
    totalEnergy += magnitudes[i];
  }
  
  let cumulativeEnergy = 0;
  for (let i = 0; i < magnitudes.length; i++) {
    cumulativeEnergy += magnitudes[i];
    if (cumulativeEnergy >= totalEnergy * threshold) {
      return (i * sampleRate) / fftSize;
    }
  }
  
  return 0;
}

/**
 * Calcula spectral flatness (medida de "ruido" vs "tono")
 */
export function calculateSpectralFlatness(magnitudes: Float32Array): number {
  let geometricMean = 1;
  let arithmeticMean = 0;
  
  for (let i = 0; i < magnitudes.length; i++) {
    const mag = Math.max(magnitudes[i], 1e-10);
    geometricMean *= Math.pow(mag, 1 / magnitudes.length);
    arithmeticMean += mag / magnitudes.length;
  }
  
  return arithmeticMean > 0 ? geometricMean / arithmeticMean : 0;
}

/**
 * Calcula zero crossing rate
 */
export function calculateZeroCrossingRate(data: Float32Array): number {
  let crossings = 0;
  for (let i = 1; i < data.length; i++) {
    if ((data[i] >= 0 && data[i - 1] < 0) || (data[i] < 0 && data[i - 1] >= 0)) {
      crossings++;
    }
  }
  return crossings / data.length;
}

/**
 * Analiza envelope ADSR simplificado
 */
export function analyzeEnvelope(data: Float32Array, sampleRate: number): {
  attackTime: number;
  decayTime: number;
  sustainLevel: number;
  releaseTime: number;
} {
  // Calcular energía por ventanas
  const windowSize = Math.floor(sampleRate * 0.01); // 10ms
  const numWindows = Math.floor(data.length / windowSize);
  const envelope = new Float32Array(numWindows);
  
  for (let i = 0; i < numWindows; i++) {
    let sum = 0;
    for (let j = 0; j < windowSize; j++) {
      const sample = data[i * windowSize + j] || 0;
      sum += sample * sample;
    }
    envelope[i] = Math.sqrt(sum / windowSize);
  }
  
  // Encontrar peak
  let peakIndex = 0;
  let peakValue = 0;
  for (let i = 0; i < envelope.length; i++) {
    if (envelope[i] > peakValue) {
      peakValue = envelope[i];
      peakIndex = i;
    }
  }
  
  // Attack: tiempo desde inicio hasta peak
  const attackTime = (peakIndex * windowSize) / sampleRate;
  
  // Decay: tiempo desde peak hasta 70% del peak
  let decayEnd = peakIndex;
  const decayThreshold = peakValue * 0.7;
  for (let i = peakIndex; i < envelope.length; i++) {
    if (envelope[i] < decayThreshold) {
      decayEnd = i;
      break;
    }
  }
  const decayTime = ((decayEnd - peakIndex) * windowSize) / sampleRate;
  
  // Sustain: nivel promedio en la región estable
  let sustainSum = 0;
  let sustainCount = 0;
  const sustainStart = decayEnd;
  const sustainEnd = Math.min(envelope.length, sustainStart + Math.floor(envelope.length * 0.3));
  for (let i = sustainStart; i < sustainEnd; i++) {
    sustainSum += envelope[i];
    sustainCount++;
  }
  const sustainLevel = sustainCount > 0 ? sustainSum / sustainCount / peakValue : 0;
  
  // Release: tiempo desde fin de sustain hasta fin
  const releaseTime = ((envelope.length - sustainEnd) * windowSize) / sampleRate;
  
  return { attackTime, decayTime, sustainLevel, releaseTime };
}

/**
 * Extrae características tímbricas de un frame
 */
export function extractTimbreFeatures(data: Float32Array, sampleRate: number): TimbreFeatures {
  const fftSize = 2048;
  
  // Calcular espectro simplificado
  const magnitudes = new Float32Array(fftSize / 2);
  for (let bin = 0; bin < magnitudes.length; bin++) {
    let real = 0, imag = 0;
    for (let n = 0; n < Math.min(64, fftSize); n++) {
      const sample = data[n] || 0;
      const angle = 2 * Math.PI * bin * n / fftSize;
      real += sample * Math.cos(angle);
      imag -= sample * Math.sin(angle);
    }
    magnitudes[bin] = Math.sqrt(real * real + imag * imag);
  }
  
  const spectralCentroid = calculateSpectralCentroid(magnitudes, sampleRate, fftSize);
  const spectralRolloff = calculateSpectralRolloff(magnitudes, sampleRate, fftSize);
  const spectralFlatness = calculateSpectralFlatness(magnitudes);
  const zeroCrossingRate = calculateZeroCrossingRate(data);
  const envelope = analyzeEnvelope(data, sampleRate);
  
  return {
    spectralCentroid,
    spectralRolloff,
    spectralFlatness,
    zeroCrossingRate,
    ...envelope,
  };
}

/**
 * Clasifica timbre basado en características
 * Reglas heurísticas basadas en conocimiento musical
 */
export function classifyTimbre(features: TimbreFeatures): TimbreClassification {
  const { spectralCentroid, spectralFlatness, zeroCrossingRate, attackTime } = features;
  
  // Heurísticas basadas en características espectrales
  const scores: Record<string, number> = {
    strings: 0,
    woodwind: 0,
    brass: 0,
    percussion: 0,
    keyboard: 0,
    voice: 0,
    bass: 0,
  };
  
  // Cuerdas: centroid medio, attack medio, flatness bajo
  if (spectralCentroid > 500 && spectralCentroid < 3000 && attackTime > 0.05) {
    scores.strings += 0.3;
  }
  
  // Maderas: centroid medio-alto, flatness medio
  if (spectralCentroid > 1000 && spectralCentroid < 4000 && spectralFlatness > 0.1) {
    scores.woodwind += 0.3;
  }
  
  // Metales: centroid alto, attack rápido
  if (spectralCentroid > 2000 && attackTime < 0.05) {
    scores.brass += 0.3;
  }
  
  // Percusión: flatness alto, attack muy rápido
  if (spectralFlatness > 0.3 && attackTime < 0.01) {
    scores.percussion += 0.4;
  }
  
  // Teclados: centroid variable, attack rápido
  if (attackTime < 0.02 && spectralCentroid > 500) {
    scores.keyboard += 0.3;
  }
  
  // Voz: centroid medio, ZCR medio
  if (spectralCentroid > 300 && spectralCentroid < 3000 && zeroCrossingRate > 0.05) {
    scores.voice += 0.3;
  }
  
  // Bajo: centroid bajo
  if (spectralCentroid < 500) {
    scores.bass += 0.4;
  }
  
  // Normalizar
  const total = Object.values(scores).reduce((a, b) => a + b, 0) || 1;
  Object.keys(scores).forEach(key => {
    scores[key] /= total;
  });
  
  // Ordenar por score
  const sorted = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .map(([family, confidence]) => ({ family, confidence }));
  
  const predictedFamily = sorted[0].family as TimbreClassification['predictedFamily'];
  const confidence = sorted[0].confidence;
  
  return {
    features,
    predictedFamily,
    confidence,
    alternatives: sorted.slice(1, 4),
  };
}
