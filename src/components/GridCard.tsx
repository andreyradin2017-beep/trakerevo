import React from "react";
import { motion } from "framer-motion";
import { Film, Gamepad2, BookOpen, Plus, Activity } from "lucide-react";
import { getProxiedImageUrl } from "../utils/images";
import type { Item } from "../types";
import { vibrate } from "../utils/haptics";

interface GridCardProps {
  item?: Item & { isOwned?: boolean };
  isAddCard?: boolean;
  onClick: () => void;
  onQuickAdd?: () => void; // New prop
  onLongPress?: () => void;
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
  onQuickAdd,
  onLongPress,
  index = 0,
  enableMotion = true,
}) => {
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  const isLongPressTriggered = React.useRef(false);

  // Default long press duration
  const LONG_PRESS_DURATION = 500;

  const handlePressStart = () => {
    isLongPressTriggered.current = false;
    timerRef.current = setTimeout(() => {
      if (onLongPress) {
        vibrate("medium");
        onLongPress();
        isLongPressTriggered.current = true;
      }
    }, LONG_PRESS_DURATION);
  };

  const handlePressEnd = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleClick = (e: any) => {
    if (isLongPressTriggered.current) {
      // Prevent click if long press happened
      e.stopPropagation();
      e.preventDefault();
      return;
    }
    vibrate("light");
    onClick();
  };

  if (isAddCard) {
    return (
      <motion.div
        variants={enableMotion ? cardVariants : undefined}
        initial={enableMotion ? "hidden" : undefined}
        animate={enableMotion ? "visible" : undefined}
        custom={index}
        whileTap={{ scale: 0.95 }}
        onClick={handleClick}
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
    return null;
  };

  const getSourceInfo = () => {
    switch (item.source) {
      case "kinopoisk":
        return { label: "КП", color: "#ff6600" };
      case "tmdb":
        return { label: "TMDB", color: "#01b4e4" };
      case "rawg":
        return { label: "RAWG", color: "#ffffff" };
      case "google_books":
        return { label: "BOOKS", color: "#34a853" };
      default:
        return null;
    }
  };

  const statusInfo = getStatusInfo();
  const sourceInfo = getSourceInfo();

  return (
    <motion.div
      layout
      variants={enableMotion ? cardVariants : undefined}
      initial={enableMotion ? "hidden" : undefined}
      animate={enableMotion ? "visible" : undefined}
      custom={index}
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.02, zIndex: 10 }} // Micro-animation: Lift on hover
      onClick={handleClick}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
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
        border: statusInfo?.pulse
          ? "1px solid rgba(var(--primary-rgb), 0.3)"
          : "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* Image or Placeholder */}
      {item.image ? (
        <>
          <img
            src={getProxiedImageUrl(item.image)}
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

      <div
        style={{
          position: "absolute",
          top: "0.4rem",
          left: "0.4rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.3rem",
          zIndex: 2,
        }}
      >
        {statusInfo && (
          <div
            style={{
              padding: "0.2rem 0.5rem",
              background: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(8px)",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.6rem",
              fontWeight: 800,
              color: statusInfo.color,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
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
        )}

        {sourceInfo && (
          <div
            style={{
              padding: "0.15rem 0.4rem",
              background: "rgba(0,0,0,0.8)",
              backdropFilter: "blur(8px)",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.55rem",
              fontWeight: 900,
              color: sourceInfo.color,
              width: "fit-content",
              border: `1px solid ${sourceInfo.color}44`,
            }}
          >
            {sourceInfo.label}
          </div>
        )}
      </div>

      {/* Quick Add Button - Only show if provided and item not owned */}
      {onQuickAdd && !item.isOwned && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            vibrate("medium");
            onQuickAdd();
          }}
          style={{
            position: "absolute",
            bottom: "3.5rem", // Above the title gradient
            right: "0.5rem",
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: "var(--primary)",
            border: "none",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 3,
            boxShadow: "0 4px 12px rgba(139, 92, 246, 0.4)",
            cursor: "pointer",
          }}
        >
          <Plus size={18} strokeWidth={3} />
        </motion.button>
      )}

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

      {/* Status Color Bar (Bottom Edge) */}
      {(() => {
        const statusBarColors: Record<string, string> = {
          completed: "var(--success)",
          in_progress: "var(--primary)",
          planned: "rgba(255,255,255,0.15)",
          dropped: "var(--error)",
        };
        const barColor =
          statusBarColors[item.status] || "rgba(255,255,255,0.1)";
        const hasProgress =
          item.status === "in_progress" &&
          item.progress !== undefined &&
          item.totalProgress &&
          item.totalProgress > 0;
        const progressPct = hasProgress
          ? Math.min((item.progress! / item.totalProgress!) * 100, 100)
          : 0;

        return (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: hasProgress ? "4px" : "3px",
              background: hasProgress ? "rgba(0,0,0,0.5)" : barColor,
              zIndex: 3,
            }}
          >
            {hasProgress && (
              <div
                style={{
                  width: `${progressPct}%`,
                  height: "100%",
                  background: "var(--primary)",
                  boxShadow: "0 0 10px var(--primary)",
                  transition: "width 0.3s ease",
                }}
              />
            )}
          </div>
        );
      })()}

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
