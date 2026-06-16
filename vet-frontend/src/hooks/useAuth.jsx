import { useState, useCallback, useEffect } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:5000/api`;

export function useAuth() {
  const [user, setUser]           = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

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

    fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("invalid token");
        return res.json();
      })
      .then((data) => {
        const permissions = JSON.parse(localStorage.getItem("permissions") || "[]");
        setUser({ name: data.name, token, role: data.role, permissions });
      })
      .catch(() => clearAuth())
      .finally(() => setAuthLoading(false));
  }, [clearAuth]);

  // Αυτόματη αποσύνδεση όταν το refresh token λήξει (το στέλνει ο apiClient)
  useEffect(() => {
    const handler = () => clearAuth();
    window.addEventListener("auth:logout", handler);
    return () => window.removeEventListener("auth:logout", handler);
  }, [clearAuth]);

  const login = useCallback((loggedInUser) => {
    const permissions = loggedInUser.permissions || [];
    setUser({ name: loggedInUser.name, token: loggedInUser.token, role: loggedInUser.role, permissions });
    localStorage.setItem("token", loggedInUser.token);
    localStorage.setItem("permissions", JSON.stringify(permissions));
    if (loggedInUser.refreshToken) {
      localStorage.setItem("refreshToken", loggedInUser.refreshToken);
    }
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
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

  // Ελέγχει αν ο τρέχων χρήστης έχει συγκεκριμένο permission
  const canDo = useCallback((permission) => {
    if (!user) return false;
    const perms = user.permissions || [];
    return perms.includes("*") || perms.includes(permission);
  }, [user]);

  return { user, authLoading, login, logout, getAuthHeaders, canDo };
}
