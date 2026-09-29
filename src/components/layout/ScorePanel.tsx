import React, { useRef, useEffect, useCallback } from 'react';
import { useAppState } from '../../store';

interface Props {
  expanded: boolean;
  onToggleExpand: () => void;
}

export function ScorePanel({ expanded, onToggleExpand }: Props) {
  const { state } = useAppState();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawScore = useCallback(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Background
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, width, height);

    if (state.events.length === 0) {
      ctx.fillStyle = '#AAB8CE';
      ctx.font = '14px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('Partitura — Detecta notas para visualizar', width / 2, height / 2);
      return;
    }

    // Staff
    const staffTop = 60;
    const lineSpacing = 12;
    const leftMargin = 80;
    const rightMargin = 40;
    const noteAreaWidth = width - leftMargin - rightMargin;

    // Staff lines
    ctx.strokeStyle = '#2A3550';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const y = staffTop + i * lineSpacing;
      ctx.beginPath();
      ctx.moveTo(leftMargin, y);
      ctx.lineTo(width - rightMargin, y);
      ctx.stroke();
    }

    // Treble clef
    ctx.fillStyle = '#F2F5FC';
    ctx.font = '42px serif';
    ctx.textAlign = 'left';
    ctx.fillText('𝄞', leftMargin + 5, staffTop + 40);

    // Time signature
    ctx.font = 'bold 18px Inter';
    ctx.fillText(`${state.timeSignature[0]}`, leftMargin + 45, staffTop + 15);
    ctx.fillText(`${state.timeSignature[1]}`, leftMargin + 45, staffTop + 38);

    // Bar lines
    const numBars = Math.max(state.bars.length, 4);
    const barWidth = noteAreaWidth / numBars;

    for (let i = 0; i <= numBars; i++) {
      const x = leftMargin + 70 + i * barWidth;
      if (x > width - rightMargin) break;

      ctx.strokeStyle = i === numBars ? '#F2F5FC' : '#2A3550';
      ctx.lineWidth = i === numBars ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(x, staffTop);
      ctx.lineTo(x, staffTop + lineSpacing * 4);
      ctx.stroke();

      // Bar numbers
      if (i < numBars) {
        ctx.fillStyle = '#6B7A94';
        ctx.font = '10px Inter';
        ctx.fillText(`${i + 1}`, x + 3, staffTop - 8);
      }
    }

    // Notes
    const eventsByBar: Record<number, typeof state.events> = {};
    state.events.forEach(ev => {
      if (!eventsByBar[ev.bar]) eventsByBar[ev.bar] = [];
      eventsByBar[ev.bar].push(ev);
    });

    const sourceColors: Record<string, string> = {};
    state.sources.forEach(s => { sourceColors[s.id] = s.color; });

    Object.entries(eventsByBar).forEach(([barStr, events]) => {
      const bar = parseInt(barStr);
      const barX = leftMargin + 70 + (bar - 1) * barWidth;

      events.forEach(ev => {
        const beatPos = ev.beat - 1 + ev.subBeat / 4;
        const noteX = barX + (beatPos / state.timeSignature[0]) * barWidth + 15;
        const staffPos = 72 - ev.midiNote;
        const noteY = staffTop + staffPos * (lineSpacing / 2);

        const color = sourceColors[ev.sourceId] || '#6366F1';

        // Note head
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(noteX, noteY, 6, 4, -0.2, 0, Math.PI * 2);
        ctx.fill();

        // Stem
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        const stemUp = ev.midiNote < 68;
        if (stemUp) {
          ctx.moveTo(noteX + 5.5, noteY);
          ctx.lineTo(noteX + 5.5, noteY - 30);
        } else {
          ctx.moveTo(noteX - 5.5, noteY);
          ctx.lineTo(noteX - 5.5, noteY + 30);
        }
        ctx.stroke();

        // Confidence indicator
        if (ev.confidence < 0.5) {
          ctx.strokeStyle = '#EF4444';
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 2]);
          ctx.beginPath();
          ctx.arc(noteX, noteY, 10, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      });
    });

    // Title
    ctx.fillStyle = '#F2F5FC';
    ctx.font = 'bold 16px Inter';
    ctx.textAlign = 'left';
    ctx.fillText('PRISMA SONORO', leftMargin, 30);

    // Tempo
    ctx.font = 'italic 12px Inter';
    ctx.fillStyle = '#AAB8CE';
    ctx.fillText(`♩ = ${state.tempo}`, leftMargin + 75, 30);
  }, [state.events, state.bars, state.sources, state.tempo, state.timeSignature]);

  useEffect(() => {
    drawScore();
  }, [drawScore]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="h-10 px-3 border-b border-prisma-border flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <i className="fas fa-music text-prisma-voice text-sm"></i>
          <h2 className="text-xs font-semibold text-prisma-text uppercase tracking-wider">Partitura</h2>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-prisma-surface-2 text-prisma-text-secondary">
            {state.events.length} notas
          </span>
        </div>
        <div className="flex items-center gap-2">
          <select className="text-[10px] bg-prisma-surface-2 text-prisma-text rounded px-2 py-1 border border-prisma-border">
            <option>Guion del Director</option>
            <option>Particella</option>
          </select>
          <button
            onClick={onToggleExpand}
            className="w-7 h-7 rounded hover:bg-prisma-surface-2 flex items-center justify-center text-prisma-text-secondary hover:text-prisma-text transition-colors"
            aria-label={expanded ? 'Reducir partitura' : 'Ampliar partitura'}
          >
            <i className={`fas ${expanded ? 'fa-compress' : 'fa-expand'} text-xs`}></i>
          </button>
        </div>
      </div>

      {/* Score Canvas */}
      <div className="flex-1 overflow-auto bg-prisma-bg">
        <canvas ref={canvasRef} width={1600} height={400} className="w-full h-full" />
      </div>
    </div>
  );
}
