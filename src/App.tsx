import React, { useState, useCallback, useRef, useEffect } from 'react';
import { AppProvider, useAppState } from './store';
import { AgentsProvider } from './agents/store';
import { CapabilitiesProvider } from './capabilities/store';
import { ContinuousImprovementPanel } from './components/ContinuousImprovementPanel';
import { CapabilitiesPanel } from './components/CapabilitiesPanel';
import { ViewType, MusicalEvent, Source } from './types';
import { Dashboard } from './components/Dashboard';
import { AudioImport } from './components/AudioImport';
import { SpectralView } from './components/SpectralView';
import { PianoRoll } from './components/PianoRoll';
import { ScoreEditor } from './components/ScoreEditor';
import { SourcePanel } from './components/SourcePanel';
import { QuantizationPanel } from './components/QuantizationPanel';
import { ExportPanel } from './components/ExportPanel';
import { AIAssistant } from './components/AIAssistant';
import { ProcessingPipeline } from './components/ProcessingPipeline';
import { StatusBar } from './components/StatusBar';
import { CorrectionPanel } from './components/CorrectionPanel';

const MODULES: { id: ViewType; icon: string; label: string; code: string }[] = [
  { id: 'dashboard', icon: 'fa-home', label: 'Panel Principal', code: '' },
  { id: 'lavadora', icon: 'fa-water', label: 'La Lavadora Musical', code: '4.1' },
  { id: 'tapiz', icon: 'fa-wave-square', label: 'El Tapiz Sonoro', code: '4.2' },
  { id: 'imanes', icon: 'fa-magnet', label: 'Los Imanes del Timbre', code: '4.3' },
  { id: 'tamiz', icon: 'fa-filter', label: 'El Tamiz de Frecuencias', code: '4.4' },
  { id: 'prisma', icon: 'fa-diamond', label: 'El Prisma del Sonido', code: '4.5' },
  { id: 'fotocopiadora', icon: 'fa-copy', label: 'La Fotocopiadora Musical', code: '4.6' },
  { id: 'algoritmo', icon: 'fa-brain', label: 'El Algoritmo Binario', code: '4.7' },
  { id: 'manuscrito', icon: 'fa-music', label: 'El Manuscrito que Escribe Solo', code: '4.8' },
  { id: 'ciclo', icon: 'fa-sync', label: 'El Ciclo de la Transcripción', code: '4.9' },
  { id: 'editor', icon: 'fa-pen', label: 'Editor Integral', code: '' },
  { id: 'export', icon: 'fa-file-export', label: 'Exportación', code: '' },
];

