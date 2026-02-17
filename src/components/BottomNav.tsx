import React from "react";
import { NavLink } from "react-router-dom";
import { Home, BarChart3, Archive, Dices, User } from "lucide-react";
import { motion } from "framer-motion";
import { selectionChanged } from "../utils/haptics";

export const BottomNav: React.FC = () => {
  const navItems = [
    { path: "/", icon: <Home size={22} />, label: "Главная" },
    { path: "/random", icon: <Dices size={22} />, label: "Рандом" },
    { path: "/archive", icon: <Archive size={22} />, label: "Архив" },
    { path: "/stats", icon: <BarChart3 size={22} />, label: "Инфо" },
    { path: "/settings", icon: <User size={22} />, label: "Профиль" },
  ];

  return (
    <nav
      style={{
        position: "fixed",
        bottom: "1.5rem",
        left: "1rem",
        right: "1rem",
        height: "64px",
        background: "rgba(15, 15, 18, 0.75)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "var(--radius-xl)",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        zIndex: 1000,
        boxShadow: "0 10px 40px -10px rgba(0,0,0,0.7)",
      }}
    >
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          onClick={() => selectionChanged()}
          style={({ isActive }) => ({
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "2px",
            color: isActive ? "var(--primary)" : "var(--text-tertiary)",
            textDecoration: "none",
            flex: 1,
            height: "100%",
            position: "relative",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          })}
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "44px",
                    height: "44px",
                    background: "rgba(139, 92, 246, 0.1)",
                    borderRadius: "14px",
                    zIndex: -1,
                  }}
                />
              )}
              <motion.div
                animate={{
                  scale: isActive ? 1.15 : 1,
                  y: isActive ? -1 : 0,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {item.icon}
              </motion.div>
              <span
                style={{
                  fontSize: "0.55rem",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  opacity: isActive ? 1 : 0.5,
                  transition: "opacity 0.3s",
                  fontFamily: "var(--font-main)",
                }}
              >
                {item.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
};
