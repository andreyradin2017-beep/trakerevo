import React from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Play } from "lucide-react";
import { getProxiedImageUrl } from "../utils/images";
import { LazyImage } from "./LazyImage";
interface ItemHeaderProps {
  title: string;
  image?: string;
  type: string;
  year?: string | number;
  hasTrailer: boolean;
  source?: string;
  onBack: () => void;
  onShowTrailer: () => void;
}

export const ItemHeader: React.FC<ItemHeaderProps> = ({
  title,
  image,
  type,
  year,
  hasTrailer,
  source,
  onBack,
  onShowTrailer,
}) => {
  const proxiedImage = getProxiedImageUrl(image);

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "1.25rem",
          gap: "1rem",
        }}
      >
        <button
          onClick={onBack}
          aria-label="Назад"
          style={{
            background: "var(--bg-surface)",
            width: "36px",
            height: "36px",
            border: "none",
            borderRadius: "50%",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ArrowLeft size={20} color="var(--text-primary)" />
        </button>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>
          Детали
        </h1>
      </div>

      <div
        style={{
          backgroundColor: "var(--bg-surface)",
          borderRadius: "var(--radius-xl)",
          overflow: "hidden",
          border: "var(--border-glass)",
          marginBottom: "1.25rem",
        }}
      >
        {proxiedImage && (
          <div
            style={{
              height: "220px",
              overflow: "hidden",
              position: "relative",
              backgroundColor: "var(--bg-surface-hover)", // Fallback background
            }}
          >
            <LazyImage
              src={proxiedImage}
              alt={title}
              containerClassName="h-full w-full"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              fallbackElement={
                <div
                  className="header-fallback-icon"
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 0,
                  }}
                >
                  <Play size={48} color="var(--text-tertiary)" opacity={0.2} />
                </div>
              }
            />
            {hasTrailer && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 1,
                }}
              >
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onShowTrailer}
                  style={{
                    background: "rgba(255,255,255,0.2)",
                    backdropFilter: "blur(8px)",
                    padding: "0.75rem 1.25rem",
                    borderRadius: "var(--radius-full)",
                    border: "1px solid rgba(255,255,255,0.3)",
                    color: "white",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <Play size={16} fill="white" /> Трейлер
                </motion.button>
              </div>
            )}
          </div>
        )}

        <div style={{ padding: "1.25rem 1.25rem 0.5rem 1.25rem" }}>
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              marginBottom: "0.75rem",
              letterSpacing: "-0.5px",
              lineHeight: 1.2,
            }}
          >
            {title}
          </h2>
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              alignItems: "center",
              marginBottom: "0.5rem",
              flexWrap: "wrap",
            }}
          >
            {source && (
              <span
                style={{
                  fontSize: "0.7rem",
                  background:
                    source === "yandex"
                      ? "rgba(252, 63, 29, 0.2)"
                      : "var(--bg-surface-hover)",
                  border:
                    source === "yandex"
                      ? "1px solid rgba(252, 63, 29, 0.5)"
                      : "none",
                  padding: "0.2rem 0.5rem",
                  borderRadius: "var(--radius-sm)",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  color:
                    source === "yandex"
                      ? "var(--brand-yandex)"
                      : "var(--text-secondary)",
                }}
              >
                {source === "google_books"
                  ? "BOOKS"
                  : source === "yandex"
                    ? "ЯНДЕКС"
                    : source}
              </span>
            )}
            <span
              style={{
                fontSize: "0.7rem",
                background: "var(--bg-surface-hover)",
                padding: "0.2rem 0.5rem",
                borderRadius: "var(--radius-sm)",
                textTransform: "uppercase",
                fontWeight: 700,
                color: "var(--text-secondary)",
              }}
            >
              {type}
            </span>
            {year && (
              <span
                style={{ fontSize: "0.85rem", color: "var(--text-tertiary)" }}
              >
                {year}
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
