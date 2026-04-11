import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";

interface SettingsContextType {
  settings: Record<string, any>;
  mapboxToken: string;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const [privateSettings, publicSettings] = await Promise.all([
        api.getSettings().catch(() => ({})),
        api.getPublicSiteSettings().catch(() => ({})),
      ]);
      setSettings({
        ...privateSettings,
        ...publicSettings,
      });
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const mapboxToken = settings.mapbox_token || import.meta.env.VITE_MAPBOX_TOKEN || "";

  return (
    <SettingsContext.Provider value={{ settings, mapboxToken, loading, refreshSettings: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
