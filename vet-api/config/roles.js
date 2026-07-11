// Ορισμός permissions ανά role.
// Χρησιμοποιείται από requirePermission middleware και από το login response.
//
// Σύμβαση: "resource:action"
// Wildcard "*" = πλήρης πρόσβαση σε όλα

export const ROLES = {
  admin: ["*"],

  vet: [
    "appointments:read", "appointments:write", "appointments:delete",
    "customers:read",
    "pets:read", "pets:write", "pets:delete",
    "pets.history:read", "pets.history:write", "pets.history:delete",
    "prescriptions:read", "prescriptions:write",
    "products:read",
    "reminders:read", "reminders:write",
    "suppliers:read",
    "settings:read",
  ],

  secretary: [
    "appointments:read", "appointments:write", "appointments:delete",
    "customers:read", "customers:write",
    "reminders:read", "reminders:write", "reminders:delete",
    "purchases:write",
    "products:read",
    "suppliers:read",
    "pets:read",
    "settings:read",
  ],

  groomer: [
    "appointments:read", "appointments:write",
    "customers:read",
    "pets:read",
    "pets.history:read", "pets.history:write",
    "products:read",
    "settings:read",
  ],

  // Legacy role — ίδια δικαιώματα με secretary για backwards compat
  assistant: [
    "appointments:read", "appointments:write", "appointments:delete",
    "customers:read", "customers:write",
    "reminders:read", "reminders:write", "reminders:delete",
    "purchases:write",
    "products:read",
    "suppliers:read",
    "pets:read",
    "settings:read",
  ],
};

export function getPermissions(role) {
  return ROLES[role] || [];
}

export function hasPermission(role, permission) {
  const perms = getPermissions(role);
  return perms.includes("*") || perms.includes(permission);
}
