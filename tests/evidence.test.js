import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { multiDistribution, share, singleDistribution, summarise } from "../lib/analytics.js";
import { CSV_COLUMNS, toCsv } from "../lib/csv.js";
import { createMemoryRepository } from "../lib/db.js";
import { createAdminExportHandler, createAdminResponsesHandler } from "../lib/handlers.js";
import { mockResponse, negativeSubmission, validSubmission } from "./fixtures.js";

const TOKEN = "synthetic-test-token-evidence";
const ENV = { BRAIVANTA_VALIDATION_ADMIN_TOKEN: TOKEN };
const row = (overrides, i = 0) => ({ id: `synthetic-${i}`, created_at: `2026-09-2${i % 10}T10:00:00.000Z`, ...validSubmission(overrides) });
const rowOf = (dist, option) => dist.rows.find((r) => r.option === option);

test("counts always carry their denominator: 5 of 8 is 62.5%", () => {
  assert.deepEqual(share(5, 8), { count: 5, denominator: 8, percentage: 62.5, label: "5 of 8 (62.5%)" });
  assert.equal(share(8, 12).label, "8 of 12 (66.7%)");
  assert.equal(share(0, 0).label, "0 of 0", "no percentage without a denominator");
  const responses = Array.from({ length: 8 }, (_, i) => row({ problem_frequency: i < 5 ? "Weekly" : "We do not experience this problem" }, i));
  const dist = singleDistribution(responses, "problem_frequency");
  assert.equal(dist.denominator, 8);
  assert.deepEqual(rowOf(dist, "Weekly"), { option: "Weekly", count: 5, denominator: 8, percentage: 62.5, label: "5 of 8 (62.5%)" });
  assert.equal(rowOf(dist, "We do not experience this problem").label, "3 of 8 (37.5%)", "negative answers keep the full denominator");
  assert.equal(rowOf(dist, "Daily").label, "0 of 8 (0%)", "zero-count options stay visible");
  for (const r of dist.rows) assert.match(r.label, /^\d+ of \d+/);
});

test("commercial answers stay distinct: Yes and Possibly are never combined", () => {
  const answers = ["Yes", "Possibly", "Possibly", "No", "No", "No", "Don't know", "I am not involved in purchasing decisions"];
  const responses = answers.map((w, i) => row({ willingness_to_pay: w, annual_budget_range: ["Yes", "Possibly"].includes(w) ? "Unable to estimate" : undefined }, i));
  const summary = summarise(responses);
  const willingness = summary.commercial.willingnessToPay;
  assert.deepEqual(willingness.rows.map((r) => [r.option, r.count]), [
    ["Yes", 1],
    ["Possibly", 2],
    ["No", 3],
    ["Don't know", 1],
    ["I am not involved in purchasing decisions", 1],
  ]);
  assert.equal(willingness.denominator, 8);
  assert.ok(!willingness.rows.some((r) => /Yes.*Possibly|Possibly.*Yes/.test(r.option)), "no merged category");
  // Budget is conditional: its denominator is only Yes + Possibly respondents, and says so.
  assert.equal(summary.commercial.annualBudget.denominator, 3);
  assert.match(summary.commercial.annualBudget.note, /Asked only when willingness to pay was "Yes" or "Possibly": 3 of 8 respondents\./);
  // Next-step positions are reported separately, including "No further interest".
  assert.equal(summary.commercial.nextStep.rows.length, 7);
  assert.equal(rowOf(summary.commercial.nextStep, "No further interest at present").count, 0);
  assert.equal(rowOf(summary.commercial.nextStep, "Would like to continue testing").count, 8);
  const keys = JSON.stringify(Object.keys(summary.commercial));
  assert.doesNotMatch(keys, /eoi|lead|hot|warm|cold|score|pilotInterest/i);
});

