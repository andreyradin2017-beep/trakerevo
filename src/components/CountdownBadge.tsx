import React from "react";
import { Clock } from "lucide-react";

interface CountdownBadgeProps {
  releaseDate: string;
  compact?: boolean;
}

export const CountdownBadge: React.FC<CountdownBadgeProps> = ({
  releaseDate,
  compact = false,
}) => {
  const now = new Date();
  const release = new Date(releaseDate);
  const diffMs = release.getTime() - now.getTime();

  // If already released, don't show
  if (diffMs <= 0) return null;

  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  let label: string;
  if (diffDays === 1) {
    label = "Завтра!";
  } else if (diffDays <= 7) {
    label = `Через ${diffDays} дн.`;
  } else if (diffDays <= 30) {
    const weeks = Math.floor(diffDays / 7);
    label = `Через ${weeks} нед.`;
  } else if (diffDays <= 365) {
    const months = Math.floor(diffDays / 30);
    label = `Через ${months} мес.`;
  } else {
    return null; // Too far away
  }

  const isImminent = diffDays <= 7;

  if (compact) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "3px",
          background: isImminent
            ? "rgba(239, 68, 68, 0.25)"
            : "rgba(139, 92, 246, 0.2)",
          color: isImminent ? "var(--error)" : "var(--primary)",
          padding: "2px 6px",
          borderRadius: "6px",
          fontSize: "0.6rem",
          fontWeight: 700,
          lineHeight: 1,
          backdropFilter: "blur(4px)",
        }}
      >
        <Clock size={8} />
        {label}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.4rem",
        background: isImminent
          ? "linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.08))"
          : "linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(139, 92, 246, 0.08))",
        color: isImminent ? "var(--error)" : "var(--primary)",
        padding: "0.4rem 0.75rem",
        borderRadius: "10px",
        fontSize: "0.75rem",
        fontWeight: 700,
        border: isImminent
          ? "1px solid rgba(239, 68, 68, 0.2)"
          : "1px solid rgba(139, 92, 246, 0.2)",
      }}
    >
      <Clock size={12} />
      {label}
    </div>
  );
};
