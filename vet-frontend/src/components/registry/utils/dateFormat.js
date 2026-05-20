export function formatDateTime(isoString) {
  if (!isoString) return "";
  try {
    return new Date(isoString).toLocaleString("el-GR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return "";
  }
}
