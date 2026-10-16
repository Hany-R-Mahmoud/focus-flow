# Focus Flow — Neon release checklist

Updated: 2026-10-16. **Implementation prepared, no merge or Production cutover.** PR: https://github.com/Hany-R-Mahmoud/focus-flow/pull/2

## Completed
- [x] Two independent Neon databases: Preview and Production; Managed Better Auth + Data API. Both now have **Email/Password disabled**, Google OAuth provider configured, and separate trusted origins.
- [x] Application sign-in UI simplified to **Google** or **Continue as Guest** (English/Arabic). Old signup, reset-password and email-OTP forms are removed from the frontend. Switching from a Google account to guest explicitly signs out without erasing local IndexedDB data.
- [x] Google dashboard-return recovery remains; group sessions, RLS, rate-limit RPCs and membership are Neon-backed for signed-in accounts.
- [x] Existing offline personal focus history, reviews and notes stay locally in browser storage, not synchronized on Google login.
- [x] Public static `/privacy.html` and `/terms.html` files committed and linked from homepage and sign-in UI. The privacy notice also discloses Vercel Analytics and the standalone visitor counter.
- [x] Vercel Preview and Production `VITE_NEON_URL` point to separate, correct Neon endpoints and the build guard prevents crossed environments.
- [x] Reproducible pnpm lockfile and frozen install retained. Latest **Google-only app code** passed isolated `pnpm install --frozen-lockfile`, TypeScript, 46/46 Vitest tests and build. The generated output contained both legal pages.
- [x] Owner previously confirmed Google sign-in worked on an earlier Preview. A later older-code Preview is READY on Vercel.
- [x] Production domain `https://focus-session-flow.vercel.app` remains in the original Vercel project. Existing Production release is still unchanged.

## Remaining gates and constraints
- [ ] **Fresh Preview deployment** of the latest Google-only UI and public static policy pages (Git integration is not yet confirmed READY for the latest commit). Unit/build validation is not browser E2E.
- [ ] **Google branding publishing:** the public live site must serve the policy pages and Google Branding needs URLs for homepage, `https://focus-session-flow.vercel.app/privacy.html`, and `https://focus-session-flow.vercel.app/terms.html`. These pages are **not live at production until the PR merges**. Google additionally requires domain ownership verification for public OAuth publishing. The free shared `.vercel.app` hostname may not satisfy this; try verification before making any promises or buying a domain.
- [ ] **Limited rollout:** Google OAuth is currently in **Testing**, so only Google's approved test users can sign in. Everyone can use Guest Mode. Public Google sign-in must not be advertised as generally available until the Google publishing steps succeed.
- [ ] Group Sessions two-account E2E has not been performed. User allows a lightweight Production pilot, but invalid sharing/authorization should be considered a release risk.
- [ ] User must **explicitly approve and merge** PR #2. The agent must not merge or publish Production on the user's behalf.

## Safe rollout order
1. Review the latest READY build and the actual content of policy and terms before publishing.
2. If the owner accepts a limited pilot and explicitly approves PR #2, merge to `main` and let Vercel build **fresh Production** artifacts with the Production Neon URL. Never promote Preview-built assets.
3. Smoke-test `https://focus-session-flow.vercel.app` as Guest and as a whitelisted Google test user, including refresh, sign-out and one connected Group Session.
4. Confirm `/privacy.html` and `/terms.html` are publicly reachable without login, then insert those exact URLs into Google Branding and attempt Search Console property verification and OAuth publication. **Google can still reject a free shared domain.**
5. Keep the old production Vercel deployment available for rollback. Remove obsolete Supabase/Turnstile env vars only after a successful rollout and a rollback check.

**Not a current requirement:** SMTP, email-password registration, password reset, or verification-by-email. These features are intentionally disabled because the owner doesn't have a verified sending domain.
