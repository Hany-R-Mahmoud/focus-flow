# FocusSessionFlow Design System

## 1. Atmosphere & Identity

FocusSessionFlow is a warm, friendly focus companion: calm enough for deep work, encouraging enough to make returning easy. Its signature is clear state communication through soft teal emphasis, warm-neutral surfaces, and supportive copy rather than gamification.

## 2. Color

### Palette

| Role             | Token                | Usage                                  |
| ---------------- | -------------------- | -------------------------------------- |
| Surface          | `--background`       | Page background                        |
| Surface/elevated | `--card`             | Cards and focused panels               |
| Text/primary     | `--foreground`       | Headings and important values          |
| Text/secondary   | `--muted-foreground` | Supporting labels and helper text      |
| Border           | `--border`           | Dividers and control outlines          |
| Accent/action    | `--color-teal`       | Primary focus action backgrounds       |
| Accent/strong    | `--color-teal-dark`  | Accent hover backgrounds               |
| Accent/text      | `--color-teal-foreground` | Accent text and icons across themes |
| Status/info      | Blue utility tokens  | Invitation and informational panels    |
| Status/warning   | Amber utility tokens | Attention and paused states            |
| Status/error     | Destructive tokens   | Errors and destructive actions         |
| Dark surface     | `--surface-soft`     | Warm secondary sections and work wells |
| Dark focus       | `--surface-accent`   | Restrained focus emphasis              |

### Rules

- Use semantic Tailwind/CSS tokens already defined in `client/src/index.css`.
- Accent color is reserved for interactive focus actions and active states.
- Do not use color alone to communicate an interruption or session state.
- Dark mode uses the `.dark` token set, persisted under `focusflow_theme`, with
  the same semantic roles and a minimum 4.5:1 body-text contrast target.
- Dark direction: Warm Desk Lamp. Use warm charcoal canvas, warm-gray panels,
  ivory text, and muted teal only for focus actions/current state.
- Dark semantic surfaces: `--surface-soft`, `--surface-accent`,
  `--surface-info`, and `--surface-warm`; do not use decorative glow or raw
  light-theme opacity washes.

## 3. Typography

| Level                   | Usage                               |
| ----------------------- | ----------------------------------- |
| `text-3xl font-bold`    | Page and session titles             |
| `text-lg font-semibold` | Card and section titles             |
| `text-base`             | Primary content                     |
| `text-sm`               | Supporting information and controls |
| `text-xs`               | Metadata and helper copy            |
| `font-mono`             | Timer and numeric focus values      |

Font stack: self-hosted `Geist Variable`, then `Geist`, `system-ui`, sans-serif.
Use the existing scale; do not add display fonts for product UI.

## 4. Spacing & Layout

Use the existing 4px spacing rhythm through Tailwind utilities. Group-session pages use a centered `max-w-2xl` content column, vertical card stacks, and responsive action clusters that wrap on narrow screens.

## 5. Components

### Active session action cluster

- **Structure:** primary interruption action, secondary invite-link action, navigation action.
- **States:** default, hover, focus, disabled, copied, error.
- **Accessibility:** real buttons, visible labels, keyboard focus, copy feedback announced through the existing toast system.
- **Layout:** responsive cluster; primary action remains easy to reach.

### Interruption dialog

- **Structure:** dialog title, category select, optional note input, submit action.
- **States:** empty, submitting, success, error.
- **Accessibility:** visible labels, focusable controls, dialog semantics from the existing UI primitive.

### Local participation note

- **Structure:** concise informational panel explaining that the session is coordinated locally and personal interruptions remain private.
- **States:** informational only; never imply shared live participant presence.
- **Accessibility:** readable text with sufficient contrast.

## 6. Motion & Interaction

- Keep existing 150–250ms control transitions.
- Motion communicates copied, submitted, loading, or error state only.
- Respect reduced-motion preferences through existing global styles.

## 7. Depth & Surface

Use semantic borders and restrained elevation/tonal contrast. Warm dark mode
uses no decorative glow or gradient hero; depth comes from surface steps and
spacing.

## 8. Accessibility Constraints & Accepted Debt

### Constraints

- WCAG 2.2 AA target.
- Visible focus for every interactive control.
- Keyboard-reachable interruption and copy actions.
- Body text contrast at least 4.5:1.
- Never use hover as the only way to access information.

### Accepted Debt

| Item                           | Location               | Why accepted                                       | Exit                                  |
| ------------------------------ | ---------------------- | -------------------------------------------------- | ------------------------------------- |
| Shared live participant roster | Group-session surfaces | Explicitly out of scope for the local-only product | Revisit only if product scope changes |
