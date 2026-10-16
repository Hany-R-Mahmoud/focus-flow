# Focus Flow → Neon migration: implementation status

Last verified: **2026-10-16**.

## Current result
**Implementation committed on branch `migration/neon-backend`; Vercel Preview build READY. Production is unchanged.** This report replaces the earlier provisioning-only assessment.

- Neon Free Postgres database `focus_flow` provisioned in Frankfurt (project `bitter-heart-23681290`).
- Managed Better Auth provisioned and named **Focus Flow**, supporting Email/Password. Google has Neon-shared **development** OAuth, not production custom credentials. Password reset requires testing and custom SMTP before production.
- Neon Data API provisioned; guarded collaboration schema and functions applied and versioned under `neon/migrations/0001_group_collaboration.sql`.
- New auth UI with English/Arabic login, sign up, forgot/reset password, email verification and Google sign-in action; guest mode stays available without an account.
- AuthContext and Neon SDK integrated; Supabase JS client removed from active source and package manifest.
- Personal templates, timers, sessions, reviews and distractions remain in local IndexedDB for **both guests and signed-in users**. No account-based cloud sync for personal data is promised or implemented.
- Cloud group sessions via signed-in Neon Data API and database-level rate limit, RLS/membership checks, polling heartbeat online roster (no Supabase Realtime). Guests use original local-mode shareable group invitations.
- Vercel preview env includes `VITE_NEON_URL` public database HTTPS URL; production environment unchanged.
- Validated preview deployment `dpl_Army6si2R93SEa9NUi38SaMmypJW` (commit `c7efb093...`) `READY`. Logs confirm `pnpm check`, **37 passing Vitest tests** across 11 files, and `pnpm build`, producing auth/group/frontend assets.

## Remaining gates before production launch
1. Codex Google Cloud Console configuration and injecting custom OAuth credentials directly into Neon Auth, using `docs/CODEX_GOOGLE_CLOUD_HANDOVER.md`.
2. Custom SMTP (Neon Auth default shared sender is only for testing) and email verification/password reset E2E.
3. Multiple-account browser E2E for auth + group collaboration + guest data continuity, SQL RLS/authorization checks.
4. Regenerate **`pnpm-lock.yaml`** to pin the new Neon JS SDK, restore frozen lockfile install in `vercel.json`. Current preview install uses `--no-frozen-lockfile` only as temporary compatibility workaround.
5. Establish isolated preview Auth environment: cloned Neon child branch has inherited auth schema but cannot provision its own Neon Auth. Current Vercel preview points to primary Neon database.
6. Plan reviewed merge, production Vercel env cutover and tests, plus rollback.

## Links
- Preview: https://focus-flow-jbz616ka5-hany-mahmouds-projects.vercel.app
- Branch: https://github.com/Hany-R-Mahmoud/focus-flow/tree/migration/neon-backend
- Checklist: [NEON_GO_LIVE_CHECKLIST.md](./NEON_GO_LIVE_CHECKLIST.md)
- Codex handover: [CODEX_GOOGLE_CLOUD_HANDOVER.md](./CODEX_GOOGLE_CLOUD_HANDOVER.md)

**Do not describe production migration as complete without the outstanding acceptance tests and credentials.**
