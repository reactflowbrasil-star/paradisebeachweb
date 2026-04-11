import { useEffect, useMemo, useState } from "react";
import { Eye, FileText, Loader2, MenuSquare, Plus, RefreshCw, Save, Settings2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  api,
  getImageUrl,
  type CmsContentItem,
  type CmsMenuItem,
  type CmsPageSummary,
  type CmsSection,
  type CmsSiteSetting,
  type CmsStatus,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

type ContentEditorState = {
  id?: string;
  page_id: string;
  section_id: string;
  content_key: string;
  item_type: string;
  category: string;
  title: string;
  subtitle: string;
  description: string;
  text_content: string;
  image_url: string;
  icon_name: string;
  link_url: string;
  button_label: string;
  sort_order: number;
  status: CmsStatus;
  meta_json_text: string;
};

const STATUS_OPTIONS: CmsStatus[] = ["draft", "published", "inactive"];

function createEmptyEditor(pageId = "", sectionId = ""): ContentEditorState {
  return {
    page_id: pageId,
    section_id: sectionId,
    content_key: "",
    item_type: "text",
    category: "",
    title: "",
    subtitle: "",
    description: "",
    text_content: "",
    image_url: "",
    icon_name: "",
    link_url: "",
    button_label: "",
    sort_order: 0,
    status: "draft",
    meta_json_text: "{}",
  };
}

function toEditorState(item: CmsContentItem): ContentEditorState {
  return {
    id: item.id,
    page_id: item.page_id,
    section_id: item.section_id || "",
    content_key: item.content_key,
    item_type: item.item_type,
    category: item.category || "",
    title: item.title || "",
    subtitle: item.subtitle || "",
    description: item.description || "",
    text_content: item.text_content || "",
    image_url: item.image_url || "",
    icon_name: item.icon_name || "",
    link_url: item.link_url || "",
    button_label: item.button_label || "",
    sort_order: item.sort_order || 0,
    status: item.status,
    meta_json_text: item.meta_json ? JSON.stringify(item.meta_json, null, 2) : "{}",
  };
}

function statusBadge(status: CmsStatus) {
  if (status === "published") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "inactive") return "bg-slate-100 text-slate-600 border-slate-200";
  return "bg-amber-50 text-amber-700 border-amber-200";
}

