import * as petService from "../../../services/petService.js";
import ApiError from "../../../utils/apiError.js";
import logger from "../../../utils/logger.js";

export default async function addPetFile(req, res, next) {
  try {
    const { id } = req.params;
    const file = req.uploadedFile;

    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    const fileData = {
      name: (file.originalname || file.filename).slice(0, 200),
      url: `${baseUrl}/uploads/${file.filename}`,
      filename: file.filename,
      mimeType: file.mimetype,
      size: file.size,
    };

    const pet = await petService.addFile(id, fileData, req.models);

    if (!pet) {
      logger.warn(`⚠️ Δεν βρέθηκε κατοικίδιο για προσθήκη αρχείου (id: ${id})`);
      return next(ApiError.notFound("Το κατοικίδιο δεν βρέθηκε"));
    }

    logger.info(`📎 Προστέθηκε αρχείο για κατοικίδιο: ${pet.name}`);
    res.status(201).json(pet);
  } catch (error) {
    logger.error("❌ Σφάλμα κατά την προσθήκη αρχείου", { stack: error.stack });
    next(error);
  }
}
