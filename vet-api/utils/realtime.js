// utils/realtime.js
// 🔹 Ενημερώνει όλα τα συνδεδεμένα clients (socket.io) ότι άλλαξαν δεδομένα
// π.χ. emitChange("appointments") μετά από create/update/delete ραντεβού
export function emitChange(type) {
  global.io?.emit("data:changed", { type });
}
