import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getDiscoverData } from "../services/discover";
import type { Item } from "../types";
import { getProxiedImageUrl } from "../utils/images";
import { CountdownBadge } from "./CountdownBadge";
import { db } from "../db/db";
import { Calendar } from "lucide-react";

export const UpcomingCarousel: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getDiscoverData();
        // Filter out items without date or past date
        const valid = data.upcoming
          .filter((i) => i.releaseDate && new Date(i.releaseDate) > new Date())
          .slice(0, 10);
        setItems(valid);
      } catch {
        // Silent fail
      }
    };
    fetch();
  }, []);

  if (items.length === 0) return null;

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "0.8rem",
          padding: "0 0.5rem",
        }}
      >
        <Calendar size={16} className="text-secondary" />
        <h2
          style={{
            fontSize: "1rem",
            fontWeight: 700,
            margin: 0,
            color: "var(--text-primary)",
          }}
        >
          Скоро выходят
        </h2>
      </div>

      <div
        className="no-scrollbar"
        style={{
          display: "flex",
          gap: "0.8rem",
          overflowX: "auto",
          padding: "0 0.5rem 0.5rem",
          scrollbarWidth: "none",
        }}
      >
        {items.map((item) => (
          <motion.div
            key={item.externalId}
            whileTap={{ scale: 0.95 }}
            onClick={async () => {
              // Check if exists
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
              // Else navigate to discover to add? Or add directly?
              // Better to go to discover or item detail preview if we had one.
              // For now, let's just do nothing or maybe show a toast "Go to Discover to add"
              // Actually, let's navigate to Discover page with query?
              // Or better: open preview dialog?
              // Simplest: Navigate to Discover
              navigate("/discover");
            }}
            style={{
              minWidth: "140px",
              width: "140px",
              flexShrink: 0,
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: "100%",
                aspectRatio: "16/9",
                borderRadius: "12px",
                overflow: "hidden",
                position: "relative",
                border: "1px solid rgba(255,255,255,0.1)",
                marginBottom: "0.5rem",
              }}
            >
              <img
                src={getProxiedImageUrl(item.image || "")}
                alt={item.title}
                loading="lazy"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: "0",
                  left: "0",
                  right: "0",
                  padding: "20px 8px 6px",
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
                }}
              >
                {item.releaseDate && (
                  <CountdownBadge
                    releaseDate={new Date(item.releaseDate).toISOString()}
                    compact
                  />
                )}
              </div>
            </div>
            <p
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                margin: 0,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                color: "var(--text-primary)",
              }}
            >
              {item.title}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
