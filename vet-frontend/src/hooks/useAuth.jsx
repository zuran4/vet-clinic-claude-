import { useState, useCallback, useEffect } from "react";
import { attemptRefresh } from "../api/apiClient.js";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:5000/api`;

export function useAuth() {
  const [user, setUser]               = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Σημείωση: το "clinicId" ΔΕΝ διαγράφεται εδώ σκόπιμα — είναι πλέον ρύθμιση
  // συσκευής (ποια κλινική "ανήκει" σε αυτό το kiosk), όχι μέρος του session.
  // Καθαρίζεται μόνο ρητά όταν ο χρήστης επιλέξει "Άλλαξε κλινική".
  const clearAuth = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("permissions");
    setUser(null);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setAuthLoading(false);
      return;
    }

    async function restoreSession() {
      let activeToken = token;
      let res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${activeToken}` },
      });

      // Το access token (15 λεπτά) μπορεί να έχει λήξει — δοκιμάζουμε αυτόματο
      // refresh με το refresh token (7 μέρες) πριν αποσυνδέσουμε τον χρήστη.
      if (res.status === 401) {
        activeToken = await attemptRefresh();
        res = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${activeToken}` },
        });
      }

      if (!res.ok) throw new Error("invalid token");
      const data = await res.json();
      const permissions = JSON.parse(localStorage.getItem("permissions") || "[]");
      const clinicId     = localStorage.getItem("clinicId") || data.clinicId || "";
      setUser({ name: data.name, token: activeToken, role: data.role, permissions, clinicId });
    }

    restoreSession()
      .catch(() => clearAuth())
      .finally(() => setAuthLoading(false));
  }, [clearAuth]);

  useEffect(() => {
    const handler = () => clearAuth();
    window.addEventListener("auth:logout", handler);
    return () => window.removeEventListener("auth:logout", handler);
  }, [clearAuth]);

  const login = useCallback((loggedInUser) => {
    const permissions = loggedInUser.permissions || [];
    const clinicId    = loggedInUser.clinicId    || "";

    setUser({
      name:       loggedInUser.name,
      token:      loggedInUser.token,
      role:       loggedInUser.role,
      clinicId,
      clinicName: loggedInUser.clinicName || "",
      permissions,
    });

    localStorage.setItem("token",        loggedInUser.token);
    localStorage.setItem("permissions",  JSON.stringify(permissions));
    localStorage.setItem("clinicId",     clinicId);
    if (loggedInUser.refreshToken) {
      localStorage.setItem("refreshToken", loggedInUser.refreshToken);
    }
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    const clinicId     = localStorage.getItem("clinicId");
    if (refreshToken) {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ refreshToken, clinicId }),
        });
      } catch {
        // αγνοούμε σφάλματα δικτύου — το clearAuth γίνεται πάντα
      }
    }
    clearAuth();
  }, [clearAuth]);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }, []);

  const canDo = useCallback((permission) => {
    if (!user) return false;
    const perms = user.permissions || [];
    return perms.includes("*") || perms.includes(permission);
  }, [user]);

  return { user, authLoading, login, logout, getAuthHeaders, canDo };
}
