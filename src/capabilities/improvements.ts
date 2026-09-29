// Motor de mejoras controladas para PRISMA SONORO
// Implementa las 36 mejoras de forma modular y reversible

import { MusicalEvent, Source } from '../types';

// ============ MEJORA 7: PERFIL DE COSTE POR ETAPA ============
export interface StageProfile {
  stage: string;
  startTime: number;
  endTime: number;
  durationMs: number;
  memoryMB: number;
  cacheHits: number;
  cacheMisses: number;
}

export class CostProfiler {
  private profiles: StageProfile[] = [];
  private currentStage: StageProfile | null = null;

  startStage(name: string) {
    this.currentStage = {
      stage: name,
      startTime: performance.now(),
      endTime: 0,
      durationMs: 0,
      memoryMB: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };
  }

  endStage(cacheHits = 0, cacheMisses = 0) {
    if (!this.currentStage) return;
    this.currentStage.endTime = performance.now();
    this.currentStage.durationMs = this.currentStage.endTime - this.currentStage.startTime;
    this.currentStage.cacheHits = cacheHits;
    this.currentStage.cacheMisses = cacheMisses;
    this.currentStage.memoryMB = (performance as any).memory?.usedJSHeapSize ? 
      (performance as any).memory.usedJSHeapSize / 1024 / 1024 : 0;
    this.profiles.push(this.currentStage);
    this.currentStage = null;
  }

  getProfiles(): StageProfile[] {
    return this.profiles;
  }

  getBottlenecks(): { stage: string; avgMs: number; frequency: number }[] {
    const grouped: Record<string, StageProfile[]> = {};
    this.profiles.forEach(p => {
      if (!grouped[p.stage]) grouped[p.stage] = [];
      grouped[p.stage].push(p);
    });
    return Object.entries(grouped)
      .map(([stage, profiles]) => ({
        stage,
        avgMs: profiles.reduce((s, p) => s + p.durationMs, 0) / profiles.length,
        frequency: profiles.length,
      }))
      .sort((a, b) => (b.avgMs * b.frequency) - (a.avgMs * a.frequency));
  }
}

// ============ MEJORA 8: CACHÉ POR CONTENIDO ============
export interface CacheEntry {
  key: string;
  data: any;
  createdAt: number;
  lastUsedAt: number;
  hitCount: number;
  sizeBytes: number;
}

export class ContentCache {
  private cache = new Map<string, CacheEntry>();
  private maxSizeMB = 100;
  private currentSizeBytes = 0;

  computeKey(audioHash: string, engineVersion: string, params: any): string {
    const paramsStr = JSON.stringify(params);
    let hash = 0;
    for (let i = 0; i < paramsStr.length; i++) {
      hash = ((hash << 5) - hash) + paramsStr.charCodeAt(i);
      hash |= 0;
    }
    return `${audioHash}:${engineVersion}:${Math.abs(hash).toString(36)}`;
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    entry.lastUsedAt = Date.now();
    entry.hitCount++;
    return entry.data;
  }

  set(key: string, data: any, sizeBytes: number) {
    if (this.currentSizeBytes + sizeBytes > this.maxSizeMB * 1024 * 1024) {
      this.evictLRU();
    }
    this.cache.set(key, {
      key,
      data,
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
      hitCount: 0,
      sizeBytes,
    });
    this.currentSizeBytes += sizeBytes;
  }

  private evictLRU() {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    let oldestSize = 0;
    
    this.cache.forEach((entry, key) => {
      if (entry.lastUsedAt < oldestTime) {
        oldestKey = key;
        oldestTime = entry.lastUsedAt;
        oldestSize = entry.sizeBytes;
      }
    });
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.currentSizeBytes -= oldestSize;
    }
  }

  invalidate(audioHash: string) {
    const keysToDelete: string[] = [];
    this.cache.forEach((entry, key) => {
      if (key.startsWith(audioHash)) {
        keysToDelete.push(key);
        this.currentSizeBytes -= entry.sizeBytes;
      }
    });
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  clear() {
    this.cache.clear();
    this.currentSizeBytes = 0;
  }

  getStats() {
    return {
      entries: this.cache.size,
      sizeMB: this.currentSizeBytes / 1024 / 1024,
      maxMB: this.maxSizeMB,
    };
  }
}

// ============ MEJORA 9: MAPA DE DEPENDENCIAS ============
export interface DependencyMap {
  eventId: string;
  dependsOn: string[];
  affects: string[];
}

export class DependencyTracker {
  private dependencies = new Map<string, DependencyMap>();

