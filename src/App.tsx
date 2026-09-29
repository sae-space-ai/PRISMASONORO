import React, { useState, useCallback, useEffect } from 'react';
import { AppProvider, useAppState } from './store';
import { AgentsProvider } from './agents/store';
import { CapabilitiesProvider } from './capabilities/store';
import { ViewType } from './types';
import { TopBar } from './components/layout/TopBar';
import { SourcesPanel } from './components/layout/SourcesPanel';
import { CentralCanvas } from './components/layout/CentralCanvas';
import { ScorePanel } from './components/layout/ScorePanel';
import { InspectorPanel } from './components/layout/InspectorPanel';
import { CodeNavigation } from './components/layout/CodeNavigation';

// Motores legacy funcionales (no duplicados, reutilizados)
import { AudioImport } from './components/AudioImport';
import { SpectralView } from './components/SpectralView';
import { PianoRoll } from './components/PianoRoll';
import { SourcePanel } from './components/SourcePanel';
import { QuantizationPanel } from './components/QuantizationPanel';
import { CorrectionPanel } from './components/CorrectionPanel';
import { ProcessingPipeline } from './components/ProcessingPipeline';
import { ScoreEditor } from './components/ScoreEditor';
import { ExportPanel } from './components/ExportPanel';
import { ContinuousImprovementPanel } from './components/ContinuousImprovementPanel';
import { CapabilitiesPanel } from './components/CapabilitiesPanel';

function AppContent() {
  const { state, dispatch } = useAppState();
  const [showSources, setShowSources] = useState(true);
  const [showInspector, setShowInspector] = useState(true);
  const [showImprovement, setShowImprovement] = useState(false);
  const [showCapabilities, setShowCapabilities] = useState(false);
  const [sourcesWidth, setSourcesWidth] = useState(280);
  const [inspectorWidth, setInspectorWidth] = useState(340);
  const [scoreExpanded, setScoreExpanded] = useState(false);

  // Atajos de teclado
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      if (e.key === '1' && e.altKey) setShowSources(s => !s);
      if (e.key === '2' && e.altKey) setShowInspector(s => !s);
      if (e.key === 'Escape') setShowInspector(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Renderiza el motor funcional según la vista activa del códice
  const renderCodexView = () => {
    switch (state.currentView) {
      case 'lavadora': return <AudioImport />;
      case 'tapiz': return <SpectralView mode="default" />;
      case 'imanes': return <SourcePanel />;
      case 'tamiz': return <SpectralView mode="frequency" />;
      case 'prisma': return <SpectralView mode="harmonic" />;
      case 'fotocopiadora': return <PianoRoll />;
      case 'algoritmo': return <CorrectionPanel />;
      case 'manuscrito': return <ScoreEditor />;
      case 'ciclo': return <ProcessingPipeline />;
      case 'editor':
        return (
          <div className="h-full flex flex-col">
            <div className="flex-1 flex flex-col lg:flex-row">
              <div className="flex-1 border-b lg:border-b-0 lg:border-r border-prisma-border">
                <PianoRoll />
              </div>
              <div className="flex-1"><ScoreEditor /></div>
            </div>
            <div className="h-48 border-t border-prisma-border">
              <QuantizationPanel />
            </div>
          </div>
        );
      case 'export': return <ExportPanel />;
      default: return <CentralCanvas />;
    }
  };

  // Panel central: si hay vista de códice activa, muestra motor funcional; si no, tapiz
  const showCodexView = state.currentView !== 'dashboard';

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-prisma-bg">
      <TopBar
        onToggleImprovement={() => setShowImprovement(s => !s)}
        onToggleCapabilities={() => setShowCapabilities(s => !s)}
        showImprovement={showImprovement}
        showCapabilities={showCapabilities}
      />

      <CodeNavigation />

      <div className="flex-1 flex overflow-hidden">
        {showSources && (
          <div style={{ width: sourcesWidth }} className="flex-shrink-0 border-r border-prisma-border bg-prisma-surface flex flex-col">
            <SourcesPanel onResize={setSourcesWidth} onClose={() => setShowSources(false)} />
          </div>
        )}

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            {showCapabilities ? (
              <CapabilitiesPanel onClose={() => setShowCapabilities(false)} />
            ) : showImprovement ? (
              <ContinuousImprovementPanel onClose={() => setShowImprovement(false)} />
            ) : showCodexView ? (
              renderCodexView()
            ) : (
              <CentralCanvas />
            )}
          </div>

          <div
            style={{ height: scoreExpanded ? '60vh' : '220px' }}
            className="border-t border-prisma-border bg-prisma-surface flex-shrink-0 transition-all duration-300"
          >
            <ScorePanel
              expanded={scoreExpanded}
              onToggleExpand={() => setScoreExpanded(!scoreExpanded)}
            />
          </div>
        </div>

        {showInspector && (
          <div style={{ width: inspectorWidth }} className="flex-shrink-0 border-l border-prisma-border bg-prisma-surface flex flex-col">
            <InspectorPanel onResize={setInspectorWidth} onClose={() => setShowInspector(false)} />
          </div>
        )}
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
