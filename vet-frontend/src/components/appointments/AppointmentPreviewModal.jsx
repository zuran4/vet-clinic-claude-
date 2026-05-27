import React, { useState } from "react";
import {
  User, Phone, Calendar, Clock, Stethoscope, Scissors,
  StickyNote, PawPrint, ShoppingBag, Pill, X,
} from "lucide-react";
import { useCustomerPets } from "../../hooks/useCustomerPets";
import PetProfile from "../pets/PetProfile";
import InlinePurchases from "./InlinePurchases.jsx";
import InlinePrescriptions from "./InlinePrescriptions.jsx";

const TYPE_COLORS = {
  "Εξέταση":            "bg-indigo-100 text-indigo-700",
  "Εμβόλιο":            "bg-green-100 text-green-700",
  "Αποπαρασίτωση":      "bg-amber-100 text-amber-700",
  "Χειρουργείο":        "bg-red-100 text-red-700",
  "Στείρωση":           "bg-purple-100 text-purple-700",
  "Μπάνιο":             "bg-sky-100 text-sky-700",
  "Κούρεμα":            "bg-cyan-100 text-cyan-700",
  "Καλλωπισμός":        "bg-teal-100 text-teal-700",
  "Περιποίηση νυχιών":  "bg-pink-100 text-pink-700",
};

const InfoRow = ({ icon: Icon, label, value, iconColor = "text-gray-400" }) => (
  <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
    <Icon className={`w-4 h-4 flex-shrink-0 ${iconColor}`} />
    <span className="text-xs text-gray-400 w-20 flex-shrink-0">{label}</span>
    <span className="text-sm font-medium text-gray-800">{value || "—"}</span>
  </div>
);

const TABS = [
  { key: "overview",       label: "Επισκόπηση", icon: Calendar },
  { key: "purchases",      label: "Αγορές",     icon: ShoppingBag },
  { key: "prescriptions",  label: "Συνταγές",   icon: Pill },
  { key: "pet",            label: "Κατοικίδιο", icon: PawPrint },
];

