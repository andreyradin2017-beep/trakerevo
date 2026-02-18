import React, { useState, useRef } from "react";
import { db } from "@db/db";
import { PageHeader } from "@components/PageHeader";
import {
  Database,
  Info,
  Download,
  Upload,
  Loader,
  User,
  LogOut,
  Check,
  BarChart3,
} from "lucide-react";
import { motion } from "framer-motion";

import { useAuth } from "@context/AuthContext";
import { LoginModal } from "@components/LoginModal";
import { syncAll } from "@services/dbSync";
import { useToast } from "@context/ToastContext";
import { ConfirmDialog } from "@components/Dialogs";
import { SearchProviderSettings } from "@components/SearchProviderSettings";
import { useUserStats } from "@hooks/useStats";
import { StatsBarChart } from "@components/StatsBarChart";

export const Settings: React.FC = () => {
  const { user, signOut } = useAuth();
  const { showToast } = useToast();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const userStats = useUserStats();

  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dialog States
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = {
        items: await db.items.toArray(),
        lists: await db.lists.toArray(),
        settings: await db.settings.toArray(),
        exportDate: new Date().toISOString(),
        version: 6,
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `trakerevo_backup_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("Экспорт завершен успешно", "success");
    } catch (error) {
      console.error("Export failed:", error);
      showToast("Ошибка при экспорте данных", "error");
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (fileInputRef.current) fileInputRef.current.value = "";

    const text = await file.text();
    let data: any;
    try {
      data = JSON.parse(text);
      if (!data.items || !data.lists) {
        throw new Error("Неверный формат файла");
      }
    } catch (err) {
      showToast("Неверный файл бэкапа", "error");
      return;
    }

    setConfirmState({
      isOpen: true,
      title: "Импорт данных",
      message: `Это действие перезапишет текущие данные (${data.items.length} элементов и ${data.lists.length} списков). Продолжить?`,
      onConfirm: async () => {
        setImporting(true);
        try {
          await Promise.all([
            db.items.clear(),
            db.lists.clear(),
            db.settings.clear(),
          ]);

          if (data.items.length > 0) await db.items.bulkAdd(data.items);
          if (data.lists.length > 0) await db.lists.bulkAdd(data.lists);
          if (data.settings && data.settings.length > 0)
            await db.settings.bulkAdd(data.settings);

          showToast("Данные успешно импортированы!", "success");
          setTimeout(() => window.location.reload(), 1500);
        } catch (error) {
          console.error("Import failed:", error);
          showToast("Ошибка при импорте базы данных", "error");
        } finally {
          setImporting(false);
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const clearDatabase = async () => {
    setConfirmState({
      isOpen: true,
      title: "Очистка данных",
      message:
        "ВНИМАНИЕ: Это удалит ВСЕ элементы и списки. Если вы вошли в аккаунт, данные также удалятся из облака. Вы уверены?",
      onConfirm: async () => {
        // If user is logged in, mark for deletion in Supabase
        if (user) {
          const items = await db.items.toArray();
          const lists = await db.lists.toArray();

          const deletions: any[] = [];

          items.forEach((item) => {
            if (item.supabaseId) {
              deletions.push({
                id: item.supabaseId,
                table: "items",
                timestamp: Date.now(),
              });
            }
          });

          lists.forEach((list) => {
            if (list.supabaseId) {
              deletions.push({
                id: list.supabaseId,
                table: "lists",
                timestamp: Date.now(),
              });
            }
          });

          if (deletions.length > 0) {
            await db.deleted_metadata.bulkPut(deletions);
          }
        }

        await Promise.all([
          db.items.clear(),
          db.lists.clear(),
          db.settings.clear(),
          db.cache.clear(),
          db.search_history.clear(),
        ]);

        if (user) {
          showToast("Синхронизация удаления...", "info");
          await syncAll();
        }

        showToast("База данных очищена", "info");
        setTimeout(() => window.location.reload(), 1000);
      },
    });
  };

  return (
    <div style={{ paddingBottom: "6rem" }}>
      <PageHeader title="Профиль" showBack={true} />
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
          marginTop: "1rem",
        }}
      >
        {/* Profile Card Section */}
        <div
          style={{
            padding: "1.5rem",
            background: "var(--bg-surface)",
            borderRadius: "var(--radius-xl)",
            border: "var(--border-glass)",
            position: "relative",
            overflow: "hidden",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          {/* Background Glow Overlay */}
          <div
            style={{
              position: "absolute",
              top: "-20%",
              right: "-10%",
              width: "150px",
              height: "150px",
              background: "var(--primary-glow)",
              filter: "blur(60px)",
              opacity: 0.4,
              zIndex: 0,
            }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1.25rem",
              position: "relative",
              zIndex: 1,
              marginBottom: "1.5rem",
            }}
          >
            {/* Avatar / Initial */}
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "20px",
                background: "var(--primary-gradient)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "1.5rem",
                fontWeight: 800,
                boxShadow: "0 8px 16px rgba(139, 92, 246, 0.4)",
                transform: "rotate(-3deg)",
              }}
            >
              {user ? user.email?.charAt(0).toUpperCase() : <User size={32} />}
            </div>

            <div style={{ flex: 1 }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: "1.25rem",
                  fontWeight: 800,
                  fontFamily: "var(--font-main)",
                }}
              >
                {user ? user.email?.split("@")[0] : "Гость"}
              </h2>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginTop: "0.25rem",
                }}
              >
                {user && (
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: "var(--success)",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.15rem",
                    }}
                  >
                    <Check size={12} /> Синхронизация ВКЛ
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              marginTop: "1.5rem",
              position: "relative",
              zIndex: 1,
            }}
          >
            {!user ? (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsLoginOpen(true)}
                className="btn-primary"
                style={{ flex: 1, height: "44px", fontSize: "0.9rem" }}
              >
                Войти в аккаунт
              </motion.button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={signOut}
                className="btn-secondary"
                style={{ flex: 1, height: "44px", fontSize: "0.9rem" }}
              >
                <LogOut size={16} /> Выйти
              </motion.button>
            )}
          </div>
        </div>

        {/* Favorite Genres Section */}
        {userStats && userStats.topGenres.length > 0 && (
          <div
            style={{
              background: "var(--bg-surface)",
              border: "var(--border-glass)",
              borderRadius: "var(--radius-lg)",
              padding: "1rem",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "1rem",
              }}
            >
              <BarChart3 size={16} color="var(--primary)" />
              <h3
                style={{
                  margin: 0,
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                Любимые жанры
              </h3>
            </div>
            <StatsBarChart
              data={userStats.topGenres}
              maxCount={userStats.topGenres[0]?.count || 1}
            />
          </div>
        )}

        {/* Account Sync Button (Only if logged in) */}
        {user && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={async () => {
              const btn = document.getElementById("sync-btn");
              if (btn) btn.innerText = "Синхронизация...";

              const result = await syncAll();

              if (btn) btn.innerText = "Синхронизировать сейчас";

              if (result.success) {
                showToast("Синхронизация завершена", "success");
              } else {
                showToast("Ошибка синхронизации", "error");
                console.error(result.errors);
              }
            }}
            id="sync-btn"
            style={{
              width: "100%",
              padding: "0.75rem",
              background: "rgba(56, 189, 248, 0.1)",
              border: "1px solid rgba(56, 189, 248, 0.2)",
              borderRadius: "var(--radius-lg)",
              color: "#38bdf8",
              fontWeight: 600,
              fontSize: "0.9rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
            }}
          >
            <Database size={16} /> Синхронизировать сейчас
          </motion.button>
        )}

        {/* Search Provider Settings */}
        <SearchProviderSettings
          showToast={showToast}
          setConfirmState={setConfirmState}
        />

        {/* Database Actions Section */}
        <div
          className="glass-card"
          style={{
            padding: "1.25rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "1.25rem",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>
              Управление данными
            </h3>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.75rem",
              marginBottom: "1rem",
            }}
          >
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleExport}
              disabled={exporting}
              style={{
                padding: "0.85rem",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "var(--radius-lg)",
                color: "var(--text-primary)",
                fontWeight: 600,
                fontSize: "0.85rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
              }}
            >
              {exporting ? (
                <Loader size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              Экспорт
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              style={{
                padding: "0.85rem",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "var(--radius-lg)",
                color: "var(--text-primary)",
                fontWeight: 600,
                fontSize: "0.85rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
              }}
            >
              {importing ? (
                <Loader size={16} className="animate-spin" />
              ) : (
                <Upload size={16} />
              )}
              Импорт
            </motion.button>
          </div>

          <button
            onClick={clearDatabase}
            style={{
              width: "100%",
              padding: "0.85rem",
              background: "rgba(239, 68, 68, 0.05)",
              border: "1px solid rgba(239, 68, 68, 0.1)",
              borderRadius: "var(--radius-lg)",
              color: "var(--error)",
              fontWeight: 600,
              fontSize: "0.85rem",
              cursor: "pointer",
              opacity: 0.8,
              marginBottom: "0.75rem",
            }}
          >
            Очистить все данные
          </button>

          <button
            onClick={async () => {
              const kinopoiskItems = await db.items
                .where("source")
                .equals("kinopoisk")
                .toArray();
              if (kinopoiskItems.length === 0) {
                showToast("Элементов Кинопоиска не найдено", "info");
                return;
              }

              setConfirmState({
                isOpen: true,
                title: "Удалить данные Кинопоиска",
                message: `Найдено ${kinopoiskItems.length} элементов. Удалить их?`,
                onConfirm: async () => {
                  if (user) {
                    const deletions = kinopoiskItems
                      .filter((i) => i.supabaseId)
                      .map((i) => ({
                        id: i.supabaseId!,
                        table: "items" as const,
                        timestamp: Date.now(),
                      }));
                    if (deletions.length > 0) {
                      await db.deleted_metadata.bulkPut(deletions);
                    }
                  }
                  await db.items.bulkDelete(kinopoiskItems.map((i) => i.id!));
                  if (user) await syncAll();
                  showToast("Элементы Кинопоиска удалены", "success");
                  setConfirmState((prev) => ({ ...prev, isOpen: false }));
                },
              });
            }}
            style={{
              width: "100%",
              padding: "0.85rem",
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "var(--radius-lg)",
              color: "var(--text-secondary)",
              fontWeight: 600,
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            Удалить остатки Кинопоиска
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            accept=".json"
            style={{ display: "none" }}
          />
        </div>

        {/* App Info */}
        <div style={{ textAlign: "center", opacity: 0.5, marginTop: "1rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              marginBottom: "0.5rem",
            }}
          >
            <Info size={14} />
            <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>
              TrakerEvo v1.2.2 (Обновление качества)
            </span>
          </div>
          <p style={{ fontSize: "0.65rem", margin: 0 }}>
            Сделано на React и Dexie DB
          </p>
        </div>
      </div>
    </div>
  );
};
