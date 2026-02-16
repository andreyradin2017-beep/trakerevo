import React, { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useNavigate } from "react-router-dom";
import { db } from "@db/db";
import { Plus, Archive } from "lucide-react";
import { GridCard } from "@components/GridCard";
import { cardVariants } from "@utils/animations";
import { Skeleton } from "@components/Skeleton";
import { SkeletonCard } from "@components/SkeletonCard";
import { AnimatedCounter } from "@components/AnimatedCounter";
import { EmptyState } from "@components/EmptyState";
import { Onboarding } from "@components/Onboarding";
import { PullToRefresh } from "@components/PullToRefresh";
import { motion } from "framer-motion";
import { CategorySelector, type Category } from "@components/CategorySelector";
import { FilterToolbar } from "@components/FilterToolbar";
import { type SortOption } from "@components/SortSelector";
import { PageHeader } from "@components/PageHeader";
import type { Item } from "@types";
import { vibrate } from "@utils/haptics";
import { triggerAutoSync } from "@services/dbSync";
import {
  ConfirmDialog,
  InputDialog,
  QuickActionMenu,
} from "../components/Dialogs";
import { type StatusFilterType } from "../components/StatusFilter";
import {
  PlayCircle,
  XCircle,
  Dices,
  Check,
  Clock,
  Trash2,
  Archive as ArchiveIcon,
} from "lucide-react";
import { UpcomingCarousel } from "../components/UpcomingCarousel";
import type { ItemStatus } from "../types";
import { Section } from "@components/Section";
import { Sparkles, FolderHeart } from "lucide-react";

const UserLists: React.FC<{ onAdd: () => void }> = ({ onAdd }) => {
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
        onClick={onAdd}
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
          className="btn-secondary"
          style={{
            padding: "0.35rem 0.8rem",
            borderRadius: "var(--radius-full)",
            fontSize: "0.75rem",
            fontWeight: 600,
            whiteSpace: "nowrap",
            height: "32px",
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
      padding: "0.75rem 0.5rem",
      background: "rgba(255,255,255,0.01)",
      borderRadius: "var(--radius-md)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      gap: "2px",
    }}
  >
    <span
      className="section-label"
      style={{
        fontSize: "0.55rem",
        opacity: 0.8,
        color: "var(--text-tertiary)",
      }}
    >
      {title}
    </span>
    <p
      style={{
        fontSize: "1.1rem",
        fontWeight: 800,
        margin: 0,
        color: color,
        fontFamily: "var(--font-main)",
      }}
    >
      <AnimatedCounter value={count} />
    </p>
  </div>
);

import { useRecentItems } from "../hooks/useItems";
import { useCategoryStats } from "../hooks/useStats";

const RecentItemsList: React.FC<{
  category: Category;
  statusFilter: StatusFilterType;
  sortBy: SortOption;
  onReference: (item: Item) => void;
  onLongPress: (item: Item) => void;
}> = ({ category, statusFilter, sortBy, onReference, onLongPress }) => {
  const items = useRecentItems(category, sortBy);
  const navigate = useNavigate();

  // Filter items by status locally
  const filteredItems = React.useMemo(() => {
    if (!items) return null;
    if (statusFilter === "all") return items;
    return items.filter((item) => item.status === statusFilter);
  }, [items, statusFilter]);

  // Determine if we should show onboarding
  // Only if no items at all (not just filtered) and we are in 'all' view
  const showOnboarding =
    items && items.length === 0 && category === "all" && statusFilter === "all";

  if (showOnboarding) {
    return (
      <div style={{ gridColumn: "span 2", marginTop: "-1rem" }}>
        <Onboarding onStart={() => navigate("/search")} />
      </div>
    );
  }

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
      {category === "all" && statusFilter === "all" && items.length > 0 && (
        <GridCard isAddCard onClick={() => navigate("/search")} />
      )}

      {filteredItems?.map((item: Item, index: number) => {
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
            <GridCard
              item={item}
              index={effectiveIndex}
              onClick={() => onReference(item)}
              onLongPress={() => onLongPress(item)}
              enableMotion={false}
            />
          </motion.div>
        );
      })}

      {/* Show empty state only if we have items but filter hides them OR if we are in a category with no items */}
      {filteredItems?.length === 0 && !showOnboarding && (
        <div style={{ gridColumn: "span 2" }}>
          <EmptyState
            message={
              statusFilter !== "all"
                ? "В этом статусе пусто"
                : "В этой категории пока пусто!"
            }
            action={
              statusFilter === "all"
                ? {
                    label: "Поиск",
                    onClick: () => navigate("/search"),
                  }
                : undefined
            }
          />
        </div>
      )}
    </div>
  );
};

