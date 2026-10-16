# Codex Handover — Focus Flow Google OAuth (Google Cloud Console)

**As of 2026-10-16.** Objective: finish the human-browser portion of Google OAuth without losing the existing guest-first experience.

## Context
- GitHub: https://github.com/Hany-R-Mahmoud/focus-flow
- Work branch: `migration/neon-backend` (do not silently merge or overwrite main)
- Production site: https://focus-session-flow.vercel.app
- Vercel project: `focus-flow` (`prj_Kht9v5egRtS6CGkZwE6OlLrJQnYB`)
- Neon organization: `org-small-union-15994222`
- Neon project: `focus-flow` (`bitter-heart-23681290`)
- Neon production branch: `br-misty-forest-b9ug181m`; DB: `focus_flow`
- Neon Managed Better Auth: provisioned and named **Focus Flow**.
- Neon Auth base URL:
  `https://ep-fancy-cell-b9b0twp6.neonauth.c-7.eu-central-1.aws.neon.tech/focus_flow/auth`
- **Required Google Authorized Redirect URI** (exact, one per Neon Auth branch):
  `https://ep-fancy-cell-b9b0twp6.neonauth.c-7.eu-central-1.aws.neon.tech/focus_flow/auth/callback/google`
- Stable app origin: `https://focus-session-flow.vercel.app`
- Stable preview origin (used during integration): `https://focus-flow-git-migration-neon-backend-hany-mahmouds-projects.vercel.app`
- Local dev origin: `http://localhost:3000`
- Google sign-in UI is implemented using the Neon Auth SDK `auth.signIn.social({provider: "google",callbackURL: window.location.origin + "/dashboard"})`. No Google secret belongs in Vercel's `VITE_*` variables.

## Google Cloud Console tasks (browser with signed-in user)
1. Open Google Cloud Console and choose the Google Cloud project for Focus Flow. Create a dedicated project if none exists and the owner authorizes any possible cost.
2. Configure Google Auth Platform / OAuth consent screen: app name **Focus Flow**, appropriate support/contact address and audience, only standard `openid`, `email`, `profile` scopes. Add the owner's Google account as a test user if the app is in Testing. Do not request Gmail, Drive, YouTube, or extra scopes.
3. Create **OAuth Client ID → Web application** named **Focus Flow Web**.
4. Add **Authorized JavaScript origins**: `https://focus-session-flow.vercel.app`, the stable preview origin, and (for local testing only) `http://localhost:3000`. Include the Neon Auth origin if the Console requires it.
5. Add this **Authorized redirect URI** precisely:
   `https://ep-fancy-cell-b9b0twp6.neonauth.c-7.eu-central-1.aws.neon.tech/focus_flow/auth/callback/google`.
   **Do not set Google redirect to `/dashboard` on Vercel.** The Vercel URL is the *post-authentication callback URL* passed by the SDK, not the Google OAuth redirect.
6. Copy **Client ID** and **Client Secret** directly into Neon Console → Focus Flow → production branch → Better Auth / OAuth Providers → Google → Custom credentials. **Never paste the Client Secret into ChatGPT, GitHub, a PR, a browser URL, or any `VITE_` variable.** If existing shared Google credentials are listed, switch Google provider to the project's custom credentials.
7. Verify Neon Auth trusted origins include the production URL, preview URL and localhost (already added by ChatGPT; recheck).
8. Using the browser, test Google sign-in on the preview URL (or production only after authorized cutover). Verify navigation, session restoration after refresh, sign-out, and signing in again. Do not make unrelated source edits or silently deploy.
9. Report results, the exact scope of work, and any blocked step. **Report Client ID only if necessary; never include Client Secret or raw token.**

## Important related readiness
- Neon currently uses shared development SMTP; production Email Verification and Password Reset need a custom SMTP provider for reliable delivery. This is separate from Google Cloud OAuth; report as follow-up unless already configured.
- Neon shared Google OAuth is acceptable for **development testing only**, not a branded production launch.
- Guest Mode must stay available without sign-in. Signing in should not erase or upload local IndexedDB data.
- Personal session data does not yet automatically synchronize across devices. Account mode enables signed-in Neon group collaboration.
- A Neon preview database branch `br-silent-sunset-b90ziqjl` was created for validation. It inherits the `neon_auth` schema and was **not** successfully provisioned with an independent Managed Better Auth instance; do not assume it is an isolated auth test environment. The Vercel preview currently references the primary Neon Auth/Data API. Treat smoke-test data as disposable.

## Completion acceptance
- [ ] Custom Google OAuth client active in Neon Auth
- [ ] Consent screen / test users correctly configured
- [ ] Redirect URI and origins exact
- [ ] End-to-end Google login works with a real test user
- [ ] Returning user remains logged in after refresh
- [ ] Logout works and guest mode remains usable
- [ ] No secrets committed or leaked
- [ ] Results reported back to ChatGPT for final deployment readiness check

Useful source: https://neon.com/docs/auth/guides/setup-oauth
