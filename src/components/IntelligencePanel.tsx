import React, { useState, useEffect } from 'react';
import { useAppState } from '../store';
import { analyzeRhythm, analyzePitch, extractTimbreFeatures, classifyTimbre } from '../intelligence';

export function IntelligencePanel() {
  const { state } = useAppState();
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (state.audio?.buffer && !analysis) {
      runAnalysis();
    }
  }, [state.audio]);

  const runAnalysis = async () => {
    if (!state.audio?.buffer) return;
    
    setIsAnalyzing(true);
    
    try {
      // Análisis rítmico
      const rhythm = analyzeRhythm(state.audio.buffer);
      
      // Análisis de pitch
      const pitch = analyzePitch(state.audio.buffer);
      
      // Análisis tímbrico (primer segundo)
      const sampleRate = state.audio.buffer.sampleRate;
      const data = state.audio.buffer.getChannelData(0);
      const firstSecond = data.slice(0, sampleRate);
      const timbreFeatures = extractTimbreFeatures(firstSecond, sampleRate);
      const timbre = classifyTimbre(timbreFeatures);
      
      setAnalysis({
        rhythm,
        pitch,
        timbre,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Error en análisis musical:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!state.audio) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <i className="fas fa-brain text-6xl text-prisma-border mb-4"></i>
          <h2 className="text-xl font-bold text-prisma-text mb-2">
            Análisis Musical Inteligente
          </h2>
          <p className="text-prisma-muted">
            Importa un archivo de audio para comenzar el análisis
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-prisma-text mb-2">
          Análisis Musical Inteligente
        </h1>
        <p className="text-prisma-muted">
          Análisis automático de tempo, pitch y timbre
        </p>
      </div>

      {isAnalyzing && (
        <div className="mb-6 p-4 bg-prisma-surface rounded-lg border border-prisma-border">
          <div className="flex items-center gap-3">
            <i className="fas fa-spinner fa-spin text-prisma-accent"></i>
            <span className="text-prisma-text">Analizando audio...</span>
          </div>
        </div>
      )}

      {analysis && (
        <div className="space-y-6">
          {/* Análisis Rítmico */}
          <div className="glass-panel rounded-lg p-6">
            <h2 className="text-lg font-bold text-prisma-text mb-4 flex items-center gap-2">
              <i className="fas fa-drum text-prisma-accent"></i>
              Análisis Rítmico
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-prisma-muted mb-1">Tempo</p>
                <p className="text-2xl font-bold text-prisma-text">
                  {analysis.rhythm.tempo.bpm}
                  <span className="text-sm text-prisma-muted ml-1">BPM</span>
                </p>
                <p className="text-xs text-prisma-muted mt-1">
                  Confianza: {(analysis.rhythm.tempo.confidence * 100).toFixed(0)}%
                </p>
              </div>
              <div>
                <p className="text-xs text-prisma-muted mb-1">Compás</p>
                <p className="text-2xl font-bold text-prisma-text">
                  {analysis.rhythm.beats.timeSignature[0]}/{analysis.rhythm.beats.timeSignature[1]}
                </p>
                <p className="text-xs text-prisma-muted mt-1">
                  {analysis.rhythm.beats.beats.length} beats detectados
                </p>
              </div>
              <div>
                <p className="text-xs text-prisma-muted mb-1">Swing</p>
                <p className="text-2xl font-bold text-prisma-text">
                  {(analysis.rhythm.swing * 100).toFixed(0)}%
                </p>
                <p className="text-xs text-prisma-muted mt-1">
                  {analysis.rhythm.swing === 0.5 ? 'Recto' : 'Swing'}
                </p>
              </div>
              <div>
                <p className="text-xs text-prisma-muted mb-1">Downbeats</p>
                <p className="text-2xl font-bold text-prisma-text">
                  {analysis.rhythm.beats.downbeats.length}
                </p>
                <p className="text-xs text-prisma-muted mt-1">
                  Compases detectados
                </p>
              </div>
            </div>
            
            {analysis.rhythm.tempo.alternatives.length > 1 && (
              <div className="mt-4 pt-4 border-t border-prisma-border">
                <p className="text-xs text-prisma-muted mb-2">Tempo alternativo:</p>
                <div className="flex gap-3">
                  {analysis.rhythm.tempo.alternatives.slice(1, 3).map((alt: any, i: number) => (
                    <div key={i} className="text-sm">
                      <span className="text-prisma-text font-semibold">{alt.bpm} BPM</span>
                      <span className="text-prisma-muted ml-2">
                        ({(alt.confidence * 100).toFixed(0)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Análisis de Pitch */}
          <div className="glass-panel rounded-lg p-6">
            <h2 className="text-lg font-bold text-prisma-text mb-4 flex items-center gap-2">
              <i className="fas fa-music text-prisma-accent2"></i>
              Análisis de Pitch
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-prisma-muted mb-1">Rango</p>
                <p className="text-lg font-bold text-prisma-text">
                  {analysis.pitch.range.min} - {analysis.pitch.range.max}
                </p>
                <p className="text-xs text-prisma-muted mt-1">
                  Notas MIDI
                </p>
              </div>
              <div>
                <p className="text-xs text-prisma-muted mb-1">Centro Tonal</p>
                <p className="text-2xl font-bold text-prisma-text">
                  {analysis.pitch.tonalCenter !== null ? analysis.pitch.tonalCenter : '—'}
                </p>
                <p className="text-xs text-prisma-muted mt-1">
                  Nota MIDI más frecuente
                </p>
              </div>
              <div>
                <p className="text-xs text-prisma-muted mb-1">Frecuencia Media</p>
                <p className="text-lg font-bold text-prisma-text">
                  {analysis.pitch.averageFrequency > 0 
                    ? `${analysis.pitch.averageFrequency.toFixed(1)} Hz`
                    : '—'
                  }
                </p>
              </div>
              <div>
                <p className="text-xs text-prisma-muted mb-1">Frames Analizados</p>
                <p className="text-lg font-bold text-prisma-text">
                  {analysis.pitch.contour.length}
                </p>
                <p className="text-xs text-prisma-muted mt-1">
                  Con pitch detectado
                </p>
              </div>
            </div>
          </div>

          {/* Análisis Tímbrico */}
          <div className="glass-panel rounded-lg p-6">
            <h2 className="text-lg font-bold text-prisma-text mb-4 flex items-center gap-2">
              <i className="fas fa-wave-square text-prisma-accent"></i>
              Análisis Tímbrico
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-prisma-muted mb-2">Familia Instrumental Predicha</p>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: getInstrumentColor(analysis.timbre.predictedFamily) }}
                  ></div>
                  <p className="text-xl font-bold text-prisma-text capitalize">
                    {getInstrumentName(analysis.timbre.predictedFamily)}
                  </p>
                </div>
                <p className="text-xs text-prisma-muted mt-2">
                  Confianza: {(analysis.timbre.confidence * 100).toFixed(0)}%
                </p>
              </div>
              <div>
                <p className="text-xs text-prisma-muted mb-2">Alternativas</p>
                <div className="space-y-1">
                  {analysis.timbre.alternatives.map((alt: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getInstrumentColor(alt.family) }}
                      ></div>
                      <span className="text-prisma-text capitalize">{getInstrumentName(alt.family)}</span>
                      <span className="text-prisma-muted">
                        ({(alt.confidence * 100).toFixed(0)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-prisma-border">
              <p className="text-xs text-prisma-muted mb-3">Características Espectrales</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-prisma-muted mb-1">Centroide</p>
                  <p className="text-sm font-semibold text-prisma-text">
                    {analysis.timbre.features.spectralCentroid.toFixed(0)} Hz
                  </p>
                </div>
                <div>
                  <p className="text-xs text-prisma-muted mb-1">Rolloff</p>
                  <p className="text-sm font-semibold text-prisma-text">
                    {analysis.timbre.features.spectralRolloff.toFixed(0)} Hz
                  </p>
                </div>
                <div>
                  <p className="text-xs text-prisma-muted mb-1">Flatness</p>
                  <p className="text-sm font-semibold text-prisma-text">
                    {(analysis.timbre.features.spectralFlatness * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-prisma-muted mb-1">Zero Crossing</p>
                  <p className="text-sm font-semibold text-prisma-text">
                    {(analysis.timbre.features.zeroCrossingRate * 100).toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Botón de reanálisis */}
          <div className="flex justify-center">
            <button
              onClick={runAnalysis}
              disabled={isAnalyzing}
              className="px-6 py-3 bg-prisma-accent hover:bg-prisma-accent-light text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="fas fa-sync-alt mr-2"></i>
              Reanalizar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function getInstrumentColor(family: string): string {
  const colors: Record<string, string> = {
    strings: '#AA88FF',
    woodwind: '#35D9CF',
    brass: '#FFC15A',
    percussion: '#FF788A',
    keyboard: '#7DD3FC',
    voice: '#F58BDD',
    bass: '#A78BFA',
    unknown: '#AAB8CE',
  };
  return colors[family] || colors.unknown;
}

function getInstrumentName(family: string): string {
  const names: Record<string, string> = {
    strings: 'Cuerdas',
    woodwind: 'Maderas',
    brass: 'Metales',
    percussion: 'Percusión',
    keyboard: 'Teclado',
    voice: 'Voz',
    bass: 'Bajo',
    unknown: 'Desconocido',
  };
  return names[family] || names.unknown;
}
