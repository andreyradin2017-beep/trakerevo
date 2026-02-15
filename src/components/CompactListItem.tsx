import React from "react";
import { ChevronRight, Film, Gamepad2, BookOpen, Activity } from "lucide-react";
import type { Item } from "../types";
import { motion } from "framer-motion";

interface CompactListItemProps {
  item: Item;
  onClick: () => void;
  style?: React.CSSProperties;
}

export const CompactListItem: React.FC<CompactListItemProps> = ({
  item,
  onClick,
  style,
}) => {
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

  const getTypeIcon = () => {
    const color = getTypeColor();
    switch (item.type) {
      case "movie":
        return <Film size={12} color={color} />;
      case "game":
        return <Gamepad2 size={12} color={color} />;
      case "book":
        return <BookOpen size={12} color={color} />;
      default:
        return <Activity size={12} color={color} />;
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
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98, backgroundColor: "rgba(255,255,255,0.03)" }}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        padding: "0.75rem 0.5rem",
        borderBottom: "1px solid rgba(255,255,255,0.03)",
        cursor: "pointer",
        ...style,
      }}
    >
      {/* Thumbnail */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        {item.image ? (
          <img
            src={item.image}
            alt={item.title}
            style={{
              width: "40px",
              height: "60px",
              objectFit: "cover",
              borderRadius: "4px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            }}
          />
        ) : (
          <div
            style={{
              width: "40px",
              height: "60px",
              borderRadius: "4px",
              background: "var(--bg-surface-hover)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-tertiary)",
            }}
          >
            {getTypeIcon()}
          </div>
        )}

        {/* Status Dot */}
        <div
          style={{
            position: "absolute",
            bottom: -2,
            right: -2,
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            backgroundColor: getStatusColor(),
            border: "2px solid var(--bg-app)",
          }}
        />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: "1rem",
            color: "var(--text-primary)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            marginBottom: "0.2rem",
          }}
        >
          {item.title}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            fontSize: "0.75rem",
            color: "var(--text-secondary)",
          }}
        >
          <span
            style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}
          >
            {getTypeIcon()}
            {item.year && <span>{item.year}</span>}
          </span>

          {/* Progress Bar */}
          {item.status === "in_progress" &&
            item.progress !== undefined &&
            item.totalProgress !== undefined && (
              <div
                style={{
                  flex: 1,
                  height: "3px",
                  background: "rgba(255,255,255,0.1)",
                  borderRadius: "1.5px",
                  marginLeft: "0.4rem",
                  maxWidth: "50px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${Math.min((item.progress / item.totalProgress) * 100, 100)}%`,
                    height: "100%",
                    background: getTypeColor(),
                    borderRadius: "1.5px",
                  }}
                />
              </div>
            )}
        </div>
      </div>

      {/* Drag/Action Handle or Just Arrow */}
      <ChevronRight
        size={14}
        color="var(--text-tertiary)"
        style={{ opacity: 0.2 }}
      />
    </motion.div>
  );
};
