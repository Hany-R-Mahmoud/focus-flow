'use client';

import { useEffect, useState } from 'react';

const API_URL = 'https://dev2stage.vercel.app/api/visitors';

interface Props { appSlug: string; label: string; tone?: 'light' | 'dark' | 'warm'; }

function visitorId() {
  const key = 'standalone_visitor_id_v1';
  const saved = window.localStorage.getItem(key);
  if (saved) return saved;
  const value = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `visitor-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(key, value);
  return value;
}

export default function StandaloneVisitorCounter({ appSlug, label, tone = 'dark' }: Props) {
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

  const palette = tone === 'warm'
    ? 'border-amber-200/80 bg-[#fffaf0]/95 text-stone-600 shadow-amber-950/10'
    : tone === 'light'
      ? 'border-slate-200 bg-white/95 text-slate-500 shadow-slate-900/10'
      : 'border-white/10 bg-slate-950/90 text-slate-300 shadow-black/20';
  const icon = tone === 'warm' ? 'text-amber-700' : tone === 'dark' ? 'text-cyan-300' : 'text-sky-600';

  return (
    <div className={`mx-auto flex w-full max-w-5xl justify-center border-t px-4 py-3 text-xs ${palette}`}>
      <span className="inline-flex items-center gap-2 whitespace-nowrap" title={`${label}: ${count ?? '…'}`}>
        <svg className={`h-3.5 w-3.5 ${icon}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
        <span className="font-semibold uppercase tracking-[0.14em]">{label}</span>
        <span className="font-mono font-bold tabular-nums" aria-live="polite">{count ?? '—'}</span>
      </span>
    </div>
  );
}
