import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import * as petService from "../../../services/petService.js";
import ApiError from "../../../utils/apiError.js";
import logger from "../../../utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "../../../uploads");

export default async function deletePetFile(req, res, next) {
  try {
    const { id, fileId } = req.params;
    const result = await petService.deleteFile(id, fileId, req.models);

    if (!result) {
      logger.warn(`⚠️ Απόπειρα διαγραφής αρχείου μη υπαρκτού κατοικιδίου (id: ${id})`);
      return next(ApiError.notFound("Το κατοικίδιο δεν βρέθηκε"));
    }

    if (result.deletedFilename) {
      const filePath = path.join(uploadsDir, result.deletedFilename);
      fs.unlink(filePath, (err) => {
        if (err && err.code !== "ENOENT") {
          logger.warn(`⚠️ Αποτυχία διαγραφής αρχείου από δίσκο: ${filePath}`, { stack: err.stack });
        }
      });
    }

    logger.info(`🗑️ Διαγράφηκε αρχείο για κατοικίδιο ${id}`);
    res.json({ message: "✅ Το αρχείο διαγράφηκε", files: result.files });
  } catch (error) {
    logger.error("❌ Σφάλμα κατά τη διαγραφή αρχείου", { stack: error.stack });
    next(error);
  }
}
