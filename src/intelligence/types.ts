// ═══════════════════════════════════════════════════════════════
// PRISMA SONORO — Musical Intelligence Layer
// Tipos y contratos de la capa de inteligencia musical
// ═══════════════════════════════════════════════════════════════

export type EngineStatus = 'idle' | 'running' | 'completed' | 'error' | 'unavailable';

export interface EngineResult<T> {
  success: boolean;
   T | null;
  confidence: number;
  processingTimeMs: number;
  error?: string;
  engineVersion: string;
  timestamp: number;
}

// ═══════════════════════════════════════════════════════════════
// RHYTHMIC INTELLIGENCE ENGINE
// ═══════════════════════════════════════════════════════════════

export interface TempoEstimate {
  bpm: number;
  confidence: number;
  alternatives: { bpm: number; confidence: number }[];
  tempoMap: { time: number; bpm: number }[];
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
  anacrusis: number | null; // tiempo de anacrusa en segundos
  rubato: { time: number; deviation: number }[];
}

// ═══════════════════════════════════════════════════════════════
// PITCH INTELLIGENCE ENGINE
// ═══════════════════════════════════════════════════════════════

export interface PitchContour {
  time: number;
  frequency: number;
  midiNote: number;
  cents: number; // desviación en cents
  confidence: number;
  voiced: boolean;
}

export interface MultiPitchFrame {
  time: number;
  pitches: {
    frequency: number;
    midiNote: number;
    amplitude: number;
    confidence: number;
  }[];
}

export interface PitchAnalysis {
  contour: PitchContour[];
  multiPitch: MultiPitchFrame[];
  range: { min: number; max: number }; // MIDI range
  tonalCenter: number | null; // MIDI note
}

// ═══════════════════════════════════════════════════════════════
// SOURCE INTELLIGENCE ENGINE
// ═══════════════════════════════════════════════════════════════

export interface SourceEstimate {
  id: string;
  label: string;
  instrument: {
    family: 'strings' | 'woodwind' | 'brass' | 'percussion' | 'keyboard' | 'voice' | 'bass' | 'unknown';
    name: string;
    program?: number;
  };
  confidence: number;
  alternatives: { name: string; confidence: number }[];
  evidence: {
    spectralCentroid: number;
    spectralFlatness: number;
    attackTime: number;
    decayTime: number;
  };
}

export interface SourceSeparation {
  sources: SourceEstimate[];
  stems: Map<string, Float32Array>; // audio separated per source
  residual: Float32Array; // what couldn't be separated
  confidence: number;
}

// ═══════════════════════════════════════════════════════════════
// HARMONIC INTELLIGENCE ENGINE
// ═══════════════════════════════════════════════════════════════

export interface ChordEstimate {
  time: number;
  duration: number;
  root: number; // MIDI note
  quality: 'major' | 'minor' | 'diminished' | 'augmented' | 'dominant7' | 'major7' | 'minor7' | 'other';
  inversion: number; // 0 = root position
  confidence: number;
  function?: 'tonic' | 'dominant' | 'subdominant' | 'other';
}

export interface KeyEstimate {
  key: number; // MIDI note (tonic)
  mode: 'major' | 'minor';
  confidence: number;
  alternatives: { key: number; mode: 'major' | 'minor'; confidence: number }[];
}

export interface HarmonicAnalysis {
  key: KeyEstimate;
  chords: ChordEstimate[];
  cadences: { time: number; type: string }[];
  nonChordTones: { time: number; note: number; type: string }[];
}

// ═══════════════════════════════════════════════════════════════
// TIMBRE INTELLIGENCE ENGINE
// ═══════════════════════════════════════════════════════════════

export interface TimbreFeatures {
  spectralCentroid: number;
  spectralRolloff: number;
  spectralFlatness: number;
  zeroCrossingRate: number;
  mfcc: number[]; // Mel-frequency cepstral coefficients
  attackTime: number;
  decayTime: number;
  sustainLevel: number;
  releaseTime: number;
}

export interface TimbreClassification {
  features: TimbreFeatures;
  predictedInstrument: string;
  confidence: number;
  alternatives: { instrument: string; confidence: number }[];
}

// ═══════════════════════════════════════════════════════════════
// MELODIC CONTINUITY ENGINE
// ═══════════════════════════════════════════════════════════════

export interface MelodicFragment {
  id: string;
  sourceId: string;
  events: string[]; // event IDs
  startTime: number;
  endTime: number;
  contour: number[]; // MIDI notes
  confidence: number;
}

export interface FragmentationIssue {
  type: 'fragmented_note' | 'fused_notes' | 'artificial_cluster' | 'voice_crossing';
  events: string[];
  suggestion: string;
  confidence: number;
}

export interface MelodicAnalysis {
  fragments: MelodicFragment[];
  issues: FragmentationIssue[];
  voiceAssignments: Map<string, number>; // eventId -> voice number
}

// ═══════════════════════════════════════════════════════════════
// MUSICAL INTELLIGENCE STATE
// ═══════════════════════════════════════════════════════════════

export interface IntelligenceState {
  enabled: boolean;
  engines: {
    rhythmic: { status: EngineStatus; result: EngineResult<RhythmicAnalysis> | null };
    pitch: { status: EngineStatus; result: EngineResult<PitchAnalysis> | null };
    source: { status: EngineStatus; result: EngineResult<SourceSeparation> | null };
    harmonic: { status: EngineStatus; result: EngineResult<HarmonicAnalysis> | null };
    timbre: { status: EngineStatus; result: EngineResult<TimbreClassification[]> | null };
    melodic: { status: EngineStatus; result: EngineResult<MelodicAnalysis> | null };
  };
  computeProvider: 'cpu' | 'gpu' | 'accelerated' | 'fallback';
  lastAnalysisTime: number | null;
}
