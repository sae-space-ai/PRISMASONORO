import React, { useState } from 'react';
import { useCapabilities } from '../capabilities/store';
import { Capability, CapabilityId } from '../capabilities/types';

export function CapabilitiesPanel({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useCapabilities();
  const [filter, setFilter] = useState<'all' | 'protection' | 'speed' | 'fidelity' | 'learning' | 'export'>('all');

  const capabilities = Object.values(state.capabilities);
  const filtered = filter === 'all' ? capabilities : capabilities.filter(c => c.group === filter);

  const groups = {
    protection: { label: 'Protección', icon: 'fa-shield-alt', color: 'text-prisma-success' },
    speed: { label: 'Velocidad', icon: 'fa-tachometer-alt', color: 'text-prisma-accent2' },
    fidelity: { label: 'Fidelidad Musical', icon: 'fa-music', color: 'text-prisma-accent' },
    learning: { label: 'Aprendizaje', icon: 'fa-brain', color: 'text-prisma-warm' },
    export: { label: 'Edición y Exportación', icon: 'fa-file-export', color: 'text-prisma-accent2' },
  };

  const enabledCount = capabilities.filter(c => c.enabled).length;
  const experimentalCount = capabilities.filter(c => c.experimental && c.enabled).length;

  return (
    <div className="h-full flex flex-col bg-prisma-bg">
      {/* Header */}
      <div className="p-3 border-b border-prisma-border flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <i className="fas fa-sliders-h text-prisma-accent"></i>
          <h2 className="text-sm font-bold text-white">Control de Capacidades</h2>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-prisma-accent/20 text-prisma-accent">
            {enabledCount}/{capabilities.length} activas
          </span>
          {experimentalCount > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-prisma-warm/20 text-prisma-warm">
              {experimentalCount} experimentales
            </span>
          )}
        </div>
        <button onClick={onClose} className="text-prisma-muted hover:text-white text-xs">
          <i className="fas fa-times"></i>
        </button>
      </div>

      {/* Filters */}
      <div className="flex border-b border-prisma-border flex-shrink-0 overflow-x-auto">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-2 text-[10px] whitespace-nowrap transition-colors ${
            filter === 'all' ? 'text-prisma-accent border-b-2 border-prisma-accent' : 'text-prisma-muted hover:text-white'
          }`}
        >
          Todas
        </button>
        {Object.entries(groups).map(([key, group]) => (
          <button
            key={key}
            onClick={() => setFilter(key as any)}
            className={`px-3 py-2 text-[10px] whitespace-nowrap transition-colors ${
              filter === key ? 'text-prisma-accent border-b-2 border-prisma-accent' : 'text-prisma-muted hover:text-white'
            }`}
          >
            <i className={`fas ${group.icon} mr-1`}></i>{group.label}
          </button>
        ))}
      </div>

      {/* Capabilities list */}
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-3">
          {filtered.map(cap => (
            <CapabilityCard key={cap.id} capability={cap} onToggle={() => dispatch({ type: 'TOGGLE_CAPABILITY', payload: cap.id })} />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-prisma-border flex-shrink-0">
        <p className="text-[9px] text-prisma-muted">
          <i className="fas fa-info-circle mr-1"></i>
          Cada capacidad puede activarse/desactivarse independientemente. Las capacidades experimentales pueden requerir reinicio.
        </p>
      </div>
    </div>
  );
}

function CapabilityCard({ capability, onToggle }: { capability: Capability; onToggle: () => void }) {
  const groups = {
    protection: { label: 'Protección', color: 'border-prisma-success' },
    speed: { label: 'Velocidad', color: 'border-prisma-accent2' },
    fidelity: { label: 'Fidelidad', color: 'border-prisma-accent' },
    learning: { label: 'Aprendizaje', color: 'border-prisma-warm' },
    export: { label: 'Exportación', color: 'border-prisma-accent2' },
  };

  const group = groups[capability.group];

  return (
    <div className={`glass-panel rounded-lg p-3 border-l-4 ${group.color} ${!capability.enabled ? 'opacity-60' : ''}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-white">{capability.name}</span>
          {capability.experimental && (
            <span className="text-[8px] px-1.5 py-0.5 rounded bg-prisma-warm/20 text-prisma-warm">EXPERIMENTAL</span>
          )}
        </div>
        <button
          onClick={onToggle}
          className={`relative w-10 h-5 rounded-full transition-colors ${
            capability.enabled ? 'bg-prisma-success' : 'bg-prisma-panel'
          }`}
        >
          <span
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
              capability.enabled ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>
      <p className="text-[10px] text-prisma-muted mb-2">{capability.description}</p>
      {capability.dependencies.length > 0 && (
        <p className="text-[8px] text-prisma-muted">
          <i className="fas fa-link mr-1"></i>Dependencias: {capability.dependencies.join(', ')}
        </p>
      )}
      {capability.requiresRestart && capability.enabled && (
        <p className="text-[8px] text-prisma-warm mt-1">
          <i className="fas fa-redo mr-1"></i>Requiere reinicio
        </p>
      )}
    </div>
  );
}
