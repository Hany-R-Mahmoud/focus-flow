# Focus Flow — Production release handoff

Date: **2026-10-16**. Status: **PREPARED, NOT RELEASED**. Keep the existing production URL and **do not merge until all release blockers are resolved and the owner approves PR #2**.

## User-facing outcome

The release changes Focus Flow's optional connected identity and group-collaboration backend from Supabase to Neon while retaining the app's offline-first browser data. It **does not** migrate any historical Supabase data (explicitly waived by the owner). Personal timers, templates, review notes, and distractions remain in local IndexedDB for both guests and signed-in accounts; this is not account-based cross-device personal cloud sync.

- Production domain remains **https://focus-session-flow.vercel.app**, already assigned and verified in the same Vercel project.
- Existing `main` and its production deployment were **not modified or promoted**.
- Draft PR: https://github.com/Hany-R-Mahmoud/focus-flow/pull/2
- Branch: `migration/neon-backend` (merge this into `main` only after approval).
- Stable migration preview: https://focus-flow-git-migration-neon-backend-hany-mahmouds-projects.vercel.app

## Completed

1. **Neon isolated projects:** Default production Neon database and separate preview Neon database have their own managed auth, data API, and identical collaboration schema migrations. Preview requests do not intentionally reach production data.
2. **Vercel:** Production-scoped public `VITE_NEON_URL` was set to the *production* Neon endpoint in advance of release. Preview-scoped `VITE_NEON_URL` points at the *preview* Neon endpoint. Existing production deployment remains unaffected until a new build is released.
3. **Google OAuth:** Owner tested the preview Google login flow successfully after the dashboard-redirect fix. Login-session refresh and guest functionality were tested during earlier Codex browser verification. Production Google end-to-end login is not yet verified.
4. **Backend privilege audit:** Both Neon databases have the expected `group_sessions`, `group_session_participants`, and `focus_group_rate_limits` tables with RLS enabled. SQL catalog confirms `anonymous` **cannot EXECUTE** cloud create/join/read RPCs and `authenticated` can EXECUTE the public group RPCs. The internal rate-limit function is unavailable as a direct RPC.
5. **Build safety guard:** `scripts/check-neon-env.mjs` and `scripts/check-neon-env.test.mjs` reject missing URLs, HTTP/credential URLs, and accidentally swapped Preview/Production Neon hostnames. Vercel build command executes both this check and existing TypeScript, Vitest, and build checks.
6. **Supabase code migration:** The active migration branch no longer imports `@supabase/supabase-js` or uses the previous `client/src/lib/supabase.ts`. Transitional names inside the Neon compatibility layer remain but are aliases for the Neon SDK, not external calls.
7. **Guest mode:** Browsing, focus activity, and local invite sharing do not require an account. Guest local data is not removed on login/logout.

## Remaining blockers — do not mark as verified without evidence

1. **Custom SMTP / email delivery:** Neon Auth on the production branch still reports the default **shared** email sender. Neon calls for a **custom SMTP provider** before production use of email verification and password reset. Obtain a verified sending identity and credentials from a transactional email provider, store credentials only in Neon Auth's SMTP settings, enable and smoke-test the verification and reset flows. No SMTP secrets or providers have been configured by the agent. Link: https://neon.com/docs/auth/production-checklist
2. **Google general availability:** Google OAuth consent is in **Testing** mode (Codex browser handover). The approved test account works, but non-test users may be rejected. In Google Cloud Console move to Production/Publish app when public login is intended, after checking branding, scopes and OAuth verification requirements. This is separate from code/PR approval.
3. **Authenticated multi-user E2E:** Need two real preview test accounts and browser evidence for creating a connected group room, accepting invitations, member roster/heartbeat, leave/rejoin, owner cancellation, non-owner denial, plus an anonymous guest local-room regression. SQL grants and unit tests are not full E2E proof.
4. **Reproducible lockfile:** `pnpm-lock.yaml` committed in the branch predates the Neon SDK. A one-off isolated sandbox ran `pnpm install --lockfile-only`, then `pnpm install --frozen-lockfile`, `pnpm check`, `pnpm test` and `pnpm build` successfully; **the generated lockfile has not been checked in** due to a temporary artifact-export limitation. Vercel preview remains on `pnpm install --no-frozen-lockfile`. For a fully frozen release, run pnpm 10.4.1 against this branch, commit the generated `pnpm-lock.yaml`, change installCommand to `pnpm install --frozen-lockfile`, and verify a Preview build.
5. **Latest build guard:** Check that the Vercel Preview for the latest migration commit finishes `READY` and the guard reports the preview endpoint. The earlier version of the app had 46/46 passing tests; do not assume new changes pass until the new build completes.

## One-time final cutover steps (after blocker resolution and owner approval)

1. Confirm the approved PR head SHA and `main` base SHA and a `READY` Preview deployment with all configured auth scenarios verified.
2. Verify Production Vercel env points to primary Neon and Preview points to isolated preview Neon. Verify the live production domain's Auth trusted origin and Google's redirect URI before deployment.
3. **Merge PR #2 only after explicit approval**. Let Git integration build `main` using production variables. Avoid manually promoting a preview build that was compiled with preview variables.
4. Observe Vercel's production deployment for `READY` status. Confirm `https://focus-session-flow.vercel.app` serves the new frontend with Guest, Google, Email and group functions as designed.
5. Remove obsolete Supabase and Turnstile Vercel variables only **after** the new site and any intended rollback strategy have been checked. Keep historical Supabase resources untouched until no longer needed.
6. Roll back via the last known-good Vercel production deployment if production verification fails. This does not require changing the hostname.

## Scope and safety notes

- This PR must **not** be represented as a production cutover before a successful new `main` deployment.
- No external email credentials have been fabricated or placed in GitHub.
- Neon Auth Google OAuth client settings and secrets must stay in Neon/Google Console, never in `VITE_*`.
- A working Preview alone does not guarantee production email deliverability, general-access OAuth, or group authorization.
