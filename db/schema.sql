-- Braivanta customer-demand validation responses.
--
-- Apply once to the validation database (for example in the Neon SQL editor) before the site
-- accepts submissions. This table holds only raw participant answers to the 15-question
-- questionnaire: there are deliberately no sentiment, theme, priority, lead-score or
-- lead-status columns. Multi-select answers are stored as JSONB arrays.

CREATE TABLE IF NOT EXISTS validation_responses (
  id                          uuid        PRIMARY KEY,
  created_at                  timestamptz NOT NULL DEFAULT now(),

  -- Q1–Q7: before the demo
  role                        text        NOT NULL,
  organisation_type           text        NOT NULL,
  organisation_name           text,
  main_problem                text        NOT NULL,
  problem_frequency           text        NOT NULL,
  problem_impacts             jsonb       NOT NULL,
  problem_impacts_other       text,
  staff_time_burden           text        NOT NULL,
  current_approaches          jsonb       NOT NULL,
  current_approaches_other    text,

  -- Q8–Q15: after the demo
  tested_features             jsonb       NOT NULL,
  technical_blocker           text        NOT NULL,
  technical_blocker_detail    text,
  solution_help               text        NOT NULL,
  current_process_comparison  text        NOT NULL,
  main_benefit                text        NOT NULL,
  main_barrier                text        NOT NULL,
  main_barrier_other          text,
  willingness_to_pay          text        NOT NULL,
  annual_budget_range         text,
  next_step_position          text        NOT NULL,
  followup_permission         text        NOT NULL,
  contact_name                text,
  contact_email               text,

  -- Required data-notice acknowledgement (outside the numbered questionnaire)
  data_notice_acknowledged    boolean     NOT NULL,

  CONSTRAINT problem_impacts_is_array    CHECK (jsonb_typeof(problem_impacts) = 'array'),
  CONSTRAINT current_approaches_is_array CHECK (jsonb_typeof(current_approaches) = 'array'),
  CONSTRAINT tested_features_is_array    CHECK (jsonb_typeof(tested_features) = 'array'),
  CONSTRAINT contact_only_with_permission CHECK (
    followup_permission = 'Yes' OR (contact_name IS NULL AND contact_email IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS validation_responses_created_at_idx ON validation_responses (created_at DESC);
