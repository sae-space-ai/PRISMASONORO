import React, { useState } from 'react';
import { useAppState } from '../store';
import { InstrumentCategory } from '../types';

const FAMILIES = [
  { value: 'strings', label: 'Cuerda', color: '#7c3aed' },
  { value: 'woodwind', label: 'Madera', color: '#06b6d4' },
  { value: 'brass', label: 'Metal', color: '#f59e0b' },
  { value: 'percussion', label: 'Percusión', color: '#ef4444' },
  { value: 'keyboard', label: 'Teclado', color: '#10b981' },
  { value: 'voice', label: 'Voz', color: '#ec4899' },
  { value: 'bass', label: 'Bajo', color: '#8b5cf6' },
  { value: 'unknown', label: 'Sin identificar', color: '#6b7280' },
];

const INSTRUMENTS: Record<string, string[]> = {
  strings: ['Violín', 'Viola', 'Violonchelo', 'Contrabajo', 'Guitarra', 'Arpa'],
  woodwind: ['Flauta', 'Oboe', 'Clarinete', 'Fagot', 'Saxofón'],
  brass: ['Trompeta', 'Trompa', 'Trombón', 'Tuba'],
  percussion: ['Timbal', 'Caja', 'Platillos', 'Xilófono', 'Marimba'],
  keyboard: ['Piano', 'Órgano', 'Clave', 'Sintetizador'],
  voice: ['Soprano', 'Contralto', 'Tenor', 'Barítono', 'Bajo'],
  bass: ['Bajo eléctrico', 'Bajo acústico', 'Synth Bass'],
  unknown: ['Sin identificar'],
};

export function SourcePanel() {
  const { state, dispatch } = useAppState();
  const [editingSource, setEditingSource] = useState<string | null>(null);

  const updateSourceInstrument = (sourceId: string, family: string, name: string) => {
    const familyData = FAMILIES.find(f => f.value === family);
    dispatch({
      type: 'UPDATE_SOURCE',
      payload: {
        id: sourceId,
        updates: {
          instrument: { family: family as InstrumentCategory['family'], name },
          color: familyData?.color || '#6b7280',
        },
      }
    });
    setEditingSource(null);
  };

  const eventsBySource = state.events.reduce((acc, ev) => {
    if (!acc[ev.sourceId]) acc[ev.sourceId] = [];
    acc[ev.sourceId].push(ev);
    return acc;
  }, {} as Record<string, typeof state.events>);

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <i className="fas fa-magnet text-prisma-accent"></i>
          Los Imanes del Timbre
        </h2>
        <p className="text-xs text-prisma-muted">Separación y agrupación por afinidad tímbrica. Permite solapamiento entre fuentes.</p>
      </div>

      {/* Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        {state.sources.map(source => {
          const sourceEvents = eventsBySource[source.id] || [];
          const avgConfidence = sourceEvents.length > 0
            ? sourceEvents.reduce((sum, e) => sum + e.confidence, 0) / sourceEvents.length
            : 0;

          return (
            <div key={source.id} className="glass-panel rounded-lg p-4 border-l-4" style={{ borderLeftColor: source.color }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: source.color }}></div>
                  <span className="text-sm font-medium text-white">{source.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => dispatch({ type: 'UPDATE_SOURCE', payload: { id: source.id, updates: { active: !source.active } } })}
                    className={`text-[10px] px-2 py-0.5 rounded ${source.active ? 'bg-prisma-success/20 text-prisma-success' : 'bg-prisma-panel text-prisma-muted'}`}
                  >
                    {source.active ? 'Activa' : 'Silenciada'}
                  </button>
                  <button
                    onClick={() => setEditingSource(editingSource === source.id ? null : source.id)}
                    className="text-[10px] px-2 py-0.5 rounded bg-prisma-panel text-prisma-muted hover:text-white"
                  >
                    <i className="fas fa-pen mr-1"></i>Editar
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <span className="text-prisma-muted">Instrumento:</span>
                  <span className="ml-1 text-white">{source.instrument.name}</span>
                </div>
                <div>
                  <span className="text-prisma-muted">Familia:</span>
                  <span className="ml-1 text-white">{FAMILIES.find(f => f.value === source.instrument.family)?.label}</span>
                </div>
                <div>
                  <span className="text-prisma-muted">Eventos:</span>
                  <span className="ml-1 text-prisma-accent2">{sourceEvents.length}</span>
                </div>
                <div>
                  <span className="text-prisma-muted">Confianza:</span>
                  <span className={`ml-1 ${avgConfidence > 0.7 ? 'text-prisma-success' : avgConfidence > 0.4 ? 'text-prisma-warm' : 'text-prisma-error'}`}>
                    {(avgConfidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Edit form */}
              {editingSource === source.id && (
                <div className="mt-3 pt-3 border-t border-prisma-border animate-slide-in">
                  <p className="text-[10px] text-prisma-muted mb-2">Asignar instrumento:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      className="text-[10px] bg-prisma-panel text-prisma-text rounded px-2 py-1 border border-prisma-border"
                      onChange={(e) => {
                        const family = e.target.value;
                        const instruments = INSTRUMENTS[family] || ['Sin identificar'];
                        updateSourceInstrument(source.id, family, instruments[0]);
                      }}
                    >
                      {FAMILIES.map(f => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>
                    <select
                      className="text-[10px] bg-prisma-panel text-prisma-text rounded px-2 py-1 border border-prisma-border"
                      onChange={(e) => {
                        const family = source.instrument.family;
                        updateSourceInstrument(source.id, family, e.target.value);
                      }}
                    >
                      {(INSTRUMENTS[source.instrument.family] || ['Sin identificar']).map(inst => (
                        <option key={inst} value={inst}>{inst}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Mini event visualization */}
              {sourceEvents.length > 0 && (
                <div className="mt-2 h-6 bg-prisma-panel rounded overflow-hidden flex items-end">
                  {sourceEvents.slice(0, 40).map((ev, i) => (
                    <div
                      key={i}
                      className="flex-1 min-w-[2px] rounded-t-sm"
                      style={{
                        height: `${(ev.velocity / 127) * 100}%`,
                        backgroundColor: source.color + 'aa',
                        opacity: 0.4 + ev.confidence * 0.6,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Source assignment info */}
      <div className="glass-panel rounded-lg p-4">
        <h3 className="text-xs font-semibold text-prisma-muted uppercase tracking-wider mb-3">
          <i className="fas fa-info-circle mr-2"></i>Correlación de fuentes
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[10px]">
          <div>
            <p className="text-prisma-muted mb-1">Asignación automática:</p>
            <ul className="space-y-1 text-prisma-text">
              <li>• Afinidad tímbrica por envolvente espectral</li>
              <li>• Continuidad temporal y estructura armónica</li>
              <li>• Características de ataque y decaimiento</li>
            </ul>
          </div>
          <div>
            <p className="text-prisma-muted mb-1">Consideraciones:</p>
            <ul className="space-y-1 text-prisma-text">
              <li>• Las fuentes pueden solaparse</li>
              <li>• Un punto tiempo-frecuencia puede pertenecer a varias fuentes</li>
              <li>• La identificación provisional es válida</li>
              <li>• Los colores son referenciales, no evidencia acústica</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Color legend */}
      <div className="mt-3 flex flex-wrap gap-2">
        {FAMILIES.map(f => (
          <span key={f.value} className="flex items-center gap-1 text-[9px] text-prisma-muted">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: f.color }}></span>
            {f.label}
          </span>
        ))}
      </div>
    </div>
  );
}