export const Home: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>("all");
  const [sortBy, setSortBy] = useState<SortOption>("dateAdded");
  const navigate = useNavigate();
  const stats = useCategoryStats();

  // Dialog States
  const [isListDialogOpen, setIsListDialogOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: "", onConfirm: () => {} });
  const [quickMenu, setQuickMenu] = useState<{
    isOpen: boolean;
    item: Item | null;
  }>({ isOpen: false, item: null });

  // Handlers
  const handleAddList = (name: string) => {
    db.lists.add({ name, createdAt: new Date() });
    triggerAutoSync();
    setIsListDialogOpen(false);
  };

  const handleDeleteItem = async (item: Item) => {
    if (!item.id) return;
    if (item.supabaseId) {
      await db.deleted_metadata.put({
        id: item.supabaseId,
        table: "items",
        timestamp: new Date().getTime(),
      });
    }
    await db.items.delete(item.id);
    triggerAutoSync();
    setConfirmDialog({ ...confirmDialog, isOpen: false });
    setQuickMenu({ isOpen: false, item: null });
  };

  const handleUpdateStatus = async (item: Item, status: ItemStatus) => {
    if (!item.id) return;
    await db.items.update(item.id, { status, updatedAt: new Date() });
    triggerAutoSync();
    setQuickMenu({ isOpen: false, item: null });
  };

  const handleArchiveItem = async (item: Item) => {
    if (!item.id) return;
    await db.items.update(item.id, {
      isArchived: !item.isArchived,
      updatedAt: new Date(),
    });
    triggerAutoSync();
    setQuickMenu({ isOpen: false, item: null });
  };

  return (
    <>
      <PullToRefresh
        onRefresh={async () => {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }}
      >
        <div style={{ paddingBottom: "6rem" }}>
          <PageHeader
            title="TrakerEvo"
            rightElement={
              <div
                style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}
              >
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  className="btn-icon"
                  onClick={() => {
                    vibrate("medium");
                    navigate("/random");
                  }}
                  title="Мне повезет"
                >
                  <Dices size={20} />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  className="btn-icon"
                  onClick={() => {
                    vibrate("light");
                    navigate("/archive");
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

          <UpcomingCarousel />

          <div
            style={{
              position: "sticky",
              top: 0,
              zIndex: 10,
              background: "var(--bg-app)", // or rgba for blur
              padding: "0.5rem 0",
              margin: "0 -1rem", // Negative margin to stretch full width
              paddingLeft: "1rem", // Compensate padding
              paddingRight: "1rem",
            }}
          >
            {/* Backdrop blur effect overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backdropFilter: "blur(12px)",
                background: "rgba(23, 23, 23, 0.8)", // Semi-transparent bg-app
                zIndex: -1,
                maskImage:
                  "linear-gradient(to bottom, black 90%, transparent 100%)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, black 90%, transparent 100%)",
              }}
            />
            <CategorySelector
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
              style={{ marginBottom: "0.75rem" }}
            />
            <FilterToolbar
              activeStatus={statusFilter}
              onStatusChange={setStatusFilter}
              activeSort={sortBy}
              onSortChange={setSortBy}
            />

            <Section
              title="Мои Списки"
              icon={FolderHeart}
              plain
              style={{ marginTop: "0.75rem", marginBottom: "0.5rem" }}
            >
              <UserLists onAdd={() => setIsListDialogOpen(true)} />
            </Section>
          </div>

          <div style={{ marginBottom: "2rem" }}>
            <Section
              title={activeCategory === "all" ? "Недавнее" : "Результаты"}
              icon={Sparkles}
              plain
            >
              <RecentItemsList
                category={activeCategory}
                statusFilter={statusFilter}
                sortBy={sortBy}
                onReference={(item) => navigate(`/item/${item.id}`)}
                onLongPress={(item) => {
                  setQuickMenu({ isOpen: true, item });
                }}
              />
            </Section>
          </div>

          <div
            className="glass-card"
            style={{
              padding: "0.75rem",
              marginTop: "1.5rem",
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
                title="В процессе"
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
        </div>
        {/* Dialogs */}
        <InputDialog
          isOpen={isListDialogOpen}
          title="Новый список"
          placeholder="Название списка..."
          onConfirm={handleAddList}
          onCancel={() => setIsListDialogOpen(false)}
        />

        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message="Это действие нельзя отменить."
          confirmLabel="Удалить"
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        />

        {quickMenu.item && (
          <QuickActionMenu
            isOpen={quickMenu.isOpen}
            title={quickMenu.item.title}
            onClose={() => setQuickMenu({ isOpen: false, item: null })}
            actions={[
              {
                label: "В процессе",
                icon: <PlayCircle size={18} />,
                color: "var(--primary)",
                onClick: () =>
                  handleUpdateStatus(quickMenu.item!, "in_progress"),
              },
              {
                label: "Завершить",
                icon: <Check size={18} />,
                color: "var(--success)",
                onClick: () => handleUpdateStatus(quickMenu.item!, "completed"),
              },
              {
                label: "В планы",
                icon: <Clock size={18} />,
                color: "var(--text-secondary)",
                onClick: () => handleUpdateStatus(quickMenu.item!, "planned"),
              },
              {
                label: "Бросить",
                icon: <XCircle size={18} />,
                color: "var(--error)",
                onClick: () => handleUpdateStatus(quickMenu.item!, "dropped"),
              },
              {
                label: quickMenu.item.isArchived
                  ? "Разархивировать"
                  : "Архивировать",
                icon: <ArchiveIcon size={18} />,
                color: "var(--text-tertiary)",
                onClick: () => handleArchiveItem(quickMenu.item!),
              },
              {
                label: "Удалить",
                icon: <Trash2 size={18} />,
                color: "var(--error)",
                onClick: () =>
                  setConfirmDialog({
                    isOpen: true,
                    title: `Удалить "${quickMenu.item?.title}"?`,
                    onConfirm: () => handleDeleteItem(quickMenu.item!),
                  }),
              },
            ]}
          />
        )}
      </PullToRefresh>
    </>
  );
};
