// ═══════════════════════════════════════════════════════════════
// PRISMA SONORO — Security Logger
// SECURITY SHIELD v1
// ═══════════════════════════════════════════════════════════════

import { SecurityEvent, SecurityEventType, SecuritySeverity } from './types';
import { v4 as uuidv4 } from 'uuid';

class SecurityLogger {
  private events: SecurityEvent[] = [];
  private maxEvents = 1000;

  log(
    eventType: SecurityEventType,
    module: string,
    severity: SecuritySeverity,
    result: 'SUCCESS' | 'FAILURE' | 'BLOCKED',
    safeMetadata: Record<string, string | number | boolean> = {},
    duration?: number
  ): SecurityEvent {
    const event: SecurityEvent = {
      timestamp: Date.now(),
      eventType,
      module,
      severity,
      operationId: uuidv4(),
      result,
      duration,
      safeMetadata: this.sanitizeMetadata(safeMetadata),
    };

    this.events.push(event);

    // Mantener solo los últimos maxEvents
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Log en consola solo para ERROR y CRITICAL
    if (severity === 'ERROR' || severity === 'CRITICAL') {
      console.warn(`[SECURITY ${severity}] ${eventType} in ${module}:`, {
        operationId: event.operationId,
        result: event.result,
        ...safeMetadata,
      });
    }

    return event;
  }

  private sanitizeMetadata(metadata: Record<string, any>): Record<string, string | number | boolean> {
    const sanitized: Record<string, string | number | boolean> = {};
    
    for (const [key, value] of Object.entries(metadata)) {
      // NO guardar secretos
      if (key.toLowerCase().includes('key') || 
          key.toLowerCase().includes('token') || 
          key.toLowerCase().includes('password') ||
          key.toLowerCase().includes('secret')) {
        sanitized[key] = '[REDACTED]';
        continue;
      }

      // Convertir a tipos seguros
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        sanitized[key] = value;
      } else if (value === null || value === undefined) {
        sanitized[key] = String(value);
      } else {
        sanitized[key] = '[COMPLEX]';
      }
    }

    return sanitized;
  }

  getEvents(filter?: { severity?: SecuritySeverity; eventType?: SecurityEventType }): SecurityEvent[] {
    let filtered = this.events;

    if (filter?.severity) {
      filtered = filtered.filter(e => e.severity === filter.severity);
    }

    if (filter?.eventType) {
      filtered = filtered.filter(e => e.eventType === filter.eventType);
    }

    return filtered;
  }

  getRecentEvents(count: number = 10): SecurityEvent[] {
    return this.events.slice(-count);
  }

  clear(): void {
    this.events = [];
  }

  getStats(): { total: number; bySeverity: Record<SecuritySeverity, number> } {
    const bySeverity: Record<SecuritySeverity, number> = {
      INFO: 0,
      WARNING: 0,
      ERROR: 0,
      CRITICAL: 0,
    };

    for (const event of this.events) {
      bySeverity[event.severity]++;
    }

    return {
      total: this.events.length,
      bySeverity,
    };
  }
}

// Singleton
export const securityLogger = new SecurityLogger();
