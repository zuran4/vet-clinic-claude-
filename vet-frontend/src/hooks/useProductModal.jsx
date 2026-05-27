import { useState, useEffect, useRef } from "react";
import { readResponse } from "../utils/apiHelpers.js";
import { cleanBatches } from "../utils/productHelpers.js";
import { API_URL } from "../api/api.js"; // ✅ κεντρικό base URL

// ---- helpers ----
function toId(x) {
  return x?._id ?? null;
}
function isoOrNull(v) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
function same(a, b) {
  // σύγκριση στα βασικά πεδία παρτίδας
  return (
    (a.batchNumber ?? "") === (b.batchNumber ?? "") &&
    Number(a.quantity || 0) === Number(b.quantity || 0) &&
    isoOrNull(a.purchaseDate) === isoOrNull(b.purchaseDate) &&
    isoOrNull(a.expirationDate) === isoOrNull(b.expirationDate) &&
    (a.invoiceNumber ?? "") === (b.invoiceNumber ?? "")
  );
}
function diffBatches(initial = [], current = []) {
  const initialById = new Map(initial.map((b) => [toId(b), b]));
  const currentById = new Map(current.map((b) => [toId(b), b]));

  const adds = [];
  const updates = [];
  const removes = [];

  // additions + updates
  for (const cur of current) {
    const id = toId(cur);
    if (!id) {
      // νέα παρτίδα χωρίς _id => add
      adds.push(cur);
      continue;
    }
    const old = initialById.get(id);
    if (old && !same(old, cur)) {
      // έχει αλλάξει κάτι => update
      const patch = {};
      if ((old.batchNumber ?? "") !== (cur.batchNumber ?? ""))
        patch.batchNumber = cur.batchNumber ?? "";
      if (Number(old.quantity || 0) !== Number(cur.quantity || 0))
        patch.quantity = Number(cur.quantity || 0);
      if (isoOrNull(old.purchaseDate) !== isoOrNull(cur.purchaseDate))
        patch.purchaseDate = isoOrNull(cur.purchaseDate);
      if (isoOrNull(old.expirationDate) !== isoOrNull(cur.expirationDate))
        patch.expirationDate = isoOrNull(cur.expirationDate);
      if ((old.invoiceNumber ?? "") !== (cur.invoiceNumber ?? ""))
        patch.invoiceNumber = cur.invoiceNumber ?? "";
      updates.push({ batchId: id, patch });
    }
  }

  // removals
  for (const old of initial) {
    const id = toId(old);
    if (!id) continue;
    if (!currentById.has(id)) {
      removes.push({ batchId: id });
    }
  }

  return { adds, updates, removes };
}

