import React from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, Play, ExternalLink } from "lucide-react";
import { pressAnimation, DURATIONS, EASINGS } from "@utils/animations";

interface ItemMetadataDetailsProps {
  extraMetadata: {
    providers?: { name: string; logo: string }[];
    related?: {
      externalId: string;
      title: string;
      image?: string;
      type: string;
    }[];
  } | null;
  expandedSections: Record<string, boolean>;
  toggleSection: (id: string) => void;
  onNavigateToSearch: (title: string) => void;
}

const SectionHeader: React.FC<{
  title: string;
  id: string;
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: (id: string) => void;
}> = ({ title, id, icon, expanded, onToggle }) => (
  <div
    onClick={() => onToggle(id)}
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0.75rem 0",
      cursor: "pointer",
      borderTop: "1px solid rgba(255,255,255,0.05)",
      marginTop: "0.5rem",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
      <span style={{ color: "var(--text-tertiary)" }}>{icon}</span>
      <span
        style={{
          fontSize: "0.8rem",
          fontWeight: 700,
          color: "var(--text-secondary)",
          textTransform: "uppercase",
        }}
      >
        {title}
      </span>
    </div>
    {expanded ? (
      <ChevronUp size={18} color="var(--text-tertiary)" />
    ) : (
      <ChevronDown size={18} color="var(--text-tertiary)" />
    )}
  </div>
);

export const ItemMetadataDetails: React.FC<ItemMetadataDetailsProps> = ({
  extraMetadata,
  expandedSections,
  toggleSection,
  onNavigateToSearch,
}) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
        padding: "0 1.25rem",
      }}
    >
      {extraMetadata?.providers && extraMetadata.providers.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <SectionHeader
            title="Где посмотреть"
            id="providers"
            icon={<Play size={14} />}
            expanded={!!expandedSections.providers}
            onToggle={toggleSection}
          />
          {expandedSections.providers && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: DURATIONS.standard,
                ease: EASINGS.out,
              }}
              style={{ overflow: "hidden" }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  flexWrap: "wrap",
                  padding: "0.75rem 0",
                }}
              >
                {extraMetadata.providers.map((p, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      background: "rgba(255,255,255,0.03)",
                      padding: "0.4rem 0.6rem",
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <img
                      src={p.logo}
                      alt={p.name}
                      loading="lazy"
                      decoding="async"
                      style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "4px",
                      }}
                    />
                    <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>
                      {p.name}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}

      {extraMetadata?.related && extraMetadata.related.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <SectionHeader
            title="Рекомендации"
            id="related"
            icon={<ExternalLink size={14} />}
            expanded={!!expandedSections.related}
            onToggle={toggleSection}
          />
          {expandedSections.related && (
            <div style={{ overflow: "hidden" }}>
              <div
                className="no-scrollbar"
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  overflowX: "auto",
                  padding: "0.75rem 0",
                  margin: "0 -0.5rem",
                }}
              >
                {extraMetadata.related.map((r, idx) => (
                  <motion.div
                    key={r.externalId || idx}
                    {...pressAnimation}
                    onClick={() => onNavigateToSearch(r.title)}
                    style={{
                      minWidth: "110px",
                      width: "110px",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        aspectRatio: "2/3",
                        borderRadius: "10px",
                        overflow: "hidden",
                        border: "1px solid rgba(255,255,255,0.1)",
                        marginBottom: "0.4rem",
                        boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
                      }}
                    >
                      <img
                        src={r.image}
                        alt={r.title}
                        loading="lazy"
                        decoding="async"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </div>
                    <p
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        margin: 0,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        color: "var(--text-primary)",
                        textAlign: "center",
                      }}
                    >
                      {r.title}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
