import React from "react";
import { Layers, Film, Gamepad2, BookOpen } from "lucide-react";
import { selectionChanged } from "../utils/haptics";

export type Category = "all" | "movie" | "game" | "book";

interface CategorySelectorProps {
  activeCategory: Category;
  onCategoryChange: (category: Category) => void;
  style?: React.CSSProperties;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  activeCategory,
  onCategoryChange,
  style,
}) => {
  const categories: { id: Category; icon: any; label: string }[] = [
    { id: "all", icon: Layers, label: "Все" },
    { id: "movie", icon: Film, label: "Кино" },
    { id: "game", icon: Gamepad2, label: "Игры" },
    { id: "book", icon: BookOpen, label: "Книги" },
  ];

  return (
    <div
      style={{
        display: "flex",
        gap: "0.3rem",
        background: "var(--bg-surface)",
        padding: "0.25rem",
        borderRadius: "var(--radius-xl)",
        border: "var(--border-glass)",
        overflowX: "auto",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        ...style,
      }}
      className="no-scrollbar"
    >
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => {
            selectionChanged();
            onCategoryChange(cat.id);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.3rem",
            padding: "0.45rem 0.75rem",
            border: "none",
            borderRadius: "var(--radius-lg)",
            cursor: "pointer",
            background:
              activeCategory === cat.id ? "var(--primary)" : "transparent",
            color:
              activeCategory === cat.id ? "white" : "var(--text-secondary)",
            transition: "all 0.2s ease",
            fontSize: "0.75rem",
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          <cat.icon size={13} />
          {cat.label}
        </button>
      ))}
    </div>
  );
};
