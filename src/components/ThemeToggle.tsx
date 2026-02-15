import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { vibrate } from "../utils/haptics";

type Theme = "light" | "dark";

export const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("theme");
    // Migrate old "oled" theme to "dark"
    if (saved === "oled") return "dark";
    return (saved as Theme) || "dark";
  });

  useEffect(() => {
    // Reset classes
    document.body.classList.remove("light-theme", "oled-theme");

    if (theme === "light") {
      document.body.classList.add("light-theme");
    }
    // Dark is default, no class needed

    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    vibrate("medium");
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <button
      className="theme-toggle-btn"
      onClick={toggleTheme}
      aria-label="Toggle Theme"
      title={`Тема: ${theme === "light" ? "Светлая" : "Тёмная"}`}
    >
      {theme === "light" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
};
