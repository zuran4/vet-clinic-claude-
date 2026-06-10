import React, { useEffect, useState } from "react";
import { Truck } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./Select";

const SupplierSelect = ({ value, onChange }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const res = await fetch("/api/suppliers");
        const data = await res.json();
        setSuppliers(data);
      } catch (err) {
        console.error("❌ Σφάλμα φόρτωσης suppliers:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSuppliers();
  }, []);

  if (loading) {
    return (
      <div className="border dark:border-win-border-light rounded px-3 py-2 text-gray-500 dark:text-gray-400 text-sm dark:bg-win-elevated">
        Φόρτωση...
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="border dark:border-win-border-light rounded px-3 py-2 text-sm flex items-center gap-2 dark:bg-win-elevated dark:text-gray-100">
        <Truck className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        <SelectValue placeholder="Επιλέξτε Προμηθευτή" />
      </SelectTrigger>
      <SelectContent>
        {suppliers.map((s) => (
          <SelectItem key={s._id} value={s._id}>
            {s.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default SupplierSelect;