export default function AdminContent() {
  const [pages, setPages] = useState<CmsPageSummary[]>([]);
  const [selectedPageId, setSelectedPageId] = useState("");
  const [sections, setSections] = useState<CmsSection[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [contentItems, setContentItems] = useState<CmsContentItem[]>([]);
  const [selectedContentId, setSelectedContentId] = useState("");
  const [editor, setEditor] = useState<ContentEditorState>(createEmptyEditor());
  const [menus, setMenus] = useState<CmsMenuItem[]>([]);
  const [siteSettings, setSiteSettings] = useState<CmsSiteSetting[]>([]);
  const [activeMenuKey, setActiveMenuKey] = useState("main");
  const [loadingPages, setLoadingPages] = useState(true);
  const [loadingContent, setLoadingContent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const selectedPage = useMemo(() => pages.find((page) => page.id === selectedPageId) || null, [pages, selectedPageId]);
  const filteredMenus = useMemo(() => menus.filter((item) => item.menu_key === activeMenuKey), [menus, activeMenuKey]);

  async function loadPages() {
    setLoadingPages(true);
    try {
      const data = await api.getAdminPages();
      setPages(data);
      if (!selectedPageId && data[0]) {
        setSelectedPageId(data[0].id);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao carregar paginas.");
    } finally {
      setLoadingPages(false);
    }
  }

  async function loadPageContext(pageId: string) {
    if (!pageId) return;
    setLoadingContent(true);
    try {
      const [{ sections: nextSections }, nextItems] = await Promise.all([
        api.getAdminPageSections(pageId),
        api.getAdminContent({ page_id: pageId }),
      ]);
      setSections(nextSections);
      setContentItems(nextItems);

      const firstSectionId = nextSections[0]?.id || "";
      setSelectedSectionId((current) => (current && nextSections.some((section) => section.id === current) ? current : firstSectionId));

      if (selectedContentId && !nextItems.some((item) => item.id === selectedContentId)) {
        setSelectedContentId("");
      }

      if (!selectedContentId) {
        const firstItem = nextItems.find((item) => !firstSectionId || item.section_id === firstSectionId) || nextItems[0];
        if (firstItem) {
          setSelectedContentId(firstItem.id);
          setEditor(toEditorState(firstItem));
        } else {
          setEditor(createEmptyEditor(pageId, firstSectionId));
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao carregar contexto da pagina.");
    } finally {
      setLoadingContent(false);
    }
  }

  async function loadMenus() {
    try {
      setMenus(await api.getAdminMenus());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao carregar menus.");
    }
  }

  async function loadSiteSettings() {
    try {
      setSiteSettings(await api.getAdminSiteSettings());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao carregar configuracoes publicas.");
    }
  }

  useEffect(() => {
    void Promise.all([loadPages(), loadMenus(), loadSiteSettings()]);
  }, []);

  useEffect(() => {
    if (selectedPageId) {
      void loadPageContext(selectedPageId);
    }
  }, [selectedPageId]);

  useEffect(() => {
    const selectedItem = contentItems.find((item) => item.id === selectedContentId);
    if (selectedItem) {
      setEditor(toEditorState(selectedItem));
    } else if (selectedPageId) {
      setEditor((current) => ({ ...current, page_id: selectedPageId, section_id: selectedSectionId }));
    }
  }, [selectedContentId, contentItems, selectedPageId, selectedSectionId]);
  const handleCreateItem = () => {
    setSelectedContentId("");
    setEditor(createEmptyEditor(selectedPageId, selectedSectionId));
  };

  const handleEditorChange = (field: keyof ContentEditorState, value: string | number) => {
    setEditor((current) => ({ ...current, [field]: value }));
  };

  const handleSaveContent = async () => {
    if (!editor.page_id || !editor.content_key.trim()) {
      toast.error("Selecione a pagina e informe uma chave unica para o conteudo.");
      return;
    }

    setSaving(true);
    try {
      const metaText = editor.meta_json_text.trim();
      const payload = {
        page_id: editor.page_id,
        section_id: editor.section_id || null,
        content_key: editor.content_key.trim(),
        item_type: editor.item_type.trim() || "text",
        category: editor.category.trim() || null,
        title: editor.title.trim() || null,
        subtitle: editor.subtitle.trim() || null,
        description: editor.description.trim() || null,
        text_content: editor.text_content.trim() || null,
        image_url: editor.image_url.trim() || null,
        icon_name: editor.icon_name.trim() || null,
        link_url: editor.link_url.trim() || null,
        button_label: editor.button_label.trim() || null,
        sort_order: Number(editor.sort_order || 0),
        status: editor.status,
        meta_json: metaText ? JSON.parse(metaText) : null,
      };

      const saved = editor.id ? await api.updateAdminContent(editor.id, payload) : await api.createAdminContent(payload);
      toast.success(editor.id ? "Conteudo atualizado." : "Conteudo criado.");
      await loadPageContext(saved.page_id);
      setSelectedContentId(saved.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar conteudo.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteContent = async () => {
    if (!editor.id) return;
    setSaving(true);
    try {
      await api.deleteAdminContent(editor.id);
      toast.success("Conteudo removido do frontend.");
      setSelectedContentId("");
      setEditor(createEmptyEditor(selectedPageId, selectedSectionId));
      await loadPageContext(selectedPageId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao remover conteudo.");
    } finally {
      setSaving(false);
    }
  };

  const handleUploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const response = await api.uploadSitePhoto(file);
      setEditor((current) => ({ ...current, image_url: response.url }));
      toast.success("Imagem enviada com sucesso.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao enviar imagem.");
    } finally {
      event.target.value = "";
      setUploadingImage(false);
    }
  };

  const handleSaveSection = async (sectionId: string, payload: Partial<CmsSection>) => {
    try {
      const updated = await api.updateAdminSection(sectionId, payload);
      setSections((current) => current.map((section) => (section.id === sectionId ? updated : section)));
      toast.success("Secao atualizada.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar secao.");
    }
  };

  const handleSaveMenuItem = async (menuId: string, payload: Partial<CmsMenuItem>) => {
    try {
      const updated = await api.updateAdminMenu(menuId, payload);
      setMenus((current) => current.map((item) => (item.id === menuId ? { ...item, ...updated } : item)));
      toast.success("Menu atualizado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar menu.");
    }
  };

  const handleSaveSiteSetting = async (settingId: string, payload: Partial<CmsSiteSetting>) => {
    try {
      const updated = await api.updateAdminSiteSetting(settingId, payload);
      setSiteSettings((current) => current.map((setting) => (setting.id === settingId ? updated : setting)));
      toast.success("Configuracao salva.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar configuracao.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">CMS Interno do Frontend</h1>
          <p className="text-muted-foreground">Gerencie paginas, secoes, menus e configuracoes publicas sem alterar o codigo do site.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { void Promise.all([loadPages(), loadMenus(), loadSiteSettings()]); }}>
            <RefreshCw className="mr-2 h-4 w-4" /> Atualizar dados
          </Button>
          <Button className="bg-gradient-ocean hover:opacity-90" onClick={handleSaveContent} disabled={saving || loadingContent}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar conteudo atual
          </Button>
        </div>
      </div>

      <Tabs defaultValue="content" className="w-full">
        <TabsList className="bg-slate-100">
          <TabsTrigger value="content"><FileText className="mr-2 h-4 w-4" /> Conteudo</TabsTrigger>
          <TabsTrigger value="menus"><MenuSquare className="mr-2 h-4 w-4" /> Menus</TabsTrigger>
          <TabsTrigger value="settings"><Settings2 className="mr-2 h-4 w-4" /> Configuracoes Publicas</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="mt-6">
          <div className="grid gap-6 xl:grid-cols-[280px_320px_minmax(0,1fr)]">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle>Paginas</CardTitle>
                <CardDescription>Escolha a pagina do frontend que deseja editar.</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingPages ? (
                  <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
                ) : (
                  <div className="space-y-2">
                    {pages.map((page) => (
                      <button key={page.id} type="button" onClick={() => setSelectedPageId(page.id)} className={`w-full rounded-xl border p-3 text-left transition ${selectedPageId === page.id ? "border-primary bg-primary/5" : "border-slate-200 hover:border-primary/40"}`}>
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-900">{page.name}</p>
                            <p className="text-xs text-muted-foreground">/{page.slug}</p>
                          </div>
                          <Badge variant="outline" className={statusBadge(page.status)}>{page.status}</Badge>
                        </div>
                        <div className="mt-3 flex gap-2 text-xs text-muted-foreground">
                          <span>{page.section_count} secoes</span>
                          <span>{page.content_count} itens</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>Secoes e Blocos</CardTitle>
                    <CardDescription>Organize a estrutura da pagina selecionada.</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleCreateItem} disabled={!selectedPageId}>
                    <Plus className="mr-2 h-4 w-4" /> Novo item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingContent ? (
                  <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
                ) : !selectedPage ? (
                  <p className="text-sm text-muted-foreground">Selecione uma pagina para carregar o CMS.</p>
                ) : (
                  <ScrollArea className="h-[620px] pr-3">
                    <div className="space-y-4">
                      {sections.map((section) => (
                        <div key={section.id} className="rounded-xl border border-slate-200 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <button type="button" className="text-left" onClick={() => setSelectedSectionId(section.id)}>
                              <p className="font-medium text-slate-900">{section.name}</p>
                              <p className="text-xs text-muted-foreground">{section.section_key} • {section.section_type}</p>
                            </button>
                            <Badge variant="outline" className={statusBadge(section.status)}>{section.status}</Badge>
                          </div>
                          <div className="mt-3 grid gap-2">
                            <Input value={section.title || ""} onChange={(event) => setSections((current) => current.map((item) => item.id === section.id ? { ...item, title: event.target.value } : item))} placeholder="Titulo da secao" />
                            <Input value={section.subtitle || ""} onChange={(event) => setSections((current) => current.map((item) => item.id === section.id ? { ...item, subtitle: event.target.value } : item))} placeholder="Subtitulo" />
                            <div className="grid grid-cols-2 gap-2">
                              <Input type="number" value={section.sort_order} onChange={(event) => setSections((current) => current.map((item) => item.id === section.id ? { ...item, sort_order: Number(event.target.value || 0) } : item))} placeholder="Ordem" />
                              <Select value={section.status} onValueChange={(value: CmsStatus) => setSections((current) => current.map((item) => item.id === section.id ? { ...item, status: value } : item))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{STATUS_OPTIONS.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => handleSaveSection(section.id, { title: section.title, subtitle: section.subtitle, sort_order: section.sort_order, status: section.status })}>
                              <Save className="mr-2 h-4 w-4" /> Salvar secao
                            </Button>
                          </div>

                          <div className="mt-4 space-y-2">
                            {contentItems.filter((item) => item.section_id === section.id).map((item) => (
                              <button key={item.id} type="button" onClick={() => setSelectedContentId(item.id)} className={`w-full rounded-lg border p-3 text-left transition ${selectedContentId === item.id ? "border-primary bg-primary/5" : "border-slate-200 hover:border-primary/40"}`}>
                                <div className="flex items-center justify-between gap-2">
                                  <div>
                                    <p className="text-sm font-medium text-slate-900">{item.title || item.content_key}</p>
                                    <p className="text-xs text-muted-foreground">{item.item_type} • ordem {item.sort_order}</p>
                                  </div>
                                  <Badge variant="outline" className={statusBadge(item.status)}>{item.status}</Badge>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>Editor de Conteudo</CardTitle>
                    <CardDescription>Edite o bloco selecionado e visualize antes de publicar.</CardDescription>
                  </div>
                  {editor.id ? (
                    <Button variant="ghost" size="sm" onClick={handleDeleteContent} disabled={saving} className="text-destructive hover:text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" /> Remover
                    </Button>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent>
                {!selectedPageId ? (
                  <p className="text-sm text-muted-foreground">Selecione uma pagina para iniciar.</p>
                ) : (
                  <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Pagina</Label>
                          <Select value={editor.page_id || selectedPageId} onValueChange={(value) => handleEditorChange("page_id", value)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>{pages.map((page) => <SelectItem key={page.id} value={page.id}>{page.name}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Secao</Label>
                          <Select value={editor.section_id || "none"} onValueChange={(value) => handleEditorChange("section_id", value === "none" ? "" : value)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Sem secao</SelectItem>
                              {sections.map((section) => <SelectItem key={section.id} value={section.id}>{section.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2"><Label>Chave unica</Label><Input value={editor.content_key} onChange={(event) => handleEditorChange("content_key", event.target.value)} placeholder="home-hero-primary" /></div>
                        <div className="space-y-2"><Label>Tipo</Label><Input value={editor.item_type} onChange={(event) => handleEditorChange("item_type", event.target.value)} placeholder="hero, card, text, faq..." /></div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2"><Label>Categoria</Label><Input value={editor.category} onChange={(event) => handleEditorChange("category", event.target.value)} placeholder="home-benefits" /></div>
                        <div className="space-y-2"><Label>Icone</Label><Input value={editor.icon_name} onChange={(event) => handleEditorChange("icon_name", event.target.value)} placeholder="Gem, Shield, Phone..." /></div>
                      </div>

                      <div className="space-y-2"><Label>Titulo</Label><Input value={editor.title} onChange={(event) => handleEditorChange("title", event.target.value)} /></div>
                      <div className="space-y-2"><Label>Subtitulo</Label><Input value={editor.subtitle} onChange={(event) => handleEditorChange("subtitle", event.target.value)} /></div>
                      <div className="space-y-2"><Label>Descricao</Label><Textarea rows={3} value={editor.description} onChange={(event) => handleEditorChange("description", event.target.value)} /></div>
                      <div className="space-y-2"><Label>Texto/Rich text</Label><Textarea rows={6} value={editor.text_content} onChange={(event) => handleEditorChange("text_content", event.target.value)} /></div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2"><Label>Imagem</Label><Input value={editor.image_url} onChange={(event) => handleEditorChange("image_url", event.target.value)} placeholder="/uploads/site/banner.jpg" /></div>
                        <div className="space-y-2">
                          <Label>Upload rapido</Label>
                          <label className="flex h-10 cursor-pointer items-center justify-center rounded-md border border-dashed border-slate-300 text-sm hover:bg-slate-50">
                            {uploadingImage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />} Enviar imagem
                            <input type="file" accept="image/*" className="hidden" onChange={handleUploadImage} />
                          </label>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2"><Label>Link</Label><Input value={editor.link_url} onChange={(event) => handleEditorChange("link_url", event.target.value)} /></div>
                        <div className="space-y-2"><Label>Label do botao</Label><Input value={editor.button_label} onChange={(event) => handleEditorChange("button_label", event.target.value)} /></div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2"><Label>Ordem</Label><Input type="number" value={editor.sort_order} onChange={(event) => handleEditorChange("sort_order", Number(event.target.value || 0))} /></div>
                        <div className="space-y-2">
                          <Label>Status</Label>
                          <Select value={editor.status} onValueChange={(value: CmsStatus) => handleEditorChange("status", value)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>{STATUS_OPTIONS.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2"><Label>Meta JSON</Label><Textarea rows={8} value={editor.meta_json_text} onChange={(event) => handleEditorChange("meta_json_text", event.target.value)} placeholder='{"rating":5}' /></div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-2xl border border-dashed border-slate-200 p-4">
                        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700"><Eye className="h-4 w-4" /> Pre-visualizacao</div>
                        <div className="space-y-3 rounded-xl bg-slate-50 p-4">
                          <Badge variant="outline" className={statusBadge(editor.status)}>{editor.status}</Badge>
                          <div>
                            <p className="text-lg font-semibold text-slate-900">{editor.title || "Sem titulo"}</p>
                            {editor.subtitle ? <p className="text-sm text-muted-foreground">{editor.subtitle}</p> : null}
                          </div>
                          {editor.image_url ? <img src={getImageUrl(editor.image_url)} alt="Preview" className="h-40 w-full rounded-lg object-cover" /> : null}
                          {editor.description ? <p className="text-sm text-muted-foreground">{editor.description}</p> : null}
                          {editor.text_content ? <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{editor.text_content}</p> : null}
                          {editor.button_label || editor.link_url ? <div className="rounded-lg bg-white px-4 py-3 text-sm shadow-sm"><strong>{editor.button_label || "Botao"}</strong><p className="text-muted-foreground">{editor.link_url || "Sem link configurado"}</p></div> : null}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="menus" className="mt-6">
          <Card className="border-slate-200">
            <CardHeader>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle>Menus do Frontend</CardTitle>
                  <CardDescription>Atualize labels, links, ordem e status dos menus publico e rodape.</CardDescription>
                </div>
                <Select value={activeMenuKey} onValueChange={setActiveMenuKey}>
                  <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main">Menu principal</SelectItem>
                    <SelectItem value="footer">Menu do rodape</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredMenus.map((item) => (
                  <div key={item.id} className="grid gap-3 rounded-xl border border-slate-200 p-4 md:grid-cols-[1.3fr_1.2fr_140px_120px_auto] md:items-center">
                    <Input value={item.label} onChange={(event) => setMenus((current) => current.map((entry) => entry.id === item.id ? { ...entry, label: event.target.value } : entry))} />
                    <Input value={item.url} onChange={(event) => setMenus((current) => current.map((entry) => entry.id === item.id ? { ...entry, url: event.target.value } : entry))} />
                    <Input type="number" value={item.sort_order} onChange={(event) => setMenus((current) => current.map((entry) => entry.id === item.id ? { ...entry, sort_order: Number(event.target.value || 0) } : entry))} />
                    <Select value={item.status} onValueChange={(value: CmsStatus) => setMenus((current) => current.map((entry) => entry.id === item.id ? { ...entry, status: value } : entry))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUS_OPTIONS.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
                    </Select>
                    <Button variant="outline" onClick={() => handleSaveMenuItem(item.id, { label: item.label, url: item.url, sort_order: item.sort_order, status: item.status })}>
                      <Save className="mr-2 h-4 w-4" /> Salvar
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Configuracoes Publicas do Site</CardTitle>
              <CardDescription>Esses valores alimentam logo, contatos, rodape, imagens globais e fallbacks do frontend.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 lg:grid-cols-2">
                {siteSettings.map((setting) => (
                  <div key={setting.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">{setting.label}</p>
                        <p className="text-xs text-muted-foreground">{setting.setting_key} • {setting.setting_group}</p>
                      </div>
                      <Badge variant="outline" className={statusBadge(setting.status)}>{setting.status}</Badge>
                    </div>

                    <div className="space-y-3">
                      {setting.value_type === "textarea" || setting.value_type === "json" ? (
                        <Textarea rows={4} value={setting.setting_value || ""} onChange={(event) => setSiteSettings((current) => current.map((entry) => entry.id === setting.id ? { ...entry, setting_value: event.target.value } : entry))} />
                      ) : (
                        <Input value={setting.setting_value || ""} onChange={(event) => setSiteSettings((current) => current.map((entry) => entry.id === setting.id ? { ...entry, setting_value: event.target.value } : entry))} />
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <Input type="number" value={setting.sort_order} onChange={(event) => setSiteSettings((current) => current.map((entry) => entry.id === setting.id ? { ...entry, sort_order: Number(event.target.value || 0) } : entry))} />
                        <Select value={setting.status} onValueChange={(value: CmsStatus) => setSiteSettings((current) => current.map((entry) => entry.id === setting.id ? { ...entry, status: value } : entry))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{STATUS_OPTIONS.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>

                      <Button variant="outline" onClick={() => handleSaveSiteSetting(setting.id, { setting_value: setting.setting_value, sort_order: setting.sort_order, status: setting.status })}>
                        <Save className="mr-2 h-4 w-4" /> Salvar configuracao
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
