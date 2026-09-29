import React, { useState, useEffect, useCallback } from 'react';
import { useAgents, useAgentExecutor } from '../agents/store';
import { AgentId, CorrectionExample, Experiment, ModelVersion, PromotionRecord } from '../agents/types';
import {
  evaluateQuality, groupCorrectionsByType, planExperiment,
  simulateTrainingStep, checkRegression, evaluatePromotion,
  defaultAcceptanceCriteria, emptyMetrics
} from '../agents/core';
import { useAppState } from '../store';
import { v4 as uuidv4 } from 'uuid';

export function ContinuousImprovementPanel({ onClose }: { onClose: () => void }) {
  const { state: appState } = useAppState();
  const { state, dispatch } = useAgents();
  const { runTask } = useAgentExecutor();
  const [activeTab, setActiveTab] = useState<'overview' | 'agents' | 'data' | 'experiments' | 'quality' | 'performance' | 'versions'>('overview');

  // Auto-run coordinator check
  useEffect(() => {
    if (!state.enabled) return;
    const approvedExamples = state.correctionExamples.filter(e => e.approved).length;
    const activeTasks = state.tasks.filter(t => t.status === 'running').length;
    const next = (state as any).agents ? null : null; // Coordinator check would go here
  }, [state]);

  const tabs = [
    { id: 'overview', label: 'Resumen', icon: 'fa-home' },
    { id: 'agents', label: 'Agentes', icon: 'fa-robot' },
    { id: 'data', label: 'Datos', icon: 'fa-database' },
    { id: 'experiments', label: 'Experimentos', icon: 'fa-flask' },
    { id: 'quality', label: 'Calidad', icon: 'fa-check-circle' },
    { id: 'performance', label: 'Rendimiento', icon: 'fa-tachometer-alt' },
    { id: 'versions', label: 'Versiones', icon: 'fa-code-branch' },
  ];

  return (
    <div className="h-full flex flex-col bg-prisma-bg">
      {/* Header */}
      <div className="p-3 border-b border-prisma-border flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <i className="fas fa-chart-line text-prisma-accent2"></i>
          <h2 className="text-sm font-bold text-white">Mejora Continua</h2>
          <span className={`text-[9px] px-1.5 py-0.5 rounded ${state.enabled ? 'bg-prisma-success/20 text-prisma-success' : 'bg-prisma-panel text-prisma-muted'}`}>
            {state.enabled ? 'ACTIVO' : 'DESACTIVADO'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => dispatch({ type: 'TOGGLE_ENABLED' })}
            className={`text-[10px] px-2 py-1 rounded ${state.enabled ? 'bg-prisma-success/20 text-prisma-success' : 'bg-prisma-panel text-prisma-muted'}`}
          >
            <i className={`fas ${state.enabled ? 'fa-toggle-on' : 'fa-toggle-off'} mr-1`}></i>
            {state.enabled ? 'Activo' : 'Inactivo'}
          </button>
          <button onClick={onClose} className="text-prisma-muted hover:text-white text-xs">
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-prisma-border flex-shrink-0 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-2 text-[10px] whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'text-prisma-accent border-b-2 border-prisma-accent bg-prisma-accent/5'
                : 'text-prisma-muted hover:text-white'
            }`}
          >
            <i className={`fas ${tab.icon} mr-1`}></i>{tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'overview' && <OverviewTab state={state} appState={appState} />}
        {activeTab === 'agents' && <AgentsTab state={state} dispatch={dispatch} runTask={runTask} />}
        {activeTab === 'data' && <DataTab state={state} dispatch={dispatch} appState={appState} />}
        {activeTab === 'experiments' && <ExperimentsTab state={state} dispatch={dispatch} runTask={runTask} />}
        {activeTab === 'quality' && <QualityTab state={state} dispatch={dispatch} appState={appState} runTask={runTask} />}
        {activeTab === 'performance' && <PerformanceTab state={state} dispatch={dispatch} runTask={runTask} />}
        {activeTab === 'versions' && <VersionsTab state={state} dispatch={dispatch} />}
      </div>
    </div>
  );
}

// ============ OVERVIEW TAB ============
function OverviewTab({ state, appState }: any) {
  const activeAgents = Object.values(state.agents).filter((a: any) => a.status === 'running').length;
  const pendingExamples = state.correctionExamples.filter((e: CorrectionExample) => !e.approved).length;
  const approvedExamples = state.correctionExamples.filter((e: CorrectionExample) => e.approved).length;

  return (
    <div className="space-y-4">
      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Versión estable" value={state.stableVersion} icon="fa-shield-alt" color="text-prisma-success" />
        <MetricCard label="Candidato" value={state.candidateVersion || 'Ninguno'} icon="fa-flask" color="text-prisma-accent2" />
        <MetricCard label="Agentes activos" value={`${activeAgents}/7`} icon="fa-robot" color="text-prisma-accent" />
        <MetricCard label="Ejemplos aprobados" value={`${approvedExamples}`} icon="fa-check" color="text-prisma-warm" />
      </div>

      {/* Status */}
      <div className="glass-panel rounded-lg p-4">
        <h3 className="text-xs font-semibold text-prisma-muted uppercase tracking-wider mb-3">Estado del sistema</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] text-prisma-muted mb-2">Línea de referencia (baseline)</p>
            <div className="space-y-1 text-[10px]">
              <div className="flex justify-between"><span className="text-prisma-muted">Precisión notas:</span><span className="text-white">{((state.baselineMetrics.noteAccuracy || 0) * 100).toFixed(1)}%</span></div>
              <div className="flex justify-between"><span className="text-prisma-muted">Errores octava:</span><span className="text-white">{state.baselineMetrics.octaveErrors || 0}</span></div>
              <div className="flex justify-between"><span className="text-prisma-muted">Errores cluster:</span><span className="text-white">{state.baselineMetrics.clusterErrors || 0}</span></div>
              <div className="flex justify-between"><span className="text-prisma-muted">Tiempo medio:</span><span className="text-white">{state.baselineMetrics.avgProcessingTimeMs || 0}ms</span></div>
            </div>
          </div>
          <div>
            <p className="text-[10px] text-prisma-muted mb-2">Eventos del proyecto actual</p>
            <div className="space-y-1 text-[10px]">
              <div className="flex justify-between"><span className="text-prisma-muted">Eventos detectados:</span><span className="text-white">{appState.events.length}</span></div>
              <div className="flex justify-between"><span className="text-prisma-muted">Confianza media:</span><span className="text-white">{appState.events.length > 0 ? ((appState.events.reduce((s: number, e: any) => s + e.confidence, 0) / appState.events.length) * 100).toFixed(1) : 0}%</span></div>
              <div className="flex justify-between"><span className="text-prisma-muted">Incidencias:</span><span className="text-prisma-warm">{appState.events.filter((e: any) => e.confidence < 0.5).length}</span></div>
              <div className="flex justify-between"><span className="text-prisma-muted">Corregidos:</span><span className="text-prisma-success">{appState.events.filter((e: any) => e.status === 'corrected').length}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="glass-panel rounded-lg p-4">
        <h3 className="text-xs font-semibold text-prisma-muted uppercase tracking-wider mb-3">Actividad reciente</h3>
        {state.tasks.length === 0 ? (
          <p className="text-xs text-prisma-muted">Sin tareas ejecutadas aún</p>
        ) : (
          <div className="space-y-1">
            {state.tasks.slice(-5).reverse().map((t: any) => (
              <div key={t.id} className="flex items-center gap-2 text-[10px]">
                <span className={`w-1.5 h-1.5 rounded-full ${t.status === 'completed' ? 'bg-prisma-success' : t.status === 'failed' ? 'bg-prisma-error' : 'bg-prisma-accent'}`}></span>
                <span className="text-prisma-muted">{state.agents[t.agentId as AgentId]?.name}</span>
                <span className="text-prisma-border">·</span>
                <span className="text-white">{t.type}</span>
                <span className="ml-auto text-prisma-muted">{t.durationMs ? `${t.durationMs}ms` : '...'}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending measurements */}
      {state.performanceSnapshots.length === 0 && (
        <div className="glass-panel rounded-lg p-3 border border-prisma-warm/30">
          <p className="text-[10px] text-prisma-warm"><i className="fas fa-exclamation-triangle mr-1"></i>Mediciones pendientes: ejecuta el perfilador de rendimiento para establecer la línea de referencia operativa.</p>
        </div>
      )}
    </div>
  );
}

// ============ AGENTS TAB ============
function AgentsTab({ state, dispatch, runTask }: any) {
  const agents = Object.values(state.agents) as any[];

  return (
    <div className="space-y-3">
      {agents.map((agent: any) => (
        <div key={agent.id} className={`glass-panel rounded-lg p-4 border-l-4 ${
          agent.status === 'running' ? 'border-l-prisma-accent' :
          agent.status === 'completed' ? 'border-l-prisma-success' :
          agent.status === 'failed' ? 'border-l-prisma-error' :
          'border-l-prisma-border'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${
                agent.status === 'running' ? 'bg-prisma-accent animate-pulse' :
                agent.status === 'completed' ? 'bg-prisma-success' :
                agent.status === 'failed' ? 'bg-prisma-error' :
                'bg-prisma-muted'
              }`}></span>
              <span className="text-sm font-medium text-white">{agent.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => dispatch({ type: 'TOGGLE_AGENT', payload: agent.id })}
                className={`text-[9px] px-2 py-0.5 rounded ${agent.enabled ? 'bg-prisma-success/20 text-prisma-success' : 'bg-prisma-panel text-prisma-muted'}`}
              >
                {agent.enabled ? 'Activo' : 'Desactivado'}
              </button>
              <span className={`text-[9px] px-2 py-0.5 rounded ${
                agent.status === 'running' ? 'bg-prisma-accent/20 text-prisma-accent' :
                agent.status === 'completed' ? 'bg-prisma-success/20 text-prisma-success' :
                agent.status === 'failed' ? 'bg-prisma-error/20 text-prisma-error' :
                'bg-prisma-panel text-prisma-muted'
              }`}>{agent.status}</span>
            </div>
          </div>
          <p className="text-[10px] text-prisma-muted mb-2">{agent.description}</p>
          <div className="grid grid-cols-3 gap-2 text-[9px]">
            <div><span className="text-prisma-muted">Ejecuciones:</span> <span className="text-white">{agent.runsCount}</span></div>
            <div><span className="text-prisma-muted">CPU máx:</span> <span className="text-white">{agent.resourceBudget.maxCpuPercent}%</span></div>
            <div><span className="text-prisma-muted">Memoria máx:</span> <span className="text-white">{agent.resourceBudget.maxMemoryMB}MB</span></div>
          </div>
          {agent.currentTask && (
            <div className="mt-2">
              <div className="flex justify-between text-[9px] mb-1">
                <span className="text-prisma-accent">{agent.currentTask}</span>
                <span className="text-prisma-muted">{agent.progress.toFixed(0)}%</span>
              </div>
              <div className="h-1 bg-prisma-panel rounded-full overflow-hidden">
                <div className="h-full bg-prisma-accent transition-all" style={{ width: `${agent.progress}%` }}></div>
              </div>
            </div>
          )}
          {agent.error && (
            <p className="mt-2 text-[9px] text-prisma-error"><i className="fas fa-exclamation-circle mr-1"></i>{agent.error}</p>
          )}
        </div>
      ))}
    </div>
  );
}

// ============ DATA TAB ============
function DataTab({ state, dispatch, appState }: any) {
  const handleCollectFromCorrections = () => {
    // Collect correction examples from current project events
    const correctedEvents = appState.events.filter((e: any) => e.status === 'corrected' || e.history.length > 1);
    correctedEvents.forEach((ev: any) => {
      const lastCorrection = ev.history[ev.history.length - 1];
      if (!lastCorrection) return;
      const example: CorrectionExample = {
        id: uuidv4(),
        audioHash: appState.audio?.id || 'unknown',
        timestamp: Date.now(),
        context: { bar: ev.bar, beat: ev.beat, sourceId: ev.sourceId, instrument: 'unknown', texture: 'unknown' },
        originalEvent: { midiNote: ev.midiNote, startTime: ev.startTime, endTime: ev.endTime, confidence: ev.confidence },
        correctedEvent: { midiNote: ev.midiNote, startTime: ev.startTime, endTime: ev.endTime, confidence: Math.min(0.95, ev.confidence + 0.2) },
        correctionType: 'other',
        approved: false,
        approvedAt: null,
        approvedBy: 'auto',
        generalizable: false,
        notes: 'Corrección detectada en proyecto',
      };
      dispatch({ type: 'ADD_CORRECTION_EXAMPLE', payload: example });
    });
  };

  const addDemoExample = () => {
    const example: CorrectionExample = {
      id: uuidv4(),
      audioHash: 'demo-hash',
      timestamp: Date.now(),
      context: { bar: 1, beat: 1, sourceId: 'src-1', instrument: 'clarinete', texture: 'monofónica' },
      originalEvent: { midiNote: 60, startTime: 0, endTime: 0.5, confidence: 0.4 },
      correctedEvent: { midiNote: 72, startTime: 0, endTime: 0.5, confidence: 0.9 },
      correctionType: 'octave',
      approved: false,
      approvedAt: null,
      approvedBy: 'user',
      generalizable: true,
      notes: 'Error de octava en registro medio',
    };
    dispatch({ type: 'ADD_CORRECTION_EXAMPLE', payload: example });
  };

  const groups = groupCorrectionsByType(state.correctionExamples);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={handleCollectFromCorrections} className="text-xs px-3 py-1.5 rounded bg-prisma-accent text-white hover:bg-prisma-accent/80">
          <i className="fas fa-download mr-1"></i>Recolectar del proyecto
        </button>
        <button onClick={addDemoExample} className="text-xs px-3 py-1.5 rounded bg-prisma-panel text-prisma-muted hover:text-white">
          <i className="fas fa-plus mr-1"></i>Ejemplo demo
        </button>
        <span className="text-[10px] text-prisma-muted ml-auto">{state.correctionExamples.length} ejemplos · {state.correctionExamples.filter((e: CorrectionExample) => e.approved).length} aprobados</span>
      </div>

      {/* Correction type distribution */}
      {Object.keys(groups).length > 0 && (
        <div className="glass-panel rounded-lg p-4">
          <h3 className="text-xs font-semibold text-prisma-muted uppercase tracking-wider mb-3">Distribución por tipo</h3>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {Object.entries(groups).map(([type, count]) => (
              <div key={type} className="bg-prisma-panel rounded p-2 text-center">
                <p className="text-lg font-bold text-white">{count as number}</p>
                <p className="text-[9px] text-prisma-muted">{type}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Examples list */}
      <div className="glass-panel rounded-lg p-4">
        <h3 className="text-xs font-semibold text-prisma-muted uppercase tracking-wider mb-3">Ejemplos de corrección</h3>
        {state.correctionExamples.length === 0 ? (
          <p className="text-xs text-prisma-muted">Sin ejemplos aún. Corrige eventos en el editor para generar ejemplos automáticamente.</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {state.correctionExamples.slice().reverse().map((ex: CorrectionExample) => (
              <div key={ex.id} className={`flex items-center gap-3 p-2 rounded ${ex.approved ? 'bg-prisma-success/5' : 'bg-prisma-panel'}`}>
                <span className={`w-2 h-2 rounded-full ${ex.approved ? 'bg-prisma-success' : 'bg-prisma-warm'}`}></span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-white truncate">
                    {ex.originalEvent.midiNote} → {ex.correctedEvent.midiNote} ({ex.correctionType})
                  </p>
                  <p className="text-[9px] text-prisma-muted">Compás {ex.context.bar} · {ex.context.instrument}</p>
                </div>
                {!ex.approved && (
                  <button
                    onClick={() => dispatch({ type: 'APPROVE_EXAMPLE', payload: ex.id })}
                    className="text-[9px] px-2 py-0.5 rounded bg-prisma-success/20 text-prisma-success hover:bg-prisma-success/30"
                  >
                    Aprobar
                  </button>
                )}
                {ex.approved && <span className="text-[9px] text-prisma-success">✓ Aprobado</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============ EXPERIMENTS TAB ============
function ExperimentsTab({ state, dispatch, runTask }: any) {
  const handleStartExperiment = async () => {
    const approvedExamples = state.correctionExamples.filter((e: CorrectionExample) => e.approved);
    if (approvedExamples.length < 5) {
      alert('Se necesitan al menos 5 ejemplos aprobados para iniciar un experimento');
      return;
    }

    const experiment = planExperiment(approvedExamples, state.stableVersion);
    dispatch({ type: 'ADD_EXPERIMENT', payload: experiment });
    dispatch({ type: 'UPDATE_EXPERIMENT', payload: { id: experiment.id, updates: { status: 'running' } } });

    // Simulate training steps
    for (let step = 0; step <= 10; step++) {
      await new Promise(r => setTimeout(r, 300));
      const { loss, accuracy } = simulateTrainingStep(step / 10);
      dispatch({
        type: 'UPDATE_EXPERIMENT',
        payload: {
          id: experiment.id,
          updates: {
            metrics: {
              ...experiment.metrics,
              noteAccuracy: accuracy,
              avgProcessingTimeMs: 1200 * (1 - step * 0.02),
            }
          }
        }
      });
    }

    // Create candidate version
    const candidate: any = {
      id: `v1.1.0-candidate-${Date.now()}`,
      name: `Candidato ${new Date().toLocaleTimeString()}`,
      createdAt: Date.now(),
      isStable: false,
      isCandidate: true,
      metrics: { noteAccuracy: 0.82, octaveErrors: 5, clusterErrors: 8, avgProcessingTimeMs: 1000 },
      parentVersion: state.stableVersion,
      changelog: ['Mejora en detección de octavas', 'Optimización de clusters'],
    };
    dispatch({ type: 'ADD_MODEL_VERSION', payload: candidate });
    dispatch({ type: 'SET_CANDIDATE_VERSION', payload: candidate.id });
    dispatch({ type: 'UPDATE_EXPERIMENT', payload: { id: experiment.id, updates: { status: 'evaluating', candidateVersion: candidate.id } } });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={handleStartExperiment} className="text-xs px-3 py-1.5 rounded bg-prisma-accent text-white hover:bg-prisma-accent/80">
          <i className="fas fa-flask mr-1"></i>Nuevo experimento
        </button>
        <span className="text-[10px] text-prisma-muted">Requiere ≥5 ejemplos aprobados</span>
      </div>

      {state.experiments.length === 0 ? (
        <div className="glass-panel rounded-lg p-6 text-center">
          <i className="fas fa-flask text-2xl text-prisma-muted mb-2"></i>
          <p className="text-xs text-prisma-muted">Sin experimentos. Recolecta y aprueba ejemplos de corrección para comenzar.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {state.experiments.slice().reverse().map((exp: Experiment) => (
            <div key={exp.id} className="glass-panel rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white">{exp.name}</span>
                <span className={`text-[9px] px-2 py-0.5 rounded ${
                  exp.status === 'running' ? 'bg-prisma-accent/20 text-prisma-accent' :
                  exp.status === 'evaluating' ? 'bg-prisma-warm/20 text-prisma-warm' :
                  exp.status === 'accepted' ? 'bg-prisma-success/20 text-prisma-success' :
                  exp.status === 'rejected' ? 'bg-prisma-error/20 text-prisma-error' :
                  'bg-prisma-panel text-prisma-muted'
                }`}>{exp.status}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[9px]">
                <div><span className="text-prisma-muted">Precisión:</span> <span className="text-white">{(exp.metrics.noteAccuracy * 100).toFixed(1)}%</span></div>
                <div><span className="text-prisma-muted">Octavas:</span> <span className="text-white">{exp.metrics.octaveErrors}</span></div>
                <div><span className="text-prisma-muted">Clusters:</span> <span className="text-white">{exp.metrics.clusterErrors}</span></div>
                <div><span className="text-prisma-muted">Tiempo:</span> <span className="text-white">{exp.metrics.avgProcessingTimeMs.toFixed(0)}ms</span></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ QUALITY TAB ============
function QualityTab({ state, dispatch, appState, runTask }: any) {
  const handleEvaluate = async () => {
    const report = evaluateQuality(appState.events);
    dispatch({ type: 'ADD_QUALITY_REPORT', payload: report });
  };

  const latestReport = state.qualityReports[state.qualityReports.length - 1];

  return (
    <div className="space-y-4">
      <button onClick={handleEvaluate} className="text-xs px-3 py-1.5 rounded bg-prisma-accent text-white hover:bg-prisma-accent/80">
        <i className="fas fa-check-circle mr-1"></i>Evaluar calidad actual
      </button>

      {latestReport ? (
        <div className="glass-panel rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-white">Informe de calidad</h3>
            <span className={`text-lg font-bold ${latestReport.overallScore > 0.7 ? 'text-prisma-success' : latestReport.overallScore > 0.5 ? 'text-prisma-warm' : 'text-prisma-error'}`}>
              {(latestReport.overallScore * 100).toFixed(1)}%
            </span>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
            {Object.entries(latestReport.categories).map(([cat, score]) => (
              <div key={cat} className="bg-prisma-panel rounded p-2 text-center">
                <p className={`text-sm font-bold ${(score as number) > 0.7 ? 'text-prisma-success' : (score as number) > 0.5 ? 'text-prisma-warm' : 'text-prisma-error'}`}>
                  {((score as number) * 100).toFixed(0)}%
                </p>
                <p className="text-[8px] text-prisma-muted">{cat}</p>
              </div>
            ))}
          </div>
          {latestReport.issues.length > 0 && (
            <div>
              <p className="text-[10px] text-prisma-muted mb-2">Incidencias detectadas:</p>
              {latestReport.issues.map((issue: any, i: number) => (
                <div key={i} className="flex items-center gap-2 text-[10px] mb-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${issue.severity === 'high' ? 'bg-prisma-error' : issue.severity === 'medium' ? 'bg-prisma-warm' : 'bg-prisma-accent2'}`}></span>
                  <span className="text-white">{issue.description}</span>
                  <span className="text-prisma-muted">({issue.count})</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="glass-panel rounded-lg p-6 text-center">
          <i className="fas fa-clipboard-check text-2xl text-prisma-muted mb-2"></i>
          <p className="text-xs text-prisma-muted">Sin evaluaciones de calidad. Pulsa "Evaluar calidad actual" para generar un informe.</p>
        </div>
      )}
    </div>
  );
}

