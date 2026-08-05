import React, { useState, useEffect, useRef } from "react";
import { Lock, Building2, Eye, EyeOff, Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import request from "../../api/apiClient.js";

const ROLE_LABEL = {
  admin: "Διαχειριστής",
  vet: "Κτηνίατρος",
  secretary: "Γραμματεία",
  groomer: "Groomer",
  assistant: "Βοηθός",
};

function friendlyError(err, context) {
  const status = err?.status;
  const msg = (err?.message || "").toLowerCase();

  if (context === "setup") {
    if (status === 404 || /άγνωστ|κλινικ|κτηνιατρ/i.test(msg)) return "Άγνωστο ή ανενεργό κτηνιατρείο. Έλεγξε τον κωδικό.";
    if (status === 429 || /πολλ|too many/i.test(msg)) return "Πάρα πολλές προσπάθειες. Δοκίμασε ξανά σε λίγο.";
    return "Παρουσιάστηκε σφάλμα. Δοκίμασε ξανά.";
  }

  if (status === 401 || /έγκυρ|invalid|unauthorized/i.test(msg)) return "Λάθος PIN. Δοκίμασε ξανά.";
  if (status === 429 || /πολλ|attempt|too many/i.test(msg)) return "Πάρα πολλές αποτυχημένες προσπάθειες. Δοκίμασε ξανά σε 15 λεπτά.";
  if (status === 503 || /network|fetch|failed/i.test(msg)) return "Δεν υπάρχει σύνδεση με τον διακομιστή. Έλεγξε το δίκτυο.";
  return "Παρουσιάστηκε σφάλμα. Δοκίμασε ξανά αργότερα.";
}

const CardShell = ({ wide, children }) => (
  <div
    className="min-h-screen w-full flex items-center justify-center"
    style={{
      backgroundColor: "#eef2ff",
      backgroundImage: "url('https://i.imgur.com/ZJfOZGX.png')",
      backgroundRepeat: "no-repeat",
      backgroundSize: "contain",
      backgroundPosition: "center center",
    }}
  >
    <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]" />
    <div className={`relative z-10 drop-shadow-2xl ${wide ? "w-[420px]" : "w-[340px]"}`}>
      <div className="h-1 w-full rounded-t-2xl bg-gradient-to-r from-indigo-500 to-indigo-400" />
      <div className="bg-white/95 dark:bg-win-surface/95 backdrop-blur-sm rounded-b-2xl px-8 py-8 flex flex-col gap-6">
        {children}
      </div>
    </div>
  </div>
);

const Header = ({ title, subtitle }) => (
  <div className="flex flex-col items-center gap-3">
    <div className="bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-100 dark:border-indigo-700 p-3.5 rounded-2xl">
      <Lock className="w-6 h-6 text-indigo-600 dark:text-indigo-400" strokeWidth={2} />
    </div>
    <div className="text-center">
      <p className="text-[11px] font-semibold tracking-widest text-indigo-400 dark:text-indigo-300 uppercase">Vet Clinic</p>
      <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mt-0.5">{title}</h1>
      {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</p>}
    </div>
  </div>
);

const fieldClass = (hasError) => `
  w-full px-4 py-2.5 border rounded-xl
  bg-gray-50 dark:bg-win-elevated focus:bg-white dark:focus:bg-win-elevated2
  text-gray-900 dark:text-gray-100
  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
  disabled:opacity-50 disabled:cursor-not-allowed
  transition-all duration-150
  ${hasError ? "border-red-400 focus:ring-red-400" : "border-gray-200 dark:border-win-border-light"}
`;

function ErrorBox({ error }) {
  if (!error) return null;
  return (
    <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 rounded-xl px-3 py-2.5 text-sm">
      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <span>{error}</span>
    </div>
  );
}

// ── Βήμα 1: πρώτη ρύθμιση συσκευής — ποια κλινική "ανήκει" σε αυτό το kiosk ──
function DeviceSetup({ onProvisioned }) {
  const [clinicId, setClinicId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const trimmed = clinicId.trim().toLowerCase();
      const data = await request(`/auth/staff?clinicId=${encodeURIComponent(trimmed)}`);
      localStorage.setItem("clinicId", trimmed);
      onProvisioned(trimmed, data);
    } catch (err) {
      setError(friendlyError(err, "setup"));
      setTimeout(() => inputRef.current?.focus(), 50);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Header title="Ρύθμιση Συσκευής" subtitle="Γίνεται μία φορά ανά συσκευή/kiosk." />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="clinic-input" className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Κωδικός Κλινικής
        </label>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            ref={inputRef}
            id="clinic-input"
            type="text"
            placeholder="π.χ. agiosstefanos"
            value={clinicId}
            onChange={(e) => setClinicId(e.target.value)}
            required
            disabled={loading}
            autoFocus
            autoComplete="organization"
            className={`${fieldClass(!!error)} pl-9`}
          />
        </div>
      </div>
      <ErrorBox error={error} />
      <button
        type="submit"
        disabled={loading || clinicId.trim().length === 0}
        className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-150 flex items-center justify-center gap-2"
      >
        {loading ? (<><Loader2 className="w-4 h-4 animate-spin" /><span>Έλεγχος…</span></>) : "Συνέχεια"}
      </button>
    </form>
  );
}

