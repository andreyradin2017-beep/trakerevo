import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@services/supabase";
import { Loader2 } from "lucide-react";

export function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("Выполняем вход...");

  useEffect(() => {
    const handleCallback = async () => {
      const accessToken = searchParams.get("access_token");
      const refreshToken = searchParams.get("refresh_token");
      const error = searchParams.get("error");

      if (error) {
        setStatus(`Ошибка: ${searchParams.get("message") || error}`);
        setTimeout(() => navigate("/settings"), 3000);
        return;
      }

      if (!accessToken || !refreshToken) {
        setStatus("Неверный запрос авторизации.");
        setTimeout(() => navigate("/"), 2000);
        return;
      }

      try {
        setStatus("Устанавливаем сессию...");
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) throw sessionError;

        setStatus("Вход выполнен! Переходим...");
        navigate("/settings", { replace: true });
      } catch (err: any) {
        console.error("AuthCallback error:", err);
        setStatus(`Не удалось войти: ${err.message}`);
        setTimeout(() => navigate("/"), 3000);
      }
    };

    handleCallback();
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        gap: "1rem",
        color: "var(--text-primary)",
      }}
    >
      <Loader2 size={40} className="animate-spin" style={{ color: "var(--primary)" }} />
      <p style={{ fontSize: "1rem", color: "var(--text-secondary)" }}>{status}</p>
    </div>
  );
}
