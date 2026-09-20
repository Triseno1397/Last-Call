import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'ghost' | 'danger' | 'quiet';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-neon-500 text-night-950 border border-neon-400 hover:bg-neon-400 disabled:bg-night-700 disabled:text-ink-600 disabled:border-night-600',
  ghost:
    'bg-night-800/70 text-ink-100 border border-ink-500/25 hover:border-glow-400/60 disabled:text-ink-600',
  danger: 'bg-transparent text-alarm-400 border border-alarm-400/40 hover:bg-alarm-400/10',
  quiet: 'bg-transparent text-ink-500 border border-transparent hover:text-ink-300',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

export function Button({ variant = 'ghost', className = '', children, ...rest }: ButtonProps) {
  return (
    <button
      className={`tap rounded-xl px-4 py-3 text-sm font-semibold tracking-wide disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
