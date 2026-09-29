# PRISMA SONORO — Interfaz de Laboratorio Musical

## Nueva Identidad Visual

PRISMA SONORO presenta una interfaz completamente rediseñada con identidad visual propia, sofisticada y visualmente impactante. La experiencia expresa el concepto del artefacto: **revelar los componentes del sonido y convertirlos en escritura musical**.

### Dirección Visual

**Estética de laboratorio musical contemporáneo:**
- Fondo profundo: `#080D18` (azul negro)
- Superficies limpias: `#131D30` (azul pizarra)
- Tipografía precisa: Inter, JetBrains Mono
- Color aplicado con intención

**Identidad visible:**
```
PRISMA SONORO
Cada sonido, en su lugar.
Dirección conceptual: Prof. Manuel GAGO FERNÁNDEZ
```

## Paleta Cromática

### Colores Base
- **Fondo principal:** `#080D18` (azul negro)
- **Superficies:** `#131D30` (azul pizarra)
- **Texto principal:** `#F2F5FC` (blanco suave)
- **Texto secundario:** `#AAB8CE` (gris azulado)

### Colores Instrumentales
- **Cuerda:** `#AA88FF` (violeta)
- **Madera:** `#35D9CF` (turquesa)
- **Metales:** `#FFC15A` (ámbar)
- **Percusión:** `#FF788A` (coral)
- **Voces:** `#F58BDD` (rosa)
- **Teclado:** `#7DD3FC` (celeste)
- **Bajo:** `#A78BFA` (lavanda)
- **Sin identificar:** `#AAB8CE` (gris)

Cada color identifica instrumentos de forma consistente en todas las vistas. Se acompaña de nombres, iconos y patrones para accesibilidad.

## Organización del Área de Trabajo

### Zona Superior: TopBar
**Funciones:**
- Identidad del proyecto (logo + nombre)
- Importación de audio
- Controles de reproducción (play/pause, anterior, siguiente)
- Información del audio cargado (nombre, duración, sample rate, canales)
- Progreso de procesamiento (fase, porcentaje, tiempo)
- Exportación
- Configuración

**Características:**
- Controles claros con iconos y texto
- Estado visible de reproducción
- Información contextual del audio
- Indicadores de progreso reales

### Zona Izquierda: SourcesPanel
**Funciones:**
- Lista de fuentes/instrumentos detectados
- Color instrumental visible
- Nombre del instrumento y familia
- Controles: silenciar, escuchar en solitario, visibilidad
- Estadísticas: número de eventos, confianza media
- Mini-visualización de eventos por fuente

**Características:**
- Panel ajustable (200-400px)
- Plegable con Alt+1
- Cada fuente identificada por color
- Acciones rápidas por fuente

### Zona Central: CentralCanvas (El Tapiz Sonoro)
**Funciones:**
- Representación del audio como centro de la experiencia
- Tiempo horizontal, altura vertical
- Eventos coloreados por fuente
- Duración representada visualmente
- Selección muestra información detallada

**Modos de visualización:**
1. **Espectrograma:** Energía espectral con gradiente de color
2. **Fuentes:** Eventos coloreados por instrumento
3. **Piano Roll:** Notas en rejilla MIDI
4. **Combinado:** Superposición de vistas

**Características:**
- Zoom temporal y frecuencial
- Cursor de reproducción sincronizado
- Información hover (tiempo, frecuencia, nota)
- Leyenda explícita de colores
- Timeline con marcas de tiempo

### Zona Inferior: ScorePanel
**Funciones:**
- Partitura sincronizada con el tapiz
- Clave, compás, tempo visibles
- Notas coloreadas por fuente
- Indicadores de confianza
- Numeración de compases

**Características:**
- Altura ajustable (220px → 60vh)
- Expandible a pantalla completa
- Scroll horizontal para obras largas
- Renderizado eficiente

