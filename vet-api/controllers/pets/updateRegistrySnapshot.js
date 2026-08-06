import logger from "../../utils/logger.js";

export default async function updateRegistrySnapshot(req, res, next) {
  try {
    const { Pet } = req.models;
    const microchip = String(req.params.microchip || "").trim();
    const { snapshot } = req.body;

    if (!microchip || !snapshot || typeof snapshot !== "object") {
      return res.status(400).json({ ok: false, message: "Missing microchip or snapshot" });
    }

    const update = {
      registrySnapshot: snapshot,
      registrySnapshotAt: new Date(),
    };

    if (typeof snapshot.isVaccinated === "boolean") update.vaccinated = snapshot.isVaccinated;
    if (typeof snapshot.isSterilized === "boolean") update.neutered = snapshot.isSterilized;

    const pet = await Pet.findOneAndUpdate({ microchip }, { $set: update }, { new: true });

    if (!pet) {
      logger.warn(`⚠️ Registry snapshot: δεν βρέθηκε κατοικίδιο για microchip ${microchip}`, { requestId: req.requestId, clinicId: req.clinicId });
      return res.status(404).json({ ok: false, message: "Pet not found for this microchip" });
    }

    return res.json({ ok: true, petId: pet._id });
  } catch (err) {
    next(err);
  }
}
