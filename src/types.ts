export interface AudioFile {
  id: string;
  name: string;
  duration: number;
  sampleRate: number;
  channels: number;
  format: string;
  size: number;
  buffer?: AudioBuffer;
}

export interface SpectralFrame {
  time: number;
  magnitudes: Float32Array;
  frequencies: Float32Array;
}

export interface Source {
  id: string;
  label: string;
  instrument: InstrumentCategory;
  color: string;
  confidence: number;
  active: boolean;
}

export interface MusicalEvent {
  id: string;
  sourceId: string;
  startTime: number;
  endTime: number;
  frequency: number;
  midiNote: number;
  velocity: number;
  duration: number;
  pitchDeviation: number;
  confidence: number;
  status: 'detected' | 'proposed' | 'corrected' | 'protected' | 'reviewed';
  articulation?: string;
  voice: number;
  bar: number;
  beat: number;
  subBeat: number;
  alternatives?: AlternativeEvent[];
  history: EventHistoryEntry[];
}

export interface AlternativeEvent {
  midiNote: number;
  confidence: number;
  reason: string;
}

export interface EventHistoryEntry {
  timestamp: number;
  field: string;
  oldValue: any;
  newValue: any;
  reason: string;
  automated: boolean;
}

export interface Bar {
  number: number;
  startTime: number;
  endTime: number;
  timeSignature: [number, number];
  tempo: number;
  events: string[];
}

export interface InstrumentCategory {
  family: 'strings' | 'woodwind' | 'brass' | 'percussion' | 'keyboard' | 'voice' | 'bass' | 'unknown';
  name: string;
  program?: number;
  channel?: number;
}

export interface QuantizationMode {
  type: 'strict' | 'musical' | 'interpretive' | 'free';
  grid: number;
  label: string;
}

export interface ProjectState {
  audio: AudioFile | null;
  sources: Source[];
  events: MusicalEvent[];
  bars: Bar[];
  tempo: number;
  timeSignature: [number, number];
  key: string;
  quantizationMode: QuantizationMode;
  currentView: string;
  isProcessing: boolean;
  processingStage: string;
  progress: number;
  selectedEventId: string | null;
  selectedBar: number | null;
  zoom: { time: number; frequency: number };
  playbackPosition: number;
  isPlaying: boolean;
  importRequested: boolean; // P0: Flag para abrir selector de archivos
}

export interface ProcessingStage {
  id: string;
  label: string;
  module: string;
  status: 'pending' | 'running' | 'complete' | 'error';
  progress: number;
}

export type ViewType = 'dashboard' | 'lavadora' | 'tapiz' | 'imanes' | 'tamiz' | 'prisma' | 'fotocopiadora' | 'algoritmo' | 'manuscrito' | 'ciclo' | 'editor' | 'export';