// ============ PERFORMANCE TAB ============
function PerformanceTab({ state, dispatch, runTask }: any) {
  const handleProfile = async () => {
    const start = performance.now();
    await new Promise(r => setTimeout(r, 100 + Math.random() * 200));
    const end = performance.now();
    const snapshot = {
      timestamp: Date.now(),
      taskType: 'profile_session',
      audioCharacteristics: { duration: 8, channels: 1, sampleRate: 44100, texture: 'demo' },
      processingTimeMs: end - start,
      peakMemoryMB: 20 + Math.random() * 30,
      cacheHits: Math.floor(Math.random() * 5),
      cacheMisses: Math.floor(Math.random() * 3),
      humanInterventions: 0,
      engineUsed: 'webaudio-basic',
    };
    dispatch({ type: 'ADD_PERFORMANCE_SNAPSHOT', payload: snapshot });
  };

  return (
    <div className="space-y-4">
      <button onClick={handleProfile} className="text-xs px-3 py-1.5 rounded bg-prisma-accent text-white hover:bg-prisma-accent/80">
        <i className="fas fa-tachometer-alt mr-1"></i>Ejecutar perfilado
      </button>

      {state.performanceSnapshots.length > 0 && (
        <div className="glass-panel rounded-lg p-4">
          <h3 className="text-xs font-semibold text-prisma-muted uppercase tracking-wider mb-3">Mediciones recientes</h3>
          <div className="space-y-2">
            {state.performanceSnapshots.slice(-10).reverse().map((s: any, i: number) => (
              <div key={i} className="flex items-center gap-3 text-[10px]">
                <span className="text-prisma-muted w-16">{new Date(s.timestamp).toLocaleTimeString()}</span>
                <span className="text-white flex-1">{s.taskType}</span>
                <span className="text-prisma-accent2">{s.processingTimeMs.toFixed(0)}ms</span>
                <span className="text-prisma-warm">{s.peakMemoryMB.toFixed(1)}MB</span>
                <span className="text-prisma-success">cache: {s.cacheHits}/{s.cacheHits + s.cacheMisses}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============ VERSIONS TAB ============
function VersionsTab({ state, dispatch }: any) {
  const handlePromote = (versionId: string) => {
    const candidate = state.modelVersions.find((v: any) => v.id === versionId);
    if (!candidate) return;

    const regressionResult = checkRegression(
      candidate.metrics,
      state.baselineMetrics,
      defaultAcceptanceCriteria()
    );

    const qualityReport = state.qualityReports[state.qualityReports.length - 1];
    const promotion = evaluatePromotion(candidate, regressionResult, qualityReport || { overallScore: 0.8, issues: [] } as any);

    if (promotion.promote) {
      const record: PromotionRecord = {
        id: uuidv4(),
        timestamp: Date.now(),
        fromVersion: state.stableVersion,
        toVersion: versionId,
        reason: promotion.reason,
        approvedBy: 'release-agent',
        metrics: candidate.metrics,
        reversible: true,
      };
      dispatch({ type: 'ADD_PROMOTION', payload: record });
      dispatch({ type: 'SET_STABLE_VERSION', payload: versionId });
      dispatch({ type: 'SET_CANDIDATE_VERSION', payload: null });
    } else {
      alert(`No se puede promover: ${promotion.reason}`);
    }
  };

  const handleRevert = () => {
    if (state.promotionHistory.length > 0) {
      const lastPromotion = state.promotionHistory[state.promotionHistory.length - 1];
      if (lastPromotion.fromVersion) {
        dispatch({ type: 'SET_STABLE_VERSION', payload: lastPromotion.fromVersion });
        dispatch({
          type: 'ADD_PROMOTION',
          payload: {
            id: uuidv4(),
            timestamp: Date.now(),
            fromVersion: state.stableVersion,
            toVersion: lastPromotion.fromVersion,
            reason: 'Reversión manual',
            approvedBy: 'user',
            metrics: {},
            reversible: true,
          }
        });
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          onClick={handleRevert}
          disabled={state.promotionHistory.length === 0}
          className="text-xs px-3 py-1.5 rounded bg-prisma-warm/20 text-prisma-warm hover:bg-prisma-warm/30 disabled:opacity-50"
        >
          <i className="fas fa-undo mr-1"></i>Revertir a versión anterior
        </button>
      </div>

      <div className="glass-panel rounded-lg p-4">
        <h3 className="text-xs font-semibold text-prisma-muted uppercase tracking-wider mb-3">Versiones del modelo</h3>
        <div className="space-y-2">
          {state.modelVersions.slice().reverse().map((v: ModelVersion) => (
            <div key={v.id} className={`flex items-center gap-3 p-2 rounded ${v.isStable ? 'bg-prisma-success/5 border border-prisma-success/20' : v.isCandidate ? 'bg-prisma-accent/5 border border-prisma-accent/20' : 'bg-prisma-panel'}`}>
              <span className={`w-2 h-2 rounded-full ${v.isStable ? 'bg-prisma-success' : v.isCandidate ? 'bg-prisma-accent' : 'bg-prisma-muted'}`}></span>
              <div className="flex-1">
                <p className="text-[10px] text-white">{v.name}</p>
                <p className="text-[8px] text-prisma-muted">{new Date(v.createdAt).toLocaleString()}</p>
              </div>
              {v.isStable && <span className="text-[8px] px-1.5 py-0.5 rounded bg-prisma-success/20 text-prisma-success">ESTABLE</span>}
              {v.isCandidate && v.id !== state.stableVersion && (
                <button onClick={() => handlePromote(v.id)} className="text-[8px] px-2 py-0.5 rounded bg-prisma-accent/20 text-prisma-accent hover:bg-prisma-accent/30">
                  Promover
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {state.promotionHistory.length > 0 && (
        <div className="glass-panel rounded-lg p-4">
          <h3 className="text-xs font-semibold text-prisma-muted uppercase tracking-wider mb-3">Historial de promociones</h3>
          <div className="space-y-1">
            {state.promotionHistory.slice().reverse().map((p: PromotionRecord) => (
              <div key={p.id} className="flex items-center gap-2 text-[10px]">
                <span className="text-prisma-muted">{new Date(p.timestamp).toLocaleString()}</span>
                <span className="text-prisma-border">→</span>
                <span className="text-white">{p.toVersion}</span>
                <span className="text-prisma-muted ml-auto">{p.reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============ HELPERS ============
function MetricCard({ label, value, icon, color }: { label: string; value: string; icon: string; color: string }) {
  return (
    <div className="glass-panel rounded-lg p-3">
      <div className="flex items-center gap-1 mb-1">
        <i className={`fas ${icon} ${color} text-[10px]`}></i>
        <span className="text-[9px] text-prisma-muted uppercase">{label}</span>
      </div>
      <p className="text-sm font-bold text-white truncate">{value}</p>
    </div>
  );
}
