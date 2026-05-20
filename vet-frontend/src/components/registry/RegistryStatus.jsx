import React, { useEffect, useState } from "react";
import request from "@/api/apiClient.js";

const STATUS_CONFIG = {
  LOGGED_IN: {
    dot: "bg-green-400",
    pulse: true,
    label: "Registry",
    sub: "Συνδεδεμένο",
    color: "text-green-700",
    bg: "bg-green-50 border-green-200 hover:bg-green-100",
  },
  NEEDS_LOGIN: {
    dot: "bg-amber-400",
    pulse: false,
    label: "Registry",
    sub: "Απαιτεί σύνδεση",
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200 hover:bg-amber-100",
  },
  SESSION_EXPIRED: {
    dot: "bg-amber-400",
    pulse: false,
    label: "Registry",
    sub: "Η συνεδρία έληξε",
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200 hover:bg-amber-100",
  },
  OFFLINE: {
    dot: "bg-gray-300",
    pulse: false,
    label: "Registry",
    sub: "Offline",
    color: "text-gray-500",
    bg: "bg-gray-50 border-gray-200 hover:bg-gray-100",
  },
  STOPPED: {
    dot: "bg-gray-300",
    pulse: false,
    label: "Registry",
    sub: "Σταματημένο",
    color: "text-gray-500",
    bg: "bg-gray-50 border-gray-200 hover:bg-gray-100",
  },
};

function getConfig(status) {
  return STATUS_CONFIG[status] || {
    dot: "bg-gray-300",
    pulse: false,
    label: "Registry",
    sub: "Άγνωστο",
    color: "text-gray-400",
    bg: "bg-gray-50 border-gray-200 hover:bg-gray-100",
  };
}

export default function RegistryStatus({ onStatusChange = () => {} }) {
  const [status, setStatus] = useState(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function fetchStatus() {
      try {
        const data = await request("/registry/session");
        if (!mounted) return;
        const s = data.status || "UNKNOWN";
        setStatus(s);
        onStatusChange(s);
      } catch {
        if (mounted) setStatus("OFFLINE");
      }
    }

    fetchStatus();
    const id = setInterval(fetchStatus, 5000);
    return () => { mounted = false; clearInterval(id); };
  }, [onStatusChange]);

  const handleClick = async () => {
    if (starting) return;
    try {
      setStarting(true);
      await request("/registry/worker/start", { method: "POST" });
      const data = await request("/registry/session");
      const s = data.status || "UNKNOWN";
      setStatus(s);
      onStatusChange(s);
    } catch {
      // silent
    } finally {
      setStarting(false);
    }
  };

  const cfg = getConfig(starting ? "LOADING" : status);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={starting || status === "LOGGED_IN"}
      title={status === "LOGGED_IN" ? "Το μητρώο είναι συνδεδεμένο" : "Κλικ για εκκίνηση worker"}
      className={[
        "inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all",
        "disabled:cursor-default",
        starting
          ? "bg-indigo-50 border-indigo-200 text-indigo-600"
          : cfg.bg,
      ].join(" ")}
    >
      {/* Animated dot */}
      <span className="relative flex h-2 w-2 flex-shrink-0">
        {cfg.pulse && !starting && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${cfg.dot} opacity-60`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${starting ? "bg-indigo-400" : cfg.dot}`} />
      </span>

      {/* Text */}
      <span className="flex flex-col items-start leading-none gap-0.5">
        <span className={`font-semibold tracking-wide ${starting ? "text-indigo-600" : cfg.color}`}>
          {starting ? "Εκκίνηση..." : cfg.label}
        </span>
        <span className={`text-[10px] font-normal opacity-70 ${starting ? "text-indigo-500" : cfg.color}`}>
          {starting ? "παρακαλώ περιμένετε" : cfg.sub}
        </span>
      </span>
    </button>
  );
}
