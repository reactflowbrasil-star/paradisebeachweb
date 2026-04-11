import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { api, type DbPhoto, type DbProperty } from "@/lib/api";
import {
  Bath,
  Bed,
  Camera,
  Edit3,
  Eye,
  Loader2,
  MapPin,
  Maximize,
  Phone,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";

const formatPrice = (price: number, label?: string | null) =>
  `R$ ${price.toLocaleString("pt-BR")}${label || ""}`;

const statusBadge: Record<string, string> = {
  disponivel: "bg-emerald-50 text-emerald-700 border-emerald-200",
  alugado: "bg-blue-50 text-blue-700 border-blue-200",
  vendido: "bg-slate-50 text-slate-700 border-slate-200",
};

const emptyPropertyForm = {
  title: "",
  type: "casa" as DbProperty["type"],
  listing: "aluguel" as DbProperty["listing"],
  price: "",
  price_label: "/diária",
  city: "",
  state: "",
  location: "",
  description: "",
  bedrooms: "0",
  bathrooms: "0",
  area: "0",
  whatsapp: "",
  lat: "",
  lng: "",
  amenities: "",
  ocean_view: false,
  featured: false,
};

export default function AdminProperties() {
  const [properties, setProperties] = useState<DbProperty[]>([]);
  const [photos, setPhotos] = useState<DbPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DbProperty | null>(null);
  const [form, setForm] = useState(emptyPropertyForm);
  const [saving, setSaving] = useState(false);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [propsData, photosData] = await Promise.all([api.getProperties(), api.getPhotos()]);
      setProperties(propsData);
      setPhotos(photosData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = useMemo(() => {
    let list = properties;
    if (filterStatus !== "todos") {
      list = list.filter((p) => p.status === filterStatus);
    }
    const q = search.toLowerCase().trim();
    if (q) {
      list = list.filter((p) =>
        `${p.title} ${p.city} ${p.state} ${p.location}`.toLowerCase().includes(q)
      );
    }
    return list;
  }, [properties, search, filterStatus]);

  const photosByProperty = useMemo(() => {
    const map: Record<string, DbPhoto[]> = {};
    for (const ph of photos) {
      (map[ph.property_id] ??= []).push(ph);
    }
    return map;
  }, [photos]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyPropertyForm);
    setDialogOpen(true);
  };

  const openEdit = (p: DbProperty) => {
    setEditing(p);
    setForm({
      title: p.title,
      type: p.type,
      listing: p.listing,
      price: String(p.price),
      price_label: p.price_label ?? "",
      city: p.city,
      state: p.state,
      location: p.location,
      description: p.description,
      bedrooms: String(p.bedrooms),
      bathrooms: String(p.bathrooms),
      area: String(p.area),
      whatsapp: p.whatsapp ?? "",
      lat: p.lat != null ? String(p.lat) : "",
      lng: p.lng != null ? String(p.lng) : "",
      amenities: Array.isArray(p.amenities) ? p.amenities.join(", ") : "",
      ocean_view: Boolean(p.ocean_view),
      featured: Boolean(p.featured),
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Partial<DbProperty> & { amenities?: string[] } = {
        title: form.title,
        type: form.type,
        listing: form.listing,
        price: Number(form.price),
        price_label: form.price_label || null,
        city: form.city,
        state: form.state,
        location: form.location,
        description: form.description,
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        area: Number(form.area),
        whatsapp: form.whatsapp || null,
        lat: form.lat ? Number(form.lat) : null,
        lng: form.lng ? Number(form.lng) : null,
        amenities: form.amenities
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        ocean_view: form.ocean_view,
        featured: form.featured,
      };

      if (editing) {
        await api.updateProperty(editing.id, payload);
        toast.success("Imóvel atualizado!");
      } else {
        await api.createProperty(payload);
        toast.success("Imóvel cadastrado!");
      }
      setDialogOpen(false);
      fetchAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este imóvel?")) return;
    try {
      await api.deleteProperty(id);
      toast.success("Imóvel removido.");
      fetchAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao remover.");
    }
  };

  const toggleFeatured = async (p: DbProperty) => {
    await api.updateProperty(p.id, { featured: !p.featured });
    fetchAll();
  };

  const changeStatus = async (id: string, status: DbProperty["status"]) => {
    await api.updateProperty(id, { status });
    fetchAll();
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, propertyId: string) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingFor(propertyId);
    try {
      await api.uploadPhotos(propertyId, Array.from(files));
      toast.success(`${files.length} foto(s) enviada(s)!`);
      fetchAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao enviar fotos.");
    } finally {
      setUploadingFor(null);
      e.target.value = "";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Propriedades</h1>
          <p className="text-muted-foreground">Gerencie seus imóveis, preços e disponibilidade.</p>
        </div>
        <Button onClick={openCreate} className="gap-2 bg-gradient-ocean hover:opacity-90 shrink-0">
          <Plus className="h-4 w-4" />
          Novo Imóvel
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, cidade ou região..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {["todos", "disponivel", "alugado", "vendido"].map((s) => (
            <Button
              key={s}
              size="sm"
              variant={filterStatus === s ? "default" : "outline"}
              onClick={() => setFilterStatus(s)}
              className={filterStatus === s ? "bg-primary" : ""}
            >
              {s === "todos" ? "Todos" : s.charAt(0).toUpperCase() + s.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <MapPin className="h-8 w-8 text-primary" />
            </div>
            <h3 className="mb-1 text-lg font-semibold text-foreground">Nenhum imóvel encontrado</h3>
            <p className="text-sm text-muted-foreground">
              {search || filterStatus !== "todos"
                ? "Tente alterar os filtros ou buscar por outro termo."
                : "Cadastre seu primeiro imóvel para começar."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Property list */}
      <div className="grid gap-4">
        {filtered.map((p) => {
          const propPhotos = photosByProperty[p.id] ?? [];
          const coverPhoto = propPhotos.find((ph) => ph.cover) ?? propPhotos[0];
          return (
            <Card key={p.id} className="overflow-hidden border-slate-200 transition hover:shadow-md">
              <div className="flex flex-col md:flex-row">
                {/* Photo */}
                <div className="relative h-48 w-full shrink-0 bg-slate-100 md:h-auto md:w-56">
                  {coverPhoto ? (
                    <img src={coverPhoto.url} alt={p.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <Camera className="h-8 w-8" />
                    </div>
                  )}
                  {p.featured && (
                    <div className="absolute left-2 top-2">
                      <Badge className="gap-1 bg-amber-500/90 text-white border-0 text-xs">
                        <Sparkles className="h-3 w-3" /> Destaque
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{p.title}</h3>
                      <p className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {p.location}, {p.city} — {p.state}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">{formatPrice(p.price, p.price_label)}</p>
                      <Badge variant="outline" className={`mt-1 text-xs ${statusBadge[p.status] ?? ""}`}>
                        {p.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {p.bedrooms > 0 && (
                      <span className="flex items-center gap-1">
                        <Bed className="h-3.5 w-3.5" /> {p.bedrooms} quartos
                      </span>
                    )}
                    {p.bathrooms > 0 && (
                      <span className="flex items-center gap-1">
                        <Bath className="h-3.5 w-3.5" /> {p.bathrooms} banheiros
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Maximize className="h-3.5 w-3.5" /> {p.area}m²
                    </span>
                    <span className="flex items-center gap-1">
                      <Camera className="h-3.5 w-3.5" /> {propPhotos.length} fotos
                    </span>
                    {p.whatsapp && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" /> {p.whatsapp}
                      </span>
                    )}
                  </div>

                  {/* Photo thumbnails */}
                  {propPhotos.length > 0 && (
                    <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
                      {propPhotos.slice(0, 6).map((ph) => (
                        <img key={ph.id} src={ph.url} alt="" className="h-12 w-14 shrink-0 rounded object-cover opacity-80" />
                      ))}
                      {propPhotos.length > 6 && (
                        <div className="flex h-12 w-14 shrink-0 items-center justify-center rounded bg-slate-100 text-xs text-muted-foreground">
                          +{propPhotos.length - 6}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => openEdit(p)}>
                      <Edit3 className="h-3.5 w-3.5" /> Editar
                    </Button>
                    <Button
                      size="sm"
                      variant={p.featured ? "secondary" : "outline"}
                      className="gap-1.5"
                      onClick={() => toggleFeatured(p)}
                    >
                      <Sparkles className="h-3.5 w-3.5" /> {p.featured ? "Remover destaque" : "Destacar"}
                    </Button>
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-sm transition hover:bg-accent">
                      <Upload className="h-3.5 w-3.5" />
                      {uploadingFor === p.id ? "Enviando..." : "Fotos"}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => handlePhotoUpload(e, p.id)}
                        disabled={uploadingFor === p.id}
                      />
                    </label>
                    <select
                      className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                      value={p.status}
                      onChange={(e) => changeStatus(p.id, e.target.value as DbProperty["status"])}
                    >
                      <option value="disponivel">Disponível</option>
                      <option value="alugado">Alugado</option>
                      <option value="vendido">Vendido</option>
                    </select>
                    <Button size="sm" variant="ghost" className="ml-auto text-destructive hover:text-destructive" onClick={() => remove(p.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Imóvel" : "Cadastrar Novo Imóvel"}</DialogTitle>
            <DialogDescription>
              {editing ? "Atualize as informações do imóvel." : "Preencha os dados para cadastrar um novo imóvel."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-2">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="prop-title">Título</Label>
                <Input id="prop-title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prop-type">Tipo</Label>
                <select
                  id="prop-type"
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as DbProperty["type"] }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="casa">Casa</option>
                  <option value="villa">Villa</option>
                  <option value="apartamento">Apartamento</option>
                  <option value="terreno">Terreno</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prop-listing">Listagem</Label>
                <select
                  id="prop-listing"
                  value={form.listing}
                  onChange={(e) => setForm((f) => ({ ...f, listing: e.target.value as DbProperty["listing"] }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="aluguel">Aluguel</option>
                  <option value="venda">Venda</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prop-price">Preço</Label>
                <Input id="prop-price" type="number" min={0} value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prop-price-label">Rótulo do preço</Label>
                <Input id="prop-price-label" placeholder="/diária, /mês" value={form.price_label} onChange={(e) => setForm((f) => ({ ...f, price_label: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prop-city">Cidade</Label>
                <Input id="prop-city" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prop-state">UF</Label>
                <Input id="prop-state" value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value.toUpperCase() }))} maxLength={2} required />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="prop-location">Região / Bairro</Label>
                <Input id="prop-location" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prop-bedrooms">Quartos</Label>
                <Input id="prop-bedrooms" type="number" min={0} value={form.bedrooms} onChange={(e) => setForm((f) => ({ ...f, bedrooms: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prop-bathrooms">Banheiros</Label>
                <Input id="prop-bathrooms" type="number" min={0} value={form.bathrooms} onChange={(e) => setForm((f) => ({ ...f, bathrooms: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prop-area">Área (m²)</Label>
                <Input id="prop-area" type="number" min={0} value={form.area} onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prop-whatsapp">WhatsApp</Label>
                <Input id="prop-whatsapp" placeholder="5573999990000" value={form.whatsapp} onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prop-lat">Latitude</Label>
                <Input id="prop-lat" type="number" step="any" placeholder="-16.4536" value={form.lat} onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prop-lng">Longitude</Label>
                <Input id="prop-lng" type="number" step="any" placeholder="-39.0972" value={form.lng} onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))} />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="prop-amenities">Comodidades (separar por vírgula)</Label>
                <Input id="prop-amenities" placeholder="Piscina, Wi-Fi, Ar Condicionado" value={form.amenities} onChange={(e) => setForm((f) => ({ ...f, amenities: e.target.value }))} />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="prop-description">Descrição</Label>
                <Textarea id="prop-description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={4} required />
              </div>
              <div className="flex items-center gap-6 md:col-span-2">
                <div className="flex items-center gap-2">
                  <Switch id="prop-ocean" checked={form.ocean_view} onCheckedChange={(v) => setForm((f) => ({ ...f, ocean_view: v }))} />
                  <Label htmlFor="prop-ocean">Vista para o mar</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="prop-featured" checked={form.featured} onCheckedChange={(v) => setForm((f) => ({ ...f, featured: v }))} />
                  <Label htmlFor="prop-featured">Destaque</Label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={saving} className="gap-2 bg-gradient-ocean hover:opacity-90">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? "Salvar Alterações" : "Cadastrar Imóvel"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
