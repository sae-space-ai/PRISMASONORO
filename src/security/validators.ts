// ═══════════════════════════════════════════════════════════════
// PRISMA SONORO — Security Validators
// SECURITY SHIELD v1
// SEC-01: INPUT SENTINEL
// SEC-02: PROMPT INJECTION GUARD
// SEC-04: PATH & FILE GUARD
// SEC-08: MUSICAL MATRIX GUARDIAN
// ═══════════════════════════════════════════════════════════════

import { ValidationResult, MatrixInvariant } from './types';
import { securityLogger } from './logger';
import { MusicalEvent } from '../types';

// ═══════════════════════════════════════════════════════════════
// SEC-01: INPUT SENTINEL — Validación de archivos de audio
// ═══════════════════════════════════════════════════════════════

const ALLOWED_AUDIO_EXTENSIONS = ['wav', 'mp3', 'flac', 'aiff', 'ogg', 'm4a', 'webm'];
const ALLOWED_AUDIO_MIMES = [
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/mpeg',
  'audio/mp3',
  'audio/flac',
  'audio/x-flac',
  'audio/aiff',
  'audio/x-aiff',
  'audio/ogg',
  'audio/mp4',
  'audio/x-m4a',
  'audio/webm',
];
const MAX_AUDIO_SIZE_MB = 500; // 500 MB límite razonable
const MAX_AUDIO_SIZE_BYTES = MAX_AUDIO_SIZE_MB * 1024 * 1024;

export function validateAudioFile(file: File): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validar nombre de archivo
  if (!file.name || file.name.trim() === '') {
    errors.push('Nombre de archivo vacío');
  }

  // Validar extensión
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension) {
    errors.push('Archivo sin extensión');
  } else if (!ALLOWED_AUDIO_EXTENSIONS.includes(extension)) {
    errors.push(`Extensión .${extension} no soportada. Formatos permitidos: ${ALLOWED_AUDIO_EXTENSIONS.join(', ')}`);
  }

  // Validar MIME (no confiar exclusivamente, pero usar como pista)
  if (file.type && !ALLOWED_AUDIO_MIMES.includes(file.type)) {
    warnings.push(`MIME type ${file.type} no reconocido, pero se intentará decodificar`);
  }

  // Validar tamaño
  if (file.size === 0) {
    errors.push('Archivo vacío');
  } else if (file.size > MAX_AUDIO_SIZE_BYTES) {
    errors.push(`Archivo demasiado grande (${(file.size / 1024 / 1024).toFixed(1)} MB). Límite: ${MAX_AUDIO_SIZE_MB} MB`);
  } else if (file.size > MAX_AUDIO_SIZE_BYTES / 2) {
    warnings.push(`Archivo grande (${(file.size / 1024 / 1024).toFixed(1)} MB). El procesamiento puede ser lento`);
  }

  // Validar que sea un archivo (no directorio, etc.)
  if (!(file instanceof File)) {
    errors.push('No es un archivo válido');
  }

  const result: ValidationResult = {
    valid: errors.length === 0,
    errors,
    warnings,
  };

  securityLogger.log(
    'INPUT_VALIDATION',
    'AudioImport',
    result.valid ? 'INFO' : 'WARNING',
    result.valid ? 'SUCCESS' : 'FAILURE',
    {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      extension: extension || 'unknown',
      errorCount: errors.length,
      warningCount: warnings.length,
    }
  );

  return result;
}

// ═══════════════════════════════════════════════════════════════
// SEC-02: PROMPT INJECTION GUARD — Detección de inyección de prompts
// ═══════════════════════════════════════════════════════════════

