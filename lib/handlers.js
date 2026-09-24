import { summarise } from "./analytics.js";
import { checkAdminAuthorization } from "./auth.js";
import { toCsv } from "./csv.js";
import { validateSubmission } from "./validation.js";

/**
 * HTTP handlers (Vercel Node function signature: (req, res)). Repositories are injected so the
 * behaviour is testable without a real database. Participants only ever receive safe messages:
 * database errors, SQL and configuration details are never returned.
 */

export const SUBMIT_FAILED_MESSAGE = "We couldn't record your response. Please try again.";
const INVALID_MESSAGE = "Some answers need attention before your response can be recorded.";

function send(res, status, body) {
  res.setHeader("Cache-Control", "no-store");
  res.status(status).json(body);
}

function parseBody(req) {
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return undefined;
    }
  }
  return req.body;
}

/** POST /api/feedback — validate and store one participant response centrally. */
export function createFeedbackHandler({ getRepository, log = console.error }) {
  return async function feedbackHandler(req, res) {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return send(res, 405, { ok: false, error: "Method not allowed." });
    }
    const result = validateSubmission(parseBody(req));
    if (!result.ok) return send(res, 400, { ok: false, error: INVALID_MESSAGE, fields: Object.keys(result.errors), errors: result.errors });
    try {
      const repository = getRepository();
      const saved = await repository.insertResponse(result.value);
      return send(res, 201, { ok: true, id: saved.id });
    } catch (error) {
      // Server log only (no request body); the participant sees a generic retry message.
      log("feedback insert failed:", error?.name ?? "Error");
      return send(res, 500, { ok: false, error: SUBMIT_FAILED_MESSAGE });
    }
  };
}

/** Shared admin gate: returns true when the request may proceed, otherwise sends the refusal. */
export function requireAdmin(req, res, env = process.env) {
  const status = checkAdminAuthorization(req.headers?.authorization, env);
  if (status === "ok") return true;
  if (status === "unconfigured") send(res, 503, { ok: false, error: "Admin access is not configured." });
  else {
    res.setHeader("WWW-Authenticate", 'Bearer realm="braivanta-validation"');
    send(res, 401, { ok: false, error: "Valid team credentials are required." });
  }
  return false;
}

/** GET /api/admin/responses — raw stored responses plus the evidence summary, server-authenticated. */
export function createAdminResponsesHandler({ getRepository, env = process.env, log = console.error }) {
  return async function adminResponsesHandler(req, res) {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return send(res, 405, { ok: false, error: "Method not allowed." });
    }
    if (!requireAdmin(req, res, env)) return;
    try {
      const responses = await getRepository().listResponses();
      return send(res, 200, { ok: true, responses, summary: summarise(responses) });
    } catch (error) {
      log("admin responses failed:", error?.name ?? "Error");
      return send(res, 500, { ok: false, error: "Evidence data could not be loaded." });
    }
  };
}

/** GET /api/admin/export — CSV of raw answers, server-authenticated. */
export function createAdminExportHandler({ getRepository, env = process.env, log = console.error, now = () => new Date() }) {
  return async function adminExportHandler(req, res) {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return send(res, 405, { ok: false, error: "Method not allowed." });
    }
    if (!requireAdmin(req, res, env)) return;
    try {
      const csv = toCsv(await getRepository().listResponses());
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="braivanta-validation-responses-${now().toISOString().slice(0, 10)}.csv"`);
      return res.status(200).send(csv);
    } catch (error) {
      log("admin export failed:", error?.name ?? "Error");
      return send(res, 500, { ok: false, error: "The export could not be produced." });
    }
  };
}
