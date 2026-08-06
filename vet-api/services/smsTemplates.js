/**
 * Κοινό wrapper για όλα τα SMS templates.
 * Όλα τα templates επιστρέφουν plain-text strings (SMS δεν υποστηρίζει HTML).
 *
 * Κάθε template (εκτός testSms) δέχεται προαιρετικό `template` param — custom
 * κείμενο με {placeholders} που αποθηκεύεται στο Settings.smsTemplates. Αν
 * λείπει/είναι κενό, χρησιμοποιείται το προεπιλεγμένο κείμενο παρακάτω.
 */

export const SMS_TEMPLATE_DEFAULTS = {
  welcome:             "{clinicName}: Αγαπητέ/ή {clientName}, σας καλωσορίζουμε στο κτηνιατρείο μας!",
  appointmentReminder: "{clinicName}: Υπενθύμιση ραντεβού αύριο για {animalName}, {date} {time}. Επικοινωνήστε μαζί μας για αλλαγή.",
  vaccinationReminder: "{clinicName}: Ο/Η {petName} χρειάζεται εμβόλιο έως {dueDate}. Κλείστε ραντεβού μαζί μας.",
  purchaseReminder:    "{clinicName}: Υπενθύμιση για {products}. Επικοινωνήστε μαζί μας για ανανέωση.",
  birthday:            "{clinicName}: Χρόνια πολλά στον/στην {petName}! 🎂🐾",
};

// Ποια {placeholders} δέχεται κάθε template — χρήσιμο για το UI επεξεργασίας
export const SMS_TEMPLATE_PLACEHOLDERS = {
  welcome:             ["clinicName", "clientName"],
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
  return fillTemplate(template, data);
}

export function testSms({ clinicName = "Κτηνιατρείο" } = {}) {
  return `${clinicName}: Δοκιμαστικό SMS. Αν το λάβατε, η σύνδεση λειτουργεί κανονικά.`;
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
