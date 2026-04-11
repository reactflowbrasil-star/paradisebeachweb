import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const STORAGE_KEY = "paradise-admin-session";

interface AuthUser {
  email: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as AuthUser;
        setUser(parsed);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const result = await api.login(email, password);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(result.user));
      setUser(result.user);
      return null;
    } catch (error) {
      return error instanceof Error ? error : new Error("Falha ao entrar.");
    }
  };

  const signUp = async () => new Error("O cadastro está desativado nesta versão.");

  const signOut = async () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  return {
    user,
    session: user,
    loading,
    signIn,
    signUp,
    signOut,
    configured: true,
    configError: null,
  };
}
