import React, { useState } from 'react';
import { useAppState } from '../store';

export function ExportPanel() {
  const { state } = useAppState();
  const [exporting, setExporting] = useState<string | null>(null);
  const [exported, setExported] = useState<string[]>([]);

  const exports = [
    { id: 'midi-full', label: 'MIDI completo', desc: 'Todas las partes organizadas', icon: 'fa-file-audio', ext: '.mid' },
    { id: 'midi-parts', label: 'MIDI por instrumento', desc: 'Archivo independiente por cada fuente', icon: 'fa-file-audio', ext: '.mid' },
    { id: 'musicxml-score', label: 'MusicXML — Guion', desc: 'Partitura completa del director', icon: 'fa-file-code', ext: '.musicxml' },
    { id: 'musicxml-parts', label: 'MusicXML — Particellas', desc: 'Partes individuales por instrumento', icon: 'fa-file-code', ext: '.musicxml' },
    { id: 'pdf-score', label: 'PDF — Guion del Director', desc: 'Partitura completa con maquetación', icon: 'fa-file-pdf', ext: '.pdf' },
    { id: 'pdf-parts', label: 'PDF — Particellas', desc: 'Una partitura por instrumento', icon: 'fa-file-pdf', ext: '.pdf' },
    { id: 'project', label: 'Proyecto editable', desc: 'Todos los datos, análisis y decisiones', icon: 'fa-save', ext: '.prisma' },
    { id: 'report', label: 'Informe de validación', desc: 'Incidencias, confianza y trazabilidad', icon: 'fa-clipboard-check', ext: '.txt' },
  ];

  const handleExport = (id: string) => {
    setExporting(id);
    setTimeout(() => {
      setExported(prev => [...prev, id]);
      setExporting(null);
    }, 1500);
  };

  const canExport = state.events.length > 0;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <i className="fas fa-file-export text-prisma-accent"></i>
          Exportación
        </h2>
        <p className="text-sm text-prisma-muted mt-1">Todos los archivos proceden de la misma versión musical de la matriz central.</p>
      </div>

      {!canExport && (
        <div className="glass-panel rounded-xl p-6 text-center border-dashed border-2 border-prisma-border mb-6">
          <i className="fas fa-exclamation-triangle text-2xl text-prisma-warm mb-2"></i>
          <p className="text-sm text-prisma-muted">No hay eventos para exportar. Detecta notas primero.</p>
        </div>
      )}

      {/* Export grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        {exports.map(exp => (
          <div key={exp.id} className={`glass-panel rounded-lg p-4 transition-all ${
            exported.includes(exp.id) ? 'border-prisma-success/50' : ''
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded flex items-center justify-center ${
                  exported.includes(exp.id) ? 'bg-prisma-success/20' : 'bg-prisma-panel'
                }`}>
                  <i className={`fas ${exp.icon} text-sm ${
                    exported.includes(exp.id) ? 'text-prisma-success' : 'text-prisma-muted'
                  }`}></i>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white">{exp.label}</h4>
                  <p className="text-[10px] text-prisma-muted">{exp.desc}</p>
                </div>
              </div>
              <button
                onClick={() => handleExport(exp.id)}
                disabled={!canExport || exporting === exp.id}
                className={`text-xs px-3 py-1.5 rounded transition-colors ${
                  exported.includes(exp.id)
                    ? 'bg-prisma-success/20 text-prisma-success'
                    : exporting === exp.id
                    ? 'bg-prisma-accent/20 text-prisma-accent'
                    : 'bg-prisma-accent hover:bg-prisma-accent/80 text-white disabled:opacity-50'
                }`}
              >
                {exported.includes(exp.id) ? (
                  <><i className="fas fa-check mr-1"></i>Generado</>
                ) : exporting === exp.id ? (
                  <><i className="fas fa-spinner fa-spin mr-1"></i>Generando...</>
                ) : (
                  <><i className="fas fa-download mr-1"></i>Exportar</>
                )}
              </button>
            </div>
            <div className="mt-2 flex items-center gap-2 text-[9px] text-prisma-muted">
              <span className="px-1.5 py-0.5 bg-prisma-panel rounded">{exp.ext}</span>
              {exp.id.includes('midi') && <span>PPQ: 480</span>}
              {exp.id.includes('musicxml') && <span>v2.0</span>}
              {state.events.length > 0 && <span>{state.events.length} eventos</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Export notes */}
      <div className="glass-panel rounded-lg p-4">
        <h3 className="text-xs font-semibold text-prisma-muted uppercase tracking-wider mb-3">
          <i className="fas fa-info-circle mr-2"></i>Convenciones de exportación
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[10px] text-prisma-text">
          <div>
            <p className="text-prisma-muted mb-1">MIDI:</p>
            <ul className="space-y-0.5">
              <li>• Conserva posición temporal original</li>
              <li>• Incluye silencios iniciales e internos</li>
              <li>• Mapa de tempo y compás</li>
              <li>• No desplaza partes a tiempo cero</li>
              <li>• Identificación instrumental por canal</li>
            </ul>
          </div>
          <div>
            <p className="text-prisma-muted mb-1">Partitura:</p>
            <ul className="space-y-0.5">
              <li>• Guion y particellas coherentes</li>
              <li>• Instrumentos transpositores correctos</li>
              <li>• Sin dobles transposiciones</li>
              <li>• Numeración de compases</li>
              <li>• Maquetación profesional</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Package download */}
      {exported.length > 0 && (
        <div className="mt-4 glass-panel rounded-lg p-4 border border-prisma-success/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white font-medium">Paquete completo</p>
              <p className="text-[10px] text-prisma-muted">{exported.length} archivos generados</p>
            </div>
            <button className="px-4 py-2 bg-prisma-success hover:bg-prisma-success/80 text-white rounded-lg text-sm font-medium">
              <i className="fas fa-file-archive mr-2"></i>Descargar todo (.zip)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
