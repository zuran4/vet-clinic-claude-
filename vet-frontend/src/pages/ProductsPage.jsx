import React, { useState } from "react";
import { Package, Truck, ShoppingCart, Plus, ArrowLeft } from "lucide-react";
import ProductList from "../components/products/ProductList";
import SupplierList from "../components/suppliers/SupplierList";
import WishlistPanel from "../components/dashboard/WishlistPanel";
import { Button } from "../components/ui/button";

const TABS = [
  { key: "products",   label: "Προϊόντα",      icon: Package },
  { key: "suppliers",  label: "Προμηθευτές",   icon: Truck },
  { key: "wishlist",   label: "Λίστα Αγορών",  icon: ShoppingCart },
];

function ProductsPage({ onClose }) {
  const [activeTab, setActiveTab] = useState("products");
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);

  return (
    <div>
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-orange-400 to-amber-300 rounded-2xl px-5 pt-4 pb-0 mb-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5 text-white">
            <Package className="w-5 h-5" />
            <span className="text-lg font-bold">Αποθήκη</span>
          </div>
          <div className="flex items-center gap-2">
            {activeTab === "products" && (
              <Button
                variant="ghost"
                onClick={() => document.dispatchEvent(new CustomEvent("openProductModal"))}
                className="bg-white/20 hover:bg-white/30 text-white border-0 gap-1.5 text-sm"
              >
                <Plus className="w-4 h-4" /> Νέο Προϊόν
              </Button>
            )}
            {activeTab === "suppliers" && (
              <Button
                variant="ghost"
                onClick={() => { setEditingSupplier(null); setShowSupplierForm(true); }}
                className="bg-white/20 hover:bg-white/30 text-white border-0 gap-1.5 text-sm"
              >
                <Plus className="w-4 h-4" /> Νέος Προμηθευτής
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={onClose}
              className="bg-white/10 hover:bg-white/20 text-white border-0 gap-1.5 text-sm"
            >
              <ArrowLeft className="w-4 h-4" /> Επιστροφή
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-xl transition-all ${
                activeTab === key
                  ? "bg-white text-orange-600 shadow-sm"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {activeTab === "products" && <ProductList />}
      {activeTab === "suppliers" && (
        <SupplierList
          showForm={showSupplierForm}
          setShowForm={setShowSupplierForm}
          editingSupplier={editingSupplier}
          setEditingSupplier={setEditingSupplier}
        />
      )}
      {activeTab === "wishlist" && <WishlistPanel />}
    </div>
  );
}

export default ProductsPage;
