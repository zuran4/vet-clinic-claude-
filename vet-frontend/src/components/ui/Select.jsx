import React from "react";

export function Select({ className = "", children, ...props }) {
  return (
    <select
      className={`border rounded-2xl px-3 py-2 w-full shadow focus:ring-2 focus:ring-blue-500 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export default Select;
