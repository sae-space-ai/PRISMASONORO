import React, { useRef, useCallback, useState, useEffect } from 'react';
import { useAppState } from '../store';
import { v4 as uuidv4 } from 'uuid';
import { validateAudioFile, validateFileName } from '../security/validators';
import { securityLogger, ImportState } from '../security';

export function AudioImport() {
  const { state, dispatch } = useAppState();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [importState, setImportState] = useState<ImportState>('IDLE');
  const [diagnostic, setDiagnostic] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const operationIdRef = useRef<string | null>(null);

  // P0 FIX: Listen for trigger event from TopBar
  useEffect(() => {
    const handleTriggerImport = () => {
      if (fileInputRef.current && importState !== 'READING' && importState !== 'DECODING' && importState !== 'ANALYSING') {
        fileInputRef.current.value = ''; // Reset to allow same file selection
        fileInputRef.current.click();
      }
    };

    window.addEventListener('prisma:trigger-import', handleTriggerImport);
    return () => window.removeEventListener('prisma:trigger-import', handleTriggerImport);
  }, [importState]);

  const processAudio = useCallback(async (file: File) => {
    // SEC-01: Validar archivo antes de procesar
    const validation = validateAudioFile(file);
    if (!validation.valid) {
      setError(`Archivo no válido: ${validation.errors.join(', ')}`);
      setImportState('ERROR');
      return;
    }

    // SEC-04: Validar nombre de archivo
    const nameValidation = validateFileName(file.name);
    if (!nameValidation.valid) {
      setError(`Nombre de archivo no válido: ${nameValidation.errors.join(', ')}`);
      setImportState('ERROR');
      return;
    }

    // Control de concurrencia: cancelar operación anterior si existe
    const currentOperationId = uuidv4();
    operationIdRef.current = currentOperationId;

    setImportState('READING');
    setError(null);
    setDiagnostic(null);

    try {
      const arrayBuffer = await file.arrayBuffer();

      // Verificar que esta operación sigue siendo la vigente
      if (operationIdRef.current !== currentOperationId) {
        setImportState('CANCELLED');
        return;
      }

      setImportState('DECODING');
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      try {
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

        // Verificar nuevamente que esta operación sigue siendo la vigente
        if (operationIdRef.current !== currentOperationId) {
          audioCtx.close();
          setImportState('CANCELLED');
          return;
        }

        setImportState('ANALYSING');
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

        // SEC-04: Análisis acotado sin explosión de memoria
        // NO usar Math.max(...array) ni [...array].sort() en buffers grandes
        const channelData = audioBuffer.getChannelData(0);
        
        // Calcular RMS de forma incremental
        let sumSquares = 0;
        let peak = 0;
        for (let i = 0; i < channelData.length; i++) {
          const sample = channelData[i];
          const absSample = Math.abs(sample);
          sumSquares += sample * sample;
          if (absSample > peak) peak = absSample;
        }
        const rms = Math.sqrt(sumSquares / channelData.length);
        const isClipping = peak > 0.99;

        // Estimación de noise floor con muestreo acotado
        // En lugar de ordenar todo el buffer, muestrear 10000 puntos
        const sampleSize = Math.min(10000, channelData.length);
        const step = Math.floor(channelData.length / sampleSize);
        const samples: number[] = [];
        for (let i = 0; i < channelData.length && samples.length < sampleSize; i += step) {
          samples.push(Math.abs(channelData[i]));
        }
        samples.sort((a, b) => a - b);
        const noiseFloor = samples[Math.floor(samples.length * 0.1)] || 0;

        // Cerrar AudioContext para liberar recursos
        await audioCtx.close();

        setDiagnostic({
          duration: audioBuffer.duration.toFixed(2),
          sampleRate: audioBuffer.sampleRate,
          channels: audioBuffer.numberOfChannels,
          rms: (20 * Math.log10(rms + 1e-10)).toFixed(1),
          peak: (20 * Math.log10(peak + 1e-10)).toFixed(1),
          clipping: isClipping,
          noiseFloor: (20 * Math.log10(noiseFloor + 1e-10)).toFixed(1),
          dynamicRange: ((20 * Math.log10(peak + 1e-10)) - (20 * Math.log10(noiseFloor + 1e-10))).toFixed(1),
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

        setImportState('READY');

        securityLogger.log(
          'INPUT_VALIDATION',
          'AudioImport',
          'INFO',
          'SUCCESS',
          {
            fileName: file.name,
            duration: audioBuffer.duration,
            sampleRate: audioBuffer.sampleRate,
            channels: audioBuffer.numberOfChannels,
          }
        );
      } catch (decodeError) {
        await audioCtx.close();
        throw decodeError;
      }
    } catch (err) {
      // Verificar si fue cancelado
      if (operationIdRef.current !== currentOperationId) {
        setImportState('CANCELLED');
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      
      // Mostrar error específico al usuario
      if (errorMessage.includes('Unable to decode')) {
        setError('ARCHIVO NO COMPATIBLE o CORRUPTO. El navegador no puede decodificar este formato.');
      } else if (errorMessage.includes('Out of memory')) {
        setError('MEMORIA INSUFICIENTE. El archivo es demasiado grande para procesar.');
      } else {
        setError(`ERROR DE DECODIFICACIÓN: ${errorMessage}`);
      }
      
      setImportState('ERROR');

      securityLogger.log(
        'INPUT_VALIDATION',
        'AudioImport',
        'ERROR',
        'FAILURE',
        {
          fileName: file.name,
          error: errorMessage,
        }
      );
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
        onClick={() => {
          if (importState !== 'READING' && importState !== 'DECODING' && importState !== 'ANALYSING') {
            fileInputRef.current?.click();
          }
        }}
        className={`rounded-xl border-2 border-dashed p-12 text-center cursor-pointer transition-all ${
          dragOver ? 'border-prisma-accent bg-prisma-accent/10' : 'border-prisma-border hover:border-prisma-accent/50'
        }`}
      >
        <input 
          ref={fileInputRef} 
          type="file" 
          accept="audio/*" 
          onChange={handleFileSelect} 
          className="hidden"
          // Permitir seleccionar el mismo archivo dos veces
          onClick={(e) => {
            const target = e.target as HTMLInputElement;
            target.value = '';
          }}
        />
        {importState === 'READING' || importState === 'DECODING' || importState === 'ANALYSING' ? (
          <div>
            <i className="fas fa-spinner fa-spin text-3xl text-prisma-accent mb-3"></i>
            <p className="text-sm text-prisma-muted">
              {importState === 'READING' && 'Leyendo archivo...'}
              {importState === 'DECODING' && 'Decodificando audio...'}
              {importState === 'ANALYSING' && 'Analizando audio...'}
            </p>
            <p className="text-xs text-prisma-muted mt-1">Puedes cancelar seleccionando otro archivo</p>
          </div>
        ) : (
          <div>
            <i className="fas fa-cloud-upload-alt text-4xl text-prisma-accent mb-3"></i>
            <p className="text-sm text-white mb-1">Arrastra un archivo de audio aquí</p>
            <p className="text-xs text-prisma-muted">WAV · MP3 · FLAC · AIFF (máx. 500 MB)</p>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-prisma-error/10 border border-prisma-error rounded-lg">
          <div className="flex items-start gap-3">
            <i className="fas fa-exclamation-triangle text-prisma-error text-xl mt-0.5"></i>
            <div className="flex-1">
              <p className="text-sm font-semibold text-prisma-error mb-1">Error de Importación</p>
              <p className="text-xs text-prisma-text">{error}</p>
            </div>
            <button
              onClick={() => {
                setError(null);
                setImportState('IDLE');
              }}
              className="text-prisma-error hover:text-prisma-text transition-colors"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}

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
