import React from "react";
import { motion } from "framer-motion";
import {
  ACHIEVEMENTS,
  type UserStats,
  getUnlockedAchievements,
  getAchievementProgress,
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
        gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
        gap: "0.75rem",
      }}
    >
      {ACHIEVEMENTS.map((achievement, index) => {
        const isUnlocked = unlockedIds.includes(achievement.id);
        const progress = getAchievementProgress(achievement.id, stats);
        const Icon = achievement.icon;

        return (
          <motion.div
            key={achievement.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -2 }}
            style={{
              padding: "0.75rem",
              background: "var(--bg-surface)",
              borderRadius: "var(--radius-lg)",
              border: isUnlocked
                ? `1px solid ${achievement.color}40`
                : "1px solid rgba(255,255,255,0.05)",
              display: "flex",
              flexDirection: "column",
              gap: "0.6rem",
              position: "relative",
              overflow: "hidden",
              minHeight: "110px",
              justifyContent: "space-between",
            }}
          >
            {/* Background Glow for Unlocked */}
            {isUnlocked && (
              <div
                style={{
                  position: "absolute",
                  top: "-20%",
                  right: "-10%",
                  width: "60%",
                  height: "60%",
                  background: achievement.color,
                  opacity: 0.1,
                  filter: "blur(30px)",
                  borderRadius: "50%",
                }}
              />
            )}

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  background: isUnlocked
                    ? `${achievement.color}15`
                    : "rgba(255,255,255,0.03)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: isUnlocked
                    ? achievement.color
                    : "rgba(255,255,255,0.15)",
                  border: isUnlocked
                    ? `1px solid ${achievement.color}30`
                    : "1px solid rgba(255,255,255,0.05)",
                  flexShrink: 0,
                }}
              >
                <Icon
                  size={18}
                  style={{
                    filter: isUnlocked ? "none" : "grayscale(1) opacity(0.5)",
                  }}
                />
              </div>

              <div>
                <h4
                  style={{
                    margin: "0 0 0.1rem",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    lineHeight: "1.2",
                    color: isUnlocked
                      ? "var(--text-primary)"
                      : "var(--text-secondary)",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {achievement.title}
                </h4>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.65rem",
                    color: "var(--text-tertiary)",
                    lineHeight: "1.3",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {achievement.description}
                </p>
              </div>
            </div>

            {/* Progress Section */}
            {!isUnlocked && (
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.6rem",
                    marginBottom: "0.3rem",
                  }}
                >
                  <span
                    style={{ color: "var(--text-secondary)", fontWeight: 600 }}
                  >
                    {progress.current}/{progress.target}
                  </span>
                </div>
                <div
                  style={{
                    height: "4px",
                    background: "rgba(255,255,255,0.03)",
                    borderRadius: "2px",
                    overflow: "hidden",
                  }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress.percentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    style={{
                      height: "100%",
                      background: `linear-gradient(90deg, ${achievement.color}aa 0%, ${achievement.color} 100%)`,
                      borderRadius: "2px",
                    }}
                  />
                </div>
              </div>
            )}

            {isUnlocked && (
              <div
                style={{
                  fontSize: "0.6rem",
                  fontWeight: 800,
                  color: achievement.color,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.2rem",
                }}
              >
                <div
                  style={{
                    width: "3px",
                    height: "3px",
                    borderRadius: "50%",
                    background: achievement.color,
                  }}
                />
                Unlocked
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};
