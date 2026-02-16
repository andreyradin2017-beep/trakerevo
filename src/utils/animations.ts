import type { Variants } from "framer-motion";

export const EASINGS = {
  bounce: [0.175, 0.885, 0.32, 1.275] as const,
  smooth: [0.4, 0, 0.2, 1] as const,
};

export const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.05,
      duration: 0.4,
      ease: EASINGS.bounce,
    },
  }),
};

export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3, ease: EASINGS.smooth },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2, ease: EASINGS.smooth },
  },
};

export const TAP_SCALE = 0.95;
export const HOVER_SCALE = 1.02;
