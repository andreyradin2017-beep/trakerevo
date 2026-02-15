import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";
import {
  Trash2,
  Edit2,
  Save,
  X,
  CheckSquare,
  Square,
  Archive as ArchiveIcon,
  CheckCircle2,
  List as ListIcon,
} from "lucide-react";
import { Skeleton } from "../components/Skeleton";
import { SkeletonList } from "../components/SkeletonList";
import { EmptyState } from "../components/EmptyState";
import { PageHeader } from "../components/PageHeader";
import { CompactListItem } from "../components/CompactListItem";
import { Swipeable } from "../components/Swipeable";
import type { Item } from "../types";
import { motion, AnimatePresence } from "framer-motion";
import { triggerAutoSync } from "../services/dbSync";

export const ListPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const listId = Number(id);

  const data = useLiveQuery(async () => {
    if (!listId) return null;
    const list = await db.lists.get(listId);
    const items = await db.items.where("listId").equals(listId).toArray();
    return { list, items };
  }, [listId]);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  if (!data?.list) {
    // ... (skeleton code stays the same, I'll keep it concise in replacement)
    return (
      <div style={{ padding: "1rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "1.5rem",
            gap: "1rem",
          }}
        >
          <Skeleton width={40} height={40} borderRadius="50%" />
          <Skeleton width={200} height={32} />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{ marginBottom: "0.5rem" }}>
            <SkeletonList />
          </div>
        ))}
      </div>
    );
  }

  const { list, items } = data;

  const startEdit = () => {
    setEditName(list.name);
    setIsEditing(true);
  };

  const saveName = async () => {
    if (editName.trim()) {
      await db.lists.update(listId, {
        name: editName,
        updatedAt: new Date(),
      });
      triggerAutoSync();
    }
    setIsEditing(false);
  };

  const deleteList = async () => {
    if (
      window.confirm(
        "Удалить этот список? Элементы останутся, но не будут привязаны к списку.",
      )
    ) {
      await db.items
        .where("listId")
        .equals(listId)
        .modify({ listId: undefined, updatedAt: new Date() });

      if (list.supabaseId) {
        await db.deleted_metadata.put({
          id: list.supabaseId,
          table: "lists",
          timestamp: Date.now(),
        });
      }

      await db.lists.delete(listId);
      triggerAutoSync();
      navigate("/");
    }
  };

  const handleDeleteItem = async (itemId?: number) => {
    if (!itemId) return;
    const item = await db.items.get(itemId);
    if (item?.supabaseId) {
      await db.deleted_metadata.put({
        id: item.supabaseId,
        table: "items",
        timestamp: new Date().getTime(),
      });
    }
    await db.items.delete(itemId);
    triggerAutoSync();
  };

  const handleArchiveItem = async (itemId?: number, isArchived?: boolean) => {
    if (!itemId) return;
    await db.items.update(itemId, {
      isArchived: !isArchived,
      updatedAt: new Date(),
    });
    triggerAutoSync();
  };

  const toggleSelection = (itemId?: number) => {
    if (!itemId) return;
    setSelectedIds((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId],
    );
  };

  const handleMassDelete = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Удалить выбранные элементы (${selectedIds.length})?`)) {
      const selectedItems = await db.items
        .where("id")
        .anyOf(selectedIds)
        .toArray();
      for (const item of selectedItems) {
        if (item.supabaseId) {
          await db.deleted_metadata.put({
            id: item.supabaseId,
            table: "items",
            timestamp: new Date().getTime(),
          });
        }
      }
      await db.items.bulkDelete(selectedIds);
      setSelectedIds([]);
      setSelectionMode(false);
      triggerAutoSync();
    }
  };

  const handleMassArchive = async () => {
    if (selectedIds.length === 0) return;
    // In mass archive, we toggle based on the majority or just set to archived
    await db.items
      .where("id")
      .anyOf(selectedIds)
      .modify({ isArchived: true, updatedAt: new Date() });
    setSelectedIds([]);
    setSelectionMode(false);
    triggerAutoSync();
  };

  return (
    <div style={{ paddingBottom: "5rem" }}>
      <PageHeader
        title={list.name}
        showBack={!selectionMode}
        leftElement={
          selectionMode ? (
            <button
              onClick={() => {
                setSelectionMode(false);
                setSelectedIds([]);
              }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-secondary)",
                fontWeight: 600,
                fontSize: "0.9rem",
              }}
            >
              Отмена
            </button>
          ) : null
        }
        rightElement={
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            {selectionMode ? (
              <div
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  color: "var(--primary)",
                }}
              >
                Вбрано: {selectedIds.length}
              </div>
            ) : isEditing ? (
              <>
                <button
                  onClick={saveName}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--primary)",
                    padding: "0.5rem",
                  }}
                >
                  <Save size={20} />
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-secondary)",
                    padding: "0.5rem",
                  }}
                >
                  <X size={20} />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setSelectionMode(true)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-secondary)",
                    padding: "0.5rem",
                  }}
                  title="Выбрать несколько"
                >
                  <CheckSquare size={18} />
                </button>
                <button
                  onClick={startEdit}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-secondary)",
                    padding: "0.5rem",
                  }}
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={deleteList}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--error)",
                    padding: "0.5rem",
                  }}
                >
                  <Trash2 size={18} />
                </button>
              </>
            )}
          </div>
        }
      />

      {isEditing && (
        <div style={{ marginBottom: "1.5rem" }}>
          <input
            autoFocus
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Название списка"
            style={{
              width: "100%",
              padding: "0.75rem 1rem",
              borderRadius: "var(--radius-lg)",
              backgroundColor: "var(--bg-surface)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "var(--text-primary)",
              fontSize: "1rem",
              fontWeight: 600,
            }}
          />
        </div>
      )}

      {/* List Items Container */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {items && items.length > 0 ? (
          items.map((item: Item) => (
            <Swipeable
              key={item.id}
              disabled={selectionMode}
              onDelete={() => handleDeleteItem(item.id)}
              onArchive={() => handleArchiveItem(item.id, item.isArchived)}
            >
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  gap: selectionMode ? "0.75rem" : 0,
                }}
              >
                {selectionMode && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => toggleSelection(item.id)}
                    style={{
                      color: selectedIds.includes(item.id!)
                        ? "var(--primary)"
                        : "var(--text-tertiary)",
                      cursor: "pointer",
                    }}
                  >
                    {selectedIds.includes(item.id!) ? (
                      <CheckCircle2 size={24} />
                    ) : (
                      <Square size={24} />
                    )}
                  </motion.div>
                )}
                <CompactListItem
                  item={item}
                  onClick={() =>
                    selectionMode
                      ? toggleSelection(item.id)
                      : navigate(`/item/${item.id}`)
                  }
                  style={{
                    flex: 1,
                    borderBottom: "none",
                    backgroundColor: selectedIds.includes(item.id!)
                      ? "rgba(139, 92, 246, 0.1)"
                      : "var(--bg-surface)",
                    borderRadius: "8px",
                    padding: "0.6rem 0.75rem",
                    transition: "background-color 0.2s",
                  }}
                />
              </div>
            </Swipeable>
          ))
        ) : (
          <EmptyState
            message="В этом списке пока пусто."
            icon={<ListIcon size={32} style={{ opacity: 0.5 }} />}
            action={{
              label: "Добавить элемент",
              onClick: () => navigate("/search"),
            }}
          />
        )}
      </div>

      {/* Selection Toolbar */}
      <AnimatePresence>
        {selectionMode && selectedIds.length > 0 && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            style={{
              position: "fixed",
              bottom: "1.5rem",
              left: "1rem",
              right: "1rem",
              background: "rgba(20, 20, 20, 0.95)",
              backdropFilter: "blur(10px)",
              padding: "1rem 1.5rem",
              borderRadius: "16px",
              display: "flex",
              justifyContent: "space-around",
              alignItems: "center",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              border: "1px solid rgba(255,255,255,0.1)",
              zIndex: 100,
            }}
          >
            <button
              onClick={handleMassArchive}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-primary)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
                fontSize: "0.7rem",
                cursor: "pointer",
              }}
            >
              <ArchiveIcon size={20} /> В архив
            </button>
            <button
              onClick={handleMassDelete}
              style={{
                background: "none",
                border: "none",
                color: "var(--error)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
                fontSize: "0.7rem",
                cursor: "pointer",
              }}
            >
              <Trash2 size={20} /> Удалить
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
