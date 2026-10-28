import { useState } from 'react';
import type { ChatMessage, Decision, Profile } from '../types';
import { askTutor, selectEngine } from '../services/tutor';

interface Props {
  decision: Decision;
  profile: Profile;
}

const HINT_REQUEST = 'Bir ipucu verir misin?';

export default function TutorPanel({ decision, profile }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const engine = selectEngine();

  async function send(text: string) {
    const message = text.trim();
    if (!message || busy) return;
    const history = messages;
    setMessages([...history, { role: 'student', text: message }]);
    setInput('');
    setBusy(true);
    try {
      const reply = await askTutor({ decision, profile, message, history }, engine);
      setMessages((m) => [...m, { role: 'tutor', text: reply.text }]);
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button className="btn btn--ghost btn--block" data-cy="tutor-toggle" onClick={() => setOpen(true)}>
        💬 AI tutor’a danış
      </button>
    );
  }

  return (
    <section className="tutor" data-cy="tutor-panel" aria-label="AI tutor">
      <header className="tutor__header">
        <div>
          <p className="tutor__title">AI tutor</p>
          <p className="tutor__sub" data-cy="tutor-engine">
            İpucu verir, cevabı vermez · {engine === 'gemini' ? 'Gemini' : 'çevrimdışı mod'}
          </p>
        </div>
        <button className="link-btn" onClick={() => setOpen(false)} aria-label="Tutor panelini kapat">
          Kapat
        </button>
      </header>

      <div className="tutor__log" aria-live="polite">
        {messages.length === 0 && (
          <p className="tutor__empty">Düşünceni yaz ya da bir ipucu iste. Sana cevabı değil, doğru soruyu vereceğim.</p>
        )}
        {messages.map((m, i) => (
          <p key={i} className={`bubble bubble--${m.role}`} data-cy="tutor-msg" data-role={m.role}>
            {m.text}
          </p>
        ))}
        {busy && (
          <p className="bubble bubble--tutor is-typing" data-cy="tutor-typing">
            Düşünüyor…
          </p>
        )}
      </div>

      <form
        className="tutor__form"
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
      >
        <input
          className="tutor__input"
          data-cy="tutor-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ör. Şemanın değişip değişmediğini nasıl anlarım?"
          aria-label="Tutor'a mesaj"
          maxLength={400}
        />
        <button className="btn btn--primary" data-cy="tutor-send" type="submit" disabled={busy || !input.trim()}>
          Gönder
        </button>
      </form>
      <button className="link-btn" data-cy="tutor-hint-btn" onClick={() => void send(HINT_REQUEST)} disabled={busy}>
        💡 İpucu iste
      </button>
    </section>
  );
}
