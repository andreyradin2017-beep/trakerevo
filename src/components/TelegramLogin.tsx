import React, { useEffect, useRef } from "react";

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

interface TelegramLoginProps {
  botName: string;
  onAuth: (user: TelegramUser) => void;
  buttonSize?: "large" | "medium" | "small";
  cornerRadius?: number;
  requestAccess?: "write";
  usePic?: boolean;
}

declare global {
  interface Window {
    onTelegramAuth: (user: TelegramUser) => void;
  }
}

export const TelegramLogin: React.FC<TelegramLoginProps> = ({
  botName,
  onAuth,
  buttonSize = "large",
  cornerRadius,
  requestAccess = "write",
  usePic = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.onTelegramAuth = (user: TelegramUser) => {
      onAuth(user);
    };

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", botName);
    script.setAttribute("data-size", buttonSize);
    if (cornerRadius !== undefined) {
      script.setAttribute("data-radius", cornerRadius.toString());
    }
    script.setAttribute("data-request-access", requestAccess);
    script.setAttribute("data-userpic", usePic.toString());
    script.setAttribute("data-onauth", "onTelegramAuth(user)");
    script.async = true;

    if (containerRef.current) {
      containerRef.current.appendChild(script);
    }

    return () => {
      const container = containerRef.current;
      if (container) {
        container.innerHTML = "";
      }
      (window as any).onTelegramAuth = undefined;
    };
  }, [botName, onAuth, buttonSize, cornerRadius, requestAccess, usePic]);

  return <div ref={containerRef} id="telegram-login-container" />;
};
