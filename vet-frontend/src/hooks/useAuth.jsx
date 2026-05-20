import { useState, useCallback, useEffect } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Στο mount: έλεγχος αν υπάρχει ήδη έγκυρο token
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
        setUser({ name: data.name, token, role: data.role });
      })
      .catch(() => {
        localStorage.removeItem("token");
      })
      .finally(() => {
        setAuthLoading(false);
      });
  }, []);

  const login = useCallback((loggedInUser) => {
    setUser({
      name: loggedInUser.name,
      token: loggedInUser.token,
      role: loggedInUser.role,
    });
    localStorage.setItem("token", loggedInUser.token);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setUser(null);
  }, []);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }, []);

  return { user, authLoading, login, logout, getAuthHeaders };
}
