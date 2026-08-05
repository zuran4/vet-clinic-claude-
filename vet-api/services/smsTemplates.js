/**
 * Κοινό wrapper για όλα τα SMS templates.
 * Όλα τα templates επιστρέφουν plain-text strings (SMS δεν υποστηρίζει HTML).
 */

export function testSms({ clinicName = "Κτηνιατρείο" } = {}) {
  return `${clinicName}: Δοκιμαστικό SMS. Αν το λάβατε, η σύνδεση λειτουργεί κανονικά.`;
}

export function appointmentReminderSms({
  clinicName = "Κτηνιατρείο",
  animalName = "",
  date = "",
  time = "",
} = {}) {
  return `${clinicName}: Υπενθύμιση ραντεβού αύριο για ${animalName}, ${date} ${time}. Επικοινωνήστε μαζί μας για αλλαγή.`;
}

export function vaccinationReminderSms({
  clinicName = "Κτηνιατρείο",
  petName = "",
  dueDate = "",
} = {}) {
  return `${clinicName}: Ο/Η ${petName} χρειάζεται εμβόλιο έως ${dueDate}. Κλείστε ραντεβού μαζί μας.`;
}

export function birthdaySms({
  clinicName = "Κτηνιατρείο",
  petName = "",
} = {}) {
  return `${clinicName}: Χρόνια πολλά στον/στην ${petName}! 🎂🐾`;
}

export function purchaseReminderSms({
  clinicName = "Κτηνιατρείο",
  productNames = [],
} = {}) {
  const products = productNames.length > 0 ? productNames.join(", ") : "τα προϊόντα του κατοικιδίου σας";
  return `${clinicName}: Υπενθύμιση για ${products}. Επικοινωνήστε μαζί μας για ανανέωση.`;
}

export function welcomeSms({
  clinicName = "Κτηνιατρείο",
  clientName = "",
} = {}) {
  return `${clinicName}: Αγαπητέ/ή ${clientName}, σας καλωσορίζουμε στο κτηνιατρείο μας!`;
}
