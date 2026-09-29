# 🏗️ Arquitectura Técnica — PRISMA SONORO

Este documento describe la arquitectura técnica de PRISMA SONORO, incluyendo la matriz central de conversión, el sistema de agentes, las capacidades controladas y la integración de componentes.

---

## 📐 Visión General

PRISMA SONORO sigue una arquitectura modular basada en:

1. **Matriz Central de Conversión** — Representación unificada de todos los datos musicales
2. **Sistema de Estados** — Gestión reactiva con React Context + useReducer
3. **Sistema de Agentes** — Aprendizaje continuo con 7 agentes especializados
4. **Sistema de Capacidades** — 36 mejoras controladas con interruptores independientes
5. **Componentes Modulares** — Interfaz dividida en zonas funcionales

---

## 🎯 Matriz Central de Conversión

### Concepto

La matriz central es la estructura de datos fundamental que relaciona:

```
AUDIO → FUENTE → COMPONENTES ACÚSTICOS → EVENTO → INSTRUMENTO → 
VOZ → COMPÁS → POSICIÓN MÉTRICA → NOTACIÓN → REPRODUCCIÓN → EXPORTACIÓN
```

### Estructura de Datos

```typescript
interface MusicalEvent {
  id: string;
  sourceId: string;              // Fuente de procedencia
  startTime: number;             // Inicio en segundos
  endTime: number;               // Final en segundos
  frequency: number;             // Frecuencia fundamental (Hz)
  midiNote: number;              // Nota MIDI (21-108)
  velocity: number;              // Intensidad (0-127)
  duration: number;              // Duración en segundos
  pitchDeviation: number;        // Desviación de afinación (cents)
  confidence: number;            // Confianza (0-1)
  status: 'detected' | 'proposed' | 'corrected' | 'protected' | 'reviewed';
  articulation?: string;         // Articulación propuesta
  voice: number;                 // Voz dentro de la fuente
  bar: number;                   // Compás
  beat: number;                  // Tiempo dentro del compás
  subBeat: number;               // Subdivisión (semicorchea)
  alternatives?: AlternativeEvent[];  // Alternativas de interpretación
  history: EventHistoryEntry[];  // Historial de modificaciones
}
```

### Estado Global

```typescript
interface ProjectState {
  audio: AudioFile | null;       // Audio cargado
  sources: Source[];             // Fuentes/instrumentos
  events: MusicalEvent[];        // Eventos musicales (matriz central)
  bars: Bar[];                   // Compases
  tempo: number;                 // Tempo (BPM)
  timeSignature: [number, number]; // Compás (ej: [4, 4])
  key: string;                   // Tonalidad
  quantizationMode: QuantizationMode; // Modo de cuantización
  currentView: string;           // Vista actual
  isProcessing: boolean;         // Estado de procesamiento
  processingStage: string;       // Etapa actual
  progress: number;              // Progreso (0-100)
  selectedEventId: string | null; // Evento seleccionado
  playbackPosition: number;      // Posición de reproducción
  isPlaying: boolean;            // Estado de reproducción
}
```

---

## 🤖 Sistema de Agentes

### Arquitectura

El sistema de agentes opera de forma **paralela e independiente** al flujo principal de transcripción.

```
┌─────────────────────────────────────────────────────────┐
│                   COORDINADOR                           │
│         (Organiza tareas y prioriza agentes)            │
└────────────────┬────────────────────────────────────────┘
                 │
    ┌────────────┼────────────┬────────────┬────────────┐
    │            │            │            │            │
┌───▼───┐  ┌────▼───┐  ┌────▼───┐  ┌────▼───┐  ┌────▼───┐
│ DATOS │  │ENTRENA-│  │CALIDAD │  │RENDI-  │  │REGRE-  │
│       │  │  MIENTO│  │        │  │MIENTO  │  │SIÓN    │
└───┬───┘  └────┬───┘  └────┬───┘  └────┬───┘  └────┬───┘
    │           │           │           │           │
    └───────────┴───────────┴───────────┴───────────┘
                              │
                        ┌─────▼─────┐
                        │ LIBERACIÓN│
                        │           │
                        └───────────┘
```

