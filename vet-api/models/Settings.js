import mongoose from "mongoose";

// 🔹 Ένα διάστημα ώρας (π.χ. 09:00–13:00)
const intervalSchema = new mongoose.Schema({
  start: { type: String, required: true }, // "HH:mm"
  end: { type: String, required: true },
});

// 🔹 Ωράριο ημέρας με πολλαπλά διαστήματα
const workingHoursSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: false },
  intervals: {
    type: [intervalSchema],
    default: [{ start: "09:00", end: "17:00" }],
  },
});

// 🔹 Default function για κάθε μέρα
const defaultDay = (enabled, start, end) => ({
  enabled,
  intervals: [{ start, end }],
});

// 🔹 Schema Ρυθμίσεων
const settingsSchema = new mongoose.Schema({
  clinicName: { type: String, default: "Άγιος Στέφανος" },
  logo: { type: String },
  language: { type: String, enum: ["el", "en"], default: "el" },
  timezone: { type: String, default: "Europe/Athens" },

  // 🔹 Dark mode
  darkMode: { type: Boolean, default: false },

  // 🔹 Email / SMTP config
  emailConfig: {
    host:      { type: String, default: "smtp.gmail.com" },
    port:      { type: Number, default: 587 },
    user:      { type: String, default: "" },
    password:  { type: String, default: "" },
    fromName:  { type: String, default: "" },
    fromEmail: { type: String, default: "" },
  },

  // 🔹 Προσωπικό κλινικής
  staff: {
    type: [
      {
        name: { type: String, required: true },
        role: { type: String, enum: ["Κτηνίατρος", "Βοηθός Κτηνιάτρου", "Groomer"], required: true },
      },
    ],
    default: [],
  },

  // 🔹 Στοιχεία επικοινωνίας κλινικής
  phone:   { type: String, default: "" },
  address: { type: String, default: "" },
  afm:     { type: String, default: "" },

  // 🔹 Ειδοποιήσεις email
  notifications: {
    appointmentReminder: { type: Boolean, default: true },
    vaccineReminder:     { type: Boolean, default: true },
    birthdayReminder:    { type: Boolean, default: false },
  },

  // 🔹 Registry worker (headless / visible)
  registryWorkerHeadless: { type: Boolean, default: true },

  // 🔹 Ωράριο Ιατρείου
  clinicWorkingHours: {
    monday: { type: workingHoursSchema, default: () => defaultDay(true, "09:00", "17:00") },
    tuesday: { type: workingHoursSchema, default: () => defaultDay(true, "09:00", "17:00") },
    wednesday: { type: workingHoursSchema, default: () => defaultDay(true, "09:00", "17:00") },
    thursday: { type: workingHoursSchema, default: () => defaultDay(true, "09:00", "17:00") },
    friday: { type: workingHoursSchema, default: () => defaultDay(true, "09:00", "17:00") },
    saturday: { type: workingHoursSchema, default: () => defaultDay(true, "10:00", "14:00") },
    sunday: { type: workingHoursSchema, default: () => defaultDay(false, "00:00", "00:00") },
  },

  // 🔹 Ωράριο Grooming
  groomingWorkingHours: {
    monday: { type: workingHoursSchema, default: () => defaultDay(true, "09:00", "17:00") },
    tuesday: { type: workingHoursSchema, default: () => defaultDay(true, "09:00", "17:00") },
    wednesday: { type: workingHoursSchema, default: () => defaultDay(true, "09:00", "17:00") },
    thursday: { type: workingHoursSchema, default: () => defaultDay(true, "09:00", "17:00") },
    friday: { type: workingHoursSchema, default: () => defaultDay(true, "09:00", "17:00") },
    saturday: { type: workingHoursSchema, default: () => defaultDay(true, "10:00", "14:00") },
    sunday: { type: workingHoursSchema, default: () => defaultDay(false, "00:00", "00:00") },
  },
});


export { settingsSchema };
const Settings = mongoose.model("Settings", settingsSchema);
export default Settings;
