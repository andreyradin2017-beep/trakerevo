import React, { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "@db/db";
import type { Item } from "@types";

import { BentoTile } from "@components/BentoTile";
import { ItemHeader } from "@components/ItemHeader";
import { ItemStatsEditor } from "@components/ItemStatsEditor";
import { ItemMetadataDetails } from "@components/ItemMetadataDetails";
import { PageHeader } from "@components/PageHeader";
import { HLTBTile } from "@components/HLTBTile";
import { DetailDescription } from "@components/DetailDescription";
import { ItemNotesAndList } from "@components/ItemNotesAndList";
import { getDetails } from "@services/api";
import { useToast } from "@context/ToastContext";
import { notificationOccurred } from "@utils/haptics";
import { triggerAutoSync } from "@services/dbSync";
import { AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";

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
    related?: {
      externalId: string;
      title: string;
      image?: string;
      type: string;
    }[];
    hltb?: { main: string; extra: string; completionist: string };
    authors?: string[];
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
  const queryParams = new URLSearchParams(window.location.search);
  const sourceParam = queryParams.get("source");

  useEffect(() => {
    if (id) {
      setLoading(true);

      const fetchItem = async () => {
        try {
          let found: Item | undefined;

          // 1. If source is specified, it's definitely an externalId lookup
          if (sourceParam && id) {
            found = await db.items
              .where("[externalId+source]")
              .equals([id, sourceParam])
              .first();
          }

          // 2. Try by local auto-increment ID (only if it looks like a local ID and no source was found)
          if (!found) {
            const numericId = Number(id);
            if (!isNaN(numericId)) {
              found = await db.items.get(numericId);
            }
          }

          // 3. Last resort: try externalId alone (backward compatibility)
          if (!found && id) {
            found = await db.items.where("externalId").equals(id).first();
          }

          // 4. Try searching by supabaseId (UUID)
          if (!found && id && id.includes("-")) {
            found = await db.items.where("supabaseId").equals(id).first();
          }

          if (found) {
            setItem(found);
            setStatus(found.status);
            setNotes(found.notes || "");
            setProgress(found.progress || 0);
            setTotalProgress(found.totalProgress || 0);
            setSelectedListId(found.listId);
            setCurrentSeason(found.currentSeason || 1);
            setCurrentEpisode(found.currentEpisode || 1);
            setIsArchived(found.isArchived || false);

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
          } else if (sourceParam && id) {
            // Preview Mode: Item not in DB, but we have external ID and source
            // We fetch details to show the page
            getDetails({ externalId: id, source: sourceParam } as any)
              .then((data: any) => {
                if (data) {
                  setExtraMetadata(data);
                  setItem({
                    title: data.title || "Загрузка...",
                    type: data.type || "movie",
                    source: sourceParam as any,
                    externalId: id,
                    image: data.image,
                    description: data.description,
                    year: data.year,
                    tags: data.genres || [],
                    status: "planned",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  } as Item);
                }
              })
              .catch((err) => {
                console.error("Failed to load preview details:", err);
              });
          }
          setLoading(false);
        } catch (err) {
          console.error("Failed to load item:", err);
          setLoading(false);
        }
      };

      fetchItem();
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

  const handleQuickAddRecord = async () => {
    if (!item) return;
    const newItem: Item = {
      ...item,
      status: "planned",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    if ("id" in newItem) delete (newItem as any).id;
    const newId = await db.items.add(newItem);
    notificationOccurred("success");
    showToast(`«${item.title}» добавлена в библиотеку`, "success");
    triggerAutoSync();
    // Swap URL to local ID to enable full editing without full page reload if possible
    // but navigating is cleaner
    navigate(`/item/${newId}`, { replace: true });
  };

  if (loading)
    return (
      <div className="flex-center" style={{ height: "100vh" }}>
        Загрузка...
      </div>
    );
  if (!item)
    return (
      <div className="flex-center" style={{ height: "100vh" }}>
        Элемент не найден
      </div>
    );

  const isTVShow = item.type === "show";

  return (
    <>
      <AnimatePresence>
        {showTrailer && extraMetadata?.trailer && (
          <div
            onClick={() => setShowTrailer(false)}
            className="flex-center"
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1000,
              background: "rgba(0,0,0,0.9)",
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
      </AnimatePresence>

      <PageHeader
        title="Детали"
        showBack
        onBack={() => navigate(-1)}
        showSyncStatus={false}
        style={{
          paddingTop: "var(--space-md)",
          marginBottom: "var(--space-md)",
        }}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "0.75rem",
          maxWidth: "800px",
          margin: "0 auto",
          paddingBottom: "120px",
        }}
      >
        <BentoTile colSpan={2} style={{ padding: 0 }} delay={0.1}>
          <ItemHeader
            title={item.title}
            image={item.image}
            type={item.type}
            year={item.year}
            hasTrailer={!!extraMetadata?.trailer}
            source={item.source}
            genres={extraMetadata?.genres || item.tags}
            authors={extraMetadata?.authors || item.authors}
            onShowTrailer={() => setShowTrailer(true)}
            onAuthorClick={(author) => {
              navigate(`/search?q=${encodeURIComponent(author)}&category=book`);
            }}
          />
        </BentoTile>

        {/* Row 1.5: Description */}
        {(item.description || extraMetadata?.description) && (
          <DetailDescription
            description={extraMetadata?.description || item.description || ""}
            delay={0.15}
          />
        )}

        {/* Game completion time (HLTB) */}
        {item.type === "game" && extraMetadata?.hltb && (
          <HLTBTile hltb={extraMetadata.hltb} delay={0.18} />
        )}

        {/* Row 2: Status Tracking or Add Button */}
        <BentoTile colSpan={2} delay={0.2}>
          {item.id ? (
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
          ) : (
            <div
              className="flex-center flex-column"
              style={{ padding: "1.5rem", gap: "1rem" }}
            >
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "var(--text-secondary)",
                  textAlign: "center",
                  margin: 0,
                }}
              >
                Этот элемент еще не добавлен в вашу библиотеку
              </p>
              <button
                onClick={handleQuickAddRecord}
                className="flex-center"
                style={{
                  width: "100%",
                  padding: "0.85rem",
                  borderRadius: "12px",
                  background: "var(--primary)",
                  color: "white",
                  border: "none",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  gap: "0.5rem",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(139, 92, 246, 0.3)",
                }}
              >
                <Plus size={18} /> Добавить в планы
              </button>
            </div>
          )}
        </BentoTile>

        {/* Row 3: Notes & List (Only if owned) */}
        {item.id ? (
          <ItemNotesAndList
            notes={notes}
            setNotes={setNotes}
            selectedListId={selectedListId}
            setSelectedListId={setSelectedListId}
            lists={lists}
            onSave={handleSave}
            onDelete={handleDelete}
          />
        ) : null}

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
    </>
  );
};
