import React from "react";
import { Button } from "./button";

export const TabButton = ({ active, onClick, children }) => (
  <Button
    type="button"
    variant={active ? "primary" : "ghost"}
    onClick={onClick}
    className="flex items-center gap-2 rounded-2xl shadow focus:ring-2 focus:ring-primary"
  >
    {children}
  </Button>
);
