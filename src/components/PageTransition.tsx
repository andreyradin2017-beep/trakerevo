import React from "react";
import { motion } from "framer-motion";
import { pageVariants } from "@utils/animations";

interface PageTransitionProps {
  children: React.ReactNode;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="enter"
      exit="exit"
      style={{
        width: "100%",
        minHeight: "100vh", // Ensure full height for smooth backdrop
      }}
    >
      {children}
    </motion.div>
  );
};
