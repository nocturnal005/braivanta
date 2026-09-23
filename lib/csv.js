/**
 * CSV evidence export: raw submitted answers only, one row per response.
 * No derived fields (no lead score/status, sentiment, theme or priority). Contact details are
 * included only when the respondent gave follow-up permission.
 */

export const CSV_COLUMNS = [
  ["response_id", (r) => r.id],
  ["timestamp", (r) => (r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at)],
  ["q1_role", (r) => r.role],
  ["q2_organisation_type", (r) => r.organisation_type],
  ["q2_organisation_name", (r) => r.organisation_name],
  ["q3_main_problem", (r) => r.main_problem],
  ["q4_problem_frequency", (r) => r.problem_frequency],
  ["q5_problem_impacts", (r) => r.problem_impacts],
  ["q5_problem_impacts_other", (r) => r.problem_impacts_other],
  ["q6_staff_time_burden", (r) => r.staff_time_burden],
  ["q7_current_approaches", (r) => r.current_approaches],
  ["q7_current_approaches_other", (r) => r.current_approaches_other],
  ["q8_tested_features", (r) => r.tested_features],
  ["q9_technical_blocker", (r) => r.technical_blocker],
  ["q9_technical_blocker_detail", (r) => r.technical_blocker_detail],
  ["q10_solution_help", (r) => r.solution_help],
  ["q11_current_process_comparison", (r) => r.current_process_comparison],
  ["q12_main_benefit", (r) => r.main_benefit],
  ["q13_main_barrier", (r) => r.main_barrier],
  ["q13_main_barrier_other", (r) => r.main_barrier_other],
  ["q14_willingness_to_pay", (r) => r.willingness_to_pay],
  ["q14_annual_budget_range", (r) => r.annual_budget_range],
  ["q15_next_step_position", (r) => r.next_step_position],
  ["q15_followup_permission", (r) => r.followup_permission],
  ["contact_name", (r) => (r.followup_permission === "Yes" ? r.contact_name : "")],
  ["contact_email", (r) => (r.followup_permission === "Yes" ? r.contact_email : "")],
  ["data_notice_acknowledged", (r) => (r.data_notice_acknowledged ? "Yes" : "No")],
];

function cell(value) {
  let text = Array.isArray(value) ? value.join("; ") : value === null || value === undefined ? "" : String(value);
  // Spreadsheet formula-injection guard.
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function toCsv(responses) {
  const lines = [CSV_COLUMNS.map(([name]) => name).join(",")];
  for (const r of responses) lines.push(CSV_COLUMNS.map(([, get]) => cell(get(r))).join(","));
  // BOM so spreadsheet software reads £ and en dashes as UTF-8.
  return `﻿${lines.join("\r\n")}\r\n`;
}
