// ═══════════════════════════════════════════════════════════════
// PRISMA SONORO — Pitch Intelligence Engine
// Motor de análisis de altura nativo
// ═══════════════════════════════════════════════════════════════

export interface PitchContour {
  time: number;
  frequency: number;
  midiNote: number;
  cents: number;
  confidence: number;
  voiced: boolean;
}

export interface PitchAnalysis {
  contour: PitchContour[];
  range: { min: number; max: number };
  tonalCenter: number | null;
  averageFrequency: number;
}

/**
 * Convierte frecuencia a nota MIDI
 */
export function frequencyToMidi(frequency: number): number {
  return Math.round(69 + 12 * Math.log2(frequency / 440));
}

/**
 * Convierte nota MIDI a frecuencia
 */
export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Calcula desviación en cents
 */
export function frequencyToCents(frequency: number, midiNote: number): number {
  const targetFreq = midiToFrequency(midiNote);
  return 1200 * Math.log2(frequency / targetFreq);
}

/**
 * Detecta pitch usando autocorrelación
 */
export function detectPitch(
  data: Float32Array,
  sampleRate: number,
  minFreq: number = 60,
  maxFreq: number = 2000
): { frequency: number; confidence: number } {
  // Calcular autocorrelación
  const minPeriod = Math.floor(sampleRate / maxFreq);
  const maxPeriod = Math.floor(sampleRate / minFreq);
  
  let bestCorr = 0;
  let bestPeriod = 0;
  
  for (let period = minPeriod; period < Math.min(maxPeriod, data.length / 2); period++) {
    let corr = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < data.length - period; i++) {
      corr += data[i] * data[i + period];
      norm1 += data[i] * data[i];
      norm2 += data[i + period] * data[i + period];
    }
    
    const norm = Math.sqrt(norm1 * norm2);
    if (norm > 0) {
      const normalizedCorr = corr / norm;
      if (normalizedCorr > bestCorr) {
        bestCorr = normalizedCorr;
        bestPeriod = period;
      }
    }
  }
  
  const frequency = bestPeriod > 0 ? sampleRate / bestPeriod : 0;
  const confidence = bestCorr;
  
  return { frequency, confidence };
}

/**
 * Analiza pitch a lo largo del audio
 */
export function analyzePitch(audioBuffer: AudioBuffer): PitchAnalysis {
  const data = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  
  const frameSize = 2048;
  const hopSize = 512;
  const numFrames = Math.floor((data.length - frameSize) / hopSize);
  
  const contour: PitchContour[] = [];
  let minMidi = 127;
  let maxMidi = 0;
  let totalFreq = 0;
  let voicedCount = 0;
  
  for (let i = 0; i < numFrames; i++) {
    const start = i * hopSize;
    const frame = data.slice(start, start + frameSize);
    
    // Calcular energía del frame
    let energy = 0;
    for (let j = 0; j < frame.length; j++) {
      energy += frame[j] * frame[j];
    }
    energy = Math.sqrt(energy / frame.length);
    
    // Solo analizar frames con suficiente energía
    if (energy > 0.01) {
      const { frequency, confidence } = detectPitch(frame, sampleRate);
      
      if (frequency > 0 && confidence > 0.3) {
        const midiNote = frequencyToMidi(frequency);
        const cents = frequencyToCents(frequency, midiNote);
        const time = (start + frameSize / 2) / sampleRate;
        
        contour.push({
          time,
          frequency,
          midiNote,
          cents,
          confidence,
          voiced: true,
        });
        
        if (midiNote < minMidi) minMidi = midiNote;
        if (midiNote > maxMidi) maxMidi = midiNote;
        totalFreq += frequency;
        voicedCount++;
      }
    }
  }
  
  // Detectar centro tonal (nota más frecuente)
  const midiHistogram = new Map<number, number>();
  contour.forEach(p => {
    midiHistogram.set(p.midiNote, (midiHistogram.get(p.midiNote) || 0) + 1);
  });
  
  let tonalCenter: number | null = null;
  let maxCount = 0;
  midiHistogram.forEach((count, midi) => {
    if (count > maxCount) {
      maxCount = count;
      tonalCenter = midi;
    }
  });
  
  return {
    contour,
    range: { min: minMidi, max: maxMidi },
    tonalCenter,
    averageFrequency: voicedCount > 0 ? totalFreq / voicedCount : 0,
  };
}
