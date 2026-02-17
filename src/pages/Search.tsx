import React, { useState, useEffect } from "react";
import {
  Search as SearchIcon,
  Library,
  Globe,
  X,
  History,
  Trash2,
  Ghost,
  Plus,
} from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { searchAll, searchByCategory, getTrending } from "@services/api";
import { useLiveQuery } from "dexie-react-hooks";
import type { Item } from "@types";
import { db } from "@db/db";
import { GridCard } from "@components/GridCard";
import { SkeletonCard } from "@components/SkeletonCard";
import { CategorySelector, type Category } from "@components/CategorySelector";
import { PageHeader } from "@components/PageHeader";
import { motion } from "framer-motion";

import { useLibrarySearch } from "@hooks/useItems";
import { triggerAutoSync } from "@services/dbSync";
import { useToast } from "@context/ToastContext";
import { PullToRefresh } from "@components/PullToRefresh";
import { vibrate } from "@utils/haptics";
import { bulkAddPlannedItems } from "@services/itemService";
import { recognizeMediaFromUrl } from "@services/linkRecognition";

export const Search: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get("category");

  const [query, setQuery] = useState("");
  const [globalResults, setGlobalResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [recognizedItem, setRecognizedItem] = useState<Item | null>(null);
  const [searchMode, setSearchMode] = useState<"global" | "library">("global");
  const [trendingSuggestions, setTrendingSuggestions] = useState<string[]>([]);

  const currentCategory = (categoryParam as Category) || "all";

  // Fetch trending on mount or category change
  useEffect(() => {
    const fetchTrends = async () => {
      // Only for global mode and when no query
      if (searchMode === "global" && !query) {
        const trends = await getTrending(currentCategory as any);
        setTrendingSuggestions(trends);
      }
    };
    fetchTrends();
  }, [currentCategory, searchMode, query]);

  // Hook handles all library search logic reactively
  const libraryResults = useLibrarySearch(query, currentCategory);

  // Filter global results by category
  const filteredGlobalResults =
    currentCategory === "all"
      ? globalResults
      : globalResults.filter((item) => item.type === currentCategory);

  // Unified results based on active mode
  const results =
    searchMode === "library" ? libraryResults || [] : filteredGlobalResults;

  // Get search history from DB
  const searchHistory = useLiveQuery(
    () => db.search_history.reverse().limit(10).toArray(),
    [],
  );

  const searchCounter = React.useRef(0);

  const handleSearch = async (
    targetQuery: string = query,
    e?: React.FormEvent,
  ) => {
    if (e) e.preventDefault();
    const trimmedQuery = targetQuery.trim().toLowerCase();

    // Increment counter to track the latest request
    const currentCounter = ++searchCounter.current;

    // Library search is handled by the hook, so we only need to handle global search here
    if (searchMode === "library") return;

    if (!trimmedQuery) {
      setGlobalResults([]);
      setRecognizedItem(null);
      return;
    }

    setLoading(true);
    setRecognizedItem(null);

    // URL Detection
    if (trimmedQuery.startsWith("http")) {
      try {
        const item = await recognizeMediaFromUrl(trimmedQuery);
        if (item) {
          setRecognizedItem(item as Item);
          setLoading(false);
          return; // No need to perform global search for URL
        }
      } catch (e) {
        console.error("Link recognition error", e);
      }
    }
    try {
      // Remote Search (TMDB/etc)
      let data: any[];
      if (currentCategory === "all") {
        data = await searchAll(trimmedQuery);
      } else {
        data = await searchByCategory(trimmedQuery, currentCategory);
      }

      // Check which results are already in DB
      const externalIds = data.map((i) => i.externalId).filter(Boolean);
      const existingItems = await db.items
        .where("externalId")
        .anyOf(externalIds)
        .toArray();

      const existingMap = new Map();
      existingItems.forEach((item) => {
        if (item.externalId)
          existingMap.set(item.externalId + item.source, item);
      });

      const processedResults = data.map((item) => {
        const existing = existingMap.get(
          (item.externalId || "") + (item.source || ""),
        );
        if (existing) {
          return { ...item, ...existing, isOwned: true };
        }
        return item;
      });
      setGlobalResults((prev) => {
        // Only update if this is still the latest request
        if (currentCounter === searchCounter.current) {
          return processedResults;
        }
        return prev;
      });

      // Save to history if query is not empty
      if (trimmedQuery) {
        await db.search_history.put({
          query: trimmedQuery,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      console.error("Search failed:", error);
      showToast("Ошибка поиска. Проверьте интернет.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Auto-search when URL contains 'q' parameter
  useEffect(() => {
    const queryParam = searchParams.get("q");
    if (queryParam && queryParam.trim()) {
      setQuery(queryParam);
      setSearchMode("global");
      handleSearch(queryParam);
    }
  }, []);

  // Live Search (Debounced)
  useEffect(() => {
    if (searchMode === "library") return;
    if (!query.trim()) {
      setGlobalResults([]);
      return;
    }

    const timer = setTimeout(() => {
      handleSearch(query);
    }, 500); // 500ms delay for live search

    return () => clearTimeout(timer);
  }, [query, searchMode, currentCategory]);

  const inputRef = React.useRef<HTMLInputElement>(null);
  useEffect(() => {
    // Auto focus search on mount
    inputRef.current?.focus();
  }, []);

  const { showToast } = useToast();

  const handleAdd = async (item: any, skipNavigation = false) => {
    if (item.isOwned && item.id) {
      navigate(`/item/${item.id}`);
      return;
    }

    const newItem = {
      ...item,
      status: "planned",
      tags: item.tags || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Item;

    const id = await db.items.add(newItem);

    // Update global results state to show "Owned" immediately if we are in global mode
    if (searchMode === "global") {
      setGlobalResults((prev) =>
        prev.map((r) => {
          if (r.externalId === item.externalId && r.source === item.source) {
            return { ...r, ...newItem, id, isOwned: true };
          }
          return r;
        }),
      );
    }
    triggerAutoSync();

    if (skipNavigation) {
      showToast("Добавлено в планы", "success");
    }
  };

  const clearHistory = async () => {
    await db.search_history.clear();
  };

  const removeHistoryItem = async (q: string) => {
    await db.search_history.delete(q);
  };

  return (
    <PullToRefresh onRefresh={async () => handleSearch(query)}>
      <div>
        <PageHeader title="Поиск" showBack />

        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 20,
            padding: "0.5rem 0",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: "0 -var(--space-md)", // Blur still stretches to edges
              backdropFilter: "blur(20px) saturate(160%)",
              background: "rgba(9, 9, 11, 0.8)",
              zIndex: -1,
              borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
              maskImage:
                "linear-gradient(to bottom, black 95%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, black 95%, transparent 100%)",
            }}
          />
          <div
            style={{
              display: "flex",
              gap: "1rem",
              alignItems: "center",
              marginBottom: "0.75rem",
            }}
          >
            <CategorySelector
              activeCategory={currentCategory}
              onCategoryChange={(cat) => {
                if (cat === "all") {
                  searchParams.delete("category");
                } else {
                  searchParams.set("category", cat);
                }
                setSearchParams(searchParams);
              }}
              style={{ flex: 1, marginBottom: 0 }}
            />
          </div>

          {/* Mode Toggle */}
          <div
            style={{
              display: "flex",
              background: "var(--bg-surface)",
              padding: "4px",
              borderRadius: "12px",
              marginBottom: "0.75rem",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <button
              onClick={() => setSearchMode("global")}
              style={{
                flex: 1,
                padding: "0.6rem",
                borderRadius: "8px",
                border: "none",
                background:
                  searchMode === "global"
                    ? "rgba(139, 92, 246, 0.2)"
                    : "transparent",
                color:
                  searchMode === "global"
                    ? "var(--primary)"
                    : "var(--text-tertiary)",
                fontSize: "0.75rem",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.4rem",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <Globe size={14} /> Глобальный
            </button>
            <button
              onClick={() => setSearchMode("library")}
              style={{
                flex: 1,
                padding: "0.6rem",
                borderRadius: "8px",
                border: "none",
                background:
                  searchMode === "library"
                    ? "rgba(52, 211, 153, 0.2)"
                    : "transparent",
                color:
                  searchMode === "library"
                    ? "var(--success)"
                    : "var(--text-tertiary)",
                fontSize: "0.75rem",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.4rem",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <Library size={14} /> Моя библиотека
            </button>
          </div>

          {/* Search Bar */}
          <form
            onSubmit={(e) => handleSearch(query, e)}
            style={{ position: "relative", marginBottom: "0.5rem" }}
          >
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                searchMode === "global"
                  ? "Что ищем в интернете?"
                  : "Поиск в моей коллекции"
              }
              style={{
                width: "100%",
                padding: "0.85rem 1rem 0.85rem 3rem",
                borderRadius: "var(--radius-lg)",
                fontSize: "1rem",
                backgroundColor: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "var(--text-primary)",
                outline: "none",
                boxShadow: "var(--shadow-md)",
                fontFamily: "var(--font-body)",
              }}
            />
            <SearchIcon
              size={20}
              style={{
                position: "absolute",
                left: "1rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-tertiary)",
              }}
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setGlobalResults([]);
                }}
                style={{
                  position: "absolute",
                  right: "1rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "var(--text-tertiary)",
                  cursor: "pointer",
                }}
              >
                <X size={18} />
              </button>
            )}
          </form>
        </div>

        {/* Content Area (Stable Container) */}
        {!query && !loading && searchMode === "global" ? (
          <div style={{ paddingBottom: "2rem" }}>
            {/* Recent History */}
            {searchHistory && searchHistory.length > 0 && (
              <div style={{ marginBottom: "1.5rem" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.75rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      color: "var(--text-tertiary)",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    <History size={12} /> Недавнее
                  </div>
                  <button
                    onClick={clearHistory}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-tertiary)",
                      fontSize: "0.7rem",
                      cursor: "pointer",
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <div
                  style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}
                >
                  {searchHistory.map((h) => (
                    <motion.div
                      key={h.query}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileTap={{ scale: 0.95 }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        background: "rgba(255,255,255,0.05)",
                        padding: "0.4rem 0.6rem",
                        borderRadius: "8px",
                        cursor: "pointer",
                        border: "1px solid rgba(255,255,255,0.05)",
                      }}
                    >
                      <span
                        onClick={() => {
                          setQuery(h.query);
                          handleSearch(h.query);
                        }}
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {h.query}
                      </span>
                      <X
                        size={12}
                        color="var(--text-tertiary)"
                        onClick={() => removeHistoryItem(h.query)}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Suggestions */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  color: "var(--text-tertiary)",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: "0.75rem",
                }}
              >
                🚀{" "}
                {currentCategory === "movie"
                  ? "Сейчас в кино"
                  : currentCategory === "game"
                    ? "Популярные игры"
                    : "Популярные запросы"}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {(trendingSuggestions.length > 0
                  ? trendingSuggestions
                  : [
                      "Inception",
                      "Cyberpunk 2077",
                      "Harry Potter",
                      "Dune",
                      "Interstellar",
                    ]
                ).map((term) => (
                  <motion.button
                    key={term}
                    whileHover={{
                      scale: 1.05,
                      backgroundColor: "rgba(139, 92, 246, 0.2)",
                    }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setQuery(term);
                      handleSearch(term);
                    }}
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "14px",
                      padding: "0.6rem 1.1rem",
                      color: "var(--text-secondary)",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      backdropFilter: "blur(10px)",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                    }}
                  >
                    {term}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          (query || loading) && (
            <div style={{ width: "100%" }}>
              {/* Search Results */}
              <div
                className="grid-layout"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
                  gap: "0.75rem",
                  padding: "0.25rem",
                  maxWidth: "100%",
                }}
              >
                {/* Recognized Link Result */}
                {recognizedItem && (
                  <div style={{ gridColumn: "1 / -1", marginBottom: "1rem" }}>
                    <label
                      className="section-label"
                      style={{ marginBottom: "0.75rem" }}
                    >
                      Найдено по ссылке
                    </label>
                    <GridCard
                      item={recognizedItem}
                      index={0}
                      onClick={() => {
                        const targetId =
                          recognizedItem.id || recognizedItem.externalId;
                        const url = (recognizedItem as any).isOwned
                          ? `/item/${targetId}`
                          : `/item/${targetId}?source=${recognizedItem.source}`;
                        navigate(url);
                      }}
                      onQuickAdd={() => handleAdd(recognizedItem, true)}
                    />
                    <div
                      style={{
                        marginTop: "0.5rem",
                        fontSize: "0.75rem",
                        color: "var(--text-tertiary)",
                        textAlign: "center",
                      }}
                    >
                      Мы распознали этот контент по ссылке
                    </div>
                  </div>
                )}

                {results.length === 0 && loading
                  ? [1, 2, 3, 4, 5, 6].map((_, idx) => (
                      <SkeletonCard key={`skeleton-${idx}`} />
                    ))
                  : results.map((item, idx) => (
                      <GridCard
                        key={`${item.source}-${item.externalId || item.id || idx}`}
                        item={item as Item}
                        index={idx}
                        enableMotion={results.length === 0}
                        onClick={() => {
                          const targetId = item.id || item.externalId;
                          const url = (item as any).isOwned
                            ? `/item/${targetId}`
                            : `/item/${targetId}?source=${item.source}`;
                          navigate(url);
                        }}
                        onQuickAdd={() => handleAdd(item, true)}
                      />
                    ))}
              </div>

              {searchMode === "global" && results.length > 0 && !loading && (
                <div
                  style={{
                    padding: "2rem 1rem",
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={async () => {
                      vibrate("medium");
                      const result = await bulkAddPlannedItems(
                        results as Item[],
                      );
                      if (result.added > 0) {
                        showToast(
                          `Добавлено ${result.added} элементов`,
                          "success",
                        );
                        // Refresh state for global results to show 'Owned'
                        handleSearch(query);
                      } else if (result.skipped > 0) {
                        showToast("Все элементы уже в библиотеке", "info");
                      }
                    }}
                    style={{
                      background: "var(--primary-15)",
                      color: "var(--primary)",
                      border: "1px solid var(--primary-20)",
                      padding: "0 1rem",
                      height: "36px", // Slightly larger for search because it's a main action there
                      borderRadius: "var(--radius-md)",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      transition: "all 0.2s",
                    }}
                  >
                    <Plus size={16} strokeWidth={3} />
                    Добавить все результаты
                  </motion.button>
                </div>
              )}

              {!loading && results.length === 0 && query && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "4rem 1rem",
                    color: "var(--text-tertiary)",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      padding: "1.5rem",
                      borderRadius: "50%",
                      marginBottom: "1rem",
                    }}
                  >
                    <Ghost size={48} strokeWidth={1.5} />
                  </div>
                  <p
                    style={{
                      margin: "0 0 0.5rem 0",
                      fontSize: "1.1rem",
                      fontWeight: 600,
                    }}
                  >
                    Ничего не найдено
                  </p>
                  <p
                    style={{
                      fontSize: "0.9rem",
                      maxWidth: "250px",
                      opacity: 0.7,
                    }}
                  >
                    Попробуйте изменить запрос или поискать в другой категории
                  </p>
                </motion.div>
              )}
            </div>
          )
        )}
      </div>
    </PullToRefresh>
  );
};
