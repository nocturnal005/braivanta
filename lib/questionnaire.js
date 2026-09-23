/**
 * The Braivanta customer-demand validation questionnaire: exactly 15 numbered questions.
 *
 * Sequence (Innovator International evidence principle):
 *   PROBLEM → PAIN → COST OF PAIN → CURRENT ALTERNATIVES (Q1–Q7, before the demo)
 *   → PRODUCT TESTING → SOLUTION FIT → BARRIERS → WILLINGNESS TO PAY → NEXT STEP (Q8–Q15, after)
 *
 * This file is the single source of truth for fields and allowed answers. The server validates
 * every submission against it; the questionnaire HTML is tested against it. Negative and
 * uncertain answers are first-class options, never filtered out. `exclusive` answers (for example
 * "No significant impact") cannot be combined with any other answer to the same question.
 */

export const PRE_DEMO = "pre_demo";
export const POST_DEMO = "post_demo";

export const QUESTIONS = [
  {
    number: 1,
    phase: PRE_DEMO,
    field: "role",
    type: "single",
    prompt: "What best describes your professional role?",
    options: [
      "QTVI",
      "Teaching Assistant",
      "Teacher",
      "SENCO",
      "VI/Sensory Service Lead",
      "School/Trust Leader",
      "Local Authority Officer",
      "Accessibility / Inclusion Specialist",
      "IT / Data Protection",
      "Procurement / Finance",
      "Other",
    ],
  },
  {
    number: 2,
    phase: PRE_DEMO,
    field: "organisation_type",
    type: "single",
    prompt: "What type of organisation do you work for?",
    options: [
      "Mainstream school",
      "Specialist school",
      "Multi-academy trust",
      "Local authority VI/Sensory Service",
      "Independent/specialist service",
      "Further education provider",
      "Higher education provider",
      "Charity / specialist organisation",
      "Other",
    ],
    // Same numbered question: optional organisation name.
    extra: [{ field: "organisation_name", type: "text", optional: true, maxLength: 200, label: "Organisation / service name (optional)" }],
  },
  {
    number: 3,
    phase: PRE_DEMO,
    field: "main_problem",
    type: "text",
    maxLength: 2000,
    prompt:
      "Before seeing Braivanta: What is the main difficulty, if any, your organisation currently experiences when supporting visually impaired learners with accessible learning materials?",
  },
  {
    number: 4,
    phase: PRE_DEMO,
    field: "problem_frequency",
    type: "single",
    prompt: "How frequently does this problem occur?",
    options: ["Daily", "Several times a week", "Weekly", "Several times a month", "Monthly", "Rarely", "We do not experience this problem"],
  },
  {
    number: 5,
    phase: PRE_DEMO,
    field: "problem_impacts",
    type: "multi",
    prompt: "What impact does this problem currently have?",
    options: [
      "Staff time is lost",
      "Teacher feedback is delayed",
      "Pupil feedback is delayed",
      "Specialist staff capacity is stretched",
      "Learning/assessment materials are delayed",
      "Additional external costs are incurred",
      "Records/reviews are difficult to coordinate",
      "No significant impact",
      "Other",
    ],
    // Cannot be combined with any other impact (browser and server).
    exclusive: ["No significant impact"],
    extra: [
      {
        field: "problem_impacts_other",
        type: "text",
        optional: true,
        maxLength: 300,
        allowedWhen: { field: "problem_impacts", in: ["Other"] },
        label: "Please specify the other impact (optional)",
      },
    ],
  },
  {
    number: 6,
    phase: PRE_DEMO,
    field: "staff_time_burden",
    type: "single",
    prompt: "Approximately how much staff time is spent dealing with this problem?",
    options: [
      "No staff time / not applicable",
      "Less than 1 hour per week",
      "1–2 hours per week",
      "3–5 hours per week",
      "6–10 hours per week",
      "More than 10 hours per week",
      "Unable to estimate",
    ],
  },
  {
    number: 7,
    phase: PRE_DEMO,
    field: "current_approaches",
    type: "multi",
    prompt: "How does your organisation currently manage this problem?",
    options: [
      "QTVI/manual specialist process",
      "Braille-literate TA",
      "Teacher/manual process",
      "External specialist/service",
      "Existing accessibility software",
      "General AI tools",
      "Email/spreadsheets/documents",
      "No consistent process",
      "Other",
      "Not applicable / no current problem to manage",
    ],
    exclusive: ["Not applicable / no current problem to manage"],
    extra: [
      {
        field: "current_approaches_other",
        type: "text",
        optional: true,
        maxLength: 300,
        allowedWhen: { field: "current_approaches", in: ["Other"] },
        label: "Please specify the other approach (optional)",
      },
    ],
  },
  {
    number: 8,
    phase: POST_DEMO,
    field: "tested_features",
    type: "multi",
    prompt: "Which Braivanta functions did you actually test?",
    options: [
      "Braille Submissions",
      "Assessment-Safe",
      "Tactile Graphics & STEM",
      "Pupil Voice",
      "Review & Approvals",
      "Dashboard",
      "I only viewed the product",
    ],
    exclusive: ["I only viewed the product"],
  },
  {
    number: 9,
    phase: POST_DEMO,
    field: "technical_blocker",
    type: "single",
    prompt: "Did anything technical prevent you from properly evaluating the demo?",
    options: ["No", "Yes"],
    extra: [
      {
        field: "technical_blocker_detail",
        type: "text",
        maxLength: 1000,
        requiredWhen: { field: "technical_blocker", in: ["Yes"] },
        label: "Please briefly describe what happened.",
      },
    ],
  },
  {
    number: 10,
    phase: POST_DEMO,
    field: "solution_help",
    type: "single",
    prompt: "Based on what you tested, would Braivanta help address the main problem you identified earlier?",
    options: ["Yes, substantially", "Yes, somewhat", "Possibly", "Probably not", "No", "Unable to judge"],
  },
  {
    number: 11,
    phase: POST_DEMO,
    field: "current_process_comparison",
    type: "single",
    prompt: "Compared with your current way of working, Braivanta appears to be:",
    options: ["Much better", "Somewhat better", "About the same", "Somewhat worse", "Much worse", "Unable to judge"],
  },
  {
    number: 12,
    phase: POST_DEMO,
    field: "main_benefit",
    type: "text",
    maxLength: 2000,
    prompt: "What is the main benefit Braivanta could provide to your organisation, if any?",
  },
  {
    number: 13,
    phase: POST_DEMO,
    field: "main_barrier",
    type: "single",
    prompt: "What is the main concern or barrier that could prevent your organisation from using Braivanta?",
    options: [
      "Accuracy/reliability",
      "Data protection/security",
      "Staff training",
      "Integration with existing systems",
      "Cost/budget",
      "Procurement/approval",
      "Need for more evidence/testing",
      "Current process is already adequate",
      "No significant barrier",
      "Other",
    ],
    extra: [
      {
        field: "main_barrier_other",
        type: "text",
        optional: true,
        maxLength: 300,
        allowedWhen: { field: "main_barrier", in: ["Other"] },
        label: "If other, please specify (optional)",
      },
    ],
  },
  {
    number: 14,
    phase: POST_DEMO,
    field: "willingness_to_pay",
    type: "single",
    prompt: "If Braivanta demonstrated clear value, would your organisation consider paying for it?",
    options: ["Yes", "Possibly", "No", "Don't know", "I am not involved in purchasing decisions"],
    extra: [
      {
        field: "annual_budget_range",
        type: "single",
        requiredWhen: { field: "willingness_to_pay", in: ["Yes", "Possibly"] },
        label: "What annual budget range might realistically be considered?",
        options: ["Under £1,000", "£1,000–£2,999", "£3,000–£4,999", "£5,000–£9,999", "£10,000+", "Depends on scope/users", "Unable to estimate"],
      },
    ],
  },
  {
    number: 15,
    phase: POST_DEMO,
    field: "next_step_position",
    type: "single",
    prompt: "Which statement best describes your organisation's position after reviewing Braivanta?",
    options: [
      "No further interest at present",
      "Interested in receiving more information",
      "Willing to have a follow-up conversation",
      "Would like to continue testing",
      "Would consider a controlled pilot",
      "Would consider a paid pilot",
      "Would introduce Braivanta to the relevant decision-maker",
    ],
    extra: [
      { field: "followup_permission", type: "single", label: "May we contact you regarding this response?", options: ["Yes", "No"] },
      { field: "contact_name", type: "text", maxLength: 120, requiredWhen: { field: "followup_permission", in: ["Yes"] }, label: "Contact name" },
      { field: "contact_email", type: "email", maxLength: 254, requiredWhen: { field: "followup_permission", in: ["Yes"] }, label: "Work email" },
    ],
  },
];

/** Required acknowledgement outside the numbered questionnaire (not a 16th question). */
export const DATA_NOTICE_FIELD = "data_notice_acknowledged";

export const DEMO_URL = "https://insighted-ai-mvp.vercel.app/login";

/** Every submitted field, main and extra, in questionnaire order. */
export function allFields() {
  return QUESTIONS.flatMap((q) => [q, ...(q.extra ?? [])]);
}

export function questionFor(field) {
  return QUESTIONS.find((q) => q.field === field || (q.extra ?? []).some((e) => e.field === field)) ?? null;
}
