import React, { useState } from 'react';
import { useAppState } from '../store';

export function CorrectionPanel() {
  const { state, dispatch } = useAppState();
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  const issues = state.events
    .filter(ev => ev.confidence < 0.6)
    .map(ev => ({
      event: ev,
      type: ev.confidence < 0.3 ? 'error' : ev.confidence < 0.5 ? 'warning' : 'info',
      message: ev.confidence < 0.3
        ? `Confianza muy baja (${(ev.confidence * 100).toFixed(0)}%) - Posible error de detección`
        : ev.confidence < 0.5
        ? `Confianza moderada (${(ev.confidence * 100).toFixed(0)}%) - Requiere verificación`
        : `Confianza baja (${(ev.confidence * 100).toFixed(0)}%) - Revisión recomendada`,
    }));

  // Detect potential clusters (notes very close together)
  const clusters = state.events.reduce((acc: { events: typeof state.events; startTime: number }[], ev) => {
    const last = acc[acc.length - 1];
    if (last && ev.startTime - last.events[last.events.length - 1].endTime < 0.05) {
      last.events.push(ev);
    } else {
      acc.push({ events: [ev], startTime: ev.startTime });
    }
    return acc;
  }, []).filter(c => c.events.length > 1);

  const handleAction = (action: string, eventId?: string) => {
    switch (action) {
      case 'auto-correct':
        if (eventId) {
          dispatch({ type: 'UPDATE_EVENT', payload: { id: eventId, updates: { status: 'corrected', confidence: 0.8 } } });
        }
        break;
      case 'protect':
        if (eventId) {
          dispatch({ type: 'UPDATE_EVENT', payload: { id: eventId, updates: { status: 'protected' } } });
        }
        break;
      case 'review':
        if (eventId) {
          dispatch({ type: 'SELECT_EVENT', payload: eventId });
        }
        break;
    }
    setSelectedAction(null);
  };

  return (
    <div className="p-4 h-full flex flex-col overflow-auto">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <i className="fas fa-brain text-prisma-accent"></i>
          El Algoritmo Binario
        </h2>
        <p className="text-xs text-prisma-muted">Motor de decisiones: compara hipótesis, aplica restricciones musicales, resuelve incidencias.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="glass-panel rounded-lg p-3">
          <p className="text-[10px] text-prisma-muted">Incidencias</p>
          <p className="text-lg font-bold text-prisma-warm">{issues.length}</p>
        </div>
        <div className="glass-panel rounded-lg p-3">
          <p className="text-[10px] text-prisma-muted">Clusters</p>
          <p className="text-lg font-bold text-prisma-accent2">{clusters.length}</p>
        </div>
        <div className="glass-panel rounded-lg p-3">
          <p className="text-[10px] text-prisma-muted">Corregidos</p>
          <p className="text-lg font-bold text-prisma-success">{state.events.filter(e => e.status === 'corrected').length}</p>
        </div>
        <div className="glass-panel rounded-lg p-3">
          <p className="text-[10px] text-prisma-muted">Protegidos</p>
          <p className="text-lg font-bold text-prisma-accent">{state.events.filter(e => e.status === 'protected').length}</p>
        </div>
      </div>

      {/* Issues list */}
      <div className="flex-1 overflow-auto">
        <h3 className="text-xs font-semibold text-prisma-muted uppercase tracking-wider mb-2">
          <i className="fas fa-exclamation-circle mr-1"></i>Incidencias detectadas
        </h3>
        {issues.length === 0 ? (
          <div className="text-center py-8">
            <i className="fas fa-check-circle text-3xl text-prisma-success mb-2"></i>
            <p className="text-sm text-prisma-muted">No se han detectado incidencias</p>
            {state.events.length === 0 && (
              <p className="text-xs text-prisma-muted mt-1">Detecta notas primero para habilitar el análisis</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {issues.slice(0, 20).map((issue, i) => (
              <div key={issue.event.id} className={`glass-panel rounded-lg p-3 border-l-3 ${
                issue.type === 'error' ? 'border-l-prisma-error' : issue.type === 'warning' ? 'border-l-prisma-warm' : 'border-l-prisma-accent2'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <i className={`fas ${issue.type === 'error' ? 'fa-times-circle text-prisma-error' : issue.type === 'warning' ? 'fa-exclamation-triangle text-prisma-warm' : 'fa-info-circle text-prisma-accent2'} text-xs`}></i>
                    <span className="text-xs text-white">{issue.message}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-prisma-muted">
                      Compás {issue.event.bar} · {issue.event.startTime.toFixed(2)}s
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => handleAction('auto-correct', issue.event.id)}
                    className="text-[9px] px-2 py-0.5 rounded bg-prisma-success/20 text-prisma-success hover:bg-prisma-success/30"
                  >
                    Corregir auto.
                  </button>
                  <button
                    onClick={() => handleAction('review', issue.event.id)}
                    className="text-[9px] px-2 py-0.5 rounded bg-prisma-accent/20 text-prisma-accent hover:bg-prisma-accent/30"
                  >
                    Revisar en contexto
                  </button>
                  <button
                    onClick={() => handleAction('protect', issue.event.id)}
                    className="text-[9px] px-2 py-0.5 rounded bg-prisma-warm/20 text-prisma-warm hover:bg-prisma-warm/30"
                  >
                    Proteger
                  </button>
                  <button className="text-[9px] px-2 py-0.5 rounded bg-prisma-panel text-prisma-muted hover:text-white">
                    Comparar alt.
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Clusters */}
        {clusters.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-semibold text-prisma-muted uppercase tracking-wider mb-2">
              <i className="fas fa-object-group mr-1"></i>Clusters detectados ({clusters.length})
            </h3>
            <div className="space-y-2">
              {clusters.slice(0, 5).map((cluster, i) => (
                <div key={i} className="glass-panel rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-white">{cluster.events.length} notas agrupadas</span>
                    <span className="text-[9px] text-prisma-muted">{cluster.startTime.toFixed(3)}s</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {cluster.events.map((ev, j) => (
                      <div key={ev.id} className="flex items-center gap-0.5">
                        <span className="text-[9px] px-1 py-0.5 rounded bg-prisma-panel text-prisma-accent2">
                          {ev.midiNote}
                        </span>
                        {j < cluster.events.length - 1 && <span className="text-prisma-border">→</span>}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <button className="text-[9px] px-2 py-0.5 rounded bg-prisma-accent/20 text-prisma-accent">
                      ¿Acorde real?
                    </button>
                    <button className="text-[9px] px-2 py-0.5 rounded bg-prisma-warm/20 text-prisma-warm">
                      Separar notas
                    </button>
                    <button className="text-[9px] px-2 py-0.5 rounded bg-prisma-panel text-prisma-muted">
                      Escuchar audio
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Decision engine info */}
      <div className="mt-4 glass-panel rounded-lg p-3">
        <p className="text-[10px] text-prisma-muted">
          <i className="fas fa-cog mr-1"></i>
          El algoritmo compara hipótesis, aplica restricciones contextuales y selecciona la mejor interpretación.
          Conserva alternativas y registra decisiones reversibles. No descarta notas por resultar armónicamente extrañas.
        </p>
      </div>
    </div>
  );
}
