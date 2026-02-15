import React from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Trash2, Archive } from "lucide-react";
import { vibrate } from "../utils/haptics";

interface SwipeableProps {
  children: React.ReactNode;
  onDelete?: () => void;
  onArchive?: () => void;
  threshold?: number;
  disabled?: boolean;
}

export const Swipeable: React.FC<SwipeableProps> = ({
  children,
  onDelete,
  onArchive,
  threshold = 80,
  disabled = false,
}) => {
  const x = useMotionValue(0);

  // Background colors and icons based on swipe direction
  const backgroundColor = useTransform(
    x,
    [-threshold, 0, threshold],
    ["#ef4444", "rgba(0,0,0,0)", "#f59e0b"],
  );

  const iconOpacityDelete = useTransform(
    x,
    [-threshold, -threshold / 2],
    [1, 0],
  );
  const iconOpacityArchive = useTransform(
    x,
    [threshold / 2, threshold],
    [0, 1],
  );

  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.x < -threshold && onDelete) {
      vibrate("medium");
      onDelete();
    } else if (info.offset.x > threshold && onArchive) {
      vibrate("medium");
      onArchive();
    }

    animate(x, 0, { type: "spring", stiffness: 300, damping: 30 });
  };

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "8px",
        marginBottom: "4px",
      }}
    >
      {/* Action Background */}
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 1.5rem",
          zIndex: 0,
        }}
      >
        <motion.div style={{ opacity: iconOpacityArchive }}>
          <Archive size={20} color="white" />
        </motion.div>
        <motion.div style={{ opacity: iconOpacityDelete }}>
          <Trash2 size={20} color="white" />
        </motion.div>
      </motion.div>

      {/* Draggable Content */}
      <motion.div
        drag={disabled ? false : "x"}
        dragConstraints={{
          left: onDelete ? -150 : 0,
          right: onArchive ? 150 : 0,
        }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        style={{
          x,
          position: "relative",
          zIndex: 1,
          backgroundColor: "var(--bg-app)",
        }}
      >
        {children}
      </motion.div>
    </div>
  );
};
