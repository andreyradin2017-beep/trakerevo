import React, { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../db/db";
import type { Item, List } from "../types";
import { Trash2, Save } from "lucide-react";

import { ItemHeader } from "../components/ItemHeader";
import { ItemStatsEditor } from "../components/ItemStatsEditor";
import { ItemMetadataDetails } from "../components/ItemMetadataDetails";
import { getDetails } from "../services/api";
import { useToast } from "../context/ToastContext";
import { notificationOccurred } from "../utils/haptics";
import { triggerAutoSync } from "../services/dbSync";

export const ItemDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit states
  const [status, setStatus] = useState<Item["status"]>("planned");
  const [notes, setNotes] = useState("");
  const [progress, setProgress] = useState(0);
  const [totalProgress, setTotalProgress] = useState(0);
  const [selectedListId, setSelectedListId] = useState<number | undefined>(
    undefined,
  );

  // Advanced States
  const [currentSeason, setCurrentSeason] = useState(1);
  const [currentEpisode, setCurrentEpisode] = useState(1);
  const [isArchived, setIsArchived] = useState(false);

  const [extraMetadata, setExtraMetadata] = useState<{
    trailer?: string;
    providers?: { name: string; logo: string }[];
    related?: { id: string; title: string; image?: string; type: string }[];
  } | null>(null);
  const [showTrailer, setShowTrailer] = useState(false);

  // Collapsible states
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    providers: false,
    related: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const lists = useLiveQuery(() => db.lists.toArray());

  useEffect(() => {
    if (id) {
      db.items
        .get(Number(id))
        .then(async (found: Item | undefined) => {
          if (found) {
            // Set local data immediately
            setItem(found);
            setStatus(found.status);
            setNotes(found.notes || "");
            setProgress(found.progress || 0);
            setTotalProgress(found.totalProgress || 0);
            setSelectedListId(found.listId);
            setCurrentSeason(found.currentSeason || 1);
            setCurrentEpisode(found.currentEpisode || 1);
            setIsArchived(found.isArchived || false);

            setLoading(false); // Unblock UI immediately

            // Fetch external details in background
            if (found.externalId) {
              getDetails(found)
                .then((data) => {
                  if (data) setExtraMetadata(data);
                })
                .catch((error) => {
                  console.error("Failed to load external details:", error);
                });
            }
          } else {
            setLoading(false);
          }
        })
        .catch((err) => {
          console.error("Failed to load item:", err);
          setLoading(false);
        });
    }
  }, [id]);

  const { showToast } = useToast();

  const handleSave = async () => {
    if (!item?.id) return;

    await db.items.update(item.id, {
      status,
      notes,
      progress,
      totalProgress,
      listId: selectedListId,
      currentSeason,
      currentEpisode,
      isArchived,
      updatedAt: new Date(),
    });
    notificationOccurred("success");
    showToast("Изменения сохранены", "success");
    triggerAutoSync();
    navigate(-1);
  };

  const toggleArchive = async () => {
    if (!item?.id) return;
    const nextState = !isArchived;
    setIsArchived(nextState);
    await db.items.update(item.id, {
      isArchived: nextState,
      updatedAt: new Date(),
    });
    triggerAutoSync();
  };

  const handleDelete = async () => {
    if (!item?.id || !window.confirm("Удалить этот элемент?")) return;

    if (item.supabaseId) {
      await db.deleted_metadata.put({
        id: item.supabaseId,
        table: "items",
        timestamp: Date.now(),
      });
    }

    await db.items.delete(item.id);
    notificationOccurred("success");
    showToast("Элемент удален", "info");
    triggerAutoSync();
    navigate(-1);
  };

  if (loading)
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>Загрузка...</div>
    );
  if (!item)
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        Элемент не найден
      </div>
    );

  const isTVShow = item.type === "show";

  return (
    <div style={{ paddingBottom: "120px" }}>
      {showTrailer && extraMetadata?.trailer && (
        <div
          onClick={() => setShowTrailer(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(0,0,0,0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "800px",
              aspectRatio: "16/9",
              background: "black",
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            <iframe
              src={extraMetadata.trailer}
              style={{ width: "100%", height: "100%", border: "none" }}
              allowFullScreen
            />
          </div>
        </div>
      )}

      <ItemHeader
        title={item.title}
        image={item.image}
        type={item.type}
        year={item.year}
        hasTrailer={!!extraMetadata?.trailer}
        onBack={() => navigate(-1)}
        onShowTrailer={() => setShowTrailer(true)}
      />

      <div
        style={{
          backgroundColor: "var(--bg-surface)",
          borderRadius: "var(--radius-xl)",
          overflow: "hidden",
          border: "var(--border-glass)",
          paddingBottom: "1.25rem",
          paddingTop: "1.25rem",
        }}
      >
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
        >
          <ItemStatsEditor
            status={status}
            itemType={item.type}
            isArchived={isArchived}
            isTVShow={isTVShow}
            currentSeason={currentSeason}
            currentEpisode={currentEpisode}
            progress={progress}
            totalProgress={totalProgress}
            onStatusChange={setStatus}
            onArchiveToggle={toggleArchive}
            onSeasonChange={setCurrentSeason}
            onEpisodeChange={setCurrentEpisode}
            onProgressChange={setProgress}
          />

          <div style={{ padding: "0 1.25rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.4rem",
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "var(--text-tertiary)",
                textTransform: "uppercase",
              }}
            >
              Заметки
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "var(--radius-lg)",
                backgroundColor: "rgba(0,0,0,0.2)",
                color: "var(--text-primary)",
                border: "1px solid rgba(255,255,255,0.05)",
                resize: "none",
                fontSize: "0.9rem",
                outline: "none",
              }}
              placeholder="Напишите что-нибудь..."
            />
          </div>

          <div style={{ padding: "0 1.25rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.75rem",
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "var(--text-tertiary)",
                textTransform: "uppercase",
              }}
            >
              Список
            </label>
            <select
              value={selectedListId || ""}
              onChange={(e) =>
                setSelectedListId(
                  e.target.value ? Number(e.target.value) : undefined,
                )
              }
              style={{
                width: "100%",
                height: "50px",
                padding: "0 2.5rem 0 1rem",
                borderRadius: "var(--radius-lg)",
                backgroundColor: "rgba(0,0,0,0.2)",
                color: "var(--text-primary)",
                border: "1px solid rgba(255,255,255,0.05)",
                fontSize: "0.95rem",
                fontWeight: 600,
                outline: "none",
                appearance: "none",
                cursor: "pointer",
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 0.75rem center",
                backgroundSize: "1.25rem",
              }}
            >
              <option value="">Без списка</option>
              {lists?.map((list: List) => (
                <option key={list.id} value={list.id}>
                  {list.name}
                </option>
              ))}
            </select>
          </div>

          <ItemMetadataDetails
            extraMetadata={extraMetadata}
            expandedSections={expandedSections}
            toggleSection={toggleSection}
            onNavigateToSearch={(title) =>
              navigate(`/search?q=${encodeURIComponent(title)}`)
            }
          />

          <div
            style={{
              display: "flex",
              gap: "1rem",
              marginTop: "1.5rem",
              borderTop: "1px solid rgba(255,255,255,0.05)",
              paddingTop: "1.5rem",
              padding: "1.5rem 1.25rem 0.5rem",
            }}
          >
            <button
              onClick={handleSave}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                background: "var(--primary-gradient)",
                color: "white",
                padding: "1.1rem",
                borderRadius: "var(--radius-lg)",
                border: "none",
                fontWeight: 700,
                fontSize: "1rem",
                cursor: "pointer",
                boxShadow: "0 4px 15px rgba(139, 92, 246, 0.3)",
              }}
            >
              <Save size={20} /> Сохранить
            </button>
            <button
              onClick={handleDelete}
              style={{
                width: "60px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                color: "var(--error)",
                borderRadius: "var(--radius-lg)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                cursor: "pointer",
              }}
            >
              <Trash2 size={24} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
