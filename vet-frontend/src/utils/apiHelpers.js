// ✅ Ανάγνωση API response (επιστρέφει πάντα αντικείμενο)
export const readResponse = async (res) => {
  const text = await res.text(); // παίρνουμε raw text
  let data = null;
  try {
    if (text) data = JSON.parse(text); // αν είναι JSON το κάνουμε parse
  } catch {
    // αγνοούμε σφάλμα JSON.parse και αφήνουμε data = null
  }
  return { ok: res.ok, status: res.status, data, text };
};
