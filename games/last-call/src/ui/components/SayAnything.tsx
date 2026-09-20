import { useState } from 'react';

/**
 * The free-text input. Present only when an AI provider is running; the
 * suggested replies stay on screen above it, so the player can pick one or
 * write their own.
 */
export function SayAnything({
  busy,
  onSay,
  placeholder = 'Say anything...',
}: {
  busy: boolean;
  onSay: (text: string) => void;
  placeholder?: string;
}) {
  const [text, setText] = useState('');

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setText('');
    onSay(trimmed);
  };

  return (
    <div className="flex items-end gap-2">
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            send();
          }
        }}
        rows={2}
        maxLength={600}
        disabled={busy}
        placeholder={busy ? 'She is thinking...' : placeholder}
        className="min-h-[52px] flex-1 resize-none rounded-2xl border border-ink-500/25 bg-night-900/80 px-3 py-2.5 text-sm text-ink-100 outline-none placeholder:text-ink-600 focus:border-glow-400/60 disabled:opacity-60"
      />
      <button
        onClick={send}
        disabled={busy || text.trim().length === 0}
        className="tap h-[52px] shrink-0 rounded-2xl border border-neon-400 bg-neon-500 px-4 text-sm font-semibold text-night-950 disabled:border-night-600 disabled:bg-night-700 disabled:text-ink-600"
      >
        Say it
      </button>
    </div>
  );
}
