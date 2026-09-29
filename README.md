# 🎼 PRISMA SONORO

**Transcripción musical de audio a partitura y MIDI con análisis espectral, separación de fuentes, identificación instrumental, matriz cromática, cuantización y corrección asistida por IA.**

> *Cada sonido, en su lugar.*

**Dirección conceptual:** Prof. Manuel GAGO FERNÁNDEZ

---

## 📋 Descripción

PRISMA SONORO es un sistema de transcripción musical que reconstruye partituras completas, editables y fieles a la interpretación original a partir de grabaciones de audio. Su arquitectura conecta análisis acústico, separación de fuentes, identificación instrumental, representación cromática, reconstrucción rítmica, cuantización, corrección e inteligencia artificial mediante una matriz central de conversión.

### Características Principales

- ✅ **Análisis espectral real** con Web Audio API
- ✅ **Detección de notas** mediante autocorrelación y análisis de onsets
- ✅ **Separación de fuentes** por afinidad tímbrica
- ✅ **Cuantización musical** con rejilla de 16 semicorcheas por compás
- ✅ **Generación de partitura** con notación profesional
- ✅ **Exportación múltiple** (MIDI, MusicXML, PDF)
- ✅ **Sistema de agentes** para aprendizaje continuo
- ✅ **36 mejoras controladas** con interruptores independientes
- ✅ **Interfaz de laboratorio musical** con identidad visual propia

---

## 🚀 Inicio Rápido

### Requisitos

- Node.js 18+ 
- npm 9+
- Navegador moderno con soporte para Web Audio API

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/[usuario]/prisma-sonoro.git
cd prisma-sonoro

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Construir para producción
npm run build

# Vista previa de producción
npm run preview
```

### Uso

1. Abre la aplicación en tu navegador (por defecto: http://localhost:5173)
2. Importa un archivo de audio (WAV, MP3, FLAC, AIFF)
3. Navega por las 9 funciones del códice sonoro
4. Detecta notas, corrige incidencias, exporta partitura

---

## 🏗️ Arquitectura

### Estructura del Proyecto

```
prisma-sonoro/
├── src/
│   ├── App.tsx                          # Layout principal
│   ├── store.tsx                        # Estado global (matriz central)
│   ├── types.ts                         # Tipos TypeScript
│   │
│   ├── agents/                          # Sistema de agentes de aprendizaje
│   │   ├── types.ts                     # Tipos de agentes
│   │   ├── core.ts                      # Lógica determinista
│   │   └── store.tsx                    # Estado de agentes
│   │
│   ├── capabilities/                    # Sistema de 36 mejoras controladas
│   │   ├── types.ts                     # Definición de capacidades
│   │   ├── store.tsx                    # Estado de capacidades
│   │   └── improvements.ts              # Implementaciones
│   │
│   └── components/
│       ├── layout/                      # Nueva interfaz de laboratorio
│       │   ├── TopBar.tsx               # Zona superior
│       │   ├── SourcesPanel.tsx         # Fuentes/instrumentos
│       │   ├── CentralCanvas.tsx        # Tapiz sonoro
│       │   ├── ScorePanel.tsx           # Partitura
│       │   ├── InspectorPanel.tsx       # Inspector contextual
│       │   └── CodeNavigation.tsx       # Navegación del códice
│       │
│       ├── AudioImport.tsx              # Importación y diagnóstico
│       ├── SpectralView.tsx             # Análisis espectral
│       ├── PianoRoll.tsx                # Detección de notas
│       ├── ScoreEditor.tsx              # Editor de partitura
│       ├── SourcePanel.tsx              # Gestión de fuentes
│       ├── QuantizationPanel.tsx        # Cuantización musical
│       ├── CorrectionPanel.tsx          # Corrección de incidencias
│       ├── ProcessingPipeline.tsx       # Pipeline completo
│       ├── ExportPanel.tsx              # Exportación
│       ├── AIAssistant.tsx              # Asistente IA
│       ├── ContinuousImprovementPanel.tsx # Mejora continua
│       └── CapabilitiesPanel.tsx        # Control de capacidades
│
├── index.html                           # Punto de entrada HTML
├── package.json                         # Dependencias
├── vite.config.js                       # Configuración Vite
├── tsconfig.json                        # Configuración TypeScript
└── vercel.json                          # Configuración Vercel
```

### Los 9 Conceptos del Códice Sonoro

1. **La Lavadora Musical** — Diagnóstico y preparación del audio
2. **El Tapiz Sonoro** — Representación temporal y espectral navegable
3. **Los Imanes del Timbre** — Separación y agrupación por afinidad tímbrica
4. **El Tamiz de Frecuencias** — Análisis por regiones espectrales
5. **El Prisma del Sonido** — Fundamental, armónicos y evolución tímbrica
6. **La Fotocopiadora Musical** — Conversión a eventos musicales
7. **El Algoritmo Binario** — Motor de decisiones y corrección
8. **El Manuscrito que Escribe Solo** — Generación de partitura legible
9. **El Ciclo de la Transcripción** — Análisis → corrección → validación → exportación

---

## 🎨 Sistema de Diseño

### Paleta Cromática

**Colores Base:**
- Fondo principal: `#080D18` (azul negro)
- Superficies: `#131D30` (azul pizarra)
- Texto principal: `#F2F5FC` (blanco suave)
- Texto secundario: `#AAB8CE` (gris azulado)

**Colores Instrumentales:**
- Cuerda: `#AA88FF` (violeta)
- Madera: `#35D9CF` (turquesa)
- Metales: `#FFC15A` (ámbar)
- Percusión: `#FF788A` (coral)
- Voces: `#F58BDD` (rosa)
- Teclado: `#7DD3FC` (celeste)
- Bajo: `#A78BFA` (lavanda)

