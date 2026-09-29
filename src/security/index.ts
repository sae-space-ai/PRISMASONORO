// ═══════════════════════════════════════════════════════════════
// PRISMA SONORO — Security Module
// SECURITY SHIELD v1
// ═══════════════════════════════════════════════════════════════

export * from './types';
export * from './logger';
export * from './validators';
export * from './circuit-breaker';

// Re-exportar singleton instances
export { securityLogger } from './logger';
export { circuitBreakerManager, withCircuitBreaker } from './circuit-breaker';
