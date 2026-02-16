import React from "react";
import {
  Star,
  Film,
  Gamepad2,
  BookOpen,
  Activity,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { getProxiedImageUrl } from "../utils/images";
import type { Item } from "../types";

interface DetailedListItemProps {
  item: Item;
  onClick: () => void;
  style?: React.CSSProperties;
}

export const DetailedListItem: React.FC<DetailedListItemProps> = ({
  item,
  onClick,
  style,
}) => {
  const proxiedImage = getProxiedImageUrl(item.image);

  const getTypeColor = () => {
    switch (item.type) {
      case "movie":
        return "var(--type-movie)";
      case "game":
        return "var(--type-game)";
      case "book":
        return "var(--type-book)";
      default:
        return "var(--type-other)";
    }
  };

  const getTypeIcon = (size = 12) => {
    const color = getTypeColor();
    switch (item.type) {
      case "movie":
        return <Film size={size} color={color} />;
      case "game":
        return <Gamepad2 size={size} color={color} />;
      case "book":
        return <BookOpen size={size} color={color} />;
      default:
        return <Activity size={size} color={color} />;
    }
  };

  const getStatusLabel = () => {
    switch (item.status) {
      case "completed":
        return "Готово";
      case "in_progress":
        return "В процессе";
      case "dropped":
        return "Брошено";
      case "planned":
        return "В планах";
      default:
        return "";
    }
  };

  const getStatusColor = () => {
    switch (item.status) {
      case "completed":
        return "var(--success)";
      case "in_progress":
        return "var(--primary)";
      case "dropped":
        return "var(--error)";
      default:
        return "var(--text-tertiary)";
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="glass-card"
      style={{
        display: "flex",
        gap: "1rem",
        padding: "0.75rem",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
        marginBottom: "0.25rem",
        ...style,
      }}
    >
      {/* Thumbnail */}
      <div
        style={{
          width: "70px",
          height: "105px",
          flexShrink: 0,
          borderRadius: "var(--radius-sm)",
          overflow: "hidden",
          background: "var(--bg-surface-hover)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        }}
      >
        {proxiedImage ? (
          <img
            src={item.image}
            alt={item.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0.3,
            }}
          >
            {getTypeIcon(24)}
          </div>
        )}
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "0.5rem",
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: "0.95rem",
              fontWeight: 800,
              color: "var(--text-primary)",
              fontFamily: "var(--font-main)",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {item.title}
          </h3>
          {item.rating && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "2px",
                color: "var(--warning)",
              }}
            >
              <Star size={12} fill="currentColor" />
              <span style={{ fontSize: "0.8rem", fontWeight: 700 }}>
                {item.rating}
              </span>
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginTop: "0.3rem",
          }}
        >
          <span
            className="section-label"
            style={{
              fontSize: "0.6rem",
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
            }}
          >
            {getTypeIcon(10)}
            {item.year || "N/A"}
          </span>
          <span
            style={{
              fontSize: "0.6rem",
              fontWeight: 700,
              color: getStatusColor(),
              textTransform: "uppercase",
              padding: "0.1rem 0.4rem",
              background: `${getStatusColor()}15`,
              borderRadius: "4px",
            }}
          >
            {getStatusLabel()}
          </span>
        </div>

        {item.description ? (
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--text-tertiary)",
              margin: "0.5rem 0",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              lineHeight: "1.4",
            }}
          >
            {item.description}
          </p>
        ) : (
          <div style={{ flex: 1 }} />
        )}

        {/* Progress */}
        {item.status === "in_progress" && (
          <div style={{ marginTop: "auto", paddingTop: "0.5rem" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.65rem",
                marginBottom: "3px",
              }}
            >
              <span style={{ color: "var(--text-tertiary)" }}>Прогресс</span>
              <span style={{ fontWeight: 700, color: getTypeColor() }}>
                {item.progress || 0} / {item.totalProgress || "?"}
              </span>
            </div>
            <div
              style={{
                height: "4px",
                background: "rgba(255,255,255,0.05)",
                borderRadius: "2px",
                overflow: "hidden",
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.min(((item.progress || 0) / (item.totalProgress || 1)) * 100, 100)}%`,
                }}
                style={{
                  height: "100%",
                  background: getTypeColor(),
                  borderRadius: "2px",
                }}
              />
            </div>
          </div>
        )}
      </div>

      <ChevronRight
        size={16}
        color="var(--text-tertiary)"
        style={{ alignSelf: "center", opacity: 0.3 }}
      />
    </motion.div>
  );
};
