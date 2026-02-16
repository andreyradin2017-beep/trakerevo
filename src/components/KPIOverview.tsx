import React from "react";
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
    <div
      style={{
        background: "var(--bg-surface)",
        border: "var(--border-glass)",
        borderRadius: "var(--radius-lg)",
        padding: "0.85rem 0.5rem",
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "0rem",
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
            gap: "0.25rem",
            borderRight:
              index < items.length - 1
                ? "1px solid rgba(255,255,255,0.06)"
                : "none",
          }}
        >
          <div
            style={{
              color: item.color,
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              opacity: 0.9,
            }}
          >
            <item.icon size={11} strokeWidth={2.5} />
          </div>
          <div
            style={{
              fontSize: "1.1rem",
              fontWeight: "var(--fw-black)",
              color: "var(--text-primary)",
              fontFamily: "var(--font-main)",
              letterSpacing: "-0.5px",
            }}
          >
            <AnimatedNumber value={item.value} />
            {item.suffix && (
              <span
                style={{ fontSize: "0.6rem", marginLeft: "1px", opacity: 0.7 }}
              >
                {item.suffix}
              </span>
            )}
          </div>
          <span
            style={{
              fontSize: "0.55rem",
              fontWeight: "var(--fw-black)",
              color: "var(--text-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              fontFamily: "var(--font-main)",
            }}
          >
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
};
