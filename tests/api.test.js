import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { checkAdminAuthorization } from "../lib/auth.js";
import { createMemoryRepository, createPostgresRepository, databaseRepository, MissingDatabaseConfigError } from "../lib/db.js";
import { SUBMIT_FAILED_MESSAGE, createAdminResponsesHandler, createFeedbackHandler } from "../lib/handlers.js";
import { mockResponse, validSubmission } from "./fixtures.js";

const TOKEN = "synthetic-test-token-0123456789";
const ENV = { BRAIVANTA_VALIDATION_ADMIN_TOKEN: TOKEN };
const silent = () => {};

test("POST /api/feedback stores a valid response exactly once", async () => {
  const repo = createMemoryRepository();
  const handler = createFeedbackHandler({ getRepository: () => repo, log: silent });
  const res = mockResponse();
  await handler({ method: "POST", headers: {}, body: validSubmission() }, res);
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.ok, true);
  assert.equal(repo.rows.length, 1);
  assert.equal(repo.rows[0].id, res.body.id);
  for (const invented of ["sentiment", "theme", "priority", "lead_score", "lead_status"]) assert.ok(!(invented in repo.rows[0]), invented);
  // JSON string bodies are accepted too.
  await handler({ method: "POST", headers: {}, body: JSON.stringify(validSubmission()) }, mockResponse());
  assert.equal(repo.rows.length, 2);
});

test("POST /api/feedback rejects invalid payloads and other methods without storing anything", async () => {
  const repo = createMemoryRepository();
  const handler = createFeedbackHandler({ getRepository: () => repo, log: silent });
  for (const body of [validSubmission({ role: "Invented" }), "{not json", undefined, validSubmission({ sentiment: "Positive" })]) {
    const res = mockResponse();
    await handler({ method: "POST", headers: {}, body }, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.ok, false);
  }
  const get = mockResponse();
  await handler({ method: "GET", headers: {} }, get);
  assert.equal(get.statusCode, 405);
  assert.equal(repo.rows.length, 0);
});

test("database failures return a generic retry message and never leak credentials or SQL", async () => {
  const secretUrl = "postgresql://user:SuperSecretPassword@db.example.test/validation";
  const failing = {
    async insertResponse() {
      throw new Error(`connection to ${secretUrl} failed: INSERT INTO validation_responses ... syntax error`);
    },
  };
  for (const getRepository of [() => failing, () => databaseRepository({})]) {
    const logs = [];
    const res = mockResponse();
    await createFeedbackHandler({ getRepository, log: (...args) => logs.push(args.join(" ")) })({ method: "POST", headers: {}, body: validSubmission() }, res);
    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, { ok: false, error: SUBMIT_FAILED_MESSAGE });
    const exposed = JSON.stringify(res.body) + logs.join(" ");
    assert.doesNotMatch(exposed, /SuperSecretPassword|postgresql:|INSERT INTO|syntax error|DATABASE_URL/);
  }
  assert.throws(() => databaseRepository({ DATABASE_URL: "  " }), MissingDatabaseConfigError);
});

test("the Postgres repository inserts raw answers with JSONB arrays via a parameterised query", async () => {
  const calls = [];
  const sql = async (strings, ...values) => {
    calls.push({ text: strings.join("$?"), values });
    return [{ id: values[0], created_at: "2026-01-01T00:00:00Z" }];
  };
  const repo = createPostgresRepository(sql);
  const saved = await repo.insertResponse({ ...validSubmission(), technical_blocker_detail: null, main_barrier_other: null, contact_name: null, contact_email: null });
  assert.match(calls[0].text, /INSERT INTO validation_responses/);
  assert.match(calls[0].text, /::jsonb/);
  assert.ok(calls[0].values.includes(JSON.stringify(["Staff time is lost", "Teacher feedback is delayed"])));
  assert.doesNotMatch(calls[0].text, /sentiment|priority|lead_score|theme/);
  assert.equal(saved.id, calls[0].values[0]);
});

test("admin authentication: missing, wrong, empty and unconfigured tokens are refused", async () => {
  assert.equal(checkAdminAuthorization(undefined, ENV), "missing");
  assert.equal(checkAdminAuthorization("", ENV), "missing");
  assert.equal(checkAdminAuthorization("Bearer ", ENV), "missing");
  assert.equal(checkAdminAuthorization("Bearer wrong-token", ENV), "invalid");
  assert.equal(checkAdminAuthorization(TOKEN, ENV), "missing", "the Bearer scheme is required");
  assert.equal(checkAdminAuthorization(`Bearer ${TOKEN}`, ENV), "ok");
  assert.equal(checkAdminAuthorization(`Bearer ${TOKEN}`, {}), "unconfigured");
  assert.equal(checkAdminAuthorization(`Bearer ${TOKEN}`, { BRAIVANTA_VALIDATION_ADMIN_TOKEN: "   " }), "unconfigured");
  assert.equal(checkAdminAuthorization("Bearer ", { BRAIVANTA_VALIDATION_ADMIN_TOKEN: "" }), "unconfigured", "empty never matches empty");

  const repo = createMemoryRepository();
  await repo.insertResponse(validSubmission());
  const handler = createAdminResponsesHandler({ getRepository: () => repo, env: ENV, log: silent });
  const call = async (headers, url = "/api/admin/responses") => {
    const res = mockResponse();
    await handler({ method: "GET", url, headers }, res);
    return res;
  };
  assert.equal((await call({})).statusCode, 401);
  assert.equal((await call({ authorization: "Bearer nope" })).statusCode, 401);
  // URL parameters never grant access.
  assert.equal((await call({}, "/api/admin/responses?admin=true")).statusCode, 401);
  assert.equal((await call({}, "/api/admin/responses?mode=admin&token=" + TOKEN)).statusCode, 401);
  const ok = await call({ authorization: `Bearer ${TOKEN}` });
  assert.equal(ok.statusCode, 200);
  assert.equal(ok.body.responses.length, 1);
  assert.equal(ok.headers["cache-control"], "no-store");

  const unconfigured = mockResponse();
  await createAdminResponsesHandler({ getRepository: () => repo, env: {}, log: silent })({ method: "GET", headers: { authorization: `Bearer ${TOKEN}` } }, unconfigured);
  assert.equal(unconfigured.statusCode, 503);
});

test("no credential or database secret is hard-coded; API routes use the server-side repository", () => {
  for (const path of ["lib/auth.js", "lib/handlers.js", "lib/db.js", "api/feedback.js", "api/admin/responses.js"]) {
    const code = readFileSync(path, "utf8");
    assert.doesNotMatch(code, /braivanta2026|ADMIN_PASSCODE|postgres(ql)?:\/\/[^\s"'`]+@/i, path);
  }
  assert.match(readFileSync("lib/auth.js", "utf8"), /env\.BRAIVANTA_VALIDATION_ADMIN_TOKEN/);
  assert.match(readFileSync("api/feedback.js", "utf8"), /databaseRepository\(\)/);
  const example = readFileSync(".env.example", "utf8");
  assert.match(example, /^DATABASE_URL=$/m);
  assert.match(example, /^BRAIVANTA_VALIDATION_ADMIN_TOKEN=$/m);
});
