// src/hooks/useRealtimeSync.jsx
import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { API_URL } from "../api/api.js";

// Το socket.io συνδέεται στη ρίζα του server, όχι στο /api
const SOCKET_URL = API_URL.replace(/\/api\/?$/, "");

let socket;
function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, { transports: ["websocket", "polling"] });
  }
  return socket;
}

// 🔹 Καλεί το αντίστοιχο handler όταν ο server ειδοποιήσει για αλλαγή δεδομένων
// (π.χ. handlers = { appointments: fetchAppointments, products: fetchProducts })
export function useRealtimeSync(handlers) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const s = getSocket();
    const onChange = ({ type } = {}) => handlersRef.current[type]?.();

    s.on("data:changed", onChange);
    return () => s.off("data:changed", onChange);
  }, []);
}
