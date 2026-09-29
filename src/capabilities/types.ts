// Sistema de capacidades con interruptores independientes
// Cada mejora puede activarse/desactivarse sin afectar al resto

export type CapabilityId =
  // Protección
  | 'contracts'
  | 'reference_projects'
  | 'comparative_execution'
  | 'atomic_changes'
  | 'dependency_versions'
  // Velocidad
  | 'cost_profiling'
  | 'content_cache'
  | 'dependency_map'
  | 'session_reuse'
  | 'concurrency_control'
  | 'inference_optimization'
  | 'numeric_precision'
  | 'ui_separation'
  | 'hardware_acceleration'
  // Fidelidad musical
  | 'attack_continuity'
  | 'resonance_pedal'
  | 'basic_pitch'
  | 'beat_detection'
  | 'source_sync'
  | 'fragmentation_detector'
  | 'voice_identity'
  | 'metric_hypotheses'
  | 'musical_diff_report'
  // Aprendizaje
  | 'informative_examples'
  | 'label_quality'
  | 'scoped_rules'
  | 'engine_selector_learning'
  | 'distillation'
  | 'confidence_calibration'
  | 'event_driven_agents'
  | 'independent_evaluation'
  // Edición y exportación
  | 'selective_rendering'
  | 'roundtrip_test'
  | 'project_portability'
  | 'recovery_points';

export interface Capability {
  id: CapabilityId;
  name: string;
  description: string;
  group: 'protection' | 'speed' | 'fidelity' | 'learning' | 'export';
  enabled: boolean;
  experimental: boolean;
  requiresRestart: boolean;
  dependencies: CapabilityId[];
}

