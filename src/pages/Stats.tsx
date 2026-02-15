import React from "react";
import { PageHeader } from "../components/PageHeader";
import { AchievementsList } from "../components/AchievementsList";
import { useUserStats } from "../hooks/useStats";
import { Skeleton } from "../components/Skeleton";
import { motion } from "framer-motion";
import { PieChart, Activity, Zap } from "lucide-react";

export const Stats: React.FC = () => {
  const stats = useUserStats();

  if (!stats) {
    return (
      <div
        style={{
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <Skeleton width="100%" height={200} borderRadius={16} />
        <Skeleton width="100%" height={300} borderRadius={16} />
      </div>
    );
  }

  // Calculate percentages for Pie Chart
  const total = stats.totalItems || 1; // avoid division by zero
  const moviePct = (stats.totalMovies / total) * 100;
  const gamePct = (stats.totalGames / total) * 100;
  // bookPct is remainder

  // CSS Conic Gradient for Pie Chart
  const pieChartGradient = `conic-gradient(
    var(--type-movie) 0% ${moviePct}%,
    var(--type-game) ${moviePct}% ${moviePct + gamePct}%,
    var(--type-book) ${moviePct + gamePct}% 100%
  )`;

  return (
    <div style={{ paddingBottom: "6rem" }}>
      <PageHeader title="Статистика" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ padding: "0 1rem" }}
      >
        {/* Summary Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.75rem",
            marginBottom: "1.5rem",
          }}
        >
          <div
            style={{
              background: "var(--bg-surface)",
              border: "var(--border-glass)",
              borderRadius: "var(--radius-lg)",
              padding: "1rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
            }}
          >
            <Activity size={24} color="var(--primary)" />
            <div
              style={{
                fontSize: "1.5rem",
                fontWeight: 800,
                color: "var(--text-primary)",
              }}
            >
              {stats.totalCompleted}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
              Завершено
            </div>
          </div>

          <div
            style={{
              background:
                "linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(249, 115, 22, 0.05) 100%)",
              border: "1px solid rgba(249, 115, 22, 0.2)",
              borderRadius: "var(--radius-lg)",
              padding: "1rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
            }}
          >
            <Zap size={24} color="#f97316" />
            <div
              style={{ fontSize: "1.5rem", fontWeight: 800, color: "#f97316" }}
            >
              {stats.streak} <span style={{ fontSize: "0.8rem" }}>дней</span>
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
              Текущая серия
            </div>
          </div>
        </div>

        {/* Distribution Chart */}
        <div
          style={{
            background: "var(--bg-surface)",
            border: "var(--border-glass)",
            borderRadius: "var(--radius-lg)",
            padding: "1.5rem",
            marginBottom: "2rem",
            display: "flex",
            alignItems: "center",
            gap: "2rem",
          }}
        >
          <div
            style={{
              width: "100px",
              height: "100px",
              borderRadius: "50%",
              background: pieChartGradient,
              position: "relative",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: "15px", // donut hole
                background: "var(--bg-app)",
                borderRadius: "50%",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              flex: 1,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "0.5rem",
              }}
            >
              <PieChart size={16} color="var(--text-secondary)" />
              <h3 style={{ margin: 0, fontSize: "1rem" }}>Распределение</h3>
            </div>
            <LegendItem
              color="var(--type-movie)"
              label="Кино & TV"
              count={stats.totalMovies}
            />
            <LegendItem
              color="var(--type-game)"
              label="Игры"
              count={stats.totalGames}
            />
            <LegendItem
              color="var(--type-book)"
              label="Книги"
              count={stats.totalBooks}
            />
          </div>
        </div>

        {/* Achievements Section */}
        <div
          style={{
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.2rem" }}>Достижения</h2>
          <span
            style={{
              background: "var(--bg-surface-active)",
              padding: "0.1rem 0.5rem",
              borderRadius: "10px",
              fontSize: "0.75rem",
              color: "var(--text-secondary)",
            }}
          >
            Beta
          </span>
        </div>

        <AchievementsList stats={stats} />
      </motion.div>
    </div>
  );
};

const LegendItem: React.FC<{ color: string; label: string; count: number }> = ({
  color,
  label,
  count,
}) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      fontSize: "0.85rem",
    }}
  >
    <div
      style={{
        width: "8px",
        height: "8px",
        borderRadius: "2px",
        background: color,
      }}
    />
    <span style={{ color: "var(--text-secondary)", flex: 1 }}>{label}</span>
    <span style={{ fontWeight: 600 }}>{count}</span>
  </div>
);
