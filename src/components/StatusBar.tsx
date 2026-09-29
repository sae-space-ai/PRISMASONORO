import React from 'react';
import { useAppState } from '../store';

export function StatusBar() {
  const { state } = useAppState();

  return (
    <footer className="h-7 bg-prisma-surface border-t border-prisma-border flex items-center px-4 gap-4 text-[10px] text-prisma-muted flex-shrink-0">
      {/* Left section */}
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1">
          <i className="fas fa-diamond text-prisma-accent text-[8px]"></i>
          PRISMA SONORO
        </span>
        <span className="text-prisma-border">|</span>
        {state.isProcessing ? (
          <span className="flex items-center gap-1 text-prisma-accent">
            <i className="fas fa-spinner fa-spin text-[8px]"></i>
            {state.processingStage} ({state.progress.toFixed(0)}%)
          </span>
        ) : (
          <span className="text-prisma-success flex items-center gap-1">
            <i className="fas fa-circle text-[5px]"></i>
            Listo
          </span>
        )}
      </div>

      {/* Center section */}
      <div className="flex-1 flex items-center justify-center gap-4">
        {state.audio && (
          <>
            <span><i className="fas fa-music mr-1"></i>{state.events.length} eventos</span>
            <span><i className="fas fa-layer-group mr-1"></i>{state.sources.filter(s => s.active).length} fuentes</span>
            <span><i className="fas fa-clock mr-1"></i>{state.tempo} BPM</span>
            <span><i className="fas fa-grip-lines-vertical mr-1"></i>{state.timeSignature[0]}/{state.timeSignature[1]}</span>
          </>
        )}
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3">
        {state.selectedEventId && (
          <span className="text-prisma-accent">
            <i className="fas fa-crosshairs mr-1"></i>Evento seleccionado
          </span>
        )}
        <span className="text-prisma-border">|</span>
        <span>v1.0.0</span>
        <span className="text-prisma-border">|</span>
        <span className="text-prisma-muted">Prof. Manuel Gago Fernández</span>
      </div>
    </footer>
  );
}
