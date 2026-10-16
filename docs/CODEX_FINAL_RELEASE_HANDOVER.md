# Focus Flow — Final external setup and production validation (Codex handover)

Updated: 2026-10-16. **Review and configure only. Do not merge PR #2, deploy Production or modify the code.** The owner will make the final merge decision.

## Verified work already complete

- The Neon migration implementation lives on GitHub branch `migration/neon-backend` and PR https://github.com/Hany-R-Mahmoud/focus-flow/pull/2.
- Neon has two separate projects named **focus-flow** (production) and **focus-flow-preview**; both have Managed Better Auth and Data API enabled.
- Vercel **focus-flow** has distinct public `VITE_NEON_URL` values for Preview and Production. Production URL stays https://focus-session-flow.vercel.app.
- Google custom OAuth credentials are already configured in Neon Auth for both environments (secret values remain redacted). The approved Google test user successfully signed into Preview and reached the dashboard.
- The source now supports Neon email verification **numeric OTP codes**, including code entry and resending. Password reset still uses an emailed reset link.
- Current production Neon Auth configuration was read on 2026-10-16: sender type **shared**; email/password enabled; email verification **not required**; localhost allowed. Google consent's last browser-verified state was **Testing**, not published.
- The current app-code Preview deployment is now **READY** on Vercel (commit `fe964932`) with frozen lockfile, TypeScript, 46 Vitest tests and four environment guard tests. A separate manual Vercel API deployment attempt hit the 100/day quota, but Git integration succeeded.

## Task A — Google OAuth public availability

1. In Google Cloud Console, open the existing Focus Flow OAuth consent configuration, keeping the existing OAuth client and credentials.
2. Confirm the only scopes are `openid`, `email`, and `profile`, branding and support contacts are correct, and the authorized callback remains the exact **Neon Auth /callback/google** address (not Vercel /dashboard).
3. Publish the OAuth consent app from **Testing** to **Production**, if available and appropriate, to allow non-test users. If Google requires further consent/brand verification, report that specific blocking requirement instead of bypassing it.
4. Do not create a second Google client or rotate working credentials unless evidence requires it. Never print/export a client secret or token.
5. Confirm both the Google OAuth client settings and Neon Auth provider remain linked.

## Task B — Production email delivery

1. Choose/configure a transactional **SMTP provider**, verified sending domain and a no-reply sender owned or approved by the project owner. Do not use fabricated SMTP credentials or a personal Gmail password.
2. In Neon Console → **focus-flow** → Settings → Better Auth, replace the shared development email provider with **Custom SMTP**. Enter host/port/user/password and verified sender directly in the secure settings UI. Do not commit credentials, paste them in chat, or add them as `VITE_*`.
3. For sign-up, select **Email verification by numeric code (OTP)**, which matches the implemented `/auth/verify` screen. After confirming delivery, enable **Require Email Verification** on production.
4. Use an email address the owner controls to verify sign-up, verification-code receipt/entry, resend and expiry. Test Forgot Password and the complete reset link + new password + login flow. A green frontend build is not evidence of actual email delivery.
5. Per Neon's production checklist, **disable localhost access on the Production Neon Auth project**, including stale explicit localhost trusted domains. Keep Preview/local development on the separate Preview Neon project.
6. Check the final production and preview trusted origins, app names, and Google callback URLs before concluding this step.

## Task C — Multi-user Preview verification (latest READY Git Preview)

1. Open the current **READY** Git-integrated Preview for app-code commit `fe964932` and confirm its verified Preview Neon endpoint. If a later code commit lands, verify that newer code has a fresh `READY` Preview too.
2. With **two distinct owned test accounts**, test a connected group room: owner creates, second account opens invite and joins, both see live roster, one leaves/rejoins, owner cancels, non-owner cannot cancel. Check browser refresh and logout/login.
3. Guest: no account should be required for personal focus features; private local IndexedDB data survives guest → account → sign out transitions. Guest/local invites do not promise a cross-device roster.
4. Check email sign-in and Google login separately. Ensure returning Google OAuth users reach `/dashboard`. Record any runtime errors with private data redacted.
5. Never test destructively on Production; use the isolated Preview Neon environment.

## When ready to hand back

Return a concise checklist with evidence for each item, and specifically identify the latest fully tested PR commit and Preview deployment. **Stop before any merge, production deployment, database deletion, paid plan upgrade, or Vercel configuration change outside the narrowly scoped authorized setup.**

Official references:
- https://neon.com/docs/auth/production-checklist
- https://neon.com/docs/auth/guides/email-verification
- https://neon.com/docs/auth/guides/password-reset
- https://neon.com/docs/auth/guides/setup-oauth
