import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Server-side admin authentication for the evidence dashboard and CSV export.
 *
 * The only credential is BRAIVANTA_VALIDATION_ADMIN_TOKEN, a server environment variable that
 * never reaches browser JavaScript. Requests must send `Authorization: Bearer <token>`. URL
 * parameters are never consulted. If the server token is unset or blank, admin access is
 * refused outright rather than falling back to anything.
 */

const digest = (value) => createHash("sha256").update(value, "utf8").digest();

/** @returns {"ok" | "missing" | "invalid" | "unconfigured"} */
export function checkAdminAuthorization(authorizationHeader, env = process.env) {
  const expected = env.BRAIVANTA_VALIDATION_ADMIN_TOKEN?.trim();
  if (!expected) return "unconfigured";
  if (typeof authorizationHeader !== "string") return "missing";
  const match = /^Bearer\s+(.+)$/i.exec(authorizationHeader.trim());
  const provided = match?.[1]?.trim();
  if (!provided) return "missing";
  // Constant-time comparison of fixed-length digests.
  return timingSafeEqual(digest(provided), digest(expected)) ? "ok" : "invalid";
}