test("feature use counts only respondents who selected that function as tested", () => {
  const responses = [
    row({ tested_features: ["Braille Submissions"] }, 1),
    row({ tested_features: ["Braille Submissions", "Pupil Voice"] }, 2),
    row({ tested_features: ["I only viewed the product"] }, 3),
    row({ tested_features: ["I only viewed the product"] }, 4),
  ];
  const dist = summarise(responses).solution.testedFeatures;
  assert.equal(rowOf(dist, "Braille Submissions").label, "2 of 4 (50%)");
  assert.equal(rowOf(dist, "Pupil Voice").label, "1 of 4 (25%)");
  assert.equal(rowOf(dist, "Assessment-Safe").count, 0);
  assert.equal(rowOf(dist, "I only viewed the product").count, 2);
  assert.equal(dist.multiple, true);
  assert.match(dist.note, /more than one option/);
  // Multi-select impacts use respondents as the denominator.
  const impacts = multiDistribution(responses, "problem_impacts");
  assert.equal(impacts.denominator, 4);
});

test("sample and qualitative evidence are factual: unnamed organisations are not counted, text is unedited", () => {
  const responses = [
    row({ organisation_name: "Synthetic Service A" }, 1),
    row({ organisation_name: "  synthetic   service a " }, 2),
    row({ organisation_name: "Synthetic School B" }, 3),
    { id: "neg", created_at: "2026-09-24T10:00:00Z", ...negativeSubmission({ technical_blocker: "Yes", technical_blocker_detail: "Demo login page timed out." }) },
  ];
  const s = summarise(responses);
  assert.equal(s.sample.completedResponses, 4);
  assert.equal(s.sample.namedOrganisations.count, 2, "case/spacing variants are one organisation");
  assert.equal(s.sample.namedOrganisations.respondentsWithoutName, 1);
  assert.equal(s.problem.mainProblems.length, 4);
  assert.ok(s.problem.mainProblems.some((p) => p.text === "We do not have a meaningful problem here."), "negative statements stay visible");
  assert.deepEqual(s.solution.technicalDetails.map((d) => d.text), ["Demo login page timed out."]);
  assert.equal(rowOf(s.solution.technicalBlocker, "Yes").label, "1 of 4 (25%)");
  const neg = s.qualitative.find((q) => q.id === "neg");
  assert.deepEqual(Object.keys(neg).sort(), ["created_at", "id", "main_barrier", "main_benefit", "main_problem", "next_step_position", "organisation_type", "role", "technical_issue"].sort());
  assert.equal(neg.main_benefit, "None");
  assert.equal(neg.next_step_position, "No further interest at present");
  assert.equal(neg.technical_issue, "Demo login page timed out.");
  for (const q of s.qualitative) assert.ok(!("sentiment" in q) && !("theme" in q) && !("priority" in q));
  // Zero responses: an honest empty state.
  const empty = summarise([]);
  assert.equal(empty.sample.completedResponses, 0);
  assert.equal(rowOf(empty.commercial.willingnessToPay, "Yes").label, "0 of 0");
});

test("CSV export contains raw answers only, contact details only with permission, and guards formulas", () => {
  const names = CSV_COLUMNS.map(([name]) => name);
  assert.deepEqual(names.slice(0, 5), ["response_id", "timestamp", "q1_role", "q2_organisation_type", "q2_organisation_name"]);
  for (const q of ["q3_", "q4_", "q5_", "q6_", "q7_", "q8_", "q9_", "q10_", "q11_", "q12_", "q13_", "q14_", "q15_"]) assert.ok(names.some((n) => n.startsWith(q)), q);
  assert.doesNotMatch(names.join(","), /lead|score|status|sentiment|theme|priority|eoi/i);
  const csv = toCsv([
    row({ followup_permission: "Yes", contact_name: "Test Person", contact_email: "test.person@example.org", main_benefit: "=HYPERLINK(\"x\")" }, 1),
    { ...row({}, 2), contact_email: "should-not-appear@example.org" },
  ]);
  assert.ok(csv.startsWith("﻿response_id,timestamp,"));
  const lines = csv.trim().split("\r\n");
  assert.equal(lines.length, 3);
  assert.match(lines[1], /"test\.person@example\.org"/);
  assert.doesNotMatch(csv, /should-not-appear/, "no contact details without permission");
  assert.match(lines[1], /"'=HYPERLINK\(""x""\)"/, "formula injection neutralised");
  assert.match(lines[1], /"Staff time is lost; Teacher feedback is delayed"/, "multi-select kept raw");
});

