---
target: client/src/pages/Home.tsx and Calm Start landing concept
total_score: 18
p0_count: 1
p1_count: 2
timestamp: 2026-07-17T23-23-32Z
slug: client-src-pages-home-tsx
---
# Focus Flow Landing Page Critique

Target: `client/src/pages/Home.tsx` and the proposed Calm Start landing direction.

Status: concept review. The landing page is not implemented. `Home.tsx` currently redirects `/` to `/dashboard`.

## Design Health Score

| Heuristic | Score | Key issue |
|---|---:|---|
| Visibility of system status | 1/4 | Landing concept does not yet expose a real session state or route state. |
| Match with real world | 3/4 | Plan, focus, capture, and review map well to the product. |
| User control and freedom | 1/4 | Root route and dashboard destination are unresolved. |
| Consistency and standards | 1/4 | Public landing shell is not separated from the app shell. |
| Error prevention | 2/4 | Privacy and group-session limitations need explicit copy. |
| Recognition rather than recall | 3/4 | A real dashboard preview would make the product legible. |
| Flexibility and efficiency | 1/4 | Returning users may be forced through marketing first. |
| Aesthetic and minimalist design | 3/4 | Calm direction fits, but the section stack risks SaaS sameness. |
| Error recovery | 1/4 | No defined route, offline, or link-recovery states. |
| Help and documentation | 2/4 | Privacy and group-session behavior need one concise explanation. |
| **Total** | **18/40** | **Promising concept, incomplete product contract.** |

## Technical Audit Health

| Dimension | Score | Key finding |
|---|---:|---|
| Accessibility | 1/4 | No landing markup exists to verify. |
| Performance | 4/4 | No landing render or asset cost yet. |
| Theming | 3/4 | Existing semantic tokens are available and should be reused. |
| Responsive design | 1/4 | No landing behavior exists; the fixed mobile app navigation must be accounted for. |
| Anti-patterns | 4/4 | Current target has no visual anti-patterns, but the proposed card stack has slop risk. |
| **Total** | **13/20** | **Acceptable only because the surface is unimplemented.** |

## Anti-Patterns Verdict

Conditional pass. The warm teal direction is on-brand. The proposed hero, dashboard mockup, three benefits, group section, and final CTA is a familiar SaaS landing template. Avoid identical icon cards, repeated eyebrows, fake live avatars, gradients, and generic productivity claims.

## What Works

- Warm, calm tone matches Focus Flow's existing design system.
- A real dashboard preview can show planning, timer, distraction capture, and review without abstract claims.
- Group sessions create a differentiated story if described as invite-link coordination, not live cloud presence.

## Priority Issues

### P0. Route and shell contradiction

`/` currently redirects to `/dashboard`, while the global app shell always mounts the sidebar. A landing page inside that shell will feel like an app screen, and the current Dashboard nav points to `/`.

Fix: make `/` a public landing route, render it without the sidebar, point Dashboard navigation to `/dashboard`, and keep `/dashboard` as the direct app entry.

### P1. Returning-user friction

Focus Flow serves people who often want to start work immediately. A marketing page at `/` can become a needless detour.

Fix: keep `Open dashboard` visible in the public header and use `Start a focus session` as the hero CTA. Do not add first-visit detection until the route policy is proven.

### P1. Group-session overpromise

Live rosters, online indicators, or synchronized avatars would conflict with the local-only product contract.

Fix: show an invitation link, shared objective, and local privacy note. Say exactly what is shared and what stays in the browser.

### P2. Generic section stack and CTA ambiguity

Three repeated benefit cards plus several CTA repetitions read like generated SaaS scaffolding. “Open dashboard” is weak as the first action.

Fix: use three varied product moments: plan the session, stay with the timer, review interruptions. Keep one primary CTA and one group-session secondary action.

### P2. Unspecified responsive and accessibility behavior

The proposal does not define mobile layout, heading hierarchy, focus states, reduced motion, or preview contrast.

Fix: reserve mobile bottom-nav space only inside the app shell, not the public page; use semantic sections, one h1, balanced headings, visible focus, AA contrast, and reduced-motion fallbacks.

## Refined Direction

**Name:** Calm Start.

**Hero copy:** “Plan a session, then get out of the way.”

**Supporting copy:** “Set an intention, run the timer, capture distractions, and review what happened.”

**Primary CTA:** `Start a focus session` → `/dashboard`.

**Secondary CTA:** `Create a group session` → `/create-group-session`.

**Header utility:** `Open dashboard` → `/dashboard`.

**Visual:** a real or clearly labeled representative dashboard preview. No fake live presence.

**Page rhythm:** hero, product preview, three varied product moments, one group-session invitation strip, final CTA.

Use existing Geist and teal tokens. Borrow Notion's warm, soft-surface discipline, not its brand colors or illustrations. Borrow Linear's product-screenshot discipline, not its dark theme. The collection describes Notion as warm minimalism with soft surfaces and Linear as a dark, precise, screenshot-led system. ([Notion](https://getdesign.md/notion/design-md), [Linear](https://getdesign.md/linear.app/design-md))

## Persona Red Flags

- Returning knowledge worker: may hit a promotional detour instead of the dashboard.
- Privacy-conscious student or freelancer: may read group visuals as cloud presence or surveillance.
- Group participant: needs a clear explanation of invitation links, local identity, and sharing limits.

## Minor Observations

- Keep the marketing hero distinct from the existing Dashboard hero.
- Do not turn teal into a decorative background color everywhere; reserve it for focus actions and active states.
- Label the dashboard preview as representative unless it uses real local data.

## Questions

1. Root route: `/` landing and `/dashboard` app, or landing at `/welcome` with `/` staying dashboard?
2. Hero CTA: `Start a focus session`, `Open dashboard`, or `Create a group session`?
3. Should returning local users ever bypass the landing page, or should the header always provide the direct dashboard path?
