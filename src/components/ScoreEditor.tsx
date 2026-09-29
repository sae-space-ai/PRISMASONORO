import React, { useRef, useEffect, useCallback } from 'react';
import { useAppState } from '../store';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const STAFF_NOTES = [72, 71, 70, 69, 68, 67, 66, 65, 64, 63, 62, 61, 60]; // C5 to C4

function midiToName(midi: number): string {
  return NOTE_NAMES[midi % 12] + (Math.floor(midi / 12) - 1);
}

function getNoteDurationSymbol(duration: number, tempo: number): string {
  const beatDuration = 60 / tempo;
  const ratio = duration / beatDuration;
  if (ratio >= 3.5) return '𝅝'; // whole
  if (ratio >= 1.75) return '𝅗𝅥'; // half
  if (ratio >= 0.875) return '♩'; // quarter
  if (ratio >= 0.4375) return '♪'; // eighth
  return '♬'; // sixteenth
}

export function ScoreEditor() {
  const { state, dispatch } = useAppState();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawScore = useCallback(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const staffTop = 40;
    const staffLineSpacing = 10;
    const staffHeight = staffLineSpacing * 4;
    const leftMargin = 60;
    const rightMargin = 20;
    const noteAreaWidth = width - leftMargin - rightMargin;

    // Background
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, width, height);

    // Staff lines
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const y = staffTop + i * staffLineSpacing;
      ctx.beginPath();
      ctx.moveTo(leftMargin, y);
      ctx.lineTo(width - rightMargin, y);
      ctx.stroke();
    }

    // Treble clef (simplified text representation)
    ctx.fillStyle = '#333';
    ctx.font = '36px serif';
    ctx.fillText('𝄞', leftMargin + 5, staffTop + staffHeight + 5);

    // Time signature
    ctx.font = 'bold 16px serif';
    ctx.fillText(`${state.timeSignature[0]}`, leftMargin + 35, staffTop + 15);
    ctx.fillText(`${state.timeSignature[1]}`, leftMargin + 35, staffTop + staffHeight - 2);

    // Key signature
    ctx.font = '12px serif';
    ctx.fillText('♯', leftMargin + 50, staffTop + 12);

    // Bar lines and measures
    const numBars = Math.max(state.bars.length, 4);
    const barWidth = noteAreaWidth / numBars;

    for (let i = 0; i <= numBars; i++) {
      const x = leftMargin + 60 + i * barWidth;
      if (x > width - rightMargin) break;
      
      ctx.strokeStyle = '#333';
      ctx.lineWidth = i === numBars ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(x, staffTop);
      ctx.lineTo(x, staffTop + staffHeight);
      ctx.stroke();

      // Bar numbers
      if (i < numBars) {
        ctx.fillStyle = '#666';
        ctx.font = '9px sans-serif';
        ctx.fillText(`${i + 1}`, x + 2, staffTop - 5);
      }
    }

    // Draw notes
    const eventsByBar: Record<number, typeof state.events> = {};
    state.events.forEach(ev => {
      if (!eventsByBar[ev.bar]) eventsByBar[ev.bar] = [];
      eventsByBar[ev.bar].push(ev);
    });

    const sourceColors: Record<string, string> = {};
    state.sources.forEach(s => { sourceColors[s.id] = s.color; });

    Object.entries(eventsByBar).forEach(([barStr, events]) => {
      const bar = parseInt(barStr);
      const barX = leftMargin + 60 + (bar - 1) * barWidth;

      events.forEach((ev, idx) => {
        const beatPos = ev.beat - 1 + ev.subBeat / 4;
        const noteX = barX + (beatPos / state.timeSignature[0]) * barWidth + 10;
        
        // Map MIDI to staff position
        const staffPos = 72 - ev.midiNote; // Higher notes go up
        const noteY = staffTop + staffPos * (staffLineSpacing / 2);

        // Note head
        const color = sourceColors[ev.sourceId] || '#333';
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(noteX, noteY, 5, 3.5, -0.2, 0, Math.PI * 2);
        ctx.fill();

        // Stem
        const stemUp = ev.midiNote < 68;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        if (stemUp) {
          ctx.moveTo(noteX + 4.5, noteY);
          ctx.lineTo(noteX + 4.5, noteY - 25);
        } else {
          ctx.moveTo(noteX - 4.5, noteY);
          ctx.lineTo(noteX - 4.5, noteY + 25);
        }
        ctx.stroke();

        // Ledger lines
        if (ev.midiNote > 74 || ev.midiNote < 60) {
          ctx.strokeStyle = '#333';
          ctx.lineWidth = 1;
          const ledgerY = ev.midiNote > 74 ? staffTop - staffLineSpacing : staffTop + staffHeight + staffLineSpacing;
          const numLedgers = ev.midiNote > 74 ? Math.ceil((ev.midiNote - 74) / 2) : Math.ceil((60 - ev.midiNote) / 2);
          for (let l = 0; l < numLedgers; l++) {
            const ly = ev.midiNote > 74 ? staffTop - (l + 1) * staffLineSpacing : staffTop + staffHeight + (l + 1) * staffLineSpacing;
            ctx.beginPath();
            ctx.moveTo(noteX - 8, ly);
            ctx.lineTo(noteX + 8, ly);
            ctx.stroke();
          }
        }

        // Accidentals
        if (NOTE_NAMES[ev.midiNote % 12].includes('#')) {
          ctx.fillStyle = '#333';
          ctx.font = '12px serif';
          ctx.fillText('♯', noteX - 14, noteY + 4);
        } else if (NOTE_NAMES[ev.midiNote % 12].includes('b')) {
          ctx.fillStyle = '#333';
          ctx.font = '12px serif';
          ctx.fillText('♭', noteX - 14, noteY + 4);
        }

        // Confidence indicator
        if (ev.confidence < 0.5) {
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 2]);
          ctx.beginPath();
          ctx.arc(noteX, noteY, 8, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Status indicator
        if (ev.status === 'protected') {
          ctx.fillStyle = '#f59e0b';
          ctx.font = '8px sans-serif';
          ctx.fillText('🔒', noteX - 3, noteY - 12);
        }
      });
    });

    // Title
    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px serif';
    ctx.fillText('PRISMA SONORO — Transcripción', leftMargin, 20);
    
    // Instrument label
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#666';
    ctx.fillText('Guion del Director', leftMargin, height - 10);

    // Tempo marking
    ctx.font = 'italic 11px serif';
    ctx.fillText(`♩ = ${state.tempo}`, leftMargin + 65, staffTop - 5);

  }, [state.events, state.bars, state.sources, state.tempo, state.timeSignature]);

  useEffect(() => {
    drawScore();
  }, [drawScore]);

  return (
    <div className="h-full flex flex-col p-3">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <i className="fas fa-music text-prisma-accent"></i>
            El Manuscrito que Escribe Solo
          </h3>
          <p className="text-[10px] text-prisma-muted">Partitura generada desde la matriz central</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="text-[10px] bg-prisma-panel text-prisma-text rounded px-2 py-1 border border-prisma-border">
            <option>Clave de Sol</option>
            <option>Clave de Fa</option>
            <option>Clave de Do</option>
          </select>
          <select className="text-[10px] bg-prisma-panel text-prisma-text rounded px-2 py-1 border border-prisma-border">
            <option>Guion</option>
            <option>Particella</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-white rounded border border-prisma-border">
        <canvas ref={canvasRef} width={1000} height={300} className="w-full" />
      </div>

      {/* Score info */}
      <div className="mt-2 flex items-center gap-4 text-[10px] text-prisma-muted">
        <span><i className="fas fa-clock mr-1"></i>{state.tempo} BPM</span>
        <span><i className="fas fa-grip-lines-vertical mr-1"></i>{state.timeSignature[0]}/{state.timeSignature[1]}</span>
        <span><i className="fas fa-music mr-1"></i>Tonalidad: {state.key}</span>
        <span><i className="fas fa-layer-group mr-1"></i>{state.events.length} notas</span>
        <span className="ml-auto text-prisma-accent">
          <i className="fas fa-info-circle mr-1"></i>
          {state.events.filter(e => e.confidence < 0.5).length} incidencias
        </span>
      </div>
    </div>
  );
}
