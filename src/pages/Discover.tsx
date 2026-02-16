import React, { useEffect, useState } from "react";
import { Flame, Calendar, Gamepad2, Ghost, CalendarClock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getDiscoverData } from "@services/discover";
import { db } from "@db/db";
import type { Item } from "@types";
import { PageHeader } from "@components/PageHeader";
import { CountdownBadge } from "@components/CountdownBadge";
import { motion } from "framer-motion";
import { getProxiedImageUrl } from "@utils/images";
import { vibrate } from "@utils/haptics";
import { useToast } from "@context/ToastContext";
import { triggerAutoSync } from "@services/dbSync";
import { Section } from "@components/Section";

interface DiscoverSection {
  title: string;
  icon: React.ReactNode;
  items: Item[];
  gradient: string;
}

const DiscoverCard: React.FC<{
  item: Item;
  onAdd: (item: Item) => void;
}> = ({ item, onAdd }) => {
  const isFuture = item.releaseDate && new Date(item.releaseDate) > new Date();

  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      onClick={() => onAdd(item)}
      style={{
        minWidth: "124px",
        width: "124px",
        cursor: "pointer",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: "100%",
          aspectRatio: "2/3",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          position: "relative",
          border: "1px solid rgba(255,255,255,0.06)",
          marginBottom: "var(--space-sm)",
          boxShadow: "var(--shadow-md)",
          background: "var(--bg-surface)",
        }}
      >
        {item.image ? (
          <img
            src={getProxiedImageUrl(item.image)}
            alt={item.title}
            loading="lazy"
            decoding="async"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255,255,255,0.02)",
              color: "var(--text-tertiary)",
            }}
          >
            <Ghost size={24} />
          </div>
        )}

        {/* Countdown badge */}
        {isFuture && item.releaseDate && (
          <div
            style={{
              position: "absolute",
              top: "0.35rem",
              right: "0.35rem",
              zIndex: 10,
            }}
          >
            <CountdownBadge
              releaseDate={new Date(item.releaseDate).toISOString()}
              compact
            />
          </div>
        )}

        {/* Year badge */}
        {item.year && (
          <div
            style={{
              position: "absolute",
              bottom: "0.4rem",
              left: "0.4rem",
              background: "rgba(0,0,0,0.65)",
              backdropFilter: "blur(8px)",
              padding: "0.1rem 0.4rem",
              borderRadius: "5px",
              fontSize: "0.6rem",
              fontWeight: "var(--fw-black)",
              color: "white",
              zIndex: 5,
              border: "1px solid rgba(255,255,255,0.1)",
              fontFamily: "var(--font-main)",
            }}
          >
            {item.year}
          </div>
        )}
      </div>

      <p
        style={{
          fontSize: "0.72rem",
          fontWeight: "var(--fw-bold)",
          fontFamily: "var(--font-main)",
          margin: 0,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          color: "var(--text-primary)",
          lineHeight: 1.25,
          letterSpacing: "-0.2px",
        }}
      >
        {item.title}
      </p>
    </motion.div>
  );
};

export const Discover: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [sections, setSections] = useState<DiscoverSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getDiscoverData();
        setSections([
          {
            title: "Популярное сейчас",
            icon: <Flame size={16} />,
            items: data.trending,
            gradient:
              "linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(234, 88, 12, 0.08))",
          },
          {
            title: "Скоро в кино",
            icon: <Calendar size={16} />,
            items: data.upcoming,
            gradient:
              "linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(59, 130, 246, 0.08))",
          },
          {
            title: "Игровые новинки",
            icon: <Gamepad2 size={16} />,
            items: data.newGames,
            gradient:
              "linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.08))",
          },
          {
            title: "Скоро в играх",
            icon: <CalendarClock size={16} />,
            items: data.upcomingGames,
            gradient:
              "linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(251, 191, 36, 0.08))",
          },
        ]);
      } catch (error) {
        console.error("Discover fetch failed:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAdd = async (item: Item) => {
    if (item.externalId) {
      const existing = await db.items
        .where("[externalId+source]")
        .equals([item.externalId, item.source || ""])
        .first();

      if (existing) {
        navigate(`/item/${existing.id}`);
        return;
      }
    }

    const newItem: Item = {
      ...item,
      status: "planned",
      tags: item.tags || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const id = await db.items.add(newItem);
    vibrate("medium");
    triggerAutoSync();
    showToast("Добавлено в планы", "success");
    navigate(`/item/${id}`);
  };

  return (
    <div style={{ paddingBottom: "2rem" }}>
      <PageHeader title="Открытия" showBack />

      {loading ? (
        <div style={{ padding: "2rem 0" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ marginBottom: "2rem" }}>
              <div
                style={{
                  height: "20px",
                  width: "140px",
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: "8px",
                  marginBottom: "0.75rem",
                }}
              />
              <div style={{ display: "flex", gap: "0.75rem" }}>
                {[1, 2, 3].map((j) => (
                  <div
                    key={j}
                    style={{
                      width: "130px",
                      aspectRatio: "2/3",
                      background: "rgba(255,255,255,0.03)",
                      borderRadius: "12px",
                      flexShrink: 0,
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
        >
          {sections.map((section) => (
            <Section
              key={section.title}
              title={section.title}
              icon={section.icon}
              badge={section.items.length}
              plain
            >
              {/* Horizontal Scroll */}
              {section.items.length > 0 ? (
                <div
                  className="no-scrollbar"
                  style={{
                    display: "flex",
                    gap: "0.75rem",
                    overflowX: "auto",
                    padding: "0 0.25rem 0.5rem",
                    scrollbarWidth: "none",
                  }}
                >
                  {section.items.map((item) => (
                    <DiscoverCard
                      key={`${item.source}-${item.externalId}`}
                      item={item}
                      onAdd={handleAdd}
                    />
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    padding: "2rem",
                    textAlign: "center",
                    color: "var(--text-tertiary)",
                    fontSize: "0.8rem",
                  }}
                >
                  Нет данных
                </div>
              )}
            </Section>
          ))}
        </div>
      )}
    </div>
  );
};
