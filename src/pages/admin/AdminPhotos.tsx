import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { api, type DbPhoto, type DbProperty } from "@/lib/api";
import {
  Camera,
  CheckCircle2,
  Eye,
  EyeOff,
  ImagePlus,
  Loader2,
  Search,
  Star,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminPhotos() {
  const [photos, setPhotos] = useState<DbPhoto[]>([]);
  const [properties, setProperties] = useState<DbProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterProperty, setFilterProperty] = useState<string>("todos");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadPropertyId, setUploadPropertyId] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [photosData, propsData] = await Promise.all([api.getPhotos(), api.getProperties()]);
      setPhotos(photosData);
      setProperties(propsData);
      if (propsData.length > 0 && !uploadPropertyId) {
        setUploadPropertyId(propsData[0].id);
      }
    } finally {
      setLoading(false);
    }
  }, [uploadPropertyId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const propertyNameById = useMemo(
    () => Object.fromEntries(properties.map((p) => [p.id, p.title])),
    [properties]
  );

  const filtered = useMemo(() => {
    let list = photos;
    if (filterProperty !== "todos") {
      list = list.filter((ph) => ph.property_id === filterProperty);
    }
    const q = search.toLowerCase().trim();
    if (q) {
      list = list.filter((ph) =>
        `${ph.caption} ${propertyNameById[ph.property_id] ?? ""}`.toLowerCase().includes(q)
      );
    }
    return list;
  }, [photos, filterProperty, search, propertyNameById]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
    if (!uploadPropertyId || selectedFiles.length === 0) return;
    setUploading(true);
    try {
      await api.uploadPhotos(uploadPropertyId, selectedFiles);
      toast.success(`${selectedFiles.length} foto(s) enviada(s) com sucesso!`);
      setSelectedFiles([]);
      fetchAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao enviar fotos.");
    } finally {
      setUploading(false);
    }
  };

  const togglePublished = async (photo: DbPhoto) => {
    await api.updatePhoto(photo.id, { published: !photo.published });
    fetchAll();
  };

  const makeCover = async (photo: DbPhoto) => {
    await api.updatePhoto(photo.id, { cover: true });
    toast.success("Foto definida como capa!");
    fetchAll();
  };

  const deletePhoto = async (photo: DbPhoto) => {
    if (!confirm("Remover esta foto?")) return;
    await api.deletePhoto(photo.id);
    toast.success("Foto removida.");
    fetchAll();
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Galeria de Fotos</h1>
        <p className="text-muted-foreground">Upload, organize e gerencie as fotos dos seus imóveis.</p>
      </div>

      {/* Upload section */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <ImagePlus className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Enviar Novas Fotos</CardTitle>
              <CardDescription>Selecione o imóvel e arraste as imagens ou clique para selecionar.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="space-y-1.5 flex-1">
              <Label htmlFor="upload-property">Imóvel</Label>
              <select
                id="upload-property"
                value={uploadPropertyId}
                onChange={(e) => setUploadPropertyId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.title} — {p.city}/{p.state}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5 flex-1">
              <Label>Arquivos</Label>
              <div className="relative">
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-muted-foreground transition hover:border-primary hover:bg-primary/5">
                  <Upload className="h-4 w-4" />
                  {selectedFiles.length > 0
                    ? `${selectedFiles.length} arquivo(s) selecionado(s)`
                    : "Clique para selecionar imagens"}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </label>
              </div>
            </div>
            <Button
              onClick={handleUpload}
              disabled={uploading || selectedFiles.length === 0}
              className="gap-2 bg-gradient-ocean hover:opacity-90"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Enviar
            </Button>
          </div>

          {/* Preview */}
          {selectedFiles.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedFiles.map((f, i) => (
                <div key={i} className="relative h-20 w-24 overflow-hidden rounded-lg bg-slate-100">
                  <img
                    src={URL.createObjectURL(f)}
                    alt={f.name}
                    className="h-full w-full object-cover"
                    onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                  />
                  <button
                    onClick={() => setSelectedFiles((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white text-xs hover:bg-black/80"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por legenda ou imóvel..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={filterProperty}
          onChange={(e) => setFilterProperty(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="todos">Todos os imóveis</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="flex gap-4">
        <Badge variant="outline" className="gap-1.5 px-3 py-1.5">
          <Camera className="h-3.5 w-3.5" /> {filtered.length} fotos
        </Badge>
        <Badge variant="outline" className="gap-1.5 px-3 py-1.5 border-emerald-200 text-emerald-700">
          <Eye className="h-3.5 w-3.5" /> {filtered.filter((p) => p.published).length} publicadas
        </Badge>
        <Badge variant="outline" className="gap-1.5 px-3 py-1.5 border-amber-200 text-amber-700">
          <EyeOff className="h-3.5 w-3.5" /> {filtered.filter((p) => !p.published).length} ocultas
        </Badge>
      </div>

      {/* Photo grid */}
      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Camera className="mb-4 h-12 w-12 text-muted-foreground/30" />
            <h3 className="mb-1 text-lg font-semibold text-foreground">Nenhuma foto encontrada</h3>
            <p className="text-sm text-muted-foreground">Use o formulário acima para enviar fotos.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((photo) => (
            <Card key={photo.id} className="group overflow-hidden border-slate-200 transition hover:shadow-md">
              <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                <img
                  src={photo.url}
                  alt={photo.caption}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                {/* Badges */}
                <div className="absolute left-2 top-2 flex gap-1.5">
                  {photo.cover && (
                    <Badge className="border-0 bg-amber-500/90 text-white text-[10px] gap-1">
                      <Star className="h-3 w-3" /> Capa
                    </Badge>
                  )}
                  {!photo.published && (
                    <Badge className="border-0 bg-slate-600/80 text-white text-[10px] gap-1">
                      <EyeOff className="h-3 w-3" /> Oculta
                    </Badge>
                  )}
                </div>
                {/* Actions overlay */}
                <div className="absolute bottom-2 right-2 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => makeCover(photo)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-foreground shadow-sm transition hover:bg-white"
                    title="Definir como capa"
                  >
                    <Star className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => togglePublished(photo)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-foreground shadow-sm transition hover:bg-white"
                    title={photo.published ? "Ocultar" : "Publicar"}
                  >
                    {photo.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => deletePhoto(photo)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/90 text-white shadow-sm transition hover:bg-red-600"
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <CardContent className="p-3">
                <p className="truncate text-sm font-medium text-foreground">{photo.caption || "Sem legenda"}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {propertyNameById[photo.property_id] ?? "Imóvel removido"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
