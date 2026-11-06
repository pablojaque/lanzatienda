'use client';

import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/Icon';

const IDEAS = [
  'Haz que la tienda se vea más elegante y premium',
  'Reescribe la descripción del producto para que venda más',
  'Añade una sección de «Cómo funciona» en 3 pasos',
  'Cambia los colores y la letra para que pegue con mi producto',
];

/**
 * Chat con el asistente de IA dentro del editor. Cada respuesta puede traer cambios,
 * que se aplican al momento en el editor (y se pueden deshacer).
 */
export default function AiChat({ getState, onApply, onUndo, canUndo, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  useEffect(() => inputRef.current?.focus(), []);

  async function send(text) {
    const clean = text.trim();
    if (!clean || sending) return;
    const next = [...messages, { role: 'user', text: clean }];
    setMessages(next);
    setInput('');
    setSending(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Al asistente solo le llega la conversación de texto (sin los avisos de error)
        body: JSON.stringify({ messages: next.filter((m) => !m.error), state: getState() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'El asistente no ha podido responder. Inténtalo de nuevo.');
      if (data.changes) onApply(data.changes);
      setMessages((m) => [...m, { role: 'assistant', text: data.reply, changed: !!data.changes }]);
    } catch (err) {
      // Si falla, el mensaje del usuario vuelve a la caja para reenviarlo
      setMessages((m) => [...m.slice(0, -1), { role: 'assistant', text: err.message, error: true }]);
      setInput(clean);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="ai-chat">
      <div className="ai-head">
        <div>
          <h2>
            <Icon name="spark" size={18} /> Asistente IA
          </h2>
          <p className="muted">Pídele cualquier cambio y lo hace en tu tienda al momento.</p>
        </div>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Cerrar el asistente">
          <Icon name="close" />
        </button>
      </div>

      <div className="ai-list" ref={listRef}>
        {!messages.length && (
          <div className="ai-empty">
            <p>Por ejemplo:</p>
            {IDEAS.map((idea) => (
              <button key={idea} type="button" className="ai-idea" onClick={() => send(idea)}>
                {idea}
              </button>
            ))}
            <p className="ai-note">
              Puede cambiar textos, diseño, upsells, preguntas y productos, y crear secciones nuevas. Las fotos se suben en el
              paso «Productos».
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`ai-msg ${m.role} ${m.error ? 'error' : ''}`}>
            <p>{m.text}</p>
            {m.changed && i === messages.length - 1 && canUndo && (
              <button type="button" className="text-btn ai-undo" onClick={onUndo}>
                <Icon name="undo" size={14} /> Deshacer este cambio
              </button>
            )}
          </div>
        ))}
        {sending && (
          <div className="ai-msg assistant ai-typing" aria-label="El asistente está escribiendo">
            <i />
            <i />
            <i />
          </div>
        )}
      </div>

      <form
        className="ai-input"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <textarea
          ref={inputRef}
          rows={2}
          value={input}
          maxLength={2000}
          placeholder="Escribe qué quieres cambiar…"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
        />
        <button className="btn btn-primary" disabled={sending || !input.trim()} aria-label="Enviar">
          <Icon name="send" />
        </button>
      </form>
      <p className="ai-foot">Los cambios se ven en la vista previa. Se guardan en tu tienda cuando pulses «Publicar».</p>
    </div>
  );
}
