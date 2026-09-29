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

function AppContent() {
  const { state } = useAppState();
  const [showSources, setShowSources] = useState(true);
  const [showInspector, setShowInspector] = useState(true);
  const [sourcesWidth, setSourcesWidth] = useState(280);
  const [inspectorWidth, setInspectorWidth] = useState(340);
  const [scoreExpanded, setScoreExpanded] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      
      if (e.key === '1' && e.altKey) setShowSources(s => !s);
      if (e.key === '2' && e.altKey) setShowInspector(s => !s);
      if (e.key === 'Escape') {
        setShowInspector(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-prisma-bg">
      {/* Top Bar: project, import, save, playback, progress, export */}
      <TopBar />

      {/* Code Navigation (9 functions) */}
      <CodeNavigation />

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Sources & Instruments */}
        {showSources && (
          <div
            style={{ width: sourcesWidth }}
            className="flex-shrink-0 border-r border-prisma-border bg-prisma-surface flex flex-col"
          >
            <SourcesPanel onResize={setSourcesWidth} onClose={() => setShowSources(false)} />
          </div>
        )}

        {/* Center: Tapiz + Timeline */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <CentralCanvas />
          </div>
          
          {/* Bottom: Score */}
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

        {/* Right: Inspector */}
        {showInspector && (
          <div
            style={{ width: inspectorWidth }}
            className="flex-shrink-0 border-l border-prisma-border bg-prisma-surface flex flex-col"
          >
            <InspectorPanel onResize={setInspectorWidth} onClose={() => setShowInspector(false)} />
          </div>
        )}
      </div>

      {/* Resize handles */}
      {showSources && (
        <ResizeHandle
          direction="vertical"
          position={sourcesWidth}
          onResize={setSourcesWidth}
          min={200}
          max={400}
        />
      )}
      {showInspector && (
        <ResizeHandle
          direction="vertical"
          position={inspectorWidth}
          onResize={setInspectorWidth}
          min={280}
          max={500}
          side="right"
        />
      )}
    </div>
  );
}

function ResizeHandle({
  direction,
  position,
  onResize,
  min,
  max,
  side = 'left',
}: {
  direction: 'vertical' | 'horizontal';
  position: number;
  onResize: (v: number) => void;
  min: number;
  max: number;
  side?: 'left' | 'right';
}) {
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startPos = position;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startX;
      const newPos = side === 'left' ? startPos + delta : startPos - delta;
      onResize(Math.max(min, Math.min(max, newPos)));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      className="w-1 hover:w-1.5 bg-transparent hover:bg-prisma-accent/40 cursor-col-resize transition-all absolute top-0 bottom-0 z-50"
      style={{
        [side === 'left' ? 'left' : 'right']: 0,
      }}
    />
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
