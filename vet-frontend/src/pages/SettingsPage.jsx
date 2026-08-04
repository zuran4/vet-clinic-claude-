// src/pages/SettingsPage.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Settings, Building2, Users, Clock, Monitor, Shield,
  Save, X, UserPlus, Globe, Mail, Send, Eye, EyeOff, Keyboard,
  ChevronRight, ArrowLeft, Download, FileText, Phone, MapPin,
  Hash, Lock, Activity, UserCog, Tablet, Landmark, CheckCircle2,
  AlertCircle, Loader2, User,
} from "lucide-react";
import LogoUpload from "../components/ui/LogoUpload";
import WorkingHoursSection from "../components/settings/WorkingHoursSection";
import DarkModeToggle from "../components/settings/DarkModeToggle";
import StockThresholdsPanel from "../components/settings/StockThresholdsPanel";
import KeyboardShortcutsSection from "../components/settings/KeyboardShortcutsSection";
import TouchscreenSettings from "../components/settings/TouchscreenSettings";
import UsersSettings from "../components/settings/UsersSettings";
import { useSettingsPage } from "../hooks/useSettingsPage";
import request from "../api/apiClient";

const NAV_GROUPS = [
  {
    group: "ΚΛΙΝΙΚΗ",
    items: [
      { id: "clinic", label: "Στοιχεία",  icon: Building2, desc: "Όνομα, λογότυπο, επικοινωνία",          iconBg: "bg-indigo-100 dark:bg-indigo-900/40",    iconColor: "text-indigo-500 dark:text-indigo-400" },
      { id: "staff",  label: "Προσωπικό", icon: Users,     desc: "Μέλη ομάδας και ρόλοι",                iconBg: "bg-violet-100 dark:bg-violet-900/40",    iconColor: "text-violet-500 dark:text-violet-400" },
      { id: "hours",  label: "Ωράριο",    icon: Clock,     desc: "Ωράριο ιατρείου και grooming",         iconBg: "bg-sky-100 dark:bg-sky-900/40",          iconColor: "text-sky-500 dark:text-sky-400" },
      { id: "gov",    label: "GOV",       icon: Landmark,  desc: "Σύνδεση με το εθνικό μητρώο (gov.gr)", iconBg: "bg-blue-100 dark:bg-blue-900/40",        iconColor: "text-blue-500 dark:text-blue-400" },
    ],
  },
  {
    group: "ΣΥΣΤΗΜΑ",
    items: [
      { id: "ui",            label: "Εμφάνιση",     icon: Monitor,   desc: "Θέμα και stock thresholds",           iconBg: "bg-orange-100 dark:bg-orange-900/40",   iconColor: "text-orange-500 dark:text-orange-400" },
      { id: "notifications", label: "Ειδοποιήσεις",  icon: Mail,      desc: "SMTP, SMS και αυτόματες ειδοποιήσεις", iconBg: "bg-teal-100 dark:bg-teal-900/40",       iconColor: "text-teal-500 dark:text-teal-400" },
      { id: "shortcuts",     label: "Συντομεύσεις", icon: Keyboard,  desc: "Πλήκτρα γρήγορης πρόσβασης",        iconBg: "bg-emerald-100 dark:bg-emerald-900/40", iconColor: "text-emerald-500 dark:text-emerald-400" },
      { id: "touchscreen",   label: "Οθόνη Αφής",   icon: Tablet,    desc: "On-screen πληκτρολόγιο για kiosk",   iconBg: "bg-fuchsia-100 dark:bg-fuchsia-900/40", iconColor: "text-fuchsia-500 dark:text-fuchsia-400" },
    ],
  },
  {
    group: "ΔΙΑΧΕΙΡΙΣΗ",
    items: [
      { id: "account", label: "Λογαριασμός", icon: Lock,     desc: "Αλλαγή PIN σύνδεσης",              iconBg: "bg-amber-100 dark:bg-amber-900/40",      iconColor: "text-amber-500 dark:text-amber-400" },
      { id: "users",   label: "Χρήστες",     icon: UserCog,  desc: "Λογαριασμοί σύνδεσης και ρόλοι",  iconBg: "bg-violet-100 dark:bg-violet-900/40",    iconColor: "text-violet-500 dark:text-violet-400", adminOnly: true },
      { id: "export",  label: "Εξαγωγή",     icon: Download, desc: "Λήψη δεδομένων σε CSV",            iconBg: "bg-cyan-100 dark:bg-cyan-900/40",        iconColor: "text-cyan-500 dark:text-cyan-400" },
      { id: "audit",   label: "Audit Log",   icon: Activity, desc: "Ιστορικό ενεργειών συστήματος",    iconBg: "bg-rose-100 dark:bg-rose-900/40",        iconColor: "text-rose-500 dark:text-rose-400" },
      { id: "admin",   label: "Admin",        icon: Shield,   desc: "Ρυθμίσεις registry worker",        iconBg: "bg-slate-100 dark:bg-slate-800/60",      iconColor: "text-slate-500 dark:text-slate-400" },
    ],
  },
];

const SLOT_DURATION_OPTIONS = [10, 15, 20, 30, 45, 60, 90, 120];

const ROLES = ["Κτηνίατρος", "Βοηθός Κτηνιάτρου", "Groomer"];
const ROLE_STYLE = {
  "Κτηνίατρος":         "bg-violet-100 text-violet-700",
  "Βοηθός Κτηνιάτρου": "bg-sky-100 text-sky-700",
  "Groomer":            "bg-teal-100 text-teal-700",
};

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

