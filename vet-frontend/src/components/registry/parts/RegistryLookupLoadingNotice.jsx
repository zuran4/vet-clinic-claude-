import React from "react";
import { Loader2 } from "lucide-react";

export default function RegistryLookupLoadingNotice({ isLoading }) {
  if (!isLoading) return null;

  return (
    <div className="mt-3 flex items-start gap-3 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
      <Loader2 className="mt-0.5 h-5 w-5 animate-spin text-indigo-600" />
      <div className="space-y-1 text-xs text-indigo-900">
        <div className="font-semibold">Γίνεται αναζήτηση στο εθνικό μητρώο…</div>
        <div>
          Η απάντηση από το site του μητρώου μπορεί να καθυστερήσει λίγα
          δευτερόλεπτα. Μπορείς να συνεχίσεις να δουλεύεις στην εφαρμογή μέχρι
          να εμφανιστεί η καρτέλα με τα στοιχεία του ζώου.
        </div>
      </div>
    </div>
  );
}
