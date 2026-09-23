/* ==========================================================================
   Braivanta validation site — participant journey
   - Questions 1–7 are answered before the demo and locked when the participant continues.
   - Questions 8–15 are answered after the demo.
   - Responses are stored only by the server (POST /api/feedback). Nothing is kept in
     persistent browser storage; sessionStorage holds only the locked pre-demo answers for
     this tab session and is cleared after a successful submission.
   - Team views require a server-validated token held in memory for this page only.
   ========================================================================== */

import { initAdmin } from "./admin.js";

const DEMO_URL = "https://insighted-ai-mvp.vercel.app/login";
const PRE_DEMO_SESSION_KEY = "braivanta_pre_demo_locked";
const MULTI_FIELDS = new Set(["problem_impacts", "current_approaches", "tested_features"]);
const SUBMIT_FAILED = "We couldn't record your response. Please try again.";

const form = document.getElementById("feedback-form");
const preGroup = document.getElementById("pre-demo-group");
const postGroup = document.getElementById("post-demo-group");

let lockedPreDemo = null;

// ---------------------------------------------------------------------------
// Session-only storage for the locked pre-demo answers (never the evidence store).
function sessionGet() {
  try {
    const raw = window.sessionStorage.getItem(PRE_DEMO_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function sessionSet(value) {
  try {
    window.sessionStorage.setItem(PRE_DEMO_SESSION_KEY, JSON.stringify(value));
  } catch {
    // Private mode or blocked storage: the lock still applies for this page view.
  }
}
function sessionClear() {
  try {
    window.sessionStorage.removeItem(PRE_DEMO_SESSION_KEY);
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Reading and writing answers
function fieldNames(scope) {
  return [...new Set([...scope.querySelectorAll("input[name], textarea[name], select[name]")].map((el) => el.name))];
}

function readValues(scope) {
  const values = {};
  for (const name of fieldNames(scope)) {
    const controls = [...scope.querySelectorAll(`[name="${CSS.escape(name)}"]`)];
    const first = controls[0];
    if (MULTI_FIELDS.has(name)) values[name] = controls.filter((c) => c.checked).map((c) => c.value);
    else if (first.type === "radio") values[name] = controls.find((c) => c.checked)?.value ?? "";
    else if (first.type === "checkbox") values[name] = first.checked;
    else values[name] = first.value.trim();
  }
  return values;
}

function writeValues(scope, values) {
  for (const [name, value] of Object.entries(values)) {
    for (const control of scope.querySelectorAll(`[name="${CSS.escape(name)}"]`)) {
      if (control.type === "radio") control.checked = control.value === value;
      else if (control.type === "checkbox") control.checked = Array.isArray(value) ? value.includes(control.value) : Boolean(value);
      else control.value = value ?? "";
    }
  }
}

// ---------------------------------------------------------------------------
// Conditional sub-questions (data-show-when="field=Value1|Value2")
function applyConditions() {
  for (const block of form.querySelectorAll("[data-show-when]")) {
    const [field, list] = block.dataset.showWhen.split("=");
    const current = form.querySelector(`input[name="${CSS.escape(field)}"]:checked`)?.value ?? "";
    const show = list.split("|").includes(current);
    block.hidden = !show;
    for (const control of block.querySelectorAll("input, textarea, select")) {
      control.disabled = !show;
      if (!show) {
        if (control.type === "radio" || control.type === "checkbox") control.checked = false;
        else control.value = "";
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Error display (messages associated with fields via aria-describedby)
function clearErrors() {
  for (const el of form.querySelectorAll(".field-error")) {
    el.hidden = true;
    el.textContent = "";
  }
  for (const el of form.querySelectorAll("[aria-invalid]")) el.removeAttribute("aria-invalid");
}

function showError(field, message) {
  const el = document.getElementById(`err-${field}`);
  if (!el) return;
  el.textContent = message;
  el.hidden = false;
  const target = document.getElementById(field) ?? document.getElementById(`field-${field}`) ?? form.querySelector(`[data-field="${CSS.escape(field)}"]`);
  target?.setAttribute("aria-invalid", "true");
}

function missingRequired(values, required) {
  const errors = {};
  for (const name of required) {
    const value = values[name];
    const empty = Array.isArray(value) ? value.length === 0 : !value;
    if (empty) errors[name] = MULTI_FIELDS.has(name) ? "Select at least one option." : "This answer is required.";
  }
  return errors;
}

function focusFirstError() {
  const el = form.querySelector(".field-error:not([hidden])");
  const container = el?.closest("fieldset, .sub-question, .data-notice, .phase-actions");
  const focusable = container?.querySelector("input:not([disabled]), textarea:not([disabled]), button:not([disabled])");
  (focusable ?? el)?.focus();
}

// ---------------------------------------------------------------------------
// Pre-demo lock: Q1–Q7 cannot be casually rewritten after seeing Braivanta.
const PRE_REQUIRED = ["role", "organisation_type", "main_problem", "problem_frequency", "problem_impacts", "staff_time_burden", "current_approaches"];

function lockPreDemo(values) {
  lockedPreDemo = values;
  writeValues(preGroup, values);
  preGroup.disabled = true;
  preGroup.classList.add("locked");
  document.getElementById("pre-demo-actions").hidden = true;
  document.getElementById("pre-demo-locked-note").hidden = false;
  postGroup.hidden = false;
  applyConditions();
}

function continueToDemo() {
  clearErrors();
  const values = readValues(preGroup);
  const errors = missingRequired(values, PRE_REQUIRED);
  if (Object.keys(errors).length) {
    for (const [field, message] of Object.entries(errors)) showError(field, message);
    showError("pre-demo", "Please answer Questions 1–7 before continuing to the demo.");
    focusFirstError();
    return;
  }
  sessionSet(values);
  lockPreDemo(values);
  window.open(DEMO_URL, "_blank", "noopener");
  const legend = postGroup.querySelector("legend");
  legend?.setAttribute("tabindex", "-1");
  legend?.focus();
}

// ---------------------------------------------------------------------------
// Submission: central backend only; success is shown only after the server confirms.
const POST_REQUIRED = ["tested_features", "technical_blocker", "solution_help", "current_process_comparison", "main_benefit", "main_barrier", "willingness_to_pay", "next_step_position", "followup_permission"];

async function submitFeedback(event) {
  event.preventDefault();
  clearErrors();
  if (!lockedPreDemo) {
    showError("pre-demo", "Please answer Questions 1–7 and continue to the demo first.");
    focusFirstError();
    return;
  }
  const post = readValues(postGroup);
  const errors = missingRequired(post, POST_REQUIRED);
  if (post.technical_blocker === "Yes" && !post.technical_blocker_detail) errors.technical_blocker_detail = "Please describe what happened.";
  if (["Yes", "Possibly"].includes(post.willingness_to_pay) && !post.annual_budget_range) errors.annual_budget_range = "Select a budget range, or choose “Unable to estimate”.";
  if (post.followup_permission === "Yes") {
    if (!post.contact_name) errors.contact_name = "Enter a contact name, or choose “No” for follow-up.";
    if (!post.contact_email) errors.contact_email = "Enter a work email, or choose “No” for follow-up.";
  }
  if (!post.data_notice_acknowledged) errors.data_notice_acknowledged = "Please confirm you have read the notice.";
  if (Object.keys(errors).length) {
    for (const [field, message] of Object.entries(errors)) showError(field, message);
    focusFirstError();
    return;
  }

  const payload = { ...lockedPreDemo, ...post, data_notice_acknowledged: post.data_notice_acknowledged === true };
  const button = document.getElementById("submit-feedback");
  button.disabled = true;
  button.textContent = "Submitting…";
  let response = null;
  let body = null;
  try {
    response = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    body = await response.json().catch(() => null);
  } catch {
    response = null;
  }
  button.disabled = false;
  button.textContent = "Submit feedback";

  if (response?.status === 201 && body?.ok === true) {
    // Participants see a confirmation only; they are never taken to team views.
    sessionClear();
    lockedPreDemo = null;
    form.reset();
    form.hidden = true;
    const confirmation = document.getElementById("submission-confirmation");
    confirmation.hidden = false;
    confirmation.focus();
    return;
  }
  if (response?.status === 400 && body?.errors) {
    for (const [field, message] of Object.entries(body.errors)) showError(field, message);
    showError("submit", "Some answers need attention before your response can be recorded.");
  } else {
    showError("submit", SUBMIT_FAILED);
  }
  focusFirstError();
}

// ---------------------------------------------------------------------------
// Tabs and modals
let admin = null;

function showTab(tabId) {
  for (const btn of document.querySelectorAll(".nav-btn")) {
    const active = btn.dataset.tab === tabId;
    btn.classList.toggle("active", active);
    if (active) btn.setAttribute("aria-current", "page");
    else btn.removeAttribute("aria-current");
  }
  for (const section of document.querySelectorAll(".tab-content")) section.classList.toggle("active", section.id === tabId);
}

let lastFocus = null;
function openModal(id) {
  const modal = document.getElementById(id);
  lastFocus = document.activeElement;
  modal.hidden = false;
  modal.classList.add("active");
  modal.querySelector("input, button")?.focus();
}
function closeModal(modal) {
  modal.hidden = true;
  modal.classList.remove("active");
  lastFocus?.focus?.();
}

function initNavigation() {
  for (const btn of document.querySelectorAll(".nav-btn")) {
    btn.addEventListener("click", () => {
      const tabId = btn.dataset.tab;
      if (btn.classList.contains("admin-tab") && !admin?.isUnlocked()) {
        admin?.setPendingTab(tabId);
        openModal("admin-auth-modal");
        return;
      }
      showTab(tabId);
    });
  }
  for (const btn of document.querySelectorAll("[data-go-tab]")) btn.addEventListener("click", () => showTab(btn.dataset.goTab));
  for (const btn of document.querySelectorAll("[data-open-modal]")) btn.addEventListener("click", () => openModal(btn.dataset.openModal));
  for (const btn of document.querySelectorAll("[data-close-modal]")) btn.addEventListener("click", () => closeModal(btn.closest(".modal-overlay")));
  for (const overlay of document.querySelectorAll(".modal-overlay")) {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal(overlay);
    });
  }
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const open = document.querySelector(".modal-overlay.active");
    if (open) closeModal(open);
  });
  document.querySelector("[data-print]")?.addEventListener("click", () => window.print());
}

// ---------------------------------------------------------------------------
function start() {
  initNavigation();
  admin = initAdmin({ showTab, closeLogin: () => closeModal(document.getElementById("admin-auth-modal")) });
  form.addEventListener("change", applyConditions);
  form.addEventListener("submit", submitFeedback);
  document.getElementById("continue-to-demo").addEventListener("click", continueToDemo);
  applyConditions();
  const restored = sessionGet();
  if (restored) lockPreDemo(restored);
}

// Module scripts run after parsing, so the DOM is ready.
start();
