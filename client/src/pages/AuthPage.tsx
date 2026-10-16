import { useEffect, useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole,
  Mail, ShieldCheck, Sparkles, Timer, UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ThemeToggle from "@/components/ThemeToggle";
import { useLocale } from "@/contexts/LocaleContext";
import { useAuth } from "@/contexts/AuthContext";
import { neon, neonAuthBaseUrl } from "@/lib/neon";
import { clearGoogleOAuthStarted, markGoogleOAuthStarted } from "@/lib/googleOAuthReturn";

type Mode = "login" | "signup" | "forgot" | "reset" | "verify";
const PENDING_EMAIL_KEY = "focusflow_pending_verification_email";

const copy = {
  en: {
    eyebrow: "YOUR SPACE TO DO DEEP WORK",
    headline: "Make room for",
    accent: "what matters.",
    description: "Small moments of focus become your best work. Keep your focus space private, or connect when you're ready.",
    badge1: "Intentional sessions",
    badge2: "Your data, your choice",
    welcome: "Welcome back",
    create: "Create your account",
    guest: "Explore as a guest",
    guestNote: "No account needed. Your personal sessions stay on this device.",
    login: "Sign in",
    signup: "Create account",
    google: "Continue with Google",
    or: "or continue with email",
    email: "Email address",
    password: "Password",
    name: "Your name",
    confirmPassword: "Confirm password",
    show: "Show password",
    hide: "Hide password",
    forgot: "Forgot password?",
    forgotTitle: "Reset your password",
    forgotDesc: "Enter your email and we'll send a secure password reset link.",
    sendLink: "Send reset link",
    resetTitle: "Set a new password",
    resetDesc: "Choose a new password for your account.",
    resetButton: "Update password",
    verifyTitle: "Verify your email",
    verifyDesc: "Enter the verification code sent to your email. Codes expire after 15 minutes.",
    verificationCode: "Verification code",
    verifyCode: "Verify email address",
    codeSent: "Verification code sent. Check your inbox.",
    invalidCode: "Enter the verification code from your email.",
    resend: "Resend verification email",
    back: "Back to sign in",
    noAccount: "New to Focus Flow?",
    hasAccount: "Already have an account?",
    legal: "Your personal timers, notes and reviews remain stored on this browser. Signing in enables connected features.",
    mismatch: "Your passwords do not match.",
    invalid: "Please enter a valid email and a password of at least 8 characters.",
    sent: "Check your inbox for next steps. If the account exists, you'll receive an email.",
    created: "Account created. Check your email if verification is required.",
    verified: "Your email has been verified. You can sign in now.",
    updated: "Password updated. Sign in with your new password.",
    noToken: "This reset link is missing its token. Request a fresh link.",
    unconfigured: "Account login is not configured for this deployment yet. Guest mode remains available.",
    loggedIn: "You're signed in",
    dashboard: "Go to dashboard",
    signOut: "Sign out",
    loading: "Please wait…",
    setup: "Registration is ready. Google login may use Neon development credentials until Google Cloud Console is configured.",
  },
  ar: {
    eyebrow: "مساحتك للتركيز بعمق",
    headline: "خصص وقتك",
    accent: "للي يستاهل.",
    description: "جلسات تركيز بسيطة تفرق في يومك. احتفظ ببياناتك على جهازك، أو سجّل حسابك لما تحب.",
    badge1: "جلسات بتركيز",
    badge2: "بياناتك باختيارك",
    welcome: "أهلاً برجوعك",
    create: "أنشئ حسابك",
    guest: "استكمل كضيف",
    guestNote: "مش محتاج حساب. جلساتك الشخصية هتفضل محفوظة على الجهاز ده.",
    login: "تسجيل الدخول",
    signup: "إنشاء حساب",
    google: "المتابعة باستخدام Google",
    or: "أو باستخدام الإيميل",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    name: "اسمك",
    confirmPassword: "تأكيد كلمة المرور",
    show: "إظهار كلمة المرور",
    hide: "إخفاء كلمة المرور",
    forgot: "نسيت كلمة المرور؟",
    forgotTitle: "إعادة تعيين كلمة المرور",
    forgotDesc: "اكتب إيميلك وهنبعتلك رابط آمن لإعادة التعيين.",
    sendLink: "إرسال رابط التعيين",
    resetTitle: "اختار كلمة مرور جديدة",
    resetDesc: "اكتب كلمة مرور جديدة لحسابك.",
    resetButton: "تحديث كلمة المرور",
    verifyTitle: "تأكيد البريد الإلكتروني",
    verifyDesc: "اكتب كود التأكيد اللي وصلك على البريد الإلكتروني. الكود صالح لمدة ١٥ دقيقة.",
    verificationCode: "كود التأكيد",
    verifyCode: "تأكيد البريد الإلكتروني",
    codeSent: "بعتنا كود التأكيد. راجع بريدك الإلكتروني.",
    invalidCode: "اكتب كود التأكيد اللي وصلك.",
    resend: "إعادة إرسال رسالة التأكيد",
    back: "الرجوع لتسجيل الدخول",
    noAccount: "لسه معندكش حساب؟",
    hasAccount: "عندك حساب بالفعل؟",
    legal: "الـ Timers والملاحظات والمراجعات الشخصية هتفضل محفوظة في المتصفح. الحساب بيفعّل المزايا المتصلة.",
    mismatch: "كلمتا المرور مش متطابقتين.",
    invalid: "اكتب بريد إلكتروني صحيح وكلمة مرور ٨ حروف على الأقل.",
    sent: "راجع بريدك الإلكتروني. لو الحساب موجود هتوصلك رسالة بالخطوة الجاية.",
    created: "تم إنشاء الحساب. راجع رسالة التأكيد لو مطلوبة.",
    verified: "تم تأكيد البريد الإلكتروني. تقدر تسجّل دخولك دلوقتي.",
    updated: "تم تغيير كلمة المرور. سجّل الدخول بالكلمة الجديدة.",
    noToken: "رابط إعادة التعيين ناقص. اطلب رابط جديد.",
    unconfigured: "تسجيل الحسابات لسه مش متظبط في النسخة دي. تقدر تستخدم وضع الضيف.",
    loggedIn: "أنت مسجّل الدخول",
    dashboard: "الذهاب للوحة التحكم",
    signOut: "تسجيل الخروج",
    loading: "جاري التنفيذ…",
    setup: "تسجيل الحسابات جاهز. Google Login ممكن يستخدم إعدادات Neon التجريبية لحين استكمال Google Cloud Console.",
  },
};

function GoogleMark() {
  return (
    <svg aria-hidden="true" width="19" height="19" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.31 5.48-4.85 7.18l7.73 6C44.33 38.03 46.98 31.86 46.98 24.55z" />
      <path fill="#FBBC05" d="M10.53 28.59A14.41 14.41 0 0 1 9.75 24c0-1.59.27-3.13.77-4.59l-7.98-6.19A23.91 23.91 0 0 0 0 24c0 3.87.93 7.51 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.92-2.13 15.89-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

function currentMode(pathname: string): Mode {
  const part = pathname.split("/").filter(Boolean)[1];
  if (part === "signup" || part === "forgot" || part === "reset" || part === "verify") return part;
  return "login";
}

export default function AuthPage() {
  const [pathname, setLocation] = useLocation();
  const mode = currentMode(pathname);
  const { language, setLanguage } = useLocale();
  const c = copy[language === "ar" ? "ar" : "en"];
  const { user, ready, refresh, signOut } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setMessage("");
    setError("");
  }, [mode]);

  useEffect(() => {
    if (mode !== "verify") return;
    try {
      const pendingEmail = window.sessionStorage.getItem(PENDING_EMAIL_KEY);
      if (pendingEmail) setEmail(current => current || pendingEmail);
      else if (user?.email) setEmail(current => current || user.email);
    } catch {
      if (user?.email) setEmail(current => current || user.email);
    }
  }, [mode, user?.email]);

  const isRegistration = mode === "signup";
  const isReset = mode === "reset";
  const isForgot = mode === "forgot";
  const isVerify = mode === "verify";
  const isSignIn = mode === "login";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    if (!neon) {
      setError(c.unconfigured);
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email) || ((isSignIn || isRegistration || isReset) && password.length < 8)) {
      setError(c.invalid);
      return;
    }
    if ((isRegistration || isReset) && password !== confirmPassword) {
      setError(c.mismatch);
      return;
    }
    setBusy(true);
    try {
      if (isRegistration) {
        const result = await neon.auth.signUp.email({ email, password, name: name.trim() || email.split("@")[0] });
        if (result.error) throw new Error(result.error.message);
        await refresh();
        if (result.data?.user && !result.data.user.emailVerified) {
          // The current Neon Auth setup uses email verification codes, not links.
          // Preserve the email across the route change without placing it in a URL.
          try { window.sessionStorage.setItem(PENDING_EMAIL_KEY, email); } catch { /* disabled storage */ }
          try {
            const sent = await neon.auth.emailOtp.sendVerificationOtp({
              email, type: "email-verification",
            });
            if (sent.error) console.warn("Unable to send verification code", sent.error.message);
          } catch (sendError) {
            console.warn("Verification code delivery unavailable", sendError);
          }
          setLocation("/auth/verify");
        } else {
          setMessage(c.created);
        }
      } else if (isSignIn) {
        const result = await neon.auth.signIn.email({ email, password });
        if (result.error) throw new Error(result.error.message);
        await refresh();
        setLocation("/dashboard");
      } else if (isForgot) {
        const result = await neon.auth.requestPasswordReset({ email, redirectTo: window.location.origin + "/auth/reset" });
        if (result.error) throw new Error(result.error.message);
        setMessage(c.sent);
      } else if (isReset) {
        const token = new URLSearchParams(window.location.search).get("token");
        if (!token || !neonAuthBaseUrl) throw new Error(c.noToken);
        // Better Auth's documented password reset endpoint consumes the emailed one-time token.
        const response = await fetch(neonAuthBaseUrl + "/reset-password", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, newPassword: password }),
        });
        if (!response.ok) throw new Error("The reset link is invalid or expired. Request another.");
        setMessage(c.updated);
        setTimeout(() => setLocation("/auth/login"), 1100);
      } else if (isVerify) {
        const code = verificationCode.trim();
        if (!/^\\d{4,10}$/.test(code)) throw new Error(c.invalidCode);
        const result = await neon.auth.emailOtp.verifyEmail({ email, otp: code });
        if (result.error) throw new Error(result.error.message);
        setVerificationCode("");
        try { window.sessionStorage.removeItem(PENDING_EMAIL_KEY); } catch { /* disabled storage */ }
        await refresh();
        setMessage(c.verified);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  async function resendVerificationCode() {
    setMessage("");
    setError("");
    if (!neon) {
      setError(c.unconfigured);
      return;
    }
    if (!/^\\S+@\\S+\\.\\S+$/.test(email)) {
      setError(c.invalid);
      return;
    }
    setBusy(true);
    try {
      const sent = await neon.auth.emailOtp.sendVerificationOtp({
        email, type: "email-verification",
      });
      if (sent.error) throw new Error(sent.error.message);
      try { window.sessionStorage.setItem(PENDING_EMAIL_KEY, email); } catch { /* disabled storage */ }
      setMessage(c.codeSent);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not send verification email");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setError("");
    if (!neon) {
      setError(c.unconfigured);
      return;
    }
    setBusy(true);
    try {
      // A tab-scoped marker lets the app recover if Neon returns to "/" despite
      // the requested dashboard URL. It is not used as proof of authentication.
      try { markGoogleOAuthStarted(window.sessionStorage); } catch { /* storage unavailable */ }
      const result = await neon.auth.signIn.social({
        provider: "google", callbackURL: window.location.origin + "/dashboard",
      });
      if (result.error) throw new Error(result.error.message);
    } catch (cause) {
      try { clearGoogleOAuthStarted(window.sessionStorage); } catch { /* storage unavailable */ }
      setError(cause instanceof Error ? cause.message : "Google authentication failed");
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!isVerify || !neon) return;
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) return;
    let cancelled = false;
    void neon.auth.verifyEmail({ query: { token } }).then(result => {
      if (cancelled) return;
      if (result.error) setError(result.error.message ?? "Verification failed");
      else {
        setMessage(c.verified);
        void refresh();
      }
    }).catch(cause => {
      if (!cancelled) setError(cause instanceof Error ? cause.message : "Could not verify email");
    });
    return () => { cancelled = true; };
  }, [isVerify, refresh, c.verified]);

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <header className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <a href="/" className="inline-flex items-center gap-3 font-semibold tracking-tight" aria-label="Focus Flow home">
          <img src="/brand/focus-flow-mark.png" alt="" className="h-10 w-10 rounded-xl object-contain" />
          <span className="text-lg">Focus Flow</span>
        </a>
        <div className="flex items-center gap-3">
          <button type="button" className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted" onClick={() => setLanguage(language === "ar" ? "en" : "ar")}>
            {language === "ar" ? "English" : "العربية"}
          </button>
          <ThemeToggle />
          <a href="/" aria-label={c.back} className="rounded-lg p-2 text-muted-foreground hover:bg-muted"><ArrowLeft size={18} /></a>
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
              <span className="text-sm font-medium">{c.badge1}</span>
              <CheckCircle2 className="ms-auto text-[#b7e7c9]" size={18} />
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-4 backdrop-blur-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15"><ShieldCheck size={20} /></span>
              <span className="text-sm font-medium">{c.badge2}</span>
              <CheckCircle2 className="ms-auto text-[#b7e7c9]" size={18} />
            </div>
          </div>
        </aside>

        <section className="mx-auto w-full max-w-md pb-8" aria-label="Authentication">
          <div className="mb-8">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-[var(--surface-accent)] px-3 py-1.5 text-xs font-semibold text-[var(--color-teal-foreground)]">
              <LockKeyhole size={13} /> {isRegistration ? c.signup : isForgot ? c.forgotTitle : isReset ? c.resetTitle : isVerify ? c.verifyTitle : c.login}
            </span>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {isRegistration ? c.create : isForgot ? c.forgotTitle : isReset ? c.resetTitle : isVerify ? c.verifyTitle : c.welcome}
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {isForgot ? c.forgotDesc : isReset ? c.resetDesc : isVerify ? c.verifyDesc : c.legal}
            </p>
          </div>

          {!neon && <div role="status" className="mb-5 rounded-xl border border-amber-400/50 bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">{c.unconfigured}</div>}
          {ready && user && !isForgot && !isReset && !isVerify ? (
            <div className="space-y-5 rounded-2xl border bg-card p-6">
              <div className="flex items-center gap-3"><CheckCircle2 className="text-emerald-600" /><span className="font-medium">{c.loggedIn}</span></div>
              <p className="break-all text-sm text-muted-foreground">{user.email}</p>
              {user.emailVerified === false && (
                <a className="block text-sm font-medium text-[var(--color-teal-foreground)] hover:underline" href="/auth/verify">
                  {c.verifyTitle}
                </a>
              )}
              <Button className="w-full" onClick={() => setLocation("/dashboard")}>{c.dashboard} <ArrowRight size={16} /></Button>
              <Button className="w-full" variant="outline" onClick={() => void signOut()}>{c.signOut}</Button>
            </div>
          ) : (
            <>
              {(isSignIn || isRegistration) && (
                <>
                  <Button variant="outline" type="button" className="h-12 w-full rounded-xl bg-card text-sm font-medium" onClick={() => void handleGoogle()} disabled={busy || !neon}>
                    <GoogleMark /> {c.google}
                  </Button>
                  <div className="my-6 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="h-px flex-1 bg-border" /><span>{c.or}</span><span className="h-px flex-1 bg-border" />
                  </div>
                </>
              )}
              <form onSubmit={event => void handleSubmit(event)} className="space-y-4">
                {isRegistration && (
                  <div className="space-y-2">
                    <label htmlFor="auth-name" className="block text-sm font-medium">{c.name}</label>
                    <div className="relative"><UserRound size={17} className="pointer-events-none absolute start-3 top-3.5 text-muted-foreground" /><Input id="auth-name" autoComplete="name" required maxLength={80} value={name} onChange={e => setName(e.target.value)} className="h-12 rounded-xl ps-10" /></div>
                  </div>
                )}
                <div className="space-y-2">
                  <label htmlFor="auth-email" className="block text-sm font-medium">{c.email}</label>
                  <div className="relative"><Mail size={17} className="pointer-events-none absolute start-3 top-3.5 text-muted-foreground" /><Input id="auth-email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} className="h-12 rounded-xl ps-10" placeholder="you@example.com" /></div>
                </div>
                {isVerify && (
                  <div className="space-y-2">
                    <label htmlFor="auth-verification-code" className="block text-sm font-medium">{c.verificationCode}</label>
                    <Input
                      id="auth-verification-code"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoComplete="one-time-code"
                      maxLength={10}
                      required
                      value={verificationCode}
                      onChange={event => setVerificationCode(event.target.value)}
                      className="h-12 rounded-xl"
                    />
                  </div>
                )}
                {(isSignIn || isRegistration || isReset) && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <label htmlFor="auth-password" className="block text-sm font-medium">{c.password}</label>
                      {isSignIn && <a className="text-xs font-medium text-[var(--color-teal-foreground)] hover:underline" href="/auth/forgot">{c.forgot}</a>}
                    </div>
                    <div className="relative">
                      <LockKeyhole size={17} className="pointer-events-none absolute start-3 top-3.5 text-muted-foreground" />
                      <Input id="auth-password" type={showPassword ? "text" : "password"} minLength={8} autoComplete={isSignIn ? "current-password" : "new-password"} required value={password} onChange={e => setPassword(e.target.value)} className="h-12 rounded-xl ps-10 pe-12" />
                      <button type="button" aria-label={showPassword ? c.hide : c.show} className="absolute end-3 top-3 rounded p-1 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(v => !v)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
                    </div>
                  </div>
                )}
                {(isRegistration || isReset) && (
                  <div className="space-y-2">
                    <label htmlFor="auth-confirm" className="block text-sm font-medium">{c.confirmPassword}</label>
                    <Input id="auth-confirm" type={showPassword ? "text" : "password"} minLength={8} autoComplete="new-password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="h-12 rounded-xl" />
                  </div>
                )}
                {error && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</p>}
                {message && <p role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm text-foreground">{message}</p>}
                <Button type="submit" className="h-12 w-full rounded-xl bg-[var(--color-teal-dark)] font-semibold text-white hover:opacity-90 dark:bg-[var(--color-teal)] dark:text-slate-950" disabled={busy || !neon}>
                  {busy ? c.loading : isRegistration ? c.signup : isForgot ? c.sendLink : isReset ? c.resetButton : isVerify ? c.verifyCode : c.login} <ArrowRight size={17} />
                </Button>
              </form>

              {isVerify && (
                <Button
                  type="button"
                  variant="ghost"
                  className="mt-4 w-full text-sm"
                  disabled={busy || !neon}
                  onClick={() => void resendVerificationCode()}
                >
                  {c.resend}
                </Button>
              )}

              {(isSignIn || isRegistration) ? (
                <p className="mt-6 text-center text-sm text-muted-foreground">
                  {isRegistration ? c.hasAccount : c.noAccount}{" "}
                  <a className="font-semibold text-[var(--color-teal-foreground)] hover:underline" href={isRegistration ? "/auth/login" : "/auth/signup"}>{isRegistration ? c.login : c.signup}</a>
                </p>
              ) : (
                <a className="mt-6 block text-center text-sm font-semibold text-[var(--color-teal-foreground)] hover:underline" href="/auth/login">{c.back}</a>
              )}
            </>
          )}

          <div className="my-8 h-px bg-border" />
          <a href="/dashboard" onClick={() => { try { clearGoogleOAuthStarted(window.sessionStorage); } catch { /* storage unavailable */ } localStorage.setItem("focusflow_guest_chosen", "true"); }} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl border border-border bg-muted/40 px-5 py-3 text-sm font-semibold transition-colors hover:bg-muted">
            <UserRound size={18} /> {c.guest} <ArrowRight size={17} />
          </a>
          <p className="mt-3 text-center text-xs leading-5 text-muted-foreground">{c.guestNote}</p>
        </section>
      </div>
    </div>
  );
}
