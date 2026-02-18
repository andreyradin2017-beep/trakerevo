import React from "react";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { getProxiedImageUrl } from "../utils/images";
import { LazyImage } from "./LazyImage";
interface ItemHeaderProps {
  title: string;
  image?: string;
  type: string;
  year?: string | number;
  hasTrailer: boolean;
  source?: string;
  genres?: string[];
  authors?: string[];
  onShowTrailer: () => void;
  onAuthorClick?: (author: string) => void;
}

export const ItemHeader: React.FC<ItemHeaderProps> = ({
  title,
  image,
  type,
  year,
  hasTrailer,
  source,
  genres,
  authors,
  onShowTrailer,
  onAuthorClick,
}) => {
  const proxiedImage = getProxiedImageUrl(image);

  return (
    <div
      style={{
        overflow: "hidden",
        marginBottom: "var(--space-md)",
      }}
    >
      {proxiedImage && (
        <div
          style={{
            padding: "0 var(--space-sm)",
            marginBottom: "var(--space-md)",
          }}
        >
          <motion.div
            layoutId={`item-image-${image}`}
            style={{
              height: "220px",
              overflow: "hidden",
              position: "relative",
              borderRadius: "var(--radius-lg)",
              backgroundColor: "var(--bg-surface)",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <LazyImage
              src={proxiedImage}
              alt={title}
              containerClassName="h-full w-full"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              fallbackElement={
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--text-tertiary)",
                  }}
                >
                  <Play size={40} opacity={0.2} />
                </div>
              }
            />
            {hasTrailer && (
              <div
                style={{
                  position: "absolute",
                  bottom: "1rem",
                  right: "1rem",
                  zIndex: 1,
                }}
              >
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onShowTrailer}
                  style={{
                    background: "rgba(15, 15, 18, 0.6)",
                    backdropFilter: "blur(12px)",
                    padding: "var(--space-sm) var(--space-md)",
                    borderRadius: "12px",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    color: "white",
                    fontWeight: "var(--fw-bold)",
                    fontSize: "var(--font-sm)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-xs)",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                  }}
                >
                  <Play size={14} fill="white" /> Трейлер
                </motion.button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      <div
        style={{
          padding: "0 1.25rem var(--space-sm) 1.25rem",
        }}
      >
        <h2
          style={{
            fontSize: "1.75rem",
            fontWeight: "var(--fw-black)",
            fontFamily: "var(--font-main)",
            marginBottom: "var(--space-sm)",
            letterSpacing: "-0.8px",
            lineHeight: 1.15,
            color: "var(--text-primary)",
          }}
        >
          {title}
        </h2>

        {authors && authors.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              alignItems: "center",
              marginBottom: "var(--space-sm)",
              flexWrap: "wrap",
            }}
          >
            {authors.map((author, i) => (
              <span
                key={i}
                onClick={() => onAuthorClick?.(author)}
                style={{
                  fontSize: "0.9rem",
                  color: "var(--primary)",
                  fontWeight: "var(--fw-bold)",
                  cursor: onAuthorClick ? "pointer" : "default",
                  textDecoration: onAuthorClick ? "underline" : "none",
                  opacity: 0.9,
                }}
              >
                {author}
                {i < authors.length - 1 ? ", " : ""}
              </span>
            ))}
          </div>
        )}
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
                fontSize: "0.6rem",
                background: "var(--bg-surface)",
                border: "1px solid rgba(255,255,255,0.05)",
                padding: "0.15rem 0.5rem",
                borderRadius: "6px",
                textTransform: "uppercase",
                fontWeight: "var(--fw-black)",
                color: "var(--text-secondary)",
                letterSpacing: "0.5px",
              }}
            >
              {source === "google_books" ? "BOOKS" : source}
            </span>
          )}
          <span
            style={{
              fontSize: "0.6rem",
              background: "var(--bg-surface)",
              border: "1px solid rgba(255,255,255,0.05)",
              padding: "0.15rem 0.5rem",
              borderRadius: "6px",
              textTransform: "uppercase",
              fontWeight: "var(--fw-black)",
              color: "var(--text-secondary)",
              letterSpacing: "0.5px",
            }}
          >
            {type}
          </span>
          {year && (
            <span
              style={{
                fontSize: "0.85rem",
                color: "var(--text-tertiary)",
                fontWeight: "var(--fw-semibold)",
                marginLeft: "0.25rem",
              }}
            >
              {year}
            </span>
          )}
        </div>

        {/* Genres Tags */}
        {genres && genres.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: "0.4rem",
              flexWrap: "wrap",
              marginTop: "0.5rem",
            }}
          >
            {genres.map((g, i) => (
              <span
                key={i}
                style={{
                  fontSize: "0.7rem",
                  color: "var(--text-secondary)",
                  background: "rgba(255,255,255,0.03)",
                  padding: "0.2rem 0.6rem",
                  borderRadius: "6px",
                  border: "1px solid rgba(255,255,255,0.05)",
                  fontWeight: 500,
                }}
              >
                {g}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