### Tipografía

- **Inter** — Tipografía principal
- **JetBrains Mono** — Código y datos técnicos

---

## 🔧 Capacidades

PRISMA SONORO incluye **36 mejoras controladas** organizadas en 5 grupos:

### 1. Protección (5 mejoras)
- Contratos entre módulos
- Proyectos de referencia
- Ejecución comparativa
- Cambios atómicos
- Versiones de dependencias

### 2. Velocidad y Ligereza (9 mejoras)
- Perfil de coste por etapa
- Caché por contenido
- Mapa de dependencias
- Reutilización de sesiones
- Control de concurrencia
- Optimización de inferencia
- Precisión numérica reducida
- UI independiente del cálculo
- Aceleración por hardware

### 3. Fidelidad Musical (9 mejoras)
- Análisis de ataque y continuidad
- Resonancia y pedal
- Basic Pitch
- Detección de pulso
- Sincronización de fuentes
- Detector de fragmentación
- Identidad de voz estable
- Hipótesis de métrica
- Informe de diferencias musicales

### 4. Aprendizaje y Agentes (8 mejoras)
- Ejemplos informativos
- Calidad de etiquetas
- Reglas con ámbito
- Aprendizaje del selector
- Destilación de modelos
- Calibración de confianza
- Agentes por eventos
- Evaluación independiente

### 5. Edición y Exportación (5 mejoras)
- Renderizado selectivo
- Prueba de ida y vuelta
- Portabilidad del proyecto
- Puntos de recuperación

Cada capacidad puede activarse/desactivarse independientemente mediante el Panel de Control de Capacidades.

---

## 🤖 Sistema de Agentes

PRISMA SONORO incluye un sistema de **7 agentes especializados** para aprendizaje continuo:

1. **Coordinador de Aprendizaje** — Organiza tareas y prioriza agentes
2. **Agente de Datos y Evidencias** — Prepara ejemplos de entrenamiento
3. **Agente de Entrenamiento** — Ejecuta experimentos reproducibles
4. **Agente de Calidad Musical** — Evalúa fidelidad respecto a referencias
5. **Agente de Rendimiento** — Mide tiempos, memoria y recursos
6. **Agente de Regresión** — Verifica preservación de funciones
7. **Agente de Liberación** — Gestiona promoción de versiones

Los agentes trabajan de forma asíncrona y pueden activarse/desactivarse independientemente.

---

## 📦 Despliegue

### Vercel

PRISMA SONORO está configurado para despliegue en Vercel:

```bash
# Instalar Vercel CLI
npm install -g vercel

# Desplegar
vercel

# Desplegar a producción
vercel --prod
```

El archivo `vercel.json` incluye la configuración necesaria para el despliegue.

### Variables de Entorno

Copia `.env.example` a `.env` y configura las variables necesarias:

```bash
cp .env.example .env
```

**Nota:** Las variables de entorno marcadas como `VITE_*` se exponen al navegador. Los secretos deben mantenerse exclusivamente en el servidor.

---

## 🧪 Desarrollo

### Comandos Disponibles

```bash
# Desarrollo
npm run dev          # Servidor de desarrollo con HMR
npm run build        # Construcción de producción
npm run preview      # Vista previa de producción
npm run typecheck    # Verificación de tipos TypeScript
```

### Estructura de Ramas

- `main` — Rama principal estable
- `develop` — Rama de desarrollo
- `feature/*` — Ramas de características
- `fix/*` — Ramas de correcciones
- `release/*` — Ramas de preparación de versiones

---

## 📚 Documentación Adicional

- [INTERFAZ.md](./INTERFAZ.md) — Diseño de la interfaz de laboratorio musical
- [MEJORAS_IMPLEMENTADAS.md](./MEJORAS_IMPLEMENTADAS.md) — Detalle de las 36 mejoras
- [DEPLOY.md](./DEPLOY.md) — Guía completa de despliegue
- [ARCHITECTURE.md](./ARCHITECTURE.md) — Documentación de arquitectura técnica
- [CONTRIBUTING.md](./CONTRIBUTING.md) — Guía de contribución

---

## 🔒 Seguridad y Privacidad

- Las credenciales y secretos se mantienen exclusivamente en el servidor
- No se almacenan grabaciones de usuario en el repositorio
- Los archivos de audio se procesan localmente en el navegador
- No se envían datos a servicios externos sin consentimiento explícito

---

## 🐛 Reportar Problemas

Si encuentras un problema:

1. Busca en [Issues](https://github.com/[usuario]/prisma-sonoro/issues) si ya existe
2. Crea un nuevo issue con:
   - Descripción clara del problema
   - Pasos para reproducir
   - Comportamiento esperado vs actual
   - Capturas de pantalla si aplica
   - Información del entorno (navegador, SO, versión)

---

## 📄 Licencia

Este proyecto está bajo una licencia privada. Contacta al autor para permisos de uso.

**Autor:** Prof. Manuel GAGO FERNÁNDEZ

---

## 🙏 Agradecimientos

PRISMA SONORO es el resultado de años de investigación en transcripción musical, procesamiento de audio y notación. Agradecemos a todos los músicos, investigadores y desarrolladores que han contribuido con su conocimiento y retroalimentación.

---

## 📞 Contacto

Para consultas sobre el proyecto:

- **Dirección conceptual:** Prof. Manuel GAGO FERNÁNDEZ
- **Repositorio:** https://github.com/[usuario]/prisma-sonoro

---

<div align="center">

**PRISMA SONORO** — *Cada sonido, en su lugar.*

</div>
