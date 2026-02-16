import React from "react";
import { motion } from "framer-motion";

export const SkeletonCard: React.FC = () => {
  return (
    <div
      style={{
        width: "100%",
        aspectRatio: "2/3",
        background: "var(--bg-surface)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        position: "relative",
        border: "var(--border-glass)",
      }}
    >
      {/* Shimmer Effect */}
      <motion.div
        animate={{
          x: ["-100%", "100%"],
        }}
        transition={{
          repeat: Infinity,
          duration: 1.2,
          ease: "linear",
        }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%)",
          zIndex: 1,
        }}
      />

      {/* Content Placeholders */}
      <div
        style={{
          position: "absolute",
          bottom: "1rem",
          left: "0.8rem",
          right: "0.8rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          zIndex: 2,
        }}
      >
        {/* Title Line */}
        <div
          style={{
            height: "1rem",
            width: "80%",
            background: "rgba(255,255,255,0.08)",
            borderRadius: "4px",
          }}
        />
        {/* Subtitle/Year Line */}
        <div
          style={{
            height: "0.8rem",
            width: "40%",
            background: "rgba(255,255,255,0.05)",
            borderRadius: "4px",
          }}
        />
      </div>

      {/* Type Icon Placeholder */}
      <div
        style={{
          position: "absolute",
          top: "0.5rem",
          right: "0.5rem",
          width: "24px",
          height: "24px",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.05)",
        }}
      />
    </div>
  );
};
