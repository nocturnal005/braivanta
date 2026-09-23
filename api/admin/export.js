import { databaseRepository } from "../../lib/db.js";
import { createAdminExportHandler } from "../../lib/handlers.js";

// GET /api/admin/export — CSV evidence export; requires Authorization: Bearer <token>.
export default createAdminExportHandler({ getRepository: () => databaseRepository() });
