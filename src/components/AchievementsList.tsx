import React from "react";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import {
  ACHIEVEMENTS,
  type UserStats,
  getUnlockedAchievements,
} from "../games/achievements";

interface AchievementsListProps {
  stats: UserStats;
}

export const AchievementsList: React.FC<AchievementsListProps> = ({
  stats,
}) => {
  const unlockedIds = getUnlockedAchievements(stats);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: "1rem",
      }}
    >
      {ACHIEVEMENTS.map((achievement) => {
        const isUnlocked = unlockedIds.includes(achievement.id);
        const Icon = achievement.icon;

        return (
          <motion.div
            key={achievement.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: "1rem",
              background: isUnlocked
                ? "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)"
                : "rgba(0,0,0,0.2)",
              borderRadius: "16px",
              border: isUnlocked
                ? `1px solid ${achievement.color}40`
                : "1px solid rgba(255,255,255,0.05)",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              position: "relative",
              overflow: "hidden",
              opacity: isUnlocked ? 1 : 0.6,
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: isUnlocked
                  ? `${achievement.color}20`
                  : "rgba(255,255,255,0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: isUnlocked ? achievement.color : "var(--text-tertiary)",
                border: isUnlocked
                  ? `1px solid ${achievement.color}60`
                  : "none",
              }}
            >
              {isUnlocked ? <Icon size={24} /> : <Lock size={20} />}
            </div>

            <div style={{ flex: 1 }}>
              <h4
                style={{
                  margin: "0 0 0.2rem",
                  fontSize: "0.9rem",
                  color: isUnlocked
                    ? "var(--text-primary)"
                    : "var(--text-secondary)",
                }}
              >
                {achievement.title}
              </h4>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.75rem",
                  color: "var(--text-tertiary)",
                  lineHeight: "1.3",
                }}
              >
                {achievement.description}
              </p>
            </div>

            {isUnlocked && (
              <div
                style={{
                  position: "absolute",
                  top: "-10px",
                  right: "-10px",
                  width: "40px",
                  height: "40px",
                  background: `radial-gradient(circle, ${achievement.color}40 0%, transparent 70%)`,
                  filter: "blur(10px)",
                }}
              />
            )}
          </motion.div>
        );
      })}
    </div>
  );
};
