import React from "react";

// Μικρό utility για να ενώσουμε classNames με ασφάλεια.
function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export const Alert = ({ variant = "info", className = "", children }) => {
  const base = "flex items-center gap-2 px-4 py-2 rounded-lg border text-sm";

  const variants = {
    info:    "bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700/50",
    success: "bg-emerald-50 text-emerald-800 border-emerald-200",
    warning: "bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-700/50",
    danger:  "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700/50",
  };

  return (
    <div className={cx(base, variants[variant] || variants.info, className)}>
      {children}
    </div>
  );
};
