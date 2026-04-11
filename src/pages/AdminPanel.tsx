import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { api, type DbPhoto, type DbProperty, type DbReservation, getImageUrl } from "@/lib/api";
import { CalendarDays, Camera, Home, Loader2, LogOut, Plus, Sparkles, Trash2, Upload, Users } from "lucide-react";
import { toast } from "sonner";

const formatPrice = (price: number, label?: string | null) =>
  `R$ ${price.toLocaleString("pt-BR")}${label || ""}`;

const statusColor: Record<string, string> = {
  confirmada: "bg-emerald-100 text-emerald-700",
  pendente: "bg-amber-100 text-amber-700",
  cancelada: "bg-rose-100 text-rose-700",
};

function LoginForm() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const error = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Login realizado com sucesso.");
    }
  };

  return (
    <section className="mobile-shell flex min-h-screen items-center justify-center py-28">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login administrativo</CardTitle>
          <CardDescription>Entre com as credenciais definidas no backend local.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}

function AdminPanel() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [properties, setProperties] = useState<DbProperty[]>([]);
  const [photos, setPhotos] = useState<DbPhoto[]>([]);
  const [reservations, setReservations] = useState<DbReservation[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [propertySearch, setPropertySearch] = useState("");
  const [reservationFilter, setReservationFilter] = useState<string>("todas");
  const [uploadingPhotoFor, setUploadingPhotoFor] = useState<string | null>(null);

  const [propertyForm, setPropertyForm] = useState({
    title: "",
    type: "casa" as DbProperty["type"],
    price: "",
    city: "",
    state: "",
    location: "",
    description: "",
    bedrooms: "0",
    bathrooms: "0",
    area: "0",
    whatsapp: "",
  });
  const [reservationForm, setReservationForm] = useState({
    propertyId: "",
    guestName: "",
    email: "",
    checkIn: new Date().toISOString().split("T")[0],
    checkOut: new Date().toISOString().split("T")[0],
    total: "",
  });

  const fetchAll = useCallback(async () => {
    setDataLoading(true);
    try {
      const [propsData, photosData, reservationsData] = await Promise.all([
        api.getProperties(),
        api.getPhotos(),
        api.getReservations(),
      ]);
      setProperties(propsData);
      setPhotos(photosData);
      setReservations(reservationsData);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao carregar dados.");
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchAll();
  }, [user, fetchAll]);

  useEffect(() => {
    if (properties.length > 0 && !reservationForm.propertyId) {
      setReservationForm((prev) => ({ ...prev, propertyId: properties[0].id }));
    }
  }, [properties, reservationForm.propertyId]);

  const dashboardMetrics = useMemo(() => {
    const confirmed = reservations.filter((r) => r.status === "confirmada");
    const pending = reservations.filter((r) => r.status === "pendente");
    return {
      totalProperties: properties.length,
      totalPhotos: photos.length,
      confirmedBookings: confirmed.length,
      pendingBookings: pending.length,
      monthlyRevenue: confirmed.reduce((sum, r) => sum + Number(r.total), 0),
      featuredProperties: properties.filter((p) => p.featured).length,
      totalGuests: new Set(reservations.map((r) => r.email)).size,
    };
  }, [properties, photos, reservations]);

  const propertyNameById = useMemo(
    () => Object.fromEntries(properties.map((p) => [p.id, p.title])),
    [properties]
  );

  const filteredProperties = useMemo(() => {
    const q = propertySearch.toLowerCase().trim();
    if (!q) return properties;
    return properties.filter((p) =>
      `${p.title} ${p.city} ${p.state} ${p.location}`.toLowerCase().includes(q)
    );
  }, [properties, propertySearch]);

  const filteredReservations = useMemo(() => {
    if (reservationFilter === "todas") return reservations;
    return reservations.filter((r) => r.status === reservationFilter);
  }, [reservations, reservationFilter]);

  const addProperty = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.createProperty({
        title: propertyForm.title,
        type: propertyForm.type,
        listing: "aluguel",
        price: Number(propertyForm.price),
        city: propertyForm.city,
        state: propertyForm.state,
        location: propertyForm.location,
        description: propertyForm.description,
        bedrooms: Number(propertyForm.bedrooms),
        bathrooms: Number(propertyForm.bathrooms),
        area: Number(propertyForm.area),
        whatsapp: propertyForm.whatsapp,
        amenities: [],
      });
      toast.success("Imóvel cadastrado!");
      setPropertyForm({
        title: "",
        type: "casa",
        price: "",
        city: "",
        state: "",
        location: "",
        description: "",
        bedrooms: "0",
        bathrooms: "0",
        area: "0",
        whatsapp: "",
      });
      fetchAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao cadastrar imóvel.");
    }
  };

  const removeProperty = async (id: string) => {
    try {
      await api.deleteProperty(id);
      toast.success("Imóvel removido.");
      fetchAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao remover imóvel.");
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

  const updateWhatsapp = async (id: string, whatsapp: string) => {
    await api.updateProperty(id, { whatsapp });
    fetchAll();
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, propertyId: string) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingPhotoFor(propertyId);
    try {
      await api.uploadPhotos(propertyId, Array.from(files));
      toast.success("Fotos enviadas!");
      fetchAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao enviar fotos.");
    } finally {
      setUploadingPhotoFor(null);
      e.target.value = "";
    }
  };

  const togglePhotoPublished = async (photo: DbPhoto) => {
    await api.updatePhoto(photo.id, { published: !photo.published });
    fetchAll();
  };

  const makePhotoCover = async (photo: DbPhoto) => {
    await api.updatePhoto(photo.id, { cover: true });
    fetchAll();
  };

  const deletePhoto = async (photo: DbPhoto) => {
    await api.deletePhoto(photo.id);
    toast.success("Foto removida.");
    fetchAll();
  };

  const addReservation = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.createReservation({
        property_id: reservationForm.propertyId,
        guest_name: reservationForm.guestName,
        email: reservationForm.email,
        check_in: reservationForm.checkIn,
        check_out: reservationForm.checkOut,
        total: Number(reservationForm.total),
      });
      toast.success("Reserva criada!");
      setReservationForm({
        propertyId: properties[0]?.id ?? "",
        guestName: "",
        email: "",
        checkIn: new Date().toISOString().split("T")[0],
        checkOut: new Date().toISOString().split("T")[0],
        total: "",
      });
      fetchAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao criar reserva.");
    }
  };

  const cycleReservationStatus = async (reservation: DbReservation) => {
    const next: Record<string, DbReservation["status"]> = {
      pendente: "confirmada",
      confirmada: "cancelada",
      cancelada: "pendente",
    };
    await api.updateReservation(reservation.id, { status: next[reservation.status] });
    fetchAll();
  };

  if (authLoading) {
    return (
      <section className="mobile-shell flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </section>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
    <section className="mobile-shell py-28 md:py-32">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <Badge className="w-fit bg-primary/10 text-primary">Painel Administrativo</Badge>
          <h1 className="font-serif text-3xl font-bold text-primary md:text-4xl">Gestão de Propriedades & Reservas</h1>
          <p className="max-w-3xl text-muted-foreground">
            Logado como <strong>{user.email}</strong>
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={signOut} className="shrink-0 gap-2">
          <LogOut className="h-4 w-4" />Sair
        </Button>
      </div>

      {dataLoading ? (
        <div className="mt-16 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card><CardHeader className="pb-2"><CardDescription>Imóveis cadastrados</CardDescription><CardTitle className="flex items-center gap-2 text-3xl"><Home className="h-6 w-6 text-primary" />{dashboardMetrics.totalProperties}</CardTitle></CardHeader></Card>
            <Card><CardHeader className="pb-2"><CardDescription>Fotos no sistema</CardDescription><CardTitle className="flex items-center gap-2 text-3xl"><Camera className="h-6 w-6 text-primary" />{dashboardMetrics.totalPhotos}</CardTitle></CardHeader></Card>
            <Card><CardHeader className="pb-2"><CardDescription>Reservas confirmadas</CardDescription><CardTitle className="flex items-center gap-2 text-3xl"><CalendarDays className="h-6 w-6 text-primary" />{dashboardMetrics.confirmedBookings}</CardTitle></CardHeader></Card>
            <Card><CardHeader className="pb-2"><CardDescription>Hóspedes únicos</CardDescription><CardTitle className="flex items-center gap-2 text-3xl"><Users className="h-6 w-6 text-primary" />{dashboardMetrics.totalGuests}</CardTitle></CardHeader></Card>
          </div>

          <Tabs defaultValue="properties" className="mt-8 space-y-4">
            <TabsList className="h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0">
              <TabsTrigger value="properties">Propriedades</TabsTrigger>
              <TabsTrigger value="photos">Fotos</TabsTrigger>
              <TabsTrigger value="reservations">Reservas</TabsTrigger>
              <TabsTrigger value="crm">CRM & receita</TabsTrigger>
            </TabsList>

            <TabsContent value="properties" className="space-y-5">
              <Card>
                <CardHeader>
                  <CardTitle>Novo imóvel</CardTitle>
                  <CardDescription>Cadastro rápido. Após criar, faça upload das fotos.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={addProperty} className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    <div className="space-y-1.5 xl:col-span-2"><Label htmlFor="title">Título</Label><Input id="title" value={propertyForm.title} onChange={(e) => setPropertyForm((prev) => ({ ...prev, title: e.target.value }))} required /></div>
                    <div className="space-y-1.5"><Label htmlFor="price">Preço / diária</Label><Input id="price" type="number" min={0} value={propertyForm.price} onChange={(e) => setPropertyForm((prev) => ({ ...prev, price: e.target.value }))} required /></div>
                    <div className="space-y-1.5"><Label htmlFor="city">Cidade</Label><Input id="city" value={propertyForm.city} onChange={(e) => setPropertyForm((prev) => ({ ...prev, city: e.target.value }))} required /></div>
                    <div className="space-y-1.5"><Label htmlFor="state">UF</Label><Input id="state" value={propertyForm.state} onChange={(e) => setPropertyForm((prev) => ({ ...prev, state: e.target.value.toUpperCase() }))} maxLength={2} required /></div>
                    <div className="space-y-1.5"><Label htmlFor="location">Região</Label><Input id="location" value={propertyForm.location} onChange={(e) => setPropertyForm((prev) => ({ ...prev, location: e.target.value }))} required /></div>
                    <div className="space-y-1.5"><Label htmlFor="type">Tipo</Label>
                      <select id="type" value={propertyForm.type} onChange={(e) => setPropertyForm((prev) => ({ ...prev, type: e.target.value as DbProperty["type"] }))} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                        <option value="casa">Casa</option><option value="villa">Villa</option><option value="apartamento">Apartamento</option><option value="terreno">Terreno</option>
                      </select>
                    </div>
                    <div className="space-y-1.5"><Label htmlFor="bedrooms">Quartos</Label><Input id="bedrooms" type="number" min={0} value={propertyForm.bedrooms} onChange={(e) => setPropertyForm((prev) => ({ ...prev, bedrooms: e.target.value }))} /></div>
                    <div className="space-y-1.5"><Label htmlFor="bathrooms">Banheiros</Label><Input id="bathrooms" type="number" min={0} value={propertyForm.bathrooms} onChange={(e) => setPropertyForm((prev) => ({ ...prev, bathrooms: e.target.value }))} /></div>
                    <div className="space-y-1.5"><Label htmlFor="area">Área (m²)</Label><Input id="area" type="number" min={0} value={propertyForm.area} onChange={(e) => setPropertyForm((prev) => ({ ...prev, area: e.target.value }))} /></div>
                    <div className="space-y-1.5"><Label htmlFor="whatsapp">WhatsApp</Label><Input id="whatsapp" placeholder="5573999990000" value={propertyForm.whatsapp} onChange={(e) => setPropertyForm((prev) => ({ ...prev, whatsapp: e.target.value }))} /></div>
                    <div className="space-y-1.5 md:col-span-2 xl:col-span-3"><Label htmlFor="description">Descrição</Label><Textarea id="description" value={propertyForm.description} onChange={(e) => setPropertyForm((prev) => ({ ...prev, description: e.target.value }))} rows={3} required /></div>
                    <div className="md:col-span-2 xl:col-span-3"><Button type="submit" className="gap-2"><Plus className="h-4 w-4" />Cadastrar imóvel</Button></div>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Catálogo de imóveis</CardTitle><CardDescription>Busque por título, cidade ou localização.</CardDescription></CardHeader>
                <CardContent className="space-y-3">
                  <Input placeholder="Buscar imóvel..." value={propertySearch} onChange={(e) => setPropertySearch(e.target.value)} />
                  {filteredProperties.length === 0 && <p className="py-8 text-center text-muted-foreground">Nenhum imóvel cadastrado.</p>}
                  {filteredProperties.map((property) => {
                    const propPhotos = photos.filter((ph) => ph.property_id === property.id);
                    return (
                      <div key={property.id} className="space-y-3 rounded-lg border p-4">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="font-semibold">{property.title}</p>
                            <p className="text-sm text-muted-foreground">{property.city}/{property.state} • {formatPrice(property.price, property.price_label)}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button variant={property.featured ? "secondary" : "outline"} size="sm" onClick={() => toggleFeatured(property)}><Sparkles className="mr-2 h-4 w-4" />{property.featured ? "Destaque" : "Destacar"}</Button>
                            <Button variant="destructive" size="sm" className="gap-2" onClick={() => removeProperty(property.id)}><Trash2 className="h-4 w-4" />Excluir</Button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Label className="shrink-0 text-sm">WhatsApp:</Label>
                          <Input className="h-8 max-w-[200px]" placeholder="5573999990000" defaultValue={property.whatsapp ?? ""} onBlur={(e) => { if (e.target.value !== (property.whatsapp ?? "")) { updateWhatsapp(property.id, e.target.value); } }} />
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <Label>Status:</Label>
                          <select className="h-8 rounded-md border border-input bg-background px-2" value={property.status} onChange={(e) => changeStatus(property.id, e.target.value as DbProperty["status"])}>
                            <option value="disponivel">Disponível</option>
                            <option value="alugado">Alugado</option>
                            <option value="vendido">Vendido</option>
                          </select>
                          <Badge className="bg-muted text-foreground">{property.type}</Badge>
                          <label className="ml-auto inline-flex cursor-pointer items-center gap-1 rounded-md border border-input px-3 py-1.5 text-sm transition hover:bg-accent">
                            <Upload className="h-4 w-4" />
                            <span>{uploadingPhotoFor === property.id ? "Enviando..." : "Upload fotos"}</span>
                            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handlePhotoUpload(e, property.id)} disabled={uploadingPhotoFor === property.id} />
                          </label>
                        </div>

                        {propPhotos.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-2">
                            {propPhotos.map((photo) => (
                              <div key={photo.id} className="group relative">
                                <img src={getImageUrl(photo.url)} alt={photo.caption} className="h-16 w-20 rounded-md object-cover" />
                                {photo.cover && <span className="absolute left-0 top-0 rounded-br bg-primary px-1 text-[10px] text-primary-foreground">Capa</span>}
                                <div className="absolute inset-0 flex items-center justify-center gap-1 rounded-md bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                                  <button onClick={() => makePhotoCover(photo)} className="rounded bg-primary/80 px-1 text-[10px] text-white">Capa</button>
                                  <button onClick={() => deletePhoto(photo)} className="rounded bg-destructive/80 px-1 text-[10px] text-white">×</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="photos" className="space-y-5">
              <Card>
                <CardHeader><CardTitle>Biblioteca de fotos ({photos.length})</CardTitle><CardDescription>Controle publicação e escolha a capa principal de cada imóvel.</CardDescription></CardHeader>
                <CardContent className="grid gap-3">
                  {photos.length === 0 && <p className="py-8 text-center text-muted-foreground">Nenhuma foto. Faça upload pela aba Propriedades.</p>}
                  {photos.map((photo) => (
                    <div key={photo.id} className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center">
                      <img src={getImageUrl(photo.url)} alt={photo.caption} className="h-20 w-28 shrink-0 rounded-md object-cover" />
                      <div className="flex-1">
                        <p className="font-medium">{photo.caption}</p>
                        <p className="text-sm text-muted-foreground">{propertyNameById[photo.property_id] ?? "Imóvel removido"}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant={photo.cover ? "secondary" : "outline"} onClick={() => makePhotoCover(photo)}>{photo.cover ? "Capa ✓" : "Definir capa"}</Button>
                        <Button size="sm" variant={photo.published ? "secondary" : "outline"} onClick={() => togglePhotoPublished(photo)}>{photo.published ? "Publicado" : "Oculto"}</Button>
                        <Button size="sm" variant="destructive" onClick={() => deletePhoto(photo)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reservations" className="space-y-5">
              <Card>
                <CardHeader><CardTitle>Nova reserva</CardTitle><CardDescription>Crie reservas manuais e acompanhe o status.</CardDescription></CardHeader>
                <CardContent>
                  <form onSubmit={addReservation} className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div className="space-y-1.5"><Label htmlFor="res-property">Imóvel</Label><select id="res-property" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={reservationForm.propertyId} onChange={(e) => setReservationForm((prev) => ({ ...prev, propertyId: e.target.value }))} required>{properties.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select></div>
                    <div className="space-y-1.5"><Label htmlFor="guestName">Hóspede</Label><Input id="guestName" value={reservationForm.guestName} onChange={(e) => setReservationForm((prev) => ({ ...prev, guestName: e.target.value }))} required /></div>
                    <div className="space-y-1.5"><Label htmlFor="guestEmail">E-mail</Label><Input id="guestEmail" type="email" value={reservationForm.email} onChange={(e) => setReservationForm((prev) => ({ ...prev, email: e.target.value }))} required /></div>
                    <div className="space-y-1.5"><Label htmlFor="checkIn">Check-in</Label><Input id="checkIn" type="date" value={reservationForm.checkIn} onChange={(e) => setReservationForm((prev) => ({ ...prev, checkIn: e.target.value }))} required /></div>
                    <div className="space-y-1.5"><Label htmlFor="checkOut">Check-out</Label><Input id="checkOut" type="date" value={reservationForm.checkOut} onChange={(e) => setReservationForm((prev) => ({ ...prev, checkOut: e.target.value }))} required /></div>
                    <div className="space-y-1.5"><Label htmlFor="total">Valor total</Label><Input id="total" type="number" min={0} value={reservationForm.total} onChange={(e) => setReservationForm((prev) => ({ ...prev, total: e.target.value }))} required /></div>
                    <div className="self-end"><Button type="submit">Criar reserva</Button></div>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Reservas ({filteredReservations.length})</CardTitle><CardDescription>Filtre por status para priorizar atendimento.</CardDescription></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {(["todas", "pendente", "confirmada", "cancelada"] as const).map((status) => (
                      <Button key={status} size="sm" variant={reservationFilter === status ? "secondary" : "outline"} onClick={() => setReservationFilter(status)}>{status}</Button>
                    ))}
                  </div>
                  {filteredReservations.length === 0 && <p className="py-8 text-center text-muted-foreground">Nenhuma reserva encontrada.</p>}
                  {filteredReservations.map((reservation) => (
                    <Dialog key={reservation.id}>
                      <DialogTrigger asChild>
                        <button className="w-full rounded-lg border p-4 text-left transition hover:border-primary/50">
                          <div className="flex flex-wrap items-center justify-between gap-3"><p className="font-semibold">{reservation.guest_name}</p><Badge className={statusColor[reservation.status]}>{reservation.status}</Badge></div>
                          <p className="mt-1 text-sm text-muted-foreground">{propertyNameById[reservation.property_id]} • {reservation.check_in} a {reservation.check_out} • {formatPrice(Number(reservation.total))}</p>
                        </button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Reserva</DialogTitle><DialogDescription>Atualize o status em 1 clique.</DialogDescription></DialogHeader>
                        <div className="space-y-2 text-sm">
                          <p><strong>Imóvel:</strong> {propertyNameById[reservation.property_id]}</p>
                          <p><strong>Hóspede:</strong> {reservation.guest_name}</p>
                          <p><strong>E-mail:</strong> {reservation.email}</p>
                          <p><strong>Período:</strong> {reservation.check_in} até {reservation.check_out}</p>
                          <p><strong>Total:</strong> {formatPrice(Number(reservation.total))}</p>
                        </div>
                        <Button onClick={() => cycleReservationStatus(reservation)}>Alterar status (atual: {reservation.status})</Button>
                      </DialogContent>
                    </Dialog>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="crm">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" />KPI comercial</CardTitle><CardDescription>Resumo executivo.</CardDescription></CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-lg border p-4"><p className="text-sm text-muted-foreground">Imóveis destaque</p><p className="text-2xl font-bold text-primary">{dashboardMetrics.featuredProperties}</p></div>
                  <div className="rounded-lg border p-4"><p className="text-sm text-muted-foreground">Reservas pendentes</p><p className="text-2xl font-bold text-primary">{dashboardMetrics.pendingBookings}</p></div>
                  <div className="rounded-lg border p-4"><p className="text-sm text-muted-foreground">Receita confirmada</p><p className="text-2xl font-bold text-primary">{formatPrice(dashboardMetrics.monthlyRevenue)}</p></div>
                  <div className="rounded-lg border p-4"><p className="text-sm text-muted-foreground">Taxa de aprovação</p><p className="text-2xl font-bold text-primary">{reservations.length ? Math.round((dashboardMetrics.confirmedBookings / reservations.length) * 100) : 0}%</p></div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </section>
  );
}

export default AdminPanel;
