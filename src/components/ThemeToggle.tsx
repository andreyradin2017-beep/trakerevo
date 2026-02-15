import React, { useEffect, useState } from "react";
import { Sun, Moon, Smartphone } from "lucide-react";
import { vibrate } from "../utils/haptics";

type Theme = "light" | "dark" | "oled";

export const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem("theme") as Theme) || "dark";
  });

  useEffect(() => {
    // Reset classes
    document.body.classList.remove("light-theme", "oled-theme");

    switch (theme) {
      case "light":
        document.body.classList.add("light-theme");
        break;
      case "oled":
        document.body.classList.add("oled-theme");
        break;
      default:
        // Dark is default, no class needed or default variables apply
        break;
    }

    localStorage.setItem("theme", theme);
  }, [theme]);

  const cycleTheme = () => {
    vibrate("medium");
    setTheme((prev) => {
      if (prev === "dark") return "oled";
      if (prev === "oled") return "light";
      return "dark";
    });
  };

  return (
    <button
      className="theme-toggle-btn"
      onClick={cycleTheme}
      aria-label="Toggle Theme"
      title={`Тема: ${theme}`}
    >
      {theme === "light" && <Sun size={18} />}
      {theme === "dark" && <Moon size={18} />}
      {theme === "oled" && <Smartphone size={18} />}
    </button>
  );
};
