import React from "react";
import { motion } from "framer-motion";
import type { Item } from "../types";
import { CheckCircle2, PlayCircle, Bookmark } from "lucide-react";
import { LivingIcon } from "./LivingIcon";
import { pressAnimation } from "@utils/animations";

interface ItemStatsEditorProps {
  status: Item["status"];
  itemType: Item["type"];
  isArchived: boolean;
  isTVShow: boolean;
  currentSeason: number;
  currentEpisode: number;
  progress: number;
  totalProgress: number;
  onStatusChange: (status: Item["status"]) => void;
  onArchiveToggle: () => void;
  onSeasonChange: (val: number) => void;
  onEpisodeChange: (val: number) => void;
  onProgressChange: (val: number) => void;
}

export const ItemStatsEditor: React.FC<ItemStatsEditorProps> = ({
  status,
  itemType,
  isArchived,
  isTVShow,
  currentSeason,
  currentEpisode,
  progress,
  totalProgress,
  onStatusChange,
  onArchiveToggle,
  onSeasonChange,
  onEpisodeChange,
  onProgressChange,
}) => {
  const getProgressLabel = () => {
    switch (itemType) {
      case "movie":
        return "Прогресс (мин)";
      case "show":
        return "Серии";
      case "book":
        return "Страницы";
      case "game":
        return "Прогресс";
      default:
        return "Прогресс";
    }
  };

  const getStatusLabels = () => {
    switch (itemType) {
      case "game":
        return {
          planned: "Буду играть",
          in_progress: "Играю",
          completed: "Пройдено",
          dropped: "Брошено",
        };
      case "book":
        return {
          planned: "Буду читать",
          in_progress: "Читаю",
          completed: "Прочитано",
          dropped: "Брошено",
        };
      case "movie":
      case "show":
      default:
        return {
          planned: "Буду смотреть",
          in_progress: "Смотрю",
          completed: "Просмотрено",
          dropped: "Брошено",
        };
    }
  };

  const statusLabels = getStatusLabels();
  const showProgressSlider = itemType === "book" || itemType === "show";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
      }}
    >
      {/* Status & Archive Toggle */}
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "0.75rem",
            }}
          >
            <label
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "var(--text-tertiary)",
                textTransform: "uppercase",
              }}
            >
              Статус
            </label>
            {status === "completed" && (
              <LivingIcon
                icon={CheckCircle2}
                color="var(--success)"
                size={16}
                animation="pop"
                trigger={status}
                active
              />
            )}
            {status === "in_progress" && (
              <LivingIcon
                icon={PlayCircle}
                color="var(--primary)"
                size={16}
                animation="pulse"
                trigger={status}
                active
              />
            )}
            {status === "planned" && (
              <LivingIcon
                icon={Bookmark}
                color="var(--text-secondary)"
                size={16}
                animation="draw"
                trigger={status}
                active
              />
            )}
          </div>
          <div style={{ position: "relative", width: "100%" }}>
            <select
              value={status}
              onChange={(e) => onStatusChange(e.target.value as any)}
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
              <option value="planned">{statusLabels.planned}</option>
              <option value="in_progress">{statusLabels.in_progress}</option>
              <option value="completed">{statusLabels.completed}</option>
              <option value="dropped">{statusLabels.dropped}</option>
            </select>
          </div>
        </div>
        <div style={{ width: "80px" }}>
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
            Архив
          </label>
          <button
            onClick={onArchiveToggle}
            style={{
              width: "100%",
              height: "50px",
              padding: "0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "var(--radius-lg)",
              backgroundColor: isArchived
                ? "rgba(245, 158, 11, 0.2)"
                : "rgba(255,255,255,0.05)",
              color: isArchived ? "var(--warning)" : "var(--text-secondary)",
              border: isArchived
                ? "1px solid rgba(245, 158, 11, 0.3)"
                : "1px solid rgba(255,255,255,0.05)",
              fontSize: "0.9rem",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {isArchived ? "ДА" : "НЕТ"}
          </button>
        </div>
      </div>

      {/* Series Tracker - STRICTLY FOR SHOWS */}
      {isTVShow && (
        <div
          style={{
            padding: "1rem",
            background: "rgba(var(--primary-rgb), 0.05)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid rgba(var(--primary-rgb), 0.1)",
          }}
        >
          <label
            style={{
              display: "block",
              marginBottom: "0.75rem",
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "var(--primary)",
              textTransform: "uppercase",
            }}
          >
            Трекер серий
          </label>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              justifyContent: "space-around",
            }}
          >
            <div>
              <span
                style={{
                  fontSize: "0.65rem",
                  color: "var(--text-tertiary)",
                  display: "block",
                  textAlign: "center",
                  marginBottom: "0.4rem",
                  fontWeight: 700,
                }}
              >
                СЕЗОН
              </span>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <motion.button
                  {...pressAnimation}
                  onClick={() => onSeasonChange(Math.max(1, currentSeason - 1))}
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: "rgba(255,255,255,0.1)",
                    color: "white",
                    fontWeight: 800,
                  }}
                >
                  -
                </motion.button>
                <span
                  style={{
                    fontSize: "1.4rem",
                    fontWeight: 900,
                    minWidth: "1.5rem",
                    textAlign: "center",
                  }}
                >
                  {currentSeason}
                </span>
                <motion.button
                  {...pressAnimation}
                  onClick={() => onSeasonChange(currentSeason + 1)}
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: "rgba(255,255,255,0.1)",
                    color: "white",
                    fontWeight: 800,
                  }}
                >
                  +
                </motion.button>
              </div>
            </div>
            <div
              style={{
                width: "1px",
                height: "40px",
                background: "rgba(255,255,255,0.05)",
              }}
            />
            <div>
              <span
                style={{
                  fontSize: "0.65rem",
                  color: "var(--text-tertiary)",
                  display: "block",
                  textAlign: "center",
                  marginBottom: "0.4rem",
                  fontWeight: 700,
                }}
              >
                СЕРИЯ
              </span>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <motion.button
                  {...pressAnimation}
                  onClick={() =>
                    onEpisodeChange(Math.max(1, currentEpisode - 1))
                  }
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: "rgba(255,255,255,0.1)",
                    color: "white",
                    fontWeight: 800,
                  }}
                >
                  -
                </motion.button>
                <span
                  style={{
                    fontSize: "1.4rem",
                    fontWeight: 900,
                    minWidth: "1.5rem",
                    textAlign: "center",
                  }}
                >
                  {currentEpisode}
                </span>
                <motion.button
                  {...pressAnimation}
                  onClick={() => onEpisodeChange(currentEpisode + 1)}
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: "rgba(255,255,255,0.1)",
                    color: "white",
                    fontWeight: 800,
                  }}
                >
                  +
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Slider */}
      {showProgressSlider && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "0.4rem",
            }}
          >
            <label
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "var(--text-tertiary)",
                textTransform: "uppercase",
              }}
            >
              {getProgressLabel()}
            </label>
            <div style={{ display: "flex", gap: "1rem" }}>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "var(--primary)",
                }}
              >
                {progress} / {totalProgress || "?"}
              </span>
              {totalProgress > 0 && (
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "var(--text-tertiary)",
                  }}
                >
                  {Math.round((progress / totalProgress) * 100)}%
                </span>
              )}
            </div>
          </div>
          <input
            type="range"
            min="0"
            max={totalProgress || (itemType === "book" ? 1000 : 100)}
            value={progress || 0}
            onChange={(e) => onProgressChange(Number(e.target.value))}
            style={{
              width: "100%",
              height: "4px",
              accentColor: "var(--primary)",
              cursor: "pointer",
            }}
          />
        </div>
      )}
    </div>
  );
};
