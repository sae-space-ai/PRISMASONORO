import React from 'react';
import { useAppState } from '../store';
import { useCapabilities } from '../capabilities/store';

export function Dashboard() {
  const { state, dispatch } = useAppState();
  const { state: capsState } = useCapabilities();
  const enabledCaps = Object.values(capsState.capabilities).filter(c => c.enabled);
  const experimentalCaps = enabledCaps.filter(c => c.experimental);

  const stats = [
    { label: 'Eventos detectados', value: state.events.length, icon: 'fa-music', color: 'text-prisma-accent' },
    { label: 'Fuentes activas', value: state.sources.filter(s => s.active).length, icon: 'fa-layer-group', color: 'text-prisma-accent2' },
    { label: 'Compases', value: state.bars.length, icon: 'fa-grip-lines-vertical', color: 'text-prisma-warm' },
    { label: 'Tempo', value: `${state.tempo} BPM`, icon: 'fa-clock', color: 'text-prisma-success' },
  ];

  const modules = [
    { id: 'lavadora', icon: 'fa-water', title: 'La Lavadora Musical', desc: 'Diagnóstico y preparación del audio', status: state.audio ? 'listo' : 'espera' },
    { id: 'tapiz', icon: 'fa-wave-square', title: 'El Tapiz Sonoro', desc: 'Espectrograma y forma de onda navegables', status: state.audio ? 'listo' : 'espera' },
    { id: 'imanes', icon: 'fa-magnet', title: 'Los Imanes del Timbre', desc: 'Separación y agrupación por afinidad tímbrica', status: state.events.length > 0 ? 'activo' : 'espera' },
    { id: 'tamiz', icon: 'fa-filter', title: 'El Tamiz de Frecuencias', desc: 'Análisis por regiones espectrales', status: state.audio ? 'listo' : 'espera' },
    { id: 'prisma', icon: 'fa-diamond', title: 'El Prisma del Sonido', desc: 'Fundamental, armónicos y evolución tímbrica', status: state.events.length > 0 ? 'activo' : 'espera' },
    { id: 'fotocopiadora', icon: 'fa-copy', title: 'La Fotocopiadora Musical', desc: 'Conversión a eventos musicales', status: state.events.length > 0 ? 'activo' : 'espera' },
    { id: 'algoritmo', icon: 'fa-brain', title: 'El Algoritmo Binario', desc: 'Motor de decisiones y corrección', status: state.events.length > 10 ? 'activo' : 'espera' },
    { id: 'manuscrito', icon: 'fa-music', title: 'El Manuscrito que Escribe Solo', desc: 'Generación de partitura legible', status: state.events.length > 10 ? 'activo' : 'espera' },
    { id: 'ciclo', icon: 'fa-sync', title: 'El Ciclo de la Transcripción', desc: 'Análisis → corrección → validación → exportación', status: state.events.length > 0 ? 'activo' : 'espera' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-prisma-accent to-prisma-accent2 flex items-center justify-center">
            <i className="fas fa-diamond text-white text-lg"></i>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">PRISMA SONORO</h1>
            <p className="text-xs text-prisma-muted">Transcripción musical de audio a partitura · Prof. Manuel Gago Fernández</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {stats.map((s, i) => (
          <div key={i} className="glass-panel rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <i className={`fas ${s.icon} ${s.color} text-sm`}></i>
              <span className="text-[10px] text-prisma-muted uppercase tracking-wider">{s.label}</span>
            </div>
            <span className="text-xl font-bold text-white">{s.value}</span>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      {!state.audio && (
        <div className="glass-panel rounded-xl p-8 mb-8 text-center border-dashed border-2 border-prisma-border">
          <i className="fas fa-cloud-upload-alt text-4xl text-prisma-accent mb-4"></i>
          <h2 className="text-lg font-semibold text-white mb-2">Importar audio para comenzar</h2>
          <p className="text-sm text-prisma-muted mb-4">Admite WAV, MP3, FLAC y AIFF. Arrastra un archivo o pulsa para seleccionar.</p>
          <button
            onClick={() => dispatch({ type: 'SET_VIEW', payload: 'lavadora' })}
            className="px-6 py-2 bg-prisma-accent hover:bg-prisma-accent/80 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <i className="fas fa-upload mr-2"></i>Importar Audio
          </button>
        </div>
      )}

      {/* Modules Grid */}
      <h2 className="text-sm font-semibold text-prisma-muted uppercase tracking-wider mb-4">
        <i className="fas fa-th-large mr-2"></i>Módulos del Código Sonoro
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {modules.map(mod => (
          <button
            key={mod.id}
            onClick={() => dispatch({ type: 'SET_VIEW', payload: mod.id as any })}
            className="glass-panel rounded-lg p-4 text-left hover:border-prisma-accent/40 transition-all group"
          >
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ${
                mod.status === 'activo' ? 'bg-prisma-success/20' : mod.status === 'listo' ? 'bg-prisma-accent/20' : 'bg-prisma-panel'
              }`}>
                <i className={`fas ${mod.icon} text-sm ${
                  mod.status === 'activo' ? 'text-prisma-success' : mod.status === 'listo' ? 'text-prisma-accent' : 'text-prisma-muted'
                }`}></i>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-white group-hover:text-prisma-accent transition-colors">{mod.title}</h3>
                <p className="text-[11px] text-prisma-muted mt-0.5">{mod.desc}</p>
              </div>
              <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                mod.status === 'activo' ? 'bg-prisma-success/20 text-prisma-success' : mod.status === 'listo' ? 'bg-prisma-accent/20 text-prisma-accent' : 'bg-prisma-panel text-prisma-muted'
              }`}>{mod.status}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Architecture Info */}
      <div className="mt-8 glass-panel rounded-lg p-4">
        <h3 className="text-xs font-semibold text-prisma-muted uppercase tracking-wider mb-3">
          <i className="fas fa-sitemap mr-2"></i>Arquitectura del Sistema
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {[
            { step: '1', label: 'Audio', icon: 'fa-file-audio', color: 'from-blue-500/20 to-blue-600/20' },
            { step: '2', label: 'Análisis', icon: 'fa-chart-bar', color: 'from-purple-500/20 to-purple-600/20' },
            { step: '3', label: 'Matriz', icon: 'fa-table', color: 'from-cyan-500/20 to-cyan-600/20' },
            { step: '4', label: 'Partitura', icon: 'fa-music', color: 'from-green-500/20 to-green-600/20' },
          ].map((s, i) => (
            <div key={i} className={`bg-gradient-to-b ${s.color} rounded-lg p-3`}>
              <i className={`fas ${s.icon} text-lg text-white/80 mb-1`}></i>
              <p className="text-[10px] text-white/60">Paso {s.step}</p>
              <p className="text-xs font-medium text-white">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Active capabilities summary */}
      <div className="mt-4 glass-panel rounded-lg p-4">
        <h3 className="text-xs font-semibold text-prisma-muted uppercase tracking-wider mb-3">
          <i className="fas fa-sliders-h mr-2"></i>Capacidades Activas ({enabledCaps.length}/36)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {['protection', 'speed', 'fidelity', 'learning', 'export'].map(group => {
            const groupCaps = enabledCaps.filter(c => c.group === group);
            const groupLabels: Record<string, string> = {
              protection: 'Protección',
              speed: 'Velocidad',
              fidelity: 'Fidelidad',
              learning: 'Aprendizaje',
              export: 'Exportación',
            };
            return (
              <div key={group} className="bg-prisma-panel rounded p-2 text-center">
                <p className="text-sm font-bold text-white">{groupCaps.length}</p>
                <p className="text-[8px] text-prisma-muted">{groupLabels[group]}</p>
              </div>
            );
          })}
        </div>
        {experimentalCaps.length > 0 && (
          <p className="text-[9px] text-prisma-warm mt-2">
            <i className="fas fa-flask mr-1"></i>
            {experimentalCaps.length} capacidades experimentales activas
          </p>
        )}
      </div>
    </div>
  );
}