### Agentes Implementados

1. **Coordinador de Aprendizaje**
   - Organiza tareas de entrenamiento, evaluación y optimización
   - Detecta cuándo existen suficientes correcciones verificadas
   - Selecciona el agente adecuado y evita trabajos duplicados
   - Gestiona prioridades, presupuestos de recursos, cancelación y recuperación

2. **Agente de Datos y Evidencias**
   - Prepara ejemplos de entrenamiento a partir de correcciones aprobadas
   - Comprueba procedencia, integridad, alineación temporal y etiquetas
   - Mantiene conjuntos separados de entrenamiento, validación y prueba
   - Vincula cada ejemplo con su versión de la matriz de conversión

3. **Agente de Entrenamiento**
   - Ejecuta experimentos reproducibles sobre modelos o componentes
   - Registra conjunto de datos, configuración, versión inicial y resultados
   - Genera candidatos independientes del modelo operativo
   - Conserva puntos de recuperación y detiene entrenamientos fallidos

4. **Agente de Calidad Musical**
   - Evalúa fidelidad respecto a referencias revisadas
   - Comprueba alturas, octavas, ataques, finales, duraciones, ritmo
   - Examina clusters, acordes falsos, notas sucesivas agrupadas
   - Su evaluación se apoya en comparaciones y pruebas deterministas

5. **Agente de Rendimiento**
   - Mide tiempos, memoria, carga de modelos y reutilización de resultados
   - Identifica operaciones repetidas y puntos que concentran el tiempo
   - Propone caché, procesamiento selectivo y mejores configuraciones
   - Incluye el coste de coordinación de los propios agentes

6. **Agente de Regresión y Compatibilidad**
   - Comprueba que las nuevas capacidades preservan el funcionamiento anterior
   - Verifica importación, edición, matriz, colores, reproducción, guardado
   - Ejecuta casos musicales representativos
   - Bloquea la promoción de candidatos que rompan funciones

7. **Agente de Liberación y Recuperación**
   - Recibe resultados de entrenamiento, calidad, rendimiento y regresión
   - Aplica criterios de aceptación definidos antes de evaluar
   - Promueve únicamente versiones que superen los controles
   - Registra la versión anterior y permite reversión comprobable

### Estado de Agentes

```typescript
interface ContinuousImprovementState {
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
```

---

## 🎛️ Sistema de Capacidades

### Concepto

Las 36 mejoras están organizadas en 5 grupos y pueden activarse/desactivarse independientemente.

### Grupos de Capacidades

#### 1. Protección (5)
- `contracts` — Contratos entre módulos
- `reference_projects` — Proyectos de referencia
- `comparative_execution` — Ejecución comparativa
- `atomic_changes` — Cambios atómicos
- `dependency_versions` — Versiones de dependencias

#### 2. Velocidad (9)
- `cost_profiling` — Perfil de coste por etapa
- `content_cache` — Caché por contenido
- `dependency_map` — Mapa de dependencias
- `session_reuse` — Reutilización de sesiones
- `concurrency_control` — Control de concurrencia
- `inference_optimization` — Optimización de inferencia
- `numeric_precision` — Precisión numérica reducida
- `ui_separation` — UI independiente del cálculo
- `hardware_acceleration` — Aceleración por hardware

#### 3. Fidelidad Musical (9)
- `attack_continuity` — Análisis de ataque y continuidad
- `resonance_pedal` — Resonancia y pedal
- `basic_pitch` — Basic Pitch
- `beat_detection` — Detección de pulso
- `source_sync` — Sincronización de fuentes
- `fragmentation_detector` — Detector de fragmentación
- `voice_identity` — Identidad de voz estable
- `metric_hypotheses` — Hipótesis de métrica
- `musical_diff_report` — Informe de diferencias musicales

#### 4. Aprendizaje (8)
- `informative_examples` — Ejemplos informativos
- `label_quality` — Calidad de etiquetas
- `scoped_rules` — Reglas con ámbito
- `engine_selector_learning` — Aprendizaje del selector
- `distillation` — Destilación de modelos
- `confidence_calibration` — Calibración de confianza
- `event_driven_agents` — Agentes por eventos
- `independent_evaluation` — Evaluación independiente

