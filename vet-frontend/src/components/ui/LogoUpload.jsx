import { useState, useRef } from "react";
import { Upload } from "lucide-react";
import Button from "./button";
import settingsApi from "../../api/settingsApi.js"; // ✅ χρήση του settingsApi
import { resolveUploadUrl } from "../../utils/resolveUploadUrl.js";

export default function LogoUpload({ value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click(); // ✅ ανοίγει το file picker
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setError("");
    setUploading(true);

    try {
      console.log("📤 Uploading file:", file.name);

      // 👉 Χρήση settingsApi.uploadLogo (FormData + σωστό base URL)
      const data = await settingsApi.uploadLogo(file);
      console.log("📥 Server response:", data);

      if (data.url) {
        onChange(data.url); // ενημερώνουμε το parent
      } else {
        throw new Error("Δεν επιστράφηκε URL λογοτύπου από τον server");
      }
    } catch (err) {
      console.error("❌ Upload error:", err);
      setError(err.message || "Αποτυχία ανεβάσματος λογοτύπου");
    } finally {
      setUploading(false);
      e.target.value = ""; // καθαρίζει το input
    }
  };

  return (
    <div className="flex items-center gap-3">
      {value && (
        <img
          src={resolveUploadUrl(value)}
          alt="Logo"
          className="w-12 h-12 rounded-lg border dark:border-win-border-light shadow"
        />
      )}

      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      <Button
        variant="secondary"
        onClick={handleButtonClick}
        disabled={uploading}
      >
        <Upload className="w-4 h-4" />
        {uploading ? "Ανέβασμα..." : "Upload"}
      </Button>

      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
}
