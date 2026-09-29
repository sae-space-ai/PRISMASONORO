import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useAppState } from '../store';
import { v4 as uuidv4 } from 'uuid';
import { MusicalEvent } from '../types';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function midiToName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  return NOTE_NAMES[midi % 12] + octave;
}

function frequencyToMidi(freq: number): number {
  return Math.round(69 + 12 * Math.log2(freq / 440));
}

export function PianoRoll() {
  const { state, dispatch } = useAppState();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  const detectNotes = useCallback(async () => {
    if (!state.audio?.buffer) return;
    setIsDetecting(true);
    dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: true, stage: 'Detectando notas...', progress: 0 } });

    const buffer = state.audio.buffer;
    const data = buffer.getChannelData(0);
    const sampleRate = buffer.sampleRate;
    const events: MusicalEvent[] = [];

    // Simple onset detection + pitch estimation
    const frameSize = 2048;
    const hopSize = 512;
    const numFrames = Math.floor((data.length - frameSize) / hopSize);
    
    let prevEnergy = 0;
    let noteStart = -1;
    let noteFreq = 0;
    const onsetThreshold = 0.01;

    for (let frame = 0; frame < numFrames; frame++) {
      const start = frame * hopSize;
      
      // Compute frame energy
      let energy = 0;
      for (let i = 0; i < frameSize; i++) {
        energy += (data[start + i] || 0) ** 2;
      }
      energy = Math.sqrt(energy / frameSize);

      // Simple autocorrelation pitch detection
      let bestCorr = 0;
      let bestPeriod = 0;
      const minPeriod = Math.floor(sampleRate / 2000); // 2kHz max
      const maxPeriod = Math.floor(sampleRate / 60);   // 60Hz min

      if (energy > 0.01) {
        for (let period = minPeriod; period < Math.min(maxPeriod, frameSize / 2); period++) {
          let corr = 0;
          for (let i = 0; i < frameSize - period; i++) {
            corr += (data[start + i] || 0) * (data[start + i + period] || 0);
          }
          if (corr > bestCorr) {
            bestCorr = corr;
            bestPeriod = period;
          }
        }
      }

      const freq = bestPeriod > 0 ? sampleRate / bestPeriod : 0;
      const energyDiff = energy - prevEnergy;

      // Onset detection
      if (energyDiff > onsetThreshold && noteStart === -1 && freq > 60 && freq < 5000) {
        noteStart = start / sampleRate;
        noteFreq = freq;
      }

      // Note end detection
      if (noteStart >= 0 && (energy < 0.005 || energyDiff < -onsetThreshold * 2)) {
        const noteEnd = start / sampleRate;
        const duration = noteEnd - noteStart;
        
        if (duration > 0.03 && duration < 5) {
          const midi = frequencyToMidi(noteFreq);
          if (midi >= 21 && midi <= 108) {
            const barDuration = (60 / state.tempo) * state.timeSignature[0];
            const barNum = Math.floor(noteStart / barDuration) + 1;
            const beatPos = (noteStart % barDuration) / (60 / state.tempo);

            events.push({
              id: uuidv4(),
              sourceId: state.sources[0]?.id || 'src-1',
              startTime: noteStart,
              endTime: noteEnd,
              frequency: noteFreq,
              midiNote: midi,
              velocity: Math.min(127, Math.floor(energy * 500)),
              duration: duration,
              pitchDeviation: 0,
              confidence: Math.min(0.95, bestCorr / (frameSize * 0.5)),
              status: 'detected',
              voice: 1,
              bar: barNum,
              beat: Math.floor(beatPos) + 1,
              subBeat: Math.floor((beatPos % 1) * 4),
              history: [{ timestamp: Date.now(), field: 'all', oldValue: null, newValue: 'detected', reason: 'Detección automática', automated: true }],
            });
          }
        }
        noteStart = -1;
      }

      prevEnergy = energy;
    }

    dispatch({ type: 'SET_EVENTS', payload: events });
    dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: false, stage: '', progress: 100 } });
    setIsDetecting(false);
  }, [state.audio, state.tempo, state.timeSignature, state.sources, dispatch]);

  const drawPianoRoll = useCallback(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const minMidi = 36; // C2
    const maxMidi = 84; // C6
    const midiRange = maxMidi - minMidi;
    const noteHeight = height / midiRange;
    const duration = state.audio?.duration || 10;
    const timeScale = width / duration;

    // Background
    ctx.fillStyle = '#0f0f18';
    ctx.fillRect(0, 0, width, height);

    // Piano keys background
    for (let midi = minMidi; midi <= maxMidi; midi++) {
      const y = height - (midi - minMidi) * noteHeight;
      const isBlack = [1, 3, 6, 8, 10].includes(midi % 12);
      ctx.fillStyle = isBlack ? '#1a1a26' : '#1e1e2e';
      ctx.fillRect(0, y - noteHeight, 40, noteHeight);
      
      // Note labels for C notes
      if (midi % 12 === 0) {
        ctx.fillStyle = '#555';
        ctx.font = '8px monospace';
        ctx.fillText(midiToName(midi), 2, y - 2);
      }
    }

    // Grid lines
    ctx.strokeStyle = '#1a1a2a';
    ctx.lineWidth = 0.5;
    // Horizontal (note) lines
    for (let midi = minMidi; midi <= maxMidi; midi++) {
      const y = height - (midi - minMidi) * noteHeight;
      const isC = midi % 12 === 0;
      ctx.strokeStyle = isC ? '#2a2a4a' : '#151520';
      ctx.beginPath();
      ctx.moveTo(40, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Vertical (time) lines - bars
    if (state.bars.length > 0) {
      state.bars.forEach((bar, i) => {
        const x = 40 + bar.startTime * timeScale;
        ctx.strokeStyle = i % 4 === 0 ? '#3a3a5a' : '#2a2a3a';
        ctx.lineWidth = i % 4 === 0 ? 1 : 0.5;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
        
        // Bar numbers
        ctx.fillStyle = '#555';
        ctx.font = '9px monospace';
        ctx.fillText(`${bar.number}`, x + 2, 10);
      });
    }

    // Draw events
    const sourceColors: Record<string, string> = {};
    state.sources.forEach(s => { sourceColors[s.id] = s.color; });

    state.events.forEach(event => {
      const x = 40 + event.startTime * timeScale;
      const w = Math.max(3, event.duration * timeScale);
      const y = height - (event.midiNote - minMidi + 1) * noteHeight;
      const color = sourceColors[event.sourceId] || '#7c3aed';

      // Note body
      ctx.fillStyle = color + 'cc';
      ctx.fillRect(x, y, w, noteHeight - 1);
      
      // Note border
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, w, noteHeight - 1);

      // Velocity indicator
      const velHeight = (event.velocity / 127) * (noteHeight - 2);
      ctx.fillStyle = color + '44';
      ctx.fillRect(x + 1, y + noteHeight - velHeight - 1, w - 2, velHeight);

      // Confidence indicator
      if (event.confidence < 0.5) {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.strokeRect(x - 1, y - 1, w + 2, noteHeight + 1);
        ctx.setLineDash([]);
      }
    });

    // Playback cursor
    if (state.playbackPosition > 0) {
      const x = 40 + state.playbackPosition * timeScale;
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
  }, [state.events, state.audio, state.bars, state.sources, state.playbackPosition]);

  useEffect(() => {
    drawPianoRoll();
  }, [drawPianoRoll]);

  return (
    <div className="h-full flex flex-col p-3">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <i className="fas fa-copy text-prisma-accent"></i>
            La Fotocopiadora Musical
          </h3>
          <p className="text-[10px] text-prisma-muted">Piano Roll — Eventos musicales detectados</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={detectNotes}
            disabled={!state.audio || isDetecting}
            className="text-xs px-3 py-1.5 rounded bg-prisma-accent hover:bg-prisma-accent/80 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <i className={`fas ${isDetecting ? 'fa-spinner fa-spin' : 'fa-search'} mr-1`}></i>
            {isDetecting ? 'Detectando...' : 'Detectar Notas'}
          </button>
          <span className="text-[10px] text-prisma-muted">{state.events.length} eventos</span>
        </div>
      </div>

      <div className="flex-1 relative">
        <canvas ref={canvasRef} width={1200} height={500} className="w-full h-full rounded border border-prisma-border" />
        {state.events.length === 0 && !isDetecting && (
          <div className="absolute inset-0 flex items-center justify-center bg-prisma-bg/50">
            <div className="text-center">
              <i className="fas fa-music text-3xl text-prisma-muted mb-2"></i>
              <p className="text-xs text-prisma-muted">Pulsa "Detectar Notas" para analizar el audio</p>
            </div>
          </div>
        )}
      </div>

      {/* Event list */}
      {state.events.length > 0 && (
        <div className="mt-2 max-h-32 overflow-y-auto">
          <table className="w-full text-[10px]">
            <thead className="sticky top-0 bg-prisma-surface">
              <tr className="text-prisma-muted">
                <th className="text-left px-2 py-1">Nota</th>
                <th className="text-left px-2 py-1">MIDI</th>
                <th className="text-left px-2 py-1">Inicio</th>
                <th className="text-left px-2 py-1">Duración</th>
                <th className="text-left px-2 py-1">Vel.</th>
                <th className="text-left px-2 py-1">Conf.</th>
                <th className="text-left px-2 py-1">Compás</th>
                <th className="text-left px-2 py-1">Estado</th>
              </tr>
            </thead>
            <tbody>
              {state.events.slice(0, 50).map((ev, i) => (
                <tr key={ev.id} className={`border-t border-prisma-border/50 hover:bg-prisma-panel cursor-pointer ${state.selectedEventId === ev.id ? 'bg-prisma-accent/10' : ''}`}
                  onClick={() => dispatch({ type: 'SELECT_EVENT', payload: ev.id })}>
                  <td className="px-2 py-0.5 text-white">{midiToName(ev.midiNote)}</td>
                  <td className="px-2 py-0.5 text-prisma-muted">{ev.midiNote}</td>
                  <td className="px-2 py-0.5 text-prisma-accent2">{ev.startTime.toFixed(3)}s</td>
                  <td className="px-2 py-0.5 text-prisma-muted">{ev.duration.toFixed(3)}s</td>
                  <td className="px-2 py-0.5 text-prisma-warm">{ev.velocity}</td>
                  <td className="px-2 py-0.5">
                    <span className={ev.confidence > 0.7 ? 'text-prisma-success' : ev.confidence > 0.4 ? 'text-prisma-warm' : 'text-prisma-error'}>
                      {(ev.confidence * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="px-2 py-0.5 text-prisma-muted">{ev.bar}:{ev.beat}</td>
                  <td className="px-2 py-0.5">
                    <span className={`px-1 rounded text-[8px] ${
                      ev.status === 'detected' ? 'bg-blue-500/20 text-blue-400' :
                      ev.status === 'corrected' ? 'bg-green-500/20 text-green-400' :
                      ev.status === 'protected' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>{ev.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
