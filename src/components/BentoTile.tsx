import React from "react";
import { motion } from "framer-motion";

interface BentoTileProps {
  children: React.ReactNode;
  colSpan?: number;
  rowSpan?: number;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
}

export const BentoTile: React.FC<BentoTileProps> = ({
  children,
  colSpan = 1,
  rowSpan = 1,
  className = "",
  style = {},
  delay = 0,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.23, 1, 0.32, 1],
      }}
      className={`glass-card ${className}`}
      style={{
        gridColumn: `span ${colSpan}`,
        gridRow: `span ${rowSpan}`,
        padding: "1.25rem",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
};