function AppContent() {
  const { state, dispatch } = useAppState();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showImprovement, setShowImprovement] = useState(false);
  const [showCapabilities, setShowCapabilities] = useState(false);

  const navigateTo = useCallback((view: ViewType) => {
    dispatch({ type: 'SET_VIEW', payload: view });
  }, [dispatch]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-prisma-bg">
      {/* Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-14' : 'w-64'} flex-shrink-0 bg-prisma-surface border-r border-prisma-border flex flex-col transition-all duration-300`}>
        <div className="p-3 border-b border-prisma-border flex items-center gap-2">
          {!sidebarCollapsed && (
            <div className="flex-1">
              <h1 className="text-sm font-bold text-prisma-accent tracking-wider">PRISMA SONORO</h1>
              <p className="text-[10px] text-prisma-muted">Cada sonido, en su lugar</p>
            </div>
          )}
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="text-prisma-muted hover:text-prisma-text p-1">
            <i className={`fas ${sidebarCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'} text-xs`}></i>
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {MODULES.map(mod => (
            <button
              key={mod.id}
              onClick={() => navigateTo(mod.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                state.currentView === mod.id
                  ? 'bg-prisma-accent/20 text-prisma-accent border-r-2 border-prisma-accent'
                  : 'text-prisma-muted hover:text-prisma-text hover:bg-prisma-panel'
              }`}
            >
              <i className={`fas ${mod.icon} text-sm w-5 text-center`}></i>
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <span className="text-xs block truncate">{mod.label}</span>
                  {mod.code && <span className="text-[9px] text-prisma-muted/60">§{mod.code}</span>}
                </div>
              )}
            </button>
          ))}
        </nav>
        <div className="p-2 border-t border-prisma-border">
          <button
            onClick={() => setShowAI(!showAI)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded text-xs transition-colors ${
              showAI ? 'bg-prisma-accent2/20 text-prisma-accent2' : 'text-prisma-muted hover:text-prisma-text hover:bg-prisma-panel'
            }`}
          >
            <i className="fas fa-robot text-sm"></i>
            {!sidebarCollapsed && <span>Asistente IA</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-11 bg-prisma-surface border-b border-prisma-border flex items-center px-4 gap-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <i className="fas fa-diamond text-prisma-accent text-xs"></i>
            <span className="text-xs font-medium text-prisma-text">
              {MODULES.find(m => m.id === state.currentView)?.label || 'PRISMA SONORO'}
            </span>
          </div>
          <div className="flex-1"></div>
          {state.audio && (
            <div className="flex items-center gap-3 text-[10px] text-prisma-muted">
              <span><i className="fas fa-file-audio mr-1"></i>{state.audio.name}</span>
              <span>{state.audio.duration.toFixed(1)}s</span>
              <span>{state.audio.sampleRate}Hz</span>
              <span>{state.audio.channels}ch</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCapabilities(!showCapabilities)}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                showCapabilities ? 'bg-prisma-accent/20 text-prisma-accent' : 'text-prisma-muted hover:text-prisma-text hover:bg-prisma-panel'
              }`}
            >
              <i className="fas fa-sliders-h mr-1"></i>Capacidades
            </button>
            <button
              onClick={() => setShowImprovement(!showImprovement)}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                showImprovement ? 'bg-prisma-accent2/20 text-prisma-accent2' : 'text-prisma-muted hover:text-prisma-text hover:bg-prisma-panel'
              }`}
            >
              <i className="fas fa-chart-line mr-1"></i>Mejora Continua
            </button>
            <button className="text-prisma-muted hover:text-prisma-text text-xs px-2 py-1 rounded hover:bg-prisma-panel">
              <i className="fas fa-undo mr-1"></i>Deshacer
            </button>
            <button className="text-prisma-muted hover:text-prisma-text text-xs px-2 py-1 rounded hover:bg-prisma-panel">
              <i className="fas fa-redo mr-1"></i>Rehacer
            </button>
          </div>
        </header>

        {/* Workspace */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-auto">
            {showCapabilities ? (
              <CapabilitiesPanel onClose={() => setShowCapabilities(false)} />
            ) : showImprovement ? (
              <ContinuousImprovementPanel onClose={() => setShowImprovement(false)} />
            ) : (
              renderView(state, dispatch)
            )}
          </div>
          {showAI && <AIAssistant onClose={() => setShowAI(false)} />}
        </div>

        {/* Status Bar */}
        <StatusBar />
      </main>
    </div>
  );
}

function renderView(state: any, dispatch: any) {
  switch (state.currentView) {
    case 'dashboard': return <Dashboard />;
    case 'lavadora': return <AudioImport />;
    case 'tapiz': return <SpectralView />;
    case 'imanes': return <SourcePanel />;
    case 'tamiz': return <SpectralView mode="frequency" />;
    case 'prisma': return <SpectralView mode="harmonic" />;
    case 'fotocopiadora': return <PianoRoll />;
    case 'algoritmo': return <CorrectionPanel />;
    case 'manuscrito': return <ScoreEditor />;
    case 'ciclo': return <ProcessingPipeline />;
    case 'editor': return <EditorView />;
    case 'export': return <ExportPanel />;
    default: return <Dashboard />;
  }
}

function EditorView() {
  const { state } = useAppState();
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex flex-col lg:flex-row">
        <div className="flex-1 border-b lg:border-b-0 lg:border-r border-prisma-border">
          <PianoRoll />
        </div>
        <div className="flex-1">
          <ScoreEditor />
        </div>
      </div>
      <div className="h-48 border-t border-prisma-border">
        <QuantizationPanel />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <CapabilitiesProvider>
      <AgentsProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </AgentsProvider>
    </CapabilitiesProvider>
  );
}
