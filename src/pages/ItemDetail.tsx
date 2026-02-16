import React, { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "@db/db";
import type { Item, List } from "@types";
import { Trash2, Save } from "lucide-react";

import { BentoTile } from "@components/BentoTile";
import { ItemHeader } from "@components/ItemHeader";
import { ItemStatsEditor } from "@components/ItemStatsEditor";
import { ItemMetadataDetails } from "@components/ItemMetadataDetails";
import { getDetails } from "@services/api";
import { useToast } from "@context/ToastContext";
import { notificationOccurred } from "@utils/haptics";
import { triggerAutoSync } from "@services/dbSync";

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
    description?: string;
    genres?: string[];
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
                .then((data: any) => {
                  if (data) setExtraMetadata(data);
                })
                .catch((error: any) => {
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
    <div
      style={{
        paddingBottom: "120px",
        paddingTop: "var(--space-xs)",
      }}
    >
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

      {/* Main Grid Wrapper */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "0.75rem",
          maxWidth: "800px",
          margin: "0 auto",
        }}
      >
        {/* Row 1: Hero Block */}
        <BentoTile colSpan={2} style={{ padding: 0 }} delay={0.1}>
          <ItemHeader
            title={item.title}
            image={item.image}
            type={item.type}
            year={item.year}
            hasTrailer={!!extraMetadata?.trailer}
            source={item.source}
            genres={extraMetadata?.genres || item.tags}
            onBack={() => navigate(-1)}
            onShowTrailer={() => setShowTrailer(true)}
          />
        </BentoTile>

        {/* Row 1.5: Description (if available) */}
        {(item.description || extraMetadata?.description) && (
          <BentoTile colSpan={2} delay={0.15} style={{ padding: "1.25rem" }}>
            <label className="section-label" style={{ marginBottom: "0.5rem" }}>
              Об инструменте / Сюжет
            </label>
            <p
              style={{
                fontSize: "0.9rem",
                lineHeight: "1.6",
                color: "var(--text-secondary)",
                margin: 0,
                whiteSpace: "pre-wrap",
              }}
            >
              {extraMetadata?.description || item.description}
            </p>
          </BentoTile>
        )}

        {/* Row 2: Status Tracking */}
        <BentoTile colSpan={2} delay={0.2}>
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
        </BentoTile>

        {/* Row 3: Notes & List */}
        <BentoTile
          colSpan={window.innerWidth > 600 ? 1 : 2}
          delay={0.3}
          style={{ gap: "0.5rem" }}
        >
          <label className="section-label">Заметки</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: "var(--radius-md)",
              backgroundColor: "rgba(0,0,0,0.2)",
              color: "var(--text-primary)",
              border: "1px solid rgba(255,255,255,0.05)",
              resize: "none",
              fontSize: "0.9rem",
              outline: "none",
              flex: 1,
            }}
            placeholder="О чем этот тайтл? Или ваши мысли..."
          />
        </BentoTile>

        <BentoTile colSpan={window.innerWidth > 600 ? 1 : 2} delay={0.4}>
          <label className="section-label" style={{ marginBottom: "0.75rem" }}>
            Настройка
          </label>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <div>
              <span
                style={{
                  fontSize: "0.7rem",
                  color: "var(--text-tertiary)",
                  marginBottom: "0.25rem",
                  display: "block",
                }}
              >
                Список
              </span>
              <select
                value={selectedListId || ""}
                onChange={(e) =>
                  setSelectedListId(
                    e.target.value ? Number(e.target.value) : undefined,
                  )
                }
                style={{
                  width: "100%",
                  height: "44px",
                  padding: "0 1rem",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "rgba(0,0,0,0.2)",
                  color: "var(--text-primary)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  outline: "none",
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

            <div style={{ display: "flex", gap: "0.5rem", marginTop: "auto" }}>
              <button
                onClick={handleSave}
                className="btn btn-primary"
                style={{ flex: 1, height: "50px" }}
              >
                <Save size={18} /> Сохранить
              </button>
              <button
                onClick={handleDelete}
                className="btn-icon"
                style={{
                  height: "50px",
                  width: "50px",
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  color: "var(--error)",
                }}
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        </BentoTile>

        {/* Row 4: External Metadata */}
        {extraMetadata?.providers?.length || extraMetadata?.related?.length ? (
          <BentoTile colSpan={2} delay={0.5} style={{ padding: "0.5rem 0" }}>
            <ItemMetadataDetails
              extraMetadata={extraMetadata}
              expandedSections={expandedSections}
              toggleSection={toggleSection}
              onNavigateToSearch={(title) =>
                navigate(`/search?q=${encodeURIComponent(title)}`)
              }
            />
          </BentoTile>
        ) : null}
      </div>
    </div>
  );
};
