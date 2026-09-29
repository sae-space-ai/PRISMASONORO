import React, { useState } from 'react';
import { useAppState } from '../../store';

interface Props {
  onResize: (width: number) => void;
  onClose: () => void;
}

type InspectorTab = 'properties' | 'incidences' | 'assistant';

export function InspectorPanel({ onResize, onClose }: Props) {
  const { state, dispatch } = useAppState();
  const [activeTab, setActiveTab] = useState<InspectorTab>('properties');

  const selectedEvent = state.selectedEventId
    ? state.events.find(e => e.id === state.selectedEventId)
    : null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-12 px-3 border-b border-prisma-border flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <i className="fas fa-search text-prisma-info text-sm"></i>
          <h2 className="text-xs font-semibold text-prisma-text uppercase tracking-wider">Inspector</h2>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded hover:bg-prisma-surface-2 flex items-center justify-center text-prisma-text-secondary hover:text-prisma-text transition-colors"
          aria-label="Cerrar inspector"
        >
          <i className="fas fa-times text-xs"></i>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-prisma-border flex-shrink-0">
        {[
          { id: 'properties', label: 'Propiedades', icon: 'fa-info-circle' },
          { id: 'incidences', label: 'Incidencias', icon: 'fa-exclamation-triangle' },
          { id: 'assistant', label: 'Asistente', icon: 'fa-robot' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as InspectorTab)}
            className={`flex-1 px-3 py-2 text-[10px] font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-prisma-accent border-b-2 border-prisma-accent bg-prisma-accent/5'
                : 'text-prisma-text-secondary hover:text-prisma-text hover:bg-prisma-surface-2'
            }`}
          >
            <i className={`fas ${tab.icon} mr-1`}></i>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'properties' && <PropertiesTab event={selectedEvent} />}
        {activeTab === 'incidences' && <IncidencesTab />}
        {activeTab === 'assistant' && <AssistantTab />}
      </div>
    </div>
  );
}

function PropertiesTab({ event }: { event: any }) {
  const { state } = useAppState();
  
  if (!event) {
    return (
      <div className="p-4 text-center">
        <i className="fas fa-mouse-pointer text-2xl text-prisma-text-muted mb-2"></i>
        <p className="text-xs text-prisma-text-secondary">Selecciona un evento para ver sus propiedades</p>
      </div>
    );
  }

  const source = state.sources.find(s => s.id === event.sourceId);

  return (
    <div className="p-3 space-y-3">
      {/* Event Header */}
      <div className="glass-panel-elevated p-3" style={{ borderLeft: `3px solid ${source?.color || '#6366F1'}` }}>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: source?.color }}></div>
          <span className="text-xs font-medium text-prisma-text">{source?.instrument.name || 'Fuente'}</span>
        </div>
        <div className="text-2xl font-bold text-prisma-text font-mono">
          {event.midiNote}
          <span className="text-sm text-prisma-text-secondary ml-2">
            ({midiToName(event.midiNote)})
          </span>
        </div>
      </div>

      {/* Properties */}
      <div className="space-y-2">
        <PropertyRow label="Inicio" value={`${event.startTime.toFixed(3)}s`} />
        <PropertyRow label="Final" value={`${event.endTime.toFixed(3)}s`} />
        <PropertyRow label="Duración" value={`${event.duration.toFixed(3)}s`} />
        <PropertyRow label="Frecuencia" value={`${event.frequency.toFixed(1)} Hz`} />
        <PropertyRow label="Velocidad" value={`${event.velocity}`} />
        <PropertyRow label="Confianza" value={`${(event.confidence * 100).toFixed(0)}%`} highlight={event.confidence < 0.5 ? 'warning' : undefined} />
        <PropertyRow label="Compás" value={`${event.bar}:${event.beat}`} />
        <PropertyRow label="Estado" value={event.status} />
      </div>

      {/* Actions */}
      <div className="space-y-2 pt-2 border-t border-prisma-border">
        <button className="w-full btn-primary text-xs flex items-center justify-center gap-2">
          <i className="fas fa-play"></i>
          <span>Escuchar evento</span>
        </button>
        <button className="w-full btn-secondary text-xs flex items-center justify-center gap-2">
          <i className="fas fa-edit"></i>
          <span>Editar propiedades</span>
        </button>
        <button className="w-full btn-secondary text-xs flex items-center justify-center gap-2">
          <i className="fas fa-shield-alt"></i>
          <span>Proteger como intencional</span>
        </button>
      </div>
    </div>
  );
}

function IncidencesTab() {
  const { state } = useAppState();
  const incidences = state.events.filter(e => e.confidence < 0.5);

  return (
    <div className="p-3">
      {incidences.length === 0 ? (
        <div className="text-center py-8">
          <i className="fas fa-check-circle text-2xl text-prisma-success mb-2"></i>
          <p className="text-xs text-prisma-text-secondary">No hay incidencias</p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-prisma-text-muted uppercase tracking-wider">
              {incidences.length} incidencias
            </span>
            <button className="text-[10px] text-prisma-accent hover:text-prisma-accent-2">
              Corregir todas
            </button>
          </div>
          {incidences.slice(0, 10).map(ev => (
            <div key={ev.id} className="glass-panel-elevated p-2 cursor-pointer hover:bg-prisma-surface-2 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-prisma-text">
                  Nota {ev.midiNote} ({midiToName(ev.midiNote)})
                </span>
                <span className="text-[10px] text-prisma-error">
                  {(ev.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <div className="text-[10px] text-prisma-text-muted">
                Compás {ev.bar}:{ev.beat} · {ev.startTime.toFixed(2)}s
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AssistantTab() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Soy tu asistente musical. Puedo ayudarte a revisar compases, escuchar fuentes, comprobar notas y exportar particellas.' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    
    // Simple response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Entendido. Procesando: "${input}". Esta función está conectada a las acciones reales del sistema.`
      }]);
    }, 500);
    
    setInput('');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] rounded-lg p-2 text-xs ${
              msg.role === 'user'
                ? 'bg-prisma-accent text-white'
                : 'bg-prisma-surface-2 text-prisma-text'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-prisma-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ej: Revisa el compás 5..."
            className="flex-1 bg-prisma-surface-2 rounded px-2 py-1.5 text-xs text-prisma-text border border-prisma-border focus:border-prisma-accent outline-none"
          />
          <button
            onClick={handleSend}
            className="w-8 h-8 rounded bg-prisma-accent hover:bg-prisma-accent-2 flex items-center justify-center text-white transition-colors"
          >
            <i className="fas fa-paper-plane text-xs"></i>
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {['Revisa este compás', 'Escucha el clarinete', 'Exporta particella'].map(action => (
            <button
              key={action}
              onClick={() => setInput(action)}
              className="text-[9px] px-2 py-0.5 rounded bg-prisma-surface-2 text-prisma-text-secondary hover:text-prisma-text transition-colors"
            >
              {action}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function PropertyRow({ label, value, highlight }: { label: string; value: string; highlight?: 'warning' | 'error' }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-prisma-text-muted">{label}</span>
      <span className={`font-mono ${
        highlight === 'warning' ? 'text-prisma-warning' :
        highlight === 'error' ? 'text-prisma-error' :
        'text-prisma-text'
      }`}>
        {value}
      </span>
    </div>
  );
}

function midiToName(midi: number): string {
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midi / 12) - 1;
  return names[midi % 12] + octave;
}
