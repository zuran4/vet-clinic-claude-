import { useState, useEffect } from "react";
import { API_URL } from "../api/api.js"; // ✅ κοινό base URL

const API = `${API_URL}/users`;

export function useUsersManagement(getAuthHeaders) {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch(API, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        throw new Error(`Αποτυχία φόρτωσης χρηστών (${res.status})`);
      }

      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("❌ Σφάλμα φόρτωσης χρηστών:", err);
      setError("Απέτυχε η φόρτωση χρηστών.");
    }
  };

  const deleteUser = async (userId) => {
    if (
      !window.confirm(
        "❗ Είσαι σίγουρος ότι θέλεις να διαγράψεις τον χρήστη;"
      )
    )
      return;

    try {
      const res = await fetch(`${API}/${userId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        throw new Error(`Αποτυχία διαγραφής (${res.status})`);
      }

      setUsers((prev) => prev.filter((u) => u._id !== userId));
    } catch (err) {
      console.error("❌ Σφάλμα διαγραφής χρήστη:", err);
      setError("Αποτυχία διαγραφής.");
    }
  };

  const updateUser = async (userId, data) => {
    try {
      const res = await fetch(`${API}/${userId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error(`Αποτυχία ενημέρωσης (${res.status})`);
      }

      const updated = await res.json();

      setUsers((prev) =>
        prev.map((u) => (u._id === updated._id ? updated : u))
      );
      setEditingId(null);
    } catch (err) {
      console.error("❌ Σφάλμα ενημέρωσης χρήστη:", err);
      setError("Αποτυχία ενημέρωσης.");
    }
  };

  return {
    users,
    error,
    editingId,
    setEditingId,
    fetchUsers,
    deleteUser,
    updateUser,
  };
}
