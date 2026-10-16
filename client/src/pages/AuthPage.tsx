import { useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft, ArrowRight, CheckCircle2, LockKeyhole, ShieldCheck,
  Sparkles, Timer, UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import { useLocale } from "@/contexts/LocaleContext";
import { useAuth } from "@/contexts/AuthContext";
import { neon } from "@/lib/neon";
import { clearGoogleOAuthStarted, markGoogleOAuthStarted } from "@/lib/googleOAuthReturn";

const translations = {
  en: {
    eyebrow: "YOUR SPACE FOR DEEP WORK",
    headline: "Make room for",
    accent: "what matters.",
    description: "A calmer place to plan focused work, collaborate when you choose, and keep private notes on your own device.",
    intentional: "Intentional focus sessions",
    local: "Your private data stays on your device",
    welcome: "Your focus space, your choice",
    descriptionCard: "Sign in with Google to create and join connected group rooms, or explore Focus Flow without an account.",
    google: "Continue with Google",
    guest: "Continue as guest",
    guestNote: "No sign-in required. Timers, notes and personal reviews stay in this browser.",
    signedIn: "You're signed in",
    dashboard: "Open dashboard",
    signOut: "Sign out",
    unavailable: "Google sign-in isn't configured for this deployment. Guest mode is still available.",
    working: "Working…",
    useGuest: "Switch to guest mode",
    legalPrefix: "By using Focus Flow, you can review our",
    privacy: "Privacy Policy",
    terms: "Terms of Service",
    legalAnd: "and",
    cannotSignOut: "Couldn't switch to guest mode. Please try signing out again.",
    cannotGoogle: "Google sign-in failed. Please try again.",
  },
  ar: {
    eyebrow: "مساحتك للتركيز بعمق",
    headline: "خصص وقتك",
    accent: "للي يستاهل.",
    description: "مكان هادي لتنظيم جلسات التركيز، والمشاركة وقت ما تحب، والاحتفاظ بملاحظاتك الشخصية على جهازك.",
    intentional: "جلسات تركيز منظمة",
    local: "بياناتك الشخصية محفوظة على جهازك",
    welcome: "اختار الطريقة المناسبة ليك",
    descriptionCard: "سجّل باستخدام Google علشان تعمل غرف مشتركة متصلة، أو استخدم Focus Flow من غير حساب.",
    google: "المتابعة باستخدام Google",
    guest: "المتابعة كضيف",
    guestNote: "مش محتاج حساب. الـ Timers والملاحظات والمراجعات الشخصية هتفضل في المتصفح.",
    signedIn: "أنت مسجّل الدخول",
    dashboard: "افتح لوحة التحكم",
    signOut: "تسجيل الخروج",
    unavailable: "تسجيل الدخول بـ Google مش متاح حاليًا في النسخة دي. تقدر تستخدم وضع الضيف.",
    working: "جاري التنفيذ…",
    useGuest: "التحويل لوضع الضيف",
    legalPrefix: "تقدر تقرأ",
    privacy: "سياسة الخصوصية",
    terms: "شروط الاستخدام",
    legalAnd: "و",
    cannotSignOut: "مقدرناش نحول لوضع الضيف. حاول تسجل خروج مرة تانية.",
    cannotGoogle: "حصلت مشكلة في تسجيل الدخول بـ Google. حاول مرة تانية.",
  },
};

function GoogleMark() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.31 5.48-4.85 7.18l7.73 6C44.33 38.03 46.98 31.86 46.98 24.55z" />
      <path fill="#FBBC05" d="M10.53 28.59A14.41 14.41 0 0 1 9.75 24c0-1.59.27-3.13.77-4.59l-7.98-6.19A23.91 23.91 0 0 0 0 24c0 3.87.93 7.51 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.92-2.13 15.89-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { language, setLanguage } = useLocale();
  const c = translations[language === "ar" ? "ar" : "en"];
  const { user, ready, refresh, signOut } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function continueWithGoogle() {
    setError("");
    if (!neon) {
      setError(c.unavailable);
      return;
    }
    setBusy(true);
    try {
      // Recover an OAuth return to "/" only after a real Neon Auth session.
      try { markGoogleOAuthStarted(window.sessionStorage); } catch { /* unavailable storage */ }
      const result = await neon.auth.signIn.social({
        provider: "google",
        callbackURL: window.location.origin + "/dashboard",
      });
      if (result.error) throw new Error(result.error.message);
      // Some auth clients complete via a popup rather than a full navigation.
      void refresh();
    } catch (cause) {
      try { clearGoogleOAuthStarted(window.sessionStorage); } catch { /* unavailable storage */ }
      setError(cause instanceof Error ? cause.message : c.cannotGoogle);
    } finally {
      setBusy(false);
    }
  }

  async function continueAsGuest() {
    setError("");
    setBusy(true);
    try {
      // A Google-authenticated user must actually sign out before entering guest
      // mode; otherwise room creation would still use the connected Neon account.
      if (user) await signOut();
      try { clearGoogleOAuthStarted(window.sessionStorage); } catch { /* unavailable storage */ }
      try { window.localStorage.setItem("focusflow_guest_chosen", "true"); } catch { /* guest still works */ }
      navigate("/dashboard");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : c.cannotSignOut);
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    setBusy(true);
    setError("");
    try {
      await signOut();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : c.cannotSignOut);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <header className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <a href="/" className="inline-flex items-center gap-3 font-semibold tracking-tight" aria-label="Focus Flow home">
          <img src="/brand/focus-flow-mark.png" alt="" className="h-10 w-10 rounded-xl object-contain" />
          <span className="text-lg">Focus Flow</span>
        </a>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
            onClick={() => setLanguage(language === "ar" ? "en" : "ar")}
          >
            {language === "ar" ? "English" : "العربية"}
          </button>
          <ThemeToggle />
          <a href="/" aria-label="Home" className="rounded-lg p-2 text-muted-foreground hover:bg-muted"><ArrowLeft size={18} /></a>
        </div>
      </header>

      <div className="mx-auto grid min-h-[calc(100dvh-86px)] max-w-7xl grid-cols-1 gap-10 px-5 pb-14 pt-5 md:grid-cols-2 md:items-center md:gap-14 md:px-8 lg:gap-24">
        <aside className="relative isolate hidden min-h-[630px] overflow-hidden rounded-[32px] border border-teal-400/20 bg-gradient-to-br from-[#123f46] via-[#14595c] to-[#092b32] p-12 text-white shadow-[0_30px_80px_-35px_rgba(0,0,0,.35)] md:flex md:flex-col md:justify-between">
          <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-teal-200/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-36 -left-24 h-[28rem] w-[28rem] rounded-full bg-orange-300/10 blur-3xl" />
          <div className="relative z-10">
            <div className="mb-24 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold tracking-widest">
              <Sparkles size={14} /> {c.eyebrow}
            </div>
            <h1 className="max-w-md text-5xl font-semibold leading-[1.1] tracking-tight lg:text-6xl">{c.headline} <span className="text-[#b7e7c9]">{c.accent}</span></h1>
            <p className="mt-7 max-w-sm text-base leading-8 text-teal-50/80">{c.description}</p>
          </div>
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-4 backdrop-blur-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15"><Timer size={20} /></span>
              <span className="text-sm font-medium">{c.intentional}</span>
              <CheckCircle2 className="ms-auto text-[#b7e7c9]" size={18} />
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-4 backdrop-blur-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15"><ShieldCheck size={20} /></span>
              <span className="text-sm font-medium">{c.local}</span>
              <CheckCircle2 className="ms-auto text-[#b7e7c9]" size={18} />
            </div>
          </div>
        </aside>

        <main className="mx-auto flex w-full max-w-md flex-col justify-center pb-8" aria-label="Choose how to use Focus Flow">
          <div className="mb-8">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-[var(--surface-accent)] px-3 py-1.5 text-xs font-semibold text-[var(--color-teal-foreground)]">
              <LockKeyhole size={13} /> Focus Flow
            </span>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{c.welcome}</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">{c.descriptionCard}</p>
          </div>

          {error && <p role="alert" className="mb-5 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</p>}
          {!neon && <p role="status" className="mb-5 rounded-xl border border-amber-400/50 bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">{c.unavailable}</p>}

          {ready && user ? (
            <div className="space-y-5 rounded-2xl border bg-card p-6">
              <p className="flex items-center gap-3 font-semibold"><CheckCircle2 className="text-emerald-600" size={20} /> {c.signedIn}</p>
              <p className="break-all text-sm text-muted-foreground">{user.email}</p>
              <Button className="h-12 w-full rounded-xl" disabled={busy} onClick={() => navigate("/dashboard")}>{c.dashboard} <ArrowRight size={16} /></Button>
              <Button variant="outline" className="w-full" disabled={busy} onClick={() => void handleSignOut()}>{c.signOut}</Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="h-14 w-full gap-3 rounded-xl bg-card text-sm font-semibold shadow-sm"
              disabled={!ready || busy || !neon}
              onClick={() => void continueWithGoogle()}
            >
              <GoogleMark /> {busy ? c.working : c.google}
            </Button>
          )}

          <div className="my-7 h-px bg-border" />
          <Button
            type="button"
            variant="secondary"
            className="h-14 w-full gap-3 rounded-xl text-sm font-semibold"
            disabled={busy || !ready}
            onClick={() => void continueAsGuest()}
          >
            <UserRound size={18} /> {user ? c.useGuest : c.guest} <ArrowRight size={17} />
          </Button>
          <p className="mt-3 text-center text-xs leading-6 text-muted-foreground">{c.guestNote}</p>

          <p className="mt-8 text-center text-xs leading-6 text-muted-foreground">
            {c.legalPrefix}{" "}
            <a href="/privacy.html" className="font-medium underline-offset-4 hover:underline">{c.privacy}</a>
            {" "}{c.legalAnd}{" "}
            <a href="/terms.html" className="font-medium underline-offset-4 hover:underline">{c.terms}</a>.
          </p>
        </main>
      </div>
    </div>
  );
}
