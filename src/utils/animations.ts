import type { Variants } from "framer-motion";

/**
 * THE GOLDEN RULES (as per user manual):
 * - Duration: 200-500ms
 * - Easing: Ease-Out for appearing, Ease-In for disappearing, Standard for movement.
 */

export const DURATIONS = {
  fast: 0.1,
  standard: 0.2,
  slow: 0.4,
};

export const EASINGS = {
  // Ease-Out: Used for elements entering the stage. Responsive and snappy.
  out: [0.33, 1, 0.68, 1] as [number, number, number, number],
  // Ease-In: Used for elements leaving the stage.
  in: [0.32, 0, 0.67, 0] as [number, number, number, number],
  // Standard Curve: For elements moving within the screen.
  standard: [0.4, 0, 0.2, 1] as [number, number, number, number],
  // Anticipate/Overshoot: For characterizing actions.
  spring: { type: "spring", stiffness: 400, damping: 30 } as const,
};

// 1. MACRO: Page Transitions
export const pageVariants: Variants = {
  initial: { opacity: 0, scale: 0.98, y: 10 },
  enter: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: DURATIONS.standard, ease: EASINGS.out },
  },
  exit: {
    opacity: 0,
    scale: 1.02,
    y: -10,
    transition: { duration: DURATIONS.fast, ease: EASINGS.in },
  },
};

// 2. MICRO: Shared Elements / Cards
export const cardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      delay: i * 0.015, // Ultra-fast stagger
      duration: DURATIONS.standard,
      ease: EASINGS.out,
    },
  }),
};

// 3. MICRO: Interactive Feedback (Buttons, Toggles)
export const pressAnimation = {
  whileTap: { scale: 0.96 },
  whileHover: { scale: 1.02 },
  transition: { type: "spring", stiffness: 500, damping: 15 } as const,
};

// 4. SKELETON: Polished Pulse
export const skeletonPulse: Variants = {
  initial: { opacity: 0.3 },
  animate: {
    opacity: [0.3, 0.5, 0.3],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// 5. NARRATIVE: Micro-moments
export const shakeAnimation: Variants = {
  shake: {
    x: [0, -5, 5, -5, 5, 0],
    transition: { duration: 0.4 },
  },
};
