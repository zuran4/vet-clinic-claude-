import React, { useEffect, useState } from "react";
import {
  Bell,
  Beaker,
  Hourglass,
  Syringe,
  CheckCircle,
  XCircle,
} from "lucide-react";

const AlertsPanel = ({ products = [], pets = [], onEditProduct }) => {
  const [runtimeAlerts, setRuntimeAlerts] = useState([]);

  // 📡 Listener για custom events (π.χ. από ProductExportPanel)
  useEffect(() => {
    const handler = (e) => {
      setRuntimeAlerts((prev) => [...prev, e.detail]);
      setTimeout(() => {
        setRuntimeAlerts((prev) =>
          prev.filter((a) => a.id !== e.detail.id)
        );
      }, 4000); // 4s auto-hide
    };
    window.addEventListener("alert", handler);
    return () => window.removeEventListener("alert", handler);
  }, []);

  // 🔴 Χαμηλό Απόθεμα
  const lowStock = [];
  products.forEach((p) => {
    if (p.batches && p.batches.length > 0) {
      // Έλεγχος αποθέματος ανά batch
      p.batches.forEach((b) => {
        if (b.quantity < p.threshold) {
          lowStock.push({
            _id: `${p._id}-${b._id}`,
            name: p.name,
            unit: p.unit,
            quantity: b.quantity,
            batchNumber: b.batchNumber,
            product: p,
          });
        }
      });
    } else {
      // Προϊόν χωρίς batches → έλεγχος στο quantity
      if (p.quantity < p.threshold) {
        lowStock.push({
          _id: p._id,
          name: p.name,
          unit: p.unit,
          quantity: p.quantity,
          product: p,
        });
      }
    }
  });

  // ⏳ Λήξεις / Επικείμενες λήξεις για όλα τα batches
  const expiringOrExpired = [];
  products.forEach((p) => {
    p.batches?.forEach((b) => {
      if (!b.expirationDate) return;
      const expDate = new Date(b.expirationDate);
      const now = new Date();
      const diff = (expDate - now) / (1000 * 60 * 60 * 24);
      if (diff <= 30) {
        expiringOrExpired.push({
          productId: p._id,
          name: p.name,
          unit: p.unit,
          batchNumber: b.batchNumber,
          batchQuantity: b.quantity,
          expirationDate: b.expirationDate,
          diff: Math.round(diff),
        });
      }
    });
  });

  // 💉 Εκπρόθεσμα εμβόλια
  const overdueVaccines = pets.filter((p) => {
    const last = new Date(p.lastVaccine || "2000-01-01");
    const diff = (new Date() - last) / (1000 * 60 * 60 * 24);
    return diff > 365;
  });

  const hasAlerts =
    lowStock.length > 0 ||
    expiringOrExpired.length > 0 ||
    overdueVaccines.length > 0 ||
    runtimeAlerts.length > 0;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-xl mt-6 space-y-4 max-w-4xl mx-auto">
      <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
        <Bell className="w-5 h-5 text-primary" />
        Ειδοποιήσεις
      </h3>

      {!hasAlerts && (
        <p className="text-gray-500 text-sm mt-2">Δεν υπάρχουν ειδοποιήσεις</p>
      )}

      {/* 🔔 Runtime alerts */}
      {runtimeAlerts.map((alert) => (
        <div
          key={alert.id}
          className={`flex items-center gap-2 p-3 rounded-2xl border shadow-sm ${
            alert.type === "error"
              ? "bg-danger/10 border-danger/30 text-danger"
              : "bg-emerald-50 border-emerald-200 text-emerald-700"
          }`}
        >
          {alert.type === "error" ? (
            <XCircle className="w-5 h-5 text-danger" />
          ) : (
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          )}
          <span>{alert.message}</span>
        </div>
      ))}

      {/* 🧪 Χαμηλό Απόθεμα */}
      {lowStock.length > 0 && (
        <div className="bg-danger/10 border border-danger/30 p-4 rounded-2xl">
          <p className="text-danger font-semibold mb-2 flex items-center gap-2">
            <Beaker className="w-5 h-5" />
            Χαμηλό Απόθεμα
          </p>
          <ul className="list-disc pl-6 text-sm text-danger">
            {lowStock.map((p) => (
              <li
                key={p._id}
                className="cursor-pointer hover:underline"
                onClick={() => onEditProduct?.(p.product)}
              >
                {p.name}
                {p.batchNumber
                  ? ` (Παρτίδα ${p.batchNumber}, ${p.quantity} ${p.unit})`
                  : ` (${p.quantity} ${p.unit})`}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ⏳ Λήξεις / Επικείμενες Λήξεις */}
      {expiringOrExpired.length > 0 && (
        <div className="bg-warning/10 border border-warning/30 p-4 rounded-2xl">
          <p className="text-amber-700 font-semibold mb-2 flex items-center gap-2">
            <Hourglass className="w-5 h-5" />
            Λήξεις / Επικείμενες Λήξεις
          </p>
          <ul className="list-disc pl-6 text-sm">
            {expiringOrExpired.map((item, idx) => {
              const expDate = new Date(item.expirationDate);
              return (
                <li
                  key={`${item.productId}-${idx}`}
                  className={`cursor-pointer hover:underline ${
                    item.diff < 0 ? "text-red-600" : "text-amber-800"
                  }`}
                  onClick={() => onEditProduct?.(item)}
                >
                  {item.name} (Παρτίδα {item.batchNumber},{" "}
                  {item.batchQuantity} {item.unit}) –{" "}
                  {item.diff < 0
                    ? `Έληξε στις ${expDate.toLocaleDateString("el-GR")}`
                    : `Λήγει σε ${item.diff} μέρες (${expDate.toLocaleDateString(
                        "el-GR"
                      )})`}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* 💉 Εκπρόθεσμα Εμβόλια */}
      {overdueVaccines.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl">
          <p className="text-blue-800 font-semibold mb-2 flex items-center gap-2">
            <Syringe className="w-5 h-5" />
            Εκπρόθεσμα Εμβόλια
          </p>
          <ul className="list-disc pl-6 text-sm text-blue-900">
            {overdueVaccines.map((p) => (
              <li key={p._id}>
                {p.name} – Τελευταίο:{" "}
                {p.lastVaccine
                  ? new Date(p.lastVaccine).toLocaleDateString("el-GR")
                  : "Άγνωστο"}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AlertsPanel;
