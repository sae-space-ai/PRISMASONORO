import React, { createContext, useContext, useReducer, ReactNode, useCallback, useEffect, useRef } from 'react';
import {
  ContinuousImprovementState, AgentId, AgentState, Task, CorrectionExample,
  Experiment, ModelVersion, PromotionRecord, PerformanceSnapshot, QualityReport
} from './types';
import {
  createInitialAgentState, coordinatorDecideNextTask, validateCorrectionExample,
  classifyCorrectionType, evaluateQuality, profileOperation, checkRegression,
  evaluatePromotion, emptyMetrics, defaultAcceptanceCriteria, planExperiment,
  simulateTrainingStep, groupCorrectionsByType
} from './core';
import { v4 as uuidv4 } from 'uuid';

const initialState: ContinuousImprovementState = {
  enabled: true,
  agents: {
    coordinator: createInitialAgentState('coordinator'),
    data: createInitialAgentState('data'),
    training: createInitialAgentState('training'),
    quality: createInitialAgentState('quality'),
    performance: createInitialAgentState('performance'),
    regression: createInitialAgentState('regression'),
    release: createInitialAgentState('release'),
  },
  tasks: [],
  correctionExamples: [],
  experiments: [],
  modelVersions: [
    {
      id: 'v1.0.0-stable',
      name: 'v1.0.0 — Versión estable inicial',
      createdAt: Date.now(),
      isStable: true,
      isCandidate: false,
      metrics: { noteAccuracy: 0.75, octaveErrors: 8, clusterErrors: 12, avgProcessingTimeMs: 1200 },
      parentVersion: null,
      changelog: ['Versión inicial de PRISMA SONORO'],
    }
  ],
  cacheEntries: [],
  performanceSnapshots: [],
  qualityReports: [],
  promotionHistory: [],
  stableVersion: 'v1.0.0-stable',
  candidateVersion: null,
  baselineMetrics: { noteAccuracy: 0.75, octaveErrors: 8, clusterErrors: 12, avgProcessingTimeMs: 1200 },
};

type Action =
  | { type: 'TOGGLE_ENABLED' }
  | { type: 'TOGGLE_AGENT'; payload: AgentId }
  | { type: 'SET_AGENT_STATUS'; payload: { id: AgentId; status: AgentState['status']; task?: string; progress?: number; error?: string } }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: { id: string; updates: Partial<Task> } }
  | { type: 'ADD_CORRECTION_EXAMPLE'; payload: CorrectionExample }
  | { type: 'APPROVE_EXAMPLE'; payload: string }
  | { type: 'ADD_EXPERIMENT'; payload: Experiment }
  | { type: 'UPDATE_EXPERIMENT'; payload: { id: string; updates: Partial<Experiment> } }
  | { type: 'ADD_MODEL_VERSION'; payload: ModelVersion }
  | { type: 'ADD_PROMOTION'; payload: PromotionRecord }
  | { type: 'SET_STABLE_VERSION'; payload: string }
  | { type: 'SET_CANDIDATE_VERSION'; payload: string | null }
  | { type: 'ADD_PERFORMANCE_SNAPSHOT'; payload: PerformanceSnapshot }
  | { type: 'ADD_QUALITY_REPORT'; payload: QualityReport }
  | { type: 'RESET' };

