# Neon Go-Live Checklist — Focus Flow

Updated: **2026-10-16**. **Not merged and not deployed to Production.** Authoritative detailed handoff: [PRODUCTION_RELEASE_HANDOFF.md](./PRODUCTION_RELEASE_HANDOFF.md).

## Verified

- [x] Code migrated from Supabase JS SDK to Neon Auth and Neon Data API.
- [x] Production Neon backend exists, and isolated separate Preview Neon backend exists.
- [x] Group collaboration schema and RLS on both Neon backends.
- [x] SQL privilege checks: `anonymous` cannot call group RPCs, `authenticated` can call public group RPCs; internal rate-limit RPC cannot be called by end users.
- [x] Vercel `VITE_NEON_URL` created for **Production**, pointing to Production Neon. Preview uses the separate Preview Neon.
- [x] Existing Vercel production domain is assigned to the same project: https://focus-session-flow.vercel.app.
- [x] Google sign-in and dashboard return on Preview succeeded according to owner's test; prior Codex test verified persistence after refresh and sign-out.
- [x] Original migration preview: `46/46` Vitest tests passed, TypeScript and production build passed.
- [x] New Preview/Production Neon endpoint build guard and Node unit tests committed to migration branch.

## Release blockers

- [ ] Reliable **custom SMTP** sender configured under Production Neon Auth, with email verification and password recovery smoke tests. Current provider is shared/development.
- [ ] Google Cloud Console consent published to Production for users other than allowlisted testers (currently Testing); only needed before public sign-in launch, but must not be forgotten.
- [ ] Browser end-to-end tests with **two different authenticated accounts** for group create/join/leave/live roster/owner cancellation and RLS/permission denial.
- [ ] Check in regenerated `pnpm-lock.yaml` and restore `pnpm install --frozen-lockfile`. Reproduction via an isolated sandbox **passed locally**, but the generated lockfile is not yet in GitHub. Vercel uses temporary `--no-frozen-lockfile`.
- [ ] Check current head commit's Vercel Preview `READY`, with new environment build guard tests passing.
- [ ] Owner approves PR #2 for merge.

## After the owner's final approval

- Merge https://github.com/Hany-R-Mahmoud/focus-flow/pull/2 into `main`.
- Let Vercel Production rebuild using Production Neon env. Never promote a Preview build with Preview database env directly.
- Smoke-test https://focus-session-flow.vercel.app for Google + email + guest + group-room flow.
- After successful production smoke tests, delete obsolete Supabase/Turnstile Production variables and confirm safe rollback to previous production deployment.

**Production remains unchanged, and all historical Supabase resources remain untouched.**
