import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { DEMO_URL, QUESTIONS, allFields } from "../lib/questionnaire.js";

const html = readFileSync("index.html", "utf8");
const app = readFileSync("app.js", "utf8");
const admin = readFileSync("admin.js", "utf8");
const decode = (s) => s.replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
const visible = (s) => decode(s.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ");

function section(startMarker, endMarker) {
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker, start);
  assert.ok(start >= 0 && end > start, `${startMarker} … ${endMarker}`);
  return html.slice(start, end);
}
const questionNumbers = (fragment) => [...fragment.matchAll(/data-question="(\d+)"/g)].map((m) => Number(m[1]));
const optionsFor = (fragment, name) => [...fragment.matchAll(new RegExp(`name="${name}" value="([^"]*)"`, "g"))].map((m) => decode(m[1]));

test("the page has exactly 15 numbered questions: Q1–Q7 before the demo, Q8–Q15 after", () => {
  assert.deepEqual(questionNumbers(html), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
  const pre = section('<fieldset id="pre-demo-group"', 'id="pre-demo-actions"');
  const post = section('<fieldset id="post-demo-group"', "</form>");
  assert.deepEqual(questionNumbers(pre), [1, 2, 3, 4, 5, 6, 7]);
  assert.deepEqual(questionNumbers(post), [8, 9, 10, 11, 12, 13, 14, 15]);
  assert.match(html, /<fieldset id="post-demo-group" class="phase-group" hidden>/, "post-demo questions start hidden");
  assert.ok(html.indexOf('id="continue-to-demo"') > html.indexOf("data-question=\"7\"") && html.indexOf('id="continue-to-demo"') < html.indexOf("data-question=\"8\""));
  assert.match(html, />Continue to demo<\/button>/);
  // The data acknowledgement is outside the numbered questions (no 16th question).
  const notice = section('class="data-notice"', "</div>");
  assert.doesNotMatch(notice, /data-question/);
  assert.match(html, /name="data_notice_acknowledged"/);
});

test("every question and sub-question offers exactly the defined answers, in order", () => {
  for (const q of QUESTIONS) {
    const block = section(`data-question="${q.number}"`, q.number < 15 ? `data-question="${q.number + 1}"` : "</form>");
    assert.match(decode(block), new RegExp(`Q${q.number}</span> ${q.prompt.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`), `Q${q.number} prompt`);
    for (const f of [q, ...(q.extra ?? [])]) {
      if (f.options) assert.deepEqual(optionsFor(block, f.field), f.options, `${f.field} options`);
      else assert.match(block, new RegExp(`name="${f.field}"`), `${f.field} control`);
    }
  }
  // Every submitted field has exactly one control group on the page.
  for (const f of allFields()) assert.ok(html.includes(`name="${f.field}"`), f.field);
});

test("Q3 captures an unaided problem statement; negative and uncertain answers are offered", () => {
  const q3 = section('data-question="3"', 'data-question="4"');
  assert.match(q3, /<textarea id="main_problem" name="main_problem"/);
  assert.doesNotMatch(q3, /type="checkbox"|type="radio"/, "no checklist of Braivanta problems");
  const beforeQ3 = section('<fieldset id="pre-demo-group"', 'data-question="3"');
  assert.doesNotMatch(visible(beforeQ3), /Braille transcription|delays converting|answer leakage/i, "no problem priming before Q3");
  for (const text of ["We do not experience this problem", "No significant impact", "Probably not", "Much worse", "Current process is already adequate", "No further interest at present", "I am not involved in purchasing decisions", "Unable to judge"]) {
    assert.ok(decode(html).includes(`value="${text}"`), text);
  }
});

test("conditional follow-ups live inside their numbered question and start hidden", () => {
  assert.match(section('data-question="9"', 'data-question="10"'), /data-show-when="technical_blocker=Yes" hidden/);
  assert.match(section('data-question="13"', 'data-question="14"'), /data-show-when="main_barrier=Other" hidden/);
  assert.match(section('data-question="14"', 'data-question="15"'), /data-show-when="willingness_to_pay=Yes\|Possibly" hidden/);
  const q15 = section('data-question="15"', "</form>");
  assert.match(q15, /name="followup_permission" value="Yes"/);
  assert.match(q15, /id="field-contact_name" data-show-when="followup_permission=Yes" hidden/);
  assert.match(q15, /id="field-contact_email" data-show-when="followup_permission=Yes" hidden/);
  assert.doesNotMatch(section('data-question="14"', 'data-question="15"'), /£3,000 pilot|3,000 paid pilot/i, "no £3,000 anchor");
});

test("pre-demo answers lock before the demo opens, and the demo opens in a new tab", () => {
  assert.equal(DEMO_URL, "https://insighted-ai-mvp.vercel.app/login");
  assert.match(app, /const DEMO_URL = "https:\/\/insighted-ai-mvp\.vercel\.app\/login";/);
  const cont = app.slice(app.indexOf("function continueToDemo"), app.indexOf("// Submission"));
  assert.ok(cont.indexOf("lockPreDemo(values)") < cont.indexOf("window.open(DEMO_URL"), "lock happens before the demo opens");
  assert.match(cont, /window\.open\(DEMO_URL, "_blank", "noopener"\)/);
  const lock = app.slice(app.indexOf("function lockPreDemo"), app.indexOf("function continueToDemo"));
  assert.match(lock, /preGroup\.disabled = true;/);
  assert.match(lock, /postGroup\.hidden = false;/);
  // The submission uses the locked pre-demo snapshot, not re-read (editable) inputs.
  assert.match(app, /const payload = \{ \.\.\.lockedPreDemo, \.\.\.post, /);
  assert.ok(html.includes(DEMO_URL));
});

test("responses go only to POST /api/feedback; no persistent browser storage; success only after the server confirms", () => {
  for (const [name, code] of [["app.js", app], ["admin.js", admin], ["index.html", html]]) {
    assert.doesNotMatch(code, /localStorage/, name);
    assert.doesNotMatch(code, /braivanta_live_responses|capturedResponses/, name);
  }
  assert.match(app, /fetch\("\/api\/feedback", \{\n\s+method: "POST",/);
  const submit = app.slice(app.indexOf("async function submitFeedback"), app.indexOf("// Tabs and modals"));
  const successBranch = submit.slice(submit.indexOf("if (response?.status === 201 && body?.ok === true)"), submit.indexOf("if (response?.status === 400"));
  assert.match(successBranch, /confirmation\.hidden = false;/);
  assert.equal((submit.match(/confirmation\.hidden = false/g) ?? []).length, 1, "confirmation shown in exactly one (success) branch");
  assert.match(submit, /showError\("submit", SUBMIT_FAILED\);/);
  assert.match(app, /const SUBMIT_FAILED = "We couldn't record your response\. Please try again\.";/);
  assert.match(html, /Thank you\. Your feedback has been recorded\./);
  // Participants are never taken to the team views after submitting.
  assert.doesNotMatch(submit, /showTab|dashboard-tab|export-tab|initAdmin/);
  // sessionStorage holds only the locked pre-demo answers and is cleared on success.
  assert.match(successBranch, /sessionClear\(\);/);
});

test("no client-side admin credential or URL bypass exists", () => {
  for (const [name, code] of [["app.js", app], ["admin.js", admin], ["index.html", html]]) {
    assert.doesNotMatch(code, /ADMIN_PASSCODE|braivanta2026|passcode/i, name);
    assert.doesNotMatch(code, /URLSearchParams|location\.search|mode=admin|admin=true/, name);
    assert.doesNotMatch(code, /Clear Captured Data|clearAllCapturedData/, name);
  }
  assert.match(admin, /Authorization: `Bearer \$\{candidate\}`/);
  assert.match(admin, /let token = null;/);
});

test("the review sheet describes the current modules; old names are gone", () => {
  const sheet = visible(section('id="review-page-tab"', "<!-- ==================== FEEDBACK QUESTIONNAIRE"));
  const expected = {
    "Braille Submissions": "Upload Braille material, produce an English draft, require specialist verification, then support teacher assessment/feedback.",
    "Assessment-Safe": "Prepare accessible descriptions of visual assessment material while protecting against answer leakage and requiring human approval.",
    "Tactile Graphics & STEM": "Support preparation of complex diagrams/graphs/STEM material for tactile adaptation and specialist review.",
    "Pupil Voice": "Capture learner voice as first-party evidence for professional review without automated interpretation.",
    "Review & Approvals": "Role-aware cross-module review workflow showing what requires action and preserving approval evidence.",
  };
  for (const [name, description] of Object.entries(expected)) {
    assert.ok(sheet.includes(name), name);
    assert.ok(sheet.includes(description), description);
  }
  assert.doesNotMatch(visible(html), /Pupil Records|Braille Work Review/);
  assert.doesNotMatch(html, />\s*STEM Support\s*</, "old module name is not used as a heading or label");
});

test("participant-facing copy makes no unsupported privacy or compliance claims", () => {
  const text = visible(html);
  for (const claim of [/AES-?256/i, /UK-based data cent(er|re)s?/i, /zero-retention/i, /DPIA/, /Data Processing Agreement/i, /DfE/, /TLS 1\.3/, /Cloud Security/i, /compliant/i, /encrypted at rest/i]) {
    assert.doesNotMatch(text, claim, String(claim));
  }
  const notice = visible(section('class="data-notice"', "</div>"));
  for (const point of [/professional feedback for Braivanta product and market validation/, /Anonymised findings may be used in business-plan and market-validation evidence/, /used only for follow-up/, /do not enter pupil-identifiable information/i, /contact Braivanta about your submitted feedback/]) {
    assert.match(notice, point);
  }
  const modal = visible(section('id="privacy-modal"', "<!-- ==================== TEAM LOGIN"));
  assert.match(modal, /demo or anonymised material only/i);
  assert.match(modal, /pupil names, confidential school records, live assessment material/);
  assert.match(modal, /not presented as production infrastructure/);
});

test("accessibility: grouped options use fieldset/legend, and every control is labelled", () => {
  const questions = [...html.matchAll(/<fieldset class="question"[^>]*>\s*<legend>/g)];
  assert.equal(questions.length, 15);
  const withoutWrap = html.replace(/<label[^>]*>[\s\S]*?<\/label>/g, "");
  for (const m of withoutWrap.matchAll(/<(input|textarea)\b[^>]*>/g)) {
    const id = /\bid="([^"]+)"/.exec(m[0])?.[1];
    assert.ok(id && html.includes(`for="${id}"`), `unlabelled control: ${m[0]}`);
  }
  assert.match(html, /<html lang="en-GB">/);
  assert.match(readFileSync("styles.css", "utf8"), /:focus-visible \{/);
  assert.match(readFileSync("styles.css", "utf8"), /\.field-error::before \{ content: "Error: "; \}/, "errors are not colour-only");
});

// ── Neutral negative evidence paths (PR #1 correction) ─────────────────────────
test("F/I: exclusive answers are marked on the page exactly as defined, enforced in the browser, and there are still 15 questions", () => {
  assert.equal([...html.matchAll(/data-question="/g)].length, 15);
  const marked = [...html.matchAll(/name="([a-z_]+)" value="([^"]*)" data-exclusive/g)].map((m) => [m[1], decode(m[2])]);
  const defined = QUESTIONS.filter((q) => q.exclusive).flatMap((q) => q.exclusive.map((option) => [q.field, option]));
  assert.deepEqual(marked, defined);
  assert.equal((html.match(/data-exclusive/g) ?? []).length, 3);
  // Browser: an exclusive choice clears the rest; any other choice clears the exclusive one.
  const handler = app.slice(app.indexOf("function enforceExclusive"), app.indexOf("// Conditional sub-questions"));
  assert.match(handler, /if \(input\.type !== "checkbox" \|\| !input\.checked \|\| !MULTI_FIELDS\.has\(input\.name\)\) return;/);
  assert.match(handler, /if \(other !== input && \(input\.hasAttribute\("data-exclusive"\) \|\| other\.hasAttribute\("data-exclusive"\)\)\) other\.checked = false;/);
  assert.match(app, /form\.addEventListener\("change", \(event\) => \{\n\s+enforceRequirements\(event\);\n\s+enforceExclusive\(event\);\n\s+applyConditions\(\);/);
  assert.match(app, /const MULTI_FIELDS = new Set\(\["problem_impacts", "current_approaches", "tested_features"\]\);/);
});

test("G/H: Q5 and Q7 'Other' details sit inside their question and appear only when 'Other' is selected", () => {
  const q5 = section('data-question="5"', 'data-question="6"');
  const q7 = section('data-question="7"', 'id="pre-demo-actions"');
  assert.match(q5, /<div class="sub-question" id="field-problem_impacts_other" data-show-when="problem_impacts=Other" hidden>/);
  assert.match(q5, /<label for="problem_impacts_other">Please specify the other impact \(optional\)<\/label>/);
  assert.match(q5, /name="problem_impacts_other" class="form-input" maxlength="300"/);
  assert.match(q7, /<div class="sub-question" id="field-current_approaches_other" data-show-when="current_approaches=Other" hidden>/);
  assert.match(q7, /<label for="current_approaches_other">Please specify the other approach \(optional\)<\/label>/);
  assert.match(q7, /name="current_approaches_other" class="form-input" maxlength="300"/);
  // Conditions read every selected checkbox, so a multi-select "Other" reveals the detail.
  assert.ok(app.includes('const current = [...form.querySelectorAll(`input[name="${CSS.escape(field)}"]:checked`)].map((c) => c.value);'));
  assert.ok(app.includes('const show = list.split("|").some((value) => current.includes(value));'));
});

// ── Q4/Q7 cross-field coherence (PR #1 final correction) ───────────────────────
test("E/F/I: the browser clears Q7 'Not applicable' unless Q4 says 'no problem', and never selects it automatically", () => {
  assert.equal([...html.matchAll(/data-question="/g)].length, 15);
  const requires = [...html.matchAll(/<input type="checkbox" name="([a-z_]+)" value="([^"]*)"[^>]*data-requires="([^"]*)" data-requires-message="([^"]*)">/g)];
  assert.equal(requires.length, 1, "exactly one cross-field rule");
  assert.deepEqual([requires[0][1], requires[0][2], requires[0][3]], ["current_approaches", "Not applicable / no current problem to manage", "problem_frequency=We do not experience this problem"]);
  assert.equal(requires[0][4], "Not applicable can only be selected when you have indicated that your organisation does not experience this problem.");
  assert.match(html, /<p class="field-error" id="err-current_approaches" aria-live="polite" hidden><\/p>/, "accessible message");

  const handler = app.slice(app.indexOf("function requirementMet"), app.indexOf("// Conditional sub-questions"));
  // Runs for the Q7 checkbox itself (F) and for any change to the Q4 answer (E).
  assert.ok(handler.includes("if (target !== control && target.name !== field) continue;"));
  assert.ok(handler.includes("if (control.checked && !requirementMet(control)) {\n      control.checked = false;\n      showError(control.name, control.dataset.requiresMessage);"));
  assert.doesNotMatch(handler, /\.checked = true/, "never selects anything on the participant's behalf");
  assert.ok(app.includes("form.addEventListener(\"change\", (event) => {\n    enforceRequirements(event);\n    enforceExclusive(event);\n    applyConditions();"));
  // Continue-to-demo mirrors the rule too.
  assert.ok(app.includes('for (const control of preGroup.querySelectorAll("input[data-requires]:checked")) {'));
});
