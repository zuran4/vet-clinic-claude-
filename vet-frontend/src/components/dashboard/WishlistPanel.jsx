import React from "react";
import { ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "../ui/button.jsx";

const WishlistPanel = ({ wishlist = [], onRemove }) => {
  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2 mb-4">
        <ShoppingCart className="w-5 h-5 text-purple-500" />
        Λίστα Αγορών
      </h3>

      {wishlist.length === 0 ? (
        <p className="text-gray-500 text-sm">Δεν υπάρχουν προϊόντα στη λίστα.</p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {wishlist.map((item, index) => (
            <li
              key={index}
              className="flex justify-between items-center py-2 text-sm"
            >
              <span className="text-gray-700">{item.name || "Άγνωστο προϊόν"}</span>
              {onRemove && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => onRemove(item)}
                  className="flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Αφαίρεση
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default WishlistPanel;
