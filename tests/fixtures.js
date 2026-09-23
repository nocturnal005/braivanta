/**
 * Synthetic research fixtures for automated tests only. These are not real respondents,
 * organisations or evidence and are never written to a real database.
 */

export function validSubmission(overrides = {}) {
  return {
    role: "QTVI",
    organisation_type: "Local authority VI/Sensory Service",
    organisation_name: "Synthetic Test Service A",
    main_problem: "Synthetic fixture: turnaround of Braille work to teachers is slow.",
    problem_frequency: "Weekly",
    problem_impacts: ["Staff time is lost", "Teacher feedback is delayed"],
    staff_time_burden: "3–5 hours per week",
    current_approaches: ["QTVI/manual specialist process"],
    tested_features: ["Braille Submissions", "Review & Approvals"],
    technical_blocker: "No",
    solution_help: "Yes, somewhat",
    current_process_comparison: "Somewhat better",
    main_benefit: "Synthetic fixture: faster first drafts.",
    main_barrier: "Accuracy/reliability",
    willingness_to_pay: "Possibly",
    annual_budget_range: "£1,000–£2,999",
    next_step_position: "Would like to continue testing",
    followup_permission: "No",
    data_notice_acknowledged: true,
    ...overrides,
  };
}

/** A fully negative, but valid, response: no problem, no help, no payment, no interest. */
export function negativeSubmission(overrides = {}) {
  return validSubmission({
    organisation_name: "",
    main_problem: "We do not have a meaningful problem here.",
    problem_frequency: "We do not experience this problem",
    problem_impacts: ["No significant impact"],
    staff_time_burden: "Less than 1 hour per week",
    current_approaches: ["QTVI/manual specialist process"],
    tested_features: ["I only viewed the product"],
    solution_help: "No",
    current_process_comparison: "Much worse",
    main_benefit: "None",
    main_barrier: "Current process is already adequate",
    willingness_to_pay: "No",
    annual_budget_range: undefined,
    next_step_position: "No further interest at present",
    ...overrides,
  });
}

/** Minimal Vercel-style response double. */
export function mockResponse() {
  const res = {
    statusCode: 200,
    headers: {},
    body: undefined,
    setHeader(name, value) {
      res.headers[name.toLowerCase()] = value;
      return res;
    },
    status(code) {
      res.statusCode = code;
      return res;
    },
    json(body) {
      res.body = body;
      return res;
    },
    send(body) {
      res.body = body;
      return res;
    },
  };
  return res;
}
