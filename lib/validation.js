import {
  DATA_NOTICE_FIELD,
  NOT_APPLICABLE_APPROACH,
  NOT_APPLICABLE_REQUIRES_NO_PROBLEM_MESSAGE,
  NO_PROBLEM_FREQUENCY,
  allFields,
} from "./questionnaire.js";

/**
 * Server-side validation of a questionnaire submission. Browser validation is never trusted:
 * every field is checked against the explicit option sets in questionnaire.js, strings are
 * trimmed and length-limited, conditional fields must match their trigger, and unknown fields
 * (for example invented analysis fields such as sentiment or lead score) are rejected.
 *
 * Returns { ok: true, value } with a normalised record, or { ok: false, errors } where errors
 * maps field → plain message.
 */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_MULTI = 20;

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** A rule triggers when the answer (or, for multi-select, any selected answer) is in its list. */
function triggered(rule, input) {
  if (!rule) return false;
  const answer = input[rule.field];
  return Array.isArray(answer) ? answer.some((a) => rule.in.includes(a)) : rule.in.includes(answer);
}

export function validateSubmission(body) {
  if (!isPlainObject(body)) return { ok: false, errors: { _form: "The submission was not in the expected format." } };

  const fields = allFields();
  const known = new Set([...fields.map((f) => f.field), DATA_NOTICE_FIELD]);
  const errors = {};
  for (const key of Object.keys(body)) {
    if (!known.has(key)) errors[key] = "This field is not part of the questionnaire.";
  }

  // Normalise raw values first so conditional rules can read trimmed answers.
  const input = {};
  for (const f of fields) {
    const raw = body[f.field];
    if (f.type === "multi") input[f.field] = raw;
    else if (raw === undefined || raw === null) input[f.field] = "";
    else if (typeof raw === "string") input[f.field] = raw.trim();
    else input[f.field] = raw; // wrong type; rejected below
  }

  const value = {};
  for (const f of fields) {
    const raw = input[f.field];
    const required = f.requiredWhen ? triggered(f.requiredWhen, input) : !f.optional;
    const permitted = f.requiredWhen ? triggered(f.requiredWhen, input) : f.allowedWhen ? triggered(f.allowedWhen, input) : true;

    if (f.type === "multi") {
      if (!Array.isArray(raw) || raw.length === 0) {
        errors[f.field] = "Select at least one option.";
        continue;
      }
      if (raw.length > MAX_MULTI || raw.some((v) => typeof v !== "string" || !f.options.includes(v)) || new Set(raw).size !== raw.length) {
        errors[f.field] = "One or more selected options are not valid.";
        continue;
      }
      const exclusive = (f.exclusive ?? []).find((option) => raw.includes(option));
      if (exclusive && raw.length > 1) {
        errors[f.field] = `“${exclusive}” cannot be combined with other answers.`;
        continue;
      }
      value[f.field] = f.options.filter((option) => raw.includes(option)); // canonical order
      continue;
    }

    if (typeof raw !== "string") {
      errors[f.field] = "This answer is not in the expected format.";
      continue;
    }
    if (!raw) {
      if (required) errors[f.field] = "This answer is required.";
      else value[f.field] = null;
      continue;
    }
    if (!permitted) {
      errors[f.field] = "This answer does not apply to the option selected.";
      continue;
    }
    if (f.type === "single") {
      if (!f.options.includes(raw)) errors[f.field] = "Select one of the listed options.";
      else value[f.field] = raw;
      continue;
    }
    if (raw.length > f.maxLength) {
      errors[f.field] = `Please keep this answer under ${f.maxLength} characters.`;
      continue;
    }
    if (f.type === "email" && !EMAIL.test(raw)) {
      errors[f.field] = "Enter a valid email address.";
      continue;
    }
    value[f.field] = raw;
  }

  // Cross-field coherence (one direction only): Q7 "Not applicable" requires Q4 "no problem".
  // The submission is rejected, never rewritten.
  if (!errors.current_approaches && value.current_approaches?.includes(NOT_APPLICABLE_APPROACH) && input.problem_frequency !== NO_PROBLEM_FREQUENCY) {
    errors.current_approaches = NOT_APPLICABLE_REQUIRES_NO_PROBLEM_MESSAGE;
  }

  if (body[DATA_NOTICE_FIELD] !== true) errors[DATA_NOTICE_FIELD] = "Please confirm you have read the data notice.";
  else value[DATA_NOTICE_FIELD] = true;

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value };
}
