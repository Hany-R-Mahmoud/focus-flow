/**
 * Fail a hosted build instead of silently shipping a guest-only app or
 * connecting a public frontend to the wrong Neon database.
 *
 * All values here are public API hosts, never PostgreSQL passwords.
 */
export function checkNeonEnvironment({ target, baseUrl }) {
  if (target !== "production" && target !== "preview") {
    return { ok: true, message: "Local build: Neon URL is optional for guest mode" };
  }

  if (!baseUrl) {
    return { ok: false, message: `Missing VITE_NEON_URL for Vercel ${target} build` };
  }

  let url;
  try {
    url = new URL(baseUrl);
  } catch {
    return { ok: false, message: "VITE_NEON_URL must be a valid HTTPS URL" };
  }

  const expectedHost =
    target === "production"
      ? "ep-fancy-cell-b9b0twp6.c-7.eu-central-1.aws.neon.tech"
      : "ep-odd-water-b9jlfq77.c-7.eu-central-1.aws.neon.tech";

  if (
    url.protocol !== "https:" ||
    url.hostname !== expectedHost ||
    url.pathname !== "/focus_flow" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    return {
      ok: false,
      message: `VITE_NEON_URL does not match the approved ${target} database endpoint`,
    };
  }

  return { ok: true, message: `Verified isolated ${target} Neon endpoint` };
}

// Executed as a CLI by Vercel's buildCommand.
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const result = checkNeonEnvironment({
    target: process.env.VERCEL_ENV,
    baseUrl: process.env.VITE_NEON_URL,
  });

  if (!result.ok) {
    console.error(result.message);
    process.exitCode = 1;
  } else {
    console.log(result.message);
  }
}
