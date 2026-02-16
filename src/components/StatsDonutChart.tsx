import React from "react";
import { motion } from "framer-motion";

interface DonutData {
  label: string;
  value: number;
  color: string;
}

interface StatsDonutChartProps {
  data: DonutData[];
  total: number;
  size?: number;
  strokeWidth?: number;
}

export const StatsDonutChart: React.FC<StatsDonutChartProps> = ({
  data,
  total,
  size = 180,
  strokeWidth = 24,
}) => {
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
        />

        {data.map((segment, i) => {
          const percentage = segment.value / total;
          const strokeDasharray = `${percentage * circumference} ${circumference}`;
          const strokeDashoffset = -currentOffset;
          currentOffset += percentage * circumference;

          return (
            <motion.circle
              key={segment.label}
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: strokeDashoffset }}
              transition={{
                delay: 0.5 + i * 0.1,
                duration: 1,
                ease: "easeOut",
              }}
              transform={`rotate(-90 ${center} ${center})`}
              strokeLinecap="round"
            />
          );
        })}
      </svg>

      {/* Middle Text */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            fontSize: size < 120 ? "1.1rem" : "1.5rem", // Adaptive font size for compact mode
            fontWeight: 800,
            color: "var(--text-primary)",
            lineHeight: 1,
          }}
        >
          {total}
        </span>
        <span
          style={{
            fontSize: size < 120 ? "0.55rem" : "0.65rem", // Adaptive sub-label
            color: "var(--text-tertiary)",
            textTransform: "uppercase",
            letterSpacing: size < 120 ? "0.5px" : "1px",
            marginTop: size < 120 ? "0px" : "2px",
          }}
        >
          Всего
        </span>
      </div>
    </div>
  );
};
