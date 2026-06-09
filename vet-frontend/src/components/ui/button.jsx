import React from "react";
import clsx from "clsx";

export function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  ...props
}) {
  const baseStyles =
    "inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 shadow-sm";

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
  };

  const variants = {
    primary:
      "bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 focus:ring-indigo-300 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-700 dark:hover:bg-indigo-900/60",
    secondary:
      "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 focus:ring-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700 dark:hover:bg-emerald-900/60",
    success:
      "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 focus:ring-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700 dark:hover:bg-emerald-900/60",
    danger:
      "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 focus:ring-red-300 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700 dark:hover:bg-red-900/60",
    warning:
      "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 focus:ring-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700 dark:hover:bg-amber-900/60",
    ghost:
      "bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent focus:ring-gray-300",
  };

  return (
    <button
      className={clsx(baseStyles, sizes[size], variants[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
