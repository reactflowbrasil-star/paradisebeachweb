import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
  CheckCircle,
  Edit3,
  Loader2,
  MapPin,
  Maximize,
  Phone,
  Plus,
  Search,
  Sparkles,
  Star,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import MapboxPicker from "@/components/admin/MapboxPicker";

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
  price_label: "/diaria",
  city: "",
  state: "",
  location: "",
  description: "",
  bedrooms: "0",
  bathrooms: "0",
  area: "0",
  whatsapp: "",
  address: "",
  cep: "",
  lat: "" as string | number,
  lng: "" as string | number,
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
  const [coverUpdatingFor, setCoverUpdatingFor] = useState<string | null>(null);

  // New states for file uploads during creation
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);

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

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const filtered = useMemo(() => {
    let list = properties;
    if (filterStatus !== "todos") {
      list = list.filter((property) => property.status === filterStatus);
    }

    const query = search.toLowerCase().trim();
    if (query) {
      list = list.filter((property) =>
        `${property.title} ${property.city} ${property.state} ${property.location}`
          .toLowerCase()
          .includes(query)
      );
    }

    return list;
  }, [properties, search, filterStatus]);

  const photosByProperty = useMemo(() => {
    const map: Record<string, DbPhoto[]> = {};
    for (const photo of photos) {
      (map[photo.property_id] ??= []).push(photo);
    }
    return map;
  }, [photos]);

  const editingPhotos = useMemo(() => {
    if (!editing) return [];
    return [...(photosByProperty[editing.id] ?? [])].sort((a, b) => {
      if (a.cover && !b.cover) return -1;
      if (!a.cover && b.cover) return 1;
      return a.sort_order - b.sort_order;
    });
  }, [editing, photosByProperty]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyPropertyForm);
    setCoverFile(null);
    setGalleryFiles([]);
    setDialogOpen(true);
  };

  const openEdit = (property: DbProperty) => {
    setEditing(property);
    setForm({
      title: property.title,
      type: property.type,
      listing: property.listing,
      price: String(property.price),
      price_label: property.price_label ?? "",
      city: property.city,
      state: property.state,
      location: property.location,
      description: property.description,
      bedrooms: String(property.bedrooms),
      bathrooms: String(property.bathrooms),
      area: String(property.area),
      whatsapp: property.whatsapp ?? "",
      address: (property as any).address ?? "",
      cep: (property as any).cep ?? "",
      lat: property.lat ?? "",
      lng: property.lng ?? "",
      amenities: Array.isArray(property.amenities) ? property.amenities.join(", ") : "",
      ocean_view: Boolean(property.ocean_view),
      featured: Boolean(property.featured),
    });
    setCoverFile(null);
    setGalleryFiles([]);
    setDialogOpen(true);
  };

  const handleCepLookup = async (cep: string) => {
    const cleaned = cep.replace(/\D/g, "");
    setForm((f) => ({ ...f, cep: cleaned }));
    
    if (cleaned.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setForm((f) => ({
            ...f,
            city: data.localidade,
            state: data.uf,
            location: data.bairro,
            address: data.logradouro,
          }));
          toast.success("Endereço preenchido via CEP!");
          
          // Try to geocode the address with Mapbox for an initial marker jump
          const token = import.meta.env.VITE_MAPBOX_TOKEN;
          if (token) {
            const query = encodeURIComponent(`${data.logradouro}, ${data.bairro}, ${data.localidade}, ${data.uf}, Brasil`);
            const geoRes = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${token}&limit=1`);
            const geoData = await geoRes.json();
            if (geoData.features?.[0]) {
              const [lng, lat] = geoData.features[0].center;
              setForm(f => ({ ...f, lat, lng }));
            }
          }
        }
      } catch (err) {
        console.error("CEP error:", err);
      }
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
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
        address: (form as any).address || null,
        cep: (form as any).cep || null,
        lat: form.lat ? Number(form.lat) : null,
        lng: form.lng ? Number(form.lng) : null,
        amenities: form.amenities
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        ocean_view: form.ocean_view,
        featured: form.featured,
      };

      if (editing) {
        await api.updateProperty(editing.id, payload);
        toast.success("Imóvel atualizado!");
      } else {
        const newProperty = await api.createProperty(payload);
        
        // Handle photo uploads for new property
        if (coverFile) {
          const uploaded = await api.uploadPhotos(newProperty.id, [coverFile]);
          if (uploaded && uploaded.length > 0) {
            await api.updatePhoto(uploaded[0].id, { cover: true });
          }
        }
        
        if (galleryFiles.length > 0) {
          await api.uploadPhotos(newProperty.id, galleryFiles);
        }
        
        toast.success("Imóvel cadastrado com fotos!");
      }

      setDialogOpen(false);
      setCoverFile(null);
      setGalleryFiles([]);
      await fetchAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este imovel?")) return;

    try {
      await api.deleteProperty(id);
      toast.success("Imovel removido.");
      await fetchAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao remover.");
    }
  };

  const toggleFeatured = async (property: DbProperty) => {
    await api.updateProperty(property.id, { featured: !property.featured });
    fetchAll();
  };

  const changeStatus = async (id: string, status: DbProperty["status"]) => {
    await api.updateProperty(id, { status });
    fetchAll();
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>, propertyId: string) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingFor(propertyId);
    try {
      await api.uploadPhotos(propertyId, Array.from(files));
      toast.success(`${files.length} foto(s) enviada(s)!`);
      await fetchAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao enviar fotos.");
    } finally {
      setUploadingFor(null);
      event.target.value = "";
    }
  };

  const setCoverPhoto = async (photoId: string) => {
    setCoverUpdatingFor(photoId);
    try {
      await api.updatePhoto(photoId, { cover: true });
      toast.success("Foto de capa atualizada!");
      await fetchAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao definir foto de capa.");
    } finally {
      setCoverUpdatingFor(null);
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Propriedades</h1>
          <p className="text-muted-foreground">Gerencie seus imoveis, precos e disponibilidade.</p>
        </div>
        <Button onClick={openCreate} className="shrink-0 gap-2 bg-gradient-ocean hover:opacity-90">
          <Plus className="h-4 w-4" />
          Novo Imovel
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por titulo, cidade ou regiao..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {["todos", "disponivel", "alugado", "vendido"].map((status) => (
            <Button
              key={status}
              size="sm"
              variant={filterStatus === status ? "default" : "outline"}
              onClick={() => setFilterStatus(status)}
              className={filterStatus === status ? "bg-primary" : ""}
            >
              {status === "todos" ? "Todos" : status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <MapPin className="h-8 w-8 text-primary" />
            </div>
            <h3 className="mb-1 text-lg font-semibold text-foreground">Nenhum imovel encontrado</h3>
            <p className="text-sm text-muted-foreground">
              {search || filterStatus !== "todos"
                ? "Tente alterar os filtros ou buscar por outro termo."
                : "Cadastre seu primeiro imovel para comecar."}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4">
        {filtered.map((property) => {
          const propertyPhotos = photosByProperty[property.id] ?? [];
          const coverPhoto = propertyPhotos.find((photo) => photo.cover) ?? propertyPhotos[0];

          return (
            <Card key={property.id} className="overflow-hidden border-slate-200 transition hover:shadow-md">
              <div className="flex flex-col md:flex-row">
                <div className="relative h-48 w-full shrink-0 bg-slate-100 md:h-auto md:w-56">
                  {coverPhoto ? (
                    <img src={coverPhoto.url} alt={property.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <Camera className="h-8 w-8" />
                    </div>
                  )}
                  {property.featured ? (
                    <div className="absolute left-2 top-2">
                      <Badge className="gap-1 border-0 bg-amber-500/90 text-xs text-white">
                        <Sparkles className="h-3 w-3" /> Destaque
                      </Badge>
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{property.title}</h3>
                      <p className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {property.location}, {property.city} - {property.state}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">
                        {formatPrice(property.price, property.price_label)}
                      </p>
                      <Badge variant="outline" className={`mt-1 text-xs ${statusBadge[property.status] ?? ""}`}>
                        {property.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {property.bedrooms > 0 ? (
                      <span className="flex items-center gap-1">
                        <Bed className="h-3.5 w-3.5" /> {property.bedrooms} quartos
                      </span>
                    ) : null}
                    {property.bathrooms > 0 ? (
                      <span className="flex items-center gap-1">
                        <Bath className="h-3.5 w-3.5" /> {property.bathrooms} banheiros
                      </span>
                    ) : null}
                    <span className="flex items-center gap-1">
                      <Maximize className="h-3.5 w-3.5" /> {property.area}m²
                    </span>
                    <span className="flex items-center gap-1">
                      <Camera className="h-3.5 w-3.5" /> {propertyPhotos.length} fotos
                    </span>
                    {property.whatsapp ? (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" /> {property.whatsapp}
                      </span>
                    ) : null}
                  </div>

                  {propertyPhotos.length > 0 ? (
                    <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
                      {propertyPhotos.slice(0, 6).map((photo) => (
                        <img
                          key={photo.id}
                          src={photo.url}
                          alt=""
                          className="h-12 w-14 shrink-0 rounded object-cover opacity-80"
                        />
                      ))}
                      {propertyPhotos.length > 6 ? (
                        <div className="flex h-12 w-14 shrink-0 items-center justify-center rounded bg-slate-100 text-xs text-muted-foreground">
                          +{propertyPhotos.length - 6}
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => openEdit(property)}>
                      <Edit3 className="h-3.5 w-3.5" /> Editar
                    </Button>
                    <Button
                      size="sm"
                      variant={property.featured ? "secondary" : "outline"}
                      className="gap-1.5"
                      onClick={() => toggleFeatured(property)}
                    >
                      <Sparkles className="h-3.5 w-3.5" /> {property.featured ? "Remover destaque" : "Destacar"}
                    </Button>
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-sm transition hover:bg-accent">
                      <Upload className="h-3.5 w-3.5" />
                      {uploadingFor === property.id ? "Enviando..." : "Fotos"}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(event) => handlePhotoUpload(event, property.id)}
                        disabled={uploadingFor === property.id}
                      />
                    </label>
                    <select
                      className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                      value={property.status}
                      onChange={(event) => changeStatus(property.id, event.target.value as DbProperty["status"])}
                    >
                      <option value="disponivel">Disponivel</option>
                      <option value="alugado">Alugado</option>
                      <option value="vendido">Vendido</option>
                    </select>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="ml-auto text-destructive hover:text-destructive"
                      onClick={() => remove(property.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Imovel" : "Cadastrar Novo Imovel"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Atualize as informações do imóvel e escolha a foto de capa no próprio formulário."
                : "Preencha os dados e selecione as fotos (capa e galeria) para cadastrar."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="grid gap-4 py-2">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="prop-title">Titulo</Label>
                <Input
                  id="prop-title"
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prop-type">Tipo</Label>
                <select
                  id="prop-type"
                  value={form.type}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, type: event.target.value as DbProperty["type"] }))
                  }
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
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      listing: event.target.value as DbProperty["listing"],
                    }))
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="aluguel">Aluguel</option>
                  <option value="venda">Venda</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prop-price">Preço</Label>
                <Input
                  id="prop-price"
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prop-price-label">Rótulo do preço</Label>
                <Input
                  id="prop-price-label"
                  placeholder="/diária, /mês"
                  value={form.price_label}
                  onChange={(event) => setForm((current) => ({ ...current, price_label: event.target.value }))}
                />
              </div>

              <div className="space-y-1.5 md:col-span-1">
                <Label htmlFor="prop-cep">CEP</Label>
                <Input
                  id="prop-cep"
                  placeholder="00000-000"
                  value={form.cep}
                  onChange={(e) => handleCepLookup(e.target.value)}
                  maxLength={9}
                />
              </div>

              <div className="space-y-1.5 md:col-span-1">
                <Label htmlFor="prop-address">Endereço / Rua</Label>
                <Input
                  id="prop-address"
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prop-city">Cidade</Label>
                <Input
                  id="prop-city"
                  value={form.city}
                  onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prop-state">UF</Label>
                <Input
                  id="prop-state"
                  value={form.state}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, state: event.target.value.toUpperCase() }))
                  }
                  maxLength={2}
                  required
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="prop-location">Bairro / Região</Label>
                <Input
                  id="prop-location"
                  value={form.location}
                  onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
                  required
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label className="flex items-center justify-between">
                  Localização no Mapa
                  <Badge variant="outline" className="text-[10px] font-normal">
                    {form.lat && form.lng ? `${Number(form.lat).toFixed(6)}, ${Number(form.lng).toFixed(6)}` : "Não definida"}
                  </Badge>
                </Label>
                <MapboxPicker 
                  lat={form.lat ? Number(form.lat) : null}
                  lng={form.lng ? Number(form.lng) : null}
                  onChange={(lat, lng) => setForm(f => ({ ...f, lat, lng }))}
                  token={import.meta.env.VITE_MAPBOX_TOKEN || ""}
                />
                {!import.meta.env.VITE_MAPBOX_TOKEN && (
                  <p className="text-[10px] text-destructive">Aviso: VITE_MAPBOX_TOKEN não configurado no .env</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prop-bedrooms">Quartos</Label>
                <Input
                  id="prop-bedrooms"
                  type="number"
                  min={0}
                  value={form.bedrooms}
                  onChange={(event) => setForm((current) => ({ ...current, bedrooms: event.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prop-bathrooms">Banheiros</Label>
                <Input
                  id="prop-bathrooms"
                  type="number"
                  min={0}
                  value={form.bathrooms}
                  onChange={(event) => setForm((current) => ({ ...current, bathrooms: event.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prop-area">Área (m2)</Label>
                <Input
                  id="prop-area"
                  type="number"
                  min={0}
                  value={form.area}
                  onChange={(event) => setForm((current) => ({ ...current, area: event.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prop-whatsapp">WhatsApp</Label>
                <Input
                  id="prop-whatsapp"
                  placeholder="5573999990000"
                  value={form.whatsapp}
                  onChange={(event) => setForm((current) => ({ ...current, whatsapp: event.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prop-lat">Latitude</Label>
                <Input
                  id="prop-lat"
                  type="number"
                  step="any"
                  placeholder="-16.4536"
                  value={form.lat}
                  onChange={(event) => setForm((current) => ({ ...current, lat: event.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prop-lng">Longitude</Label>
                <Input
                  id="prop-lng"
                  type="number"
                  step="any"
                  placeholder="-39.0972"
                  value={form.lng}
                  onChange={(event) => setForm((current) => ({ ...current, lng: event.target.value }))}
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="prop-amenities">Comodidades (separar por virgula)</Label>
                <Input
                  id="prop-amenities"
                  placeholder="Piscina, Wi-Fi, Ar Condicionado"
                  value={form.amenities}
                  onChange={(event) => setForm((current) => ({ ...current, amenities: event.target.value }))}
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="prop-description">Descricao</Label>
                <Textarea
                  id="prop-description"
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-3 md:col-span-2">
                <div className="space-y-1">
                  <Label>Foto de capa</Label>
                  <p className="text-sm text-muted-foreground">
                    {editing
                      ? editingPhotos.length > 0
                        ? "Escolha qual imagem sera exibida como capa principal deste imovel."
                        : "Este imovel ainda nao tem fotos. Envie as imagens e depois selecione a capa aqui."
                      : "Depois de cadastrar o imovel, envie as fotos e volte aqui para definir a capa."}
                  </p>
                </div>

                {editingPhotos.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {editingPhotos.map((photo) => (
                      <div
                        key={photo.id}
                        className={`overflow-hidden rounded-xl border ${
                          photo.cover ? "border-primary ring-1 ring-primary/20" : "border-slate-200"
                        }`}
                      >
                        <div className="relative aspect-[4/3] bg-slate-100">
                          <img
                            src={photo.url}
                            alt={photo.caption || "Foto do imóvel"}
                            className="h-full w-full object-cover"
                          />
                          {photo.cover ? (
                            <Badge className="absolute left-2 top-2 border-0 bg-primary text-primary-foreground">
                              Capa atual
                            </Badge>
                          ) : null}
                        </div>
                        <div className="flex items-center justify-between gap-2 p-3">
                          <p className="truncate text-sm text-foreground">{photo.caption || "Sem legenda"}</p>
                          <Button
                            type="button"
                            size="sm"
                            variant={photo.cover ? "secondary" : "outline"}
                            disabled={photo.cover || coverUpdatingFor === photo.id}
                            onClick={() => setCoverPhoto(photo.id)}
                          >
                            {coverUpdatingFor === photo.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : photo.cover ? (
                              "Selecionada"
                            ) : (
                              "Definir capa"
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                {!editing && (
                  <div className="grid gap-4 p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                    <div className="space-y-2">
                      <Label htmlFor="create-cover" className="text-primary font-semibold flex items-center gap-2">
                        <Star className="h-4 w-4" /> Foto de Capa (Obrigatória)
                      </Label>
                      <div className="flex flex-col gap-2">
                        <label className="flex flex-col items-center justify-center h-32 w-full border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-white transition-all bg-white/50 overflow-hidden relative">
                          {coverFile ? (
                            <>
                              <img src={URL.createObjectURL(coverFile)} className="absolute inset-0 w-full h-full object-cover opacity-60" />
                              <div className="relative z-10 flex flex-col items-center gap-1">
                                <CheckCircle className="h-8 w-8 text-emerald-500" />
                                <span className="text-xs font-medium text-slate-700 truncate max-w-[200px]">{coverFile.name}</span>
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              <Upload className="h-8 w-8 text-slate-400" />
                              <span className="text-xs text-slate-500">Clique para selecionar a capa</span>
                            </div>
                          )}
                          <input 
                            id="create-cover" 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                            required={!editing}
                          />
                        </label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="create-gallery" className="font-semibold flex items-center gap-2">
                        <Camera className="h-4 w-4" /> Fotos da Galeria
                      </Label>
                      <div className="flex flex-col gap-2">
                        <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-white transition-all bg-white/50">
                          <Upload className="h-6 w-6 text-slate-400 mb-1" />
                          <span className="text-xs text-slate-500">
                            {galleryFiles.length > 0 
                              ? `${galleryFiles.length} fotos selecionadas` 
                              : "Selecionar múltiplas fotos"}
                          </span>
                          <input 
                            id="create-gallery" 
                            type="file" 
                            accept="image/*" 
                            multiple 
                            className="hidden" 
                            onChange={(e) => setGalleryFiles(Array.from(e.target.files || []))}
                          />
                        </label>
                        {galleryFiles.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {galleryFiles.map((f, i) => (
                              <div key={i} className="h-12 w-16 rounded border bg-white overflow-hidden relative group">
                                <img src={URL.createObjectURL(f)} className="w-full h-full object-cover" />
                                <button 
                                  type="button"
                                  onClick={() => setGalleryFiles(fs => fs.filter((_, idx) => idx !== i))}
                                  className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-6 md:col-span-2">
                <div className="flex items-center gap-2">
                  <Switch
                    id="prop-ocean"
                    checked={form.ocean_view}
                    onCheckedChange={(value) => setForm((current) => ({ ...current, ocean_view: value }))}
                  />
                  <Label htmlFor="prop-ocean">Vista para o mar</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="prop-featured"
                    checked={form.featured}
                    onCheckedChange={(value) => setForm((current) => ({ ...current, featured: value }))}
                  />
                  <Label htmlFor="prop-featured">Destaque</Label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={saving} className="gap-2 bg-gradient-ocean hover:opacity-90">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {editing ? "Salvar alteracoes" : "Cadastrar imovel"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
