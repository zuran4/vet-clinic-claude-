import React, { useState, useRef } from "react";
import { Lock, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import request from "../../api/apiClient.js";

// Μετάφραση τεχνικών errors σε φιλικά μηνύματα
function friendlyError(err) {
  const status = err?.status;
  const msg    = (err?.message || "").toLowerCase();

  if (status === 401 || /έγκυρ|invalid|unauthorized/i.test(msg))
    return "Λάθος PIN. Δοκίμασε ξανά.";

  if (status === 429 || /πολλ|attempt|too many/i.test(msg))
    return "Πάρα πολλές αποτυχημένες προσπάθειες. Δοκίμασε ξανά σε 15 λεπτά.";

  if (status === 503 || /network|fetch|failed/i.test(msg))
    return "Δεν υπάρχει σύνδεση με τον διακομιστή. Έλεγξε το δίκτυο.";

  return "Παρουσιάστηκε σφάλμα. Δοκίμασε ξανά αργότερα.";
}

const LoginForm = ({ onLogin }) => {
  const [pin, setPin]         = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const inputRef              = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    try {
      setLoading(true);
      setError("");

      const data = await request("/auth/login", {
        method: "POST",
        body: { pin },
      });

      onLogin({ token: data.token, name: data.name, role: data.role });
    } catch (err) {
      console.error("❌ Σφάλμα σύνδεσης:", err);
      setError(friendlyError(err));
      setPin("");
      setTimeout(() => inputRef.current?.focus(), 50);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center"
      style={{
        backgroundColor: "#eef2ff",                        /* indigo-50 για τα letterbox margins */
        backgroundImage: "url('https://i.imgur.com/ZJfOZGX.png')",
        backgroundRepeat: "no-repeat",
        backgroundSize: "contain",                         /* ολόκληρο logo ορατό */
        backgroundPosition: "center center",               /* κεντρικά */
      }}
    >
      {/* Ελαφρύ overlay — δεν σκεπάζει το logo, απλά αυξάνει contrast */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]" />

      {/* Card */}
      <div className="relative z-10 w-[340px] drop-shadow-2xl">

        {/* Accent bar */}
        <div className="h-1 w-full rounded-t-2xl bg-gradient-to-r from-indigo-500 to-indigo-400" />

        <form
          onSubmit={handleSubmit}
          noValidate
          className="bg-white/95 dark:bg-win-surface/95 backdrop-blur-sm rounded-b-2xl px-8 py-8 flex flex-col gap-6"
        >
          {/* Header */}
          <div className="flex flex-col items-center gap-3">
            <div className="bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-100 dark:border-indigo-700 p-3.5 rounded-2xl">
              <Lock className="w-6 h-6 text-indigo-600 dark:text-indigo-400" strokeWidth={2} />
            </div>
            <div className="text-center">
              <p className="text-[11px] font-semibold tracking-widest text-indigo-400 dark:text-indigo-300 uppercase">
                Vet Clinic
              </p>
              <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mt-0.5">
                Είσοδος
              </h1>
            </div>
          </div>

          {/* PIN field */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="pin-input"
              className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              PIN
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                id="pin-input"
                type={showPin ? "text" : "password"}
                inputMode="numeric"
                maxLength={12}
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                required
                disabled={loading}
                autoFocus
                autoComplete="current-password"
                className={`
                  w-full px-4 py-2.5 pr-10
                  border rounded-xl text-center text-xl font-mono tracking-[0.5em]
                  bg-gray-50 dark:bg-win-elevated focus:bg-white dark:focus:bg-win-elevated2
                  text-gray-900 dark:text-gray-100
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-150
                  ${error ? "border-red-400 focus:ring-red-400" : "border-gray-200 dark:border-win-border-light"}
                `}
              />
              <button
                type="button"
                onClick={() => setShowPin((v) => !v)}
                disabled={loading}
                tabIndex={-1}
                aria-label={showPin ? "Απόκρυψη PIN" : "Εμφάνιση PIN"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-40 transition-colors"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 rounded-xl px-3 py-2.5 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || pin.length === 0}
            className="
              w-full py-2.5 px-4 rounded-xl
              bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800
              text-white text-sm font-semibold
              shadow-sm hover:shadow-md
              focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
              transition-all duration-150
              flex items-center justify-center gap-2
            "
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Σύνδεση…</span>
              </>
            ) : (
              "Σύνδεση"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
