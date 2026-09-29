// Lógica central determinista de los agentes
// Procesos deterministas para cálculos y comprobaciones
// El razonamiento generativo se activa sólo cuando aporta utilidad demostrable

import {
  AgentId, AgentState, Task, CorrectionExample, Experiment,
  ExperimentMetrics, QualityReport, QualityIssue, PerformanceSnapshot,
  ResourceUsage, CacheEntry, PromotionRecord, ModelVersion, AcceptanceCriteria
} from './types';
import { v4 as uuidv4 } from 'uuid';

// ============ COORDINADOR DE APRENDIZAJE ============
export function coordinatorDecideNextTask(
  agents: Record<AgentId, AgentState>,
  pendingExamples: number,
  activeTasks: number
): { agentId: AgentId; taskType: string } | null {
  // Reglas medibles de coordinación
  const dataReady = pendingExamples >= 20;
  const trainingIdle = agents.training.status === 'idle' && agents.training.enabled;
  const qualityIdle = agents.quality.status === 'idle' && agents.quality.enabled;
  const performanceIdle = agents.performance.status === 'idle' && agents.performance.enabled;

  // Prioridad: interactiva > calidad > rendimiento > entrenamiento
  if (activeTasks >= 2) return null; // Limitar concurrencia

  if (dataReady && trainingIdle) {
    return { agentId: 'training', taskType: 'run_experiment' };
  }
  if (qualityIdle) {
    return { agentId: 'quality', taskType: 'evaluate_current' };
  }
  if (performanceIdle) {
    return { agentId: 'performance', taskType: 'profile_session' };
  }
  return null;
}

// ============ AGENTE DE DATOS ============
export function validateCorrectionExample(example: CorrectionExample): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (!example.audioHash) issues.push('Falta audioHash');
  if (!example.context.bar) issues.push('Falta contexto de compás');
  if (example.originalEvent.midiNote < 21 || example.originalEvent.midiNote > 108) {
    issues.push('Nota original fuera de rango');
  }
  if (example.correctedEvent.midiNote < 21 || example.correctedEvent.midiNote > 108) {
    issues.push('Nota corregida fuera de rango');
  }
  if (example.correctedEvent.startTime < example.originalEvent.startTime - 0.5) {
    issues.push('Desplazamiento temporal excesivo');
  }

  return { valid: issues.length === 0, issues };
}

export function classifyCorrectionType(original: any, corrected: any): CorrectionExample['correctionType'] {
  const noteDiff = Math.abs(original.midiNote - corrected.midiNote);
  if (noteDiff === 12) return 'octave';
  if (original.startTime !== corrected.startTime && Math.abs(original.startTime - corrected.startTime) < 0.1) return 'quantization';
  if (Math.abs(original.endTime - corrected.endTime) > 0.1) return 'duration';
  if (noteDiff > 0 && noteDiff < 12) return 'cluster';
  return 'other';
}