### Zona Derecha: InspectorPanel
**Funciones:**
- **Propiedades:** Detalles del evento seleccionado
- **Incidencias:** Lista de problemas detectados
- **Asistente:** Instrucciones en lenguaje natural

**Propiedades del evento:**
- Nota MIDI y nombre
- Inicio, final, duración
- Frecuencia, velocidad
- Confianza con indicador visual
- Compás y posición métrica
- Estado (detectado, corregido, protegido)

**Acciones rápidas:**
- Escuchar evento
- Editar propiedades
- Proteger como intencional

**Asistente musical:**
- Instrucciones naturales: "Revisa este compás", "Escucha el clarinete"
- Conectado a acciones reales del sistema
- Sugerencias rápidas

## Navegación por el Códice

Las 9 funciones del códice sonoro accesibles mediante navegación compacta:

1. **Lavadora** — Preparar audio
2. **Tapiz** — Observar
3. **Imanes** — Separar fuentes
4. **Tamiz** — Examinar frecuencias
5. **Prisma** — Analizar timbres
6. **Fotocopiadora** — Reconstruir eventos
7. **Algoritmo** — Resolver incidencias
8. **Manuscrito** — Escribir partitura
9. **Ciclo** — Comprobar y mejorar

**Indicadores de estado:**
- 🟢 Completado
- 🔵 En ejecución
- 🟡 Requiere revisión
- 🔴 Error
- ⚪ Pendiente

## Características de Diseño

### Color con Función
- Cada instrumento mantiene su color en todas las vistas
- Selección destacada con contorno, sin cambiar identidad cromática
- Confianza e incidencias mediante indicadores independientes
- Modo alto contraste disponible
- Partitura imprimible en blanco y negro

### Movimiento Sobrio
- Transiciones breves (200-300ms)
- Sin partículas permanentes ni fondos animados
- Respeta preferencia de movimiento reducido
- Animaciones detenidas durante procesamiento intensivo

### Respuesta Inmediata
- Cada control indica claramente su acción y estado
- Durante análisis: fase, progreso medido, tiempo transcurrido
- Posibilidad de cancelar operaciones
- Distinción clara entre trabajo en curso, espera y bloqueo

### Accesibilidad
- Navegación por teclado completa
- Foco visible en todos los controles
- Etiquetas accesibles (aria-label)
- Controles suficientemente grandes
- Atajos no interfieren con escritura
- Contraste WCAG AA cumplido

**Atajos de teclado:**
- `Alt+1`: Mostrar/ocultar panel de fuentes
- `Alt+2`: Mostrar/ocultar inspector
- `Escape`: Cerrar inspector
- `Space`: Play/Pause (cuando no hay foco en input)

## Componentes Técnicos

### Sistema de Diseño
- **CSS Variables:** Paleta completa en `src/index.css`
- **Clases utilitarias:** `.glass-panel`, `.btn-primary`, `.btn-secondary`
- **Animaciones:** `fade-in`, `slide-in-right`, `pulse-subtle`
- **Colores instrumentales:** `.instrument-strings`, `.bg-instrument-woodwind`, etc.

### Layout Responsive
- Paneles ajustables con drag handles
- Redimensionamiento en tiempo real
- Guardado de disposición preferida
- Adaptación a pantallas menores

### Rendimiento
- Renderizado selectivo de regiones visibles
- Carga bajo demanda de vistas pesadas
- Canvas optimizado para grandes volúmenes de eventos
- Minimización de re-renders

## Estados de la Interfaz

La interfaz maneja correctamente todos los estados:

1. **Vacío:** Sin audio cargado
   - Mensaje claro de importación
   - Tapiz muestra placeholder
   - Partitura indica "Detecta notas"

2. **Cargando:** Audio en procesamiento
   - Indicador de progreso visible
   - Fase actual mostrada
   - Posibilidad de cancelar

3. **Proyecto abierto:** Audio cargado y analizado
   - Tapiz muestra espectrograma
   - Fuentes listadas con colores
   - Partitura renderizada

