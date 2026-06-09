// src/pages/SettingsPage.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Settings, Building2, Users, Clock, Monitor, Bell, Shield,
  Save, X, UserPlus, Globe, Mail, Send, Eye, EyeOff,
} from "lucide-react";
import LogoUpload from "../components/ui/LogoUpload";
import WorkingHoursSection from "../components/settings/WorkingHoursSection";
import DarkModeToggle from "../components/settings/DarkModeToggle";
import StockThresholdsPanel from "../components/settings/StockThresholdsPanel";
import { useSettingsPage } from "../hooks/useSettingsPage";
import request from "../api/apiClient";

/* ─── Sidebar navigation ──────────────────────────────────── */
const NAV_GROUPS = [
  {
    group: "ΚΛΙΝΙΚΗ",
    items: [
      { id: "clinic", label: "Στοιχεία",  icon: Building2 },
      { id: "staff",  label: "Προσωπικό", icon: Users     },
      { id: "hours",  label: "Ωράριο",    icon: Clock     },
    ],
  },
  {
    group: "ΣΥΣΤΗΜΑ",
    items: [
      { id: "ui",            label: "Εμφάνιση",     icon: Monitor },
      { id: "notifications", label: "Email",         icon: Mail    },
      { id: "admin",         label: "Admin",         icon: Shield  },
    ],
  },
];

/* ─── Staff helpers ───────────────────────────────────────── */
const ROLES = ["Κτηνίατρος", "Βοηθός Κτηνιάτρου", "Groomer"];
const ROLE_STYLE = {
  "Κτηνίατρος":         "bg-violet-100 text-violet-700",
  "Βοηθός Κτηνιάτρου": "bg-sky-100 text-sky-700",
  "Groomer":            "bg-teal-100 text-teal-700",
};

/* ─── Working hours default ───────────────────────────────── */
const defaultWorkingHours = () => ({
  monday:    { enabled: true,  intervals: [{ start: "09:00", end: "17:00" }] },
  tuesday:   { enabled: true,  intervals: [{ start: "09:00", end: "17:00" }] },
  wednesday: { enabled: true,  intervals: [{ start: "09:00", end: "17:00" }] },
  thursday:  { enabled: true,  intervals: [{ start: "09:00", end: "17:00" }] },
  friday:    { enabled: true,  intervals: [{ start: "09:00", end: "17:00" }] },
  saturday:  { enabled: true,  intervals: [{ start: "10:00", end: "14:00" }] },
  sunday:    { enabled: false, intervals: [{ start: "09:00", end: "17:00" }] },
});

const getSupportedTimeZones = () => {
  try { return Intl.supportedValuesOf("timeZone"); }
  catch { return ["Europe/Athens", "UTC", "Europe/London", "America/New_York"]; }
};

