import logger from "../utils/logger.js";

// Όλες οι συναρτήσεις δέχονται { Pet, Customer } ως δεύτερο όρισμα (dependency injection)

export async function createPet(data, { Pet }) {
  try {
    const pet = new Pet(data);
    const saved = await pet.save();
    logger.info(`🐾 Δημιουργήθηκε νέο κατοικίδιο: ${saved.name} (${saved.species})`);
    return saved;
  } catch (err) {
    logger.error("❌ Σφάλμα κατά τη δημιουργία κατοικιδίου", { stack: err.stack });
    throw err;
  }
}

export async function getAllPets({ Pet }) {
  try {
    const pets = await Pet.find().populate("owner").sort({ createdAt: -1 });
    logger.info(`📋 Επιστράφηκαν ${pets.length} κατοικίδια`);
    return pets;
  } catch (err) {
    logger.error("❌ Σφάλμα κατά τη λήψη όλων των κατοικιδίων", { stack: err.stack });
    throw err;
  }
}

export async function getPetsByOwner(ownerId, { Pet }) {
  try {
    const pets = await Pet.find({ owner: ownerId }).sort({ createdAt: -1 });
    logger.info(`👤 Επιστράφηκαν ${pets.length} κατοικίδια για ownerId: ${ownerId}`);
    return pets;
  } catch (err) {
    logger.error("❌ Σφάλμα κατά τη λήψη κατοικιδίων ανά ιδιοκτήτη", { stack: err.stack });
    throw err;
  }
}

export async function getPetById(id, { Pet }) {
  try {
    const pet = await Pet.findById(id).populate("owner");
    if (!pet) {
      logger.warn(`⚠️ Δεν βρέθηκε κατοικίδιο με id: ${id}`);
      return null;
    }
    logger.info(`📄 Επιστράφηκαν στοιχεία κατοικιδίου: ${pet.name}`);
    return pet;
  } catch (err) {
    logger.error("❌ Σφάλμα κατά τη λήψη κατοικιδίου με ID", { stack: err.stack });
    throw err;
  }
}

export async function updatePet(id, data, { Pet }) {
  try {
    const updated = await Pet.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).populate("owner");
    if (!updated) {
      logger.warn(`⚠️ Απόπειρα ενημέρωσης μη υπαρκτού κατοικιδίου (id: ${id})`);
      return null;
    }
    logger.info(`✏️ Ενημερώθηκε κατοικίδιο: ${updated.name}`);
    return updated;
  } catch (err) {
    logger.error("❌ Σφάλμα κατά την ενημέρωση κατοικιδίου", { stack: err.stack });
    throw err;
  }
}

export async function deletePet(id, { Pet }) {
  try {
    const deleted = await Pet.findByIdAndDelete(id);
    if (!deleted) {
      logger.warn(`⚠️ Απόπειρα διαγραφής μη υπαρκτού κατοικιδίου (id: ${id})`);
      return null;
    }
    logger.info(`🗑️ Διαγράφηκε κατοικίδιο: ${deleted.name}`);
    return deleted;
  } catch (err) {
    logger.error("❌ Σφάλμα κατά τη διαγραφή κατοικιδίου", { stack: err.stack });
    throw err;
  }
}

export async function updatePetOwner(id, newOwnerId, { Pet, Customer }) {
  try {
    const pet = await Pet.findById(id);
    if (!pet) {
      logger.warn(`⚠️ Δεν βρέθηκε κατοικίδιο για αλλαγή ιδιοκτήτη (id: ${id})`);
      return null;
    }
    const owner = await Customer.findById(newOwnerId);
    if (!owner) {
      logger.warn(`⚠️ Δεν βρέθηκε νέος ιδιοκτήτης με id: ${newOwnerId}`);
      return null;
    }
    pet.owner = newOwnerId;
    await pet.save();
    const updated = await Pet.findById(id).populate("owner");
    logger.info(`👥 Ενημερώθηκε ιδιοκτήτης κατοικιδίου: ${pet.name}`);
    return updated;
  } catch (err) {
    logger.error("❌ Σφάλμα κατά την αλλαγή ιδιοκτήτη κατοικιδίου", { stack: err.stack });
    throw err;
  }
}

