import React from "react";
import { Timer } from "lucide-react";
import { BentoTile } from "./BentoTile";

interface HLTBTileProps {
  hltb: {
    main: string;
    extra: string;
    completionist: string;
  };
  delay?: number;
}

export const HLTBTile: React.FC<HLTBTileProps> = ({ hltb, delay = 0.18 }) => {
  const stats = [
    { label: "Сюжет", value: hltb.main },
    { label: "+ Допы", value: hltb.extra },
    { label: "100%", value: hltb.completionist },
  ];

  return (
    <BentoTile colSpan={2} delay={delay} style={{ padding: "1rem" }}>
      <div
        className="flex-center"
        style={{
          justifyContent: "flex-start",
          gap: "0.5rem",
          marginBottom: "0.75rem",
        }}
      >
        <Timer size={14} color="var(--primary)" />
        <label className="section-label" style={{ margin: 0 }}>
          Время прохождения (HowLongToBeat)
        </label>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "0.5rem",
        }}
      >
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex-column flex-center"
            style={{
              background: "rgba(255,255,255,0.03)",
              padding: "0.75rem",
              borderRadius: "12px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "0.65rem",
                color: "var(--text-tertiary)",
                marginBottom: "0.25rem",
                textTransform: "uppercase",
                fontWeight: 700,
              }}
            >
              {stat.label}
            </div>
            <div
              style={{
                fontSize: "1.1rem",
                fontWeight: 800,
                color: "var(--text-primary)",
              }}
            >
              {stat.value}
            </div>
          </div>
        ))}
      </div>
    </BentoTile>
  );
};
