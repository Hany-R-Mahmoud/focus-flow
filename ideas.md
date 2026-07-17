# FocusSessionFlow Design Direction

## Design Philosophy: Minimal Clarity

**Theme Name:** Minimal Clarity  
**Aesthetic:** Clean, purposeful, and calming. A workspace designed for deep focus without visual noise.  
**Emotional Intent:** Confidence, clarity, and control. Users feel in command of their focus time.

---

## Design Movement
**Swiss-inspired Modernism** with influences from productivity tools (Notion, Linear, Bear). Emphasis on information hierarchy, breathing room, and purposeful restraint.

## Core Principles
1. **Clarity over decoration** — Every pixel serves a function. No gradients, no animations without purpose.
2. **Breathing room** — Generous whitespace and vertical rhythm create calm and reduce cognitive load.
3. **Purposeful color** — One ownable accent color (teal/cyan) paired with a neutral scale. Color highlights intent, not decoration.
4. **Progressive disclosure** — Show what matters now; hide complexity until needed.

## Color Philosophy
- **Primary Accent:** `oklch(0.55 0.15 200)` — A calm, confident teal. Signals focus and clarity.
- **Neutral Scale:** Warm grays (`oklch(0.95 0.001 0)` to `oklch(0.2 0.002 0)`) for text and backgrounds.
- **Semantic Colors:** Red for destructive actions, green for completion, amber for warnings.
- **Rationale:** Teal is psychologically associated with calm and focus. Warm neutrals feel human and approachable, not sterile.

## Layout Paradigm
- **Sidebar navigation** on desktop (left, persistent). Mobile uses bottom tab bar.
- **Content area** with max-width constraint (1200px) for readability.
- **Card-based sections** with consistent 16px padding and subtle borders.
- **Asymmetric grid:** Dashboard uses a 2-column layout with varied card heights (not uniform).

## Signature Elements
1. **Focus ring indicator** — A subtle teal ring around active timer or focused input. Reinforces the "focus" metaphor.
2. **Session card with time badge** — Each session shows duration and status in a compact, scannable format.
3. **Distraction counter** — A small, unobtrusive badge showing distractions logged during a session.

## Interaction Philosophy
- **Instant feedback:** Buttons respond immediately (no loading spinners for local actions).
- **Confirmation for destructive actions:** Delete, reset, or clear data requires a second click.
- **Undo where possible:** Session deletions can be undone within the session.
- **Keyboard-first:** All primary actions have keyboard shortcuts (e.g., `Cmd+N` for new session).

## Animation
- **Entrance:** Cards fade in and slide up 8px over 200ms (ease-out). Stagger by 30ms per item.
- **Hover:** Buttons scale to 0.98 and shift shadow on hover (100ms ease-out).
- **Timer:** Smooth number transitions (no spinning or flashing). Color shift to green on completion.
- **Modals:** Slide up from bottom on mobile, fade in from center on desktop (250ms ease-out).
- **Respect `prefers-reduced-motion`:** Disable all animations if user preference is set.

## Typography System
- **Display:** `Geist` (bold, 32px, 1.2 line-height) for page titles.
- **Heading:** `Geist` (semibold, 20px) for section headers.
- **Body:** `Geist Mono` (regular, 14px, 1.6 line-height) for readable text. Monospace reinforces the "focus" aesthetic.
- **UI labels:** `Geist` (medium, 12px, uppercase, 0.05em letter-spacing) for buttons and form labels.
- **Hierarchy:** Weight and size drive hierarchy, not color.

## Brand Essence
**Positioning:** The calm, clear way to plan and track focused work without complexity.  
**For:** Students, freelancers, and knowledge workers who want to understand their focus patterns.  
**Why it's different:** No gamification, no social features, no complexity. Just focus.

**Personality:** Grounded, honest, purposeful.

## Brand Voice
**Tone:** Direct, encouraging, honest. No corporate jargon or false urgency.

**Example Headlines:**
- "Plan your focus. Track your time. Understand your patterns."
- "Start a session. Capture distractions. Review what happened."

**Example CTAs:**
- "Begin session" (not "Get started")
- "Log distraction" (not "Add a note")
- "Export my data" (not "Download")

## Wordmark & Logo
**Logo Concept:** A minimalist focus icon — a circle with a subtle crosshair or target in the center, rendered in teal. No text. Scalable and recognizable at any size.

## Signature Brand Color
**Teal:** `oklch(0.55 0.15 200)` — Calm, focused, confident. Used for primary actions, active states, and the logo.

---

## Design Tokens (CSS Variables)

```css
/* Spacing */
--space-xs: 4px;
--space-sm: 8px;
--space-md: 16px;
--space-lg: 24px;
--space-xl: 32px;

/* Typography */
--font-display: "Geist", system-ui, sans-serif;
--font-body: "Geist Mono", monospace;
--font-size-sm: 12px;
--font-size-base: 14px;
--font-size-lg: 16px;
--font-size-xl: 20px;
--font-size-2xl: 32px;

/* Colors */
--color-teal: oklch(0.55 0.15 200);
--color-teal-light: oklch(0.85 0.08 200);
--color-teal-dark: oklch(0.35 0.12 200);
--color-success: oklch(0.65 0.15 140);
--color-warning: oklch(0.75 0.18 60);
--color-error: oklch(0.6 0.2 30);

/* Shadows */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
```
