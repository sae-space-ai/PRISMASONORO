import React, { useRef, useCallback, useState } from 'react';
import { useAppState } from '../store';
import { v4 as uuidv4 } from 'uuid';

export function AudioImport() {
  const { state, dispatch } = useAppState();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [diagnostic, setDiagnostic] = useState<any>(null);

  const processAudio = useCallback(async (file: File) => {
    setLoading(true);
    setDiagnostic(null);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

      const audioFile = {
        id: uuidv4(),
        name: file.name,
        duration: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate,
        channels: audioBuffer.numberOfChannels,
        format: file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN',
        size: file.size,
        buffer: audioBuffer,
      };

      dispatch({ type: 'SET_AUDIO', payload: audioFile });

      // Run diagnostic
      const channelData = audioBuffer.getChannelData(0);
      const rms = Math.sqrt(channelData.reduce((sum, s) => sum + s * s, 0) / channelData.length);
      const peak = Math.max(...channelData.map(Math.abs));
      const isClipping = peak > 0.99;

      // Simple noise floor estimation
      const sorted = [...channelData].map(Math.abs).sort((a, b) => a - b);
      const noiseFloor = sorted[Math.floor(sorted.length * 0.1)];

      setDiagnostic({
        duration: audioBuffer.duration.toFixed(2),
        sampleRate: audioBuffer.sampleRate,
        channels: audioBuffer.numberOfChannels,
        rms: (20 * Math.log10(rms)).toFixed(1),
        peak: (20 * Math.log10(peak)).toFixed(1),
        clipping: isClipping,
        noiseFloor: (20 * Math.log10(noiseFloor + 1e-10)).toFixed(1),
        dynamicRange: ((20 * Math.log10(peak)) - (20 * Math.log10(noiseFloor + 1e-10))).toFixed(1),
      });

      // Generate initial bars
      const estimatedTempo = 120;
      const beatsPerBar = 4;
      const beatDuration = 60 / estimatedTempo;
      const barDuration = beatDuration * beatsPerBar;
      const numBars = Math.floor(audioBuffer.duration / barDuration);
      const bars = Array.from({ length: numBars }, (_, i) => ({
        number: i + 1,
        startTime: i * barDuration,
        endTime: (i + 1) * barDuration,
        timeSignature: [4, 4] as [number, number],
        tempo: estimatedTempo,
        events: [],
      }));
      dispatch({ type: 'SET_BARS', payload: bars });
      dispatch({ type: 'SET_TEMPO', payload: estimatedTempo });

      setLoading(false);
    } catch (err) {
      console.error('Error processing audio:', err);
      setLoading(false);
    }
  }, [dispatch]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('audio/')) {
      processAudio(file);
    }
  }, [processAudio]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processAudio(file);
  }, [processAudio]);

  const loadDemo = useCallback(() => {
    // Generate a synthetic audio buffer for demo
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const duration = 8;
    const sampleRate = 44100;
    const buffer = audioCtx.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);

    // Generate a simple melody: C major scale with some rhythm
    const notes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
    const beatLen = sampleRate * 0.4;

    for (let i = 0; i < notes.length; i++) {
      const start = i * beatLen;
      const freq = notes[i % notes.length];
      for (let j = 0; j < beatLen && start + j < data.length; j++) {
        const t = j / sampleRate;
        const envelope = Math.exp(-t * 3) * 0.5;
        data[start + j] = envelope * Math.sin(2 * Math.PI * freq * t);
      }
    }

    const audioFile = {
      id: uuidv4(),
      name: 'demo_c_major.wav',
      duration: duration,
      sampleRate: sampleRate,
      channels: 1,
      format: 'WAV',
      size: duration * sampleRate * 2,
      buffer: buffer,
    };

    dispatch({ type: 'SET_AUDIO', payload: audioFile });

    const bars = Array.from({ length: Math.floor(duration / 2) }, (_, i) => ({
      number: i + 1,
      startTime: i * 2,
      endTime: (i + 1) * 2,
      timeSignature: [4, 4] as [number, number],
      tempo: 120,
      events: [],
    }));
    dispatch({ type: 'SET_BARS', payload: bars });

    setDiagnostic({
      duration: duration.toFixed(2),
      sampleRate: sampleRate,
      channels: 1,
      rms: '-12.0',
      peak: '-6.0',
      clipping: false,
      noiseFloor: '-60.0',
      dynamicRange: '54.0',
    });
  }, [dispatch]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <i className="fas fa-water text-prisma-accent2"></i>
          La Lavadora Musical
        </h2>
        <p className="text-sm text-prisma-muted mt-1">Diagnóstico y preparación del audio. Conserva permanentemente el original.</p>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`rounded-xl border-2 border-dashed p-12 text-center cursor-pointer transition-all ${
          dragOver ? 'border-prisma-accent bg-prisma-accent/10' : 'border-prisma-border hover:border-prisma-accent/50'
        }`}
      >
        <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileSelect} className="hidden" />
        {loading ? (
          <div>
            <i className="fas fa-spinner fa-spin text-3xl text-prisma-accent mb-3"></i>
            <p className="text-sm text-prisma-muted">Decodificando audio...</p>
          </div>
        ) : (
          <div>
            <i className="fas fa-cloud-upload-alt text-4xl text-prisma-accent mb-3"></i>
            <p className="text-sm text-white mb-1">Arrastra un archivo de audio aquí</p>
            <p className="text-xs text-prisma-muted">WAV · MP3 · FLAC · AIFF</p>
          </div>
        )}
      </div>

      {/* Demo button */}
      <div className="mt-4 text-center">
        <button onClick={loadDemo} className="text-xs text-prisma-accent hover:text-prisma-accent2 transition-colors">
          <i className="fas fa-flask mr-1"></i>Cargar audio de demostración (escala de Do mayor)
        </button>
      </div>

      {/* Diagnostic Panel */}
      {diagnostic && (
        <div className="mt-6 glass-panel rounded-xl p-5 animate-slide-in">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <i className="fas fa-stethoscope text-prisma-success"></i>
            Diagnóstico del Audio
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-prisma-panel rounded-lg p-3">
              <p className="text-[10px] text-prisma-muted uppercase">Duración</p>
              <p className="text-lg font-bold text-white">{diagnostic.duration}s</p>
            </div>
            <div className="bg-prisma-panel rounded-lg p-3">
              <p className="text-[10px] text-prisma-muted uppercase">Muestreo</p>
              <p className="text-lg font-bold text-white">{diagnostic.sampleRate} Hz</p>
            </div>
            <div className="bg-prisma-panel rounded-lg p-3">
              <p className="text-[10px] text-prisma-muted uppercase">Canales</p>
              <p className="text-lg font-bold text-white">{diagnostic.channels}</p>
            </div>
            <div className="bg-prisma-panel rounded-lg p-3">
              <p className="text-[10px] text-prisma-muted uppercase">RMS</p>
              <p className="text-lg font-bold text-white">{diagnostic.rms} dB</p>
            </div>
            <div className="bg-prisma-panel rounded-lg p-3">
              <p className="text-[10px] text-prisma-muted uppercase">Pico</p>
              <p className="text-lg font-bold text-white">{diagnostic.peak} dB</p>
            </div>
            <div className="bg-prisma-panel rounded-lg p-3">
              <p className="text-[10px] text-prisma-muted uppercase">Rango Dinámico</p>
              <p className="text-lg font-bold text-white">{diagnostic.dynamicRange} dB</p>
            </div>
            <div className="bg-prisma-panel rounded-lg p-3">
              <p className="text-[10px] text-prisma-muted uppercase">Suelo de Ruido</p>
              <p className="text-lg font-bold text-white">{diagnostic.noiseFloor} dB</p>
            </div>
            <div className={`bg-prisma-panel rounded-lg p-3 ${diagnostic.clipping ? 'border border-prisma-error' : ''}`}>
              <p className="text-[10px] text-prisma-muted uppercase">Saturación</p>
              <p className={`text-lg font-bold ${diagnostic.clipping ? 'text-prisma-error' : 'text-prisma-success'}`}>
                {diagnostic.clipping ? 'SÍ' : 'NO'}
              </p>
            </div>
          </div>

          {/* Recommendations */}
          <div className="mt-4 p-3 bg-prisma-panel rounded-lg">
            <p className="text-[10px] text-prisma-muted uppercase mb-2">Recomendaciones</p>
            <ul className="text-xs text-prisma-text space-y-1">
              {diagnostic.clipping && <li className="text-prisma-error"><i className="fas fa-exclamation-triangle mr-1"></i>Se detecta saturación. Considerar reducción de ganancia.</li>}
              <li className="text-prisma-success"><i className="fas fa-check mr-1"></i>Audio listo para análisis espectral.</li>
              <li className="text-prisma-accent2"><i className="fas fa-arrow-right mr-1"></i>Continuar con El Tapiz Sonoro para visualización.</li>
            </ul>
          </div>

          {/* Waveform Preview */}
          <WaveformPreview buffer={state.audio?.buffer} />
        </div>
      )}

      {state.audio && !diagnostic && (
        <div className="mt-6 text-center">
          <p className="text-sm text-prisma-success"><i className="fas fa-check-circle mr-1"></i>Audio cargado: {state.audio.name}</p>
          <WaveformPreview buffer={state.audio.buffer} />
        </div>
      )}
    </div>
  );
}