const INJECTION_PATTERNS = [
  /ignore\s+(previous|all|above)\s+instructions/i,
  /reveal\s+(secrets?|credentials?|tokens?|keys?)/i,
  /execute\s+(this\s+)?(command|code|script)/i,
  /change\s+system\s+policy/i,
  /you\s+are\s+now\s+a/i,
  /act\s+as\s+(if\s+you\s+are\s+)?/i,
  /forget\s+(your|all)\s+(instructions?|rules?)/i,
  /override\s+(security|permissions?|restrictions?)/i,
  /disable\s+(security|validation|checks?)/i,
  /bypass\s+(security|validation|restrictions?)/i,
  /<script/i,
  /javascript:/i,
  /data:text\/html/i,
  /eval\s*\(/i,
  /function\s*\(/i,
];

export function detectPromptInjection(text: string): { detected: boolean; patterns: string[] } {
  const detectedPatterns: string[] = [];

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      detectedPatterns.push(pattern.source);
    }
  }

  if (detectedPatterns.length > 0) {
    securityLogger.log(
      'PROMPT_INJECTION_ATTEMPT',
      'PromptGuard',
      'WARNING',
      'BLOCKED',
      {
        textLength: text.length,
        patternsDetected: detectedPatterns.length,
        sample: text.substring(0, 100),
      }
    );
  }

  return {
    detected: detectedPatterns.length > 0,
    patterns: detectedPatterns,
  };
}

// ═══════════════════════════════════════════════════════════════
// SEC-04: PATH & FILE GUARD — Protección contra path traversal
// ═══════════════════════════════════════════════════════════════

const DANGEROUS_PATH_PATTERNS = [
  /\.\.\//g,           // ../
  /\.\.\\/g,          // ..\
  /^\/etc\//,         // /etc/
  /^\/var\//,         // /var/
  /^\/usr\//,         // /usr/
  /^\/home\//,        // /home/
  /^C:\\/i,           // C:\
  /^D:\\/i,           // D:\
  /%2e%2e%2f/i,       // URL encoded ../
  /%2e%2e\\/i,        // URL encoded ..\
];

