import React from "react";
import { motion } from "framer-motion";
import { skeletonPulse } from "@utils/animations";

export const SkeletonCard: React.FC = () => {
  return (
    <motion.div
      variants={skeletonPulse}
      initial="initial"
      animate="animate"
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
          bottom: 0,
          left: 0,
          right: 0,
          padding: `3rem var(--space-md) var(--space-md)`,
          background:
            "linear-gradient(to top, rgba(9,9,11,1) 0%, rgba(9,9,11,0.6) 50%, transparent 100%)",
          display: "flex",
          flexDirection: "column",
          gap: "0.4rem",
          zIndex: 2,
        }}
      >
        {/* Title Line */}
        <div
          style={{
            height: "1rem",
            width: "85%",
            background: "rgba(255,255,255,0.1)",
            borderRadius: "4px",
          }}
        />
        {/* Subtitle/Year Line */}
        <div
          style={{
            height: "0.7rem",
            width: "35%",
            background: "rgba(255,255,255,0.06)",
            borderRadius: "4px",
          }}
        />
      </div>

      {/* Type Indicator Placeholder */}
      <div
        style={{
          position: "absolute",
          top: "0.4rem",
          right: "0.4rem",
          width: "26px",
          height: "26px",
          borderRadius: "50%",
          background: "rgba(0,0,0,0.5)",
          border: "1px solid rgba(255,255,255,0.05)",
          zIndex: 2,
        }}
      />
    </motion.div>
  );
};
