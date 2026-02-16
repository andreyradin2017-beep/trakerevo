import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";

interface SectionProps {
  title: string;
  icon?: any; // Use any to allow both components and elements without TS complexity
  iconColor?: string;
  badge?: string | number;
  badgeColor?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  plain?: boolean; // If true, don't wrap in glass-card
}

export const Section: React.FC<SectionProps> = ({
  title,
  icon: Icon,
  iconColor = "var(--primary)",
  badge,
  badgeColor = "var(--primary)",
  collapsible = false,
  defaultCollapsed = false,
  children,
  style,
  className = "",
  plain = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const toggleCollapse = () => {
    if (collapsible) {
      setIsCollapsed(!isCollapsed);
    }
  };

  return (
    <div
      className={`section-container ${className}`}
      style={{ marginBottom: "1rem", ...style }}
    >
      {/* Section Header */}
      <div
        onClick={toggleCollapse}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.25rem 0",
          cursor: collapsible ? "pointer" : "default",
          marginBottom: isCollapsed ? 0 : "0.75rem",
          transition: "all 0.2s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {Icon && (
            <span
              style={{
                color: iconColor,
                display: "flex",
                alignItems: "center",
              }}
            >
              {React.isValidElement(Icon) ? (
                Icon
              ) : (
                <Icon size={14} strokeWidth={2.5} />
              )}
            </span>
          )}
          <h2
            className="section-label"
            style={{
              margin: 0,
              color: isCollapsed
                ? "var(--text-tertiary)"
                : "var(--text-secondary)",
              fontSize: "0.7rem",
            }}
          >
            {title}
          </h2>
          {badge !== undefined && (
            <span
              style={{
                background: `${badgeColor}15`,
                padding: "0.05rem 0.3rem",
                borderRadius: "6px",
                fontSize: "0.55rem",
                fontWeight: 900,
                color: badgeColor,
                textTransform: "uppercase",
              }}
            >
              {badge}
            </span>
          )}
        </div>
        {collapsible && (
          <div style={{ color: "var(--text-tertiary)" }}>
            {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </div>
        )}
      </div>

      {/* Section Content */}
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: "hidden" }}
          >
            {plain ? (
              children
            ) : (
              <div className="glass-card" style={{ padding: "0.75rem" }}>
                {children}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