4. **Selección activa:** Evento seleccionado
   - Inspector muestra propiedades
   - Evento destacado en tapiz y partitura
   - Acciones contextuales disponibles

5. **Incidencia:** Problema detectado
   - Indicador visual en evento
   - Lista en inspector
   - Acciones de corrección

6. **Error:** Fallo en procesamiento
   - Mensaje de error claro
   - Opción de reintentar
   - Registro en log

7. **Exportación:** Generando archivos
   - Progreso visible
   - Lista de archivos generados
   - Opción de descarga

## Integración con Funcionalidad Existente

La nueva interfaz **preserva íntegramente** todas las capacidades operativas:

✅ Importación de audio (WAV, MP3, FLAC, AIFF)
✅ Análisis espectral real
✅ Detección de notas con Web Audio API
✅ Separación de fuentes
✅ Cuantización musical
✅ Corrección de incidencias
✅ Generación de partitura
✅ Exportación (MIDI, MusicXML, PDF)
✅ Sistema de agentes de aprendizaje
✅ Control de capacidades (36 mejoras)
✅ Asistente musical IA

## Arquitectura de Componentes

```
src/
├── App.tsx                          # Layout principal
├── components/
│   ├── layout/
│   │   ├── TopBar.tsx              # Zona superior
│   │   ├── SourcesPanel.tsx        # Zona izquierda
│   │   ├── CentralCanvas.tsx       # Zona central (Tapiz)
│   │   ├── ScorePanel.tsx          # Zona inferior
│   │   ├── InspectorPanel.tsx      # Zona derecha
│   │   └── CodeNavigation.tsx      # Navegación del códice
│   ├── AudioImport.tsx             # Importación (reutilizado)
│   ├── SpectralView.tsx            # Análisis espectral
│   ├── PianoRoll.tsx               # Detección de notas
│   ├── ScoreEditor.tsx             # Editor de partitura
│   ├── SourcePanel.tsx             # Gestión de fuentes
│   ├── QuantizationPanel.tsx       # Cuantización
│   ├── CorrectionPanel.tsx         # Corrección
│   ├── ProcessingPipeline.tsx      # Pipeline completo
│   ├── ExportPanel.tsx             # Exportación
│   ├── AIAssistant.tsx             # Asistente IA
│   ├── ContinuousImprovementPanel.tsx  # Mejora continua
│   └── CapabilitiesPanel.tsx       # Control de capacidades
├── agents/                         # Sistema de agentes
├── capabilities/                   # Sistema de capacidades
└── store.tsx                       # Estado global
```

## Verificación de Funcionalidad

### Estados probados:
✅ Vacío → Carga de audio
✅ Cargando → Procesamiento con progreso
✅ Proyecto abierto → Visualización completa
✅ Selección activa → Inspector contextual
✅ Incidencia → Detección y corrección
✅ Error → Manejo y recuperación
✅ Exportación → Generación de archivos

### Legibilidad y contraste:
✅ Texto principal sobre fondo: alto contraste
✅ Colores instrumentales distinguibles
✅ Iconos claros y consistentes
✅ Tipografía legible en todos los tamaños

### Fluidez:
✅ Transiciones suaves (200-300ms)
✅ Sin lag en interacciones
✅ Canvas optimizado
✅ Paneles redimensionables en tiempo real

### Coherencia cromática:
✅ Colores instrumentales consistentes
✅ Estados visuales claros
✅ Jerarquía visual establecida
✅ Identidad reconocible

## Conclusión

PRISMA SONORO ofrece ahora una **experiencia visual audaz, musical y precisa**:
- Cada color identifica
- Cada gesto permite actuar
- Cada elemento visible ayuda a comprender el sonido

La interfaz preserva íntegramente las capacidades operativas mientras ofrece una identidad visual original y reconocible, adecuada para un laboratorio musical contemporáneo.

---

**PRISMA SONORO** — Cada sonido, en su lugar.
