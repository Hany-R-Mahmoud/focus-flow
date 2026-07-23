# Supabase security setup

This project keeps local mode working without Supabase. Cloud mode needs anonymous sign-ins, CAPTCHA, and the SQL migrations.

## 1. Create the Turnstile widget

1. Open the [Cloudflare Turnstile dashboard](https://dash.cloudflare.com/?to=/:account/turnstile).
2. Create a widget for FocusSessionFlow.
3. Use Managed mode.
4. Add `localhost` for development and the production app domain before launch.
5. Copy both values:
   - Site key: safe for the browser.
   - Secret key: keep only in Supabase; never add it to `.env.local` or frontend code.

Turnstile tokens expire after five minutes and are single-use. The app clears the token when it expires or after a failed challenge.

## 2. Configure Supabase Auth

In Supabase:

1. Enable **Authentication > Providers > Anonymous Sign-Ins**.
2. Open **Project Settings > Authentication > Bot and Abuse Protection**.
3. Enable CAPTCHA protection.
4. Select **Cloudflare Turnstile**.
5. Paste the Turnstile secret key and save.
6. Keep the built-in anonymous-sign-in rate limit enabled. Supabase documents a default of 30 requests per IP per hour.

## 3. Apply database migrations

Run these files in the Supabase SQL Editor, in order:

```text
supabase/migrations/0001_group_collaboration.sql
supabase/migrations/0002_create_group_session_rpc.sql
supabase/migrations/0003_repair_create_group_session_rpc.sql
supabase/migrations/0004_repair_join_group_session_rpc.sql
supabase/migrations/0005_cleanup_unused_anonymous_users.sql
supabase/migrations/0006_captcha_and_rpc_rate_limits.sql
```

Migration `0006` adds these database-side limits per anonymous user:

- Create: 5 requests per hour.
- Join: 30 requests per hour.

The invite lookup is intentionally callable without an account because the invite link is the bearer access mechanism for shared session details. Joining still requires CAPTCHA-backed anonymous authentication.

## 4. Configure the app

Copy `.env.example` to `.env.local`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
VITE_TURNSTILE_SITE_KEY=0x...
```

Restart the Vite server after changing environment variables.

Only the publishable Supabase key and Turnstile site key belong in the browser. Never expose the Supabase secret/service-role key or Turnstile secret key.

## 5. Verify the flow

1. Open the create-session page.
2. Complete Turnstile and create a session.
3. Open the invite in a private window.
4. Confirm the preview loads before joining.
5. Enter a display name, complete Turnstile, and join.
6. Repeated create/join attempts eventually return a rate-limit error.
7. Confirm Realtime presence still appears after joining.

For local-only development, leave all Supabase variables empty. The app then skips cloud auth, CAPTCHA, and cloud rate limits.

References: [Supabase CAPTCHA protection](https://supabase.com/docs/guides/auth/auth-captcha), [Supabase anonymous sign-ins](https://supabase.com/docs/guides/auth/auth-anonymous), and [Cloudflare Turnstile client rendering](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/).
