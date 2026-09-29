// ═══════════════════════════════════════════════════════════════
// PRISMA SONORO — Rhythmic Intelligence Engine
// Motor de análisis rítmico nativo
// ═══════════════════════════════════════════════════════════════

export interface TempoEstimate {
  bpm: number;
  confidence: number;
  alternatives: { bpm: number; confidence: number }[];
}

export interface BeatTracking {
  beats: number[]; // tiempos en segundos
  downbeats: number[];
  timeSignature: [number, number];
  confidence: number;
}

export interface RhythmicAnalysis {
  tempo: TempoEstimate;
  beats: BeatTracking;
  swing: number; // 0-1, 0.5 = straight
  anacrusis: number | null;
}

/**
 * Detecta tempo usando autocorrelación de energía
 * Algoritmo: calcular energía por frames, autocorrelacionar, buscar picos
 */
export function estimateTempo(audioBuffer: AudioBuffer): TempoEstimate {
  const data = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  
  // Parámetros
  const frameSize = Math.floor(sampleRate * 0.01); // 10ms frames
  const hopSize = Math.floor(frameSize / 2);
  const numFrames = Math.floor((data.length - frameSize) / hopSize);
  
  // Calcular energía por frame
  const energy = new Float32Array(numFrames);
  for (let i = 0; i < numFrames; i++) {
    let sum = 0;
    const start = i * hopSize;
    for (let j = 0; j < frameSize; j++) {
      const sample = data[start + j] || 0;
      sum += sample * sample;
    }
    energy[i] = sum / frameSize;
  }
  
  // Autocorrelación
  const minLag = Math.floor((60 / 200) * sampleRate / hopSize); // 200 BPM max
  const maxLag = Math.floor((60 / 40) * sampleRate / hopSize);  // 40 BPM min
  const autocorr = new Float32Array(maxLag - minLag);
  
  for (let lag = minLag; lag < maxLag; lag++) {
    let sum = 0;
    for (let i = 0; i < numFrames - lag; i++) {
      sum += energy[i] * energy[i + lag];
    }
    autocorr[lag - minLag] = sum / (numFrames - lag);
  }
  
  // Encontrar picos
  const peaks: { lag: number; value: number }[] = [];
  for (let i = 1; i < autocorr.length - 1; i++) {
    if (autocorr[i] > autocorr[i - 1] && autocorr[i] > autocorr[i + 1]) {
      peaks.push({ lag: i + minLag, value: autocorr[i] });
    }
  }
  
  // Ordenar por valor
  peaks.sort((a, b) => b.value - a.value);
  
  // Convertir lag a BPM
  const frameDuration = hopSize / sampleRate;
  const alternatives = peaks.slice(0, 5).map(peak => ({
    bpm: 60 / (peak.lag * frameDuration),
    confidence: peak.value / (peaks[0]?.value || 1),
  }));
  
  const bestBpm = alternatives[0]?.bpm || 120;
  const confidence = alternatives[0]?.confidence || 0;
  
  return {
    bpm: Math.round(bestBpm),
    confidence,
    alternatives: alternatives.slice(0, 3),
  };
}

/**
 * Detecta beats usando el tempo estimado
 */
export function trackBeats(audioBuffer: AudioBuffer, tempo: TempoEstimate): BeatTracking {
  const data = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  const duration = audioBuffer.duration;
  const beatDuration = 60 / tempo.bpm;
  
  // Detectar onsets usando flujo espectral
  const frameSize = 2048;
  const hopSize = 512;
  const numFrames = Math.floor((data.length - frameSize) / hopSize);
  
  const onsets: number[] = [];
  let prevSpectrum: Float32Array | null = null;
  
  for (let i = 0; i < numFrames; i++) {
    const start = i * hopSize;
    
    // Calcular magnitud espectral simplificada
    const spectrum = new Float32Array(frameSize / 2);
    for (let bin = 0; bin < spectrum.length; bin++) {
      let real = 0, imag = 0;
      for (let n = 0; n < Math.min(64, frameSize); n++) {
        const sample = data[start + n] || 0;
        const angle = 2 * Math.PI * bin * n / frameSize;
        real += sample * Math.cos(angle);
        imag -= sample * Math.sin(angle);
      }
      spectrum[bin] = Math.sqrt(real * real + imag * imag);
    }
    
    // Flux espectral
    if (prevSpectrum) {
      let flux = 0;
      for (let bin = 0; bin < spectrum.length; bin++) {
        const diff = spectrum[bin] - prevSpectrum[bin];
        if (diff > 0) flux += diff;
      }
      
      if (flux > 0.1) { // Umbral de onset
        const time = (start + frameSize / 2) / sampleRate;
        onsets.push(time);
      }
    }
    
    prevSpectrum = spectrum;
  }
  
  // Cuantizar onsets a la rejilla de tempo
  const beats: number[] = [];
  for (let t = 0; t < duration; t += beatDuration) {
    // Buscar onset más cercano
    const closest = onsets.reduce((prev, curr) => 
      Math.abs(curr - t) < Math.abs(prev - t) ? curr : prev
    , onsets[0] || t);
    
    if (Math.abs(closest - t) < beatDuration * 0.3) {
      beats.push(closest);
    } else {
      beats.push(t); // Fallback a rejilla perfecta
    }
  }
  
  // Detectar downbeats (cada 4 beats para 4/4)
  const downbeats = beats.filter((_, i) => i % 4 === 0);
  
  return {
    beats,
    downbeats,
    timeSignature: [4, 4],
    confidence: tempo.confidence * 0.8,
  };
}

/**
 * Análisis rítmico completo
 */
export function analyzeRhythm(audioBuffer: AudioBuffer): RhythmicAnalysis {
  const tempo = estimateTempo(audioBuffer);
  const beats = trackBeats(audioBuffer, tempo);
  
  return {
    tempo,
    beats,
    swing: 0.5, // Straight por defecto
    anacrusis: null,
  };
}
