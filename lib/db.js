import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";

/**
 * Central persistence for validation responses (PostgreSQL via DATABASE_URL; Neon-compatible).
 *
 * The API handlers depend only on the repository interface:
 *   insertResponse(record) → { id, created_at }
 *   listResponses()        → stored rows, newest first
 * so tests and the local test backend inject an in-memory repository and never touch a real
 * database. Only raw submitted answers are stored — no derived sentiment, theme, priority or
 * lead-score fields exist in the schema (see db/schema.sql).
 */

export const RESPONSE_COLUMNS = [
  "id",
  "created_at",
  "role",
  "organisation_type",
  "organisation_name",
  "main_problem",
  "problem_frequency",
  "problem_impacts",
  "staff_time_burden",
  "current_approaches",
  "tested_features",
  "technical_blocker",
  "technical_blocker_detail",
  "solution_help",
  "current_process_comparison",
  "main_benefit",
  "main_barrier",
  "main_barrier_other",
  "willingness_to_pay",
  "annual_budget_range",
  "next_step_position",
  "followup_permission",
  "contact_name",
  "contact_email",
  "data_notice_acknowledged",
];

export class MissingDatabaseConfigError extends Error {
  constructor() {
    super("DATABASE_URL is not configured");
    this.name = "MissingDatabaseConfigError";
  }
}

/** PostgreSQL repository. `sql` is an injectable tagged-template client (defaults to Neon). */
export function createPostgresRepository(sql) {
  return {
    async insertResponse(record) {
      const id = randomUUID();
      const rows = await sql`
        INSERT INTO validation_responses (
          id, role, organisation_type, organisation_name, main_problem, problem_frequency,
          problem_impacts, staff_time_burden, current_approaches, tested_features,
          technical_blocker, technical_blocker_detail, solution_help, current_process_comparison,
          main_benefit, main_barrier, main_barrier_other, willingness_to_pay, annual_budget_range,
          next_step_position, followup_permission, contact_name, contact_email, data_notice_acknowledged
        ) VALUES (
          ${id}, ${record.role}, ${record.organisation_type}, ${record.organisation_name}, ${record.main_problem},
          ${record.problem_frequency}, ${JSON.stringify(record.problem_impacts)}::jsonb, ${record.staff_time_burden},
          ${JSON.stringify(record.current_approaches)}::jsonb, ${JSON.stringify(record.tested_features)}::jsonb,
          ${record.technical_blocker}, ${record.technical_blocker_detail}, ${record.solution_help},
          ${record.current_process_comparison}, ${record.main_benefit}, ${record.main_barrier},
          ${record.main_barrier_other}, ${record.willingness_to_pay}, ${record.annual_budget_range},
          ${record.next_step_position}, ${record.followup_permission}, ${record.contact_name},
          ${record.contact_email}, ${record.data_notice_acknowledged}
        )
        RETURNING id, created_at
      `;
      return rows[0];
    },
    async listResponses() {
      return sql`
        SELECT id, created_at, role, organisation_type, organisation_name, main_problem, problem_frequency,
               problem_impacts, staff_time_burden, current_approaches, tested_features, technical_blocker,
               technical_blocker_detail, solution_help, current_process_comparison, main_benefit, main_barrier,
               main_barrier_other, willingness_to_pay, annual_budget_range, next_step_position,
               followup_permission, contact_name, contact_email, data_notice_acknowledged
        FROM validation_responses
        ORDER BY created_at DESC
      `;
    },
  };
}

/** The production repository, created from DATABASE_URL at request time. */
export function databaseRepository(env = process.env) {
  const url = env.DATABASE_URL?.trim();
  if (!url) throw new MissingDatabaseConfigError();
  return createPostgresRepository(neon(url));
}

/** In-memory repository for automated tests and the local test backend only. */
export function createMemoryRepository() {
  const rows = [];
  return {
    rows,
    async insertResponse(record) {
      const row = { id: randomUUID(), created_at: new Date().toISOString(), ...record };
      rows.unshift(row);
      return { id: row.id, created_at: row.created_at };
    },
    async listResponses() {
      return rows.map((row) => ({ ...row }));
    },
  };
}
