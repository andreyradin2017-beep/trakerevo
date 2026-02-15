import React from "react";
import { motion } from "framer-motion";
import { Film, Gamepad2, BookOpen, Plus, Activity } from "lucide-react";
import type { Item } from "../types";
import { vibrate } from "../utils/haptics";

interface GridCardProps {
  item?: Item & { isOwned?: boolean };
  isAddCard?: boolean;
  onClick: () => void;
  index?: number;
}

export const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.05,
      duration: 0.4,
      ease: [0.175, 0.885, 0.32, 1.275] as const,
    },
  }),
};

export const GridCard: React.FC<GridCardProps & { enableMotion?: boolean }> = ({
  item,
  isAddCard,
  onClick,
  index = 0,
  enableMotion = true,
}) => {
  if (isAddCard) {
    return (
      <motion.div
        variants={enableMotion ? cardVariants : undefined}
        initial={enableMotion ? "hidden" : undefined}
        animate={enableMotion ? "visible" : undefined}
        custom={index}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          vibrate("light");
          onClick();
        }}
        role="button"
        aria-label="Добавить новый элемент"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            vibrate("light");
            onClick();
          }
        }}
        style={{
          width: "100%",
          aspectRatio: "2/3",
          background: "var(--bg-surface)",
          border: "1px dashed rgba(255,255,255,0.2)",
          borderRadius: "var(--radius-lg)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
          cursor: "pointer",
          color: "var(--text-tertiary)",
        }}
      >
        <Plus size={32} />
        <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>Добавить</span>
      </motion.div>
    );
  }

  if (!item) return null;

  const getTypeIcon = () => {
    switch (item.type) {
      case "movie":
        return <Film size={12} />;
      case "game":
        return <Gamepad2 size={12} />;
      case "book":
        return <BookOpen size={12} />;
      default:
        return <Activity size={12} />;
    }
  };

  const getStatusInfo = () => {
    if (item.isOwned) {
      return { label: "В коллекции", color: "var(--success)", pulse: false };
    }
    switch (item.status) {
      case "in_progress":
        return {
          label:
            item.type === "movie"
              ? "Смотрю"
              : item.type === "game"
                ? "Играю"
                : "Читаю",
          color: "var(--primary)",
          pulse: true,
        };
      case "completed":
        return { label: "Готово", color: "var(--success)", pulse: false };
      case "planned":
      default:
        return { label: "Буду", color: "rgba(255,255,255,0.4)", pulse: false };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <motion.div
      layout
      variants={enableMotion ? cardVariants : undefined}
      initial={enableMotion ? "hidden" : undefined}
      animate={enableMotion ? "visible" : undefined}
      custom={index}
      whileTap={{ scale: 0.95 }}
      onClick={() => {
        vibrate("light");
        onClick();
      }}
      role="button"
      aria-label={`Открыть детали: ${item?.title}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          vibrate("light");
          onClick();
        }
      }}
      style={{
        width: "100%",
        aspectRatio: "2/3",
        position: "relative",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        boxShadow: "var(--shadow-lg)",
        background: "var(--bg-surface-hover)",
        cursor: "pointer",
        border: statusInfo.pulse
          ? "1px solid rgba(var(--primary-rgb), 0.3)"
          : "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* Image or Placeholder */}
      {item.image ? (
        <>
          <img
            src={item.image}
            alt={item.title}
            loading="lazy"
            decoding="async"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              const fallback = e.currentTarget.parentElement?.querySelector(
                ".fallback-icon",
              ) as HTMLElement;
              if (fallback) fallback.style.display = "flex";
            }}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              position: "relative",
              zIndex: 1,
            }}
          />
          <div
            className="fallback-icon"
            style={{
              position: "absolute",
              inset: 0,
              display: "none",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-tertiary)",
              backgroundColor: "rgba(255,255,255,0.02)",
              zIndex: 0,
            }}
          >
            {getTypeIcon()}
          </div>
        </>
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-tertiary)",
            backgroundColor: "rgba(255,255,255,0.02)",
          }}
        >
          {getTypeIcon()}
        </div>
      )}

      {/* Status Badge (Top Left) */}
      <div
        style={{
          position: "absolute",
          top: "0.4rem",
          left: "0.4rem",
          padding: "0.2rem 0.5rem",
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(8px)",
          borderRadius: "var(--radius-sm)",
          fontSize: "0.6rem",
          fontWeight: 800,
          color: statusInfo.color,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          gap: "0.3rem",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        {statusInfo.pulse && (
          <motion.div
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            style={{
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: statusInfo.color,
            }}
          />
        )}
        {statusInfo.label}
      </div>

      {/* Type Indicator (Top Right) */}
      <div
        style={{
          position: "absolute",
          top: "0.4rem",
          right: "0.4rem",
          padding: "0.3rem",
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(8px)",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          border: "1px solid rgba(255,255,255,0.1)",
          zIndex: 2,
        }}
      >
        {getTypeIcon()}
      </div>

      {/* Progress Bar (Bottom Edge) */}
      {item.status === "in_progress" &&
        item.progress !== undefined &&
        item.totalProgress &&
        item.totalProgress > 0 && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "3px",
              background: "rgba(0,0,0,0.5)",
              zIndex: 3,
            }}
          >
            <div
              style={{
                width: `${Math.min((item.progress / item.totalProgress) * 100, 100)}%`,
                height: "100%",
                background: "var(--primary)",
                boxShadow: "0 0 10px var(--primary)",
              }}
            />
          </div>
        )}

      {/* Title Overlay */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "3.5rem 0.8rem 0.8rem",
          background:
            "linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.9) 25%, rgba(0,0,0,0.6) 50%, transparent 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          zIndex: 1,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: "0.5rem",
          }}
        >
          <h4
            style={{
              margin: 0,
              fontSize: "0.85rem",
              fontWeight: 700,
              color: "white",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              lineHeight: "1.25",
              letterSpacing: "0px",
              textShadow: "0 2px 4px rgba(0,0,0,0.8)",
              flex: 1,
            }}
          >
            {item.title}
          </h4>
          {item.type === "show" &&
            item.currentSeason &&
            item.currentEpisode && (
              <span
                style={{
                  fontSize: "0.6rem",
                  color: "var(--primary)",
                  fontWeight: 900,
                  whiteSpace: "nowrap",
                  background: "rgba(139, 92, 246, 0.15)",
                  padding: "0.1rem 0.3rem",
                  borderRadius: "4px",
                  border: "1px solid rgba(139, 92, 246, 0.3)",
                }}
              >
                S{item.currentSeason} E{item.currentEpisode}
              </span>
            )}
        </div>
        {item.year && (
          <span
            style={{
              fontSize: "0.65rem",
              color: "rgba(255,255,255,0.5)",
              marginTop: "0.2rem",
              fontWeight: 500,
            }}
          >
            {item.year}
          </span>
        )}
      </div>
    </motion.div>
  );
};
