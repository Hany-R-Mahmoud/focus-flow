# Focus Flow — Neon migration status

Updated: 2026-10-16

## Status: implementation prepared, final owner merge pending

The migration branch is `migration/neon-backend`. Pull request: https://github.com/Hany-R-Mahmoud/focus-flow/pull/2 (Draft, not merged). Existing Vercel Production URL and older deployment remain unchanged.

- **Account:** Neon Managed Better Auth with Google social sign-in. Neon Email/Password is disabled on Preview and Production. The new UI offers Google or Guest only; switching to Guest signs out first, preserving private local data.
- **Private data:** Focus timers, templates, notes and reviews remain local in IndexedDB, with no automatic cross-device sync.
- **Collaboration:** Signed-in Group Sessions use Neon Data API, RLS, membership authorization, SQL rate limiting and heartbeat presence. Guest invitations remain browser-local.
- **Environment:** Separate Neon Preview and Production projects; scoped public Vercel database URLs validated by build guards. Lockfile is committed with frozen pnpm install.
- **Legal:** Public static `/privacy.html` and `/terms.html` are committed and linked from homepage and login. They are not live on the Production URL until merge and deployment; existing `.vercel.app` shared hosting may not satisfy Google's owned-domain check.
- **Test results:** Latest Google-only app code passed an isolated Linux frozen install, TypeScript, 46 Vitest tests and Vite build. Both legal HTML pages were present in the output. Previous Google Sign-In succeeded on an older Preview as reported by the owner. The latest code has not yet been verified through a new Vercel browser session.

## Remaining before public Google login
1. Google Auth Platform still last known in **Testing**. Once legal pages are live, submit exact policy links and attempt Google domain verification/publishing. Free shared Vercel hosting may be rejected; do not claim public Google access without confirmation.
2. Until then, only whitelisted Google test users can sign in. Everyone can use Guest Mode.
3. Connected Group Sessions multi-account E2E remains unverified. Production pilot should be treated as limited and reversible.
4. Owner explicitly approves and merges PR #2; Vercel then builds new Production artifacts using the Production Neon URL, not Preview.

**SMTP and email password reset are not release requirements** because the entire email/password feature is disabled.

For steps and rollback see [NEON_GO_LIVE_CHECKLIST.md](./NEON_GO_LIVE_CHECKLIST.md) and [PRODUCTION_RELEASE_HANDOFF.md](./PRODUCTION_RELEASE_HANDOFF.md).