  register(eventId: string, dependsOn: string[], affects: string[]) {
    this.dependencies.set(eventId, { eventId, dependsOn, affects });
  }

  getAffected(eventId: string): string[] {
    const visited = new Set<string>();
    const queue = [eventId];
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);
      const dep = this.dependencies.get(current);
      if (dep) {
        dep.affects.forEach(id => queue.push(id));
      }
    }
    return Array.from(visited).filter(id => id !== eventId);
  }

  invalidate(eventId: string): string[] {
    return this.getAffected(eventId);
  }
}

// ============ MEJORA 16: ANÁLISIS DE ATAQUE Y CONTINUIDAD ============
export function analyzeAttackContinuity(
  events: MusicalEvent[],
  audioData: Float32Array,
  sampleRate: number
): { fragmented: string[]; merged: string[] } {
  const fragmented: string[] = [];
  const merged: string[] = [];
  const sorted = [...events].sort((a, b) => a.startTime - b.startTime);

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    
    // Detectar fragmentación: notas del mismo pitch muy cercanas
    if (Math.abs(prev.midiNote - curr.midiNote) <= 1 && 
        curr.startTime - prev.endTime < 0.05 &&
        curr.startTime - prev.startTime < 0.3) {
      // Verificar si hay silencio real entre ellas
      const gapStart = Math.floor(prev.endTime * sampleRate);
      const gapEnd = Math.floor(curr.startTime * sampleRate);
      let gapEnergy = 0;
      for (let j = gapStart; j < gapEnd && j < audioData.length; j++) {
        gapEnergy += audioData[j] * audioData[j];
      }
      gapEnergy = Math.sqrt(gapEnergy / Math.max(1, gapEnd - gapStart));
      
      if (gapEnergy < 0.01) {
        // Posible fragmentación
        fragmented.push(prev.id, curr.id);
      }
    }

    // Detectar fusión: nota muy larga con cambios de energía
    if (curr.duration > 1.0 && curr.confidence < 0.6) {
      const startSample = Math.floor(curr.startTime * sampleRate);
      const endSample = Math.floor(curr.endTime * sampleRate);
      let energyVariance = 0;
      let prevEnergy = 0;
      for (let j = startSample; j < endSample && j < audioData.length; j += 1024) {
        const energy = Math.abs(audioData[j]);
        energyVariance += Math.abs(energy - prevEnergy);
        prevEnergy = energy;
      }
      if (energyVariance > 0.5) {
        merged.push(curr.id);
      }
    }
  }

  return { fragmented, merged };
}

// ============ MEJORA 20: COMPROBACIÓN DE DESFASES ENTRE FUENTES ============
export function detectSourceDesync(
  sources: { id: string; events: MusicalEvent[] }[]
): { sourceId: string; offset: number }[] {
  const desyncs: { sourceId: string; offset: number }[] = [];
  
  // Comparar onsets entre fuentes
  const referenceSource = sources[0];
  if (!referenceSource) return desyncs;

  const refOnsets = referenceSource.events.map(e => e.startTime).sort((a, b) => a - b);
  
  for (let i = 1; i < sources.length; i++) {
    const source = sources[i];
    const srcOnsets = source.events.map(e => e.startTime).sort((a, b) => a - b);
    
    // Calcular desfase medio
    let totalOffset = 0;
    let count = 0;
    for (const refOnset of refOnsets) {
      const closest = srcOnsets.reduce((prev, curr) => 
        Math.abs(curr - refOnset) < Math.abs(prev - refOnset) ? curr : prev
      );
      const offset = closest - refOnset;
      if (Math.abs(offset) < 0.1) { // Dentro de 100ms
        totalOffset += offset;
        count++;
      }
    }
    
    if (count > 0) {
      const avgOffset = totalOffset / count;
      if (Math.abs(avgOffset) > 0.02) { // Más de 20ms de desfase
        desyncs.push({ sourceId: source.id, offset: avgOffset });
      }
    }
  }

  return desyncs;
}