export function validateFileName(fileName: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validar longitud
  if (fileName.length > 255) {
    errors.push('Nombre de archivo demasiado largo');
  }

  // Validar caracteres peligrosos
  for (const pattern of DANGEROUS_PATH_PATTERNS) {
    if (pattern.test(fileName)) {
      errors.push('Nombre de archivo contiene secuencias peligrosas');
      break;
    }
  }

  // Validar caracteres nulos
  if (fileName.includes('\0')) {
    errors.push('Nombre de archivo contiene caracteres nulos');
  }

  // Validar que no sea una ruta absoluta
  if (fileName.startsWith('/') || /^[a-zA-Z]:\\/.test(fileName)) {
    errors.push('Rutas absolutas no permitidas');
  }

  const result: ValidationResult = {
    valid: errors.length === 0,
    errors,
    warnings,
  };

  if (!result.valid) {
    securityLogger.log(
      'PATH_TRAVERSAL_ATTEMPT',
      'PathGuard',
      'WARNING',
      'BLOCKED',
      {
        fileName: fileName.substring(0, 100),
        errorCount: errors.length,
      }
    );
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════
// SEC-08: MUSICAL MATRIX GUARDIAN — Validación de invariantes
// ═══════════════════════════════════════════════════════════════

const MATRIX_INVARIANTS: MatrixInvariant[] = [
  {
    field: 'startTime',
    validator: (v) => typeof v === 'number' && isFinite(v) && v >= 0,
    errorMessage: 'startTime debe ser un número finito >= 0',
  },
  {
    field: 'endTime',
    validator: (v) => typeof v === 'number' && isFinite(v) && v >= 0,
    errorMessage: 'endTime debe ser un número finito >= 0',
  },
  {
    field: 'duration',
    validator: (v) => typeof v === 'number' && isFinite(v) && v >= 0,
    errorMessage: 'duration debe ser un número finito >= 0',
  },
  {
    field: 'midiNote',
    validator: (v) => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 127,
    errorMessage: 'midiNote debe ser un entero entre 0 y 127',
  },
  {
    field: 'velocity',
    validator: (v) => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 127,
    errorMessage: 'velocity debe ser un entero entre 0 y 127',
  },
  {
    field: 'frequency',
    validator: (v) => typeof v === 'number' && isFinite(v) && v > 0,
    errorMessage: 'frequency debe ser un número finito > 0',
  },
  {
    field: 'confidence',
    validator: (v) => typeof v === 'number' && isFinite(v) && v >= 0 && v <= 1,
    errorMessage: 'confidence debe ser un número entre 0 y 1',
  },
  {
    field: 'bar',
    validator: (v) => typeof v === 'number' && Number.isInteger(v) && v >= 1,
    errorMessage: 'bar debe ser un entero >= 1',
  },
  {
    field: 'beat',
    validator: (v) => typeof v === 'number' && Number.isInteger(v) && v >= 1,
    errorMessage: 'beat debe ser un entero >= 1',
  },
  {
    field: 'subBeat',
    validator: (v) => typeof v === 'number' && Number.isInteger(v) && v >= 0,
    errorMessage: 'subBeat debe ser un entero >= 0',
  },
];

export function validateMusicalEvent(event: Partial<MusicalEvent>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validar ID
  if (!event.id || typeof event.id !== 'string' || event.id.trim() === '') {
    errors.push('Event ID es requerido');
  }

  // Validar sourceId
  if (!event.sourceId || typeof event.sourceId !== 'string') {
    errors.push('sourceId es requerido');
  }

  // Validar invariantes numéricos
  for (const invariant of MATRIX_INVARIANTS) {
    const value = (event as any)[invariant.field];
    if (value !== undefined && !invariant.validator(value)) {
      errors.push(`${invariant.field}: ${invariant.errorMessage}`);
    }
  }

  // Validar coherencia temporal
  if (event.startTime !== undefined && event.endTime !== undefined) {
    if (event.endTime < event.startTime) {
      errors.push('endTime debe ser >= startTime');
    }
  }

  if (event.startTime !== undefined && event.duration !== undefined) {
    const expectedEnd = event.startTime + event.duration;
    if (event.endTime !== undefined && Math.abs(event.endTime - expectedEnd) > 0.001) {
      warnings.push(`endTime (${event.endTime}) no coincide con startTime + duration (${expectedEnd})`);
    }
  }

  // Validar status
  const validStatuses = ['detected', 'proposed', 'corrected', 'protected', 'reviewed'];
  if (event.status && !validStatuses.includes(event.status)) {
    errors.push(`status inválido: ${event.status}`);
  }

  // Detectar NaN o Infinity
  for (const [key, value] of Object.entries(event)) {
    if (typeof value === 'number' && (isNaN(value) || !isFinite(value))) {
      errors.push(`${key} contiene NaN o Infinity`);
    }
  }

  const result: ValidationResult = {
    valid: errors.length === 0,
    errors,
    warnings,
  };

  if (!result.valid) {
    securityLogger.log(
      'MATRIX_VALIDATION',
      'MatrixGuardian',
      'ERROR',
      'FAILURE',
      {
        eventId: event.id || 'unknown',
        errorCount: errors.length,
        warningCount: warnings.length,
        firstError: errors[0] || 'unknown',
      }
    );
  }

  return result;
}

export function validateMusicalEvents(events: MusicalEvent[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validar cada evento
  for (const event of events) {
    const result = validateMusicalEvent(event);
    if (!result.valid) {
      errors.push(`Evento ${event.id}: ${result.errors.join(', ')}`);
    }
    warnings.push(...result.warnings.map(w => `Evento ${event.id}: ${w}`));
  }

  // Detectar IDs duplicados
  const ids = new Set<string>();
  for (const event of events) {
    if (ids.has(event.id)) {
      errors.push(`ID duplicado: ${event.id}`);
    }
    ids.add(event.id);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
