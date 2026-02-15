import React from "react";
import { NavLink } from "react-router-dom";
import { Home, Search, Compass, User } from "lucide-react";
import { motion } from "framer-motion";
import { selectionChanged } from "../utils/haptics";

export const BottomNav: React.FC = () => {
  const navItems = [
    { path: "/", icon: <Home size={22} />, label: "Home" },
    { path: "/search", icon: <Search size={22} />, label: "Поиск" },
    { path: "/discover", icon: <Compass size={22} />, label: "Открытия" },
    { path: "/settings", icon: <User size={22} />, label: "Профиль" },
  ];

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "80px", // slightly taller for modern look
        background: "rgba(9, 9, 11, 0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        paddingBottom: "20px", // Safe area for iOS home indicator
        zIndex: 1000,
        boxShadow: "0 -10px 40px -10px rgba(0,0,0,0.5)",
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
            gap: "4px",
            color: isActive ? "var(--primary)" : "var(--text-tertiary)",
            textDecoration: "none",
            flex: 1,
            height: "100%",
            position: "relative",
          })}
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.div
                  layoutId="navIndicator"
                  style={{
                    position: "absolute",
                    top: "0",
                    width: "40px",
                    height: "2px",
                    background:
                      "linear-gradient(90deg, transparent, var(--primary), transparent)",
                    borderRadius: "0 0 4px 4px",
                  }}
                />
              )}
              {item.icon}
              <span
                style={{ fontSize: "0.6rem", fontWeight: 600, opacity: 0.85 }}
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
