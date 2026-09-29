import React, { useState, useCallback } from 'react';
import { useAppState } from '../store';
import { v4 as uuidv4 } from 'uuid';
import { MusicalEvent } from '../types';

const STAGES = [
  { id: 'import', label: 'Importación', icon: 'fa-file-import', desc: 'Carga y decodificación del audio' },
  { id: 'diagnostic', label: 'Diagnóstico', icon: 'fa-stethoscope', desc: 'Análisis de formato, canales, ruido' },
  { id: 'spectral', label: 'Análisis Espectral', icon: 'fa-chart-bar', desc: 'Espectrograma y componentes' },
  { id: 'separation', label: 'Separación de Fuentes', icon: 'fa-magnet', desc: 'Agrupación por afinidad tímbrica' },
  { id: 'detection', label: 'Detección de Notas', icon: 'fa-music', desc: 'Alturas, ataques y duraciones' },
  { id: 'rhythm', label: 'Mapa Rítmico', icon: 'fa-clock', desc: 'Tempo, compases y subdivisiones' },
  { id: 'quantization', label: 'Cuantización', icon: 'fa-th', desc: 'Alineación a rejilla musical' },
  { id: 'correction', label: 'Corrección', icon: 'fa-brain', desc: 'Resolución de incidencias' },
  { id: 'notation', label: 'Notación', icon: 'fa-pen', desc: 'Generación de partitura' },
  { id: 'export', label: 'Exportación', icon: 'fa-file-export', desc: 'MIDI, MusicXML, PDF' },
];

