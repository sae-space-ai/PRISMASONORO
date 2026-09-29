import React from 'react';
import { useAppState } from '../../store';

interface Props {
  onResize: (width: number) => void;
  onClose: () => void;
}

export function SourcesPanel({ onResize, onClose }: Props) {
  const { state, dispatch } = useAppState();

  const eventsBySource = state.events.reduce((acc, ev) => {
    if (!acc[ev.sourceId]) acc[ev.sourceId] = [];
    acc[ev.sourceId].push(ev);
    return acc;
  }, {} as Record<string, typeof state.events>);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-12 px-3 border-b border-prisma-border flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <i className="fas fa-layer-group text-prisma-woodwind text-sm"></i>
          <h2 className="text-xs font-semibold text-prisma-text uppercase tracking-wider">Fuentes</h2>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-prisma-surface-2 text-prisma-text-secondary">
            {state.sources.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded hover:bg-prisma-surface-2 flex items-center justify-center text-prisma-text-secondary hover:text-prisma-text transition-colors"
          aria-label="Cerrar panel de fuentes"
        >
          <i className="fas fa-times text-xs"></i>
        </button>
      </div>

      {/* Sources List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {state.sources.map(source => {
          const sourceEvents = eventsBySource[source.id] || [];
          const avgConfidence = sourceEvents.length > 0
            ? sourceEvents.reduce((sum, e) => sum + e.confidence, 0) / sourceEvents.length
            : 0;

          return (
            <div
              key={source.id}
              className="glass-panel-elevated p-3 group"
              style={{ borderLeft: `3px solid ${source.color}` }}
            >
              {/* Source Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: source.color }}
                    aria-label={`Color de fuente: ${source.instrument.name}`}
                  ></div>
                  <span className="text-xs font-medium text-prisma-text">{source.label}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => dispatch({ type: 'UPDATE_SOURCE', payload: { id: source.id, updates: { active: !source.active } } })}
                    className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                      source.active
                        ? 'bg-prisma-success/20 text-prisma-success hover:bg-prisma-success/30'
                        : 'bg-prisma-surface-2 text-prisma-text-muted hover:text-prisma-text-secondary'
                    }`}
                    aria-label={source.active ? 'Silenciar fuente' : 'Activar fuente'}
                  >
                    <i className={`fas ${source.active ? 'fa-volume-up' : 'fa-volume-mute'} text-[10px]`}></i>
                  </button>
                  <button
                    className="w-6 h-6 rounded hover:bg-prisma-surface-2 flex items-center justify-center text-prisma-text-secondary hover:text-prisma-text transition-colors"
                    aria-label="Escuchar fuente en solitario"
                  >
                    <i className="fas fa-headphones text-[10px]"></i>
                  </button>
                </div>
              </div>

              {/* Instrument Info */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] px-2 py-0.5 rounded bg-prisma-surface-2 text-prisma-text-secondary">
                  {source.instrument.name}
                </span>
                <span className="text-[10px] text-prisma-text-muted">
                  {source.instrument.family}
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <span className="text-prisma-text-muted">Eventos:</span>
                  <span className="ml-1 text-prisma-text font-medium">{sourceEvents.length}</span>
                </div>
                <div>
                  <span className="text-prisma-text-muted">Confianza:</span>
                  <span className={`ml-1 font-medium ${
                    avgConfidence > 0.7 ? 'text-prisma-success' :
                    avgConfidence > 0.4 ? 'text-prisma-warning' :
                    'text-prisma-error'
                  }`}>
                    {(avgConfidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Mini visualization */}
              {sourceEvents.length > 0 && (
                <div className="mt-2 h-8 bg-prisma-bg rounded overflow-hidden flex items-end gap-px">
                  {sourceEvents.slice(0, 32).map((ev, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-sm transition-all"
                      style={{
                        height: `${(ev.velocity / 127) * 100}%`,
                        backgroundColor: source.color,
                        opacity: 0.4 + ev.confidence * 0.6,
                      }}
                      title={`${ev.midiNote} · ${(ev.confidence * 100).toFixed(0)}%`}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-prisma-border flex-shrink-0">
        <button className="w-full btn-secondary text-xs flex items-center justify-center gap-2">
          <i className="fas fa-plus"></i>
          <span>Añadir fuente</span>
        </button>
        <div className="mt-2 flex items-center justify-between text-[9px] text-prisma-text-muted">
          <span>
            <i className="fas fa-keyboard mr-1"></i>
            Alt+1: Mostrar/Ocultar
          </span>
        </div>
      </div>
    </div>
  );
}
