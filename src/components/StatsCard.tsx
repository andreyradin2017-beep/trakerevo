import React from "react";
import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { AnimatedNumber } from "./AnimatedNumber";

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  suffix?: string;
  color: string;
  trend?: string;
  delay?: number;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  icon: Icon,
  label,
  value,
  suffix = "",
  color,
  trend,
  delay = 0,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      style={{
        background: "var(--bg-surface)",
        border: "var(--border-glass)",
        borderRadius: "var(--radius-lg)",
        padding: "0.75rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.4rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: "28px",
          height: "28px",
          borderRadius: "8px",
          background: `${color}15`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: color,
        }}
      >
        <Icon size={16} />
      </div>

      <div>
        <div
          style={{
            fontSize: "1.25rem",
            fontWeight: 800,
            color: "var(--text-primary)",
            display: "flex",
            alignItems: "baseline",
            gap: "0.2rem",
            lineHeight: 1.1,
          }}
        >
          <AnimatedNumber value={value} />
          {suffix && (
            <span
              style={{
                fontSize: "0.75rem",
                color: "var(--text-tertiary)",
                fontWeight: 600,
              }}
            >
              {suffix}
            </span>
          )}
        </div>
        <div
          style={{
            fontSize: "0.7rem",
            color: "var(--text-secondary)",
            fontWeight: 500,
            marginTop: "0.1rem",
          }}
        >
          {label}
        </div>
      </div>

      {trend && (
        <div
          style={{
            fontSize: "0.6rem",
            color: "#10b981",
            fontWeight: 700,
            background: "rgba(16, 185, 129, 0.1)",
            padding: "0.1rem 0.4rem",
            borderRadius: "8px",
            alignSelf: "flex-start",
            marginTop: "auto",
            position: "relative",
            zIndex: 1,
          }}
        >
          {trend}
        </div>
      )}
    </motion.div>
  );
};
