import React from 'react';
import { useAppState } from '../../store';
import { ViewType } from '../../types';

const CODEX_FUNCTIONS = [
  { id: 'lavadora' as ViewType, name: 'Lavadora', desc: 'Preparar audio', icon: 'fa-water', color: 'text-prisma-info' },
  { id: 'tapiz' as ViewType, name: 'Tapiz', desc: 'Observar', icon: 'fa-wave-square', color: 'text-prisma-accent' },
  { id: 'imanes' as ViewType, name: 'Imanes', desc: 'Separar fuentes', icon: 'fa-magnet', color: 'text-prisma-woodwind' },
  { id: 'tamiz' as ViewType, name: 'Tamiz', desc: 'Examinar frecuencias', icon: 'fa-filter', color: 'text-prisma-strings' },
  { id: 'prisma' as ViewType, name: 'Prisma', desc: 'Analizar timbres', icon: 'fa-diamond', color: 'text-prisma-brass' },
  { id: 'fotocopiadora' as ViewType, name: 'Fotocopiadora', desc: 'Reconstruir eventos', icon: 'fa-copy', color: 'text-prisma-voice' },
  { id: 'algoritmo' as ViewType, name: 'Algoritmo', desc: 'Resolver incidencias', icon: 'fa-brain', color: 'text-prisma-percussion' },
  { id: 'manuscrito' as ViewType, name: 'Manuscrito', desc: 'Escribir partitura', icon: 'fa-pen-fancy', color: 'text-prisma-success' },
  { id: 'ciclo' as ViewType, name: 'Ciclo', desc: 'Comprobar y mejorar', icon: 'fa-sync', color: 'text-prisma-accent-2' },
];

export function CodeNavigation() {
  const { state, dispatch } = useAppState();

  const getFunctionStatus = (id: ViewType): 'pending' | 'running' | 'completed' | 'review' | 'error' => {
    // FIX: No false green states - require real evidence of completion
    if (!state.audio) return 'pending';
    
    switch (id) {
      case 'lavadora':
        // Only completed if audio exists AND we have diagnostics (implied by moving past import)
        // For now, show as 'running' if audio exists but no events yet
        return state.events.length === 0 ? 'running' : 'completed';
      case 'tapiz':
        // Only completed if we have events (spectral analysis implied)
        return state.events.length > 0 ? 'completed' : 'pending';
      case 'imanes':
        return state.sources.some(s => s.instrument.family !== 'unknown') ? 'completed' : 'pending';
      case 'tamiz':
      case 'prisma':
        // Only completed if we have events (frequency analysis implied)
        return state.events.length > 0 ? 'completed' : 'pending';
      case 'fotocopiadora':
        return state.events.length > 0 ? 'completed' : 'pending';
      case 'algoritmo':
        const issues = state.events.filter(e => e.confidence < 0.5).length;
        return issues > 0 ? 'review' : state.events.length > 0 ? 'completed' : 'pending';
      case 'manuscrito':
        return state.events.length > 10 ? 'completed' : 'pending';
      case 'ciclo':
        return state.events.length > 0 ? 'completed' : 'pending';
      default:
        return 'pending';
    }
  };

  return (
    <div className="h-12 bg-prisma-surface border-b border-prisma-border flex items-center px-3 gap-1 overflow-x-auto flex-shrink-0">
      {CODEX_FUNCTIONS.map((fn, index) => {
        const status = getFunctionStatus(fn.id);
        const isActive = state.currentView === fn.id;

        return (
          <React.Fragment key={fn.id}>
            <button
              onClick={() => dispatch({ type: 'SET_VIEW', payload: fn.id })}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-prisma-accent text-white shadow-lg shadow-prisma-accent/20'
                  : 'hover:bg-prisma-surface-2 text-prisma-text-secondary hover:text-prisma-text'
              }`}
              title={`${fn.name}: ${fn.desc}`}
            >
              <div className="relative">
                <i className={`fas ${fn.icon} text-xs ${isActive ? 'text-white' : fn.color}`}></i>
                {/* Status indicator */}
                <span className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full border border-prisma-surface ${
                  status === 'completed' ? 'bg-prisma-success' :
                  status === 'running' ? 'bg-prisma-accent animate-pulse' :
                  status === 'review' ? 'bg-prisma-warning' :
                  status === 'error' ? 'bg-prisma-error' :
                  'bg-prisma-text-muted'
                }`}></span>
              </div>
              <div className="text-left">
                <div className="text-[10px] font-medium leading-tight">{fn.name}</div>
                <div className="text-[8px] leading-tight opacity-70">{fn.desc}</div>
              </div>
            </button>
            {index < CODEX_FUNCTIONS.length - 1 && (
              <div className="w-px h-6 bg-prisma-border mx-1"></div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