#### 5. Edición y Exportación (5)
- `selective_rendering` — Renderizado selectivo
- `roundtrip_test` — Prueba de ida y vuelta
- `project_portability` — Portabilidad del proyecto
- `recovery_points` — Puntos de recuperación

### Implementación de Capacidades

```typescript
interface Capability {
  id: CapabilityId;
  name: string;
  description: string;
  group: 'protection' | 'speed' | 'fidelity' | 'learning' | 'export';
  enabled: boolean;
  experimental: boolean;
  requiresRestart: boolean;
  dependencies: CapabilityId[];
}
```

### Validación de Dependencias

El sistema valida automáticamente las dependencias antes de activar una capacidad:

```typescript
function toggleCapability(id: CapabilityId) {
  const cap = capabilities[id];
  if (!cap.enabled) {
    // Verificar dependencias
    const missingDeps = cap.dependencies.filter(dep => !capabilities[dep].enabled);
    if (missingDeps.length > 0) {
      throw new Error(`Missing dependencies: ${missingDeps.join(', ')}`);
    }
  }
  capabilities[id].enabled = !cap.enabled;
}
```

---

## 🎨 Componentes de Interfaz

### Layout Principal

```
┌─────────────────────────────────────────────────────────┐
│                      TOPBAR                             │
│  Logo | Proyecto | Importar | Reproducir | Exportar     │
├─────────────────────────────────────────────────────────┤
│                 CODE NAVIGATION                         │
│  Lavadora | Tapiz | Imanes | ... | Ciclo               │
├──────────┬──────────────────────────────────┬───────────┤
│          │                                  │           │
│ SOURCES  │        CENTRAL CANVAS            │ INSPECTOR │
│  PANEL   │      (Tapiz Sonoro)              │  PANEL    │
│          │                                  │           │
│ (280px)  │         (flex-1)                 │ (340px)   │
│          │                                  │           │
├──────────┴──────────────────────────────────┴───────────┤
│                    SCORE PANEL                          │
│              (Partitura sincronizada)                   │
│                    (220px)                              │
└─────────────────────────────────────────────────────────┘
```

### Componentes Principales

1. **TopBar** — Controles globales (proyecto, importación, reproducción, exportación)
2. **CodeNavigation** — Navegación por las 9 funciones del códice
3. **SourcesPanel** — Gestión de fuentes/instrumentos
4. **CentralCanvas** — Tapiz sonoro con 4 modos de visualización
5. **ScorePanel** — Partitura sincronizada
6. **InspectorPanel** — Inspector contextual (propiedades, incidencias, asistente)

---

## 🔄 Flujo de Datos

### Importación y Análisis

```
1. Usuario importa audio
   ↓
2. AudioImport decodifica con Web Audio API
   ↓
3. Se genera AudioBuffer y se almacena en estado
   ↓
4. Se ejecuta diagnóstico (RMS, pico, rango dinámico)
   ↓
5. Se inicializan compases según tempo estimado
```

### Detección de Notas

```
1. Usuario pulsa "Detectar Notas" en PianoRoll
   ↓
2. Se procesa el AudioBuffer frame a frame
   ↓
3. Se calcula energía por frame (onset detection)
   ↓
4. Se estima frecuencia por autocorrelación
   ↓
5. Se crean MusicalEvent con toda la información
   ↓
6. Se actualiza la matriz central
```

### Corrección y Exportación

```
1. Usuario revisa incidencias en CorrectionPanel
   ↓
2. Se aplican correcciones (cambios atómicos)
   ↓
3. Se actualiza el historial del evento
   ↓
4. Se invalidan resultados dependientes
   ↓
5. Se regenera partitura desde matriz actualizada
   ↓
6. Se exporta a MIDI/MusicXML/PDF
```

---

## 💾 Persistencia y Caché

### Caché por Contenido

