import React from 'react';
import { useAppState } from '../store';
import { QuantizationMode } from '../types';

const QUANTIZATION_MODES: QuantizationMode[] = [
  { type: 'strict', grid: 16, label: 'Estricto (rejilla fija)' },
  { type: 'musical', grid: 16, label: 'Musical (subdivisión contextual)' },
  { type: 'interpretive', grid: 16, label: 'Interpretativo (legible + expresivo)' },
  { type: 'free', grid: 0, label: 'Tiempo libre' },
];

export function QuantizationPanel() {
  const { state, dispatch } = useAppState();

  // Generate the 4x4 grid (4 beats x 4 sixteenth notes = 16 positions)
  const beats = state.timeSignature[0];
  const subdivisions = 4; // sixteenth notes per beat
  const totalPositions = beats * subdivisions;

  const eventsInGrid = state.events.filter(ev => {
    if (!state.audio) return false;
    const barDuration = (60 / state.tempo) * beats;
    const barStart = (ev.bar - 1) * barDuration;
    const posInBar = ev.startTime - barStart;
    return posInBar >= 0 && posInBar < barDuration;
  });

  return (
    <div className="p-3 h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-xs font-bold text-white flex items-center gap-2">
            <i className="fas fa-th text-prisma-accent"></i>
            Mapa Temporal y Cuantización Master
          </h3>
          <p className="text-[9px] text-prisma-muted">
            {beats} pulsos × {subdivisions} semicorcheas = {totalPositions} posiciones por compás ({state.timeSignature[0]}/{state.timeSignature[1]})
          </p>
        </div>
        <div className="flex items-center gap-2">
          {QUANTIZATION_MODES.map(mode => (
            <button
              key={mode.type}
              onClick={() => dispatch({ type: 'SET_QUANTIZATION', payload: mode })}
              className={`text-[9px] px-2 py-1 rounded transition-colors ${
                state.quantizationMode.type === mode.type
                  ? 'bg-prisma-accent text-white'
                  : 'bg-prisma-panel text-prisma-muted hover:text-white'
              }`}
            >
              {mode.type === 'strict' ? 'Estricto' : mode.type === 'musical' ? 'Musical' : mode.type === 'interpretive' ? 'Interpr.' : 'Libre'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid visualization: 4 rows (beats) × 4 columns (sixteenth positions) */}
      <div className="flex-1 overflow-auto">
        <div className="inline-block min-w-full">
          {/* Header: position numbers */}
          <div className="flex">
            <div className="w-12 flex-shrink-0"></div>
            {Array.from({ length: totalPositions }, (_, i) => (
              <div key={i} className={`flex-1 min-w-[24px] text-center text-[8px] py-0.5 ${
                i % subdivisions === 0 ? 'text-prisma-accent font-bold bg-prisma-accent/10' : 'text-prisma-muted'
              }`}>
                {i % subdivisions === 0 ? `${Math.floor(i / subdivisions) + 1}` : `${i % subdivisions + 1}`}
              </div>
            ))}
          </div>

          {/* Grid rows */}
          {Array.from({ length: beats }, (_, beatIdx) => (
            <div key={beatIdx} className="flex border-t border-prisma-border/30">
              <div className="w-12 flex-shrink-0 flex items-center justify-center text-[9px] text-prisma-muted font-medium bg-prisma-panel">
                P{beatIdx + 1}
              </div>
              {Array.from({ length: subdivisions }, (_, subIdx) => {
                const posIndex = beatIdx * subdivisions + subIdx;
                const beatDuration = 60 / state.tempo;
                const barDuration = beatDuration * beats;
                
                // Find events at this position
                const posEvents = state.events.filter(ev => {
                  const barStart = (ev.bar - 1) * barDuration;
                  const posTime = barStart + (posIndex / totalPositions) * barDuration;
                  const nextPosTime = barStart + ((posIndex + 1) / totalPositions) * barDuration;
                  return ev.startTime >= posTime - 0.01 && ev.startTime < nextPosTime + 0.01;
                });

                return (
                  <div
                    key={subIdx}
                    className={`flex-1 min-w-[24px] border-l border-prisma-border/20 flex items-center justify-center relative ${
                      subIdx === 0 ? 'bg-prisma-accent/5' : ''
                    }`}
                  >
                    {posEvents.length > 0 ? (
                      <div className="flex flex-col items-center">
                        {posEvents.slice(0, 3).map((ev, i) => {
                          const source = state.sources.find(s => s.id === ev.sourceId);
                          return (
                            <div
                              key={ev.id}
                              className="w-2 h-2 rounded-full m-0.5"
                              style={{ backgroundColor: source?.color || '#7c3aed' }}
                              title={`${ev.midiNote} (${ev.startTime.toFixed(3)}s) conf: ${(ev.confidence * 100).toFixed(0)}%`}
                            />
                          );
                        })}
                        {posEvents.length > 3 && (
                          <span className="text-[7px] text-prisma-muted">+{posEvents.length - 3}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[8px] text-prisma-border">·</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-2 flex items-center gap-4 text-[8px] text-prisma-muted">
        <span>P = Pulso</span>
        <span>Números = posición de semicorchea</span>
        <span className="text-prisma-accent">● = Pulso fuerte</span>
        <span>● = Evento en posición</span>
        <span className="ml-auto">PPQ: 480 · 1 semicorchea = 120 ticks</span>
      </div>
    </div>
  );
}
