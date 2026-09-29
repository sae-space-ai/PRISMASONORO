import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useAppState } from '../../store';

type ViewMode = 'spectrogram' | 'sources' | 'pianoroll' | 'combined';

export function CentralCanvas() {
  const { state, dispatch } = useAppState();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('spectrogram');
  const [hoverInfo, setHoverInfo] = useState<{ time: number; freq: number; note?: number } | null>(null);

  const draw = useCallback(() => {
    if (!canvasRef.current || !state.audio?.buffer) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const buffer = state.audio.buffer;
    const data = buffer.getChannelData(0);
    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.fillStyle = '#080D18';
    ctx.fillRect(0, 0, width, height);

    if (viewMode === 'spectrogram' || viewMode === 'combined') {
      drawSpectrogram(ctx, data, buffer.sampleRate, width, height);
    }

    if (viewMode === 'sources' || viewMode === 'combined') {
      drawSources(ctx, width, height);
    }

    if (viewMode === 'pianoroll') {
      drawPianoRoll(ctx, width, height);
    }

    // Timeline
    drawTimeline(ctx, width, height, buffer.duration);

    // Playback cursor
    if (state.playbackPosition > 0) {
      const x = (state.playbackPosition / buffer.duration) * width;
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
  }, [state.audio, state.events, state.sources, state.playbackPosition, viewMode]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!state.audio?.buffer || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = 1 - (e.clientY - rect.top) / rect.height;
    const time = x * state.audio.duration;
    const maxFreq = state.audio.sampleRate / 2;
    const freq = y * maxFreq;
    
    // Find nearest event
    const nearestEvent = state.events.reduce((nearest, ev) => {
      const dist = Math.abs(ev.startTime - time);
      if (!nearest || dist < nearest.dist) {
        return { dist, event: ev };
      }
      return nearest;
    }, null as { dist: number; event: typeof state.events[0] } | null);

    setHoverInfo({
      time,
      freq,
      note: nearestEvent && nearestEvent.dist < 0.1 ? nearestEvent.event.midiNote : undefined,
    });
  };

  return (
    <div className="h-full flex flex-col bg-prisma-bg">
      {/* View Mode Selector */}
      <div className="h-10 px-3 border-b border-prisma-border flex items-center gap-2 flex-shrink-0">
        <div className="flex items-center gap-1 bg-prisma-surface rounded-lg p-1">
          {[
            { id: 'spectrogram', label: 'Espectrograma', icon: 'fa-wave-square' },
            { id: 'sources', label: 'Fuentes', icon: 'fa-layer-group' },
            { id: 'pianoroll', label: 'Piano Roll', icon: 'fa-th' },
            { id: 'combined', label: 'Combinado', icon: 'fa-object-group' },
          ].map(mode => (
            <button
              key={mode.id}
              onClick={() => setViewMode(mode.id as ViewMode)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                viewMode === mode.id
                  ? 'bg-prisma-accent text-white'
                  : 'text-prisma-text-secondary hover:text-prisma-text hover:bg-prisma-surface-2'
              }`}
            >
              <i className={`fas ${mode.icon} mr-1.5`}></i>
              {mode.label}
            </button>
          ))}
        </div>

        <div className="flex-1"></div>

        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <button className="w-7 h-7 rounded hover:bg-prisma-surface-2 flex items-center justify-center text-prisma-text-secondary hover:text-prisma-text transition-colors">
            <i className="fas fa-search-plus text-xs"></i>
          </button>
          <button className="w-7 h-7 rounded hover:bg-prisma-surface-2 flex items-center justify-center text-prisma-text-secondary hover:text-prisma-text transition-colors">
            <i className="fas fa-search-minus text-xs"></i>
          </button>
          <button className="w-7 h-7 rounded hover:bg-prisma-surface-2 flex items-center justify-center text-prisma-text-secondary hover:text-prisma-text transition-colors">
            <i className="fas fa-expand text-xs"></i>
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        {!state.audio ? (
          <EmptyState />
        ) : (
          <>
            <canvas
              ref={canvasRef}
              width={1600}
              height={800}
              className="w-full h-full cursor-crosshair"
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setHoverInfo(null)}
            />
            
            {/* Hover info */}
            {hoverInfo && (
              <div className="absolute top-3 right-3 glass-panel-elevated px-3 py-2 text-xs animate-fade-in">
                <div className="flex items-center gap-3">
                  <div>
                    <span className="text-prisma-text-muted">Tiempo:</span>
                    <span className="ml-1 text-prisma-text font-mono">{hoverInfo.time.toFixed(3)}s</span>
                  </div>
                  <div>
                    <span className="text-prisma-text-muted">Freq:</span>
                    <span className="ml-1 text-prisma-text font-mono">
                      {hoverInfo.freq >= 1000 ? `${(hoverInfo.freq / 1000).toFixed(1)}kHz` : `${hoverInfo.freq.toFixed(0)}Hz`}
                    </span>
                  </div>
                  {hoverInfo.note && (
                    <div>
                      <span className="text-prisma-text-muted">Nota:</span>
                      <span className="ml-1 text-prisma-accent font-mono">{hoverInfo.note}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="absolute bottom-3 left-3 glass-panel-elevated px-3 py-2 text-[10px]">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-prisma-strings"></span>
                  Cuerda
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-prisma-woodwind"></span>
                  Madera
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-prisma-brass"></span>
                  Metal
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-prisma-percussion"></span>
                  Percusión
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-prisma-voice"></span>
                  Voz
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-prisma-surface flex items-center justify-center">
          <i className="fas fa-wave-square text-3xl text-prisma-text-muted"></i>
        </div>
        <h3 className="text-lg font-semibold text-prisma-text mb-2">El Tapiz Sonoro</h3>
        <p className="text-sm text-prisma-text-secondary mb-4">
          Importa un archivo de audio para comenzar el análisis
        </p>
        <p className="text-xs text-prisma-text-muted">
          WAV · MP3 · FLAC · AIFF
        </p>
      </div>
    </div>
  );
}

function drawSpectrogram(ctx: CanvasRenderingContext2D, data: Float32Array, sampleRate: number, width: number, height: number) {
  const fftSize = 1024;
  const hopSize = 256;
  const numFrames = Math.floor((data.length - fftSize) / hopSize);
  const numBins = fftSize / 2;

  for (let frame = 0; frame < numFrames; frame++) {
    const start = frame * hopSize;
    for (let bin = 0; bin < numBins; bin++) {
      let real = 0, imag = 0;
      for (let n = 0; n < Math.min(64, fftSize); n++) {
        const sample = data[start + n] || 0;
        const angle = 2 * Math.PI * bin * n / fftSize;
        real += sample * Math.cos(angle);
        imag -= sample * Math.sin(angle);
      }
      const magnitude = Math.sqrt(real * real + imag * imag) / 64;
      const db = 20 * Math.log10(magnitude + 1e-10);
      const normalized = Math.max(0, Math.min(1, (db + 80) / 80));

      const x = (frame / numFrames) * width;
      const y = height - (bin / numBins) * height;

      // Color gradient: deep blue → cyan → yellow → red
      const r = Math.floor(normalized < 0.5 ? 0 : (normalized - 0.5) * 2 * 255);
      const g = Math.floor(normalized < 0.33 ? normalized * 3 * 200 : normalized < 0.66 ? 200 : (1 - normalized) * 3 * 200);
      const b = Math.floor(normalized < 0.5 ? normalized * 2 * 255 : (1 - normalized) * 2 * 255);

      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x, y, Math.ceil(width / numFrames) + 1, Math.ceil(height / numBins) + 1);
    }
  }
}

function drawSources(ctx: CanvasRenderingContext2D, width: number, height: number) {
  // This would draw source-colored events
  // For now, placeholder
}

function drawPianoRoll(ctx: CanvasRenderingContext2D, width: number, height: number) {
  // This would draw piano roll
  // For now, placeholder
}

function drawTimeline(ctx: CanvasRenderingContext2D, width: number, height: number, duration: number) {
  ctx.fillStyle = 'rgba(8, 13, 24, 0.8)';
  ctx.fillRect(0, height - 30, width, 30);

  ctx.strokeStyle = '#2A3550';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, height - 30);
  ctx.lineTo(width, height - 30);
  ctx.stroke();

  const timeStep = duration / 10;
  ctx.fillStyle = '#AAB8CE';
  ctx.font = '10px Inter';
  for (let t = 0; t <= duration; t += timeStep) {
    const x = (t / duration) * width;
    ctx.fillText(`${t.toFixed(1)}s`, x + 2, height - 10);
    
    ctx.strokeStyle = '#2A3550';
    ctx.beginPath();
    ctx.moveTo(x, height - 30);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
}
