'use client';

import { useEffect, useState } from 'react';

const API_URL = 'https://dev2stage.vercel.app/api/visitors';

interface Props { appSlug: string; label: string; }

function visitorId() {
  const key = 'standalone_visitor_id_v1';
  const saved = window.localStorage.getItem(key);
  if (saved) return saved;
  const value = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `visitor-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(key, value);
  return value;
}

export default function StandaloneVisitorCounter({ appSlug, label }: Props) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    const countKey = `standalone_visitor_count_v1:${appSlug}`;
    const seenKey = `standalone_visitor_seen_v1:${appSlug}`;
    const fallback = () => {
      const old = Number(window.localStorage.getItem(countKey)) || 0;
      const next = window.localStorage.getItem(seenKey) === '1' ? old || 1 : old + 1;
      window.localStorage.setItem(countKey, String(next));
      window.localStorage.setItem(seenKey, '1');
      if (active) setCount(next || 1);
    };

    void fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitorId: visitorId(), appSlug }),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('counter');
        const result = await response.json() as { appCount?: number };
        if (active && typeof result.appCount === 'number') setCount(result.appCount);
      })
      .catch(fallback);

    return () => { active = false; };
  }, [appSlug]);

  return (
    <section className="border-t border-border/70 bg-[var(--surface-soft)]" aria-label={label}>
      <div className="container flex flex-col gap-4 py-5 text-sm sm:flex-row sm:items-center sm:justify-between sm:py-6">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-[var(--color-teal)]/20 bg-[var(--surface-accent)] text-[var(--color-teal-foreground)]">
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
              <circle cx="12" cy="12" r="2.5" />
            </svg>
          </span>
          <div>
            <p className="font-semibold uppercase tracking-[0.14em] text-[var(--color-teal-foreground)]">{label}</p>
            <p className="mt-1 text-xs text-muted-foreground">People who have stopped by Focus Flow</p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--color-teal)]/20 bg-background px-4 py-3 sm:min-w-36 sm:justify-center">
          <span className="text-xs font-medium text-muted-foreground">TOTAL</span>
          <span className="font-mono text-lg font-semibold tabular-nums text-foreground" aria-live="polite">{count ?? '—'}</span>
        </div>
      </div>
    </section>
  );
}
