# 🚀 Guía de Despliegue — PRISMA SONORO

Esta guía detalla el procedimiento completo para publicar PRISMA SONORO en GitHub y desplegarlo en Vercel, preservando todas las funciones, datos, integraciones y configuraciones operativas.

---

## 📋 Tabla de Contenidos

1. [Inspección Inicial](#1-inspección-inicial)
2. [Protección del Estado Actual](#2-protección-del-estado-actual)
3. [Publicación en GitHub](#3-publicación-en-github)
4. [Configuración de Vercel](#4-configuración-de-vercel)
5. [Despliegue de Vista Previa](#5-despliegue-de-vista-previa)
6. [Verificación Completa](#6-verificación-completa)
7. [Despliegue a Producción](#7-despliegue-a-producción)
8. [Recuperación y Reversión](#8-recuperación-y-reversión)
9. [Checklist Final](#9-checklist-final)

---

## 1. Inspección Inicial

### Verificar Estado del Repositorio

```bash
# Ver rama actual
git branch --show-current

# Ver cambios pendientes
git status

# Ver historial reciente
git log --oneline -10

# Ver remotos configurados
git remote -v
```

### Verificar Construcción

```bash
# Instalar dependencias
npm install

# Verificar tipos
npm run typecheck

# Construir para producción
npm run build

# Verificar que dist/ se genera correctamente
ls -la dist/
```

### Identificar Componentes

**Funcionan en navegador:**
- ✅ Interfaz completa
- ✅ Importación de audio
- ✅ Análisis espectral (Web Audio API)
- ✅ Detección de notas
- ✅ Generación de partitura
- ✅ Exportación de archivos

**Requieren servidor (opcional):**
- ⚠️ Asistente IA (OpenAI API)
- ⚠️ Almacenamiento persistente (Supabase)
- ⚠️ Modelos ML pesados (servicio separado)

---

## 2. Protección del Estado Actual

### Crear Punto de Recuperación

```bash
# Asegurarse de estar en rama principal
git checkout main

# Crear rama para preparación de despliegue
git checkout -b prepare-deployment

# Commit de estado actual
git add .
git commit -m "chore: prepare for GitHub and Vercel deployment"

# Crear etiqueta de respaldo
git tag -a v1.0.0-pre-deploy -m "Pre-deployment backup"
```

### Verificar Integridad

```bash
# Verificar que el build funciona
npm run build

# Verificar que no hay errores de tipos
npm run typecheck

# Verificar que dist/ contiene los archivos esperados
ls dist/
# Debe mostrar: index.html, assets/
```

---

## 3. Publicación en GitHub

### Crear Repositorio

1. Ve a https://github.com/new
2. Nombre: `prisma-sonoro`
3. **Visibilidad:** Privado (recomendado) o Público (según preferencia)
4. **NO** inicializar con README, .gitignore o licencia (ya existen)
5. Click en "Create repository"

### Conectar Repositorio Local

```bash
# Añadir remoto (reemplaza [usuario] con tu nombre de usuario)
git remote add origin https://github.com/[usuario]/prisma-sonoro.git

# Verificar remoto
git remote -v

# Push inicial
git push -u origin prepare-deployment
```

### Crear Pull Request

1. Ve a https://github.com/[usuario]/prisma-sonoro/pulls
2. Click en "New pull request"
3. Base: `main` ← Compare: `prepare-deployment`
4. Título: "Preparación para despliegue en Vercel"
5. Descripción:
   ```
   ## Cambios
   - Configuración para Vercel
   - Documentación completa
   - Archivos de exclusión (.gitignore)
   - Variables de entorno de ejemplo
   
   ## Verificaciones
   - [x] Build funciona correctamente
   - [x] Typecheck sin errores
   - [x] Documentación actualizada
   ```
6. Click en "Create pull request"

### Revisar y Fusionar

1. Revisar los cambios en el PR
2. Esperar revisiones (si aplica)
3. Fusionar con "Squash and merge" o "Create a merge commit"
4. Eliminar rama `prepare-deployment` después de fusionar

---

## 4. Configuración de Vercel

### Conectar GitHub a Vercel

1. Ve a https://vercel.com/new
2. Importar repositorio `prisma-sonoro`
3. Framework Preset: **Vite** (detectado automáticamente)
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Install Command: `npm install`

### Configurar Variables de Entorno

En Vercel Dashboard → Settings → Environment Variables:

**Development:**
```
VITE_APP_ENV=development
VITE_APP_URL=http://localhost:5173
```

**Preview:**
```
VITE_APP_ENV=preview
VITE_APP_URL=[URL de vista previa]
```

**Production:**
```
VITE_APP_ENV=production
VITE_APP_URL=[URL de producción]
```

**Secretos (solo servidor):**
```
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://...
SUPABASE_SERVICE_KEY=...
```

### Configurar Dominio (Opcional)

1. Vercel Dashboard → Settings → Domains
2. Añadir dominio personalizado si aplica
3. Configurar DNS según instrucciones de Vercel

---

## 5. Despliegue de Vista Previa

### Desplegar desde CLI (Alternativa)

```bash
# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login

# Desplegar vista previa
vercel

# Seguir las instrucciones interactivas
```

### Desplegar desde GitHub

1. Push a rama `main` o crea una rama de características
2. Vercel desplegará automáticamente una vista previa
3. La URL aparecerá en:
   - GitHub PR (comentario de Vercel)
   - Vercel Dashboard → Deployments

### Verificar Vista Previa

Accede a la URL de vista previa y verifica:

```bash
# URL típica: https://prisma-sonoro-[hash].vercel.app
```

---

## 6. Verificación Completa

### Checklist de Funcionalidad

**Interfaz y Navegación:**
- [ ] La aplicación carga sin errores
- [ ] La interfaz se muestra correctamente
- [ ] Los paneles son ajustables
- [ ] La navegación del códice funciona
- [ ] Los atajos de teclado funcionan (Alt+1, Alt+2, Escape)

**Importación de Audio:**
- [ ] Se puede importar un archivo WAV
- [ ] Se puede importar un archivo MP3
- [ ] El diagnóstico muestra información correcta
- [ ] La forma de onda se visualiza

**Análisis y Detección:**
- [ ] El espectrograma se renderiza
- [ ] La detección de notas funciona
- [ ] Los eventos aparecen en el piano roll
- [ ] Los colores instrumentales son consistentes

**Edición y Corrección:**
- [ ] Se pueden seleccionar eventos
- [ ] El inspector muestra propiedades
- [ ] Se pueden corregir incidencias
- [ ] El historial de cambios funciona

**Partitura y Exportación:**
- [ ] La partitura se genera correctamente
- [ ] Se puede expandir/contraer
- [ ] La exportación MIDI funciona
- [ ] La exportación MusicXML funciona
- [ ] La exportación PDF funciona

**Sistema de Agentes:**
- [ ] El panel de mejora continua se abre
- [ ] Los agentes se muestran correctamente
- [ ] Se pueden crear ejemplos de corrección
- [ ] Los experimentos se ejecutan

**Capacidades:**
- [ ] El panel de capacidades se abre
- [ ] Se pueden activar/desactivar capacidades
- [ ] Las dependencias se validan
- [ ] Los cambios se aplican correctamente

### Verificar Consola del Navegador

```javascript
// Abrir DevTools (F12) → Console
// No debe haber errores críticos
// Advertencias son aceptables si están documentadas
```

### Verificar Red

```javascript
// DevTools → Network
// Todos los recursos deben cargar (200 OK)
// No debe haber requests a URLs con secretos
```

### Verificar Ausencia de Secretos

```bash
# En la vista previa, inspeccionar el código fuente
# No debe haber API keys expuestas
# Solo variables VITE_* públicas deben estar presentes
```

---

## 7. Despliegue a Producción

### Preparar para Producción

```bash
# Asegurarse de estar en main
git checkout main

# Pull de últimos cambios
git pull origin main

# Verificar build
npm run build

# Commit si hay cambios
git add .
git commit -m "release: prepare for production deployment"
git push origin main
```

### Desplegar a Producción

**Opción A: Automático (recomendado)**
- Vercel despliega automáticamente al hacer push a `main`
- Verificar en Vercel Dashboard → Deployments

**Opción B: Manual desde CLI**
```bash
# Desplegar a producción
vercel --prod
```

### Verificar Producción

1. Accede a la URL de producción
2. Repetir el checklist de verificación completa
3. Verificar que todo funciona como en vista previa
4. Probar con audio real si es posible

### Crear Release en GitHub

```bash
# Crear etiqueta de versión
git tag -a v1.0.0 -m "Release v1.0.0 - Initial production deployment"
git push origin v1.0.0

# Crear release en GitHub
# https://github.com/[usuario]/prisma-sonoro/releases/new
```

---

## 8. Recuperación y Reversión

### Revertir Despliegue en Vercel

1. Vercel Dashboard → Deployments
2. Buscar el despliegue estable anterior
3. Click en "..." → "Promote to Production"
4. Confirmar la promoción

### Revertir Código en GitHub

```bash
# Identificar commit estable
git log --oneline

# Crear rama de hotfix
git checkout -b hotfix/revert-issue

# Revertir commit problemático
git revert [commit-hash]

# Push y crear PR
git push origin hotfix/revert-issue
```

### Recuperación de Datos

**Importante:** Revertir código NO revierte cambios en base de datos.

Si hay migraciones de base de datos:
1. Identificar el estado anterior
2. Crear script de reversión manual
3. Ejecutar en entorno de staging primero
4. Aplicar en producción con precaución

---

## 9. Checklist Final

### Documentación

- [ ] README.md actualizado
- [ ] DEPLOY.md completo
- [ ] ARCHITECTURE.md documentado
- [ ] INTERFAZ.md documentado
- [ ] MEJORAS_IMPLEMENTADAS.md actualizado
- [ ] .env.example con todas las variables

### Configuración

- [ ] vercel.json configurado
- [ ] .gitignore completo
- [ ] Variables de entorno configuradas en Vercel
- [ ] Dominio configurado (si aplica)

### Verificación

- [ ] Build funciona sin errores
- [ ] Typecheck sin errores
- [ ] Vista previa funciona correctamente
- [ ] Producción funciona correctamente
- [ ] No hay secretos expuestos en el navegador
- [ ] Todos los recursos cargan correctamente

### Entrega Final

Proporcionar:

```
✅ URL del repositorio GitHub:
   https://github.com/[usuario]/prisma-sonoro

✅ URL de vista previa:
   https://prisma-sonoro-[hash].vercel.app

✅ URL de producción:
   https://prisma-sonoro.vercel.app (o dominio personalizado)

✅ Rama desplegada:
   main

✅ Commit desplegado:
   [commit-hash]

✅ Resultados de comprobaciones:
   - Build: ✅ Exitoso
   - Typecheck: ✅ Sin errores
   - Vista previa: ✅ Funcional
   - Producción: ✅ Funcional

✅ Servicios externos utilizados:
   - Vercel (hosting)
   - GitHub (repositorio)
   - OpenAI (opcional, asistente IA)
   - Supabase (opcional, persistencia)

✅ Funciones operativas:
   - Importación de audio
   - Análisis espectral
   - Detección de notas
   - Separación de fuentes
   - Cuantización musical
   - Generación de partitura
   - Exportación (MIDI, MusicXML, PDF)
   - Sistema de agentes
   - 36 mejoras controladas
   - Asistente IA

✅ Bloqueos pendientes:
   - Ninguno (o listar si existen)

✅ Procedimiento de reversión:
   1. Vercel Dashboard → Deployments
   2. Promover despliegue estable anterior
   3. O revertir código con git revert
```

---

## 📞 Soporte

Si encuentras problemas durante el despliegue:

1. Revisa los logs en Vercel Dashboard
2. Verifica las variables de entorno
3. Comprueba que el build funciona localmente
4. Revisa la documentación de Vercel: https://vercel.com/docs

---

<div align="center">

**PRISMA SONORO** — *Cada sonido, en su lugar.*

</div>
