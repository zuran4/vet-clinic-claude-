/**
 * Κοινό wrapper για όλα τα email templates.
 * Όλα τα templates επιστρέφουν HTML strings.
 */

const BASE_STYLE = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #f0f4f8;
  margin: 0; padding: 0;
`;

const CARD_STYLE = `
  max-width: 560px; margin: 40px auto; background: #ffffff;
  border-radius: 12px; overflow: hidden;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
`;

const HEADER_STYLE = (color = "#4f46e5") => `
  background: ${color}; padding: 28px 32px; text-align: center;
`;

const BODY_STYLE = `padding: 28px 32px;`;

const FOOTER_STYLE = `
  background: #f8fafc; padding: 16px 32px;
  text-align: center; font-size: 12px; color: #94a3b8;
  border-top: 1px solid #e2e8f0;
`;

// ────────────────────────────────────────────────────────────────────────────
// 🧪 Δοκιμαστικό email
// ────────────────────────────────────────────────────────────────────────────
export function testEmailHtml({ clinicName = "Κτηνιατρείο" } = {}) {
  return `
  <body style="${BASE_STYLE}">
    <div style="${CARD_STYLE}">
      <div style="${HEADER_STYLE("#4f46e5")}">
        <h1 style="margin:0; color:#ffffff; font-size:22px;">🐾 ${clinicName}</h1>
        <p style="margin:6px 0 0; color:#c7d2fe; font-size:14px;">Δοκιμαστικό email</p>
      </div>
      <div style="${BODY_STYLE}">
        <p style="font-size:16px; color:#1e293b;">Καλησπέρα!</p>
        <p style="color:#475569; line-height:1.6;">
          Αυτό είναι ένα <strong>δοκιμαστικό email</strong> από το σύστημα διαχείρισης
          του <strong>${clinicName}</strong>. Αν το λάβατε, σημαίνει ότι η σύνδεση
          SMTP λειτουργεί κανονικά. ✅
        </p>
      </div>
      <div style="${FOOTER_STYLE}">
        ${clinicName} • Αυτόματο μήνυμα — παρακαλώ μην απαντάτε
      </div>
    </div>
  </body>`;
}

// ────────────────────────────────────────────────────────────────────────────
// 📅 Υπενθύμιση ραντεβού
// ────────────────────────────────────────────────────────────────────────────
export function appointmentReminderHtml({
  clinicName = "Κτηνιατρείο",
  clientName = "",
  animalName = "",
  date = "",
  time = "",
  reason = "",
} = {}) {
  return `
  <body style="${BASE_STYLE}">
    <div style="${CARD_STYLE}">
      <div style="${HEADER_STYLE("#0ea5e9")}">
        <h1 style="margin:0; color:#ffffff; font-size:22px;">🐾 ${clinicName}</h1>
        <p style="margin:6px 0 0; color:#bae6fd; font-size:14px;">Υπενθύμιση Ραντεβού</p>
      </div>
      <div style="${BODY_STYLE}">
        <p style="font-size:16px; color:#1e293b;">
          Αγαπητέ/ή <strong>${clientName}</strong>,
        </p>
        <p style="color:#475569; line-height:1.6;">
          Σας υπενθυμίζουμε ότι αύριο έχετε ραντεβού στο <strong>${clinicName}</strong>.
        </p>
        <table style="width:100%; border-collapse:collapse; margin-top:16px;">
          <tr>
            <td style="padding:10px 12px; background:#f1f5f9; border-radius:6px 6px 0 0; font-size:13px; color:#64748b; width:40%;">🐶 Κατοικίδιο</td>
            <td style="padding:10px 12px; background:#f1f5f9; border-radius:6px 6px 0 0; font-size:14px; color:#1e293b; font-weight:600;">${animalName}</td>
          </tr>
          <tr>
            <td style="padding:10px 12px; background:#f8fafc; font-size:13px; color:#64748b;">📅 Ημερομηνία</td>
            <td style="padding:10px 12px; background:#f8fafc; font-size:14px; color:#1e293b; font-weight:600;">${date}</td>
          </tr>
          <tr>
            <td style="padding:10px 12px; background:#f1f5f9; font-size:13px; color:#64748b;">🕐 Ώρα</td>
            <td style="padding:10px 12px; background:#f1f5f9; font-size:14px; color:#1e293b; font-weight:600;">${time}</td>
          </tr>
          ${reason ? `
          <tr>
            <td style="padding:10px 12px; background:#f8fafc; border-radius:0 0 6px 6px; font-size:13px; color:#64748b;">📋 Αιτία</td>
            <td style="padding:10px 12px; background:#f8fafc; border-radius:0 0 6px 6px; font-size:14px; color:#1e293b;">${reason}</td>
          </tr>` : ""}
        </table>
        <p style="margin-top:20px; color:#64748b; font-size:13px;">
          Αν χρειαστεί να αναβάλετε ή να ακυρώσετε, επικοινωνήστε μαζί μας το συντομότερο.
        </p>
      </div>
      <div style="${FOOTER_STYLE}">
        ${clinicName} • Αυτόματο μήνυμα — παρακαλώ μην απαντάτε
      </div>
    </div>
  </body>`;
}

// ────────────────────────────────────────────────────────────────────────────
// 💉 Υπενθύμιση εμβολίου
// ────────────────────────────────────────────────────────────────────────────
export function vaccinationReminderHtml({
  clinicName = "Κτηνιατρείο",
  clientName = "",
  petName = "",
  vaccineType = "",
  dueDate = "",
} = {}) {
  return `
  <body style="${BASE_STYLE}">
    <div style="${CARD_STYLE}">
      <div style="${HEADER_STYLE("#16a34a")}">
        <h1 style="margin:0; color:#ffffff; font-size:22px;">🐾 ${clinicName}</h1>
        <p style="margin:6px 0 0; color:#bbf7d0; font-size:14px;">Υπενθύμιση Εμβολιασμού</p>
      </div>
      <div style="${BODY_STYLE}">
        <p style="font-size:16px; color:#1e293b;">
          Αγαπητέ/ή <strong>${clientName}</strong>,
        </p>
        <p style="color:#475569; line-height:1.6;">
          Θέλουμε να σας ενημερώσουμε ότι ο/η <strong>${petName}</strong>
          χρειάζεται εμβόλιο σύντομα.
        </p>
        <table style="width:100%; border-collapse:collapse; margin-top:16px;">
          <tr>
            <td style="padding:10px 12px; background:#f1f5f9; border-radius:6px 6px 0 0; font-size:13px; color:#64748b; width:40%;">🐾 Κατοικίδιο</td>
            <td style="padding:10px 12px; background:#f1f5f9; border-radius:6px 6px 0 0; font-size:14px; color:#1e293b; font-weight:600;">${petName}</td>
          </tr>
          ${vaccineType ? `
          <tr>
            <td style="padding:10px 12px; background:#f8fafc; font-size:13px; color:#64748b;">💉 Τύπος εμβολίου</td>
            <td style="padding:10px 12px; background:#f8fafc; font-size:14px; color:#1e293b;">${vaccineType}</td>
          </tr>` : ""}
          <tr>
            <td style="padding:10px 12px; background:#f1f5f9; border-radius:0 0 6px 6px; font-size:13px; color:#64748b;">📅 Ημ/νία εμβολίου</td>
            <td style="padding:10px 12px; background:#f1f5f9; border-radius:0 0 6px 6px; font-size:14px; color:#1e293b; font-weight:600;">${dueDate}</td>
          </tr>
        </table>
        <p style="margin-top:20px; color:#475569; font-size:14px; line-height:1.6;">
          Επικοινωνήστε μαζί μας για να κλείσετε ραντεβού. Είμαστε στη διάθεσή σας!
        </p>
      </div>
      <div style="${FOOTER_STYLE}">
        ${clinicName} • Αυτόματο μήνυμα — παρακαλώ μην απαντάτε
      </div>
    </div>
  </body>`;
}

// ────────────────────────────────────────────────────────────────────────────
// 🛒 Υπενθύμιση αγοράς / επαναπαραγγελίας
// ────────────────────────────────────────────────────────────────────────────
export function purchaseReminderHtml({
  clinicName    = "Κτηνιατρείο",
  clientName    = "",
  productNames  = [],
  note          = "",
  reminderDate  = "",
} = {}) {
  const productList = productNames.length > 0
    ? productNames.map(n => `<li style="padding:4px 0; color:#475569; font-size:14px;">• ${n}</li>`).join("")
    : `<li style="padding:4px 0; color:#475569; font-size:14px;">• Γενική υπενθύμιση</li>`;

  return `
  <body style="${BASE_STYLE}">
    <div style="${CARD_STYLE}">
      <div style="${HEADER_STYLE("#7c3aed")}">
        <h1 style="margin:0; color:#ffffff; font-size:22px;">🐾 ${clinicName}</h1>
        <p style="margin:6px 0 0; color:#ddd6fe; font-size:14px;">Υπενθύμιση Αγοράς</p>
      </div>
      <div style="${BODY_STYLE}">
        <p style="font-size:16px; color:#1e293b;">
          Αγαπητέ/ή <strong>${clientName}</strong>,
        </p>
        <p style="color:#475569; line-height:1.6;">
          Θέλαμε να σας υπενθυμίσουμε${reminderDate ? ` για τις <strong>${reminderDate}</strong>` : ""} για τα παρακάτω προϊόντα του κατοικιδίου σας:
        </p>
        <div style="background:#f5f3ff; border-radius:8px; padding:14px 18px; margin:16px 0;">
          <ul style="margin:0; padding:0; list-style:none;">
            ${productList}
          </ul>
        </div>
        ${note ? `
        <div style="background:#f8fafc; border-left:3px solid #7c3aed; padding:10px 14px; border-radius:0 6px 6px 0; margin-bottom:16px;">
          <p style="margin:0; color:#64748b; font-size:13px; font-style:italic;">"${note}"</p>
        </div>` : ""}
        <p style="color:#475569; font-size:14px; line-height:1.6;">
          Επικοινωνήστε μαζί μας ή επισκεφθείτε το κτηνιατρείο για να ανανεώσετε τα αποθέματά σας.
        </p>
      </div>
      <div style="${FOOTER_STYLE}">
        ${clinicName} • Αυτόματο μήνυμα — παρακαλώ μην απαντάτε
      </div>
    </div>
  </body>`;
}

// ────────────────────────────────────────────────────────────────────────────
// 👋 Καλωσόρισμα νέου πελάτη
// ────────────────────────────────────────────────────────────────────────────
export function welcomeEmailHtml({
  clinicName = "Κτηνιατρείο",
  clientName = "",
  petName = "",
  phone = "",
  address = "",
  logo = "",
} = {}) {
  const contactRows = [
    phone ? { icon: "📞", label: "Τηλέφωνο", value: phone } : null,
    address ? { icon: "📍", label: "Διεύθυνση", value: address } : null,
  ].filter(Boolean);

  const contactTable = contactRows.length
    ? `
        <table style="width:100%; border-collapse:collapse; margin-top:18px;">
          ${contactRows.map((row, i) => `
          <tr>
            <td style="padding:10px 12px; background:${i % 2 === 0 ? "#f1f5f9" : "#f8fafc"}; border-radius:${i === 0 ? "6px 6px" : "0 0"} ${i === contactRows.length - 1 ? "6px 6px" : "0 0"}; font-size:13px; color:#64748b; width:40%;">${row.icon} ${row.label}</td>
            <td style="padding:10px 12px; background:${i % 2 === 0 ? "#f1f5f9" : "#f8fafc"}; border-radius:${i === 0 ? "6px 6px" : "0 0"} ${i === contactRows.length - 1 ? "6px 6px" : "0 0"}; font-size:14px; color:#1e293b; font-weight:600;">${row.value}</td>
          </tr>`).join("")}
        </table>`
    : "";

  return `
  <body style="${BASE_STYLE}">
    <div style="${CARD_STYLE}">
      <div style="${HEADER_STYLE("#f97316")}">
        ${logo ? `<img src="${logo}" alt="${clinicName}" style="max-height:48px; margin-bottom:10px;" />` : ""}
        <h1 style="margin:0; color:#ffffff; font-size:22px;">${clinicName}</h1>
        <p style="margin:6px 0 0; color:#fed7aa; font-size:14px;">Καλωσήρθατε στην οικογένειά μας!</p>
      </div>
      <div style="${BODY_STYLE}">
        <p style="font-size:16px; color:#1e293b;">
          Αγαπητέ/ή <strong>${clientName}</strong>,
        </p>
        <p style="color:#475569; line-height:1.6;">
          Σας ευχαριστούμε που εμπιστευθήκατε το <strong>${clinicName}</strong>${petName ? ` για τον/την <strong>${petName}</strong>` : ""}!
          Είμαστε εδώ για να φροντίσουμε την υγεία και την ευεξία του κατοικιδίου σας
          σε κάθε βήμα.
        </p>
        <p style="color:#475569; line-height:1.6;">
          Από εδώ και πέρα θα λαμβάνετε από εμάς υπενθυμίσεις για ραντεβού,
          εμβολιασμούς και ό,τι άλλο χρειάζεται το κατοικίδιό σας — δεν χρειάζεται
          να θυμάστε τίποτα μόνοι σας!
        </p>
        ${contactTable}
        <p style="margin-top:20px; color:#64748b; font-size:13px;">
          Αν έχετε οποιαδήποτε απορία, μη διστάσετε να επικοινωνήσετε μαζί μας.
        </p>
      </div>
      <div style="${FOOTER_STYLE}">
        ${clinicName} • Αυτόματο μήνυμα — παρακαλώ μην απαντάτε
      </div>
    </div>
  </body>`;
}

// ────────────────────────────────────────────────────────────────────────────
// 🎂 Χρόνια Πολλά κατοικιδίου
// ────────────────────────────────────────────────────────────────────────────
export function birthdayHtml({
  clinicName = "Κτηνιατρείο",
  clientName = "",
  petName = "",
  age = null,
} = {}) {
  return `
  <body style="${BASE_STYLE}">
    <div style="${CARD_STYLE}">
      <div style="${HEADER_STYLE("#f59e0b")}">
        <h1 style="margin:0; color:#ffffff; font-size:26px;">🎂 Χρόνια Πολλά!</h1>
        <p style="margin:6px 0 0; color:#fef3c7; font-size:14px;">${clinicName}</p>
      </div>
      <div style="${BODY_STYLE}; text-align:center;">
        <p style="font-size:48px; margin:0;">🐾🎉</p>
        <p style="font-size:20px; color:#1e293b; font-weight:700; margin:12px 0 4px;">
          Σήμερα γιορτάζει ο/η ${petName}!
        </p>
        ${age ? `<p style="color:#f59e0b; font-size:16px; font-weight:600;">${age} χρονών! 🥳</p>` : ""}
        <p style="color:#475569; line-height:1.6; margin-top:16px;">
          Αγαπητέ/ή <strong>${clientName}</strong>, το ${clinicName} εύχεται
          στον/στην <strong>${petName}</strong> χρόνια πολλά με υγεία,
          χαρά και πολλές βόλτες! 🌟
        </p>
        <p style="color:#64748b; font-size:13px; margin-top:20px;">
          Μην ξεχάσετε να κλείσετε ραντεβού για το ετήσιο check-up!
        </p>
      </div>
      <div style="${FOOTER_STYLE}">
        ${clinicName} • Αυτόματο μήνυμα — παρακαλώ μην απαντάτε
      </div>
    </div>
  </body>`;
}
