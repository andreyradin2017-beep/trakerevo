import React, { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useNavigate } from "react-router-dom";
import { db } from "../db/db";
import { Plus, Archive } from "lucide-react";
import { GridCard, cardVariants } from "../components/GridCard";
import { Skeleton } from "../components/Skeleton";
import { SkeletonCard } from "../components/SkeletonCard";
import { AnimatedCounter } from "../components/AnimatedCounter";
import { EmptyState } from "../components/EmptyState";
import { ThemeToggle } from "../components/ThemeToggle";
import { PullToRefresh } from "../components/PullToRefresh";
import { Swipeable } from "../components/Swipeable";
import { motion } from "framer-motion";
import {
  CategorySelector,
  type Category,
} from "../components/CategorySelector";
import { PageHeader } from "../components/PageHeader";
import type { Item } from "../types";
import { vibrate } from "../utils/haptics";
import { useStreaks } from "../hooks/useStreaks";
import { StreakCounter } from "../components/StreakCounter";
import { triggerAutoSync } from "../services/dbSync";

const UserLists: React.FC = () => {
  const lists = useLiveQuery(() => db.lists.toArray());
  const navigate = useNavigate();

  if (!lists) {
    return (
      <div
        style={{
          display: "flex",
          gap: "0.4rem",
          padding: "0 0.5rem",
          overflowX: "hidden",
        }}
      >
        <Skeleton width={32} height={32} borderRadius="50%" />
        <Skeleton width={60} height={32} borderRadius="16px" />
        <Skeleton width={80} height={32} borderRadius="16px" />
      </div>
    );
  }

  return (
    <div
      className="no-scrollbar"
      style={{
        display: "flex",
        gap: "0.4rem",
        overflowX: "auto",
        padding: "0 0.5rem",
        margin: "0 -0.5rem",
        scrollbarWidth: "none",
        alignItems: "center",
      }}
    >
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          const name = prompt("Название нового списка:");
          if (name && name.trim()) {
            db.lists.add({ name: name.trim(), createdAt: new Date() });
            triggerAutoSync();
          }
        }}
        style={{
          minWidth: "32px",
          height: "32px",
          borderRadius: "50%",
          background: "var(--bg-surface-hover)",
          border: "1px dashed var(--text-tertiary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "var(--text-secondary)",
        }}
      >
        <Plus size={16} />
      </motion.button>

      {lists.map((list) => (
        <motion.div
          key={list.id}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(`/list/${list.id}`)}
          style={{
            padding: "0.4rem 0.75rem",
            background: "var(--bg-surface)",
            backdropFilter: "var(--backdrop-blur)",
            borderRadius: "var(--radius-full)",
            border: "var(--border-glass)",
            cursor: "pointer",
            whiteSpace: "nowrap",
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "var(--text-primary)",
          }}
        >
          {list.name}
        </motion.div>
      ))}
    </div>
  );
};

const StatCard: React.FC<{ title: string; count: number; color: string }> = ({
  title,
  count,
  color,
}) => (
  <div
    style={{
      padding: "0.6rem",
      background: "rgba(255,255,255,0.02)",
      borderRadius: "var(--radius-md)",
      border: "1px solid rgba(255,255,255,0.03)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
    }}
  >
    <h3
      style={{
        marginBottom: "0.1rem",
        fontSize: "0.65rem",
        color: "var(--text-secondary)",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
      }}
    >
      {title}
    </h3>
    <p style={{ fontSize: "1rem", fontWeight: 700, margin: 0, color: color }}>
      <AnimatedCounter value={count} />
    </p>
  </div>
);

import { useRecentItems } from "../hooks/useItems";
import { useCategoryStats } from "../hooks/useStats";

const RecentItemsList: React.FC<{ category: Category }> = ({ category }) => {
  const items = useRecentItems(category);
  const navigate = useNavigate();

  const handleDeleteItem = async (item: Item) => {
    if (!item.id) return;
    if (window.confirm("Удалить этот элемент?")) {
      if (item.supabaseId) {
        await db.deleted_metadata.put({
          id: item.supabaseId,
          table: "items",
          timestamp: new Date().getTime(),
        });
      }
      await db.items.delete(item.id);
      triggerAutoSync();
    }
  };

  const handleArchiveItem = async (id?: number, currentStatus?: boolean) => {
    if (!id) return;
    await db.items.update(id, {
      isArchived: !currentStatus,
      updatedAt: new Date(),
    });
    triggerAutoSync();
  };

  if (!items) {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.75rem",
        }}
      >
        {[1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
        gap: "0.75rem",
      }}
    >
      {category === "all" && (
        <GridCard isAddCard onClick={() => navigate("/search")} />
      )}

      {items.map((item: Item, index: number) => {
        const effectiveIndex = category === "all" ? index + 1 : index;
        return (
          <motion.div
            key={item.id}
            layout
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            custom={effectiveIndex}
          >
            <Swipeable
              onDelete={() => handleDeleteItem(item)}
              onArchive={() => handleArchiveItem(item.id, item.isArchived)}
            >
              <GridCard
                item={item}
                index={effectiveIndex}
                onClick={() => navigate(`/item/${item.id}`)}
                enableMotion={false}
              />
            </Swipeable>
          </motion.div>
        );
      })}

      {items.length === 0 && category !== "all" && (
        <div style={{ gridColumn: "span 2" }}>
          <EmptyState
            message="В этой категории пока пусто!"
            action={{
              label: "Поиск",
              onClick: () => navigate("/search"),
            }}
          />
        </div>
      )}
    </div>
  );
};

export const Home: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const navigate = useNavigate();
  const stats = useCategoryStats();
  const { currentStreak, showFireAnimation } = useStreaks();

  return (
    <PullToRefresh
      onRefresh={async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        // Logic to refresh data would go here
      }}
    >
      <div style={{ paddingBottom: "2.5rem" }}>
        <PageHeader
          title="TrakerEvo"
          rightElement={
            <div
              style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}
            >
              <StreakCounter
                streak={currentStreak}
                showAnimation={showFireAnimation}
              />
              <ThemeToggle />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  vibrate("light");
                  navigate("/archive");
                }}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "10px",
                  width: "36px",
                  height: "36px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "var(--text-secondary)",
                }}
                title="Архив"
              >
                <Archive size={18} />
              </motion.button>
            </div>
          }
          style={{
            padding: "0.25rem 0",
          }}
        />

        <CategorySelector
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          style={{ marginBottom: "1.25rem" }}
        />

        {activeCategory === "all" && (
          <div style={{ marginBottom: "1.25rem" }}>
            <UserLists />
          </div>
        )}

        <div style={{ marginBottom: "2.5rem" }}>
          <h2
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              marginBottom: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "1px",
              color: "var(--text-tertiary)",
              paddingLeft: "2px",
            }}
          >
            {activeCategory === "all" ? "Недавнее" : "Результаты"}
          </h2>
          <RecentItemsList category={activeCategory} />
        </div>

        {activeCategory === "all" && (
          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.05)",
              paddingTop: "1.5rem",
            }}
          >
            <div
              style={{
                display: "grid",
                gap: "0.5rem",
                gridTemplateColumns: "repeat(3, 1fr)",
              }}
            >
              <StatCard
                title="Планы"
                count={stats?.planned ?? 0}
                color="var(--text-secondary)"
              />
              <StatCard
                title="Прогресс"
                count={stats?.inProgress ?? 0}
                color="var(--primary)"
              />
              <StatCard
                title="Готово"
                count={stats?.completed ?? 0}
                color="var(--success)"
              />
            </div>
          </div>
        )}
      </div>
    </PullToRefresh>
  );
};