export async function addHistoryEntry(petId, entryData, { Pet }) {
  try {
    const pet = await Pet.findById(petId);
    if (!pet) {
      logger.warn(`⚠️ Δεν βρέθηκε κατοικίδιο για προσθήκη ιστορικού (id: ${petId})`);
      return null;
    }
    const newEntry = {
      date: entryData.date || new Date(),
      category: entryData.category || "Ιατρείο",
      reason: entryData.reason,
      result: entryData.result,
      weight: entryData.weight,
      temperature: entryData.temperature,
      heartRate: entryData.heartRate,
      diagnosis: entryData.diagnosis,
      treatment: entryData.treatment,
      nextVisit: entryData.nextVisit,
      vet: entryData.vet,
    };
    pet.history.push(newEntry);
    await pet.save();
    logger.info(`🩺 Προστέθηκε εγγραφή ιστορικού για κατοικίδιο: ${pet.name}`);
    return pet;
  } catch (err) {
    logger.error("❌ Σφάλμα κατά την προσθήκη εγγραφής ιστορικού", { stack: err.stack });
    throw err;
  }
}

export async function getPetHistory(petId, { Pet }) {
  try {
    const pet = await Pet.findById(petId).populate("owner");
    if (!pet) {
      logger.warn(`⚠️ Δεν βρέθηκε κατοικίδιο για λήψη ιστορικού (id: ${petId})`);
      return null;
    }
    logger.info(`📜 Επιστράφηκαν ${pet.history.length} εγγραφές ιστορικού για ${pet.name}`);
    return pet.history;
  } catch (err) {
    logger.error("❌ Σφάλμα κατά τη λήψη ιστορικού κατοικιδίου", { stack: err.stack });
    throw err;
  }
}

export async function deleteHistoryEntry(petId, entryId, { Pet }) {
  try {
    const pet = await Pet.findById(petId);
    if (!pet) {
      logger.warn(`⚠️ Δεν βρέθηκε κατοικίδιο για διαγραφή ιστορικού (id: ${petId})`);
      return null;
    }
    pet.history = pet.history.filter((entry) => entry._id.toString() !== entryId);
    await pet.save();
    logger.info(`🗑️ Διαγράφηκε εγγραφή ιστορικού για κατοικίδιο ${pet.name}`);
    return pet.history;
  } catch (err) {
    logger.error("❌ Σφάλμα κατά τη διαγραφή εγγραφής ιστορικού", { stack: err.stack });
    throw err;
  }
}

// ✅ Συνημμένα αρχεία

export async function addFile(petId, fileData, { Pet }) {
  try {
    const pet = await Pet.findById(petId);
    if (!pet) {
      logger.warn(`⚠️ Δεν βρέθηκε κατοικίδιο για προσθήκη αρχείου (id: ${petId})`);
      return null;
    }
    pet.files.push(fileData);
    await pet.save();
    logger.info(`📎 Προστέθηκε αρχείο για κατοικίδιο: ${pet.name}`);
    return pet;
  } catch (err) {
    logger.error("❌ Σφάλμα κατά την προσθήκη αρχείου", { stack: err.stack });
    throw err;
  }
}

export async function getFiles(petId, { Pet }) {
  try {
    const pet = await Pet.findById(petId);
    if (!pet) {
      logger.warn(`⚠️ Δεν βρέθηκε κατοικίδιο για λήψη αρχείων (id: ${petId})`);
      return null;
    }
    logger.info(`📎 Επιστράφηκαν ${pet.files.length} αρχεία για ${pet.name}`);
    return pet.files;
  } catch (err) {
    logger.error("❌ Σφάλμα κατά τη λήψη αρχείων κατοικιδίου", { stack: err.stack });
    throw err;
  }
}

export async function deleteFile(petId, fileId, { Pet }) {
  try {
    const pet = await Pet.findById(petId);
    if (!pet) {
      logger.warn(`⚠️ Δεν βρέθηκε κατοικίδιο για διαγραφή αρχείου (id: ${petId})`);
      return null;
    }
    const target = pet.files.id(fileId);
    const deletedFilename = target?.filename;
    pet.files = pet.files.filter((f) => f._id.toString() !== fileId);
    await pet.save();
    logger.info(`🗑️ Διαγράφηκε αρχείο για κατοικίδιο ${pet.name}`);
    return { files: pet.files, deletedFilename };
  } catch (err) {
    logger.error("❌ Σφάλμα κατά τη διαγραφή αρχείου", { stack: err.stack });
    throw err;
  }
}
