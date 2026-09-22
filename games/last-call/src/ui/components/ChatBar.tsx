import { useEffect, useRef, useState } from 'react';
import type { SmallTalkState } from '@/engine/smallTalk';
import { useGameStore } from '@/state/gameStore';

/**
 * Talking to a passer-by.
 *
 * Deliberately thinner than `TalkBar`: no preset replies, no meters, no
 * outcome — a stranger is a conversation, not a relationship, so all it needs
 * is a box and a way to stop. Typing is always available here, because these
 * people have no authored dialogue tree to fall back into.
 */
export function ChatBar({ chat }: { chat: SmallTalkState }) {
  const saySmall = useGameStore((store) => store.saySmall);
  const endSmallTalk = useGameStore((store) => store.endSmallTalk);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const locked = chat.busy || chat.over;

  useEffect(() => {
    if (!locked) inputRef.current?.focus();
  }, [chat.line, locked]);

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-ink-500/20 bg-night-850/90 p-3">
      <div className="flex items-baseline justify-between">
        <p className="font-display text-xs uppercase tracking-[0.2em] text-glow-400">{chat.name}</p>
        <button
          onClick={endSmallTalk}
          className="tap text-xs text-ink-500 underline underline-offset-4"
        >
          {chat.over ? 'Done' : 'Walk away'}
        </button>
      </div>

      {chat.over ? (
        <p className="text-xs italic text-ink-500">
          They had somewhere to be. You can always say hello to someone else.
        </p>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const text = draft.trim();
            if (!text || locked) return;
            setDraft('');
            void saySmall(text);
          }}
          className="flex gap-2"
        >
          <input
            ref={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            disabled={locked}
            maxLength={240}
            placeholder={chat.busy ? 'Thinking…' : 'Say anything…'}
            className="min-w-0 flex-1 rounded-xl border border-ink-500/30 bg-night-900/80 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-600 focus:border-glow-400/70 focus:outline-none"
          />
          <button
            type="submit"
            disabled={locked || draft.trim().length === 0}
            className="tap shrink-0 rounded-xl border border-glow-400/70 bg-glow-500/20 px-4 py-2 text-sm font-semibold text-ink-100 disabled:border-ink-600/30 disabled:bg-night-800 disabled:text-ink-600"
          >
            Say
          </button>
        </form>
      )}
    </div>
  );
}
