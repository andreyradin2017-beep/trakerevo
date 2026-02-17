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
  titleClassName?: string;
  showSyncStatus?: boolean; // New prop
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  showBack,
  onBack,
  rightElement,
  leftElement,
  style,
  titleClassName = "",
  showSyncStatus = true, // Default to true
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div
      className="flex-between"
      style={{
        marginBottom: "1.25rem",
        gap: "1rem",
        ...style,
      }}
    >
      <div
        className="flex-center"
        style={{
          gap: "var(--space-md)",
        }}
      >
        {leftElement && leftElement}
        {showBack && (
          <button
            onClick={onBack || (() => navigate(-1))}
            className="btn-icon"
            aria-label="Назад"
          >
            <ArrowLeft size={18} />
          </button>
        )}
        <h1
          className={titleClassName}
          style={{
            fontSize: "1.1rem",
            fontWeight: "var(--fw-black)",
            margin: 0,
            letterSpacing: "-0.5px",
            color: "var(--text-primary)",
            fontFamily: "var(--font-main)",
            lineHeight: 1,
          }}
        >
          {title}
        </h1>
      </div>
      <div className="flex-center" style={{ gap: "0.75rem" }}>
        {showSyncStatus && user && <SyncStatusBadge />}
        {rightElement}
      </div>
    </div>
  );
};