// ============ MEJORA 21: DETECTOR DE FRAGMENTACIÓN Y FUSIÓN ============
export function detectFragmentationAndFusion(
  events: MusicalEvent[]
): { fragmented: { ids: string[]; suggestedMerge: Partial<MusicalEvent> }[]; fused: { id: string; suggestedSplit: Partial<MusicalEvent>[] }[] } {
  const fragmented: { ids: string[]; suggestedMerge: Partial<MusicalEvent> }[] = [];
  const fused: { id: string; suggestedSplit: Partial<MusicalEvent>[] }[] = [];
  const sorted = [...events].sort((a, b) => a.startTime - b.startTime);

  // Detectar fragmentación
  for (let i = 0; i < sorted.length - 1; i++) {
    const curr = sorted[i];
    const next = sorted[i + 1];
    
    if (curr.midiNote === next.midiNote && 
        next.startTime - curr.endTime < 0.03 &&
        curr.sourceId === next.sourceId) {
      fragmented.push({
        ids: [curr.id, next.id],
        suggestedMerge: {
          startTime: curr.startTime,
          endTime: next.endTime,
          duration: next.endTime - curr.startTime,
        },
      });
    }
  }

  // Detectar fusión
  for (const event of sorted) {
    if (event.duration > 2.0 && event.confidence < 0.5) {
      // Nota muy larga con baja confianza: posible fusión
      const midTime = event.startTime + event.duration / 2;
      fused.push({
        id: event.id,
        suggestedSplit: [
          { startTime: event.startTime, endTime: midTime, duration: midTime - event.startTime },
          { startTime: midTime, endTime: event.endTime, duration: event.endTime - midTime },
        ],
      });
    }
  }

  return { fragmented, fused };
}

// ============ MEJORA 22: IDENTIDAD DE VOZ ESTABLE ============
export function stabilizeVoiceIdentity(
  events: MusicalEvent[],
  maxLeap: number = 12
): MusicalEvent[] {
  const stabilized = [...events];
  const bySource: Record<string, MusicalEvent[]> = {};
  
  stabilized.forEach(ev => {
    if (!bySource[ev.sourceId]) bySource[ev.sourceId] = [];
    bySource[ev.sourceId].push(ev);
  });

  Object.values(bySource).forEach(sourceEvents => {
    const sorted = sourceEvents.sort((a, b) => a.startTime - b.startTime);
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      const leap = Math.abs(curr.midiNote - prev.midiNote);
      
      // Si el salto es mayor que maxLeap, considerar error de octava
      if (leap > maxLeap && leap % 12 === 0) {
        // Ajustar octava para mantener continuidad
        const direction = curr.midiNote > prev.midiNote ? 1 : -1;
        const adjusted = curr.midiNote - direction * 12;
        if (adjusted >= 21 && adjusted <= 108) {
          curr.midiNote = adjusted;
          curr.frequency = 440 * Math.pow(2, (adjusted - 69) / 12);
        }
      }
    }
  });

  return stabilized;
}

// ============ MEJORA 24: INFORME DE DIFERENCIAS MUSICALES ============
export interface MusicalDiff {
  type: 'added' | 'removed' | 'displaced' | 'prolonged' | 'shortened' | 'reassigned';
  eventId: string;
  description: string;
  before: Partial<MusicalEvent>;
  after: Partial<MusicalEvent>;
}

export function computeMusicalDiff(
  before: MusicalEvent[],
  after: MusicalEvent[]
): MusicalDiff[] {
  const diffs: MusicalDiff[] = [];
  const beforeMap = new Map(before.map(e => [e.id, e]));
  const afterMap = new Map(after.map(e => [e.id, e]));

  // Notas añadidas
  after.forEach(ev => {
    if (!beforeMap.has(ev.id)) {
      diffs.push({
        type: 'added',
        eventId: ev.id,
        description: `Nota ${ev.midiNote} añadida en compás ${ev.bar}`,
        before: {},
        after: { midiNote: ev.midiNote, startTime: ev.startTime },
      });
    }
  });

  // Notas eliminadas
  before.forEach(ev => {
    if (!afterMap.has(ev.id)) {
      diffs.push({
        type: 'removed',
        eventId: ev.id,
        description: `Nota ${ev.midiNote} eliminada del compás ${ev.bar}`,
        before: { midiNote: ev.midiNote, startTime: ev.startTime },
        after: {},
      });
    }
  });

  // Notas modificadas
  before.forEach(ev => {
    const afterEv = afterMap.get(ev.id);
    if (!afterEv) return;

    if (ev.startTime !== afterEv.startTime && Math.abs(ev.startTime - afterEv.startTime) > 0.01) {
      diffs.push({
        type: 'displaced',
        eventId: ev.id,
        description: `Nota ${ev.midiNote} desplazada ${((afterEv.startTime - ev.startTime) * 1000).toFixed(0)}ms`,
        before: { startTime: ev.startTime },
        after: { startTime: afterEv.startTime },
      });
    }

    if (ev.duration !== afterEv.duration && Math.abs(ev.duration - afterEv.duration) > 0.01) {
      const type = afterEv.duration > ev.duration ? 'prolonged' : 'shortened';
      diffs.push({
        type,
        eventId: ev.id,
        description: `Nota ${ev.midiNote} ${type === 'prolonged' ? 'prolongada' : 'acortada'} ${(Math.abs(afterEv.duration - ev.duration) * 1000).toFixed(0)}ms`,
        before: { duration: ev.duration },
        after: { duration: afterEv.duration },
      });
    }

    if (ev.sourceId !== afterEv.sourceId) {
      diffs.push({
        type: 'reassigned',
        eventId: ev.id,
        description: `Nota ${ev.midiNote} reasignada de fuente`,
        before: { sourceId: ev.sourceId },
        after: { sourceId: afterEv.sourceId },
      });
    }
  });

  return diffs;
}

