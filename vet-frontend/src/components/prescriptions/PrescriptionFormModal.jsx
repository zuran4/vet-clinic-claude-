import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  FilePlus, X, Save, PawPrint, Pill, FlaskConical,
  StickyNote, Stethoscope, Search, User,
} from "lucide-react";
import request from "@/api/apiClient.js";

const INPUT = "w-full border border-gray-200 rounded-2xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 placeholder-gray-400";
const LABEL = "block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1";

/* ── Customer search με portal dropdown ── */
const CustomerSearch = ({ value, onSelect, onClear }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dropdownPos, setDropdownPos] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (query.trim().length < 1) { setResults([]); return; }
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        setLoading(true);
        const data = await request(`/customers?search=${encodeURIComponent(query)}`);
        if (!cancelled) setResults(Array.isArray(data) ? data : (data.data ?? []));
      } catch { if (!cancelled) setResults([]); }
      finally { if (!cancelled) setLoading(false); }
    }, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [query]);

  const openDropdown = () => {
    if (inputRef.current) {
      const r = inputRef.current.getBoundingClientRect();
      setDropdownPos({ top: r.bottom + 4, left: r.left, width: r.width });
    }
  };

  const handleSelect = (c) => {
    onSelect(c);
    setQuery("");
    setResults([]);
    setDropdownPos(null);
  };

  if (value) {
    return (
      <div className="flex items-center gap-2 border border-indigo-200 bg-indigo-50 rounded-2xl px-3 py-2">
        <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-indigo-600">{value.name?.charAt(0)?.toUpperCase()}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-indigo-700 truncate">{value.name}</p>
          {value.phone && <p className="text-xs text-indigo-400">{value.phone}</p>}
        </div>
        <button type="button" onClick={onClear} className="text-indigo-400 hover:text-red-400 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const showDropdown = dropdownPos && query.trim().length > 0;

  return (
    <>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); if (e.target.value.trim()) openDropdown(); else setDropdownPos(null); }}
          onFocus={openDropdown}
          onBlur={() => setTimeout(() => setDropdownPos(null), 200)}
          placeholder="Αναζήτηση με όνομα ή κινητό..."
          className={INPUT}
        />
      </div>

      {showDropdown && createPortal(
        <div style={{ position: "fixed", top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width, zIndex: 9999 }}
          className="bg-white border border-gray-100 rounded-2xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-3 text-xs text-gray-400 text-center">Αναζήτηση...</div>
          ) : results.length > 0 ? (
            <ul className="max-h-44 overflow-y-auto divide-y divide-gray-50">
              {results.map((c) => (
                <li key={c._id}>
                  <button type="button"
                    onMouseDown={(e) => { e.preventDefault(); handleSelect(c); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 transition-colors flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-indigo-500">{c.name?.charAt(0)?.toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.phone}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-3 text-xs text-gray-400 text-center">Δεν βρέθηκαν πελάτες.</div>
          )}
        </div>,
        document.body
      )}
    </>
  );
};

/* ── Pet selector ── */
const PetSelector = ({ customerId, selectedPet, onSelect }) => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState(null);
  const btnRef = useRef(null);

  useEffect(() => {
    if (!customerId) { setPets([]); onSelect(null); return; }
    let cancelled = false;
    const doFetch = async () => {
      try {
        setLoading(true);
        const data = await request(`/pets/by-owner/${customerId}`);
        if (!cancelled) setPets(Array.isArray(data) ? data : []);
      } catch { if (!cancelled) setPets([]); }
      finally { if (!cancelled) setLoading(false); }
    };
    doFetch();
    return () => { cancelled = true; };
  }, [customerId]);

  const openDropdown = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setDropdownPos({ top: r.bottom + 4, left: r.left, width: r.width });
    }
    setOpen(true);
  };

  const handleSelect = (pet) => { onSelect(pet); setOpen(false); setDropdownPos(null); };

  if (!customerId) return (
    <p className="text-xs text-gray-400 italic mt-1">Επίλεξε πρώτα πελάτη</p>
  );

  if (selectedPet) return (
    <div className="flex items-center gap-2 border border-violet-200 bg-violet-50 rounded-2xl px-3 py-2">
      <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
        <PawPrint className="w-3.5 h-3.5 text-violet-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-violet-700 truncate">{selectedPet.name}</p>
        {selectedPet.species && <p className="text-xs text-violet-400">{selectedPet.species}</p>}
      </div>
      <button type="button" onClick={() => onSelect(null)} className="text-violet-400 hover:text-red-400 transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={openDropdown}
        onBlur={() => setTimeout(() => { setOpen(false); setDropdownPos(null); }, 200)}
        disabled={loading || pets.length === 0}
        className="w-full flex items-center gap-2 border border-gray-200 rounded-2xl px-3 py-2 text-sm text-gray-400 hover:border-violet-300 hover:text-violet-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white"
      >
        <PawPrint className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1 text-left">
          {loading ? "Φόρτωση..." : pets.length === 0 ? "Δεν βρέθηκαν κατοικίδια" : "Επίλεξε κατοικίδιο..."}
        </span>
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>

      {open && dropdownPos && createPortal(
        <div style={{ position: "fixed", top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width, zIndex: 9999 }}
          className="bg-white border border-gray-100 rounded-2xl shadow-lg overflow-hidden">
          <ul className="max-h-44 overflow-y-auto divide-y divide-gray-50">
            {pets.map((pet) => (
              <li key={pet._id}>
                <button type="button"
                  onMouseDown={(e) => { e.preventDefault(); handleSelect(pet); }}
                  className="w-full text-left px-4 py-2.5 hover:bg-violet-50 transition-colors flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                    <PawPrint className="w-3.5 h-3.5 text-violet-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{pet.name}</p>
                    {pet.species && <p className="text-xs text-gray-400">{pet.species}</p>}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>,
        document.body
      )}
    </>
  );
};

/* ── Main Modal ── */
const PrescriptionFormModal = ({ isOpen, onClose, onSubmit, initialData, initialCustomer, initialPet }) => {
  const [selectedCustomer, setSelectedCustomer] = useState(initialCustomer || null);
  const [selectedPet, setSelectedPet] = useState(initialPet || null);
  const [form, setForm] = useState({ medicines: [], dosage: "", notes: "", doctor: "" });
  const [doctors, setDoctors] = useState([]);
  const [customDoctor, setCustomDoctor] = useState(false);

  // Φόρτωση γιατρών από settings
  useEffect(() => {
    let cancelled = false;
    request("/settings")
      .then((data) => {
        if (cancelled) return;
        const staff = Array.isArray(data?.staff) ? data.staff : [];
        const filtered = staff
          .filter((m) => m.role === "Κτηνίατρος" || m.role === "Βοηθός Κτηνιάτρου")
          .map((m) => m.name);
        setDoctors(filtered);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (initialCustomer) setSelectedCustomer(initialCustomer);
  }, [initialCustomer]);

  useEffect(() => {
    if (initialPet) setSelectedPet(initialPet);
  }, [initialPet]);

  useEffect(() => {
    if (initialData) {
      setForm({
        medicines: initialData.medicines || [],
        dosage: initialData.dosage || "",
        notes: initialData.notes || "",
        doctor: initialData.doctor || "",
      });
    }
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onSubmit({
      ...form,
      clientName: selectedCustomer?.name || "",
      animalName: selectedPet?.name || "",
      animalId: selectedPet?._id || null,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-[560px] shadow-2xl z-10 rounded-2xl overflow-visible">

        {/* Header */}
        <div className="bg-gradient-to-r from-violet-500 to-purple-400 px-5 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <FilePlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-base leading-tight">
                {initialData ? "Επεξεργασία Συνταγής" : "Νέα Συνταγή"}
              </p>
              <p className="text-white/70 text-xs mt-0.5">Συμπλήρωσε τα στοιχεία</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-gray-50 p-5 space-y-3 rounded-b-2xl max-h-[80vh] overflow-y-auto">

          {/* Πελάτης & Κατοικίδιο */}
          <div className="bg-white rounded-2xl border border-gray-200 px-4 py-3">
            <p className={LABEL + " mb-3"}>Πελάτης & Κατοικίδιο</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Ιδιοκτήτης</label>
                <CustomerSearch
                  value={selectedCustomer}
                  onSelect={(c) => { setSelectedCustomer(c); setSelectedPet(null); }}
                  onClear={() => { setSelectedCustomer(null); setSelectedPet(null); }}
                />
              </div>
              <div>
                <label className={LABEL}>Κατοικίδιο</label>
                <PetSelector
                  customerId={selectedCustomer?._id}
                  selectedPet={selectedPet}
                  onSelect={setSelectedPet}
                />
              </div>
            </div>
          </div>

          {/* Συνταγή */}
          <div className="bg-white rounded-2xl border border-gray-200 px-4 py-3">
            <p className={LABEL + " mb-3"}>Συνταγή</p>
            <div className="space-y-3">
              <div>
                <label className={LABEL}>Φάρμακα * <span className="normal-case font-normal text-gray-300">(χωρισμένα με κόμμα)</span></label>
                <div className="relative">
                  <Pill className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                  <input type="text" required
                    value={Array.isArray(form.medicines) ? form.medicines.join(", ") : form.medicines}
                    onChange={(e) => setForm((p) => ({ ...p, medicines: e.target.value.split(",").map((m) => m.trim()).filter(Boolean) }))}
                    placeholder="π.χ. Amoxicillin, Ibuprofen" className={INPUT} />
                </div>
              </div>
              <div>
                <label className={LABEL}>Δοσολογία</label>
                <div className="relative">
                  <FlaskConical className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                  <input type="text" value={form.dosage}
                    onChange={(e) => setForm((p) => ({ ...p, dosage: e.target.value }))}
                    placeholder="π.χ. 2×1 για 7 ημέρες" className={INPUT} />
                </div>
              </div>
              <div>
                <label className={LABEL}>Γιατρός *</label>
                <div className="space-y-2">
                  <div className="relative">
                    <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none z-10" />
                    <select
                      value={customDoctor ? "__custom__" : (form.doctor || "")}
                      required={!customDoctor}
                      onChange={(e) => {
                        if (e.target.value === "__custom__") {
                          setCustomDoctor(true);
                          setForm((p) => ({ ...p, doctor: "" }));
                        } else {
                          setCustomDoctor(false);
                          setForm((p) => ({ ...p, doctor: e.target.value }));
                        }
                      }}
                      className={INPUT + " appearance-none cursor-pointer"}
                    >
                      <option value="">— Επίλεξε γιατρό —</option>
                      {doctors.map((name) => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                      <option value="__custom__">✏️ Άλλος (χειροκίνητη εισαγωγή)</option>
                    </select>
                  </div>
                  {customDoctor && (
                    <div className="relative">
                      <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
                      <input
                        type="text"
                        value={form.doctor}
                        required
                        autoFocus
                        onChange={(e) => setForm((p) => ({ ...p, doctor: e.target.value }))}
                        placeholder="Όνομα γιατρού..."
                        className={INPUT}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className={LABEL}>Σημειώσεις</label>
                <div className="relative">
                  <StickyNote className="absolute left-3 top-3 w-4 h-4 text-gray-300" />
                  <textarea value={form.notes}
                    onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                    rows={2} placeholder="Επιπλέον οδηγίες..."
                    className="w-full border border-gray-200 rounded-2xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 placeholder-gray-400 resize-none" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-100 transition-colors">
              <X className="w-4 h-4" /> Ακύρωση
            </button>
            <button type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors">
              <Save className="w-4 h-4" /> Αποθήκευση
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PrescriptionFormModal;
