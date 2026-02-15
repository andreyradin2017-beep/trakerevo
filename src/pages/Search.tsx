import React, { useState, useEffect } from "react";
import {
  Search as SearchIcon,
  Library,
  Globe,
  X,
  History,
  Trash2,
  Ghost,
} from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { searchAll, searchByCategory } from "../services/api";
import { useLiveQuery } from "dexie-react-hooks";
import type { Item } from "../types";
import { db } from "../db/db";
import { GridCard } from "../components/GridCard";
import { SkeletonCard } from "../components/SkeletonCard";
import {
  CategorySelector,
  type Category,
} from "../components/CategorySelector";
import { PageHeader } from "../components/PageHeader";
import { motion, AnimatePresence } from "framer-motion";

import { useLibrarySearch } from "../hooks/useItems";
import { triggerAutoSync } from "../services/dbSync";
import { useToast } from "../context/ToastContext";

export const Search: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get("category");

  const [query, setQuery] = useState("");
  const [globalResults, setGlobalResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchMode, setSearchMode] = useState<"global" | "library">("global");

  const currentCategory =
    (categoryParam as Category) ||
    (localStorage.getItem("lastSearchCategory") as Category) ||
    "all";

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

  const handleSearch = async (
    targetQuery: string = query,
    e?: React.FormEvent,
  ) => {
    if (e) e.preventDefault();
    const trimmedQuery = targetQuery.trim().toLowerCase();

    // Library search is handled by the hook, so we only need to handle global search here
    if (searchMode === "library") return;

    if (!trimmedQuery) {
      setGlobalResults([]);
      return;
    }

    setLoading(true);
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
      setGlobalResults(processedResults);

      // Save to history if query is not empty
      if (trimmedQuery) {
        await db.search_history.put({
          query: trimmedQuery,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-search when URL contains 'q' parameter (e.g., from recommendations)
  useEffect(() => {
    const queryParam = searchParams.get("q");
    if (queryParam && queryParam.trim()) {
      setQuery(queryParam);
      setSearchMode("global");
      handleSearch(queryParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on mount

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
    } else {
      navigate(`/item/${id}`);
    }
  };

  const clearHistory = async () => {
    await db.search_history.clear();
  };

  const removeHistoryItem = async (q: string) => {
    await db.search_history.delete(q);
  };

  return (
    <div style={{ paddingBottom: "2rem" }}>
      <PageHeader title="Поиск" showBack />

      <div
        style={{
          display: "flex",
          gap: "1rem",
          alignItems: "center",
          marginBottom: "1.25rem",
        }}
      >
        <CategorySelector
          activeCategory={currentCategory}
          onCategoryChange={(cat) => {
            localStorage.setItem("lastSearchCategory", cat);
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
          marginBottom: "1.25rem",
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
        style={{ position: "relative", marginBottom: "1rem" }}
      >
        <input
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
            backgroundColor: "var(--bg-surface)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "var(--text-primary)",
            outline: "none",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
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

      {/* History Section */}
      {!query &&
        !loading &&
        searchMode === "global" &&
        searchHistory &&
        searchHistory.length > 0 && (
          <div style={{ marginBottom: "2rem" }}>
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
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
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

      {/* Results Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: "0.75rem",
        }}
      >
        <AnimatePresence mode="popLayout">
          {loading
            ? [1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)
            : results.map((item, idx) => (
                <GridCard
                  key={item.externalId || item.id || idx}
                  item={item as Item}
                  index={idx}
                  onClick={() => {
                    // Navigate to details
                    if (item.isOwned && item.id) {
                      navigate(`/item/${item.id}`);
                    } else {
                      // If not owned, open details (which has add button)
                      // or we could add immediately.
                      // User asked "must go to card", implying they want to just click to add?
                      // But existing logic was: click -> add.
                      // If we have Quick Add button, click -> details is better UX?
                      // Let's keep click -> add/details for now, but handle Quick Add strictly as ADD.

                      // Actually, let's make the main click navigate to details preview (if we had one) or add.
                      // For now, keep existing behavior: click = add/view
                      handleAdd(item);
                    }
                  }}
                  onQuickAdd={() => handleAdd(item, true)}
                />
              ))}
        </AnimatePresence>
      </div>

      {!loading && results.length === 0 && query && (
        <div
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
          <p style={{ fontSize: "0.9rem", maxWidth: "250px", opacity: 0.7 }}>
            Попробуйте изменить запрос или поискать в другой категории
          </p>
        </div>
      )}
    </div>
  );
};
