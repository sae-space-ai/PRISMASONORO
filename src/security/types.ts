// ═══════════════════════════════════════════════════════════════
// PRISMA SONORO — Security Types
// SECURITY SHIELD v1
// ═══════════════════════════════════════════════════════════════

export type SecuritySeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export type SecurityEventType =
  | 'INPUT_VALIDATION'
  | 'PROMPT_INJECTION_ATTEMPT'
  | 'SECRET_EXPOSURE_ATTEMPT'
  | 'PATH_TRAVERSAL_ATTEMPT'
  | 'NETWORK_REQUEST'
  | 'DEPENDENCY_AUDIT'
  | 'STATE_MODIFICATION'
  | 'MATRIX_VALIDATION'
  | 'EXPORT_VALIDATION'
  | 'AGENT_SUPERVISION'
  | 'ANOMALY_DETECTED'
  | 'RECOVERY_CHECKPOINT'
  | 'CIRCUIT_BREAKER';

export interface SecurityEvent {
  timestamp: number;
  eventType: SecurityEventType;
  module: string;
  severity: SecuritySeverity;
  operationId: string;
  result: 'SUCCESS' | 'FAILURE' | 'BLOCKED';
  duration?: number;
  safeMetadata: Record<string, string | number | boolean>;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface InputGuardResult {
  allowed: boolean;
  reason?: string;
  sanitized?: any;
}

export interface CircuitBreakerState {
  id: string;
  failures: number;
  lastFailure: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  threshold: number;
  timeout: number;
}

export type ImportState =
  | 'IDLE'
  | 'SELECTING'
  | 'READING'
  | 'DECODING'
  | 'ANALYSING'
  | 'READY'
  | 'ERROR'
  | 'CANCELLED';

export interface AgentPermission {
  id: string;
  role: string;
  allowedInputs: string[];
  allowedOutputs: string[];
  allowedActions: string[];
  forbiddenActions: string[];
  timeout: number;
  failurePolicy: 'FAIL_CLOSED' | 'FAIL_GRACEFULLY';
}

export interface MatrixInvariant {
  field: string;
  validator: (value: any) => boolean;
  errorMessage: string;
}

export interface HealthStatus {
  component: string;
  status: 'READY' | 'PARTIAL' | 'EXPERIMENTAL' | 'UNAVAILABLE' | 'ERROR';
  lastCheck: number;
  details?: string;
}
