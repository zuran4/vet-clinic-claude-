import React, { useState } from "react";
import { Save, XCircle, Pencil, Trash2, User } from "lucide-react";
import { Button } from "../ui/button";
import { useUsersManagement } from "../../hooks/useUsersManagement";

const INPUT = "border border-gray-200 dark:border-win-border-light px-3 py-2 rounded-2xl shadow-sm focus:ring-2 focus:ring-primary bg-white dark:bg-win-elevated text-gray-900 dark:text-gray-100";

const UserManagement = ({ getAuthHeaders }) => {
  const {
    users,
    error,
    editingId,
    setEditingId,
    deleteUser,
    updateUser,
  } = useUsersManagement(getAuthHeaders);

  const [editForm, setEditForm] = useState({
    name: "",
    pin: "",
    role: "secretary",
  });

  const handleEditClick = (user) => {
    setEditingId(user._id);
    setEditForm({
      name: user.name,
      pin: user.pin,
      role: user.role,
    });
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    updateUser(editingId, editForm);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
        <User className="w-6 h-6 text-primary" />
        Διαχείριση Χρηστών
      </h2>

      {error && <p className="text-red-500 dark:text-red-400">{error}</p>}

      <ul className="space-y-3">
        {users.map((user) =>
          editingId === user._id ? (
            <form
              key={user._id}
              onSubmit={handleEditSubmit}
              className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 p-4 rounded-2xl shadow flex flex-col gap-3"
            >
              <input
                name="name"
                value={editForm.name}
                onChange={handleEditChange}
                required
                className={INPUT}
                placeholder="Όνομα"
              />
              <input
                name="pin"
                value={editForm.pin}
                onChange={handleEditChange}
                required
                className={INPUT}
                placeholder="PIN"
              />
              <select
                name="role"
                value={editForm.role}
                onChange={handleEditChange}
                className={INPUT}
              >
                <option value="vet">Κτηνίατρος</option>
                <option value="secretary">Γραμματέας</option>
                <option value="groomer">Groomer</option>
                <option value="admin">Admin</option>
              </select>

              <div className="flex gap-2">
                <Button variant="primary" type="submit" className="gap-2">
                  <Save className="w-4 h-4" />
                  Αποθήκευση
                </Button>
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Άκυρο
                </Button>
              </div>
            </form>
          ) : (
            <li
              key={user._id}
              className="bg-gray-100 dark:bg-win-elevated p-4 rounded-2xl shadow flex justify-between items-center"
            >
              <div>
                <p className="font-semibold text-gray-700 dark:text-gray-100">{user.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Ρόλος: {user.role}</p>
              </div>

              <div className="flex gap-2 items-center">
                <Button
                  variant="secondary"
                  onClick={() => handleEditClick(user)}
                  className="gap-2"
                >
                  <Pencil className="w-4 h-4" />
                  Επεξεργασία
                </Button>
                <Button
                  variant="danger"
                  onClick={() => deleteUser(user._id)}
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Διαγραφή
                </Button>
              </div>
            </li>
          )
        )}
      </ul>
    </div>
  );
};

export default UserManagement;
