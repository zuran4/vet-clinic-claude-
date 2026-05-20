import React from "react";

// Μικρό utility για να ενώσουμε classNames με ασφάλεια.
function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export const Alert = ({ variant = "info", className = "", children }) => {
  const base = "flex items-center gap-2 px-4 py-2 rounded-lg border text-sm";

  const variants = {
    info:    "bg-blue-50 text-blue-800 border-blue-200",
    success: "bg-emerald-50 text-emerald-800 border-emerald-200",
    warning: "bg-amber-50 text-amber-800 border-amber-200",
    danger:  "bg-red-50 text-red-800 border-red-200",
  };

  return (
    <div className={cx(base, variants[variant] || variants.info, className)}>
      {children}
    </div>
  );
};
