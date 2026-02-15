import React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";
import { useNavigate } from "react-router-dom";
import { GridCard } from "../components/GridCard";
import { PageHeader } from "../components/PageHeader";
import { EmptyState } from "../components/EmptyState";
import { Archive as ArchiveIcon } from "lucide-react";

export const Archive: React.FC = () => {
  const navigate = useNavigate();
  const archivedItems = useLiveQuery(async () => {
    const all = await db.items.toArray();
    return all
      .filter(
        (i) => (i as any).isArchived === true || (i as any).isArchived === 1,
      )
      .sort((a, b) => (b.id || 0) - (a.id || 0));
  });

  return (
    <div style={{ paddingBottom: "2.5rem" }}>
      <PageHeader title="Архив" showBack />

      <div style={{ marginTop: "1.5rem" }}>
        {!archivedItems ? (
          <div style={{ textAlign: "center", color: "var(--text-secondary)" }}>
            Загрузка...
          </div>
        ) : archivedItems.length === 0 ? (
          <EmptyState
            message="В архиве пока ничего нет."
            icon={<ArchiveIcon size={32} />}
          />
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.75rem",
            }}
          >
            {archivedItems.map((item) => (
              <GridCard
                key={item.id}
                item={item}
                onClick={() => navigate(`/item/${item.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
