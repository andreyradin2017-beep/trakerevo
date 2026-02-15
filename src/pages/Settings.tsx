import React, { useState, useEffect, useRef } from "react";
import { db } from "../db/db";
import { PageHeader } from "../components/PageHeader";
import {
  Trash2,
  Database,
  Info,
  Download,
  Upload,
  Loader,
  User,
  LogOut,
  Check,
  BarChart2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import { useAuth } from "../context/AuthContext";
import { LoginModal } from "../components/LoginModal";
import { syncAll } from "../services/dbSync";
import { useToast } from "../context/ToastContext";
import { ConfirmDialog } from "../components/Dialogs"; // reusing existing component

export const Settings: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
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

    // Reset input so verify same file can be selected again if needed
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

  return (
    <div style={{ paddingBottom: "3rem" }}>
      <PageHeader title="Настройки" showBack />
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
          gap: "1.5rem",
          marginTop: "1rem",
        }}
      >
        {/* Account Section */}
        <div
          style={{
            padding: "1.25rem",
            background: "var(--bg-surface)",
            borderRadius: "var(--radius-xl)",
            border: "var(--border-glass)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "1rem",
            }}
          >
            <div
              style={{
                padding: "0.5rem",
                background: "rgba(56, 189, 248, 0.1)",
                borderRadius: "10px",
                color: "#38bdf8",
              }}
            >
              <User size={18} />
            </div>
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>
              Аккаунт
            </h3>
          </div>

          {user ? (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.75rem",
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: "var(--radius-lg)",
                  marginBottom: "1rem",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "var(--primary-gradient)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "0.9rem",
                    fontWeight: 700,
                  }}
                >
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <div
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis",
                      overflow: "hidden",
                    }}
                  >
                    {user.email}
                  </div>
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: "var(--success)",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                    }}
                  >
                    <Check size={10} /> Подключено
                  </div>
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={signOut}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "var(--radius-lg)",
                  color: "var(--text-secondary)",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                }}
              >
                <LogOut size={16} /> Выйти
              </motion.button>
            </div>
          ) : (
            <div>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "var(--text-secondary)",
                  marginBottom: "1rem",
                  lineHeight: "1.4",
                }}
              >
                Войдите, чтобы синхронизировать библиотеку между устройствами.
              </p>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsLoginOpen(true)}
                style={{
                  width: "100%",
                  padding: "0.85rem",
                  background: "var(--primary)",
                  border: "none",
                  borderRadius: "var(--radius-lg)",
                  color: "white",
                  fontWeight: 600,
                  fontSize: "1rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  boxShadow: "0 4px 12px rgba(var(--primary-rgb), 0.3)",
                }}
              >
                <User size={18} /> Войти / Регистрация
              </motion.button>
            </div>
          )}

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
                marginTop: "1rem",
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
        </div>

        {/* Database Info */}
        <div
          style={{
            padding: "1.25rem",
            background: "var(--bg-surface)",
            borderRadius: "var(--radius-xl)",
            border: "var(--border-glass)",
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
            <div
              style={{
                padding: "0.5rem",
                background: "rgba(52, 211, 153, 0.1)",
                borderRadius: "10px",
                color: "var(--success)",
              }}
            >
              <Database size={18} />
            </div>
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>
              База данных
            </h3>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
              marginBottom: "1.5rem",
            }}
          >
            <div
              style={{
                padding: "1rem",
                background: "rgba(255,255,255,0.02)",
                borderRadius: "var(--radius-lg)",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "1.2rem",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                }}
              >
                {stats.items}
              </div>
              <div
                style={{
                  fontSize: "0.7rem",
                  color: "var(--text-tertiary)",
                  textTransform: "uppercase",
                  fontWeight: 700,
                }}
              >
                Элементов
              </div>
            </div>
            <div
              style={{
                padding: "1rem",
                background: "rgba(255,255,255,0.02)",
                borderRadius: "var(--radius-lg)",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "1.2rem",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                }}
              >
                {stats.lists}
              </div>
              <div
                style={{
                  fontSize: "0.7rem",
                  color: "var(--text-tertiary)",
                  textTransform: "uppercase",
                  fontWeight: 700,
                }}
              >
                Списков
              </div>
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/stats")}
            style={{
              width: "100%",
              padding: "0.75rem",
              marginBottom: "1rem",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "var(--radius-lg)",
              color: "var(--text-primary)",
              fontWeight: 600,
              fontSize: "0.9rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
            }}
          >
            <BarChart2 size={18} /> Полная статистика и достижения
          </motion.button>

          {/* Backup Actions */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.75rem",
              marginBottom: "1.5rem",
            }}
          >
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleExport}
              disabled={exporting}
              style={{
                padding: "0.75rem",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "var(--radius-lg)",
                color: "var(--text-primary)",
                fontWeight: 600,
                fontSize: "0.8rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
              }}
            >
              {exporting ? (
                <Loader size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}{" "}
              Экспорт
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              style={{
                padding: "0.75rem",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "var(--radius-lg)",
                color: "var(--text-primary)",
                fontWeight: 600,
                fontSize: "0.8rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
              }}
            >
              {importing ? (
                <Loader size={14} className="animate-spin" />
              ) : (
                <Upload size={14} />
              )}{" "}
              Импорт
            </motion.button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImport}
              accept=".json"
              style={{ display: "none" }}
            />
          </div>

          <button
            onClick={clearDatabase}
            style={{
              width: "100%",
              padding: "0.85rem",
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              borderRadius: "var(--radius-lg)",
              color: "var(--error)",
              fontWeight: 700,
              fontSize: "0.9rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
            }}
          >
            <Trash2 size={18} /> Очистить все данные
          </button>
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
