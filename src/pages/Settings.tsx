import React, { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import { motion } from "framer-motion";

import { useAuth } from "@context/AuthContext";
import { LoginModal } from "@components/LoginModal";
import { syncAll } from "@services/dbSync";
import { useToast } from "@context/ToastContext";
import { ConfirmDialog } from "@components/Dialogs";
import { SearchProviderSettings } from "@components/SearchProviderSettings";

export const Settings: React.FC = () => {
  const { user, signOut } = useAuth();
  const { showToast } = useToast();
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [stats, setStats] = useState({ items: 0, lists: 0 });
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

  useEffect(() => {
    refreshStats();
  }, []);

  const refreshStats = async () => {
    const [items, lists] = await Promise.all([
      db.items.count(),
      db.lists.count(),
    ]);
    setStats({ items, lists });
  };

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
        "ВНИМАНИЕ: Это удалит ВСЕ элементы и списки. Это действие необратимо! Вы уверены?",
      onConfirm: async () => {
        await Promise.all([
          db.items.clear(),
          db.lists.clear(),
          db.settings.clear(),
          db.cache.clear(),
          db.search_history.clear(),
        ]);
        showToast("База данных очищена", "info");
        setTimeout(() => window.location.reload(), 1000);
      },
    });
  };

  const userLevel = Math.floor(stats.items / 10) + 1;
  const itemsToNextLevel = 10 - (stats.items % 10);
  const progressToNextLevel = (stats.items % 10) * 10;

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
                <div
                  style={{
                    background: "rgba(139, 92, 246, 0.2)",
                    padding: "0.2rem 0.6rem",
                    borderRadius: "8px",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    color: "var(--primary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Уровень {userLevel}
                </div>
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

          {/* Level Progress */}
          <div style={{ position: "relative", zIndex: 1 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.5rem",
              }}
            >
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                }}
              >
                Прогресс до уровня {userLevel + 1}
              </span>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "var(--primary)",
                }}
              >
                {stats.items % 10} / 10
              </span>
            </div>
            <div
              style={{
                height: "8px",
                background: "rgba(255,255,255,0.05)",
                borderRadius: "10px",
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressToNextLevel}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                style={{
                  height: "100%",
                  background: "var(--primary-gradient)",
                  boxShadow: "0 0 10px var(--primary-glow)",
                }}
              />
            </div>
            <p
              style={{
                fontSize: "0.65rem",
                color: "var(--text-tertiary)",
                marginTop: "0.5rem",
                textAlign: "center",
              }}
            >
              Добавьте еще {itemsToNextLevel} предметов для повышения уровня 🚀
            </p>
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
                refreshStats();
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
            }}
          >
            Очистить все данные
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
              TrakerEvo v1.2.2 (Quality Update)
            </span>
          </div>
          <p style={{ fontSize: "0.65rem", margin: 0 }}>
            Built with React & Dexie DB
          </p>
        </div>
      </div>
    </div>
  );
};