// ============ MEJORA 34: PRUEBA DE IDA Y VUELTA ============
export function roundtripTest(
  originalEvents: MusicalEvent[],
  exportedData: any,
  reimportedEvents: MusicalEvent[]
): { passed: boolean; discrepancies: string[] } {
  const discrepancies: string[] = [];

  if (originalEvents.length !== reimportedEvents.length) {
    discrepancies.push(`Número de eventos: ${originalEvents.length} → ${reimportedEvents.length}`);
  }

  // Comparar notas
  const origSorted = [...originalEvents].sort((a, b) => a.startTime - b.startTime);
  const reimSorted = [...reimportedEvents].sort((a, b) => a.startTime - b.startTime);
  
  for (let i = 0; i < Math.min(origSorted.length, reimSorted.length); i++) {
    const orig = origSorted[i];
    const reim = reimSorted[i];
    
    if (orig.midiNote !== reim.midiNote) {
      discrepancies.push(`Evento ${i}: nota ${orig.midiNote} → ${reim.midiNote}`);
    }
    if (Math.abs(orig.startTime - reim.startTime) > 0.01) {
      discrepancies.push(`Evento ${i}: tiempo ${(orig.startTime * 1000).toFixed(0)}ms → ${(reim.startTime * 1000).toFixed(0)}ms`);
    }
    if (Math.abs(orig.duration - reim.duration) > 0.01) {
      discrepancies.push(`Evento ${i}: duración ${(orig.duration * 1000).toFixed(0)}ms → ${(reim.duration * 1000).toFixed(0)}ms`);
    }
  }

  return { passed: discrepancies.length === 0, discrepancies };
}

// ============ MEJORA 35: PORTABILIDAD DEL PROYECTO ============
export interface ProjectPackage {
  version: string;
  createdAt: number;
  matrix: any;
  audioReferences: { id: string; hash: string; path?: string }[];
  decisions: any[];
  configuration: any;
  externalResources: string[];
}

export function createProjectPackage(
  matrix: any,
  audioFiles: { id: string; name: string; buffer?: AudioBuffer }[],
  decisions: any[],
  configuration: any
): ProjectPackage {
  const externalResources: string[] = [];
  const audioReferences = audioFiles.map(f => ({
    id: f.id,
    hash: f.name, // Simplified hash
    path: undefined,
  }));

  // Detectar recursos externos
  if (audioFiles.some(f => !f.buffer)) {
    externalResources.push('Audio files not embedded');
  }

  return {
    version: '1.0.0',
    createdAt: Date.now(),
    matrix,
    audioReferences,
    decisions,
    configuration,
    externalResources,
  };
}

// ============ MEJORA 36: PUNTOS DE RECUPERACIÓN ============
export interface RecoveryPoint {
  id: string;
  stage: string;
  timestamp: number;
  data: any;
  sizeBytes: number;
}

export class RecoveryManager {
  private points: RecoveryPoint[] = [];
  private maxPoints = 10;

  savePoint(stage: string, data: any): RecoveryPoint {
    const point: RecoveryPoint = {
      id: `recovery-${Date.now()}`,
      stage,
      timestamp: Date.now(),
      data,
      sizeBytes: JSON.stringify(data).length,
    };
    this.points.push(point);
    
    // Mantener solo los últimos maxPoints
    if (this.points.length > this.maxPoints) {
      this.points.shift();
    }
    
    return point;
  }

  getLatestPoint(stage?: string): RecoveryPoint | null {
    if (stage) {
      return this.points.filter(p => p.stage === stage).pop() || null;
    }
    return this.points[this.points.length - 1] || null;
  }

  getPoints(): RecoveryPoint[] {
    return this.points;
  }

  clear() {
    this.points = [];
  }
}
