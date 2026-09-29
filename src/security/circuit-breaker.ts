// ═══════════════════════════════════════════════════════════════
// PRISMA SONORO — Circuit Breaker
// SECURITY SHIELD v1
// SEC-11: ANOMALY WATCHDOG
// SEC-15: CIRCUIT BREAKER
// ═══════════════════════════════════════════════════════════════

import { CircuitBreakerState } from './types';
import { securityLogger } from './logger';

class CircuitBreakerManager {
  private breakers = new Map<string, CircuitBreakerState>();

  getOrCreate(id: string, threshold: number = 5, timeout: number = 60000): CircuitBreakerState {
    if (!this.breakers.has(id)) {
      this.breakers.set(id, {
        id,
        failures: 0,
        lastFailure: 0,
        state: 'CLOSED',
        threshold,
        timeout,
      });
    }
    return this.breakers.get(id)!;
  }

  canExecute(id: string): boolean {
    const breaker = this.getOrCreate(id);
    
    if (breaker.state === 'CLOSED') {
      return true;
    }

    if (breaker.state === 'OPEN') {
      // Verificar si ha pasado el timeout
      const now = Date.now();
      if (now - breaker.lastFailure > breaker.timeout) {
        // Transicionar a HALF_OPEN
        breaker.state = 'HALF_OPEN';
        securityLogger.log(
          'CIRCUIT_BREAKER',
          'CircuitBreaker',
          'INFO',
          'SUCCESS',
          {
            breakerId: id,
            newState: 'HALF_OPEN',
          }
        );
        return true;
      }
      return false;
    }

    if (breaker.state === 'HALF_OPEN') {
      return true;
    }

    return false;
  }

  recordSuccess(id: string): void {
    const breaker = this.getOrCreate(id);
    
    if (breaker.state === 'HALF_OPEN') {
      // Éxito en HALF_OPEN → volver a CLOSED
      breaker.state = 'CLOSED';
      breaker.failures = 0;
      securityLogger.log(
        'CIRCUIT_BREAKER',
        'CircuitBreaker',
        'INFO',
        'SUCCESS',
        {
          breakerId: id,
          newState: 'CLOSED',
        }
      );
    } else if (breaker.state === 'CLOSED') {
      // Resetear contador de fallos
      breaker.failures = 0;
    }
  }

  recordFailure(id: string): void {
    const breaker = this.getOrCreate(id);
    breaker.failures++;
    breaker.lastFailure = Date.now();

    if (breaker.failures >= breaker.threshold) {
      breaker.state = 'OPEN';
      securityLogger.log(
        'CIRCUIT_BREAKER',
        'CircuitBreaker',
        'WARNING',
        'FAILURE',
        {
          breakerId: id,
          newState: 'OPEN',
          failures: breaker.failures,
        }
      );
    }
  }

  getState(id: string): CircuitBreakerState | null {
    return this.breakers.get(id) || null;
  }

  reset(id: string): void {
    const breaker = this.breakers.get(id);
    if (breaker) {
      breaker.state = 'CLOSED';
      breaker.failures = 0;
      breaker.lastFailure = 0;
    }
  }

  getAllStates(): CircuitBreakerState[] {
    return Array.from(this.breakers.values());
  }
}

// Singleton
export const circuitBreakerManager = new CircuitBreakerManager();

// Wrapper para ejecutar operaciones con circuit breaker
export async function withCircuitBreaker<T>(
  id: string,
  operation: () => Promise<T>,
  fallback?: () => T
): Promise<T | null> {
  if (!circuitBreakerManager.canExecute(id)) {
    securityLogger.log(
      'CIRCUIT_BREAKER',
      'CircuitBreaker',
      'WARNING',
      'BLOCKED',
      {
        breakerId: id,
        reason: 'Circuit is OPEN',
      }
    );
    
    if (fallback) {
      return fallback();
    }
    return null;
  }

  try {
    const result = await operation();
    circuitBreakerManager.recordSuccess(id);
    return result;
  } catch (error) {
    circuitBreakerManager.recordFailure(id);
    
    securityLogger.log(
      'ANOMALY_DETECTED',
      'CircuitBreaker',
      'ERROR',
      'FAILURE',
      {
        breakerId: id,
        error: error instanceof Error ? error.message : String(error),
      }
    );

    if (fallback) {
      return fallback();
    }
    throw error;
  }
}