function reducer(state: ContinuousImprovementState, action: Action): ContinuousImprovementState {
  switch (action.type) {
    case 'TOGGLE_ENABLED':
      return { ...state, enabled: !state.enabled };
    case 'TOGGLE_AGENT':
      return { ...state, agents: { ...state.agents, [action.payload]: { ...state.agents[action.payload], enabled: !state.agents[action.payload].enabled } } };
    case 'SET_AGENT_STATUS': {
      const agent = state.agents[action.payload.id];
      return {
        ...state,
        agents: {
          ...state.agents,
          [action.payload.id]: {
            ...agent,
            status: action.payload.status,
            currentTask: action.payload.task ?? agent.currentTask,
            progress: action.payload.progress ?? agent.progress,
            error: action.payload.error ?? agent.error,
            lastRun: action.payload.status === 'completed' ? Date.now() : agent.lastRun,
            runsCount: action.payload.status === 'completed' ? agent.runsCount + 1 : agent.runsCount,
          }
        }
      };
    }
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] };
    case 'UPDATE_TASK':
      return { ...state, tasks: state.tasks.map(t => t.id === action.payload.id ? { ...t, ...action.payload.updates } : t) };
    case 'ADD_CORRECTION_EXAMPLE':
      return { ...state, correctionExamples: [...state.correctionExamples, action.payload] };
    case 'APPROVE_EXAMPLE':
      return { ...state, correctionExamples: state.correctionExamples.map(e => e.id === action.payload ? { ...e, approved: true, approvedAt: Date.now() } : e) };
    case 'ADD_EXPERIMENT':
      return { ...state, experiments: [...state.experiments, action.payload] };
    case 'UPDATE_EXPERIMENT':
      return { ...state, experiments: state.experiments.map(e => e.id === action.payload.id ? { ...e, ...action.payload.updates } : e) };
    case 'ADD_MODEL_VERSION':
      return { ...state, modelVersions: [...state.modelVersions, action.payload] };
    case 'ADD_PROMOTION':
      return { ...state, promotionHistory: [...state.promotionHistory, action.payload] };
    case 'SET_STABLE_VERSION':
      return { ...state, stableVersion: action.payload };
    case 'SET_CANDIDATE_VERSION':
      return { ...state, candidateVersion: action.payload };
    case 'ADD_PERFORMANCE_SNAPSHOT':
      return { ...state, performanceSnapshots: [...state.performanceSnapshots.slice(-99), action.payload] };
    case 'ADD_QUALITY_REPORT':
      return { ...state, qualityReports: [...state.qualityReports, action.payload] };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

const AgentsContext = createContext<{ state: ContinuousImprovementState; dispatch: React.Dispatch<Action> } | null>(null);

export function AgentsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return <AgentsContext.Provider value={{ state, dispatch }}>{children}</AgentsContext.Provider>;
}

export function useAgents() {
  const ctx = useContext(AgentsContext);
  if (!ctx) throw new Error('useAgents must be used within AgentsProvider');
  return ctx;
}

// Hook para ejecutar tareas de agentes de forma asíncrona
export function useAgentExecutor() {
  const { state, dispatch } = useAgents();
  const timeoutsRef = useRef<Map<string, number>>(new Map());

  const runTask = useCallback(async (agentId: AgentId, taskType: string, executor: () => Promise<any>) => {
    if (!state.agents[agentId].enabled) return;

    const taskId = uuidv4();
    const task: Task = {
      id: taskId,
      agentId,
      type: taskType,
      description: `Tarea ${taskType} para ${state.agents[agentId].name}`,
      status: 'running',
      startedAt: Date.now(),
      completedAt: null,
      durationMs: null,
      resourcesUsed: { cpuMs: 0, memoryPeakMB: 0, modelLoads: 0, cacheHits: 0, cacheMisses: 0 },
      result: null,
      error: null,
    };

    dispatch({ type: 'ADD_TASK', payload: task });
    dispatch({ type: 'SET_AGENT_STATUS', payload: { id: agentId, status: 'running', task: taskType, progress: 0 } });

    try {
      const result = await executor();
      const durationMs = Date.now() - (task.startedAt || Date.now());
      dispatch({ type: 'UPDATE_TASK', payload: { id: taskId, updates: { status: 'completed', completedAt: Date.now(), durationMs, result } } });
      dispatch({ type: 'SET_AGENT_STATUS', payload: { id: agentId, status: 'completed', progress: 100 } });
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      dispatch({ type: 'UPDATE_TASK', payload: { id: taskId, updates: { status: 'failed', completedAt: Date.now(), error: errorMsg } } });
      dispatch({ type: 'SET_AGENT_STATUS', payload: { id: agentId, status: 'failed', error: errorMsg } });
      return null;
    }
  }, [state.agents, dispatch]);

  const cancelTask = useCallback((taskId: string) => {
    const timeout = timeoutsRef.current.get(taskId);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(taskId);
    }
    dispatch({ type: 'UPDATE_TASK', payload: { id: taskId, updates: { status: 'cancelled', completedAt: Date.now() } } });
  }, [dispatch]);

  return { runTask, cancelTask };
}
