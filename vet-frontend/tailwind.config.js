/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class", // 🔹 Ενεργοποιεί το dark mode με .dark στο <html>
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#6366F1", // Indigo 500
          dark: "#4F46E5",
          light: "#A5B4FC",
        },
        secondary: {
          DEFAULT: "#10B981", // Emerald 500
          dark: "#059669",
          light: "#6EE7B7",
        },
        danger: {
          DEFAULT: "#EF4444", // Red 500
          dark: "#DC2626",
        },
        warning: {
          DEFAULT: "#F59E0B", // Amber 500
          dark: "#D97706",
        },
        neutral: {
          light: "#F9FAFB",
          dark: "#374151",
        },
      },
    },
  },
  plugins: [],
}
