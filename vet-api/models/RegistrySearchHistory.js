import mongoose from "mongoose";

const MAX_ENTRIES = 20;

const entrySchema = new mongoose.Schema(
  {
    microchip: { type: String, required: true },
    petName: { type: String, default: "" },
    species: { type: String, default: "" },
    lastSearchedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// 🔹 Singleton: μία λίστα ιστορικού, κοινή για όλη την κλινική (όλες οι συσκευές)
const registrySearchHistorySchema = new mongoose.Schema({
  entries: { type: [entrySchema], default: [] },
});

registrySearchHistorySchema.statics.getEntries = async function () {
  const doc = await this.findOne();
  return doc?.entries || [];
};

registrySearchHistorySchema.statics.addEntry = async function ({ microchip, petName, species }) {
  let doc = await this.findOne();
  if (!doc) doc = new this({ entries: [] });

  const filtered = doc.entries.filter((e) => e.microchip !== microchip);
  filtered.unshift({
    microchip,
    petName: petName || "",
    species: species || "",
    lastSearchedAt: new Date(),
  });

  doc.entries = filtered.slice(0, MAX_ENTRIES);
  await doc.save();
  return doc.entries;
};

export { registrySearchHistorySchema };
const RegistrySearchHistory = mongoose.model("RegistrySearchHistory", registrySearchHistorySchema);
export default RegistrySearchHistory;
