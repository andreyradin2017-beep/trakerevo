import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@services/supabase";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

export function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Выполняем вход...");

  useEffect(() => {
    const handleCallback = async () => {
      const error = searchParams.get("error");

      if (error) {
        setStatus("error");
        setMessage(`Ошибка: ${decodeURIComponent(error)}`);
        setTimeout(() => navigate("/"), 4000);
        return;
      }

      const token = searchParams.get("token");
      const email = searchParams.get("email");
      const type = (searchParams.get("type") || "magiclink") as "magiclink";

      if (!token || !email) {
        setStatus("error");
        setMessage("Недействительная ссылка для входа.");
        setTimeout(() => navigate("/"), 2000);
        return;
      }

      try {
        setMessage("Подтверждаем ваш аккаунт...");

        const { data, error: otpError } = await supabase.auth.verifyOtp({
          email,
          token,
          type,
        });

        if (otpError) throw otpError;
        if (!data.session) throw new Error("No session returned after verification");

        setStatus("success");
        setMessage("Вход выполнен!");
        setTimeout(() => navigate("/settings", { replace: true }), 1000);
      } catch (err: any) {
        console.error("AuthCallback error:", err);
        setStatus("error");
        setMessage(`Не удалось войти: ${err.message}`);
        setTimeout(() => navigate("/"), 4000);
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
        gap: "1.25rem",
        color: "var(--text-primary)",
        background: "var(--bg-app)",
      }}
    >
      {status === "loading" && (
        <Loader2 size={44} className="animate-spin" style={{ color: "var(--primary)" }} />
      )}
      {status === "success" && (
        <CheckCircle size={44} style={{ color: "var(--success)" }} />
      )}
      {status === "error" && (
        <AlertCircle size={44} style={{ color: "var(--error)" }} />
      )}
      <p style={{ fontSize: "1rem", color: "var(--text-secondary)", textAlign: "center", maxWidth: "300px" }}>
        {message}
      </p>
    </div>
  );
}