// ── Βήμα 2: επιλογή "ποιος είσαι" ──
function StaffPicker({ clinicId, clinicName, users, onSelect, onChangeClinic }) {
  const initials = (name) => name?.trim().charAt(0).toUpperCase() || "?";
  return (
    <div className="flex flex-col gap-6">
      <Header title={clinicName || clinicId} subtitle="Διάλεξε ποιος είσαι" />
      {users.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">Δεν υπάρχουν ενεργοί χρήστες σε αυτό το κτηνιατρείο.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 max-h-[320px] overflow-y-auto pr-1">
          {users.map((u) => (
            <button
              key={u._id}
              type="button"
              onClick={() => onSelect(u)}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl border border-gray-200 dark:border-win-border-light hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-colors"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center shadow-sm flex-shrink-0">
                <span className="text-base font-bold text-white">{initials(u.name)}</span>
              </div>
              <div className="text-center min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate w-full">{u.name}</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">{ROLE_LABEL[u.role] || u.role}</p>
              </div>
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={onChangeClinic}
        className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors text-center"
      >
        Άλλαξε κτηνιατρείο σε αυτή τη συσκευή
      </button>
    </div>
  );
}

// ── Βήμα 3: εισαγωγή PIN για τον επιλεγμένο χρήστη ──
function PinEntry({ clinicId, user, onBack, onLogin }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const pinRef = useRef(null);

  useEffect(() => { pinRef.current?.focus(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const data = await request("/auth/login", {
        method: "POST",
        body: { clinicId, userId: user._id, pin },
      });
      onLogin({
        token: data.token,
        refreshToken: data.refreshToken,
        name: data.name,
        role: data.role,
        permissions: data.permissions,
        clinicId: data.clinicId,
        clinicName: data.clinicName,
      });
    } catch (err) {
      setError(friendlyError(err, "pin"));
      setPin("");
      setTimeout(() => pinRef.current?.focus(), 50);
    } finally {
      setLoading(false);
    }
  };

  const initials = user.name?.trim().charAt(0).toUpperCase() || "?";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center shadow-sm">
          <span className="text-xl font-bold text-white">{initials}</span>
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">{user.name}</h1>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{ROLE_LABEL[user.role] || user.role}</p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="pin-input" className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">PIN</label>
        <div className="relative">
          <input
            ref={pinRef}
            id="pin-input"
            type={showPin ? "text" : "password"}
            inputMode="numeric"
            maxLength={12}
            placeholder="••••"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            required
            disabled={loading}
            autoComplete="current-password"
            className={`${fieldClass(!!error)} text-center text-xl font-mono tracking-[0.5em] pr-10`}
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

      <ErrorBox error={error} />

      <button
        type="submit"
        disabled={loading || pin.length === 0}
        className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-150 flex items-center justify-center gap-2"
      >
        {loading ? (<><Loader2 className="w-4 h-4 animate-spin" /><span>Σύνδεση…</span></>) : "Σύνδεση"}
      </button>

      <button
        type="button"
        onClick={onBack}
        disabled={loading}
        className="flex items-center justify-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-40"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Πίσω
      </button>
    </form>
  );
}

const LoginForm = ({ onLogin }) => {
  const [step, setStep] = useState("loading"); // "loading" | "setup" | "picker" | "pin"
  const [clinicId, setClinicId] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadError, setLoadError] = useState("");

  const loadStaff = async (cid) => {
    try {
      const data = await request(`/auth/staff?clinicId=${encodeURIComponent(cid)}`);
      setClinicName(data.clinicName);
      setUsers(data.users || []);
      setStep("picker");
    } catch {
      // Η αποθηκευμένη κλινική δεν είναι πια έγκυρη — ζήτα ξανά ρύθμιση συσκευής
      localStorage.removeItem("clinicId");
      setLoadError("Το κτηνιατρείο αυτής της συσκευής δεν είναι πλέον διαθέσιμο.");
      setStep("setup");
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("clinicId");
    if (saved) {
      setClinicId(saved);
      loadStaff(saved);
    } else {
      setStep("setup");
    }
  }, []);

  const handleProvisioned = (cid, data) => {
    setClinicId(cid);
    setClinicName(data.clinicName);
    setUsers(data.users || []);
    setStep("picker");
  };

  const handleChangeClinic = () => {
    if (!window.confirm("Να αλλάξει το κτηνιατρείο αυτής της συσκευής;")) return;
    localStorage.removeItem("clinicId");
    setSelectedUser(null);
    setStep("setup");
  };

  if (step === "loading") {
    return (
      <CardShell>
        <div className="flex flex-col items-center gap-3 py-8">
          <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
          <p className="text-sm text-gray-400 dark:text-gray-500">Φόρτωση…</p>
        </div>
      </CardShell>
    );
  }

  if (step === "setup") {
    return (
      <CardShell>
        {loadError && <div className="mb-2"><ErrorBox error={loadError} /></div>}
        <DeviceSetup onProvisioned={handleProvisioned} />
      </CardShell>
    );
  }

  if (step === "pin") {
    return (
      <CardShell>
        <PinEntry clinicId={clinicId} user={selectedUser} onBack={() => setStep("picker")} onLogin={onLogin} />
      </CardShell>
    );
  }

  return (
    <CardShell wide>
      <StaffPicker
        clinicId={clinicId}
        clinicName={clinicName}
        users={users}
        onSelect={(u) => { setSelectedUser(u); setStep("pin"); }}
        onChangeClinic={handleChangeClinic}
      />
    </CardShell>
  );
};

export default LoginForm;