export function groupCorrectionsByType(examples: CorrectionExample[]): Record<string, number> {
  return examples.reduce((acc, ex) => {
    acc[ex.correctionType] = (acc[ex.correctionType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

// ============ AGENTE DE ENTRENAMIENTO ============
export function planExperiment(
  examples: CorrectionExample[],
  baseVersion: string
): Experiment {
  const trainSize = Math.floor(examples.length * 0.7);
  const valSize = Math.floor(examples.length * 0.15);

  return {
    id: uuidv4(),
    name: `Experimento ${new Date().toISOString().slice(0, 10)}`,
    description: `Entrenamiento con ${examples.length} ejemplos verificados`,
    createdAt: Date.now(),
    status: 'planned',
    datasetVersion: `ds-${Date.now()}`,
    configVersion: `cfg-1.0`,
    baseModelVersion: baseVersion,
    candidateVersion: null,
    metrics: emptyMetrics(),
    acceptanceCriteria: defaultAcceptanceCriteria(),
    tasks: ['prepare_data', 'train_candidate', 'evaluate', 'compare_baseline'],
  };
}

export function simulateTrainingStep(progress: number): { loss: number; accuracy: number } {
  // Simulación determinista de curva de aprendizaje
  const loss = 1.0 * Math.exp(-progress * 3) + 0.05;
  const accuracy = 0.5 + 0.45 * (1 - Math.exp(-progress * 2.5));
  return { loss, accuracy };
}

// ============ AGENTE DE CALIDAD MUSICAL ============
export function evaluateQuality(events: any[], reference?: any[]): QualityReport {
  const issues: QualityIssue[] = [];
  let pitchScore = 1.0;
  let rhythmScore = 1.0;
  let durationScore = 1.0;

  // Detectar clusters sospechosos (notas muy cercanas)
  const sorted = [...events].sort((a, b) => a.startTime - b.startTime);
  let clusterCount = 0;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].startTime - sorted[i-1].endTime < 0.02 && sorted[i].startTime - sorted[i-1].startTime < 0.05) {
      clusterCount++;
    }
  }
  if (clusterCount > 0) {
    issues.push({
      type: 'cluster',
      severity: clusterCount > 5 ? 'high' : 'medium',
      count: clusterCount,
      description: 'Notas sucesivas potencialmente agrupadas',
      affectedBars: [...new Set(sorted.map(e => e.bar))],
    });
  }

  // Detectar baja confianza
  const lowConf = events.filter(e => e.confidence < 0.4).length;
  if (lowConf > 0) {
    issues.push({
      type: 'low_confidence',
      severity: lowConf > events.length * 0.2 ? 'high' : 'medium',
      count: lowConf,
      description: 'Eventos con confianza inferior al 40%',
      affectedBars: [...new Set(events.filter(e => e.confidence < 0.4).map(e => e.bar))],
    });
    pitchScore -= lowConf / events.length * 0.3;
  }

  // Detectar errores de octava potenciales
  const octaveErrors = events.filter(e => e.confidence < 0.5 && e.midiNote > 60).length;
  if (octaveErrors > 0) {
    issues.push({
      type: 'octave',
      severity: 'medium',
      count: octaveErrors,
      description: 'Posibles errores de octava',
      affectedBars: [],
    });
  }

  const overall = Math.max(0, Math.min(1, (pitchScore + rhythmScore + durationScore) / 3));

  return {
    id: uuidv4(),
    versionId: 'current',
    timestamp: Date.now(),
    overallScore: overall,
    categories: {
      pitch: Math.max(0, pitchScore),
      rhythm: Math.max(0, rhythmScore),
      duration: Math.max(0, durationScore),
      instrumentation: 0.7,
      notation: 0.8,
      coherence: overall,
    },
    issues,
    sampleSize: events.length,
  };
}

// ============ AGENTE DE RENDIMIENTO ============
export function profileOperation(
  operationName: string,
  startTime: number,
  endTime: number,
  cacheHits: number,
  cacheMisses: number
): PerformanceSnapshot {
  const durationMs = endTime - startTime;
  const cacheHitRate = cacheHits + cacheMisses > 0 ? cacheHits / (cacheHits + cacheMisses) : 0;

  return {
    timestamp: Date.now(),
    taskType: operationName,
    audioCharacteristics: { duration: 0, channels: 0, sampleRate: 0, texture: 'unknown' },
    processingTimeMs: durationMs,
    peakMemoryMB: estimateMemory(durationMs),
    cacheHits,
    cacheMisses,
    humanInterventions: 0,
    engineUsed: 'webaudio-basic',
  };
}

function estimateMemory(durationMs: number): number {
  // Estimación determinista basada en duración
  return Math.min(512, 20 + durationMs * 0.01);
}

export function identifyBottlenecks(snapshots: PerformanceSnapshot[]): { operation: string; avgMs: number; frequency: number }[] {
  const grouped: Record<string, PerformanceSnapshot[]> = {};
  snapshots.forEach(s => {
    if (!grouped[s.taskType]) grouped[s.taskType] = [];
    grouped[s.taskType].push(s);
  });

  return Object.entries(grouped)
    .map(([op, snaps]) => ({
      operation: op,
      avgMs: snaps.reduce((sum, s) => sum + s.processingTimeMs, 0) / snaps.length,
      frequency: snaps.length,
    }))
    .sort((a, b) => (b.avgMs * b.frequency) - (a.avgMs * a.frequency));
}

// ============ AGENTE DE REGRESIÓN ============
export function checkRegression(
  candidateMetrics: Partial<ExperimentMetrics>,
  baselineMetrics: Partial<ExperimentMetrics>,
  criteria: AcceptanceCriteria
): { passes: boolean; failures: string[] } {
  const failures: string[] = [];

  if (candidateMetrics.noteAccuracy !== undefined && candidateMetrics.noteAccuracy < criteria.minNoteAccuracy) {
    failures.push(`Precisión de notas ${candidateMetrics.noteAccuracy.toFixed(3)} < ${criteria.minNoteAccuracy}`);
  }
  if (candidateMetrics.octaveErrors !== undefined && candidateMetrics.octaveErrors > criteria.maxOctaveErrors) {
    failures.push(`Errores de octava ${candidateMetrics.octaveErrors} > ${criteria.maxOctaveErrors}`);
  }
  if (candidateMetrics.clusterErrors !== undefined && candidateMetrics.clusterErrors > criteria.maxClusterErrors) {
    failures.push(`Errores de cluster ${candidateMetrics.clusterErrors} > ${criteria.maxClusterErrors}`);
  }
  if (baselineMetrics.avgProcessingTimeMs && candidateMetrics.avgProcessingTimeMs) {
    const speedup = (baselineMetrics.avgProcessingTimeMs - candidateMetrics.avgProcessingTimeMs) / baselineMetrics.avgProcessingTimeMs;
    if (speedup < criteria.minSpeedImprovement && criteria.minSpeedImprovement > 0) {
      failures.push(`Mejora de velocidad insuficiente: ${(speedup * 100).toFixed(1)}% < ${(criteria.minSpeedImprovement * 100).toFixed(1)}%`);
    }
  }

  return { passes: failures.length === 0, failures };
}

// ============ AGENTE DE LIBERACIÓN ============
export function evaluatePromotion(
  candidate: ModelVersion,
  regressionResult: { passes: boolean; failures: string[] },
  qualityReport: QualityReport
): { promote: boolean; reason: string } {
  if (!regressionResult.passes) {
    return { promote: false, reason: `Fallo en regresión: ${regressionResult.failures.join('; ')}` };
  }
  if (qualityReport.overallScore < 0.6) {
    return { promote: false, reason: `Calidad musical insuficiente: ${(qualityReport.overallScore * 100).toFixed(1)}%` };
  }
  return { promote: true, reason: 'Criterios de aceptación superados' };
}

// ============ CACHÉ ============
export function computeCacheKey(audioHash: string, engineVersion: string, params: any): string {
  const paramsStr = JSON.stringify(params);
  let hash = 0;
  for (let i = 0; i < paramsStr.length; i++) {
    hash = ((hash << 5) - hash) + paramsStr.charCodeAt(i);
    hash |= 0;
  }
  return `${audioHash}-${engineVersion}-${Math.abs(hash).toString(36)}`;
}

export function shouldInvalidateCache(entry: CacheEntry, currentEngineVersion: string): boolean {
  return entry.engineVersion !== currentEngineVersion;
}

// ============ HELPERS ============
export function emptyMetrics(): ExperimentMetrics {
  return {
    noteAccuracy: 0,
    octaveErrors: 0,
    clusterErrors: 0,
    durationErrors: 0,
    avgProcessingTimeMs: 0,
    peakMemoryMB: 0,
    cacheHitRate: 0,
    qualityDelta: 0,
    speedDelta: 0,
    humanReviewNeeded: 0,
  };
}

export function defaultAcceptanceCriteria(): AcceptanceCriteria {
  return {
    minNoteAccuracy: 0.85,
    maxOctaveErrors: 5,
    maxClusterErrors: 10,
    minSpeedImprovement: 0.05,
    maxRegressionRate: 0.02,
    mustPassRegressionSuite: true,
  };
}

export function createInitialAgentState(id: AgentId): AgentState {
  const configs: Record<AgentId, { name: string; description: string; budget: any }> = {
    coordinator: { name: 'Coordinador de Aprendizaje', description: 'Organiza tareas y prioriza agentes', budget: { maxCpuPercent: 10, maxMemoryMB: 64, maxConcurrentTasks: 1, priority: 'normal' } },
    data: { name: 'Datos y Evidencias', description: 'Prepara ejemplos de entrenamiento verificados', budget: { maxCpuPercent: 20, maxMemoryMB: 128, maxConcurrentTasks: 2, priority: 'normal' } },
    training: { name: 'Entrenamiento', description: 'Ejecuta experimentos reproducibles', budget: { maxCpuPercent: 60, maxMemoryMB: 512, maxConcurrentTasks: 1, priority: 'low' } },
    quality: { name: 'Calidad Musical', description: 'Evalúa fidelidad respecto a referencias', budget: { maxCpuPercent: 30, maxMemoryMB: 256, maxConcurrentTasks: 2, priority: 'high' } },
    performance: { name: 'Rendimiento', description: 'Mide tiempos, memoria y recursos', budget: { maxCpuPercent: 15, maxMemoryMB: 64, maxConcurrentTasks: 1, priority: 'normal' } },
    regression: { name: 'Regresión y Compatibilidad', description: 'Verifica preservación de funciones', budget: { maxCpuPercent: 40, maxMemoryMB: 256, maxConcurrentTasks: 1, priority: 'high' } },
    release: { name: 'Liberación y Recuperación', description: 'Gestiona promoción de versiones', budget: { maxCpuPercent: 10, maxMemoryMB: 64, maxConcurrentTasks: 1, priority: 'high' } },
  };

  const cfg = configs[id];
  return {
    id,
    name: cfg.name,
    description: cfg.description,
    status: 'idle',
    enabled: true,
    lastRun: null,
    runsCount: 0,
    currentTask: null,
    progress: 0,
    error: null,
    resourceBudget: cfg.budget,
  };
}
