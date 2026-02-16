import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, History, Zap, Activity } from "lucide-react";
import { AnimatedNumber } from "./AnimatedNumber";

interface KPIOverviewProps {
  stats: {
    totalCompleted: number;
    totalItems: number;
    streak: number;
  };
}

export const KPIOverview: React.FC<KPIOverviewProps> = ({ stats }) => {
  const items = [
    {
      label: "Завершено",
      value: stats.totalCompleted,
      icon: CheckCircle2,
      color: "#10b981",
    },
    {
      label: "Всего",
      value: stats.totalItems,
      icon: History,
      color: "#6366f1",
    },
    {
      label: "Дней",
      value: stats.streak,
      suffix: "дн",
      icon: Zap,
      color: "#f59e0b",
    },
    {
      label: "В работе",
      value: stats.totalItems - stats.totalCompleted,
      icon: Activity,
      color: "var(--primary)",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: "var(--bg-surface)",
        border: "var(--border-glass)",
        borderRadius: "var(--radius-lg)",
        padding: "0.75rem",
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "0.25rem",
        marginBottom: "0.75rem",
      }}
    >
      {items.map((item, index) => (
        <div
          key={item.label}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.2rem",
            borderRight:
              index < items.length - 1
                ? "1px solid rgba(255,255,255,0.05)"
                : "none",
          }}
        >
          <div
            style={{
              color: item.color,
              display: "flex",
              alignItems: "center",
              gap: "0.2rem",
            }}
          >
            <item.icon size={12} />
            <span
              style={{
                fontSize: "0.6rem",
                fontWeight: 600,
                color: "var(--text-tertiary)",
                textTransform: "uppercase",
              }}
            >
              {item.label}
            </span>
          </div>
          <div
            style={{
              fontSize: "1rem",
              fontWeight: 800,
              color: "var(--text-primary)",
            }}
          >
            <AnimatedNumber value={item.value} />
            {item.suffix && (
              <span style={{ fontSize: "0.6rem", marginLeft: "1px" }}>
                {item.suffix}
              </span>
            )}
          </div>
        </div>
      ))}
    </motion.div>
  );
};
