# Focus Flow — Release handoff (Google or Guest)

Updated: 2026-10-16. **Prepared on PR #2, not merged or released.**

## Product model
Focus Flow is an offline-first React/Vite PWA. Personal timers, templates, notes, distractions and reviews are stored in IndexedDB/localStorage on the device, regardless of account mode. Account mode uses **Neon Managed Better Auth with Google** for connected Group Sessions and the shared roster. Continue as Guest does not require a remote identity; it signs out first if a Google session was active. The original Supabase project/data was intentionally not migrated.

## Implemented
- Removed Email/Password, Reset Password, Sign Up and Email OTP UI from the client to match Neon Auth's disabled email/password configuration on both environments.
- Kept Google social sign-in, session restoration, dashboard redirect recovery, explicit sign-out, guest access and independent local personal data.
- Neon Data API group sessions (RLS/owner/member permissions, SQL rate limit, heartbeat presence) and separate Neon Preview/Production databases.
- Static `client/public/privacy.html` and `client/public/terms.html` with public links in the main homepage, the Google sign-in screen and the HTML fallback homepage.
- Correct Vercel Production and Preview `VITE_NEON_URL` scoping, environment guard and reproducible frozen pnpm lockfile.

## Build evidence
The most recent Google-only app source passed a new isolated Linux build with `pnpm install --frozen-lockfile --ignore-scripts`, `pnpm check`, `pnpm test` (46/46), and `pnpm build`; `dist/public/privacy.html` and `dist/public/terms.html` were confirmed. This is **not** proof of a published Preview nor of real-world authentication or room authorization. The last recorded Vercel Preview READY builds may precede the newest UI changes. Production remains the older `main` deployment.

## Google publishing: two different constraints
1. **Missing policy links:** Code now supplies publicly readable policies, but Google needs their live URLs. They will only be available on the primary Production URL after an owner-approved merge/build, unless separately published beforehand.
2. **Verified domain:** Google requires an app homepage on a verified domain the project owner controls. Since the owner has **no purchased/custom domain**, the existing `.vercel.app` subdomain **may be rejected by Google** for branding verification even if the policy links exist and a Search Console URL-prefix property can be verified. Do not claim that legal pages alone guarantee public OAuth publication.

Google Consent is last known to be in **Testing**. Until published, Google login works only for approved test users; everyone can continue as Guest. No custom SMTP or paid domain is to be ordered automatically.

## Release process
1. Preserve PR #2 as **Draft** and do not merge until explicit owner approval.
2. Inspect current Git-integrated Preview once the newest code is deployed and identify its actual commit SHA; avoid relying on an older URL.
3. Owner may authorize a **limited Production pilot** with whitelisted Google accounts and Guest Mode for everyone, accepting that public Google authentication is not yet possible.
4. Merge and build Production using Production Neon env (not promoted Preview assets), verify guest access, sign-in/sign-out and shared room on a live URL. Roll back if core flows fail.
5. Add live legal links to Google Branding, attempt domain verification and switch Google Consent to Production when Google allows it. Only then remove the tester-only login notice and consider Google sign-in fully public.

## Safety and rollback
- Never place OAuth client secrets in code or Vite env.
- Do not delete old Supabase resources, user browser storage or previous Vercel Production deployment during this pilot.
- Guest focus features should remain functional even when Neon/Google services are offline.
