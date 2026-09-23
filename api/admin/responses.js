import { databaseRepository } from "../../lib/db.js";
import { createAdminResponsesHandler } from "../../lib/handlers.js";

// GET /api/admin/responses — requires Authorization: Bearer <BRAIVANTA_VALIDATION_ADMIN_TOKEN>.
export default createAdminResponsesHandler({ getRepository: () => databaseRepository() });
