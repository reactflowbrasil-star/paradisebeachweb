import { useEffect, useState } from "react";
import { SUPABASE_CONFIG_ERROR, SUPABASE_CONFIGURED, supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!SUPABASE_CONFIGURED) {
      setLoading(false);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!SUPABASE_CONFIGURED) {
      return new Error(SUPABASE_CONFIG_ERROR ?? "Supabase não configurado.");
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error?.message.toLowerCase().includes("email not confirmed")) {
      return new Error("Seu e-mail ainda não foi confirmado. Abra sua caixa de entrada e confirme o acesso antes de entrar.");
    }
    return error;
  };

  const signUp = async (email: string, password: string) => {
    if (!SUPABASE_CONFIGURED) {
      return new Error(SUPABASE_CONFIG_ERROR ?? "Supabase não configurado.");
    }

    const { error } = await supabase.auth.signUp({ email, password });
    return error;
  };

  const signOut = async () => {
    if (!SUPABASE_CONFIGURED) return;
    await supabase.auth.signOut();
  };

  return { user, session, loading, signIn, signUp, signOut, configured: SUPABASE_CONFIGURED, configError: SUPABASE_CONFIG_ERROR };
}