export function useProductModal(productId) {
  const [productInfo, setProductInfo] = useState(null);
  const [batches, setBatches] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingBatches, setSavingBatches] = useState(false);
  const [error, setError] = useState("");

  // κρατάμε snapshot των αρχικών παρτίδων για diff
  const initialBatchesRef = useRef([]);

  const isBatched =
    productInfo?.category === "Τροφή" || productInfo?.category === "Φάρμακο";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError("");

        if (!productId) {
          setProductInfo({
            name: "",
            category: "Άλλο",
            barcode: "",
            unit: "",
            threshold: 5,
            supplier: "",
            expirationDate: "",
            expirationWarningDays: 30,
            notes: "",
            retailPrice: null,
          });
          setBatches([]);
          initialBatchesRef.current = [];
        } else {
          // προϊόν
          const productRes = await fetch(`${API_URL}/products/${productId}`);
          const pr = await readResponse(productRes);
          if (!productRes.ok)
            throw new Error(pr.text || "Σφάλμα φόρτωσης προϊόντος");
          setProductInfo(pr.data);

          // παρτίδες (array)
          const stockRes = await fetch(
            `${API_URL}/products/${productId}/batches`
          );
          const sr = await readResponse(stockRes);
          const arr = sr.ok && Array.isArray(sr.data) ? sr.data : [];
          setBatches(arr);
          // snapshot για diff
          initialBatchesRef.current = JSON.parse(JSON.stringify(arr));
        }

        // suppliers
        const suppliersRes = await fetch(`${API_URL}/suppliers`);
        const sr2 = await readResponse(suppliersRes);
        if (sr2.ok) setSuppliers(sr2.data || []);
      } catch (err) {
        console.error("❌ Σφάλμα useProductModal:", err);
        setError(err.message || "Αποτυχία φόρτωσης δεδομένων προϊόντος.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [productId]);

  const saveProductInfo = async (productInfo, onSave) => {
    if (!productInfo.name || !productInfo.category || !productInfo.unit) {
      setError("Συμπλήρωσε όλα τα υποχρεωτικά πεδία.");
      return;
    }

    try {
      setError("");

      const method = productId ? "PUT" : "POST";
      const url = productId
        ? `${API_URL}/products/${productId}`
        : `${API_URL}/products`;

      const payload = { ...productInfo };
      delete payload.batches;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const out = await readResponse(res);
      if (!out.ok)
        throw new Error(out.text || "Σφάλμα αποθήκευσης προϊόντος.");

      onSave?.(out.data);
    } catch (err) {
      console.error("❌ Σφάλμα saveProductInfo:", err);
      setError(err.message || "Σφάλμα αποθήκευσης προϊόντος.");
    }
  };

  /**
   * Αποθήκευση παρτίδων:
   * - υπολογίζει diff σε σχέση με τις αρχικές παρτίδες
   * - στέλνει διαδοχικά action-based requests (add/update/remove)
   * - ενημερώνει batches + productInfo.quantity από τις απαντήσεις
   */
  const saveBatches = async (currentBatches, productId, onSave) => {
    if (!productId) {
      setError("Πρέπει πρώτα να αποθηκεύσεις το προϊόν.");
      return;
    }

    setSavingBatches(true);
    try {
      setError("");

      const cleaned = cleanBatches(currentBatches);
      const initial = initialBatchesRef.current || [];

      const { adds, updates, removes } = diffBatches(initial, cleaned);

      let last = null;

      // 1) ADDs
      for (const b of adds) {
        const payload = {
          action: "add",
          batch: {
            batchNumber: b.batchNumber ?? "",
            quantity: Number(b.quantity || 0),
            purchaseDate: isoOrNull(b.purchaseDate),
            expirationDate: isoOrNull(b.expirationDate),
            invoiceNumber: b.invoiceNumber ?? "",
          },
        };
        const res = await fetch(
          `${API_URL}/products/${productId}/batches`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
        const out = await readResponse(res);
        if (!out.ok)
          throw new Error(out.text || "Σφάλμα προσθήκης παρτίδας.");
        last = out.data;
      }

      // 2) UPDATEs
      for (const u of updates) {
        const payload = {
          action: "update",
          batchId: u.batchId,
          patch: u.patch,
        };
        const res = await fetch(
          `${API_URL}/products/${productId}/batches`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
        const out = await readResponse(res);
        if (!out.ok)
          throw new Error(out.text || "Σφάλμα ενημέρωσης παρτίδας.");
        last = out.data;
      }

      // 3) REMOVEs
      for (const r of removes) {
        const payload = {
          action: "remove",
          batchId: r.batchId,
        };
        const res = await fetch(
          `${API_URL}/products/${productId}/batches`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
        const out = await readResponse(res);
        if (!out.ok)
          throw new Error(out.text || "Σφάλμα διαγραφής παρτίδας.");
        last = out.data;
      }

      // Αν δεν υπήρχαν αλλαγές
      if (!last) {
        onSave?.({
          productId,
          quantity: productInfo?.quantity ?? 0,
          batches: cleaned,
        });
        // ευθυγράμμιση snapshot
        initialBatchesRef.current = JSON.parse(JSON.stringify(cleaned));
        setBatches(cleaned);
        return;
      }

      // Ενημέρωση από το τελευταίο response: { productId, quantity, batches }
      setBatches(last.batches ?? []);
      setProductInfo((prev) =>
        prev ? { ...prev, quantity: last.quantity } : prev
      );
      // ανανέωση snapshot
      initialBatchesRef.current = JSON.parse(
        JSON.stringify(last.batches ?? [])
      );
      onSave?.(last);
    } catch (err) {
      console.error("❌ Σφάλμα saveBatches:", err);
      setError(err.message || "Σφάλμα αποθήκευσης παρτίδων.");
    } finally {
      setSavingBatches(false);
    }
  };

  return {
    productInfo,
    setProductInfo,
    batches,
    setBatches,
    suppliers,
    loading,
    savingBatches,
    error,
    saveProductInfo,
    saveBatches,
    isBatched,
  };
}
