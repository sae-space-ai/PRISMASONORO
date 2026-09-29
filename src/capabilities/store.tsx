import React, { createContext, useContext, useReducer, ReactNode, useCallback } from 'react';
import { CAPABILITIES, CapabilityId, Capability, CapabilitiesState } from './types';

const initialState: CapabilitiesState = {
  capabilities: CAPABILITIES.reduce((acc, cap) => {
    acc[cap.id] = cap;
    return acc;
  }, {} as Record<CapabilityId, Capability>),
};

type Action =
  | { type: 'TOGGLE_CAPABILITY'; payload: CapabilityId }
  | { type: 'ENABLE_GROUP'; payload: Capability['group'] }
  | { type: 'DISABLE_GROUP'; payload: Capability['group'] }
  | { type: 'RESET' };

function reducer(state: CapabilitiesState, action: Action): CapabilitiesState {
  switch (action.type) {
    case 'TOGGLE_CAPABILITY': {
      const cap = state.capabilities[action.payload];
      if (!cap) return state;
      
      // Check dependencies
      if (!cap.enabled) {
        const missingDeps = cap.dependencies.filter(dep => !state.capabilities[dep]?.enabled);
        if (missingDeps.length > 0) {
          console.warn(`Cannot enable ${cap.name}: missing dependencies: ${missingDeps.join(', ')}`);
          return state;
        }
      }
      
      return {
        ...state,
        capabilities: {
          ...state.capabilities,
          [action.payload]: { ...cap, enabled: !cap.enabled },
        },
      };
    }
    case 'ENABLE_GROUP': {
      const newCaps = { ...state.capabilities };
      (Object.keys(newCaps) as CapabilityId[]).forEach(id => {
        if (newCaps[id].group === action.payload) {
          newCaps[id] = { ...newCaps[id], enabled: true };
        }
      });
      return { ...state, capabilities: newCaps };
    }
    case 'DISABLE_GROUP': {
      const newCaps = { ...state.capabilities };
      (Object.keys(newCaps) as CapabilityId[]).forEach(id => {
        if (newCaps[id].group === action.payload) {
          newCaps[id] = { ...newCaps[id], enabled: false };
        }
      });
      return { ...state, capabilities: newCaps };
    }
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

const CapabilitiesContext = createContext<{ state: CapabilitiesState; dispatch: React.Dispatch<Action> } | null>(null);

export function CapabilitiesProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return <CapabilitiesContext.Provider value={{ state, dispatch }}>{children}</CapabilitiesContext.Provider>;
}

export function useCapabilities() {
  const ctx = useContext(CapabilitiesContext);
  if (!ctx) throw new Error('useCapabilities must be used within CapabilitiesProvider');
  return ctx;
}

export function useCapability(id: CapabilityId): { enabled: boolean; capability: Capability } {
  const { state } = useCapabilities();
  const cap = state.capabilities[id];
  return { enabled: cap?.enabled ?? false, capability: cap };
}

// Contract validation (mejora 2)
export interface ContractValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateContract(input: any, expectedVersion: string, expectedUnits: string): ContractValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!input) errors.push('Input is null or undefined');
  if (input?.version && input.version !== expectedVersion) {
    errors.push(`Version mismatch: expected ${expectedVersion}, got ${input.version}`);
  }
  if (input?.timeUnits && input.timeUnits !== expectedUnits) {
    warnings.push(`Time units: expected ${expectedUnits}, got ${input.timeUnits}`);
  }
  
  return { valid: errors.length === 0, errors, warnings };
}

// Atomic operation wrapper (mejora 5)
export function atomicOperation<T>(
  execute: () => T,
  rollback: (error: any) => void
): T | null {
  const snapshot = Date.now();
  try {
    const result = execute();
    return result;
  } catch (error) {
    rollback(error);
    return null;
  }
}
