import React, { createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../services/supabase";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signInWithEmail: (email: string) => Promise<void>;
  signInWithTelegram: (user: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
  signInWithEmail: async () => {},
  signInWithTelegram: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const signInWithEmail = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) throw error;
  };

  const signInWithTelegram = async (telegramUser: any) => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/telegram", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(telegramUser),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to authenticate with Telegram");
      }

      const { session } = data;
      const { error } = await supabase.auth.setSession(session);
      if (error) throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        signOut,
        signInWithEmail,
        signInWithTelegram,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
