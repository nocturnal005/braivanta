import { allFields } from "./questionnaire.js";

/**
 * Evidence summaries for the team dashboard: "what evidence have we actually collected?"
 *
 * Rules:
 * - Every percentage carries its count and denominator ("5 of 8 (62.5%)").
 * - Categories are reported as answered; nothing is merged (Yes and Possibly stay separate),
 *   scored, ranked into lead temperatures or classified for sentiment/theme.
 * - Negative answers are counted like any other answer; denominators are never reduced to
 *   strengthen a figure. Conditional questions state their own denominator.
 * - Feature use is counted only from respondents who selected that function as tested.
 */

const optionsOf = (field) => allFields().find((f) => f.field === field).options;

export function formatPercentage(count, denominator) {
  if (!denominator) return null;
  const pct = (count / denominator) * 100;
  return Math.round(pct * 10) / 10;
}

export function share(count, denominator) {
  const percentage = formatPercentage(count, denominator);
  return {
    count,
    denominator,
    percentage,
    label: percentage === null ? `${count} of ${denominator}` : `${count} of ${denominator} (${percentage}%)`,
  };
}

/** Single-choice distribution over `responses` (every option listed, including zero counts). */
export function singleDistribution(responses, field, options = optionsOf(field)) {
  const denominator = responses.length;
  return {
    field,
    denominator,
    multiple: false,
    rows: options.map((option) => ({ option, ...share(responses.filter((r) => r[field] === option).length, denominator) })),
  };
}

/** Multi-select distribution: denominator is respondents; percentages need not sum to 100%. */
export function multiDistribution(responses, field, options = optionsOf(field)) {
  const denominator = responses.length;
  return {
    field,
    denominator,
    multiple: true,
    note: "Respondents could select more than one option, so percentages do not sum to 100%.",
    rows: options.map((option) => ({
      option,
      ...share(responses.filter((r) => Array.isArray(r[field]) && r[field].includes(option)).length, denominator),
    })),
  };
}

const normaliseName = (name) => (typeof name === "string" ? name.trim().replace(/\s+/g, " ").toLowerCase() : "");

function rawText(responses, field, extra = () => ({})) {
  return responses
    .filter((r) => typeof r[field] === "string" && r[field].trim())
    .map((r) => ({ id: r.id, created_at: r.created_at, role: r.role, organisation_type: r.organisation_type, text: r[field], ...extra(r) }));
}

export function summarise(responses) {
  const total = responses.length;
  const named = responses.filter((r) => normaliseName(r.organisation_name));
  const uniqueNames = new Set(named.map((r) => normaliseName(r.organisation_name)));

  const willingToConsider = responses.filter((r) => r.willingness_to_pay === "Yes" || r.willingness_to_pay === "Possibly");
  const budget = singleDistribution(willingToConsider, "annual_budget_range");
  budget.note = `Asked only when willingness to pay was "Yes" or "Possibly": ${willingToConsider.length} of ${total} respondents.`;

  const blocked = responses.filter((r) => r.technical_blocker === "Yes");

  return {
    sample: {
      completedResponses: total,
      namedOrganisations: {
        count: uniqueNames.size,
        respondentsWithName: named.length,
        respondentsWithoutName: total - named.length,
        note: "Distinct organisation names given by respondents (case and spacing ignored). Responses without a name are not counted as organisations.",
      },
      byRole: singleDistribution(responses, "role"),
      byOrganisationType: singleDistribution(responses, "organisation_type"),
    },
    problem: {
      frequency: singleDistribution(responses, "problem_frequency"),
      staffTime: singleDistribution(responses, "staff_time_burden"),
      impacts: multiDistribution(responses, "problem_impacts"),
      currentApproaches: multiDistribution(responses, "current_approaches"),
      mainProblems: rawText(responses, "main_problem"),
    },
    solution: {
      testedFeatures: multiDistribution(responses, "tested_features"),
      technicalBlocker: singleDistribution(responses, "technical_blocker", ["No", "Yes"]),
      technicalDetails: rawText(blocked, "technical_blocker_detail"),
      solutionHelp: singleDistribution(responses, "solution_help"),
      comparison: singleDistribution(responses, "current_process_comparison"),
      mainBenefits: rawText(responses, "main_benefit"),
      barriers: singleDistribution(responses, "main_barrier"),
      barrierOther: rawText(responses, "main_barrier_other"),
    },
    commercial: {
      willingnessToPay: singleDistribution(responses, "willingness_to_pay"),
      annualBudget: budget,
      nextStep: singleDistribution(responses, "next_step_position"),
      followupPermission: singleDistribution(responses, "followup_permission", ["Yes", "No"]),
    },
    qualitative: responses.map((r) => ({
      id: r.id,
      created_at: r.created_at,
      role: r.role,
      organisation_type: r.organisation_type,
      main_problem: r.main_problem,
      main_benefit: r.main_benefit,
      technical_issue: r.technical_blocker === "Yes" ? r.technical_blocker_detail || "Yes (no detail given)" : "No",
      main_barrier: r.main_barrier === "Other" && r.main_barrier_other ? `Other: ${r.main_barrier_other}` : r.main_barrier,
      next_step_position: r.next_step_position,
    })),
  };
}