const Section = ({ title, description, children, onSave, saving, saved, saveError }) => (
  <div className="bg-white dark:bg-win-surface rounded-2xl border border-gray-100 dark:border-win-border overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-100 dark:border-win-border">
      <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">{title}</h2>
      {description && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{description}</p>}
    </div>
    <div className="px-6 py-5 space-y-5">{children}</div>
    {onSave && (
      <div className="px-6 py-3 bg-gray-50 dark:bg-win-elevated/50 border-t border-gray-100 dark:border-win-border flex items-center justify-between">
        <div>
          {saved && <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">✓ Αποθηκεύτηκε</span>}
          {saveError && <span className="text-xs text-red-500 dark:text-red-400">{saveError}</span>}
        </div>
        <button onClick={onSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold transition-colors disabled:opacity-60">
          <Save className="w-3.5 h-3.5" />
          {saving ? "Αποθήκευση..." : "Αποθήκευση"}
        </button>
      </div>
    )}
  </div>
);

const LABEL = "block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5";
const INPUT = "w-full border border-gray-200 dark:border-win-border-light rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white dark:bg-win-elevated text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500";
const ICON_INPUT = "w-full border border-gray-200 dark:border-win-border-light rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white dark:bg-win-elevated text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500";

function NotifToggle({ label, desc, icon, value, onChange }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-win-elevated/50 border border-gray-100 dark:border-win-border/50">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-lg flex-shrink-0">{icon}</span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{label}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{desc}</p>
        </div>
      </div>
      <button type="button" onClick={() => onChange(!value)}
        className={`flex-shrink-0 ml-3 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? "bg-emerald-500" : "bg-gray-300 dark:bg-win-elevated2"}`}
      >
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${value ? "translate-x-5" : "translate-x-1"}`} />
      </button>
    </div>
  );
}

const AUDIT_RESOURCE_COLORS = {
  customers:    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  pets:         "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  appointments: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  products:     "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  settings:     "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  auth:         "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
};
const AUDIT_ACTION_COLORS = {
  CREATE:        "text-emerald-600 dark:text-emerald-400",
  UPDATE:        "text-indigo-600 dark:text-indigo-400",
  DELETE:        "text-red-500 dark:text-red-400",
  LOGIN_SUCCESS: "text-sky-600 dark:text-sky-400",
  LOGIN_FAILURE: "text-rose-600 dark:text-rose-400",
};

function AuditLogViewer() {
  const [logs, setLogs]         = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(false);
  const [filterResource, setFilterResource] = useState("");

  const fetchLogs = useCallback(async (p = 1, resource = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, pageSize: 15 });
      if (resource) params.set("resource", resource);
      const data = await request(`/audit?${params}`);
      setLogs(data.data || []);
      setTotal(data.total || 0);
      setPage(p);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLogs(1, filterResource); }, [filterResource]);

  const totalPages = Math.ceil(total / 15);

  const fmt = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return `${d.toLocaleDateString("el-GR")} ${d.toLocaleTimeString("el-GR", { hour: "2-digit", minute: "2-digit" })}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <select value={filterResource} onChange={(e) => setFilterResource(e.target.value)} className={INPUT + " max-w-[180px]"}>
          <option value="">Όλα τα resources</option>
          {["customers","pets","appointments","products","settings","auth","prescriptions","suppliers"].map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <button onClick={() => fetchLogs(page, filterResource)} className="px-3 py-2 rounded-xl border border-gray-200 dark:border-win-border text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-win-elevated transition-colors">
          Ανανέωση
        </button>
        <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">{total} εγγραφές σύνολο</span>
      </div>

      <div className="rounded-2xl border border-gray-100 dark:border-win-border overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-sm text-gray-400">Φόρτωση...</div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">Δεν βρέθηκαν εγγραφές.</div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-win-border/50">
            {logs.map((log) => (
              <div key={log._id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-win-elevated/30 transition-colors">
                <div className="flex-shrink-0 w-28 text-[11px] text-gray-400 dark:text-gray-500 font-mono">{fmt(log.createdAt)}</div>
                <span className={`flex-shrink-0 text-xs font-bold ${AUDIT_ACTION_COLORS[log.action] || "text-gray-500"}`}>{log.action}</span>
                {log.resource && (
                  <span className={`flex-shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full ${AUDIT_RESOURCE_COLORS[log.resource] || "bg-gray-100 text-gray-600"}`}>{log.resource}</span>
                )}
                <span className="flex-1 min-w-0 text-xs text-gray-500 dark:text-gray-400 truncate">{log.userName ? `${log.userName} (${log.userRole})` : log.ip || "—"}</span>
                {log.statusCode && (
                  <span className={`flex-shrink-0 text-xs font-mono ${log.statusCode >= 400 ? "text-red-400" : "text-emerald-500"}`}>{log.statusCode}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button onClick={() => fetchLogs(page - 1, filterResource)} disabled={page <= 1} className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-win-border text-sm text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-win-elevated transition-colors">← Προηγ.</button>
          <span className="text-xs text-gray-400 dark:text-gray-500">Σελίδα {page} / {totalPages}</span>
          <button onClick={() => fetchLogs(page + 1, filterResource)} disabled={page >= totalPages} className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-win-border text-sm text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-win-elevated transition-colors">Επόμ. →</button>
        </div>
      )}
    </div>
  );
}

const SettingsPage = ({ onClose, user }) => {
  const { settings, setSettings, updateSettings, uploadLogo, loading, error } = useSettingsPage();
  const navGroups = useMemo(() => NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((item) => !item.adminOnly || user?.role === "admin"),
  })), [user?.role]);
  const [activeSection, setActiveSection] = useState("clinic");
  const [mobileView, setMobileView]       = useState("menu");
  const [form, setForm]                   = useState(null);

  useEffect(() => {
    if (settings && !form) {
      setForm({
        clinicName: "",
        logo:       "",
        language:   "el",
        timezone:   "Europe/Athens",
        phone:      "",
        address:    "",
        afm:        "",
        staff:      [],
        clinicWorkingHours:   defaultWorkingHours(),
        groomingWorkingHours: defaultWorkingHours(),
        clinicSlotDuration:   30,
        groomingSlotDuration: 60,
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
        smsConfig: {
          accountSid: "",
          authToken:  "",
          fromNumber: "",
          ...(settings.smsConfig || {}),
        },
        notifications: {
          appointmentReminder: true,
          vaccineReminder:     true,
          birthdayReminder:    false,
          purchaseReminder:    true,
          smsEnabled:          false,
          ...(settings.notifications || {}),
        },
        registryGov: {
          username: "",
          password: "",
          ...(settings.registryGov || {}),
        },
      });
    }
  }, [settings]);

  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [saveError, setSaveError]   = useState(null);
  const [newName, setNewName]       = useState("");
  const [newRole, setNewRole]       = useState("Κτηνίατρος");
  const [workerChanging, setWorkerChanging] = useState(false);
  const [workerError, setWorkerError]       = useState(null);
  const [testEmailTo, setTestEmailTo]           = useState("");
  const [testEmailSending, setTestEmailSending] = useState(false);
  const [testEmailResult, setTestEmailResult]   = useState(null);
  const [previewType, setPreviewType]           = useState("welcome");
  const [previewHtml, setPreviewHtml]           = useState("");
  const [previewLoading, setPreviewLoading]     = useState(false);
  const [previewError, setPreviewError]         = useState(null);
  const [showPreview, setShowPreview]           = useState(false);
  const [testSmsTo, setTestSmsTo]               = useState("");
  const [testSmsSending, setTestSmsSending]     = useState(false);
  const [testSmsResult, setTestSmsResult]       = useState(null);
  const [showPassword, setShowPassword]         = useState(false);
  const [showSmsToken, setShowSmsToken]         = useState(false);
  const [showGovPassword, setShowGovPassword]   = useState(false);
  const [govStatus, setGovStatus]               = useState(null); // { status, port } | null
  const [govStatusLoading, setGovStatusLoading] = useState(false);
  const [govConnecting, setGovConnecting]       = useState(false);
  const [govError, setGovError]                 = useState(null);
  const [pinOld, setPinOld]           = useState("");
  const [pinNew, setPinNew]           = useState("");
  const [pinConfirm, setPinConfirm]   = useState("");
  const [pinSaving, setPinSaving]     = useState(false);
  const [pinResult, setPinResult]     = useState(null);
  const [showOldPin, setShowOldPin]   = useState(false);
  const [showNewPin, setShowNewPin]   = useState(false);

  const timeZones = useMemo(getSupportedTimeZones, []);

  const patch      = (f, v) => { setForm(p => ({ ...p, [f]: v })); setSaved(false); setSaveError(null); };
  const patchEmail = (f, v) => { setForm(p => ({ ...p, emailConfig: { ...p.emailConfig, [f]: v } })); setSaved(false); setSaveError(null); };
  const patchSms   = (f, v) => { setForm(p => ({ ...p, smsConfig: { ...p.smsConfig, [f]: v } })); setSaved(false); setSaveError(null); };
  const patchNotif = (f, v) => { setForm(p => ({ ...p, notifications: { ...p.notifications, [f]: v } })); setSaved(false); setSaveError(null); };
  const patchGov   = (f, v) => { setForm(p => ({ ...p, registryGov: { ...p.registryGov, [f]: v } })); setSaved(false); setSaveError(null); };

  const handleSave = async () => {
    try {
      setSaving(true); setSaveError(null);
      const data = await updateSettings(form);
      if (data) {
        setSettings(data);
        localStorage.setItem("clinicWorkingHours",   JSON.stringify(data.clinicWorkingHours   || defaultWorkingHours()));
        localStorage.setItem("groomingWorkingHours", JSON.stringify(data.groomingWorkingHours || defaultWorkingHours()));
        localStorage.setItem("clinicSlotDuration",   String(data.clinicSlotDuration   || 30));
        localStorage.setItem("groomingSlotDuration", String(data.groomingSlotDuration || 60));
        window.dispatchEvent(new CustomEvent("settings:workingHoursChanged", {
          detail: {
            clinicWorkingHours: data.clinicWorkingHours,
            groomingWorkingHours: data.groomingWorkingHours,
            clinicSlotDuration: data.clinicSlotDuration,
            groomingSlotDuration: data.groomingSlotDuration,
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

  const handlePreviewEmail = async () => {
    setPreviewLoading(true); setPreviewError(null);
    try {
      const data = await request(`/settings/email-preview?type=${previewType}`);
      setPreviewHtml(data.html);
      setShowPreview(true);
    } catch (err) {
      setPreviewError(err?.message || "Αποτυχία φόρτωσης προεπισκόπησης");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmailTo) return;
    setTestEmailSending(true); setTestEmailResult(null);
    try {
      await request("/settings/test-email", { method: "POST", body: { to: testEmailTo } });
      setTestEmailResult({ ok: true, msg: "✅ Το δοκιμαστικό email στάλθηκε επιτυχώς!" });
    } catch (err) {
      setTestEmailResult({ ok: false, msg: `❌ ${err.message}` });
    } finally {
      setTestEmailSending(false);
    }
  };

  const handleTestSms = async () => {
    if (!testSmsTo) return;
    setTestSmsSending(true); setTestSmsResult(null);
    try {
      await request("/settings/test-sms", { method: "POST", body: { to: testSmsTo } });
      setTestSmsResult({ ok: true, msg: "✅ Το δοκιμαστικό SMS στάλθηκε επιτυχώς!" });
    } catch (err) {
      setTestSmsResult({ ok: false, msg: `❌ ${err.message}` });
    } finally {
      setTestSmsSending(false);
    }
  };

  const handleChangePin = async () => {
    if (!pinOld || !pinNew) return;
    if (pinNew !== pinConfirm) { setPinResult({ ok: false, msg: "❌ Τα νέα PIN δεν ταιριάζουν." }); return; }
    if (pinNew.length < 4) { setPinResult({ ok: false, msg: "❌ Το νέο PIN πρέπει να έχει τουλάχιστον 4 χαρακτήρες." }); return; }
    setPinSaving(true); setPinResult(null);
    try {
      await request("/auth/change-pin", { method: "POST", body: { oldPin: pinOld, newPin: pinNew } });
      setPinResult({ ok: true, msg: "✅ Το PIN άλλαξε επιτυχώς!" });
      setPinOld(""); setPinNew(""); setPinConfirm("");
    } catch (err) {
      setPinResult({ ok: false, msg: `❌ ${err.message}` });
    } finally {
      setPinSaving(false);
    }
  };

  const handleDownloadCsv = (type) => {
    const token = localStorage.getItem("token");
    const apiBase = import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:5000/api`;
    fetch(`${apiBase}/export/${type}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${type}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      });
  };

  const updateClinicDay   = (d, p) => setForm(prev => ({ ...prev, clinicWorkingHours:   { ...prev.clinicWorkingHours,   [d]: { ...prev.clinicWorkingHours[d],   ...p } } }));
  const updateGroomingDay = (d, p) => setForm(prev => ({ ...prev, groomingWorkingHours: { ...prev.groomingWorkingHours, [d]: { ...prev.groomingWorkingHours[d], ...p } } }));

  const addStaff    = () => { const name = newName.trim(); if (!name) return; patch("staff", [...(form.staff || []), { name, role: newRole }]); setNewName(""); setNewRole("Κτηνίατρος"); };
  const removeStaff = (i) => patch("staff", form.staff.filter((_, idx) => idx !== i));

  const handleToggleHeadless = async () => {
    if (workerChanging) return;
    const newValue = !form.registryWorkerHeadless;
    const updated  = { ...form, registryWorkerHeadless: newValue };
    setWorkerError(null); setWorkerChanging(true);
    try {
      await updateSettings(updated);
      setForm(updated); setSettings(updated);
      const token = localStorage.getItem("token");
      const authH = token ? { Authorization: `Bearer ${token}` } : {};
      const stop  = await fetch("/api/registry/worker/stop",  { method: "POST", headers: authH });
      if (!stop.ok)  throw new Error("Αποτυχία τερματισμού worker.");
      const start = await fetch("/api/registry/worker/start", { method: "POST", headers: authH });
      if (!start.ok) throw new Error("Αποτυχία εκκίνησης worker.");
    } catch (err) {
      setWorkerError(err?.message || "Σφάλμα κατά την αλλαγή.");
    } finally {
      setWorkerChanging(false);
    }
  };

  const fetchGovStatus = useCallback(async () => {
    setGovStatusLoading(true);
    try {
      const data = await request("/registry/session");
      setGovStatus({ status: data.status, ok: data.ok });
    } catch {
      setGovStatus({ status: "OFFLINE", ok: false });
    } finally {
      setGovStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeSection !== "gov") return;
    fetchGovStatus();
    const interval = setInterval(fetchGovStatus, 5000);
    return () => clearInterval(interval);
  }, [activeSection, fetchGovStatus]);

  const handleGovConnect = async () => {
    if (govConnecting) return;
    setGovConnecting(true); setGovError(null);
    try {
      // Αποθήκευσε πρώτα τυχόν νέα credentials, μετά ζήτα εκκίνηση/επανεκκίνηση.
      const data = await updateSettings(form);
      if (data) setSettings(data);
      await request("/registry/worker/start", { method: "POST" });
      await fetchGovStatus();
    } catch (err) {
      setGovError(err?.message || "Αποτυχία σύνδεσης.");
    } finally {
      setGovConnecting(false);
    }
  };

  const GOV_STATUS_DISPLAY = {
    LOGGED_IN:  { label: "Συνδεδεμένο",      icon: CheckCircle2, cls: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/40" },
    NEEDS_LOGIN:{ label: "Χρειάζεται σύνδεση", icon: AlertCircle,  cls: "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/40" },
    PRE_LOGIN:  { label: "Εκκίνηση...",        icon: Loader2,      cls: "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/40" },
    OFFLINE:    { label: "Μη συνδεδεμένο",     icon: AlertCircle,  cls: "bg-gray-50 text-gray-500 border-gray-100 dark:bg-win-elevated/50 dark:text-gray-400 dark:border-win-border" },
  };
  const govStatusInfo = GOV_STATUS_DISPLAY[govStatus?.status] || GOV_STATUS_DISPLAY.OFFLINE;

  if (loading || !form) {
    return (
      <div className="py-16 text-center">
        <Settings className="w-8 h-8 text-gray-200 mx-auto mb-3 animate-spin" style={{ animationDuration: "2s" }} />
        <p className="text-sm text-gray-400">Φόρτωση ρυθμίσεων...</p>
      </div>
    );
  }
  if (error) return <div className="py-12 text-center text-sm text-red-500">{error}</div>;

  const saveProps = { onSave: handleSave, saving, saved, saveError };

  const sections = (
    <div className="space-y-4">

      {/* ── Στοιχεία ── */}
      <div className={activeSection !== "clinic" ? "hidden" : ""}>
        <Section title="Στοιχεία Κλινικής" description="Βασικές πληροφορίες εμφάνισης και επικοινωνίας." {...saveProps}>
          <div>
            <label className={LABEL}>Λογότυπο</label>
            <LogoUpload value={form.logo} onUploadFile={async (file) => { const url = await uploadLogo(file); patch("logo", url); }} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Όνομα Κτηνιατρείου</label>
              <input type="text" value={form.clinicName || ""} onChange={(e) => patch("clinicName", e.target.value)} placeholder="π.χ. Ιατρείο Μικρών Ζώων" className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Τηλέφωνο</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
                <input type="tel" value={form.phone || ""} onChange={(e) => patch("phone", e.target.value)} placeholder="210 1234567" className={ICON_INPUT} />
              </div>
            </div>
          </div>
          <div>
            <label className={LABEL}>Διεύθυνση</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
              <input type="text" value={form.address || ""} onChange={(e) => patch("address", e.target.value)} placeholder="π.χ. Λεωφ. Μαραθώνος 12, Άγιος Στέφανος" className={ICON_INPUT} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>ΑΦΜ</label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
                <input type="text" value={form.afm || ""} onChange={(e) => patch("afm", e.target.value)} placeholder="123456789" className={ICON_INPUT} />
              </div>
            </div>
            <div>
              <label className={LABEL}>Γλώσσα</label>
              <select value={form.language || "el"} onChange={(e) => patch("language", e.target.value)} className={INPUT}>
                <option value="el">🇬🇷 Ελληνικά</option>
                <option value="en">🇬🇧 English</option>
              </select>
            </div>
          </div>
          <div>
            <label className={LABEL}>Ζώνη Ώρας</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
              <select value={form.timezone || "Europe/Athens"} onChange={(e) => patch("timezone", e.target.value)} className={ICON_INPUT}>
                {timeZones.map(tz => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </div>
          </div>
        </Section>
      </div>

      {/* ── Προσωπικό ── */}
      <div className={activeSection !== "staff" ? "hidden" : ""}>
        <Section title="Προσωπικό" description="Διαχείριση μελών ομάδας και ρόλων." {...saveProps}>
          <div className="rounded-2xl border border-gray-200 dark:border-win-border overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-900/30 dark:to-violet-900/30 border-b border-gray-200 dark:border-win-border px-5 py-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">Μέλη Ομάδας</span>
              {(form.staff || []).length > 0 && (
                <span className="ml-1 text-xs font-bold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded-full">{form.staff.length}</span>
              )}
            </div>
            {(form.staff || []).length > 0 ? (
              <div className="divide-y divide-gray-100 dark:divide-win-border">
                {form.staff.map((member, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 dark:hover:bg-win-elevated/50 transition-colors group">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <span className="text-sm font-bold text-white">{member.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{member.name}</p>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0 ${ROLE_STYLE[member.role] || "bg-gray-100 text-gray-600"}`}>{member.role}</span>
                    <button type="button" onClick={() => removeStaff(i)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-300 hover:text-red-500 transition-all flex-shrink-0">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-5 py-10 text-center">
                <Users className="w-8 h-8 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
                <p className="text-sm text-gray-400 dark:text-gray-500">Δεν έχει καταχωρηθεί προσωπικό ακόμα.</p>
              </div>
            )}
            <div className="border-t border-gray-100 dark:border-win-border bg-gray-50 dark:bg-win-elevated/50 px-5 py-3">
              <div className="flex gap-2">
                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addStaff()} placeholder="Όνομα μέλους..." className="flex-1 border border-gray-200 dark:border-win-border-light rounded-xl px-3 py-2 text-sm bg-white dark:bg-win-elevated text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="border border-gray-200 dark:border-win-border-light rounded-xl px-3 py-2 text-sm bg-white dark:bg-win-elevated text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-300">
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <button type="button" onClick={addStaff} disabled={!newName.trim()} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold transition-colors disabled:opacity-40 flex-shrink-0">
                  <UserPlus className="w-4 h-4" /> Προσθήκη
                </button>
              </div>
            </div>
          </div>
        </Section>
      </div>

      {/* ── Ωράριο ── */}
      <div className={activeSection !== "hours" ? "hidden" : ""}>
        <Section title="Ωράριο Λειτουργίας" description="Ρύθμιση ωρών για ιατρείο και grooming." {...saveProps}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Διάρκεια slot ραντεβού — Ιατρείο</label>
              <select
                value={form.clinicSlotDuration || 30}
                onChange={(e) => patch("clinicSlotDuration", Number(e.target.value))}
                className={INPUT}
              >
                {SLOT_DURATION_OPTIONS.map((m) => (
                  <option key={m} value={m}>{m} λεπτά</option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL}>Διάρκεια slot ραντεβού — Grooming</label>
              <select
                value={form.groomingSlotDuration || 60}
                onChange={(e) => patch("groomingSlotDuration", Number(e.target.value))}
                className={INPUT}
              >
                {SLOT_DURATION_OPTIONS.map((m) => (
                  <option key={m} value={m}>{m} λεπτά</option>
                ))}
              </select>
            </div>
          </div>

          <WorkingHoursSection title="Ωράριο Ιατρείου"  workingHours={form.clinicWorkingHours}   updateDay={updateClinicDay} />
          <WorkingHoursSection title="Ωράριο Grooming"  workingHours={form.groomingWorkingHours} updateDay={updateGroomingDay} />
        </Section>
      </div>

      {/* ── GOV (gov.gr / εθνικό μητρώο) ── */}
      <div className={activeSection !== "gov" ? "hidden" : ""}>
        <Section
          title="Σύνδεση GOV.GR"
          description="Στοιχεία σύνδεσης Taxisnet για το εθνικό μητρώο ζώων συντροφιάς (pet.gov.gr). Κάθε κλινική τρέχει τον δικό της, ξεχωριστό worker — τα credentials δεν μοιράζονται με άλλες κλινικές."
          {...saveProps}
        >
          <div className="flex gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-700/50">
            <Landmark className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
              Χρησιμοποίησε τα προσωπικά στοιχεία Taxisnet του κτηνιάτρου (όχι το ΑΦΜ της κλινικής). Το password αποθηκεύεται κρυπτογραφημένο.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Όνομα χρήστη (Taxisnet)</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-gray-600" />
                <input
                  type="text"
                  value={form.registryGov?.username || ""}
                  onChange={(e) => patchGov("username", e.target.value)}
                  placeholder="π.χ. vet_username"
                  className={`${INPUT} pl-9`}
                  autoComplete="off"
                />
              </div>
            </div>
            <div>
              <label className={LABEL}>Κωδικός (Taxisnet)</label>
              <div className="relative">
                <input
                  type={showGovPassword ? "text" : "password"}
                  value={form.registryGov?.password || ""}
                  onChange={(e) => patchGov("password", e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full border border-gray-200 dark:border-win-border-light rounded-xl px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white dark:bg-win-elevated text-gray-900 dark:text-gray-100"
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowGovPassword(!showGovPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                  {showGovPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </Section>

        <div className="mt-4">
          <Section title="Κατάσταση Σύνδεσης">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-win-elevated/50 rounded-2xl border border-gray-200 dark:border-win-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-win-elevated flex items-center justify-center flex-shrink-0">
                  <Landmark className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Registry Worker</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Ο browser που συνδέεται στο pet.gov.gr για αναζητήσεις microchip.</p>
                </div>
              </div>
              <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border flex-shrink-0 ${govStatusInfo.cls}`}>
                <govStatusInfo.icon className={`w-3.5 h-3.5 ${govStatusLoading ? "animate-spin" : ""}`} />
                {govStatusInfo.label}
              </span>
            </div>

            <button
              type="button"
              onClick={handleGovConnect}
              disabled={govConnecting}
              className="mt-3 flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {govConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Landmark className="w-4 h-4" />}
              {govConnecting ? "Σύνδεση..." : "Αποθήκευση & Σύνδεση τώρα"}
            </button>
            {govError && <p className="text-xs text-red-500 mt-2">{govError}</p>}
          </Section>
        </div>
      </div>

      {/* ── Εμφάνιση ── */}
      <div className={activeSection !== "ui" ? "hidden" : ""}>
        <Section title="Εμφάνιση" description="Θέμα εμφάνισης και όρια αποθέματος.">
          <div>
            <p className={LABEL}>Θέμα</p>
            <DarkModeToggle settings={form} setSettings={setForm} updateSettings={updateSettings} />
          </div>
          <div className="border-t border-gray-100 dark:border-win-border pt-5">
            <p className={LABEL + " mb-3"}>Stock Thresholds</p>
            <StockThresholdsPanel />
          </div>
        </Section>
      </div>

      {/* ── Email / Ειδοποιήσεις ── */}
      <div className={activeSection !== "notifications" ? "hidden" : ""}>
        <Section title="Ρυθμίσεις Email (SMTP)" description="Στοιχεία SMTP για αυτόματη αποστολή email." {...saveProps}>
          <div className="flex gap-3 p-3 bg-sky-50 dark:bg-sky-900/20 rounded-xl border border-sky-100 dark:border-sky-700/50">
            <Mail className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-sky-600 dark:text-sky-400 leading-relaxed">
              Για Gmail χρησιμοποίησε <strong>smtp.gmail.com</strong>, port <strong>587</strong>. Χρειάζεσαι <strong>App Password</strong> από το Google Account.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>SMTP Host</label>
              <input type="text" value={form.emailConfig?.host || ""} onChange={(e) => patchEmail("host", e.target.value)} placeholder="smtp.gmail.com" className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Port</label>
              <input type="number" value={form.emailConfig?.port || 587} onChange={(e) => patchEmail("port", parseInt(e.target.value) || 587)} className={INPUT} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Email χρήστη</label>
              <input type="email" value={form.emailConfig?.user || ""} onChange={(e) => patchEmail("user", e.target.value)} placeholder="clinic@gmail.com" className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Κωδικός / App Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={form.emailConfig?.password || ""} onChange={(e) => patchEmail("password", e.target.value)} placeholder="••••••••••••••••" className="w-full border border-gray-200 dark:border-win-border-light rounded-xl px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white dark:bg-win-elevated text-gray-900 dark:text-gray-100" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Όνομα αποστολέα</label>
              <input type="text" value={form.emailConfig?.fromName || ""} onChange={(e) => patchEmail("fromName", e.target.value)} placeholder="Κτηνιατρείο Άγιος Στέφανος" className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Email αποστολέα</label>
              <input type="email" value={form.emailConfig?.fromEmail || ""} onChange={(e) => patchEmail("fromEmail", e.target.value)} placeholder="clinic@gmail.com" className={INPUT} />
            </div>
          </div>
        </Section>

        <div className="mt-4">
          <Section title="Προεπισκόπηση Email Templates" description="Δες πώς θα εμφανιστεί κάθε αυτόματο email με τα στοιχεία της κλινικής σου, χωρίς να σταλεί τίποτα.">
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className={LABEL}>Template</label>
                <select value={previewType} onChange={(e) => setPreviewType(e.target.value)} className={INPUT}>
                  <option value="welcome">Καλωσόρισμα νέου πελάτη</option>
                  <option value="appointmentReminder">Υπενθύμιση ραντεβού</option>
                  <option value="vaccinationReminder">Υπενθύμιση εμβολίου</option>
                  <option value="purchaseReminder">Υπενθύμιση αγοράς</option>
                  <option value="birthday">Χρόνια Πολλά κατοικιδίου</option>
                </select>
              </div>
              <button type="button" onClick={handlePreviewEmail} disabled={previewLoading} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold transition-colors disabled:opacity-40 flex-shrink-0">
                <Eye className="w-3.5 h-3.5" /> {previewLoading ? "Φόρτωση..." : "Προεπισκόπηση"}
              </button>
            </div>
            {previewError && (
              <div className="mt-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-50 text-red-600 border border-red-100">
                ❌ {previewError}
              </div>
            )}
          </Section>
        </div>

        <div className="mt-4">
          <Section title="Δοκιμαστικό Email">
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className={LABEL}>Αποστολή σε</label>
                <input type="email" value={testEmailTo} onChange={(e) => { setTestEmailTo(e.target.value); setTestEmailResult(null); }} placeholder="email@example.com" className={INPUT} onKeyDown={(e) => e.key === "Enter" && handleTestEmail()} />
              </div>
              <button type="button" onClick={handleTestEmail} disabled={!testEmailTo || testEmailSending} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold transition-colors disabled:opacity-40 flex-shrink-0">
                <Send className="w-3.5 h-3.5" /> {testEmailSending ? "Αποστολή..." : "Αποστολή"}
              </button>
            </div>
            {testEmailResult && (
              <div className={`mt-2 px-4 py-2.5 rounded-xl text-sm font-medium ${testEmailResult.ok ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"}`}>
                {testEmailResult.msg}
              </div>
            )}
          </Section>
        </div>

        <div className="mt-4">
          <Section title="Ρυθμίσεις SMS (Twilio)" description="Στοιχεία Twilio για αυτόματη αποστολή SMS." {...saveProps}>
            <div className="flex gap-3 p-3 bg-sky-50 dark:bg-sky-900/20 rounded-xl border border-sky-100 dark:border-sky-700/50">
              <Phone className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-sky-600 dark:text-sky-400 leading-relaxed">
                Χρειάζεσαι λογαριασμό στο <strong>twilio.com</strong> με Account SID, Auth Token και έναν αγορασμένο αριθμό αποστολής.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Account SID</label>
                <input type="text" value={form.smsConfig?.accountSid || ""} onChange={(e) => patchSms("accountSid", e.target.value)} placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Auth Token</label>
                <div className="relative">
                  <input type={showSmsToken ? "text" : "password"} value={form.smsConfig?.authToken || ""} onChange={(e) => patchSms("authToken", e.target.value)} placeholder="••••••••••••••••" className="w-full border border-gray-200 dark:border-win-border-light rounded-xl px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white dark:bg-win-elevated text-gray-900 dark:text-gray-100" />
                  <button type="button" onClick={() => setShowSmsToken(!showSmsToken)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                    {showSmsToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            <div>
              <label className={LABEL}>Αριθμός αποστολέα</label>
              <input type="text" value={form.smsConfig?.fromNumber || ""} onChange={(e) => patchSms("fromNumber", e.target.value)} placeholder="+306912345678" className={INPUT} />
            </div>
          </Section>
        </div>

        <div className="mt-4">
          <Section title="Δοκιμαστικό SMS">
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className={LABEL}>Αποστολή σε</label>
                <input type="tel" value={testSmsTo} onChange={(e) => { setTestSmsTo(e.target.value); setTestSmsResult(null); }} placeholder="+306912345678" className={INPUT} onKeyDown={(e) => e.key === "Enter" && handleTestSms()} />
              </div>
              <button type="button" onClick={handleTestSms} disabled={!testSmsTo || testSmsSending} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold transition-colors disabled:opacity-40 flex-shrink-0">
                <Send className="w-3.5 h-3.5" /> {testSmsSending ? "Αποστολή..." : "Αποστολή"}
              </button>
            </div>
            {testSmsResult && (
              <div className={`mt-2 px-4 py-2.5 rounded-xl text-sm font-medium ${testSmsResult.ok ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"}`}>
                {testSmsResult.msg}
              </div>
            )}
          </Section>
        </div>

        <div className="mt-4">
          <Section title="Αυτόματες Ειδοποιήσεις" description="Ενεργοποίησε/απενεργοποίησε αυτόματες αποστολές." {...saveProps}>
            <div className="space-y-2">
              <NotifToggle icon="📅" label="Υπενθύμιση ραντεβού"  desc="1 μέρα πριν — 08:00"  value={form.notifications?.appointmentReminder ?? true}  onChange={(v) => patchNotif("appointmentReminder", v)} />
              <NotifToggle icon="💉" label="Υπενθύμιση εμβολίου"  desc="7 και 1 μέρα πριν — 09:00" value={form.notifications?.vaccineReminder ?? true}   onChange={(v) => patchNotif("vaccineReminder", v)} />
              <NotifToggle icon="🎂" label="Γενέθλια κατοικιδίου" desc="Ημέρα γενεθλίων — 10:00"   value={form.notifications?.birthdayReminder ?? false}  onChange={(v) => patchNotif("birthdayReminder", v)} />
              <NotifToggle icon="🛒" label="Υπενθύμιση αγοράς"     desc="Προγραμματισμένη ημερομηνία — 10:00" value={form.notifications?.purchaseReminder ?? true}  onChange={(v) => patchNotif("purchaseReminder", v)} />
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-win-border-light">
              <NotifToggle icon="📱" label="Αποστολή και μέσω SMS" desc="Επιπλέον στα παραπάνω, για πελάτες με ενεργές ειδοποιήσεις SMS" value={form.notifications?.smsEnabled ?? false} onChange={(v) => patchNotif("smsEnabled", v)} />
            </div>
          </Section>
        </div>
      </div>

      {/* ── Συντομεύσεις ── */}
      <div className={activeSection !== "shortcuts" ? "hidden" : ""}>
        <Section title="Συντομεύσεις Πληκτρολογίου" description="Προσαρμογή πλήκτρων για γρήγορη πλοήγηση.">
          <KeyboardShortcutsSection />
        </Section>
      </div>

      {/* ── Οθόνη Αφής ── */}
      <div className={activeSection !== "touchscreen" ? "hidden" : ""}>
        <Section title="Οθόνη Αφής" description="Ρύθμιση συσκευής — ισχύει μόνο σε αυτή τη συσκευή/browser, όχι σε όλη την κλινική.">
          <TouchscreenSettings />
        </Section>
      </div>

      {/* ── Λογαριασμός / Αλλαγή PIN ── */}
      <div className={activeSection !== "account" ? "hidden" : ""}>
        <Section title="Αλλαγή PIN Σύνδεσης" description="Αλλαγή του προσωπικού σου PIN για είσοδο στο σύστημα.">
          <div className="space-y-4">
            <div>
              <label className={LABEL}>Τρέχον PIN</label>
              <div className="relative">
                <input type={showOldPin ? "text" : "password"} value={pinOld} onChange={(e) => { setPinOld(e.target.value); setPinResult(null); }} placeholder="••••" className="w-full border border-gray-200 dark:border-win-border-light rounded-xl px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white dark:bg-win-elevated text-gray-900 dark:text-gray-100 placeholder-gray-400" />
                <button type="button" onClick={() => setShowOldPin(!showOldPin)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                  {showOldPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Νέο PIN</label>
                <div className="relative">
                  <input type={showNewPin ? "text" : "password"} value={pinNew} onChange={(e) => { setPinNew(e.target.value); setPinResult(null); }} placeholder="••••" className="w-full border border-gray-200 dark:border-win-border-light rounded-xl px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white dark:bg-win-elevated text-gray-900 dark:text-gray-100 placeholder-gray-400" />
                  <button type="button" onClick={() => setShowNewPin(!showNewPin)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                    {showNewPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className={LABEL}>Επιβεβαίωση νέου PIN</label>
                <input type="password" value={pinConfirm} onChange={(e) => { setPinConfirm(e.target.value); setPinResult(null); }} placeholder="••••" className="w-full border border-gray-200 dark:border-win-border-light rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white dark:bg-win-elevated text-gray-900 dark:text-gray-100 placeholder-gray-400" />
              </div>
            </div>
            {pinResult && (
              <div className={`px-4 py-2.5 rounded-xl text-sm font-medium ${pinResult.ok ? "bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700/50" : "bg-red-50 text-red-600 border border-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700/50"}`}>
                {pinResult.msg}
              </div>
            )}
            <button type="button" onClick={handleChangePin} disabled={!pinOld || !pinNew || !pinConfirm || pinSaving} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors disabled:opacity-40">
              <Lock className="w-4 h-4" /> {pinSaving ? "Αλλαγή..." : "Αλλαγή PIN"}
            </button>
          </div>
        </Section>
      </div>

      {/* ── Χρήστες ── */}
      {user?.role === "admin" && (
        <div className={activeSection !== "users" ? "hidden" : ""}>
          <Section title="Χρήστες Συστήματος" description="Δημιουργία λογαριασμών σύνδεσης (PIN) και ανάθεση ρόλων.">
            <UsersSettings />
          </Section>
        </div>
      )}

      {/* ── Εξαγωγή Δεδομένων ── */}
      <div className={activeSection !== "export" ? "hidden" : ""}>
        <Section title="Εξαγωγή Δεδομένων" description="Λήψη δεδομένων σε CSV — άνοιγμα με Excel ή Google Sheets.">
          <div className="space-y-3">
            {[
              { key: "customers",    label: "Πελάτες",    desc: "Όνομα, τηλέφωνο, email, διεύθυνση",     icon: "👥", bg: "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700/50", text: "text-indigo-700 dark:text-indigo-300", btn: "bg-indigo-100 dark:bg-indigo-900/40 hover:bg-indigo-200 dark:hover:bg-indigo-900/60" },
              { key: "pets",         label: "Κατοικίδια", desc: "Στοιχεία ζώου, ιδιοκτήτης, microchip",  icon: "🐾", bg: "bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-700/50",         text: "text-sky-700 dark:text-sky-300",     btn: "bg-sky-100 dark:bg-sky-900/40 hover:bg-sky-200 dark:hover:bg-sky-900/60" },
              { key: "appointments", label: "Ραντεβού",   desc: "Ημερομηνία, ώρα, ζώο, τύπος, ιατρός",  icon: "📅", bg: "bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-700/50", text: "text-violet-700 dark:text-violet-300", btn: "bg-violet-100 dark:bg-violet-900/40 hover:bg-violet-200 dark:hover:bg-violet-900/60" },
            ].map(({ key, label, desc, icon, bg, text, btn }) => (
              <div key={key} className={`flex items-center gap-4 p-4 rounded-2xl border ${bg}`}>
                <span className="text-2xl flex-shrink-0">{icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold ${text}`}>{label}</p>
                  <p className={`text-xs mt-0.5 opacity-70 ${text}`}>{desc}</p>
                </div>
                <button type="button" onClick={() => handleDownloadCsv(key)} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex-shrink-0 ${btn} ${text}`}>
                  <Download className="w-4 h-4" /> CSV
                </button>
              </div>
            ))}
          </div>
          <div className="mt-2 p-3 bg-gray-50 dark:bg-win-elevated/50 rounded-xl border border-gray-100 dark:border-win-border/50 flex items-start gap-2">
            <FileText className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-400 dark:text-gray-500">Τα αρχεία CSV περιέχουν BOM (UTF-8) για σωστή εμφάνιση ελληνικών στο Excel. Στο Google Sheets: File → Import.</p>
          </div>
        </Section>
      </div>

      {/* ── Audit Log ── */}
      <div className={activeSection !== "audit" ? "hidden" : ""}>
        <Section title="Audit Log" description="Ιστορικό ενεργειών — 90 ημέρες διατήρηση. Μόνο για admin.">
          <AuditLogViewer />
        </Section>
      </div>

      {/* ── Admin ── */}
      <div className={activeSection !== "admin" ? "hidden" : ""}>
        <Section title="Admin" description="Ρυθμίσεις για τον Playwright registry worker (gov.gr).">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-win-elevated/50 rounded-2xl border border-gray-200 dark:border-win-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-win-elevated flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Headless Registry Worker</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Όταν ενεργό, ο Chromium τρέχει χωρίς ορατό παράθυρο.</p>
              </div>
            </div>
            <button type="button" onClick={handleToggleHeadless} disabled={workerChanging}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${form.registryWorkerHeadless ? "bg-emerald-500" : "bg-gray-300 dark:bg-win-elevated2"} ${workerChanging ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${form.registryWorkerHeadless ? "translate-x-5" : "translate-x-1"}`} />
            </button>
          </div>
          {workerChanging && <p className="text-xs text-gray-400 dark:text-gray-500">Επανεκκίνηση worker...</p>}
          {workerError && <p className="text-xs text-red-500">{workerError}</p>}
        </Section>
      </div>

    </div>
  );

  return (
    <div className="flex flex-col gap-6">

      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-sm">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-800 dark:text-gray-100">Ρυθμίσεις Συστήματος</h1>
            <p className="text-xs text-gray-400 dark:text-gray-500">Διαχείριση κλινικής, προσωπικού και συστήματος</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-win-border-light text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-win-elevated transition-colors">
            <X className="w-4 h-4" /> Κλείσιμο
          </button>
        )}
      </div>

      {/* ── Mobile: Navigation Menu ── */}
      <div className={`sm:hidden ${mobileView === "menu" ? "block" : "hidden"}`}>
        <div className="space-y-4">
          {navGroups.map(({ group, items }) => (
            <div key={group}>
              <p className="text-[10px] font-bold text-gray-300 dark:text-gray-600 uppercase tracking-widest mb-2 px-1">{group}</p>
              <div className="bg-white dark:bg-win-surface rounded-2xl border border-gray-100 dark:border-win-border overflow-hidden">
                {items.map(({ id, label, icon: Icon, desc, iconBg, iconColor }) => (
                  <button key={id} type="button"
                    onClick={() => { setActiveSection(id); setMobileView("content"); }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-win-elevated active:bg-gray-100 transition-colors border-b border-gray-50 dark:border-win-border/50 last:border-0"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                      <Icon className={`w-5 h-5 ${iconColor}`} />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{label}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Mobile: Back button ── */}
      {mobileView === "content" && (
        <button type="button" onClick={() => setMobileView("menu")}
          className="sm:hidden flex items-center gap-2 text-indigo-500 dark:text-indigo-400 text-sm font-semibold hover:text-indigo-700 transition-colors -mb-2"
        >
          <ArrowLeft className="w-4 h-4" /> Πίσω στις ρυθμίσεις
        </button>
      )}

      {/* ── Mobile: Content ── */}
      <div className={mobileView === "content" ? "sm:hidden" : "hidden"}>
        {sections}
      </div>

      {/* ── Desktop: Sidebar + Content ── */}
      <div className="hidden sm:flex gap-6 items-start">
        <div className="w-48 flex-shrink-0 bg-white dark:bg-win-surface rounded-2xl border border-gray-100 dark:border-win-border overflow-hidden py-3">
          {navGroups.map(({ group, items }) => (
            <div key={group} className="mb-4 last:mb-0">
              <p className="text-[10px] font-bold text-gray-300 dark:text-gray-600 uppercase tracking-widest mb-1 px-4">{group}</p>
              {items.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setActiveSection(id)}
                  className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm font-medium transition-colors text-left ${
                    activeSection === id
                      ? "bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-r-2 border-indigo-500"
                      : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-win-elevated hover:text-gray-700 dark:hover:text-gray-200"
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                </button>
              ))}
            </div>
          ))}
        </div>
        <div className="flex-1 min-w-0">
          {sections}
        </div>
      </div>

      {showPreview && createPortal(
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={() => setShowPreview(false)}>
          <div
            className="relative w-full max-w-[640px] max-h-[90vh] bg-white dark:bg-win-surface rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-win-border bg-gray-50 dark:bg-win-elevated/50 flex-shrink-0">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Προεπισκόπηση Email</p>
              <button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <iframe title="email-preview" srcDoc={previewHtml} className="flex-1 w-full" style={{ minHeight: "70vh", border: "none" }} />
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default SettingsPage;
