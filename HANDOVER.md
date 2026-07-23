# FocusSessionFlow handover

Updated: 2026-07-23

## Current state

FocusSessionFlow is an offline-first React/Vite app. IndexedDB stores templates, individual sessions, reviews, and group-session records. Personal activity, interruptions, outcomes, and group notes remain browser-local. Optional Supabase integration adds anonymous identity, authoritative group-session records, join history, and live presence.

The app now waits for database initialization and seeding before rendering routes. Seed data fills empty stores independently, so a partially populated database is repaired without overwriting existing user data.

## Important behavior

- Individual timers derive elapsed time from timestamps and persist pause accounting across reloads.
- Group timers use scheduled timestamps and show focus and break phases.
- Active sessions can generate invite links after starting; ended sessions cannot be joined.
- Invite payloads are URL-safe, Unicode-safe, size-limited, validated, and deduplicated by stable payload identity.
- Export/import includes IndexedDB data and `focusflow_` local data, validates before replacement, and clear-all removes both storage layers.
- Deleting a group session removes its related browser-local participants, activity, and personal notes.
- Notifications are opt-in and currently cover upcoming group-session reminders.
- Development debug collection and the unprotected storage-signing proxy are removed from Vite.
- Production responses include baseline security headers; TLS remains a deployment/reverse-proxy responsibility.

## Supabase integration boundary

The integration is feature-flagged by `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Without them, the existing local-only flow remains active. With them, group-session creation syncs to Supabase, invite previews load the authoritative record, joining uses anonymous Auth plus a display name, and active sessions subscribe to Realtime Presence. Personal session data is not uploaded.

Setup:

1. Enable Anonymous Sign-Ins and CAPTCHA protection in the Supabase project.
2. Create a Cloudflare Turnstile widget and add its site key to the app environment.
3. Run all files in `supabase/migrations/` in filename order.
4. Copy `.env.example` to `.env.local`, fill the project URL, publishable key, and Turnstile site key, then restart the app.

The browser must never receive a service-role key. CAPTCHA and rate limiting are implemented for cloud mode and must be configured before broad public launch because anonymous sign-up can be abused.
The app passes Turnstile tokens to Supabase anonymous auth. Migration `0005` schedules cleanup for unused anonymous accounts, and migration `0006` limits create/join RPC calls per anonymous user. Accounts tied to group sessions are retained so shared session history is not deleted.

See `SUPABASE_SETUP.md` for the complete operator guide.

## Verification

The current local checks are:

```text
pnpm test
pnpm check
pnpm build
```

All three pass in the current workspace. Cloud end-to-end QA requires a configured Supabase project; local fallback remains testable without one.
