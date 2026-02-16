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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "3rem 1.5rem",
        textAlign: "center",
        color: "var(--text-secondary)",
        minHeight: "260px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background Glow */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "120px",
          height: "120px",
          background: "var(--primary-glow)",
          filter: "blur(60px)",
          opacity: 0.2,
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          background: "rgba(255,255,255,0.03)",
          padding: "1.75rem",
          borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%", // Organic shape
          marginBottom: "1.5rem",
          border: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--primary)",
        }}
      >
        {icon || <Ghost size={40} strokeWidth={1.5} />}
      </div>

      <p
        style={{
          position: "relative",
          zIndex: 1,
          fontSize: "1.1rem",
          fontWeight: 600,
          color: "var(--text-primary)",
          marginBottom: "0.5rem",
        }}
      >
        {message}
      </p>
      <p
        style={{
          position: "relative",
          zIndex: 1,
          fontSize: "0.9rem",
          opacity: 0.6,
          maxWidth: "240px",
          lineHeight: "1.5",
          marginBottom: action ? "1.5rem" : 0,
        }}
      >
        {action
          ? "Здесь будет отображаться ваш контент, начните с добавления первого элемента"
          : "Попробуйте изменить параметры поиска или фильтры"}
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
