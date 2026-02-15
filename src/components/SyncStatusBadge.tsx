import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useSync } from "../context/SyncContext";

export const SyncStatusBadge: React.FC = () => {
  const { status, lastSyncTime, error } = useSync();

  const getStatusConfig = () => {
    switch (status) {
      case "syncing":
        return {
          icon: Loader2,
          text: "Синхронизация...",
          color: "#38bdf8",
          bgColor: "rgba(56, 189, 248, 0.1)",
          spin: true,
        };
      case "success":
        return {
          icon: CheckCircle2,
          text: "Синхронизировано",
          color: "#10b981",
          bgColor: "rgba(16, 185, 129, 0.1)",
          spin: false,
        };
      case "error":
        return {
          icon: AlertCircle,
          text: "Ошибка синхронизации",
          color: "#ef4444",
          bgColor: "rgba(239, 68, 68, 0.1)",
          spin: false,
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();

  if (!config) return null;

  const Icon = config.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.5rem 0.75rem",
          borderRadius: "var(--radius-lg)",
          background: config.bgColor,
          border: `1px solid ${config.color}33`,
          color: config.color,
          fontSize: "0.875rem",
          fontWeight: 500,
        }}
        title={
          error ||
          (lastSyncTime
            ? `Последняя синхронизация: ${lastSyncTime.toLocaleTimeString()}`
            : "")
        }
      >
        <motion.div
          animate={config.spin ? { rotate: 360 } : {}}
          transition={
            config.spin ? { duration: 1, repeat: Infinity, ease: "linear" } : {}
          }
        >
          <Icon size={16} />
        </motion.div>
        <span>{config.text}</span>
      </motion.div>
    </AnimatePresence>
  );
};
