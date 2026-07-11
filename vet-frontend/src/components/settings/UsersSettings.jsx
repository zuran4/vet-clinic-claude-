import React, { useState, useEffect, useCallback } from "react";
import { UserPlus, Pencil, Trash2, Check, X, KeyRound } from "lucide-react";
import { getAllUsers, createUser, updateUser, deleteUser } from "../../api/usersApi.js";

const ROLE_OPTIONS = [
  { value: "admin",     label: "Διαχειριστής" },
  { value: "vet",       label: "Κτηνίατρος" },
  { value: "secretary", label: "Γραμματεία" },
  { value: "groomer",   label: "Groomer" },
  { value: "assistant", label: "Βοηθός" },
];

const ROLE_LABEL = Object.fromEntries(ROLE_OPTIONS.map((r) => [r.value, r.label]));

const ROLE_STYLE = {
  admin:     "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  vet:       "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  secretary: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  groomer:   "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  assistant: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
};

const LABEL = "block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5";
const INPUT = "w-full border border-gray-200 dark:border-win-border-light rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white dark:bg-win-elevated text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500";

const emptyNewUser = { name: "", pin: "", role: "assistant" };

function EditRow({ user, onCancel, onSaved }) {
  const [form, setForm]     = useState({ name: user.name, role: user.role, isActive: user.isActive, pin: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = { name: form.name.trim(), role: form.role, isActive: form.isActive };
      if (form.pin.trim()) payload.pin = form.pin.trim();
      const updated = await updateUser(user._id, payload);
      onSaved(updated);
    } catch (err) {
      setError(err.message || "Αποτυχία ενημέρωσης.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-5 py-3 bg-indigo-50/50 dark:bg-indigo-900/10 space-y-2.5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Όνομα" className={INPUT} />
        <select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))} className={INPUT}>
          {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        <input type="text" inputMode="numeric" value={form.pin} onChange={(e) => setForm((p) => ({ ...p, pin: e.target.value.replace(/\D/g, "") }))} placeholder="Νέο PIN (προαιρετικό)" className={INPUT} />
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer w-fit">
        <div onClick={() => setForm((p) => ({ ...p, isActive: !p.isActive }))}
          className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 cursor-pointer ${form.isActive ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-700"}`}>
          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActive ? "translate-x-4" : "translate-x-0.5"}`} />
        </div>
        Ενεργός λογαριασμός
      </label>
      {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
      <div className="flex items-center gap-2">
        <button type="button" onClick={handleSave} disabled={saving || !form.name.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-xs font-semibold transition-colors">
          <Check className="w-3.5 h-3.5" /> {saving ? "Αποθήκευση..." : "Αποθήκευση"}
        </button>
        <button type="button" onClick={onCancel} disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-win-border text-gray-500 dark:text-gray-400 text-xs font-medium hover:bg-gray-100 dark:hover:bg-win-elevated transition-colors">
          <X className="w-3.5 h-3.5" /> Άκυρο
        </button>
      </div>
    </div>
  );
}

export default function UsersSettings() {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [newUser, setNewUser]   = useState(emptyNewUser);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data || []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleCreate = async () => {
    setCreateError("");
    if (!newUser.name.trim() || !newUser.pin.trim()) return;
    setCreating(true);
    try {
      const saved = await createUser({ name: newUser.name.trim(), pin: newUser.pin.trim(), role: newUser.role });
      setUsers((prev) => [...prev, saved]);
      setNewUser(emptyNewUser);
    } catch (err) {
      setCreateError(err.message || "Αποτυχία δημιουργίας χρήστη.");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Διαγραφή χρήστη "${user.name}";`)) return;
    try {
      await deleteUser(user._id);
      setUsers((prev) => prev.filter((u) => u._id !== user._id));
    } catch (err) {
      alert("❌ " + (err.message || "Αποτυχία διαγραφής."));
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-win-border overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-900/30 dark:to-violet-900/30 border-b border-gray-200 dark:border-win-border px-5 py-3 flex items-center gap-2">
        <KeyRound className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
        <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">Χρήστες Συστήματος</span>
        {users.length > 0 && (
          <span className="ml-1 text-xs font-bold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded-full">{users.length}</span>
        )}
      </div>

      {loading ? (
        <div className="px-5 py-10 text-center text-sm text-gray-400 dark:text-gray-500">Φόρτωση...</div>
      ) : users.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-sm text-gray-400 dark:text-gray-500">Δεν υπάρχουν χρήστες ακόμα.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-win-border">
          {users.map((user) => (
            <div key={user._id}>
              <div className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 dark:hover:bg-win-elevated/50 transition-colors group">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center flex-shrink-0 shadow-sm ${!user.isActive ? "opacity-40" : ""}`}>
                  <span className="text-sm font-bold text-white">{user.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${user.isActive ? "text-gray-800 dark:text-gray-100" : "text-gray-400 dark:text-gray-500 line-through"}`}>{user.name}</p>
                  {!user.isActive && <p className="text-xs text-gray-400 dark:text-gray-500">Ανενεργός</p>}
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0 ${ROLE_STYLE[user.role] || "bg-gray-100 text-gray-600"}`}>
                  {ROLE_LABEL[user.role] || user.role}
                </span>
                <button type="button" onClick={() => setEditingId(editingId === user._id ? null : user._id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-gray-300 hover:text-indigo-500 transition-all flex-shrink-0">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => handleDelete(user)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-300 hover:text-red-500 transition-all flex-shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              {editingId === user._id && (
                <EditRow
                  user={user}
                  onCancel={() => setEditingId(null)}
                  onSaved={(updated) => { setUsers((prev) => prev.map((u) => (u._id === updated._id ? updated : u))); setEditingId(null); }}
                />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-gray-100 dark:border-win-border bg-gray-50 dark:bg-win-elevated/50 px-5 py-3 space-y-2">
        <p className={LABEL}>Νέος Χρήστης</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input type="text" value={newUser.name} onChange={(e) => setNewUser((p) => ({ ...p, name: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()} placeholder="Όνομα..." className={INPUT} />
          <input type="text" inputMode="numeric" value={newUser.pin} onChange={(e) => setNewUser((p) => ({ ...p, pin: e.target.value.replace(/\D/g, "") }))}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()} placeholder="PIN (4-10 ψηφία)" className={INPUT} />
          <select value={newUser.role} onChange={(e) => setNewUser((p) => ({ ...p, role: e.target.value }))} className={INPUT}>
            {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        {createError && <p className="text-xs text-red-500 dark:text-red-400">{createError}</p>}
        <button type="button" onClick={handleCreate} disabled={creating || !newUser.name.trim() || !newUser.pin.trim()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold transition-colors disabled:opacity-40">
          <UserPlus className="w-4 h-4" /> {creating ? "Δημιουργία..." : "Προσθήκη Χρήστη"}
        </button>
      </div>
    </div>
  );
}
