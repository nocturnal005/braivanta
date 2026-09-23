import { test } from "node:test";
import assert from "node:assert/strict";

import {
  NOT_APPLICABLE_APPROACH,
  NOT_APPLICABLE_REQUIRES_NO_PROBLEM_MESSAGE,
  NO_PROBLEM_FREQUENCY,
  POST_DEMO,
  PRE_DEMO,
  QUESTIONS,
  allFields,
} from "../lib/questionnaire.js";
import { validateSubmission } from "../lib/validation.js";
import { negativeSubmission, validSubmission } from "./fixtures.js";

test("questionnaire definition: exactly 15 numbered questions, Q1–Q7 pre-demo and Q8–Q15 post-demo", () => {
  assert.equal(QUESTIONS.length, 15);
  assert.deepEqual(QUESTIONS.map((q) => q.number), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
  assert.ok(QUESTIONS.slice(0, 7).every((q) => q.phase === PRE_DEMO));
  assert.ok(QUESTIONS.slice(7).every((q) => q.phase === POST_DEMO));
  // Q3 is open text (unaided problem statement), not a checklist.
  assert.equal(QUESTIONS[2].type, "text");
  // Negative and uncertain pathways exist.
  const opts = (field) => allFields().find((f) => f.field === field).options;
  assert.ok(opts("problem_frequency").includes("We do not experience this problem"));
  assert.ok(opts("problem_impacts").includes("No significant impact"));
  assert.ok(opts("solution_help").includes("No") && opts("solution_help").includes("Unable to judge"));
  assert.ok(opts("current_process_comparison").includes("Much worse"));
  assert.ok(opts("main_barrier").includes("Current process is already adequate"));
  assert.ok(opts("willingness_to_pay").includes("No") && opts("willingness_to_pay").includes("Don't know"));
  assert.ok(opts("next_step_position").includes("No further interest at present"));
  // The old £3,000 anchor is not the first budget option.
  assert.equal(opts("annual_budget_range")[0], "Under £1,000");
});

test("a valid response is accepted, trimmed and normalised", () => {
  const result = validateSubmission(validSubmission({ main_problem: "  padded  ", tested_features: ["Review & Approvals", "Braille Submissions"] }));
  assert.equal(result.ok, true);
  assert.equal(result.value.main_problem, "padded");
  assert.deepEqual(result.value.tested_features, ["Braille Submissions", "Review & Approvals"], "canonical option order");
  assert.equal(result.value.technical_blocker_detail, null);
  assert.equal(result.value.contact_email, null);
  assert.equal(result.value.data_notice_acknowledged, true);
});

test("fully negative responses are valid first-class evidence", () => {
  const result = validateSubmission(negativeSubmission());
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  assert.equal(result.value.problem_frequency, "We do not experience this problem");
  assert.equal(result.value.willingness_to_pay, "No");
  assert.equal(result.value.annual_budget_range, null);
  assert.equal(result.value.next_step_position, "No further interest at present");
});

test("unknown values, unknown fields and wrong types are rejected", () => {
  const cases = [
    [{ role: "Head of Everything" }, "role"],
    [{ problem_impacts: ["Staff time is lost", "Made up impact"] }, "problem_impacts"],
    [{ problem_impacts: [] }, "problem_impacts"],
    [{ problem_impacts: "Staff time is lost" }, "problem_impacts"],
    [{ tested_features: ["Braille Submissions", "Braille Submissions"] }, "tested_features"],
    [{ main_problem: "" }, "main_problem"],
    [{ main_problem: "x".repeat(2001) }, "main_problem"],
    [{ main_benefit: 42 }, "main_benefit"],
    [{ sentiment: "Positive" }, "sentiment"],
    [{ lead_score: 9 }, "lead_score"],
    [{ priority: "High" }, "priority"],
    [{ data_notice_acknowledged: false }, "data_notice_acknowledged"],
    [{ data_notice_acknowledged: "true" }, "data_notice_acknowledged"],
  ];
  for (const [override, field] of cases) {
    const result = validateSubmission(validSubmission(override));
    assert.equal(result.ok, false, JSON.stringify(override));
    assert.ok(field in result.errors, `${field} for ${JSON.stringify(override)}`);
  }
  for (const body of [null, "string", [], 5]) assert.equal(validateSubmission(body).ok, false);
});

test("conditional answers must match their trigger", () => {
  // Q9: detail required with Yes, not accepted with No.
  assert.equal(validateSubmission(validSubmission({ technical_blocker: "Yes" })).ok, false);
  assert.equal(validateSubmission(validSubmission({ technical_blocker: "Yes", technical_blocker_detail: "Login page did not load." })).ok, true);
  assert.equal(validateSubmission(validSubmission({ technical_blocker: "No", technical_blocker_detail: "stray" })).ok, false);
  // Q14: budget required with Yes/Possibly only.
  assert.equal(validateSubmission(validSubmission({ willingness_to_pay: "Yes", annual_budget_range: "" })).ok, false);
  assert.equal(validateSubmission(validSubmission({ willingness_to_pay: "No", annual_budget_range: "£10,000+" })).ok, false);
  assert.equal(validateSubmission(validSubmission({ willingness_to_pay: "Don't know", annual_budget_range: undefined })).ok, true);
  // Q13: "Other" explanation optional and only with Other.
  assert.equal(validateSubmission(validSubmission({ main_barrier: "Other" })).ok, true);
  assert.equal(validateSubmission(validSubmission({ main_barrier: "Other", main_barrier_other: "Union approval" })).ok, true);
  assert.equal(validateSubmission(validSubmission({ main_barrier: "Cost/budget", main_barrier_other: "stray" })).ok, false);
  // Q15: contact details required with permission Yes, rejected with No.
  assert.equal(validateSubmission(validSubmission({ followup_permission: "Yes" })).ok, false);
  assert.equal(validateSubmission(validSubmission({ followup_permission: "Yes", contact_name: "Test Person", contact_email: "not-an-email" })).ok, false);
  assert.equal(validateSubmission(validSubmission({ followup_permission: "Yes", contact_name: "Test Person", contact_email: "test.person@example.org" })).ok, true);
  assert.equal(validateSubmission(validSubmission({ followup_permission: "No", contact_email: "test.person@example.org" })).ok, false);
  assert.equal(validateSubmission(validSubmission({ followup_permission: "" })).ok, false, "permission answer is required");
});

// ── Neutral negative evidence paths (PR #1 correction) ─────────────────────────
test("A/B: 'no problem' pairs with no staff time and no current approach; the negative fixture records no artificial time cost", () => {
  const negative = negativeSubmission();
  assert.equal(negative.problem_frequency, "We do not experience this problem");
  assert.equal(negative.staff_time_burden, "No staff time / not applicable");
  assert.deepEqual(negative.current_approaches, ["Not applicable / no current problem to manage"]);
  const result = validateSubmission(negative);
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  assert.equal(result.value.staff_time_burden, "No staff time / not applicable");
  assert.deepEqual(result.value.current_approaches, ["Not applicable / no current problem to manage"]);
  const q6 = allFields().find((f) => f.field === "staff_time_burden").options;
  assert.equal(q6[0], "No staff time / not applicable");
  assert.ok(allFields().find((f) => f.field === "current_approaches").options.includes("Not applicable / no current problem to manage"));
});

test("C/D/E: exclusive answers cannot be combined with any other answer (server-side)", () => {
  const cases = [
    ["problem_impacts", ["No significant impact", "Staff time is lost"], "No significant impact"],
    ["tested_features", ["I only viewed the product", "Braille Submissions"], "I only viewed the product"],
    ["current_approaches", ["Not applicable / no current problem to manage", "QTVI/manual specialist process"], "Not applicable / no current problem to manage"],
  ];
  for (const [field, value, exclusive] of cases) {
    const result = validateSubmission(validSubmission({ [field]: value }));
    assert.equal(result.ok, false, field);
    assert.equal(result.errors[field], "“" + exclusive + "” cannot be combined with other answers.");
    // Order does not matter, and the exclusive answer on its own is valid.
    assert.equal(validateSubmission(validSubmission({ [field]: [...value].reverse() })).ok, false, field + " reversed");
    // Q7 "Not applicable" on its own is valid only alongside Q4 "no problem" (cross-field rule).
    const coherent = field === "current_approaches" ? { problem_frequency: "We do not experience this problem" } : {};
    assert.equal(validateSubmission(validSubmission({ [field]: [exclusive], ...coherent })).ok, true, field + " alone");
  }
  assert.deepEqual(
    QUESTIONS.filter((q) => q.exclusive).map((q) => [q.number, q.exclusive]),
    [
      [5, ["No significant impact"]],
      [7, ["Not applicable / no current problem to manage"]],
      [8, ["I only viewed the product"]],
    ],
  );
});

test("G/H: Q5 and Q7 'Other' details are optional, limited to 300 characters, and accepted only with 'Other'", () => {
  for (const [field, detail, other, notOther] of [
    ["problem_impacts", "problem_impacts_other", ["Other"], ["Staff time is lost"]],
    ["current_approaches", "current_approaches_other", ["Other", "General AI tools"], ["General AI tools"]],
  ]) {
    const withOther = validateSubmission(validSubmission({ [field]: other, [detail]: "  Synthetic other detail  " }));
    assert.equal(withOther.ok, true, JSON.stringify(withOther.errors));
    assert.equal(withOther.value[detail], "Synthetic other detail");
    const optional = validateSubmission(validSubmission({ [field]: other }));
    assert.equal(optional.ok, true, detail + " stays optional");
    assert.equal(optional.value[detail], null);
    const stray = validateSubmission(validSubmission({ [field]: notOther, [detail]: "stray" }));
    assert.equal(stray.ok, false);
    assert.ok(detail in stray.errors);
    assert.equal(validateSubmission(validSubmission({ [field]: other, [detail]: "x".repeat(301) })).ok, false, "300-character limit");
    assert.equal(allFields().find((f) => f.field === detail).maxLength, 300);
  }
});

// ── Q4/Q7 cross-field coherence (PR #1 final correction) ───────────────────────
test("A/G: Q7 'Not applicable' is valid with Q4 'no problem'; the full negative fixture stays valid", () => {
  const result = validateSubmission(validSubmission({ problem_frequency: NO_PROBLEM_FREQUENCY, current_approaches: [NOT_APPLICABLE_APPROACH] }));
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  const negative = validateSubmission(negativeSubmission());
  assert.equal(negative.ok, true, JSON.stringify(negative.errors));
  assert.deepEqual(negative.value.current_approaches, [NOT_APPLICABLE_APPROACH]);
});

test("B/C: Q7 'Not applicable' with a real Q4 frequency is rejected on Q7, never rewritten", () => {
  assert.equal(
    NOT_APPLICABLE_REQUIRES_NO_PROBLEM_MESSAGE,
    "Not applicable can only be selected when you have indicated that your organisation does not experience this problem.",
  );
  for (const frequency of ["Daily", "Weekly", "Several times a week", "Several times a month", "Monthly", "Rarely"]) {
    const result = validateSubmission(validSubmission({ problem_frequency: frequency, current_approaches: [NOT_APPLICABLE_APPROACH] }));
    assert.equal(result.ok, false, frequency);
    assert.deepEqual(result.errors, { current_approaches: NOT_APPLICABLE_REQUIRES_NO_PROBLEM_MESSAGE }, frequency);
    assert.equal(result.value, undefined, "no substituted or rewritten record is produced");
  }
});

test("D + inverse not forced: ordinary Q7 answers are valid with any Q4 answer, including 'no problem'", () => {
  for (const frequency of QUESTIONS.find((q) => q.field === "problem_frequency").options) {
    const result = validateSubmission(validSubmission({ problem_frequency: frequency, current_approaches: ["QTVI/manual specialist process"] }));
    assert.equal(result.ok, true, frequency + ": " + JSON.stringify(result.errors));
  }
  // Exclusivity is still checked first and keeps its own message.
  const mixed = validateSubmission(validSubmission({ problem_frequency: NO_PROBLEM_FREQUENCY, current_approaches: [NOT_APPLICABLE_APPROACH, "Other"] }));
  assert.equal(mixed.errors.current_approaches, "“" + NOT_APPLICABLE_APPROACH + "” cannot be combined with other answers.");
});
