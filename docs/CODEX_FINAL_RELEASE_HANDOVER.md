# Focus Flow — Google Branding follow-up

Updated: 2026-10-16. **No source work required from Codex.** Changes were completed via the GitHub connector on PR #2. Do not bypass or disable Codex's local safety hooks.

## What's ready
- Neon Auth email/password is disabled in both Production and Preview. Focus Flow only offers **Google sign-in** or **Continue as Guest**.
- Static `/privacy.html` and `/terms.html` are committed to the migration branch, with visible links from the site. They disclose Google/Neon account use, local IndexedDB data, Group Sessions, analytics and visitor counts.
- User-approved deployment will continue using the existing `https://focus-session-flow.vercel.app` hostname.

## Outstanding external Google work
1. After the owner approves and merges the PR, verify Production serves `https://focus-session-flow.vercel.app/privacy.html` and `https://focus-session-flow.vercel.app/terms.html` without login.
2. In Google Cloud Console → Google Auth Platform → Branding, set the already-saved homepage to `https://focus-session-flow.vercel.app/`, privacy URL to `https://focus-session-flow.vercel.app/privacy.html`, and terms URL to `https://focus-session-flow.vercel.app/terms.html`. Do not copy credentials into chat or change the working OAuth client.
3. Check Google Search Console ownership verification with the exact available `.vercel.app` hostname. **Google requires a verified domain the operator owns. Free shared hosts may be refused.** If Google refuses, record the exact error and stop: do not buy a domain or invent verification.
4. If Google allows publication, move the OAuth app from Testing to Production and confirm that an ordinary non-test Google account can sign in.
5. Until public Google login is confirmed, keep only approved test accounts in Google Sign-In; Guest Mode remains usable for everyone.

## Current non-blockers
- No SMTP provider, email verification or password reset is needed because Email/Password is disabled.
- Codex's local command/safety hook blocks Codex shell operations only. It is not evidence of an application, Neon or Vercel failure.
- Multi-account Group Sessions E2E is still an unverified risk, not a hard proof of backend failure.

## Rollout safety
No merge, paid upgrade, database deletion, auth credential rotation or Production deployment without explicit owner approval. Keep previous Vercel Production deployment available for rollback.
