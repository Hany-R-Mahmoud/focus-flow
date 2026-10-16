# Focus Flow — Neon production readiness checklist

Updated **2026-10-16**. **Not merged, not released to Production**. See [detailed release handoff](./PRODUCTION_RELEASE_HANDOFF.md) and [final Codex setup handover](./CODEX_FINAL_RELEASE_HANDOVER.md).

## Verified

- [x] Supabase SDK removed from the active migration frontend; Neon Managed Better Auth, Data API and signed-in Group Session integration implemented.
- [x] Separate Neon production and preview projects, both with Group Session schema and RLS.
- [x] Database grants checked: anonymous users cannot invoke connected group RPCs; authenticated role receives the intended RPC privileges, and the internal rate-limit RPC is not exposed for direct invocation.
- [x] Production Vercel `VITE_NEON_URL` points to the production Neon project. Preview uses the separate preview project.
- [x] Existing production URL `https://focus-session-flow.vercel.app` is verified in the same Vercel project and remains unchanged.
- [x] Owner confirmed successful Google Sign-In and return to dashboard on an earlier Preview; prior Codex checks covered session refresh and logout/guest return.
- [x] Fixed waiting for Neon identity before resolving invitation links; Group Session presence now reconnects after account restoration; cloud-create failure cleans up the local draft.
- [x] Added numeric email verification code and resend support matching the configured Neon Auth verification method.
- [x] Rebuilt and committed `pnpm-lock.yaml` using pnpm 10.4.1; Vercel install restored to **`pnpm install --frozen-lockfile`**.
- [x] Latest source code at commit `9643e064` passed sandbox `pnpm install --frozen-lockfile --ignore-scripts`, TypeScript, 46/46 Vitest tests, 4/4 Neon environment tests and a complete production-style build. Build sandbox was stopped afterward.
- [x] Vercel Preview for older commit `6d81d5a2` is READY, including frozen-lockfile install and Neon endpoint guard.

## Not verified / blockers before public launch or approval to merge

- [ ] **Newest Preview**: Vercel returned HTTP 402 due to its **100 API deployments/day limit** on 2026-10-16. No deployment for the latest code has been verified. Retry only when the limit resets, without changing billing/plan.
- [ ] **Production SMTP**: production Neon Auth still uses shared email delivery, which is for development. Configure a verified custom SMTP provider. Test email verification (OTP), sign-up, reset-password delivery and sign-in.
- [ ] **Email verification requirement**: Neon production configuration currently allows sign-in without email verification. After SMTP is configured and verified, require verification and use **numeric OTP** (current UI), not verification links.
- [ ] **Google public access**: custom credentials are configured, but Google Consent's last verified state is **Testing**; confirm it has been published to Production for non-test users.
- [ ] **Neon Auth localhost**: production project currently allows localhost; disable localhost on Production Auth before public release, preserving separate Preview/local development.
- [ ] **Authenticated Group Sessions E2E**: two independent Preview accounts must prove create/join/live roster/leave/reconnect/owner cancellation/non-owner denial.
- [ ] **Live post-deployment smoke**: after owner's final approval and merge, check Guest Mode, Google login, email login, group rooms, browser-local IndexedDB data continuity and production logs.

## Final approval/release sequence

1. Complete the external Google/SMTP and Preview E2E work per `docs/CODEX_FINAL_RELEASE_HANDOVER.md`.
2. Check the *current* PR head and a `READY` Vercel Preview whose logs show frozen-install, TypeScript, tests and build.
3. Ask the owner to approve PR #2 explicitly. Do not merge on their behalf.
4. When approved, merge into `main` and let Vercel **rebuild with Production environment**. Do not promote a Preview build with a Preview database.
5. Verify the unchanged production URL, then remove obsolete Supabase/Turnstile env variables. Keep previous production deployment as rollback until confirmed.

**Production deployment remains unchanged.** Personal focus history, notes and timers remain in browser IndexedDB; signing in does not automatically sync them across devices. Historical Supabase data was intentionally not migrated.
