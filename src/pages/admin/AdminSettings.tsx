import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { useSettings } from "@/contexts/SettingsContext";
import { Loader2, Save, Map, Globe, Info } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AdminSettings() {
  const { settings, refreshSettings } = useSettings();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    mapbox_token: "",
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        mapbox_token: settings.mapbox_token || "",
      });
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.updateSettings(formData);
      await refreshSettings();
      toast.success("Configurações salvas com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar configurações.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Configurações</h2>
        <p className="text-muted-foreground">Gerencie as chaves de API e configurações globais do sistema.</p>
      </div>

      <div className="grid gap-6">
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Map className="h-5 w-5 text-primary" />
              <CardTitle>Mapas e Localização</CardTitle>
            </div>
            <CardDescription>Configure sua integração com o Mapbox para mapas e geolocalização.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mapbox_token" className="text-slate-700 font-semibold">Mapbox Access Token</Label>
                  <div className="flex gap-2">
                    <Input
                      id="mapbox_token"
                      placeholder="pk.ey..."
                      value={formData.mapbox_token}
                      onChange={(e) => setFormData({ ...formData, mapbox_token: e.target.value })}
                      className="bg-white border-slate-200 focus:ring-primary"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Este token é usado para carregar os mapas e realizar buscas de endereço (Geocoding).
                  </p>
                </div>

                <Alert className="bg-blue-50 border-blue-100 text-blue-800">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-900 font-bold mb-1">Dica técnica</AlertTitle>
                  <AlertDescription className="text-blue-800/80 leading-relaxed">
                    O token salvo aqui terá prioridade sobre o definido no arquivo <code>.env</code>. 
                    Certifique-se de que o token habilitado no Mapbox Dashboard permite acesso ao domínio <b>paradisebeach.com.br</b>.
                  </AlertDescription>
                </Alert>
              </div>

              <div className="flex items-center justify-end border-t border-slate-100 pt-6">
                <Button type="submit" disabled={loading} className="px-8 bg-gradient-ocean hover:opacity-90 shadow-md">
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Salvar Alterações
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm opacity-60">
          <CardHeader>
             <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-slate-400" />
              <CardTitle className="text-slate-500">SEO e Redes Sociais</CardTitle>
            </div>
            <CardDescription>Em breve: Configure meta tags e imagens de compartilhamento globalmente.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