function WaveformPreview({ buffer }: { buffer?: AudioBuffer }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    if (!buffer || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const data = buffer.getChannelData(0);
    const width = canvas.width;
    const height = canvas.height;
    const step = Math.ceil(data.length / width);

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#1a1a26';
    ctx.fillRect(0, 0, width, height);

    // Draw center line
    ctx.strokeStyle = '#2a2a3a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Draw waveform
    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < width; i++) {
      let min = 1.0, max = -1.0;
      for (let j = 0; j < step; j++) {
        const val = data[i * step + j] || 0;
        if (val < min) min = val;
        if (val > max) max = val;
      }
      const yMin = (1 + min) * height / 2;
      const yMax = (1 + max) * height / 2;
      ctx.moveTo(i, yMin);
      ctx.lineTo(i, yMax);
    }
    ctx.stroke();

    // Draw gradient overlay
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(124, 58, 237, 0.1)');
    gradient.addColorStop(0.5, 'rgba(124, 58, 237, 0.05)');
    gradient.addColorStop(1, 'rgba(124, 58, 237, 0.1)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }, [buffer]);

  return (
    <div className="mt-4">
      <p className="text-[10px] text-prisma-muted uppercase mb-2">Forma de Onda</p>
      <canvas ref={canvasRef} width={800} height={120} className="w-full h-24 rounded-lg border border-prisma-border" />
    </div>
  );
}
