import React from "react";
import { motion } from "framer-motion";
import { Ghost } from "lucide-react";

interface EmptyStateProps {
  message?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  message = "Здесь пока ничего нет",
  icon,
  action,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "backOut" }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "3rem 1.5rem",
        textAlign: "center",
        color: "var(--text-tertiary)",
        minHeight: "200px",
      }}
    >
      <div
        style={{
          background: "var(--bg-surface)",
          padding: "1.5rem",
          borderRadius: "50%",
          marginBottom: "1rem",
          border: "1px solid rgba(255,255,255,0.05)",
          boxShadow: "0 0 20px rgba(0,0,0,0.2)",
        }}
      >
        {icon || <Ghost size={32} style={{ opacity: 0.5 }} />}
      </div>

      <p
        style={{
          fontSize: "1rem",
          fontWeight: 500,
          marginBottom: action ? "1.5rem" : 0,
          maxWidth: "250px",
          lineHeight: "1.5",
        }}
      >
        {message}
      </p>

      {action && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={action.onClick}
          style={{
            background: "var(--primary)",
            color: "var(--text-primary)",
            border: "none",
            padding: "0.75rem 1.5rem",
            borderRadius: "var(--radius-full)",
            fontSize: "0.9rem",
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(139, 92, 246, 0.3)",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
};
