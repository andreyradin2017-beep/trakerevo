import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Loader2, CheckCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { vibrate, notificationOccurred } from "../utils/haptics";


interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { signInWithEmail, signInWithYandex } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);
    vibrate("light");

    try {
      await signInWithEmail(email);
      setSent(true);
      notificationOccurred("success");
    } catch (err: any) {
      setError(err.message || "Ошибка при отправке ссылки");
      notificationOccurred("error");
    } finally {
      setLoading(false);
    }
  };

  const handleYandexAuth = () => {
    vibrate("light");
    signInWithYandex();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(4px)",
              zIndex: 50,
            }}
          />

          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 51,
              pointerEvents: "none",
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              style={{
                width: "90%",
                maxWidth: "400px",
                background: "var(--bg-card)",
                borderRadius: "var(--radius-xl)",
                border: "1px solid rgba(255,255,255,0.1)",
                padding: "1.5rem",
                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
                pointerEvents: "auto",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1.5rem",
                }}
              >
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>
                  Вход / Регистрация
                </h2>
                <button
                  onClick={onClose}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                  }}
                >
                  <X size={24} />
                </button>
              </div>

              {sent ? (
                <div style={{ textAlign: "center", padding: "1rem 0" }}>
                  <CheckCircle
                    size={48}
                    color="var(--success)"
                    style={{ margin: "0 auto 1rem" }}
                  />
                  <h3 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>
                    Ссылка отправлена!
                  </h3>
                  <p
                    style={{
                      color: "var(--text-secondary)",
                      fontSize: "0.9rem",
                    }}
                  >
                    Проверьте почту <strong>{email}</strong> и перейдите по
                    "Magic Link" для входа.
                  </p>
                  <button
                    onClick={onClose}
                    style={{
                      marginTop: "1.5rem",
                      width: "100%",
                      padding: "0.75rem",
                      background: "rgba(255,255,255,0.1)",
                      border: "none",
                      borderRadius: "var(--radius-lg)",
                      color: "white",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Закрыть
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div style={{ marginBottom: "1rem" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontSize: "0.9rem",
                        color: "var(--text-secondary)",
                      }}
                    >
                      Email
                    </label>
                    <div style={{ position: "relative" }}>
                      <Mail
                        size={18}
                        style={{
                          position: "absolute",
                          left: "1rem",
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "var(--text-tertiary)",
                        }}
                      />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        required
                        style={{
                          width: "100%",
                          padding: "0.75rem 1rem 0.75rem 2.8rem",
                          background: "var(--bg-input)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "var(--radius-lg)",
                          color: "var(--text-primary)",
                          fontSize: "1rem",
                          outline: "none",
                        }}
                      />
                    </div>
                  </div>

                  {error && (
                    <div
                      style={{
                        padding: "0.75rem",
                        background: "var(--bg-error)",
                        borderRadius: "var(--radius-md)",
                        color: "var(--error)",
                        fontSize: "0.85rem",
                        marginBottom: "1rem",
                      }}
                    >
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: "100%",
                      padding: "0.85rem",
                      background: "var(--primary)",
                      border: "none",
                      borderRadius: "var(--radius-lg)",
                      color: "white",
                      fontWeight: 600,
                      fontSize: "1rem",
                      cursor: loading ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                      opacity: loading ? 0.7 : 1,
                    }}
                  >
                    {loading ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      "Отправить ссылку"
                    )}
                  </button>

                  <div
                    style={{
                      margin: "1.5rem 0",
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        height: "1px",
                        background: "rgba(255,255,255,0.1)",
                      }}
                    />
                    <span
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--text-tertiary)",
                      }}
                    >
                      или
                    </span>
                    <div
                      style={{
                        flex: 1,
                        height: "1px",
                        background: "rgba(255,255,255,0.1)",
                      }}
                    />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      marginBottom: "1.25rem",
                    }}
                  >
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleYandexAuth}
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        background: "#FFCC00",
                        color: "#000000",
                        border: "none",
                        borderRadius: "12px",
                        fontWeight: 700,
                        fontSize: "0.95rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.75rem",
                        boxShadow: "0 4px 12px rgba(255, 204, 0, 0.25)",
                      }}
                    >
                      <svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M25.7 15.1118V39.4342H19.7828L15 45H7.72758L15 36.4178C12.3394 33.725 11.2312 30.6416 11.2312 26.6853C11.2312 21.0425 15.6881 15.1118 22.1466 15.1118H25.7ZM31.6171 2.375V11.1447H25.7V2.375H31.6171Z" fill="#FF0000"/>
                      </svg>
                      Войти через Яндекс
                    </motion.button>
                  </div>

                  <p
                    style={{
                      marginTop: "1rem",
                      fontSize: "0.75rem",
                      color: "var(--text-tertiary)",
                      textAlign: "center",
                    }}
                  >
                    Пришлем ссылку для входа без пароля. Если аккаунта нет —
                    создадим новый.
                  </p>
                </form>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
