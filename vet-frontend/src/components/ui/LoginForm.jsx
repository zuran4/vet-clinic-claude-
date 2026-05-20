import React, { useState } from "react";
import { Lock } from "lucide-react";
// ⚠️ Πρόσεξε το όνομα του αρχείου: συνήθως είναι "button.jsx" (μικρό b)
import { Button } from "./button";
import request from "../../api/apiClient.js";

const LoginForm = ({ onLogin }) => {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError("");

      // Χρησιμοποιούμε τον apiClient, ΟΧΙ απευθείας localhost
      const data = await request("/auth/login", {
        method: "POST",
        body: { pin },
      });

      onLogin({
        token: data.token,
        name: data.name,
        role: data.role,
      });
    } catch (err) {
      console.error("❌ Σφάλμα σύνδεσης:", err);
      setError(err.message || "Πρόβλημα σύνδεσης με τον διακομιστή");
    }
  };

  return (
    <div
      className="w-screen h-screen flex items-center justify-center bg-cover bg-center"
      style={{
        backgroundImage: "url('https://i.imgur.com/ZJfOZGX.png')",
        backgroundRepeat: "no-repeat",
        backgroundSize: "contain",
        backgroundPosition: "top center",
      }}
    >
      <div className="mt-[250px] w-full max-w-xs px-4">
        <form
          onSubmit={handleSubmit}
          className="bg-white bg-opacity-90 p-6 rounded-2xl shadow-xl text-center space-y-4"
        >
          {/* Input */}
          <input
            type="password"
            maxLength="4"
            placeholder="Εισάγετε PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            required
            autoComplete="new-password"
            className="mx-auto block w-32 p-2 border rounded-2xl shadow focus:ring-2 focus:ring-primary text-center text-base font-mono"
          />

          {/* Submit */}
          <div className="flex justify-center">
            <Button
              type="submit"
              variant="primary"
              className="rounded-2xl shadow focus:ring-2 focus:ring-primary px-6"
            >
              Σύνδεση
            </Button>
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-600 text-sm font-semibold">{error}</p>
          )}
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