const AppointmentPreviewModal = ({ isOpen, onClose, appointment }) => {
  const [activeTab, setActiveTab] = useState("overview");

  const ownerId = typeof appointment?.owner === "object"
    ? appointment?.owner._id
    : appointment?.owner || null;

  const { pets } = useCustomerPets(ownerId);
  const matchedPet = pets.find(
    (p) => p.name?.toLowerCase() === appointment?.animalName?.toLowerCase()
  ) || pets[0] || null;

  if (!isOpen || !appointment) return null;

  const isGrooming = appointment.doctor === "Grooming";
  const headerBg = isGrooming
    ? "bg-gradient-to-r from-blue-500 to-cyan-400"
    : "bg-gradient-to-r from-green-500 to-emerald-400";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl z-10 flex flex-col max-h-[90vh]">

        {/* Gradient Header — σταθερό */}
        <div className={`${headerBg} px-5 pt-5 pb-0 flex-shrink-0`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-white">
              {isGrooming ? <Scissors className="w-5 h-5" /> : <Stethoscope className="w-5 h-5" />}
              <span className="font-semibold text-sm">{appointment.doctor}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/20 text-white ml-1">
                {appointment.type}
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="text-white mb-4">
            <div className="text-2xl font-bold">{appointment.time}</div>
            <div className="text-sm text-white/80 mt-0.5">
              {appointment.date} &middot; {appointment.duration} λεπτά
            </div>
          </div>

          {/* Tabs μέσα στο header */}
          <div className="flex gap-1">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-xl transition-all ${
                  activeTab === key
                    ? "bg-white text-gray-700 shadow-sm"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content — scrollable */}
        <div className="bg-gray-50 overflow-y-auto flex-1">

          {/* ΕΠΙΣΚΟΠΗΣΗ */}
          {activeTab === "overview" && (
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white rounded-2xl border border-gray-100 px-4 py-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-2 pb-1">Πελάτης</p>
                  <InfoRow icon={User}  label="Όνομα"    value={appointment.clientName} iconColor="text-indigo-400" />
                  <InfoRow icon={Phone} label="Τηλέφωνο" value={appointment.phone}      iconColor="text-indigo-400" />
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 px-4 py-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-2 pb-1">Ραντεβού</p>
                  <InfoRow icon={Calendar} label="Ημερομηνία" value={appointment.date}                 iconColor="text-emerald-400" />
                  <InfoRow icon={Clock}    label="Ώρα"         value={appointment.time}                 iconColor="text-emerald-400" />
                  <InfoRow icon={Clock}    label="Διάρκεια"    value={`${appointment.duration} λεπτά`} iconColor="text-emerald-400" />
                </div>
              </div>

              {appointment.notes && (
                <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 flex gap-3">
                  <StickyNote className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800">{appointment.notes}</p>
                </div>
              )}

              {pets.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 px-4 py-3">
                  <div className="flex items-center gap-2 mb-2">
                    <PawPrint className="w-4 h-4 text-gray-400" />
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Κατοικίδια πελάτη</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {pets.map((pet) => (
                      <span key={pet._id}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-50 border border-gray-200 text-sm text-gray-700"
                      >
                        <span className="font-medium">{pet.name}</span>
                        <span className="text-gray-400 text-xs">{pet.species}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ΑΓΟΡΕΣ */}
          {activeTab === "purchases" && (
            <div className="p-4">
              {ownerId ? (
                <InlinePurchases customerId={ownerId} />
              ) : (
                <Empty text="Δεν υπάρχει πελάτης για εμφάνιση αγορών." />
              )}
            </div>
          )}

          {/* ΣΥΝΤΑΓΕΣ */}
          {activeTab === "prescriptions" && (
            <div className="p-4">
              <InlinePrescriptions
                petId={matchedPet?._id}
                pet={matchedPet}
                customer={ownerId ? { _id: ownerId, name: appointment.clientName, phone: appointment.phone } : null}
              />
            </div>
          )}

          {/* ΚΑΤΟΙΚΙΔΙΟ */}
          {activeTab === "pet" && (
            <div>
              {matchedPet ? (
                <PetProfile petId={matchedPet._id} />
              ) : (
                <div className="p-4">
                  <Empty text="Δεν βρέθηκε κατοικίδιο." />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PurchasesInline_UNUSED = ({ customerId }) => {
  const [purchases, setPurchases] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [cart, setCart] = React.useState([]);
  const [productQuery, setProductQuery] = React.useState("");
  const [productResults, setProductResults] = React.useState([]);
  const [loadingProducts, setLoadingProducts] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const searchRef = React.useRef(null);

  const showDropdown = productQuery.trim().length > 0;

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const data = await request(`/customers/${customerId}/purchases`);
      setPurchases(data.purchases || []);
    } catch { }
    finally { setLoading(false); }
  };

  React.useEffect(() => { fetchPurchases(); }, [customerId]);

  React.useEffect(() => {
    if (productQuery.trim().length === 0) { setProductResults([]); return; }
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        setLoadingProducts(true);
        const data = await request(`/products?search=${encodeURIComponent(productQuery.trim())}`);
        if (!cancelled) setProductResults(Array.isArray(data) ? data : (data.data ?? []));
      } catch { if (!cancelled) setProductResults([]); }
      finally { if (!cancelled) setLoadingProducts(false); }
    }, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [productQuery]);

  React.useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setProductQuery("");
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const addToCart = (prod) => {
    setCart((prev) => {
      const exists = prev.find((p) => p.id === prod._id);
      if (exists) return prev.map((p) => p.id === prod._id ? { ...p, quantity: p.quantity + 1 } : p);
      return [...prev, { id: prod._id, name: prod.name, quantity: 1 }];
    });
    setProductQuery(""); setProductResults([]);
  };

  const handleSave = async () => {
    if (cart.length === 0) return;
    try {
      setSaving(true);
      await request(`/customers/${customerId}/purchases`, {
        method: "POST",
        body: { products: cart.map((p) => ({ product: p.id, quantity: p.quantity })) },
      });
      setCart([]);
      await fetchPurchases();
    } catch (err) {
      alert("❌ " + (err.message || "Αποτυχία αποθήκευσης"));
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-3">

      {/* Φόρμα νέας αγοράς */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100 px-4 py-2.5 flex items-center gap-2">
          <PackageSearch className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-semibold text-emerald-700">Νέα Αγορά</span>
        </div>
        <div className="p-3 space-y-2">
          {/* Product search */}
          <div className="relative" ref={searchRef}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            <input
              type="text"
              value={productQuery}
              onChange={(e) => setProductQuery(e.target.value)}
              placeholder="Αναζήτηση προϊόντος..."
              className="w-full border border-gray-200 rounded-2xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white border border-gray-100 rounded-2xl shadow-lg overflow-hidden">
                {loadingProducts ? (
                  <div className="p-3 text-xs text-gray-400 text-center">Αναζήτηση...</div>
                ) : productResults.length > 0 ? (
                  <ul className="max-h-40 overflow-y-auto divide-y divide-gray-50">
                    {productResults.map((prod) => (
                      <li key={prod._id}>
                        <button type="button" onClick={() => addToCart(prod)}
                          className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 transition-colors flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-800">{prod.name}</span>
                          <span className="text-xs text-gray-400">απόθ.: {prod.quantity ?? 0}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-3 text-xs text-gray-400 text-center">Δεν βρέθηκαν προϊόντα.</div>
                )}
              </div>
            )}
          </div>

          {/* Cart */}
          {cart.length > 0 && (
            <>
              <div className="rounded-2xl border border-emerald-100 overflow-hidden">
                <ul className="divide-y divide-emerald-50">
                  {cart.map((p) => (
                    <li key={p.id} className="flex items-center justify-between px-3 py-2 bg-white">
                      <span className="text-sm font-medium text-gray-800 flex-1 truncate pr-2">{p.name}</span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => setCart((prev) => prev.map((x) => x.id === p.id && x.quantity > 1 ? { ...x, quantity: x.quantity - 1 } : x))}
                          className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                          <Minus className="w-3 h-3 text-gray-600" />
                        </button>
                        <span className="w-7 text-center text-sm font-semibold">{p.quantity}</span>
                        <button onClick={() => setCart((prev) => prev.map((x) => x.id === p.id ? { ...x, quantity: x.quantity + 1 } : x))}
                          className="w-6 h-6 rounded-lg bg-emerald-100 hover:bg-emerald-200 flex items-center justify-center">
                          <Plus className="w-3 h-3 text-emerald-700" />
                        </button>
                        <button onClick={() => setCart((prev) => prev.filter((x) => x.id !== p.id))}
                          className="w-6 h-6 rounded-lg hover:bg-red-50 flex items-center justify-center ml-1">
                          <Trash2 className="w-3 h-3 text-red-400" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex justify-end">
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors disabled:opacity-60">
                  <Check className="w-4 h-4" />
                  {saving ? "Αποθήκευση..." : "Καταχώρηση Αγοράς"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Ιστορικό */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-100 px-4 py-2.5 flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-600">Ιστορικό Αγορών</span>
        </div>
        {loading ? (
          <div className="py-6 text-center text-sm text-gray-400">Φόρτωση...</div>
        ) : purchases.length === 0 ? (
          <div className="py-6 text-center text-sm text-gray-400">Δεν υπάρχουν αγορές ακόμα.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {purchases.map((p) => (
              <div key={p._id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <ShoppingBag className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{p.product?.name || "Άγνωστο προϊόν"}</p>
                    <p className="text-xs text-gray-400">{p.date ? new Date(p.date).toLocaleDateString("el-GR") : "—"}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-500">×{p.quantity}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const Empty = ({ text }) => (
  <div className="py-10 text-center">
    <p className="text-sm text-gray-400">{text}</p>
  </div>
);

export default AppointmentPreviewModal;
