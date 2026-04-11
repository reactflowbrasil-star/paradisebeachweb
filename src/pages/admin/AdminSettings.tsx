import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api, getImageUrl } from "@/lib/api";
import { useSettings } from "@/contexts/SettingsContext";
import { Loader2, Save, Map, Globe, Image as ImageIcon, Trash2, Upload, LayoutTemplate } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminSettings() {
  const { settings, refreshSettings } = useSettings();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    mapbox_token: "",
    site_title: "",
    site_subtitle: "",
    site_about: "",
  });

  const [introImg, setIntroImg] = useState<string>("");
  const [heroSlider, setHeroSlider] = useState<string[]>([]);
  const [siteGallery, setSiteGallery] = useState<string[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setFormData({
        mapbox_token: settings.mapbox_token || "",
        site_title: settings.site_title || "",
        site_subtitle: settings.site_subtitle || "",
        site_about: settings.site_about || "",
      });
      setIntroImg(settings.intro_img || "");
      
      try {
        setHeroSlider(Array.isArray(settings.hero_slider) ? settings.hero_slider : settings.hero_slider ? JSON.parse(settings.hero_slider) : []);
      } catch (e) { setHeroSlider([]); }

      try {
        setSiteGallery(Array.isArray(settings.site_gallery) ? settings.site_gallery : settings.site_gallery ? JSON.parse(settings.site_gallery) : []);
      } catch (e) { setSiteGallery([]); }
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.updateSettings({
        ...formData,
        intro_img: introImg,
        hero_slider: JSON.stringify(heroSlider),
        site_gallery: JSON.stringify(siteGallery),
      });
      await refreshSettings();
      toast.success("Configurações salvas com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar configurações.");
    } finally {
      setLoading(false);
    }
  };

  const handleGeneralUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: "intro" | "hero" | "gallery") => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploading(target);
    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const res = await api.uploadSitePhoto(files[i]);
        urls.push(res.url);
      }

      if (target === "intro") {
        setIntroImg(urls[0]);
      } else if (target === "hero") {
        setHeroSlider(prev => [...prev, ...urls]);
      } else if (target === "gallery") {
        setSiteGallery(prev => [...prev, ...urls]);
      }
      
      toast.success("Upload concluído!");
    } catch (error) {
      toast.error("Falha no upload.");
    } finally {
      setUploading(null);
      e.target.value = "";
    }
  };

  const removeArrayItem = (target: "hero" | "gallery", index: number) => {
    if (target === "hero") {
      setHeroSlider(prev => prev.filter((_, i) => i !== index));
    } else {
      setSiteGallery(prev => prev.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Site e Configurações</h2>
          <p className="text-muted-foreground">Gerencie o conteúdo estático, imagens do site e as chaves de API.</p>
        </div>
        <Button onClick={handleSubmit} disabled={loading} className="px-8 bg-gradient-ocean hover:opacity-90 shadow-md">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Salvar Tudo
        </Button>
      </div>

      <Tabs defaultValue="content" className="w-full">
        <TabsList className="bg-slate-100">
          <TabsTrigger value="content"><LayoutTemplate className="h-4 w-4 mr-2" /> Conteúdo & Textos</TabsTrigger>
          <TabsTrigger value="media"><ImageIcon className="h-4 w-4 mr-2" /> Mídia Global</TabsTrigger>
          <TabsTrigger value="system"><Map className="h-4 w-4 mr-2" /> Sistema & Geocoding</TabsTrigger>
        </TabsList>

        <form onSubmit={handleSubmit} className="mt-6">
          <TabsContent value="content" className="space-y-6">
            <Card className="border-slate-200">
              <CardHeader className="bg-slate-50 border-b border-slate-100">
                <CardTitle>Textos e Seções Iniciais</CardTitle>
                <CardDescription>Edite os textos principais que aparecem na Landing Page.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label>Título Principal (Hero)</Label>
                  <Input value={formData.site_title} onChange={e => setFormData({...formData, site_title: e.target.value})} placeholder="Paraíso te espera..." />
                </div>
                <div className="space-y-2">
                  <Label>Subtítulo (Hero)</Label>
                  <Input value={formData.site_subtitle} onChange={e => setFormData({...formData, site_subtitle: e.target.value})} placeholder="As melhores propriedades do litoral." />
                </div>
                <div className="space-y-2">
                  <Label>Texto da seção: Sobre Nós</Label>
                  <Textarea rows={6} value={formData.site_about} onChange={e => setFormData({...formData, site_about: e.target.value})} placeholder="A Paradise Beach é especializada..." />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="media" className="space-y-6">
            <Card className="border-slate-200">
              <CardHeader className="bg-slate-50 border-b border-slate-100">
                <CardTitle>Imagens do Site</CardTitle>
                <CardDescription>Carregue a capa da Introdução, Slider e Galeria.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8 pt-6">
                
                {/* Intro */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-lg font-bold">Animação de Introdução (Intro)</Label>
                    <p className="text-sm text-muted-foreground">Imagem que pisca no início.</p>
                  </div>
                  <div className="flex items-center gap-4">
                    {introImg ? <img src={getImageUrl(introImg)} className="h-24 w-40 object-cover rounded shadow" /> : <div className="h-24 w-40 bg-slate-100 rounded flex items-center justify-center text-xs">Sem Imagem</div>}
                    <label className="flex items-center justify-center gap-2 bg-slate-100 px-4 py-2 rounded border cursor-pointer hover:bg-slate-200 transition">
                      {uploading === "intro" ? <Loader2 className="animate-spin h-4 w-4" /> : <Upload className="h-4 w-4" />} Upload
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleGeneralUpload(e, "intro")} disabled={!!uploading} />
                    </label>
                  </div>
                </div>

                {/* Hero */}
                <div className="space-y-4 border-t pt-6">
                  <div>
                    <Label className="text-lg font-bold">Slider Principal (Hero)</Label>
                    <p className="text-sm text-muted-foreground">Selecione múltiplas para um carrossel no topo.</p>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {heroSlider.map((url, i) => (
                      <div key={i} className="relative group">
                        <img src={getImageUrl(url)} className="h-24 w-40 object-cover rounded shadow" />
                        <button type="button" onClick={() => removeArrayItem("hero", i)} className="absolute top-1 right-1 bg-red-500 text-white rounded p-1 opacity-0 group-hover:opacity-100 transition"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    ))}
                    <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-300 h-24 w-40 rounded cursor-pointer hover:bg-slate-50 transition">
                      {uploading === "hero" ? <Loader2 className="animate-spin h-6 w-6 text-slate-400" /> : <Upload className="h-6 w-6 text-slate-400" />}
                      <span className="text-xs text-slate-500">Adicionar fotos</span>
                      <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleGeneralUpload(e, "hero")} disabled={!!uploading} />
                    </label>
                  </div>
                </div>

                {/* General Gallery */}
                <div className="space-y-4 border-t pt-6">
                  <div>
                    <Label className="text-lg font-bold">Galeria Geral do Site</Label>
                    <p className="text-sm text-muted-foreground">Imagens que serão exibidas embaixo no site para apresentação do ambiente/trabalho.</p>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {siteGallery.map((url, i) => (
                      <div key={i} className="relative group">
                        <img src={getImageUrl(url)} className="h-24 w-24 object-cover rounded shadow" />
                        <button type="button" onClick={() => removeArrayItem("gallery", i)} className="absolute top-1 right-1 bg-red-500 text-white rounded p-1 opacity-0 group-hover:opacity-100 transition"><Trash2 className="h-3 w-3" /></button>
                      </div>
                    ))}
                    <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-300 h-24 w-24 rounded cursor-pointer hover:bg-slate-50 transition">
                      {uploading === "gallery" ? <Loader2 className="animate-spin h-6 w-6 text-slate-400" /> : <Plus className="h-6 w-6 text-slate-400" />}
                      <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleGeneralUpload(e, "gallery")} disabled={!!uploading} />
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <Card className="border-slate-200">
              <CardHeader className="bg-slate-50 border-b border-slate-100">
                <CardTitle>Mapas e Localização</CardTitle>
                <CardDescription>Obrigatório para recursos do Google Maps/Mapbox.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Mapbox Access Token</Label>
                    <Input value={formData.mapbox_token} onChange={(e) => setFormData({ ...formData, mapbox_token: e.target.value })} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </form>
      </Tabs>
    </div>
  );
}

function Plus(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>;
}
