import React from "react";
import { Outlet } from "react-router-dom";
import { ScrollToTop } from "./ScrollToTop";
import { BottomNav } from "./BottomNav";
import styles from "./Layout.module.css";

import { ScrollProgress } from "./ScrollProgress";
import { FloatingActionButton } from "./FloatingActionButton";

export const Layout: React.FC = () => {
  return (
    <div className={styles.container}>
      <ScrollProgress />
      <ScrollToTop />
      <main className={styles.main} style={{ paddingBottom: "100px" }}>
        <Outlet />
      </main>

      <FloatingActionButton />
      <BottomNav />
    </div>
  );
};
