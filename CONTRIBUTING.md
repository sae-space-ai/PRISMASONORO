# 🤝 Guía de Contribución — PRISMA SONORO

Gracias por tu interés en contribuir a PRISMA SONORO. Este documento te guiará en el proceso de contribución.

---

## 📋 Tabla de Contenidos

1. [Código de Conducta](#código-de-conducta)
2. [Cómo Contribuir](#cómo-contribuir)
3. [Configuración del Entorno de Desarrollo](#configuración-del-entorno-de-desarrollo)
4. [Estándares de Código](#estándares-de-código)
5. [Proceso de Pull Request](#proceso-de-pull-request)
6. [Reportar Bugs](#reportar-bugs)
7. [Sugerir Mejoras](#sugerir-mejoras)

---

## 📜 Código de Conducta

Este proyecto se rige por un código de conducta básico:

- **Respeto** — Trata a todos los colaboradores con respeto
- **Constructividad** — Las críticas deben ser constructivas
- **Inclusión** — Bienvenidas todas las perspectivas y experiencias
- **Profesionalismo** — Mantén un ambiente profesional y acogedor

---

## 🎯 Cómo Contribuir

### Tipos de Contribuciones

1. **Corrección de bugs** — Arreglar errores en el código
2. **Nuevas funcionalidades** — Implementar características nuevas
3. **Documentación** — Mejorar o traducir documentación
4. **Pruebas** — Añadir tests o mejorar cobertura
5. **Optimización** — Mejorar rendimiento o eficiencia
6. **Diseño** — Mejoras en la interfaz o experiencia de usuario

### Antes de Contribuir

1. **Busca issues existentes** — Evita duplicar trabajo
2. **Comenta en el issue** — Indica que vas a trabajar en ello
3. **Discute cambios grandes** — Abre un issue primero para discutir
4. **Lee la documentación** — Familiarízate con la arquitectura

---

## 🛠️ Configuración del Entorno de Desarrollo

### Requisitos

- Node.js 18+
- npm 9+
- Git
- Editor de código (VS Code recomendado)

### Pasos

```bash
# 1. Fork el repositorio en GitHub

# 2. Clona tu fork
git clone https://github.com/[tu-usuario]/prisma-sonoro.git
cd prisma-sonoro

# 3. Añade el repositorio original como upstream
git remote add upstream https://github.com/[usuario-original]/prisma-sonoro.git

# 4. Instala dependencias
npm install

# 5. Crea una rama para tu trabajo
git checkout -b feature/nombre-de-tu-caracteristica

# 6. Inicia el servidor de desarrollo
npm run dev

# 7. Abre http://localhost:5173 en tu navegador
```

### Estructura del Proyecto

```
src/
├── App.tsx                    # Layout principal
├── store.tsx                  # Estado global
├── types.ts                   # Tipos TypeScript
├── agents/                    # Sistema de agentes
├── capabilities/              # Sistema de capacidades
└── components/
    ├── layout/                # Componentes de layout
    └── [otros componentes]    # Componentes funcionales
```

---

## 📝 Estándares de Código

### TypeScript

- Usa TypeScript estricto
- Define tipos explícitos para funciones y componentes
- Evita `any` cuando sea posible
- Usa interfaces para estructuras de datos

```typescript
// ✅ Correcto
interface MusicalEvent {
  id: string;
  midiNote: number;
  confidence: number;
}

function processEvent(event: MusicalEvent): void {
  // ...
}

// ❌ Incorrecto
function processEvent(event: any): any {
  // ...
}
```

### React

- Usa componentes funcionales con hooks
- Separa lógica de presentación cuando sea posible
- Usa `useCallback` y `useMemo` para optimización
- Nombra componentes con PascalCase

```typescript
// ✅ Correcto
export function EventCard({ event }: { event: MusicalEvent }) {
  const handleClick = useCallback(() => {
    // ...
  }, [event]);

  return <div onClick={handleClick}>...</div>;
}

// ❌ Incorrecto
export default function eventCard(props) {
  return <div onClick={() => {}}>...</div>;
}
```

### Estilos

- Usa Tailwind CSS para estilos
- Sigue la paleta de colores definida en `src/index.css`
- Usa las clases utilitarias del sistema de diseño
- Mantén consistencia visual

```typescript
// ✅ Correcto
<div className="glass-panel p-4">
  <h3 className="text-sm font-semibold text-prisma-text">
    Título
  </h3>
</div>

// ❌ Incorrecto
<div style={{ background: '#131D30', padding: '16px' }}>
  <h3 style={{ fontSize: '14px', color: '#F2F5FC' }}>
    Título
  </h3>
</div>
```

### Nombres

- **Componentes:** PascalCase (`EventCard`, `SourcesPanel`)
- **Funciones:** camelCase (`processEvent`, `calculateConfidence`)
- **Constantes:** UPPER_SNAKE_CASE (`MAX_BUFFER_SIZE`)
- **Tipos:** PascalCase (`MusicalEvent`, `ProjectState`)
- **Archivos:** PascalCase para componentes, camelCase para utilidades

### Commits

Sigue la convención de commits semánticos:

```
<tipo>[ámbito opcional]: <descripción>

[cuerpo opcional]

[pie opcional]
```

**Tipos:**
- `feat`: Nueva característica
- `fix`: Corrección de bug
- `docs`: Cambios en documentación
- `style`: Cambios de formato (sin afectar lógica)
- `refactor`: Refactorización de código
- `perf`: Mejoras de rendimiento
- `test`: Añadir o corregir tests
- `chore`: Cambios en build, dependencias, etc.

**Ejemplos:**

```bash
feat(piano-roll): add note selection with keyboard shortcuts

fix(spectral-view): fix frequency calculation for high pitches

docs(readme): update installation instructions

refactor(agents): extract common logic to utility functions

perf(cache): implement LRU eviction policy
```

---

## 🔀 Proceso de Pull Request

### 1. Mantén tu rama actualizada

```bash
# Actualiza tu rama main local
git checkout main
git pull upstream main

# Rebase tu rama de trabajo
git checkout feature/tu-caracteristica
git rebase main
```

### 2. Verifica tu código

```bash
# Verificación de tipos
npm run typecheck

# Construcción
npm run build

# Prueba manualmente en el navegador
npm run dev
```

### 3. Haz commit de tus cambios

```bash
# Añade archivos modificados
git add .

# Commit con mensaje descriptivo
git commit -m "feat(component): add new feature"

# Push a tu fork
git push origin feature/tu-caracteristica
```

### 4. Crea el Pull Request

1. Ve a tu fork en GitHub
2. Click en "Compare & pull request"
3. Completa la plantilla:

```markdown
## Descripción
Describe brevemente los cambios realizados.

## Tipo de cambio
- [ ] Bug fix (cambio que arregla un issue)
- [ ] Nueva característica (cambio que añade funcionalidad)
- [ ] Breaking change (cambio que modifica API existente)
- [ ] Documentación

## Issue relacionado
Closes #[número del issue]

## Checklist
- [ ] Mi código sigue los estándares del proyecto
- [ ] He comentado mi código en áreas complejas
- [ ] He actualizado la documentación correspondiente
- [ ] Mis cambios no generan nuevos warnings
- [ ] He añadido tests para mi código (si aplica)
- [ ] Los tests existentes pasan correctamente
- [ ] He verificado que el build funciona

## Capturas de pantalla (si aplica)
Añade capturas si hay cambios visuales.

## Información adicional
Cualquier contexto adicional sobre el PR.
```

### 5. Espera revisión

- Los mantenedores revisarán tu PR
- Pueden solicitar cambios
- Responde a los comentarios y actualiza si es necesario
- Una vez aprobado, se fusionará

---

## 🐛 Reportar Bugs

### Antes de Reportar

1. **Busca en issues** — Verifica que no exista ya
2. **Prueba la última versión** — El bug puede estar ya corregido
3. **Reproduce el problema** — Asegúrate de poder reproducirlo consistentemente

### Cómo Reportar

Abre un issue en GitHub con la siguiente información:

```markdown
## Descripción del bug
Descripción clara y concisa del bug.

## Pasos para reproducir
1. Ir a '...'
2. Click en '....'
3. Scroll hasta '....'
4. Ver error

## Comportamiento esperado
Descripción de lo que debería ocurrir.

## Comportamiento actual
Descripción de lo que ocurre realmente.

## Capturas de pantalla
Si aplica, añade capturas.

## Entorno
- SO: [ej. macOS 13.0, Windows 11, Ubuntu 22.04]
- Navegador: [ej. Chrome 120, Firefox 121, Safari 17]
- Versión: [ej. 1.0.0]

## Contexto adicional
Cualquier otra información relevante.

## Logs
Si hay errores en la consola, inclúyelos aquí.
```

---

## 💡 Sugerir Mejoras

### Ideas de Características

1. Abre un issue con la etiqueta `enhancement`
2. Describe la mejora propuesta
3. Explica el caso de uso y beneficios
4. Si es posible, proporciona ejemplos o mockups

### Discusión

- Las características grandes deben discutirse antes de implementar
- Los mantenedores evaluarán la viabilidad y prioridad
- No todas las sugerencias serán implementadas inmediatamente

---

## 🧪 Pruebas

### Ejecutar Tests

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests en modo watch
npm run test:watch

# Generar reporte de cobertura
npm run test:coverage
```

### Escribir Tests

- Usa Jest y React Testing Library
- Nombra los tests de forma descriptiva
- Prueba casos edge y errores
- Mantén los tests independientes

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { EventCard } from './EventCard';

describe('EventCard', () => {
  it('renders event information correctly', () => {
    const event = { id: '1', midiNote: 60, confidence: 0.8 };
    render(<EventCard event={event} />);
    
    expect(screen.getByText('60')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    const event = { id: '1', midiNote: 60, confidence: 0.8 };
    render(<EventCard event={event} onClick={handleClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

---

## 📚 Documentación

### Actualizar Documentación

Si tu cambio afecta la documentación:

1. Actualiza los archivos relevantes (README.md, ARCHITECTURE.md, etc.)
2. Verifica que los ejemplos de código funcionen
3. Añade comentarios en el código si es necesario
4. Actualiza los JSDoc/TSDoc de funciones públicas

### Traducciones

Las traducciones son bienvenidas:

1. Copia el archivo original
2. Añade el sufijo de idioma (ej. `README.es.md`)
3. Mantén la estructura y formato
4. Añade enlace al archivo original

---

## 🎓 Recursos de Aprendizaje

### Documentación del Proyecto

- [README.md](./README.md) — Introducción y guía rápida
- [ARCHITECTURE.md](./ARCHITECTURE.md) — Arquitectura técnica
- [INTERFAZ.md](./INTERFAZ.md) — Diseño de interfaz
- [DEPLOY.md](./DEPLOY.md) — Guía de despliegue

### Tecnologías Utilizadas

- [React](https://react.dev/) — Biblioteca de UI
- [TypeScript](https://www.typescriptlang.org/) — Tipado estático
- [Vite](https://vitejs.dev/) — Build tool
- [Tailwind CSS](https://tailwindcss.com/) — Framework CSS
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) — Procesamiento de audio

---

## ❓ Preguntas

Si tienes preguntas:

1. Revisa la documentación existente
2. Busca en issues cerrados
3. Abre un nuevo issue con la etiqueta `question`

---

## 🙏 Reconocimientos

Todos los contribuidores serán reconocidos en el proyecto. ¡Gracias por ayudar a mejorar PRISMA SONORO!

---

<div align="center">

**PRISMA SONORO** — *Cada sonido, en su lugar.*

</div>
