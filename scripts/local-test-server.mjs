/**
 * Local test backend for browser validation ONLY (`npm run dev:local`).
 *
 * Serves the static site and the same API handlers as Vercel, but with an in-memory repository:
 * nothing is written to any database and everything is lost when the process stops. Use only
 * synthetic research answers. Never deploy this file.
 *
 *   LOCAL_TEST_ADMIN_TOKEN=<synthetic token> npm run dev:local
 *   LOCAL_TEST_FAIL_SUBMISSIONS=true  → simulate a central-storage failure (error-state check)
 */
import http from "node:http";
import { readFileSync } from "node:fs";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

import { createMemoryRepository } from "../lib/db.js";
import { createAdminExportHandler, createAdminResponsesHandler, createFeedbackHandler } from "../lib/handlers.js";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const PORT = Number(process.env.PORT ?? 3480);
const STATIC = { "/": "index.html", "/index.html": "index.html", "/app.js": "app.js", "/admin.js": "admin.js", "/styles.css": "styles.css" };
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8" };

const env = { BRAIVANTA_VALIDATION_ADMIN_TOKEN: process.env.LOCAL_TEST_ADMIN_TOKEN ?? "" };
const memory = createMemoryRepository();
const failing = { insertResponse: async () => Promise.reject(new Error("simulated storage failure")), listResponses: memory.listResponses };
const repository = () => (process.env.LOCAL_TEST_FAIL_SUBMISSIONS === "true" ? failing : memory);

const routes = {
  "/api/feedback": createFeedbackHandler({ getRepository: repository }),
  "/api/admin/responses": createAdminResponsesHandler({ getRepository: repository, env }),
  "/api/admin/export": createAdminExportHandler({ getRepository: repository, env }),
};

function adapt(res) {
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (body) => {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify(body));
    return res;
  };
  res.send = (body) => {
    res.end(body);
    return res;
  };
  return res;
}

http
  .createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const handler = routes[url.pathname];
    if (handler) {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const raw = Buffer.concat(chunks).toString("utf8");
      let body;
      try {
        body = raw ? JSON.parse(raw) : undefined;
      } catch {
        body = raw;
      }
      return handler({ method: req.method, url: req.url, headers: req.headers, body }, adapt(res));
    }
    const file = STATIC[url.pathname];
    if (!file) {
      res.statusCode = 404;
      return res.end("Not found");
    }
    res.setHeader("Content-Type", TYPES[extname(file)]);
    res.end(readFileSync(join(ROOT, file)));
  })
  .listen(PORT, "127.0.0.1", () => {
    console.log(`Local TEST backend (in-memory, nothing persisted) on http://127.0.0.1:${PORT}`);
    if (!env.BRAIVANTA_VALIDATION_ADMIN_TOKEN) console.log("LOCAL_TEST_ADMIN_TOKEN not set: team views will refuse access.");
  });