/* ─── Section wrapper ─────────────────────────────────────── */
const Section = ({ title, description, children, onSave, saving, saved, saveError }) => (
  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-100">
      <h2 className="text-base font-bold text-gray-800">{title}</h2>
      {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
    </div>
    <div className="px-6 py-5 space-y-5">{children}</div>
    {onSave && (
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <div>
          {saved && <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">✓ Αποθηκεύτηκε</span>}
          {saveError && <span className="text-xs text-red-500">{saveError}</span>}
        </div>
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold transition-colors disabled:opacity-60"
        >
          <Save className="w-3.5 h-3.5" />
          {saving ? "Αποθήκευση..." : "Αποθήκευση"}
        </button>
      </div>
    )}
  </div>
);

/* ─── Input helpers ───────────────────────────────────────── */
const LABEL = "block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5";
const INPUT = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white";

/* ─── Main component ──────────────────────────────────────── */
const SettingsPage = ({ onClose }) => {
  const { settings, setSettings, updateSettings, uploadLogo, loading, error } = useSettingsPage();
  const [activeSection, setActiveSection] = useState("clinic");

  /* Κεντρικό local state — μια πηγή αλήθειας για όλα τα sections */
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (settings && !form) {
      setForm({
        clinicName: "",
        logo: "",
        language: "el",
        timezone: "Europe/Athens",
        staff: [],
        clinicWorkingHours: defaultWorkingHours(),
        groomingWorkingHours: defaultWorkingHours(),
        registryWorkerHeadless: true,
        ...settings,
        emailConfig: {
          host:      "smtp.gmail.com",
          port:      587,
          user:      "",
          password:  "",
          fromName:  "",
          fromEmail: "",
          ...(settings.emailConfig || {}),
        },
      });
    }
  }, [settings]);

  /* Save state */
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [saveError, setSaveError] = useState(null);

  /* Staff form state */
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("Κτηνίατρος");

  /* Registry worker state */
  const [workerChanging, setWorkerChanging] = useState(false);
  const [workerError, setWorkerError]       = useState(null);

  /* Email test state */
  const [testEmailTo, setTestEmailTo]       = useState("");
  const [testEmailSending, setTestEmailSending] = useState(false);
  const [testEmailResult, setTestEmailResult]   = useState(null); // {ok, msg}
  const [showPassword, setShowPassword]         = useState(false);

  const timeZones = useMemo(getSupportedTimeZones, []);

  /* ── Helpers ── */
  const patch = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setSaved(false);
    setSaveError(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveError(null);
      const data = await updateSettings(form);
      if (data) {
        setSettings(data);

        // Sync localStorage so AppointmentSlots picks up grooming/clinic hours
        const defaultHours = () => ({
          monday:    { enabled: true,  intervals: [{ start: "09:00", end: "17:00" }] },
          tuesday:   { enabled: true,  intervals: [{ start: "09:00", end: "17:00" }] },
          wednesday: { enabled: true,  intervals: [{ start: "09:00", end: "17:00" }] },
          thursday:  { enabled: true,  intervals: [{ start: "09:00", end: "17:00" }] },
          friday:    { enabled: true,  intervals: [{ start: "09:00", end: "17:00" }] },
          saturday:  { enabled: true,  intervals: [{ start: "10:00", end: "14:00" }] },
          sunday:    { enabled: false, intervals: [{ start: "09:00", end: "17:00" }] },
        });
        localStorage.setItem("clinicWorkingHours",   JSON.stringify(data.clinicWorkingHours   || defaultHours()));
        localStorage.setItem("groomingWorkingHours", JSON.stringify(data.groomingWorkingHours || defaultHours()));

        window.dispatchEvent(new CustomEvent("settings:workingHoursChanged", {
          detail: {
            clinicWorkingHours:   data.clinicWorkingHours,
            groomingWorkingHours: data.groomingWorkingHours,
          },
        }));
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setSaveError(err?.message || "Αποτυχία αποθήκευσης");
    } finally {
      setSaving(false);
    }
  };

  /* Email config patch */
  const patchEmail = (field, value) => {
    setForm(prev => ({
      ...prev,
      emailConfig: { ...prev.emailConfig, [field]: value },
    }));
    setSaved(false);
    setSaveError(null);
  };

  /* Test email */
  const handleTestEmail = async () => {
    if (!testEmailTo) return;
    setTestEmailSending(true);
    setTestEmailResult(null);
    try {
      await request("/settings/test-email", { method: "POST", body: { to: testEmailTo } });
      setTestEmailResult({ ok: true, msg: "✅ Το δοκιμαστικό email στάλθηκε επιτυχώς!" });
    } catch (err) {
      setTestEmailResult({ ok: false, msg: `❌ ${err.message}` });
    } finally {
      setTestEmailSending(false);
    }
  };

  /* Working hours */
  const updateClinicDay = (dayKey, p) =>
    setForm(prev => ({
      ...prev,
      clinicWorkingHours: {
        ...prev.clinicWorkingHours,
        [dayKey]: { ...prev.clinicWorkingHours[dayKey], ...p },
      },
    }));

  const updateGroomingDay = (dayKey, p) =>
    setForm(prev => ({
      ...prev,
      groomingWorkingHours: {
        ...prev.groomingWorkingHours,
        [dayKey]: { ...prev.groomingWorkingHours[dayKey], ...p },
      },
    }));

  /* Staff */
  const addStaff = () => {
    const name = newName.trim();
    if (!name) return;
    patch("staff", [...(form.staff || []), { name, role: newRole }]);
    setNewName("");
    setNewRole("Κτηνίατρος");
  };
  const removeStaff = (i) => patch("staff", form.staff.filter((_, idx) => idx !== i));

  /* Registry worker */
  const handleToggleHeadless = async () => {
    if (workerChanging) return;
    const newValue = !form.registryWorkerHeadless;
    const updated = { ...form, registryWorkerHeadless: newValue };
    setWorkerError(null);
    setWorkerChanging(true);
    try {
      await updateSettings(updated);
      setForm(updated);
      setSettings(updated);
      const token = localStorage.getItem("token");
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
      const stop = await fetch("/api/registry/worker/stop", { method: "POST", headers: authHeaders });
      if (!stop.ok) throw new Error("Αποτυχία τερματισμού worker.");
      const start = await fetch("/api/registry/worker/start", { method: "POST", headers: authHeaders });
      if (!start.ok) throw new Error("Αποτυχία εκκίνησης worker.");
    } catch (err) {
      setWorkerError(err?.message || "Σφάλμα κατά την αλλαγή.");
    } finally {
      setWorkerChanging(false);
    }
  };

  /* ── Loading / error states ── */
  if (loading || !form) {
    return (
      <div className="py-16 text-center">
        <Settings className="w-8 h-8 text-gray-200 mx-auto mb-3 animate-spin" style={{ animationDuration: "2s" }} />
        <p className="text-sm text-gray-400">Φόρτωση ρυθμίσεων...</p>
      </div>
    );
  }
  if (error) {
    return <div className="py-12 text-center text-sm text-red-500">{error}</div>;
  }

  const saveProps = { onSave: handleSave, saving, saved, saveError };

  return (
    <div className="flex flex-col gap-6">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-sm">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-800">Ρυθμίσεις Συστήματος</h1>
            <p className="text-xs text-gray-400">Διαχείριση κλινικής, προσωπικού και συστήματος</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <X className="w-4 h-4" /> Κλείσιμο
          </button>
        )}
      </div>

      {/* ── Body ── */}
      <div className="flex gap-6 items-start">

        {/* Sidebar */}
        <div className="w-44 flex-shrink-0 bg-white rounded-2xl border border-gray-100 overflow-hidden py-3">
          {NAV_GROUPS.map(({ group, items }) => (
            <div key={group} className="mb-4 last:mb-0">
              <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-1 px-4">
                {group}
              </p>
              {items.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveSection(id)}
                  className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm font-medium transition-colors text-left ${
                    activeSection === id
                      ? "bg-indigo-50 text-indigo-700 border-r-2 border-indigo-500"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* ── ΣΤΟΙΧΕΙΑ ΚΛΙΝΙΚΗΣ ── */}
          <div className={activeSection !== "clinic" ? "hidden" : ""}>
            <Section
              title="Στοιχεία Κλινικής"
              description="Βασικές πληροφορίες εμφάνισης και τοπικών ρυθμίσεων."
              {...saveProps}
            >
              <div>
                <label className={LABEL}>Λογότυπο</label>
                <LogoUpload
                  value={form.logo}
                  onUploadFile={async (file) => {
                    const url = await uploadLogo(file);
                    patch("logo", url);
                  }}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Όνομα Κτηνιατρείου</label>
                  <input
                    type="text"
                    value={form.clinicName || ""}
                    onChange={(e) => patch("clinicName", e.target.value)}
                    placeholder="π.χ. Ιατρείο Μικρών Ζώων"
                    className={INPUT}
                  />
                </div>
                <div>
                  <label className={LABEL}>Γλώσσα</label>
                  <select
                    value={form.language || "el"}
                    onChange={(e) => patch("language", e.target.value)}
                    className={INPUT}
                  >
                    <option value="el">🇬🇷 Ελληνικά</option>
                    <option value="en">🇬🇧 English</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={LABEL}>Ζώνη Ώρας</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
                  <select
                    value={form.timezone || "Europe/Athens"}
                    onChange={(e) => patch("timezone", e.target.value)}
                    className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                  >
                    {timeZones.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                  </select>
                </div>
              </div>
            </Section>
          </div>

          {/* ── ΠΡΟΣΩΠΙΚΟ ── */}
          <div className={activeSection !== "staff" ? "hidden" : ""}>
            <Section
              title="Προσωπικό"
              description="Διαχείριση μελών ομάδας και ρόλων."
              {...saveProps}
            >
              <div className="rounded-2xl border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-50 to-violet-50 border-b border-gray-200 px-5 py-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-500" />
                  <span className="text-sm font-semibold text-indigo-700">Μέλη Ομάδας</span>
                  {(form.staff || []).length > 0 && (
                    <span className="ml-1 text-xs font-bold bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">
                      {form.staff.length}
                    </span>
                  )}
                </div>

                {/* List */}
                {(form.staff || []).length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {form.staff.map((member, i) => (
                      <div key={i} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors group">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                          <span className="text-sm font-bold text-white">
                            {member.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800">{member.name}</p>
                        </div>
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0 ${ROLE_STYLE[member.role] || "bg-gray-100 text-gray-600"}`}>
                          {member.role}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeStaff(i)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-all flex-shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-5 py-10 text-center">
                    <Users className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Δεν έχει καταχωρηθεί προσωπικό ακόμα.</p>
                  </div>
                )}

                {/* Add form */}
                <div className="border-t border-gray-100 bg-gray-50 px-5 py-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addStaff()}
                      placeholder="Όνομα μέλους..."
                      className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    >
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <button
                      type="button"
                      onClick={addStaff}
                      disabled={!newName.trim()}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                    >
                      <UserPlus className="w-4 h-4" />
                      Προσθήκη
                    </button>
                  </div>
                </div>
              </div>
            </Section>
          </div>

          {/* ── ΩΡΑΡΙΟ ── */}
          <div className={activeSection !== "hours" ? "hidden" : ""}>
            <Section
              title="Ωράριο Λειτουργίας"
              description="Ρύθμιση ωρών για ιατρείο και grooming."
              {...saveProps}
            >
              <WorkingHoursSection
                title="Ωράριο Ιατρείου"
                workingHours={form.clinicWorkingHours}
                updateDay={updateClinicDay}
              />
              <WorkingHoursSection
                title="Ωράριο Grooming"
                workingHours={form.groomingWorkingHours}
                updateDay={updateGroomingDay}
              />
            </Section>
          </div>

          {/* ── ΕΜΦΑΝΙΣΗ ── */}
          <div className={activeSection !== "ui" ? "hidden" : ""}>
            <Section title="Εμφάνιση" description="Θέμα εμφάνισης και όρια αποθέματος.">
              <div>
                <p className={LABEL}>Θέμα</p>
                <DarkModeToggle
                  settings={form}
                  setSettings={setForm}
                  updateSettings={updateSettings}
                />
              </div>
              <div className="border-t border-gray-100 pt-5">
                <p className={LABEL + " mb-3"}>Stock Thresholds</p>
                <StockThresholdsPanel />
              </div>
            </Section>
          </div>

          {/* ── EMAIL / SMTP ── */}
          <div className={activeSection !== "notifications" ? "hidden" : ""}>
            {/* SMTP Config */}
            <Section
              title="Ρυθμίσεις Email (SMTP)"
              description="Συμπλήρωσε τα στοιχεία SMTP για αυτόματες ειδοποιήσεις σε πελάτες."
              {...saveProps}
            >
              {/* Info banner */}
              <div className="flex gap-3 p-3 bg-sky-50 rounded-xl border border-sky-100">
                <Mail className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-sky-600 leading-relaxed">
                  Για Gmail χρησιμοποίησε <strong>smtp.gmail.com</strong>, port <strong>587</strong>.
                  Πρέπει να δημιουργήσεις <strong>App Password</strong> από το Google Account σου
                  (Google Account → Security → 2-Step Verification → App Passwords).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>SMTP Host</label>
                  <input
                    type="text"
                    value={form.emailConfig?.host || ""}
                    onChange={(e) => patchEmail("host", e.target.value)}
                    placeholder="smtp.gmail.com"
                    className={INPUT}
                  />
                </div>
                <div>
                  <label className={LABEL}>Port</label>
                  <input
                    type="number"
                    value={form.emailConfig?.port || 587}
                    onChange={(e) => patchEmail("port", parseInt(e.target.value) || 587)}
                    placeholder="587"
                    className={INPUT}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Email χρήστη (user)</label>
                  <input
                    type="email"
                    value={form.emailConfig?.user || ""}
                    onChange={(e) => patchEmail("user", e.target.value)}
                    placeholder="clinic@gmail.com"
                    className={INPUT}
                  />
                </div>
                <div>
                  <label className={LABEL}>Κωδικός / App Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={form.emailConfig?.password || ""}
                      onChange={(e) => patchEmail("password", e.target.value)}
                      placeholder="••••••••••••••••"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Όνομα αποστολέα</label>
                  <input
                    type="text"
                    value={form.emailConfig?.fromName || ""}
                    onChange={(e) => patchEmail("fromName", e.target.value)}
                    placeholder="Κτηνιατρείο Άγιος Στέφανος"
                    className={INPUT}
                  />
                </div>
                <div>
                  <label className={LABEL}>Email αποστολέα (from)</label>
                  <input
                    type="email"
                    value={form.emailConfig?.fromEmail || ""}
                    onChange={(e) => patchEmail("fromEmail", e.target.value)}
                    placeholder="clinic@gmail.com"
                    className={INPUT}
                  />
                </div>
              </div>
            </Section>

            {/* Test Email */}
            <div className="mt-4">
              <Section
                title="Δοκιμαστικό Email"
                description="Έλεγξε αν η σύνδεση SMTP λειτουργεί σωστά."
              >
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className={LABEL}>Αποστολή σε</label>
                    <input
                      type="email"
                      value={testEmailTo}
                      onChange={(e) => {
                        setTestEmailTo(e.target.value);
                        setTestEmailResult(null);
                      }}
                      placeholder="email@example.com"
                      className={INPUT}
                      onKeyDown={(e) => e.key === "Enter" && handleTestEmail()}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleTestEmail}
                    disabled={!testEmailTo || testEmailSending}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {testEmailSending ? "Αποστολή..." : "Αποστολή"}
                  </button>
                </div>

                {testEmailResult && (
                  <div className={`mt-2 px-4 py-2.5 rounded-xl text-sm font-medium ${
                    testEmailResult.ok
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                      : "bg-red-50 text-red-600 border border-red-100"
                  }`}>
                    {testEmailResult.msg}
                  </div>
                )}

                {/* Αυτόματες ειδοποιήσεις info */}
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Αυτόματες Ειδοποιήσεις</p>
                  <div className="space-y-2">
                    {[
                      { icon: "📅", label: "Υπενθύμιση ραντεβού",   desc: "Αποστολή 1 μέρα πριν — κάθε μέρα 08:00", active: true },
                      { icon: "💉", label: "Υπενθύμιση εμβολίου",   desc: "7 και 1 μέρα πριν — κάθε μέρα 09:00",   active: true },
                      { icon: "🎂", label: "Γενέθλια κατοικιδίου",  desc: "Την ημέρα των γενεθλίων",               active: false },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <span className="text-lg flex-shrink-0">{item.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-700">{item.label}</p>
                          <p className="text-xs text-gray-400">{item.desc}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                          item.active ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-400"
                        }`}>
                          {item.active ? "ΕΝΕΡΓΟ" : "ΣΧΕΔΙΑΣΜΟΣ"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </Section>
            </div>
          </div>

          {/* ── ADMIN ── */}
          <div className={activeSection !== "admin" ? "hidden" : ""}>
            <Section title="Admin" description="Ρυθμίσεις για τον Playwright registry worker (gov.gr).">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Headless Registry Worker</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Όταν ενεργό, ο Chromium τρέχει χωρίς ορατό παράθυρο.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleToggleHeadless}
                  disabled={workerChanging}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                    form.registryWorkerHeadless ? "bg-emerald-500" : "bg-gray-300"
                  } ${workerChanging ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    form.registryWorkerHeadless ? "translate-x-5" : "translate-x-1"
                  }`} />
                </button>
              </div>
              {workerChanging && (
                <p className="text-xs text-gray-400">Επανεκκίνηση worker με τη νέα ρύθμιση...</p>
              )}
              {workerError && (
                <p className="text-xs text-red-500">{workerError}</p>
              )}
            </Section>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
