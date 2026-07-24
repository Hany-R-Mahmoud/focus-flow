import {
  ArrowRight,
  Check,
  Clock3,
  Link2,
  Play,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";

const steps = [
  {
    icon: Sparkles,
    title: "Name what matters",
    description:
      "Start with a clear intention so your attention has somewhere to land.",
    tone: "bg-amber-50 text-amber-700",
  },
  {
    icon: Clock3,
    title: "Stay with the work",
    description:
      "Run a focused timer and capture distractions without leaving your session.",
    tone: "bg-teal-50 text-teal-700",
  },
  {
    icon: Check,
    title: "See what happened",
    description:
      "Review your time, interruptions, and patterns while they are still useful.",
    tone: "bg-sky-50 text-sky-700",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground">
      <header className="relative z-10 border-b border-border/70 bg-background/95">
        <div className="container flex h-20 items-center justify-between">
          <a
            href="/"
            className="flex items-center gap-3 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-teal)] focus-visible:ring-offset-4"
            aria-label="Focus Flow home"
          >
            <span className="flex size-9 items-center justify-center overflow-hidden rounded-xl border border-teal-100 bg-white shadow-sm">
              <img
                src="/brand/focus-flow-mark.png"
                alt=""
                className="size-9 object-contain"
              />
            </span>
            <span className="text-lg font-semibold tracking-tight">
              Focus Flow
            </span>
          </a>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button
              asChild
              variant="ghost"
              className="hidden text-muted-foreground sm:inline-flex"
            >
              <a href="/group-sessions">Group sessions</a>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-[var(--color-teal)]/30 bg-background hover:border-[var(--color-teal)] hover:bg-teal-50"
            >
              <a href="/dashboard">Open dashboard</a>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative">
          <div className="pointer-events-none absolute -right-32 top-12 size-80 rounded-full bg-teal-50/70 blur-3xl" />
          <div className="container grid gap-14 py-16 md:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)] md:items-center md:py-24 lg:gap-20 lg:py-28">
            <div className="relative max-w-xl">
              <p className="mb-6 flex items-center gap-2 text-sm font-medium text-[var(--color-teal-dark)]">
                <span
                  className="size-2 rounded-full bg-[var(--color-teal)]"
                  aria-hidden="true"
                />
                A quieter way to make time for what matters
              </p>
              <h1 className="max-w-2xl text-balance text-5xl font-semibold tracking-[-0.035em] text-foreground sm:text-6xl lg:text-7xl">
                Plan a session, then get out of the way.
              </h1>
              <p className="mt-7 max-w-xl text-pretty text-lg leading-8 text-muted-foreground sm:text-xl">
                Set an intention, run the timer, capture distractions, and
                review what happened. Focus Flow keeps the useful parts of a
                focus practice close at hand.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  asChild
                  size="lg"
                  className="h-12 bg-[var(--color-teal)] px-6 text-white hover:bg-[var(--color-teal-dark)]"
                >
                  <a href="/dashboard">
                    <Play size={18} fill="currentColor" aria-hidden="true" />
                    Start a focus session
                  </a>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  size="lg"
                  className="h-12 justify-start px-4 text-foreground hover:bg-teal-50 sm:justify-center"
                >
                  <a href="/create-group-session">
                    Create a group session
                    <ArrowRight size={17} aria-hidden="true" />
                  </a>
                </Button>
              </div>
              <p className="mt-5 text-sm text-muted-foreground">
                Personal focus notes stay on your device.
              </p>
            </div>

            <div className="relative mx-auto w-full max-w-2xl">
              <div
                className="absolute -inset-4 rounded-[2rem] bg-teal-50/60"
                aria-hidden="true"
              />
              <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-[0_18px_50px_-28px_rgba(15,118,110,0.5)]">
                <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-7">
                  <div>
                    <p className="text-sm font-semibold">Your next session</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Tuesday, 10:30 AM
                    </p>
                  </div>
                  <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700">
                    Ready
                  </span>
                </div>
                <div className="grid gap-6 p-5 sm:grid-cols-[1fr_0.9fr] sm:p-7">
                  <div className="rounded-xl bg-slate-50 p-5">
                    <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                      <span>Deep work</span>
                      <span>25 min</span>
                    </div>
                    <div className="mt-10 flex items-center justify-center">
                      <div className="flex size-40 items-center justify-center rounded-full border-[11px] border-teal-100 border-t-[var(--color-teal)] sm:size-48">
                        <div className="text-center">
                          <p className="font-mono text-4xl font-semibold tracking-tight text-foreground">
                            25:00
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            until a clear break
                          </p>
                        </div>
                      </div>
                    </div>
                    <a
                      href="/session/new"
                      className="mt-8 flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[var(--color-teal)] text-sm font-medium text-white transition-colors hover:bg-[var(--color-teal-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-teal)] focus-visible:ring-offset-2"
                    >
                      Start timer
                      <ArrowRight size={16} aria-hidden="true" />
                    </a>
                  </div>
                  <div className="flex flex-col justify-between gap-6">
                    <div>
                      <p className="text-sm font-semibold">
                        A little structure
                      </p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        Keep the plan visible, let the rest wait.
                      </p>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 rounded-lg border border-border bg-background p-3">
                        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-amber-50 text-amber-700">
                          <Sparkles size={15} aria-hidden="true" />
                        </span>
                        <div>
                          <p className="text-xs font-medium">Intention</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Draft the project brief
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 rounded-lg border border-border bg-background p-3">
                        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-sky-50 text-sky-700">
                          <Link2 size={15} aria-hidden="true" />
                        </span>
                        <div>
                          <p className="text-xs font-medium">Distractions</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            3 notes captured privately
                          </p>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs leading-5 text-muted-foreground">
                      A representative view of the focus workspace.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-border/70 bg-slate-50/60">
          <div className="container py-20 sm:py-24">
            <div className="max-w-2xl">
              <h2 className="text-balance text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">
                Your focus, in a simple loop.
              </h2>
              <p className="mt-4 text-lg leading-8 text-muted-foreground">
                Enough structure to begin and enough room to do the work your
                way.
              </p>
            </div>
            <div className="mt-12 divide-y divide-border border-y border-border">
              {steps.map(step => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.title}
                    className="grid gap-5 py-7 sm:grid-cols-[auto_0.8fr_1.2fr] sm:items-center sm:gap-8"
                  >
                    <span
                      className={`flex size-11 items-center justify-center rounded-xl ${step.tone}`}
                    >
                      <Icon size={20} aria-hidden="true" />
                    </span>
                    <h3 className="text-xl font-semibold tracking-tight">
                      {step.title}
                    </h3>
                    <p className="max-w-lg text-base leading-7 text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="container py-20 sm:py-24">
          <div className="grid gap-10 rounded-2xl bg-[var(--color-teal-dark)] p-7 text-white sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center lg:p-14">
            <div className="max-w-2xl">
              <div className="mb-5 flex size-11 items-center justify-center rounded-xl bg-white/10">
                <Users size={22} aria-hidden="true" />
              </div>
              <h2 className="text-balance text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">
                Focus together, keep your own notes.
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-teal-50/85">
                Create a session, share the invitation link, and start at the
                same time. Your intention and interruptions remain private on
                your device.
              </p>
            </div>
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="h-12 w-full bg-white px-6 text-[var(--color-teal-dark)] hover:bg-teal-50 lg:w-auto"
            >
              <a href="/create-group-session">
                Create a group session
                <ArrowRight size={17} aria-hidden="true" />
              </a>
            </Button>
          </div>
        </section>

        <section className="border-t border-border/70 bg-slate-50/60">
          <div className="container flex flex-col gap-7 py-16 sm:flex-row sm:items-center sm:justify-between sm:py-20">
            <div>
              <h2 className="text-balance text-3xl font-semibold tracking-[-0.025em]">
                Pause everything else.
              </h2>
              <p className="mt-3 text-base text-muted-foreground">
                Your next focused hour can start here.
              </p>
            </div>
            <Button
              asChild
              size="lg"
              className="h-12 w-full bg-[var(--color-teal)] px-6 text-white hover:bg-[var(--color-teal-dark)] sm:w-auto"
            >
              <a href="/dashboard">
                Start a focus session
                <ArrowRight size={17} aria-hidden="true" />
              </a>
            </Button>
          </div>
        </section>
      </main>

      <footer className="container flex flex-col gap-3 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>Focus Flow, a calmer way to work with your attention.</p>
        <a
          href="/settings"
          className="w-fit underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-teal)] focus-visible:ring-offset-4"
        >
          Privacy and settings
        </a>
      </footer>
    </div>
  );
}
