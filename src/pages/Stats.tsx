import React from "react";
import { PageHeader } from "@components/PageHeader";
import { AchievementsList } from "@components/AchievementsList";
import { useUserStats } from "@hooks/useStats";
import { Skeleton } from "@components/Skeleton";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  PieChart as PieIcon,
  BarChart3,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { StatsDonutChart } from "@components/StatsDonutChart";
import { StatsBarChart } from "@components/StatsBarChart";
import { KPIOverview } from "@components/KPIOverview";

export const Stats: React.FC = () => {
  const stats = useUserStats();
  const [showAchievements, setShowAchievements] = React.useState(false);
  const [showGenres, setShowGenres] = React.useState(false);

  if (!stats) {
    return (
      <div style={{ padding: "0 0.75rem" }}>
        <PageHeader title="Инфо" showBack={true} />
        <Skeleton
          width="100%"
          height={80}
          borderRadius={12}
          style={{ marginBottom: "1rem" }}
        />
        <Skeleton
          width="100%"
          height={180}
          borderRadius={16}
          style={{ marginBottom: "1rem" }}
        />
        <Skeleton width="100%" height={250} borderRadius={16} />
      </div>
    );
  }

  const donutData = [
    { label: "Кино", value: stats.totalMovies, color: "var(--type-movie)" },
    { label: "Игры", value: stats.totalGames, color: "var(--type-game)" },
    { label: "Книги", value: stats.totalBooks, color: "var(--type-book)" },
  ];

  const maxGenreCount = stats.topGenres[0]?.count || 1;

  return (
    <div style={{ paddingBottom: "7rem" }}>
      <PageHeader title="Инфо" showBack={true} />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ padding: "0 0.75rem" }}
      >
        {/* 1. Merged KPI Overview */}
        <KPIOverview stats={stats} />

        {/* 2. Collection Chart (Donut) */}
        <div
          style={{
            background: "var(--bg-surface)",
            border: "var(--border-glass)",
            borderRadius: "var(--radius-lg)",
            padding: "0.75rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            marginBottom: "0.75rem",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <PieIcon size={14} color="var(--primary)" />
            <h3 style={{ margin: 0, fontSize: "0.8rem", fontWeight: 700 }}>
              Твоя коллекция
            </h3>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <StatsDonutChart
              data={donutData}
              total={stats.totalItems}
              size={90}
            />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: "0.3rem",
                flex: 1,
              }}
            >
              {donutData.map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    background: "rgba(255,255,255,0.02)",
                    padding: "0.25rem 0.4rem",
                    borderRadius: "6px",
                  }}
                >
                  <div
                    style={{
                      width: "4px",
                      height: "4px",
                      borderRadius: "50%",
                      background: item.color,
                    }}
                  />
                  <span
                    style={{
                      fontSize: "0.6rem",
                      color: "var(--text-secondary)",
                      flex: 1,
                    }}
                  >
                    {item.label}
                  </span>
                  <span style={{ fontSize: "0.65rem", fontWeight: 700 }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Favorite Genres (Collapsible) */}
        <div
          onClick={() => setShowGenres(!showGenres)}
          style={{
            marginBottom: "0.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.5rem 0.35rem",
            background: "rgba(255,255,255,0.02)",
            borderRadius: "var(--radius-md)",
            cursor: "pointer",
            border: "1px solid rgba(255,255,255,0.03)",
            transition: "all 0.2s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <BarChart3 size={15} color="var(--primary)" />
            <h3
              style={{
                margin: 0,
                fontSize: "0.85rem",
                fontWeight: 750,
                color: "var(--text-primary)",
              }}
            >
              Любимые жанры
            </h3>
          </div>
          {showGenres ? (
            <ChevronUp size={16} color="var(--text-tertiary)" />
          ) : (
            <ChevronDown size={16} color="var(--text-tertiary)" />
          )}
        </div>

        <AnimatePresence>
          {showGenres && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                background: "var(--bg-surface)",
                border: "var(--border-glass)",
                borderRadius: "var(--radius-lg)",
                padding: "0.75rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                marginBottom: "0.75rem",
                overflow: "hidden",
              }}
            >
              {stats.topGenres.length > 0 ? (
                <StatsBarChart
                  data={stats.topGenres}
                  maxCount={maxGenreCount}
                />
              ) : (
                <div
                  style={{
                    fontSize: "0.65rem",
                    color: "var(--text-tertiary)",
                    textAlign: "center",
                    padding: "0.5rem",
                  }}
                >
                  Мало данных.
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 4. Achievements (Collapsible) */}
        <div
          onClick={() => setShowAchievements(!showAchievements)}
          style={{
            marginBottom: "0.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.5rem 0.35rem",
            background: "rgba(255,255,255,0.02)",
            borderRadius: "var(--radius-md)",
            cursor: "pointer",
            border: "1px solid rgba(255,255,255,0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <Trophy size={16} color="#fbbf24" />
            <h2
              style={{
                margin: 0,
                fontSize: "0.85rem",
                fontWeight: 750,
                color: "var(--text-primary)",
              }}
            >
              Достижения
            </h2>
            <span
              style={{
                background: "rgba(251, 191, 36, 0.1)",
                padding: "0.1rem 0.4rem",
                borderRadius: "10px",
                fontSize: "0.5rem",
                fontWeight: 800,
                color: "#fbbf24",
                textTransform: "uppercase",
              }}
            >
              Premium
            </span>
          </div>
          {showAchievements ? (
            <ChevronUp size={16} color="var(--text-tertiary)" />
          ) : (
            <ChevronDown size={16} color="var(--text-tertiary)" />
          )}
        </div>

        <AnimatePresence>
          {showAchievements && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: "hidden" }}
            >
              <AchievementsList stats={stats} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
