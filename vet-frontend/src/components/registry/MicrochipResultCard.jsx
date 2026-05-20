// vet-frontend/src/components/registry/MicrochipResultCard.jsx

/**
 * Κάρτα εμφάνισης αποτελεσμάτων από το μητρώο.
 *
 * Περιμένει props:
 *  - microchip
 *  - markingDate
 *  - passportNumber
 *  - petName
 *  - sex
 *  - age
 *  - breed
 *  - species
 *  - isSmallPet   (boolean ή string)
 *  - color
 *  - managedBy
 *  - ownerFullName
 *  - ownerPhone
 *  - ownerEmail
 *  - ownerAddress
 *  - ownerCity
 *  - ownerAfm
 *  - error (προαιρετικό μήνυμα σφάλματος)
 */
export default function MicrochipResultCard({
  microchip,
  markingDate,
  passportNumber,
  petName,
  sex,
  age,
  breed,
  species,
  isSmallPet,
  color,
  managedBy,
  ownerFullName,
  ownerPhone,
  ownerEmail,
  ownerAddress,
  ownerCity,
  ownerAfm,
  error,
}) {
  const display = (value) => {
    if (value === null || value === undefined) return "—";
    const str = String(value).trim();
    return str.length ? str : "—";
  };

  const displayBooleanSmallPet = (value) => {
    if (value === true) return "Ναι";
    if (value === false) return "Όχι";
    if (typeof value === "string" && value.trim() !== "") return value;
    return "—";
  };

  const hasOwner =
    [ownerFullName, ownerPhone, ownerEmail, ownerAddress, ownerCity, ownerAfm].some(
      (v) => v !== null && v !== undefined && String(v).trim() !== ""
    );

  return (
    <section className="mt-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm">
      {/* Header κάρτας */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Αποτελέσματα αναζήτησης microchip
        </h2>

        {microchip ? (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Τελευταία αναζήτηση:{" "}
            <span className="font-mono text-gray-700 dark:text-gray-200">
              {microchip}
            </span>
          </span>
        ) : null}
      </div>

      {/* Προαιρετικό μήνυμα σφάλματος από το API */}
      {error ? (
        <p className="mb-3 text-xs text-red-600 dark:text-red-400">
          <span className="font-medium">Σφάλμα:</span> {error}
        </p>
      ) : null}

      {/* Πλέγμα πεδίων */}
      <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
        {/* Microchip */}
        <div className="rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3">
          <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Microchip
          </div>
          <div className="mt-1 font-semibold text-gray-900 dark:text-gray-100">
            {display(microchip)}
          </div>
        </div>

        {/* Ημερομηνία σήμανσης */}
        <div className="rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3">
          <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Ημερομηνία σήμανσης
          </div>
          <div className="mt-1 font-semibold text-gray-900 dark:text-gray-100">
            {display(markingDate)}
          </div>
        </div>

        {/* Αριθμός διαβατηρίου */}
        <div className="rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3">
          <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Αριθμός διαβατηρίου
          </div>
          <div className="mt-1 font-semibold text-gray-900 dark:text-gray-100">
            {display(passportNumber)}
          </div>
        </div>

        {/* Όνομα ζώου */}
        <div className="rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3">
          <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Όνομα ζώου
          </div>
          <div className="mt-1 font-semibold text-gray-900 dark:text-gray-100">
            {display(petName)}
          </div>
        </div>

        {/* Φύλο */}
        <div className="rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3">
          <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Φύλο
          </div>
          <div className="mt-1 font-semibold text-gray-900 dark:text-gray-100">
            {display(sex)}
          </div>
        </div>

        {/* Ηλικία */}
        <div className="rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3">
          <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Ηλικία
          </div>
          <div className="mt-1 font-semibold text-gray-900 dark:text-gray-100">
            {display(age)}
          </div>
        </div>

        {/* Φυλή */}
        <div className="rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3">
          <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Φυλή
          </div>
          <div className="mt-1 font-semibold text-gray-900 dark:text-gray-100">
            {display(breed)}
          </div>
        </div>

        {/* Είδος ζώου */}
        <div className="rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3">
          <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Είδος ζώου
          </div>
          <div className="mt-1 font-semibold text-gray-900 dark:text-gray-100">
            {display(species)}
          </div>
        </div>

        {/* Μικρό ζώο (<10kg) */}
        <div className="rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3">
          <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Μικρό ζώο (&lt;10kg)
          </div>
          <div className="mt-1 font-semibold text-gray-900 dark:text-gray-100">
            {displayBooleanSmallPet(isSmallPet)}
          </div>
        </div>

        {/* Χρώμα */}
        <div className="rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3">
          <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Χρώμα
          </div>
          <div className="mt-1 font-semibold text-gray-900 dark:text-gray-100">
            {display(color)}
          </div>
        </div>

        {/* Διαχείριση από */}
        <div className="md:col-span-2 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3">
          <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Διαχείριση από
          </div>
          <div className="mt-1 font-semibold text-gray-900 dark:text-gray-100">
            {display(managedBy)}
          </div>
        </div>

        {/* Στοιχεία ιδιοκτήτη (μόνο αν υπάρχει κάτι να δείξουμε) */}
        {hasOwner ? (
          <div className="md:col-span-2 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3">
            <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Ιδιοκτήτης
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 text-sm">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Ονοματεπώνυμο
                </div>
                <div className="mt-0.5 font-semibold text-gray-900 dark:text-gray-100">
                  {display(ownerFullName)}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Τηλέφωνο
                </div>
                <div className="mt-0.5 font-semibold text-gray-900 dark:text-gray-100">
                  {display(ownerPhone)}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Email
                </div>
                <div className="mt-0.5 font-semibold text-gray-900 dark:text-gray-100">
                  {display(ownerEmail)}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  ΑΦΜ
                </div>
                <div className="mt-0.5 font-semibold text-gray-900 dark:text-gray-100">
                  {display(ownerAfm)}
                </div>
              </div>

              <div className="md:col-span-2">
                <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Διεύθυνση
                </div>
                <div className="mt-0.5 font-semibold text-gray-900 dark:text-gray-100">
                  {display(ownerAddress)}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Πόλη / Περιφερειακή ενότητα
                </div>
                <div className="mt-0.5 font-semibold text-gray-900 dark:text-gray-100">
                  {display(ownerCity)}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
