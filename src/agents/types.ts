// Tipos del sistema de agentes de aprendizaje continuo
// Módulo paralelo y reversible — no altera la matriz central de conversión

export type AgentId =
  | 'coordinator'
  | 'data'
  | 'training'
  | 'quality'
  | 'performance'
  | 'regression'
  | 'release';

export type AgentStatus = 'idle' | 'running' | 'waiting' | 'blocked' | 'completed' | 'failed';

export interface AgentState {
  id: AgentId;
  name: string;
  description: string;
  status: AgentStatus;
  enabled: boolean;
  lastRun: number | null;
  runsCount: number;
  currentTask: string | null;
  progress: number;
  error: string | null;
  resourceBudget: ResourceBudget;
}

export interface ResourceBudget {
  maxCpuPercent: number;
  maxMemoryMB: number;
  maxConcurrentTasks: number;
  priority: 'low' | 'normal' | 'high' | 'interactive';
}

export interface Task {
  id: string;
  agentId: AgentId;
  type: string;
  description: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: number | null;
  completedAt: number | null;
  durationMs: number | null;
  resourcesUsed: ResourceUsage;
  result: any;
  error: string | null;
}

export interface ResourceUsage {
  cpuMs: number;
  memoryPeakMB: number;
  modelLoads: number;
  cacheHits: number;
  cacheMisses: number;
}

export interface CorrectionExample {
  id: string;
  audioHash: string;
  timestamp: number;
  context: {
    bar: number;
    beat: number;
    sourceId: string;
    instrument: string;
    texture: string;
  };
  originalEvent: {
    midiNote: number;
    startTime: number;
    endTime: number;
    confidence: number;
  };
  correctedEvent: {
    midiNote: number;
    startTime: number;
    endTime: number;
    confidence: number;
  };
  correctionType: 'octave' | 'cluster' | 'duration' | 'instrument' | 'voice' | 'quantization' | 'other';
  approved: boolean;
  approvedAt: number | null;
  approvedBy: 'user' | 'auto';
  generalizable: boolean;
  notes: string;
}

export interface Experiment {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  status: 'planned' | 'running' | 'evaluating' | 'accepted' | 'rejected' | 'cancelled';
  datasetVersion: string;
  configVersion: string;
  baseModelVersion: string;
  candidateVersion: string | null;
  metrics: ExperimentMetrics;
  acceptanceCriteria: AcceptanceCriteria;
  tasks: string[];
}

export interface ExperimentMetrics {
  // Quality
  noteAccuracy: number;
  octaveErrors: number;
  clusterErrors: number;
  durationErrors: number;
  // Performance
  avgProcessingTimeMs: number;
  peakMemoryMB: number;
  cacheHitRate: number;
  // Comparison vs baseline
  qualityDelta: number;
  speedDelta: number;
  // Human review
  humanReviewNeeded: number;
}

export interface AcceptanceCriteria {
  minNoteAccuracy: number;
  maxOctaveErrors: number;
  maxClusterErrors: number;
  minSpeedImprovement: number;
  maxRegressionRate: number;
  mustPassRegressionSuite: boolean;
}

export interface ModelVersion {
  id: string;
  name: string;
  createdAt: number;
  isStable: boolean;
  isCandidate: boolean;
  metrics: Partial<ExperimentMetrics>;
  parentVersion: string | null;
  changelog: string[];
}

export interface CacheEntry {
  id: string;
  audioHash: string;
  engineVersion: string;
  paramsHash: string;
  createdAt: number;
  lastUsedAt: number;
  sizeBytes: number;
  hitCount: number;
}

export interface PerformanceSnapshot {
  timestamp: number;
  taskType: string;
  audioCharacteristics: {
    duration: number;
    channels: number;
    sampleRate: number;
    texture: string;
  };
  processingTimeMs: number;
  peakMemoryMB: number;
  cacheHits: number;
  cacheMisses: number;
  humanInterventions: number;
  engineUsed: string;
}

export interface QualityReport {
  id: string;
  versionId: string;
  timestamp: number;
  overallScore: number;
  categories: {
    pitch: number;
    rhythm: number;
    duration: number;
    instrumentation: number;
    notation: number;
    coherence: number;
  };
  issues: QualityIssue[];
  sampleSize: number;
}

export interface QualityIssue {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  count: number;
  description: string;
  affectedBars: number[];
}

export interface PromotionRecord {
  id: string;
  timestamp: number;
  fromVersion: string | null;
  toVersion: string;
  reason: string;
  approvedBy: string;
  metrics: Partial<ExperimentMetrics>;
  reversible: boolean;
}

export interface ContinuousImprovementState {
  enabled: boolean;
  agents: Record<AgentId, AgentState>;
  tasks: Task[];
  correctionExamples: CorrectionExample[];
  experiments: Experiment[];
  modelVersions: ModelVersion[];
  cacheEntries: CacheEntry[];
  performanceSnapshots: PerformanceSnapshot[];
  qualityReports: QualityReport[];
  promotionHistory: PromotionRecord[];
  stableVersion: string;
  candidateVersion: string | null;
  baselineMetrics: Partial<ExperimentMetrics>;
}
