import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useAppState } from '../store';

interface Props { mode?: 'default' | 'frequency' | 'harmonic'; }

export function SpectralView({ mode = 'default' }: Props) {
  const { state, dispatch } = useAppState();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const waveCanvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState({ time: 1, freq: 1 });
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverFreq, setHoverFreq] = useState<number | null>(null);

  const drawSpectrogram = useCallback(() => {
    if (!state.audio?.buffer || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const buffer = state.audio.buffer;
    const data = buffer.getChannelData(0);
    const width = canvas.width;
    const height = canvas.height;
    const fftSize = 1024;
    const hopSize = 256;
    const numFrames = Math.floor((data.length - fftSize) / hopSize);
    const numBins = fftSize / 2;

    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, width, height);

    const timeScale = width / numFrames;
    const freqScale = height / numBins;

    // Compute and draw spectrogram using simple DFT approximation
    for (let frame = 0; frame < numFrames; frame++) {
      const start = frame * hopSize;
      // Use simple magnitude spectrum (approximation)
      for (let bin = 0; bin < numBins; bin++) {
        let real = 0, imag = 0;
        const freq = bin / numBins;
        // Simplified spectral computation
        for (let n = 0; n < Math.min(64, fftSize); n++) {
          const sample = data[start + n] || 0;
          const angle = 2 * Math.PI * bin * n / fftSize;
          real += sample * Math.cos(angle);
          imag -= sample * Math.sin(angle);
        }
        const magnitude = Math.sqrt(real * real + imag * imag) / 64;
        const db = 20 * Math.log10(magnitude + 1e-10);
        const normalized = Math.max(0, Math.min(1, (db + 80) / 80));

        const x = frame * timeScale;
        const y = height - (bin * freqScale);

        // Color mapping: blue → cyan → yellow → red
        const r = Math.floor(normalized < 0.5 ? 0 : (normalized - 0.5) * 2 * 255);
        const g = Math.floor(normalized < 0.33 ? normalized * 3 * 200 : normalized < 0.66 ? 200 : (1 - normalized) * 3 * 200);
        const b = Math.floor(normalized < 0.5 ? normalized * 2 * 255 : (1 - normalized) * 2 * 255);

        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, y, Math.ceil(timeScale) + 1, Math.ceil(freqScale) + 1);
      }
    }

    // Draw frequency labels
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '9px monospace';
    const freqLabels = [100, 500, 1000, 2000, 5000, 10000, 20000];
    freqLabels.forEach(f => {
      const bin = Math.floor(f / (buffer.sampleRate / fftSize));
      if (bin < numBins) {
        const y = height - bin * freqScale;
        ctx.fillText(`${f >= 1000 ? f/1000 + 'k' : f}Hz`, 4, y - 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    });

    // Draw time labels
    const timeStep = buffer.duration / 10;
    for (let t = 0; t <= buffer.duration; t += timeStep) {
      const x = (t / buffer.duration) * width;
      ctx.fillText(`${t.toFixed(1)}s`, x, height - 4);
    }

    // Playback cursor
    if (state.playbackPosition > 0) {
      const x = (state.playbackPosition / buffer.duration) * width;
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
  }, [state.audio, state.playbackPosition]);

  const drawWaveform = useCallback(() => {
    if (!state.audio?.buffer || !waveCanvasRef.current) return;
    const canvas = waveCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const data = state.audio.buffer.getChannelData(0);
    const width = canvas.width;
    const height = canvas.height;
    const step = Math.ceil(data.length / width);

    ctx.fillStyle = '#12121a';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#2a2a3a';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < width; i++) {
      let min = 1, max = -1;
      for (let j = 0; j < step; j++) {
        const v = data[i * step + j] || 0;
        if (v < min) min = v;
        if (v > max) max = v;
      }
      ctx.moveTo(i, (1 + min) * height / 2);
      ctx.lineTo(i, (1 + max) * height / 2);
    }
    ctx.stroke();
  }, [state.audio]);

  useEffect(() => {
    drawSpectrogram();
    drawWaveform();
  }, [drawSpectrogram, drawWaveform]);

  const handleCanvasMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!state.audio?.buffer || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = 1 - (e.clientY - rect.top) / rect.height;
    setHoverTime(x * state.audio.duration);
    const maxFreq = state.audio.sampleRate / 2;
    setHoverFreq(y * maxFreq);
  };

  const modeLabels = {
    default: { title: 'El Tapiz Sonoro', desc: 'Representación temporal y espectral navegable', icon: 'fa-wave-square' },
    frequency: { title: 'El Tamiz de Frecuencias', desc: 'Análisis por regiones espectrales (graves, medias, agudas)', icon: 'fa-filter' },
    harmonic: { title: 'El Prisma del Sonido', desc: 'Fundamental, armónicos y evolución tímbrica', icon: 'fa-diamond' },
  };

  const currentMode = modeLabels[mode];

  return (
    <div className="h-full flex flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <i className={`fas ${currentMode.icon} text-prisma-accent`}></i>
            {currentMode.title}
          </h2>
          <p className="text-xs text-prisma-muted">{currentMode.desc}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="text-xs px-2 py-1 rounded bg-prisma-panel text-prisma-muted hover:text-white">
            <i className="fas fa-search-plus mr-1"></i>Zoom
          </button>
          <button className="text-xs px-2 py-1 rounded bg-prisma-panel text-prisma-muted hover:text-white">
            <i className="fas fa-crosshairs mr-1"></i>Seleccionar
          </button>
        </div>
      </div>

      {!state.audio ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <i className="fas fa-wave-square text-4xl text-prisma-muted mb-3"></i>
            <p className="text-sm text-prisma-muted">Importa audio para visualizar el espectrograma</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-2">
          {/* Waveform */}
          <div className="h-20 flex-shrink-0">
            <canvas ref={waveCanvasRef} width={1200} height={80} className="w-full h-full rounded border border-prisma-border" />
          </div>

          {/* Spectrogram */}
          <div className="flex-1 relative">
            <canvas
              ref={canvasRef}
              width={1200}
              height={400}
              className="w-full h-full rounded border border-prisma-border cursor-crosshair"
              onMouseMove={handleCanvasMove}
              onMouseLeave={() => { setHoverTime(null); setHoverFreq(null); }}
            />
            {/* Hover info */}
            {hoverTime !== null && hoverFreq !== null && (
              <div className="absolute top-2 right-2 bg-prisma-surface/90 rounded px-2 py-1 text-[10px] text-prisma-text font-mono">
                <span className="text-prisma-accent2">{hoverTime.toFixed(3)}s</span>
                <span className="mx-2 text-prisma-border">|</span>
                <span className="text-prisma-warm">{hoverFreq >= 1000 ? (hoverFreq/1000).toFixed(1) + ' kHz' : hoverFreq.toFixed(0) + ' Hz'}</span>
              </div>
            )}

            {/* Mode-specific overlays */}
            {mode === 'frequency' && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute left-0 right-0 bottom-0 h-1/3 border-t border-dashed border-blue-500/30">
                  <span className="absolute top-1 left-2 text-[9px] text-blue-400/60">GRAVES (20-300 Hz)</span>
                </div>
                <div className="absolute left-0 right-0 bottom-1/3 h-1/3 border-t border-dashed border-green-500/30">
                  <span className="absolute top-1 left-2 text-[9px] text-green-400/60">MEDIAS (300-2kHz)</span>
                </div>
                <div className="absolute left-0 right-0 top-0 h-1/3 border-b border-dashed border-red-500/30">
                  <span className="absolute bottom-1 left-2 text-[9px] text-red-400/60">AGUDAS (2k-20kHz)</span>
                </div>
              </div>
            )}

            {mode === 'harmonic' && (
              <div className="absolute bottom-2 left-2 bg-prisma-surface/80 rounded p-2 text-[9px]">
                <p className="text-prisma-muted mb-1">Armónicos detectados:</p>
                <div className="flex gap-2">
                  <span className="text-prisma-accent">● F0</span>
                  <span className="text-prisma-accent2">● F1</span>
                  <span className="text-prisma-warm">● F2</span>
                  <span className="text-prisma-success">● F3</span>
                </div>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-[9px] text-prisma-muted">
            <span className="flex items-center gap-1"><span className="w-3 h-2 bg-blue-600 rounded-sm"></span>Bajo</span>
            <span className="flex items-center gap-1"><span className="w-3 h-2 bg-cyan-400 rounded-sm"></span>Medio</span>
            <span className="flex items-center gap-1"><span className="w-3 h-2 bg-yellow-400 rounded-sm"></span>Alto</span>
            <span className="flex items-center gap-1"><span className="w-3 h-2 bg-red-500 rounded-sm"></span>Muy alto</span>
            <span className="ml-auto">Energía espectral (dB)</span>
          </div>
        </div>
      )}
    </div>
  );
}
