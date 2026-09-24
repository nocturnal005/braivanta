import { databaseRepository } from "../lib/db.js";
import { createFeedbackHandler } from "../lib/handlers.js";

// POST /api/feedback — public participant submission (validated and stored server-side).
export default createFeedbackHandler({ getRepository: () => databaseRepository() });