export const CAPABILITIES: Capability[] = [
  // Protección
  { id: 'contracts', name: 'Contratos entre módulos', description: 'Valida entradas/salidas y versiones de datos', group: 'protection', enabled: true, experimental: false, requiresRestart: false, dependencies: [] },
  { id: 'reference_projects', name: 'Proyectos de referencia', description: 'Conserva proyectos representativos para detectar regresiones', group: 'protection', enabled: true, experimental: false, requiresRestart: false, dependencies: [] },
  { id: 'comparative_execution', name: 'Ejecución comparativa', description: 'Nuevos motores producen resultados alternativos sin modificar proyectos', group: 'protection', enabled: true, experimental: false, requiresRestart: false, dependencies: ['contracts'] },
  { id: 'atomic_changes', name: 'Cambios atómicos', description: 'Correcciones completas o ninguna modificación', group: 'protection', enabled: true, experimental: false, requiresRestart: false, dependencies: [] },
  { id: 'dependency_versions', name: 'Versiones de dependencias', description: 'Fija versiones compatibles y prueba actualizaciones', group: 'protection', enabled: true, experimental: false, requiresRestart: false, dependencies: [] },
  
  // Velocidad
  { id: 'cost_profiling', name: 'Perfil de coste', description: 'Mide tiempo por etapa de procesamiento', group: 'speed', enabled: true, experimental: false, requiresRestart: false, dependencies: [] },
  { id: 'content_cache', name: 'Caché por contenido', description: 'Identifica resultados por contenido y parámetros', group: 'speed', enabled: true, experimental: false, requiresRestart: false, dependencies: [] },
  { id: 'dependency_map', name: 'Mapa de dependencias', description: 'Calcula qué resultados quedan afectados al cambiar un evento', group: 'speed', enabled: true, experimental: false, requiresRestart: false, dependencies: ['contracts'] },
  { id: 'session_reuse', name: 'Reutilización de sesiones', description: 'Mantiene motores frecuentes en memoria', group: 'speed', enabled: false, experimental: true, requiresRestart: true, dependencies: ['content_cache'] },
  { id: 'concurrency_control', name: 'Control de concurrencia', description: 'Coordina agentes y motores para evitar competencia', group: 'speed', enabled: true, experimental: false, requiresRestart: false, dependencies: [] },
  { id: 'inference_optimization', name: 'Optimización de inferencia', description: 'Evalúa optimizaciones de grafo y formatos de ejecución', group: 'speed', enabled: false, experimental: true, requiresRestart: true, dependencies: [] },
  { id: 'numeric_precision', name: 'Precisión numérica reducida', description: 'Evalúa cuantización numérica de modelos', group: 'speed', enabled: false, experimental: true, requiresRestart: true, dependencies: ['inference_optimization'] },
  { id: 'ui_separation', name: 'UI independiente del cálculo', description: 'Ejecuta trabajo pesado fuera del hilo visual', group: 'speed', enabled: true, experimental: false, requiresRestart: false, dependencies: [] },
  { id: 'hardware_acceleration', name: 'Aceleración por hardware', description: 'Evalúa WebGPU cuando sea compatible', group: 'speed', enabled: false, experimental: true, requiresRestart: true, dependencies: [] },
  
  // Fidelidad musical
  { id: 'attack_continuity', name: 'Análisis de ataque y continuidad', description: 'Contrasta ataques con continuidad de altura', group: 'fidelity', enabled: false, experimental: true, requiresRestart: false, dependencies: [] },
  { id: 'resonance_pedal', name: 'Resonancia y pedal', description: 'Distingue liberación, resonancia y pedal en piano', group: 'fidelity', enabled: false, experimental: true, requiresRestart: false, dependencies: ['attack_continuity'] },
  { id: 'basic_pitch', name: 'Basic Pitch', description: 'Motor ligero para fuentes individuales', group: 'fidelity', enabled: false, experimental: true, requiresRestart: true, dependencies: [] },
  { id: 'beat_detection', name: 'Detección de pulso', description: 'Estimación independiente de pulso y comienzo de compás', group: 'fidelity', enabled: false, experimental: true, requiresRestart: false, dependencies: [] },
  { id: 'source_sync', name: 'Sincronización de fuentes', description: 'Detecta desfases temporales entre fuentes', group: 'fidelity', enabled: true, experimental: false, requiresRestart: false, dependencies: [] },
  { id: 'fragmentation_detector', name: 'Detector de fragmentación', description: 'Localiza notas divididas o fusionadas indebidamente', group: 'fidelity', enabled: false, experimental: true, requiresRestart: false, dependencies: ['attack_continuity'] },
  { id: 'voice_identity', name: 'Identidad de voz estable', description: 'Conserva continuidad aunque cruce registros', group: 'fidelity', enabled: true, experimental: false, requiresRestart: false, dependencies: [] },
  { id: 'metric_hypotheses', name: 'Hipótesis de métrica', description: 'Conserva interpretaciones alternativas de pulso', group: 'fidelity', enabled: false, experimental: true, requiresRestart: false, dependencies: ['beat_detection'] },
  { id: 'musical_diff_report', name: 'Informe de diferencias', description: 'Muestra cambios musicales después de correcciones', group: 'fidelity', enabled: true, experimental: false, requiresRestart: false, dependencies: [] },
  
  // Aprendizaje
  { id: 'informative_examples', name: 'Ejemplos informativos', description: 'Prioriza fragmentos donde motores discrepan', group: 'learning', enabled: true, experimental: false, requiresRestart: false, dependencies: [] },
  { id: 'label_quality', name: 'Calidad de etiquetas', description: 'Detecta etiquetas contradictorias o defectuosas', group: 'learning', enabled: true, experimental: false, requiresRestart: false, dependencies: [] },
  { id: 'scoped_rules', name: 'Reglas con ámbito', description: 'Guarda si una corrección es universal o específica', group: 'learning', enabled: true, experimental: false, requiresRestart: false, dependencies: [] },
  { id: 'engine_selector_learning', name: 'Aprendizaje del selector', description: 'Entrena el coordinador para elegir procedimientos', group: 'learning', enabled: false, experimental: true, requiresRestart: false, dependencies: ['informative_examples'] },
  { id: 'distillation', name: 'Destilación de modelos', description: 'Transfiere capacidades a modelos menores', group: 'learning', enabled: false, experimental: true, requiresRestart: true, dependencies: [] },
  { id: 'confidence_calibration', name: 'Calibración de confianza', description: 'Verifica si niveles de confianza corresponden a resultados', group: 'learning', enabled: false, experimental: true, requiresRestart: false, dependencies: [] },
  { id: 'event_driven_agents', name: 'Agentes por eventos', description: 'Activa agentes solo cuando hay trabajo concreto', group: 'learning', enabled: true, experimental: false, requiresRestart: false, dependencies: [] },
  { id: 'independent_evaluation', name: 'Evaluación independiente', description: 'Entrenamiento no aprueba sus propios candidatos', group: 'learning', enabled: true, experimental: false, requiresRestart: false, dependencies: [] },
  
  // Edición y exportación
  { id: 'selective_rendering', name: 'Renderizado selectivo', description: 'Actualiza solo páginas o regiones necesarias', group: 'export', enabled: false, experimental: true, requiresRestart: false, dependencies: [] },
  { id: 'roundtrip_test', name: 'Prueba de ida y vuelta', description: 'Exporta e importa para comparar contenido', group: 'export', enabled: true, experimental: false, requiresRestart: false, dependencies: [] },
  { id: 'project_portability', name: 'Portabilidad del proyecto', description: 'Guarda paquete con matriz y referencias', group: 'export', enabled: true, experimental: false, requiresRestart: false, dependencies: [] },
  { id: 'recovery_points', name: 'Puntos de recuperación', description: 'Guarda resultados de etapas costosas', group: 'export', enabled: true, experimental: false, requiresRestart: false, dependencies: [] },
];

export interface CapabilitiesState {
  capabilities: Record<CapabilityId, Capability>;
}
