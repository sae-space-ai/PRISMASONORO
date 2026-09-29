import React, { useState, useRef } from 'react';
import { useAppState } from '../store';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export function AIAssistant({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useAppState();
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: 'Soy el asistente de PRISMA SONORO. Puedo ayudarte a analizar el audio, revisar incidencias, proponer correcciones y preparar exportaciones. ¿En qué puedo ayudarte?', timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'transcription' | 'creation'>('transcription');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSend = () => {
    if (!input.trim()) return;
    
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    
    // Generate contextual response
    let response = '';
    const query = input.toLowerCase();
    
    if (query.includes('detectar') || query.includes('analizar') || query.includes('nota')) {
      response = `He revisado el estado actual. ${state.events.length > 0 ? `Hay ${state.events.length} eventos detectados.` : 'No hay eventos detectados aún.'} ${state.audio ? `El audio "${state.audio.name}" está cargado (${state.audio.duration.toFixed(1)}s).` : 'No hay audio cargado.'} Puedes usar "Detectar Notas" en el Piano Roll para iniciar el análisis.`;
    } else if (query.includes('incidencia') || query.includes('error') || query.includes('problema')) {
      const lowConf = state.events.filter(e => e.confidence < 0.5).length;
      response = `Análisis de incidencias: ${lowConf} eventos con confianza baja (<50%). ${lowConf > 0 ? 'Te recomiendo revisar el panel de corrección (Algoritmo Binario) para resolverlas una a una o aplicar corrección automática.' : 'No se han detectado incidencias significativas.'}`;
    } else if (query.includes('exportar') || query.includes('midi') || query.includes('pdf')) {
      response = `Puedo preparar las exportaciones. Actualmente hay ${state.events.length} eventos en la matriz. Los formatos disponibles son: MIDI completo, MIDI por instrumento, MusicXML, PDF del guion, PDF de particellas y proyecto editable. Ve al panel de Exportación cuando estés listo.`;
    } else if (query.includes('tempo') || query.includes('bpm') || query.includes('compás')) {
      response = `Configuración actual: Tempo ${state.tempo} BPM, Compás ${state.timeSignature[0]}/${state.timeSignature[1]}, Tonalidad ${state.key}. ${state.bars.length} compases identificados. Puedes ajustar estos parámetros en el panel de cuantización.`;
    } else if (query.includes('fuente') || query.includes('instrumento') || query.includes('timbre')) {
      response = `Hay ${state.sources.length} fuentes configuradas. ${state.sources.filter(s => s.instrument.family !== 'unknown').length} tienen instrumento asignado. Usa el panel "Los Imanes del Timbre" para asignar instrumentos a cada fuente.`;
    } else if (query.includes('ayuda') || query.includes('qué puedes')) {
      response = 'Puedo ayudarte con:\n• Analizar el audio y detectar notas\n• Revisar incidencias y proponer correcciones\n• Explicar decisiones de transcripción\n• Preparar exportaciones\n• Ajustar tempo, compás y cuantización\n• Comparar alternativas de interpretación\n\nPregúntame sobre cualquier aspecto del proceso.';
    } else {
      response = `Entiendo tu consulta sobre "${input}". En el modo ${mode === 'transcription' ? 'Transcripción Fiel' : 'Creación y Arreglo'}, puedo ayudarte con las funciones disponibles. ¿Podrías ser más específico? Por ejemplo: "detectar notas", "revisar incidencias", "ajustar tempo", "exportar MIDI".`;
    }

    const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: response, timestamp: Date.now() };
    setTimeout(() => setMessages(prev => [...prev, assistantMsg]), 500);
    setInput('');
  };

  return (
    <div className="w-80 flex-shrink-0 bg-prisma-surface border-l border-prisma-border flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-prisma-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <i className="fas fa-robot text-prisma-accent2"></i>
          <span className="text-xs font-medium text-white">Asistente IA</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded overflow-hidden border border-prisma-border">
            <button
              onClick={() => setMode('transcription')}
              className={`text-[8px] px-1.5 py-0.5 ${mode === 'transcription' ? 'bg-prisma-accent text-white' : 'text-prisma-muted'}`}
            >
              Fiel
            </button>
            <button
              onClick={() => setMode('creation')}
              className={`text-[8px] px-1.5 py-0.5 ${mode === 'creation' ? 'bg-prisma-accent2 text-white' : 'text-prisma-muted'}`}
            >
              Creación
            </button>
          </div>
          <button onClick={onClose} className="text-prisma-muted hover:text-white text-xs">
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] rounded-lg p-2 text-xs ${
              msg.role === 'user' ? 'bg-prisma-accent/20 text-prisma-text' : 'bg-prisma-panel text-prisma-text'
            }`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
              <p className="text-[8px] text-prisma-muted mt-1">{new Date(msg.timestamp).toLocaleTimeString()}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick actions */}
      <div className="px-3 py-2 border-t border-prisma-border flex flex-wrap gap-1">
        {['Analizar audio', 'Revisar incidencias', 'Ajustar tempo', 'Exportar'].map(action => (
          <button
            key={action}
            onClick={() => { setInput(action); }}
            className="text-[8px] px-2 py-0.5 rounded bg-prisma-panel text-prisma-muted hover:text-white"
          >
            {action}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-prisma-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Pregunta al asistente..."
            className="flex-1 bg-prisma-panel rounded px-2 py-1.5 text-xs text-white border border-prisma-border focus:border-prisma-accent outline-none"
          />
          <button
            onClick={handleSend}
            className="px-2 py-1.5 bg-prisma-accent hover:bg-prisma-accent/80 text-white rounded text-xs"
          >
            <i className="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
