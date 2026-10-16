# Focus Flow → Neon migration status

Updated **2026-10-16**. Current status: **code implementation completed and independently built; production release pending external readiness and owner approval**.

## Changes implemented

- Migrated active frontend Supabase SDK integrations to Neon Managed Better Auth + Data API.
- Full English/Arabic account entry with Email/Password, Google Sign-In, numeric verification-code entry and resend, password reset, and Continue as Guest.
- Guest timers, local history and private focus reviews remain in IndexedDB; account authentication does not silently sync private data or delete guest history.
- Signed-in Group Sessions use Neon Postgres member/owner security, SQL rate limiting and heartbeat presence. Guest/local invitation sharing stays available without a network account.
- Separate preview and production Neon projects; both enabled for Auth and Data API with group migration applied. Verified RLS and RPC grants.
- Production `VITE_NEON_URL` preconfigured on Vercel. Existing production deployment and old URL untouched.
- Fixed OAuth dashboard return, authenticated invite loading, presence reconnection and failed cloud create cleanup.
- Updated lockfile and committed frozen pnpm install and Neon endpoint build guard.

## Current evidence

- Latest source code **`9643e064`**: isolated VM `pnpm install --frozen-lockfile`, `pnpm check`, **46/46 Vitest**, **4/4 environment guard tests**, and `pnpm build` all passed. The VM was shut down.
- Older frozen-lockfile Preview commit `6d81d5a2` reached Vercel **READY**.
- The owner previously confirmed a successful Preview Google OAuth sign-in and dashboard redirect. The most recent code modifications still require a new end-to-end browser trial.
- **Vercel API daily Preview limit**: newest Preview deployment request was rejected with HTTP 402 (100 deployments/day); do not assume new code is deployed.
- Latest actual Production deployment remains the previous `main` commit. No merge or cutover performed.

## Items before Production launch

- Configure custom SMTP in Production Neon Auth, test code email verification and password reset, and enable required email verification; shared SMTP remains configured now.
- Google consent last seen in Testing mode; publish for non-test users through Google Cloud Console.
- Disable localhost in Production Neon Auth after validating production trusted domains.
- Two-account Preview E2E for connected Group Sessions and guest-account data continuity.
- Retry newest Vercel Preview after quota reset, then obtain owner's final PR approval/merge.

## Links

- [PR #2](https://github.com/Hany-R-Mahmoud/focus-flow/pull/2)
- [Production readiness checklist](./NEON_GO_LIVE_CHECKLIST.md)
- [Detailed production release handoff](./PRODUCTION_RELEASE_HANDOFF.md)
- [Codex final external setup handoff](./CODEX_FINAL_RELEASE_HANDOVER.md)

The canonical production URL is **https://focus-session-flow.vercel.app**. It will remain the same after a verified Production cutover using the existing Vercel project. Historical Supabase data is intentionally not migrated.
