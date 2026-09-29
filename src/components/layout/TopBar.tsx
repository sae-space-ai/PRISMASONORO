import React, { useState } from 'react';
import { useAppState } from '../../store';

interface TopBarProps {
  onToggleImprovement?: () => void;
  onToggleCapabilities?: () => void;
  showImprovement?: boolean;
  showCapabilities?: boolean;
}

export function TopBar({ onToggleImprovement, onToggleCapabilities, showImprovement, showCapabilities }: TopBarProps = {}) {
  const { state, dispatch } = useAppState();
  const [showExport, setShowExport] = useState(false);

  return (
    <div className="h-14 bg-prisma-surface border-b border-prisma-border flex items-center px-4 gap-4 flex-shrink-0">
      {/* Logo & Identity */}
      <div className="flex items-center gap-3 pr-4 border-r border-prisma-border">
        <div className="relative">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-prisma-accent via-prisma-accent-2 to-prisma-voice flex items-center justify-center">
            <i className="fas fa-diamond text-white text-sm"></i>
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-prisma-success border border-prisma-surface"></div>
        </div>
        <div>
          <h1 className="text-sm font-bold text-prisma-text tracking-wide">PRISMA SONORO</h1>
          <p className="text-[9px] text-prisma-text-secondary tracking-wider uppercase">Cada sonido, en su lugar</p>
        </div>
      </div>

      {/* Project & Import */}
      <div className="flex items-center gap-2">
        <button className="btn-secondary text-xs flex items-center gap-2">
          <i className="fas fa-folder-open"></i>
          <span>Proyecto</span>
        </button>
        <button
          onClick={() => {
            // P0 FIX: Navigate to lavadora view AND trigger file picker
            dispatch({ type: 'SET_VIEW', payload: 'lavadora' });
            // Dispatch custom event for AudioImport to listen
            window.dispatchEvent(new CustomEvent('prisma:trigger-import'));
          }}
          className="btn-primary text-xs flex items-center gap-2"
        >
          <i className="fas fa-cloud-upload-alt"></i>
          <span>Importar Audio</span>
        </button>
      </div>

      {/* Spacer */}
      <div className="flex-1"></div>

      {/* Audio Info */}
      {state.audio && (
        <div className="flex items-center gap-3 px-4 py-2 bg-prisma-surface-2 rounded-lg border border-prisma-border">
          <i className="fas fa-wave-square text-prisma-accent text-sm"></i>
          <div className="text-xs">
            <div className="text-prisma-text font-medium">{state.audio.name}</div>
            <div className="text-prisma-text-muted text-[10px]">
              {state.audio.duration.toFixed(1)}s · {state.audio.sampleRate}Hz · {state.audio.channels}ch
            </div>
          </div>
        </div>
      )}

      {/* Playback Controls */}
      <div className="flex items-center gap-1 px-3 py-1.5 bg-prisma-surface-2 rounded-lg border border-prisma-border">
        <button className="w-7 h-7 rounded hover:bg-prisma-border flex items-center justify-center text-prisma-text-secondary hover:text-prisma-text transition-colors">
          <i className="fas fa-step-backward text-xs"></i>
        </button>
        <button className="w-9 h-9 rounded bg-prisma-accent hover:bg-prisma-accent-2 flex items-center justify-center text-white transition-colors">
          <i className={`fas ${state.isPlaying ? 'fa-pause' : 'fa-play'} text-sm`}></i>
        </button>
        <button className="w-7 h-7 rounded hover:bg-prisma-border flex items-center justify-center text-prisma-text-secondary hover:text-prisma-text transition-colors">
          <i className="fas fa-step-forward text-xs"></i>
        </button>
        <div className="ml-2 text-xs text-prisma-text-secondary font-mono">
          {formatTime(state.playbackPosition)} / {state.audio ? formatTime(state.audio.duration) : '0:00'}
        </div>
      </div>

      {/* Progress */}
      {state.isProcessing && (
        <div className="flex items-center gap-2 px-3 py-2 bg-prisma-accent/10 border border-prisma-accent/30 rounded-lg">
          <i className="fas fa-spinner fa-spin text-prisma-accent text-sm"></i>
          <div className="text-xs">
            <div className="text-prisma-text">{state.processingStage}</div>
            <div className="text-prisma-text-muted text-[10px]">{state.progress.toFixed(0)}%</div>
          </div>
        </div>
      )}

      {/* Export */}
      <button
        onClick={() => dispatch({ type: 'SET_VIEW', payload: 'export' })}
        className="btn-secondary text-xs flex items-center gap-2"
      >
        <i className="fas fa-file-export"></i>
        <span>Exportar</span>
      </button>

      {/* Mejora Continua */}
      {onToggleImprovement && (
        <button
          onClick={onToggleImprovement}
          className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
            showImprovement ? 'bg-prisma-accent2/20 text-prisma-accent2' : 'text-prisma-text-secondary hover:text-prisma-text hover:bg-prisma-surface-2'
          }`}
          title="Mejora continua y agentes"
        >
          <i className="fas fa-chart-line mr-1.5"></i>
          <span>Mejora</span>
        </button>
      )}

      {/* Capacidades */}
      {onToggleCapabilities && (
        <button
          onClick={onToggleCapabilities}
          className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
            showCapabilities ? 'bg-prisma-accent/20 text-prisma-accent' : 'text-prisma-text-secondary hover:text-prisma-text hover:bg-prisma-surface-2'
          }`}
          title="36 mejoras controladas"
        >
          <i className="fas fa-sliders-h mr-1.5"></i>
          <span>Capacidades</span>
        </button>
      )}

      {/* Settings */}
      <button className="w-9 h-9 rounded-lg hover:bg-prisma-surface-2 flex items-center justify-center text-prisma-text-secondary hover:text-prisma-text transition-colors" title="Configuración">
        <i className="fas fa-cog"></i>
      </button>
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