test("the export endpoint requires the team token and returns CSV", async () => {
  const repo = createMemoryRepository();
  await repo.insertResponse(validSubmission());
  const handler = createAdminExportHandler({ getRepository: () => repo, env: ENV, log: () => {}, now: () => new Date("2026-09-24T00:00:00Z") });
  const denied = mockResponse();
  await handler({ method: "GET", headers: {} }, denied);
  assert.equal(denied.statusCode, 401);
  const wrong = mockResponse();
  await handler({ method: "GET", headers: { authorization: "Bearer wrong" } }, wrong);
  assert.equal(wrong.statusCode, 401);
  const ok = mockResponse();
  await handler({ method: "GET", headers: { authorization: `Bearer ${TOKEN}` } }, ok);
  assert.equal(ok.statusCode, 200);
  assert.equal(ok.headers["content-type"], "text/csv; charset=utf-8");
  assert.equal(ok.headers["content-disposition"], 'attachment; filename="braivanta-validation-responses-2026-09-24.csv"');
  assert.match(ok.body, /Synthetic fixture: turnaround/);
  // The responses endpoint now returns the evidence summary alongside the raw rows.
  const res = mockResponse();
  await createAdminResponsesHandler({ getRepository: () => repo, env: ENV, log: () => {} })({ method: "GET", headers: { authorization: `Bearer ${TOKEN}` } }, res);
  assert.equal(res.body.summary.sample.completedResponses, 1);
});

// ---------------------------------------------------------------------------
const productionFiles = (() => {
  const out = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      if (["node_modules", ".git", "tests"].includes(name)) continue;
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (/\.(js|mjs|html|css|sql)$/.test(name)) out.push(path);
    }
  };
  walk(".");
  return out;
})();

test("evidence integrity: no lead scoring, invented analytics or merged commercial metrics anywhere in production code", () => {
  assert.ok(productionFiles.length > 8);
  const forbidden = [
    /calculateLeadScore/,
    /Hot Leads|Warm Leads|Cold Leads/,
    /lead[ _-]?score/i,
    /lead[ _-]?status/i,
    /theme: "Braille transcription need"/,
    /sentiment: "Positive"/,
    /priority: "High"/,
    /\bsentiment\s*:/i,
    /\bpriority\s*:/i,
    /automatic_theme/,
    /Non-Binding EOIs|eoiCount|m-eoi-count/,
    /pilot3k|m-paid-pilot-pct|Consider £3,000 Paid Pilot/,
    /chart-lead-status|badge-hot|badge-warm|badge-cold/,
  ];
  for (const file of productionFiles) {
    const text = readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*(--|\/\/).*$/gm, "");
    for (const pattern of forbidden) assert.doesNotMatch(text, pattern, `${file}: ${pattern}`);
  }
  const schema = readFileSync("db/schema.sql", "utf8").replace(/^\s*--.*$/gm, "");
  assert.doesNotMatch(schema, /sentiment|priority|lead_score|lead_status|theme/i);
});

test("the dashboard shows counts with denominators and no stale local data", () => {
  const admin = readFileSync("admin.js", "utf8");
  assert.match(admin, /<td class="num">\$\{escapeHtml\(row\.label\)\}<\/td>/, "each figure renders its 'n of N (p%)' label");
  assert.match(admin, /Denominator: \$\{dist\.denominator\} response/);
  assert.doesNotMatch(admin, /\$\{row\.percentage\}%<|percentage\}%`/, "no bare percentage output");
  assert.match(admin, /function showLoadError[\s\S]*?lastData = null;[\s\S]*?innerHTML = "";/, "failed loads clear previous data");
  for (const heading of ['section("A", "Sample and respondents"', 'section("B", "Problem validation"', 'section("C", "Solution validation"', 'section("D", "Commercial validation"', "Qualitative evidence"]) {
    assert.ok(admin.includes(heading), heading);
  }
  assert.match(admin, /fetch\("\/api\/admin\/export", \{ headers: \{ Authorization: `Bearer \$\{token\}` \}/);
  assert.doesNotMatch(readFileSync("index.html", "utf8"), /chart\.js|Chart\(/i);
});
