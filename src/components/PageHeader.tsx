import React from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SyncStatusBadge } from "./SyncStatusBadge";
import { useAuth } from "../context/AuthContext";

interface PageHeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  leftElement?: React.ReactNode;
  style?: React.CSSProperties;
  showSyncStatus?: boolean; // New prop
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  showBack,
  onBack,
  rightElement,
  leftElement,
  style,
  showSyncStatus = true, // Default to true
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "1.25rem",
        gap: "1rem",
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {leftElement}
        {showBack && (
          <button
            onClick={onBack || (() => navigate(-1))}
            aria-label="Назад"
            style={{
              padding: "0.5rem",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              borderRadius: "50%",
              background: "var(--bg-surface)",
              color: "var(--text-primary)",
            }}
          >
            <ArrowLeft size={18} />
          </button>
        )}
        <h1
          style={{
            fontSize: "1.2rem",
            fontWeight: 800,
            margin: 0,
            letterSpacing: "-0.3px",
            color: "var(--text-primary)",
          }}
        >
          {title}
        </h1>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {showSyncStatus && user && <SyncStatusBadge />}
        {rightElement}
      </div>
    </div>
  );
};
