import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const STORAGE_KEY = "paradise-admin-session";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
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
      // Save token too if needed for backend auth (api.ts uses request helper which is currently stateless but uses global BASE_URL)
      // If the backend needs tokens, we'd add it to headers in requests.
      setUser(result.user);
      return null;
    } catch (error) {
      return error instanceof Error ? error : new Error("Falha ao entrar.");
    }
  };

  const signUp = async (name: string, email: string, password: string) => {
    try {
      const result = await api.register({ name, email, password });
      // Automagically sign in after register
      await signIn(email, password);
      return null;
    } catch (error) {
      return error instanceof Error ? error : new Error("Falha ao cadastrar.");
    }
  };

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
