import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { ProjectState, MusicalEvent, Source, ViewType, QuantizationMode } from './types';

const initialState: ProjectState = {
  audio: null,
  sources: [
    { id: 'src-1', label: 'Fuente 1', instrument: { family: 'unknown', name: 'Sin identificar' }, color: '#7c3aed', confidence: 0, active: true },
    { id: 'src-2', label: 'Fuente 2', instrument: { family: 'unknown', name: 'Sin identificar' }, color: '#06b6d4', confidence: 0, active: true },
    { id: 'src-3', label: 'Fuente 3', instrument: { family: 'unknown', name: 'Sin identificar' }, color: '#f59e0b', confidence: 0, active: true },
    { id: 'src-4', label: 'Fuente 4', instrument: { family: 'unknown', name: 'Sin identificar' }, color: '#10b981', confidence: 0, active: true },
  ],
  events: [],
  bars: [],
  tempo: 120,
  timeSignature: [4, 4],
  key: 'C',
  quantizationMode: { type: 'musical', grid: 16, label: 'Musical (16 semicorcheas)' },
  currentView: 'dashboard',
  isProcessing: false,
  processingStage: '',
  progress: 0,
  selectedEventId: null,
  selectedBar: null,
  zoom: { time: 1, frequency: 1 },
  playbackPosition: 0,
  isPlaying: false,
};

type Action =
  | { type: 'SET_VIEW'; payload: ViewType }
  | { type: 'SET_AUDIO'; payload: ProjectState['audio'] }
  | { type: 'SET_PROCESSING'; payload: { isProcessing: boolean; stage?: string; progress?: number } }
  | { type: 'SET_EVENTS'; payload: MusicalEvent[] }
  | { type: 'ADD_EVENT'; payload: MusicalEvent }
  | { type: 'UPDATE_EVENT'; payload: { id: string; updates: Partial<MusicalEvent> } }
  | { type: 'SELECT_EVENT'; payload: string | null }
  | { type: 'SET_SOURCES'; payload: Source[] }
  | { type: 'UPDATE_SOURCE'; payload: { id: string; updates: Partial<Source> } }
  | { type: 'SET_TEMPO'; payload: number }
  | { type: 'SET_TIME_SIGNATURE'; payload: [number, number] }
  | { type: 'SET_QUANTIZATION'; payload: QuantizationMode }
  | { type: 'SET_PLAYBACK'; payload: { position: number; isPlaying: boolean } }
  | { type: 'SET_ZOOM'; payload: { time?: number; frequency?: number } }
  | { type: 'SET_BARS'; payload: ProjectState['bars'] }
  | { type: 'SELECT_BAR'; payload: number | null }
  | { type: 'RESET_PROJECT' };

function reducer(state: ProjectState, action: Action): ProjectState {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, currentView: action.payload };
    case 'SET_AUDIO':
      return { ...state, audio: action.payload };
    case 'SET_PROCESSING':
      return { ...state, isProcessing: action.payload.isProcessing, processingStage: action.payload.stage || state.processingStage, progress: action.payload.progress ?? state.progress };
    case 'SET_EVENTS':
      return { ...state, events: action.payload };
    case 'ADD_EVENT':
      return { ...state, events: [...state.events, action.payload] };
    case 'UPDATE_EVENT':
      return { ...state, events: state.events.map(e => e.id === action.payload.id ? { ...e, ...action.payload.updates } : e) };
    case 'SELECT_EVENT':
      return { ...state, selectedEventId: action.payload };
    case 'SET_SOURCES':
      return { ...state, sources: action.payload };
    case 'UPDATE_SOURCE':
      return { ...state, sources: state.sources.map(s => s.id === action.payload.id ? { ...s, ...action.payload.updates } : s) };
    case 'SET_TEMPO':
      return { ...state, tempo: action.payload };
    case 'SET_TIME_SIGNATURE':
      return { ...state, timeSignature: action.payload };
    case 'SET_QUANTIZATION':
      return { ...state, quantizationMode: action.payload };
    case 'SET_PLAYBACK':
      return { ...state, playbackPosition: action.payload.position, isPlaying: action.payload.isPlaying };
    case 'SET_ZOOM':
      return { ...state, zoom: { ...state.zoom, ...action.payload } };
    case 'SET_BARS':
      return { ...state, bars: action.payload };
    case 'SELECT_BAR':
      return { ...state, selectedBar: action.payload };
    case 'RESET_PROJECT':
      return { ...initialState };
    default:
      return state;
  }
}

const AppContext = createContext<{ state: ProjectState; dispatch: React.Dispatch<Action> } | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be used within AppProvider');
  return ctx;
}
