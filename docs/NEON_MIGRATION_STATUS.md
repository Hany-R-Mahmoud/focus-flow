# Focus Flow -> Neon migration status (2026-10-16)

## Current state
**Not cut over.** The live Vercel deployment is untouched and no Supabase credentials were removed. Neon database infrastructure was provisioned and checked; application code, migration of source data, and deployment are outstanding.

### Discovered application facts
- React/Vite offline-first PWA. User templates, personal sessions, and reviews remain in browser IndexedDB; those data are not in Supabase.
- Optional group collaboration uses Supabase anonymous Auth, PostgREST RPC and tables, and Supabase Realtime Presence.
- Client configuration requires `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_TURNSTILE_SITE_KEY`.
- Production Vercel had `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `VITE_TURNSTILE_SITE_KEY`, all production-only. `NEXT_PUBLIC_*` do not populate Vite's `VITE_*` inputs; verify production cloud mode is disabled.
- The Supabase connector available during this task listed *yalla-nakol* only; the source Focus Flow project was not accessible. Do not assume there is no source data.

### Provisioned Neon
- Organization: `org-small-union-15994222` (Free)
- Project ID: `bitter-heart-23681290`; name `focus-flow`
- Region: `aws-eu-central-1` (Frankfurt)
- Postgres 17; default branch `br-misty-forest-b9ug181m` (`production`); database `focus_flow`.
- Created private schema `focus_cloud` with `anonymous_users`, `group_sessions`, `group_session_participants`, `rate_counters`. Verified four tables exist. No application data imported.
- Never commit a Neon connection string, database role password, or CAPTCHA secret.

## Essential migration requirements
1. **Source data gate:** Locate original Focus Flow Supabase organization/project. Back up the full relevant schema/data and count records (group sessions, membership, any Auth users). If source data exists, map ownership/identities securely and migrate with reconciliation; don't directly copy Supabase `auth.users` dependencies to Neon.
2. **Backend implementation:** Replace `@supabase/supabase-js` calls in `client/src/lib/supabase.ts`, `client/src/lib/cloudGroupSessions.ts`, and dependent components. Neon is Postgres, not a drop-in endpoint for the existing Supabase SDK. Implement server-side API endpoints (Vercel Functions) using parameterized SQL, or Neon Auth + Neon Data API if anonymous guest identity and presence behavior can be preserved securely.
3. **Authorization:** Each anonymous browser must have a cryptographically random opaque identity stored in a secure httpOnly sameSite cookie (or a verified Neon Auth session); store only its hash in database. Enforce owner authorization on cancel and membership on roster reads. Invite link is a bearer invite capability, not an ownership credential; resist guessing, name collisions, replay, abuse and CSRF. Never put privileged Neon credentials under `VITE_*`.
4. **Abuse safeguards:** Enforce real server-side rate limiting and CAPTCHA verification (Cloudflare Turnstile secret stays on server). Browser site key alone is not sufficient. Reject malformed/oversized input, verify same-origin writes, and consider proxy headers carefully.
5. **Live presence:** Supabase Presence is not interchangeable with Neon Realtime live SQL. Choose appropriately authenticated Neon Realtime, or bounded heartbeats + polling with online TTL; test multi-device join, leave, refresh, reconnect and stale presence cleanup.
6. **Vercel:** Existing `focus-flow` project ID `prj_Kht9v5egRtS6CGkZwE6OlLrJQnYB` (team `team_YWbN88Ecug0LibOPwd2EZmQA`), framework Vite. Add backend function routing **before** SPA catch-all rewrite. Use server-side `DATABASE_URL` as sensitive env var in Preview first. Add any genuinely required `VITE_*` client vars only after integration exists; remove old Supabase env variables after successful verified cutover. Keep production unchanged until ready.
7. **Validation:** Run package install with a committed lockfile, TypeScript checks, unit tests, build; deploy isolated preview with separate staging database; verify create/join/leave/roster/cancel across different browsers, rate limits, authentication, page refresh, IndexedDB continuity, and server logs. Reconcile imported records before promoting production.
8. **Rollback:** Keep a backed-up Supabase source and previous Vercel deployment until production verified; document how to revert environment variables and deployed build. Never delete original cloud data during initial cutover.

## Actual result so far
- ✅ Source code and Vercel configuration audited.
- ✅ Neon Free Postgres project provisioned.
- ✅ Four schema tables created and database query confirmed.
- ❌ Source Supabase Focus Flow project not available through connected Supabase tool.
- ❌ No group data or auth identities migrated.
- ❌ Application integration and automated checks not completed.
- ❌ Vercel environment configuration and production deployment not modified.

**Do not describe this migration as completed until the missing gates pass.**
