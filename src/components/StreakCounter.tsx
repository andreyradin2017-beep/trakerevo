import React from "react";
import { Flame } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface StreakCounterProps {
  streak: number;
  showAnimation?: boolean;
}

export const StreakCounter: React.FC<StreakCounterProps> = ({
  streak,
  showAnimation,
}) => {
  if (streak === 0) return null;

  return (
    <div
      style={{ position: "relative", display: "flex", alignItems: "center" }}
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: showAnimation ? [1, 1.5, 1] : 1 }}
        transition={{ duration: 0.5 }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.2rem",
          padding: "0.3rem 0.6rem",
          background: "rgba(249, 115, 22, 0.15)", // Orange tint
          border: "1px solid rgba(249, 115, 22, 0.3)",
          borderRadius: "16px",
          color: "#f97316", // Orange-500
          fontWeight: 700,
          fontSize: "0.8rem",
        }}
      >
        <Flame size={14} fill={streak >= 3 ? "#f97316" : "none"} />
        <span>{streak}</span>
      </motion.div>

      <AnimatePresence>
        {showAnimation && (
          <motion.div
            initial={{ opacity: 0, y: 0, scale: 0.5 }}
            animate={{ opacity: [0, 1, 0], y: -20, scale: 1.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            style={{
              position: "absolute",
              top: -10,
              left: 0,
              right: 0,
              textAlign: "center",
              pointerEvents: "none",
            }}
          >
            🔥
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
