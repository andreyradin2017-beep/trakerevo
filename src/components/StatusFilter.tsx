import React from "react";
import { motion } from "framer-motion";
import type { ItemStatus } from "../types";

export type StatusFilterType = "all" | ItemStatus;

interface StatusFilterProps {
  activeStatus: StatusFilterType;
  onStatusChange: (status: StatusFilterType) => void;
}

export const StatusFilter: React.FC<StatusFilterProps> = ({
  activeStatus,
  onStatusChange,
}) => {
  const statuses: { id: StatusFilterType; label: string }[] = [
    { id: "all", label: "Все" },
    { id: "planned", label: "Планы" },
    { id: "in_progress", label: "В процессе" },
    { id: "completed", label: "Готово" },
    { id: "dropped", label: "Брошено" },
  ];

  return (
    <div
      className="no-scrollbar"
      style={{
        display: "flex",
        gap: "0.5rem",
        overflowX: "auto",
        padding: "0 0.25rem",
        margin: "0 -0.25rem 1rem", // negative margin to allow scroll to edge
        scrollbarWidth: "none",
      }}
    >
      {statuses.map((status) => {
        const isActive = activeStatus === status.id;
        return (
          <motion.button
            key={status.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => onStatusChange(status.id)}
            style={{
              padding: "0.35rem 0.85rem",
              borderRadius: "20px",
              border: isActive
                ? "1px solid var(--primary)"
                : "1px solid rgba(255,255,255,0.1)",
              background: isActive
                ? "rgba(139, 92, 246, 0.15)"
                : "rgba(255,255,255,0.03)",
              color: isActive ? "var(--primary)" : "var(--text-secondary)",
              fontSize: "0.75rem",
              fontWeight: 600,
              whiteSpace: "nowrap",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            {status.label}
          </motion.button>
        );
      })}
    </div>
  );
};