```typescript
class ContentCache {
  private cache = new Map<string, CacheEntry>();
  
  computeKey(audioHash: string, engineVersion: string, params: any): string {
    // Hash determinista basado en contenido + parámetros + versión
  }
  
  get(key: string): any | null {
    // Recuperar resultado cacheado
  }
  
  set(key: string, data: any, sizeBytes: number) {
    // Almacenar con control de tamaño máximo
  }
  
  invalidate(audioHash: string) {
    // Invalidar caché cuando cambia el audio
  }
}
```

### Puntos de Recuperación

```typescript
class RecoveryManager {
  savePoint(stage: string, data: any): RecoveryPoint {
    // Guardar estado completo de etapa costosa
  }
  
  getLatestPoint(stage?: string): RecoveryPoint | null {
    // Recuperar último punto válido
  }
}
```

---

## 🔌 Integraciones Externas

### Web Audio API (Navegador)

- **Uso:** Decodificación, análisis espectral, detección de notas
- **Limitaciones:** Procesamiento en hilo principal
- **Optimización:** Uso de Web Workers para tareas pesadas

### OpenAI API (Opcional)

- **Uso:** Asistente IA para instrucciones en lenguaje natural
- **Seguridad:** Llamadas desde funciones serverless de Vercel
- **Variables:** `OPENAI_API_KEY` (secreto, no expuesto al navegador)

### Supabase (Opcional)

- **Uso:** Persistencia de proyectos y colaboración
- **Variables:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- **Seguridad:** Anon key expuesta, service key en servidor

---

## 🚀 Rendimiento y Optimización

### Estrategias Implementadas

1. **Renderizado selectivo** — Solo se renderizan regiones visibles
2. **Caché por contenido** — Evita repetir análisis idénticos
3. **Control de concurrencia** — Limita tareas simultáneas
4. **UI independiente del cálculo** — Trabajo pesado fuera del hilo visual
5. **Lazy loading** — Componentes pesados se cargan bajo demanda

### Métricas de Rendimiento

```typescript
interface PerformanceSnapshot {
  timestamp: number;
  taskType: string;
  processingTimeMs: number;
  peakMemoryMB: number;
  cacheHits: number;
  cacheMisses: number;
  humanInterventions: number;
}
```

---

## 🔒 Seguridad

### Principios

1. **Secretos en servidor** — API keys nunca expuestas al navegador
2. **Variables VITE_*** — Solo valores destinados a ser públicos
3. **CORS configurado** — Requests solo desde dominios autorizados
4. **Validación de inputs** — Contratos entre módulos
5. **Auditoría de cambios** — Historial completo de modificaciones

### Checklist de Seguridad

- [ ] No hay API keys en código fuente
- [ ] Variables de entorno configuradas correctamente
- [ ] CORS configurado en Vercel
- [ ] Autenticación implementada para áreas privadas
- [ ] Logs de auditoría activados

---

## 📊 Monitoreo

### Métricas Clave

- Tiempo hasta partitura utilizable
- Errores musicales por categoría
- Revisión humana requerida
- Consumo de memoria
- Tasa de aciertos de caché
- Tiempo de procesamiento por etapa

### Herramientas

- Vercel Analytics (rendimiento web)
- Console logs (desarrollo)
- Performance API (métricas detalladas)

---

## 🔄 Mantenimiento

### Actualización de Dependencias

```bash
# Verificar dependencias desactualizadas
npm outdated

# Actualizar gradualmente
npm update [package]

# Verificar build después de cada actualización
npm run build
```

### Migraciones de Datos

1. Crear script de migración
2. Probar en entorno de staging
3. Hacer backup antes de aplicar
4. Aplicar en producción
5. Verificar integridad

---

## 📚 Recursos Adicionales

- [README.md](./README.md) — Documentación principal
- [DEPLOY.md](./DEPLOY.md) — Guía de despliegue
- [INTERFAZ.md](./INTERFAZ.md) — Diseño de interfaz
- [MEJORAS_IMPLEMENTADAS.md](./MEJORAS_IMPLEMENTADAS.md) — Detalle de mejoras

---

<div align="center">

**PRISMA SONORO** — *Cada sonido, en su lugar.*

</div>
