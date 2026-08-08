/**
 * Κοινό wrapper για όλα τα SMS templates.
 * Όλα τα templates επιστρέφουν plain-text strings (SMS δεν υποστηρίζει HTML).
 *
 * Κάθε template (εκτός testSms) δέχεται προαιρετικό `template` param — custom
 * κείμενο με {placeholders} που αποθηκεύεται στο Settings.smsTemplates. Αν
 * λείπει/είναι κενό, χρησιμοποιείται το προεπιλεγμένο κείμενο παρακάτω.
 *
 * Το τελικό κείμενο περνάει πάντα από toUpperNoAccents() πριν σταλεί —
 * ελληνικά ΚΕΦΑΛΑΙΑ χωρίς τόνο encodάρονται σε GSM-7 (160 χαρακτήρες/SMS)
 * αντί για UCS-2 (70 χαρακτήρες/SMS), άρα λιγότερα/φθηνότερα segments. Η
 * πηγή (defaults + custom templates στις Ρυθμίσεις) γράφεται κανονικά σε
 * πεζά/τονισμένα ελληνικά για ευκολία ανάγνωσης/επεξεργασίας — η μετατροπή
 * γίνεται μόνο στο τελικό στάδιο.
 */
import { toUpperNoAccents } from "../utils/greekNormalize.js";

export const SMS_TEMPLATE_DEFAULTS = {
  welcome:             "{clinicName}: Σας καλωσορίζουμε στο κτηνιατρείο μας!",
  appointmentReminder: "{clinicName}: Υπενθύμιση ραντεβού αύριο για {animalName}, {date} {time}. Επικοινωνήστε μαζί μας για αλλαγή.",
  vaccinationReminder: "{clinicName}: Ο/Η {petName} χρειάζεται εμβόλιο έως {dueDate}. Κλείστε ραντεβού μαζί μας.",
  purchaseReminder:    "{clinicName}: Υπενθύμιση για {products}. Επικοινωνήστε μαζί μας για ανανέωση.",
  birthday:            "{clinicName}: Χρόνια πολλά στον/στην {petName}!",
};

// Ποια {placeholders} δέχεται κάθε template — χρήσιμο για το UI επεξεργασίας
export const SMS_TEMPLATE_PLACEHOLDERS = {
  welcome:             ["clinicName"],
  appointmentReminder: ["clinicName", "animalName", "date", "time"],
  vaccinationReminder: ["clinicName", "petName", "dueDate"],
  purchaseReminder:    ["clinicName", "products"],
  birthday:            ["clinicName", "petName"],
};

function fillTemplate(template, data) {
  return template.replace(/\{(\w+)\}/g, (_, key) => (data[key] ?? ""));
}

function renderSmsTemplate(key, data, customTemplate) {
  const template = customTemplate?.trim() || SMS_TEMPLATE_DEFAULTS[key];
  return toUpperNoAccents(fillTemplate(template, data));
}

export function testSms({ clinicName = "Κτηνιατρείο" } = {}) {
  return toUpperNoAccents(`${clinicName}: Δοκιμαστικό SMS. Αν το λάβατε, η σύνδεση λειτουργεί κανονικά.`);
}

// Οδηγίες θεραπείας — εφάπαξ, δυναμικό περιεχόμενο ανά επίσκεψη (όχι
// customizable template, βλ. σχόλιο στο emailTemplates.js). Χωρίς όνομα
// κλινικής (ο παραλήπτης ξέρει ποιος του γράφει) — περιλαμβάνει τα φάρμακα
// ΚΑΙ το πλήρες κείμενο οδηγιών, ώστε να μη χρειάζεται να ανοίξει το email.
export function treatmentInstructionsSms({
  petName = "",
  medications = [],
  instructions = "",
} = {}) {
  const medsText = medications
    .map((m) => [m.drug, m.dose, m.frequency, m.duration].filter(Boolean).join(" "))
    .filter(Boolean)
    .join("; ");
  const medsPart = medsText ? ` Φάρμακα: ${medsText}.` : "";
  const instructionsPart = instructions ? ` ${instructions}` : "";
  return toUpperNoAccents(`Οδηγίες για ${petName}.${medsPart}${instructionsPart}`);
}

export function appointmentReminderSms({
  clinicName = "Κτηνιατρείο",
  animalName = "",
  date = "",
  time = "",
  template,
} = {}) {
  return renderSmsTemplate("appointmentReminder", { clinicName, animalName, date, time }, template);
}

export function vaccinationReminderSms({
  clinicName = "Κτηνιατρείο",
  petName = "",
  dueDate = "",
  template,
} = {}) {
  return renderSmsTemplate("vaccinationReminder", { clinicName, petName, dueDate }, template);
}

export function birthdaySms({
  clinicName = "Κτηνιατρείο",
  petName = "",
  template,
} = {}) {
  return renderSmsTemplate("birthday", { clinicName, petName }, template);
}

export function purchaseReminderSms({
  clinicName = "Κτηνιατρείο",
  productNames = [],
  template,
} = {}) {
  const products = productNames.length > 0 ? productNames.join(", ") : "τα προϊόντα του κατοικιδίου σας";
  return renderSmsTemplate("purchaseReminder", { clinicName, products }, template);
}

export function welcomeSms({
  clinicName = "Κτηνιατρείο",
  clientName = "",
  template,
} = {}) {
  return renderSmsTemplate("welcome", { clinicName, clientName }, template);
}
