import React from "react";

export function Select({ className = "", children, ...props }) {
  return (
    <select
      className={`border border-gray-300 dark:border-gray-600 rounded-2xl px-3 py-2 w-full shadow bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-indigo-500 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export default Select;
