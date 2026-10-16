# Focus Flow — Production release handoff

Updated: **2026-10-16**. **No merge or Production cutover performed.** PR: https://github.com/Hany-R-Mahmoud/focus-flow/pull/2 (Draft until production gates pass).

## Implementation ready

- React/Vite Focus Flow migrated from Supabase SDK to Neon Managed Better Auth plus Data API. Email/password, Google OAuth, bilingual authentication UI, email OTP verification form/resend, forgot/reset password UI, and guest account-free entry are implemented.
- Separate **Production** and **Preview** Neon projects each have Auth and Data API plus collaboration SQL schema. Both group tables use RLS. Signed-in Group Sessions use owner/member authorization, rate-limit RPCs and heartbeat presence. Guest invites remain locally coordinated without a connected roster.
- Personal focus timers, notes, templates and history remain local to browser IndexedDB across account sign in and out; there is no automatic cross-device personal data sync, and no historical Supabase data was imported by owner instruction.
- Production Vercel public `VITE_NEON_URL` is already scoped to **production Neon**; Preview Vercel public URL targets the separate **preview Neon**. The committed build guard rejects missing or crossed endpoints.
- `pnpm-lock.yaml` regenerated and committed with pinned Neon dependencies; `vercel.json` uses `pnpm install --frozen-lockfile`.
- The existing Vercel production domain is still verified: https://focus-session-flow.vercel.app. Neither the main branch nor production release changed.
- Previous Preview Google Sign-In test succeeded per owner and Codex handover. The Google dashboard return bug was fixed, as were race conditions while loading cloud invitations and reconnecting group presence after auth refresh.

## Verification record

- **Latest app code commit `9643e064`** was cloned to an isolated build VM and passed:
  - `pnpm install --frozen-lockfile --ignore-scripts`
  - `node --test scripts/check-neon-env.test.mjs`: **4/4 passed**
  - `VERCEL_ENV=preview ... node scripts/check-neon-env.mjs`: **verified Preview Neon endpoint**
  - `pnpm check`: passed TypeScript
  - `pnpm test`: **46/46 passed across 12 test files**
  - `pnpm build`: passed
- **Current app-code Preview at commit `fe964932` is `READY`**, at Vercel deployment `dpl_CAepvTrVsFZJocef2ztSWHV5wfQQ`. Its logs confirm **frozen install, 4/4 environment checks, 46/46 Vitest, TypeScript and build**. Its code includes all fixes through commit `9643e064`.
- One manual deployment request returned **HTTP 402 `api-deployments-free-per-day`** after the 100/day limit was reached; **Git-integrated Preview nevertheless built successfully**. No paid plan change was used.
- Neon SQL privilege audit confirms the **anonymous** role cannot EXECUTE exposed Group Session RPCs, the **authenticated** role can EXECUTE intended RPCs, and the internal rate-limit RPC is not callable directly.
- **Do not infer from passing unit checks that two-browser group permissions, SMTP delivery, or public Google OAuth are fully verified.**

## Remaining release blockers

1. **Google general availability** — external Google Cloud Console OAuth Consent last confirmed in **Testing**. It must be published when public registration is intended and any Google verification requirements handled. Both Neon providers have OAuth credentials configured already. Do not rotate them without evidence.
2. **Custom SMTP + email verification policy** — Neon Production Auth still reports **shared** email provider; signup/sign-in does not require verification. Obtain verified sender and valid SMTP credentials, configure them securely in Neon, test email **OTP code** verification/resend and password-reset link, then require verification. The implemented UI matches OTP verification, not verification-by-link.
3. **Auth trusted domain hardening** — Production Neon Auth currently allows localhost; remove localhost from Production Auth while retaining it for Preview/local developer use as in the official checklist.
4. **Real two-account Preview E2E** — test signed-in Group Sessions create, join, live roster, disconnect/reconnect, leave, owner delete and non-owner denial. Test Guest Mode and unchanged IndexedDB data after sign-in/sign-out. Neither a DB grants query nor 46 unit tests replaces this.
5. **Browser E2E on the verified Preview** — current app code now has a `READY` Vercel Preview; exercise Auth and two-account Group Sessions on that Preview. Doc-only commits may advance the Git head without changing the tested app code.
6. **Final owner approval** — user explicitly requested to be the one approving and merging after readiness is confirmed.

Handover for browser-based external steps: [CODEX_FINAL_RELEASE_HANDOVER.md](./CODEX_FINAL_RELEASE_HANDOVER.md).

## One-time cutover plan after all gates

1. Confirm review approval, exact PR head SHA, successful latest Preview checks and correct Neon production database in Vercel env.
2. Merge PR #2 into main only after owner approval. Vercel's Git integration produces a **new Production build**, using Production `VITE_NEON_URL`; never promote the Preview build compiled against Preview database.
3. Verify `https://focus-session-flow.vercel.app` still works: anonymous offline focus, Google login redirect/refresh/logout, email sign-in/reset/OTP, authenticated group collaboration and private local data retention.
4. On success, remove obsolete `NEXT_PUBLIC_SUPABASE_*` and `VITE_TURNSTILE_SITE_KEY` Production env values. Keep the previous production deployment for rollback; do not delete old Supabase data/resources until unnecessary.
5. If production checks fail, roll back via Vercel to the last known-good Production build; the stable URL stays the same.

**Never claim the Production Neon migration has been released before the new main build and post-release checks actually pass.**