export function ProcessingPipeline() {
  const { state, dispatch } = useAppState();
  const [currentStage, setCurrentStage] = useState(-1);
  const [completedStages, setCompletedStages] = useState<number[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runPipeline = useCallback(async () => {
    setIsRunning(true);
    setCompletedStages([]);
    
    for (let i = 0; i < STAGES.length; i++) {
      setCurrentStage(i);
      dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: true, stage: STAGES[i].label, progress: (i / STAGES.length) * 100 } });
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));
      
      // If this is the detection stage and we have audio, generate events
      if (STAGES[i].id === 'detection' && state.audio?.buffer) {
        const buffer = state.audio.buffer;
        const data = buffer.getChannelData(0);
        const sampleRate = buffer.sampleRate;
        const events: MusicalEvent[] = [];
        
        const frameSize = 2048;
        const hopSize = 512;
        const numFrames = Math.floor((data.length - frameSize) / hopSize);
        
        let prevEnergy = 0;
        let noteStart = -1;
        let noteFreq = 0;

        for (let frame = 0; frame < numFrames; frame++) {
          const start = frame * hopSize;
          let energy = 0;
          for (let j = 0; j < frameSize; j++) {
            energy += (data[start + j] || 0) ** 2;
          }
          energy = Math.sqrt(energy / frameSize);

          let bestCorr = 0, bestPeriod = 0;
          if (energy > 0.01) {
            for (let period = Math.floor(sampleRate / 2000); period < Math.min(Math.floor(sampleRate / 60), frameSize / 2); period++) {
              let corr = 0;
              for (let j = 0; j < frameSize - period; j++) {
                corr += (data[start + j] || 0) * (data[start + j + period] || 0);
              }
              if (corr > bestCorr) { bestCorr = corr; bestPeriod = period; }
            }
          }

          const freq = bestPeriod > 0 ? sampleRate / bestPeriod : 0;
          const energyDiff = energy - prevEnergy;

          if (energyDiff > 0.01 && noteStart === -1 && freq > 60 && freq < 5000) {
            noteStart = start / sampleRate;
            noteFreq = freq;
          }

          if (noteStart >= 0 && (energy < 0.005 || energyDiff < -0.02)) {
            const noteEnd = start / sampleRate;
            const duration = noteEnd - noteStart;
            if (duration > 0.03 && duration < 5) {
              const midi = Math.round(69 + 12 * Math.log2(noteFreq / 440));
              if (midi >= 21 && midi <= 108) {
                const barDuration = (60 / state.tempo) * state.timeSignature[0];
                events.push({
                  id: uuidv4(),
                  sourceId: state.sources[0]?.id || 'src-1',
                  startTime: noteStart,
                  endTime: noteEnd,
                  frequency: noteFreq,
                  midiNote: midi,
                  velocity: Math.min(127, Math.floor(energy * 500)),
                  duration,
                  pitchDeviation: 0,
                  confidence: Math.min(0.95, bestCorr / (frameSize * 0.5)),
                  status: 'detected',
                  voice: 1,
                  bar: Math.floor(noteStart / barDuration) + 1,
                  beat: Math.floor((noteStart % barDuration) / (60 / state.tempo)) + 1,
                  subBeat: 0,
                  history: [{ timestamp: Date.now(), field: 'all', oldValue: null, newValue: 'detected', reason: 'Pipeline automático', automated: true }],
                });
              }
            }
            noteStart = -1;
          }
          prevEnergy = energy;
        }
        dispatch({ type: 'SET_EVENTS', payload: events });
      }
      
      setCompletedStages(prev => [...prev, i]);
    }
    
    setCurrentStage(-1);
    setIsRunning(false);
    dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: false, stage: '', progress: 100 } });
  }, [state.audio, state.tempo, state.timeSignature, state.sources, dispatch]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <i className="fas fa-sync text-prisma-accent"></i>
          El Ciclo de la Transcripción
        </h2>
        <p className="text-sm text-prisma-muted mt-1">Análisis → Transcripción → Comparación → Corrección → Validación → Exportación</p>
      </div>

      {/* Run button */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={runPipeline}
          disabled={isRunning || !state.audio}
          className="px-6 py-3 bg-gradient-to-r from-prisma-accent to-prisma-accent2 text-white rounded-lg font-medium text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          <i className={`fas ${isRunning ? 'fa-spinner fa-spin' : 'fa-play'} mr-2`}></i>
          {isRunning ? 'Procesando...' : 'Ejecutar Pipeline Completo'}
        </button>
        {!state.audio && (
          <span className="text-xs text-prisma-warm">
            <i className="fas fa-exclamation-triangle mr-1"></i>Importa audio primero
          </span>
        )}
        {completedStages.length === STAGES.length && (
          <span className="text-xs text-prisma-success">
            <i className="fas fa-check-circle mr-1"></i>Pipeline completado
          </span>
        )}
      </div>

      {/* Progress bar */}
      {isRunning && (
        <div className="mb-6">
          <div className="h-2 bg-prisma-panel rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-prisma-accent to-prisma-accent2 transition-all duration-500"
              style={{ width: `${((currentStage + 1) / STAGES.length) * 100}%` }}
            />
          </div>
          <p className="text-[10px] text-prisma-muted mt-1">
            Etapa {currentStage + 1} de {STAGES.length}: {STAGES[currentStage]?.label}
          </p>
        </div>
      )}

      {/* Stages */}
      <div className="space-y-2">
        {STAGES.map((stage, i) => {
          const isCompleted = completedStages.includes(i);
          const isCurrent = currentStage === i;
          
          return (
            <div
              key={stage.id}
              className={`glass-panel rounded-lg p-4 flex items-center gap-4 transition-all ${
                isCurrent ? 'border-prisma-accent/50 bg-prisma-accent/5' :
                isCompleted ? 'border-prisma-success/30' : ''
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                isCompleted ? 'bg-prisma-success/20' :
                isCurrent ? 'bg-prisma-accent/20 animate-pulse-glow' :
                'bg-prisma-panel'
              }`}>
                {isCompleted ? (
                  <i className="fas fa-check text-prisma-success text-xs"></i>
                ) : isCurrent ? (
                  <i className="fas fa-spinner fa-spin text-prisma-accent text-xs"></i>
                ) : (
                  <span className="text-[10px] text-prisma-muted">{i + 1}</span>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <i className={`fas ${stage.icon} text-xs ${isCompleted ? 'text-prisma-success' : isCurrent ? 'text-prisma-accent' : 'text-prisma-muted'}`}></i>
                  <h4 className={`text-sm font-medium ${isCompleted ? 'text-prisma-success' : isCurrent ? 'text-prisma-accent' : 'text-prisma-muted'}`}>
                    {stage.label}
                  </h4>
                </div>
                <p className="text-[10px] text-prisma-muted mt-0.5">{stage.desc}</p>
              </div>
              <div className="text-[10px]">
                {isCompleted && <span className="text-prisma-success">✓ Completo</span>}
                {isCurrent && <span className="text-prisma-accent">⟳ En proceso</span>}
                {!isCompleted && !isCurrent && <span className="text-prisma-muted">Pendiente</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Results summary */}
      {completedStages.length === STAGES.length && (
        <div className="mt-6 glass-panel rounded-lg p-4 border border-prisma-success/30 animate-slide-in">
          <h3 className="text-sm font-semibold text-prisma-success mb-3">
            <i className="fas fa-check-circle mr-2"></i>Resultados del Pipeline
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <div className="bg-prisma-panel rounded p-2">
              <p className="text-lg font-bold text-white">{state.events.length}</p>
              <p className="text-[9px] text-prisma-muted">Eventos</p>
            </div>
            <div className="bg-prisma-panel rounded p-2">
              <p className="text-lg font-bold text-white">{state.sources.length}</p>
              <p className="text-[9px] text-prisma-muted">Fuentes</p>
            </div>
            <div className="bg-prisma-panel rounded p-2">
              <p className="text-lg font-bold text-white">{state.bars.length}</p>
              <p className="text-[9px] text-prisma-muted">Compases</p>
            </div>
            <div className="bg-prisma-panel rounded p-2">
              <p className="text-lg font-bold text-prisma-warm">{state.events.filter(e => e.confidence < 0.5).length}</p>
              <p className="text-[9px] text-prisma-muted">Incidencias</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
