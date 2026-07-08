import { FormEvent, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { api, type PropertyPhoto, type PropertyRecord, type ReservationRecord } from "@/lib/api";
import { Bath, Bed, CalendarDays, Camera, Home, Loader2, LogOut, MapPin, Plus, Save, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

const ADMIN_TOKEN_KEY = "pb_admin_token";

function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const { token } = await api.login(email, password);
      window.localStorage.setItem(ADMIN_TOKEN_KEY, token);
      toast.success("Bem-vindo ao painel administrativo.");
      onLogin();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha no login");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mobile-shell flex min-h-screen items-center justify-center py-28">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-primary">Acesso administrativo</CardTitle>
          <CardDescription>Informe suas credenciais para gerenciar o painel.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-3">
            <Field label="E-mail"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
            <Field label="Senha"><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></Field>
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}

const emptyProperty: Partial<PropertyRecord> = {
  title: "",
  type: "casa",
  listing: "aluguel",
  price: 0,
  price_label: "/diaria",
  location: "",
  city: "",
  state: "BA",
  description: "",
  bedrooms: 1,
  bathrooms: 1,
  area: 0,
  ocean_view: false,
  featured: false,
  status: "disponivel",
  amenities: [],
  lat: null,
  lng: null,
  whatsapp: "",
  booking_method: "whatsapp",
  booking_url: "",
  booking_notes: "",
  min_nights: 1,
  max_guests: 2,
};

const emptyReservation: Partial<ReservationRecord> = {
  property_id: "",
  guest_name: "",
  email: "",
  phone: "",
  check_in: new Date().toISOString().slice(0, 10),
  check_out: new Date().toISOString().slice(0, 10),
  status: "pendente",
  total: 0,
  notes: "",
};

const money = (value: number) => `R$ ${Number(value || 0).toLocaleString("pt-BR")}`;

export default function AdminPanel() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [photos, setPhotos] = useState<PropertyPhoto[]>([]);
  const [reservations, setReservations] = useState<ReservationRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [propertyForm, setPropertyForm] = useState<Partial<PropertyRecord>>(emptyProperty);
  const [reservationForm, setReservationForm] = useState<Partial<ReservationRecord>>(emptyReservation);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  function logout() {
    window.localStorage.removeItem(ADMIN_TOKEN_KEY);
    setAuthed(false);
  }

  useEffect(() => {
    const token = window.localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) {
      setAuthed(false);
      return;
    }
    api.getMe()
      .then(() => setAuthed(true))
      .catch(() => {
        window.localStorage.removeItem(ADMIN_TOKEN_KEY);
        setAuthed(false);
      });
  }, []);

  useEffect(() => {
    if (authed) loadAll();
  }, [authed]);

  const selected = properties.find((property) => property.id === selectedId);
  const selectedPhotos = photos.filter((photo) => photo.property_id === selectedId);

  const metrics = useMemo(() => ({
    properties: properties.length,
    photos: photos.length,
    reservations: reservations.length,
    revenue: reservations.filter((item) => item.status === "confirmada").reduce((sum, item) => sum + Number(item.total), 0),
  }), [properties, photos, reservations]);

  async function loadAll(nextSelectedId?: string) {
    setLoading(true);
    try {
      const [{ properties: propertyRows, photos: photoRows }, { reservations: reservationRows }] = await Promise.all([
        api.getProperties(),
        api.getReservations(),
      ]);
      setProperties(propertyRows);
      setPhotos(photoRows);
      setReservations(reservationRows);
      const activeId = nextSelectedId || selectedId || propertyRows[0]?.id || "";
      setSelectedId(activeId);
      const active = propertyRows.find((property) => property.id === activeId);
      setPropertyForm(active || emptyProperty);
      setReservationForm((prev) => ({ ...prev, property_id: prev.property_id || activeId || propertyRows[0]?.id || "" }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }

  function editProperty(property: PropertyRecord) {
    setSelectedId(property.id);
    setPropertyForm(property);
  }

  function updateForm<K extends keyof PropertyRecord>(key: K, value: PropertyRecord[K]) {
    setPropertyForm((prev) => ({ ...prev, [key]: value }));
  }

  async function saveProperty(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...propertyForm,
        amenities: typeof propertyForm.amenities === "string"
          ? String(propertyForm.amenities).split(",").map((item) => item.trim()).filter(Boolean)
          : propertyForm.amenities,
      };
      if (selected?.id) {
        await api.updateProperty(selected.id, payload);
        toast.success("Propriedade atualizada.");
        await loadAll(selected.id);
      } else {
        const { id } = await api.createProperty(payload);
        toast.success("Propriedade criada.");
        await loadAll(id);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function deleteProperty(id: string) {
    if (!confirm("Excluir esta propriedade e sua galeria?")) return;
    await api.deleteProperty(id);
    toast.success("Propriedade excluida.");
    await loadAll("");
  }

  async function uploadPhotos(files: FileList | null) {
    if (!selectedId || !files?.length) return;
    setUploading(true);
    try {
      await api.uploadPhotos(selectedId, files);
      toast.success("Fotos enviadas.");
      await loadAll(selectedId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro no upload");
    } finally {
      setUploading(false);
    }
  }

  async function updatePhoto(photo: PropertyPhoto, patch: Partial<PropertyPhoto>) {
    await api.updatePhoto(photo.id, { ...photo, ...patch });
    await loadAll(selectedId);
  }

  async function removePhoto(photo: PropertyPhoto) {
    await api.deletePhoto(photo.id);
    toast.success("Foto removida.");
    await loadAll(selectedId);
  }

  async function saveReservation(event: FormEvent) {
    event.preventDefault();
    await api.createReservation(reservationForm);
    toast.success("Reserva criada.");
    setReservationForm({ ...emptyReservation, property_id: selectedId || properties[0]?.id || "" });
    await loadAll(selectedId);
  }

  async function updateReservation(reservation: ReservationRecord, status: ReservationRecord["status"]) {
    await api.updateReservation(reservation.id, { status, notes: reservation.notes });
    await loadAll(selectedId);
  }

  if (authed === null || (authed && loading)) {
    return (
      <section className="mobile-shell flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </section>
    );
  }

  if (!authed) {
    return <AdminLogin onLogin={() => setAuthed(true)} />;
  }

  return (
    <section className="mobile-shell py-28 md:py-32">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge className="mb-3 bg-primary/10 text-primary">Admin Paradise Beach</Badge>
            <Button variant="outline" size="sm" onClick={logout} className="mb-3">
              <LogOut className="mr-2 h-4 w-4" /> Sair
            </Button>
          </div>
          <h1 className="font-serif text-3xl font-bold text-primary md:text-4xl">Painel de propriedades</h1>
          <p className="mt-2 text-muted-foreground">Cadastro, galeria, localizacao, reservas e metodos de reserva.</p>
        </div>
        <Button onClick={() => { setSelectedId(""); setPropertyForm(emptyProperty); }}>
          <Plus className="mr-2 h-4 w-4" /> Nova propriedade
        </Button>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <Metric icon={<Home />} label="Propriedades" value={metrics.properties} />
        <Metric icon={<Camera />} label="Fotos" value={metrics.photos} />
        <Metric icon={<CalendarDays />} label="Reservas" value={metrics.reservations} />
        <Metric icon={<Save />} label="Receita confirmada" value={money(metrics.revenue)} />
      </div>

      <Tabs defaultValue="details" className="mt-8">
        <TabsList className="h-auto flex-wrap justify-start gap-2 bg-transparent p-0">
          <TabsTrigger value="details">Detalhes</TabsTrigger>
          <TabsTrigger value="gallery">Galeria</TabsTrigger>
          <TabsTrigger value="reservations">Reservas</TabsTrigger>
          <TabsTrigger value="list">Lista</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-5">
          <Card>
            <CardHeader>
              <CardTitle>{selected ? "Editar propriedade" : "Nova propriedade"}</CardTitle>
              <CardDescription>Preencha dados comerciais, localizacao, comodidades e metodo de reserva.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={saveProperty} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Field label="Titulo" className="md:col-span-2">
                  <Input value={propertyForm.title || ""} onChange={(e) => updateForm("title", e.target.value)} required />
                </Field>
                <Field label="Tipo">
                  <Select value={propertyForm.type} onChange={(value) => updateForm("type", value as PropertyRecord["type"])} options={["casa", "villa", "apartamento", "terreno"]} />
                </Field>
                <Field label="Status">
                  <Select value={propertyForm.status} onChange={(value) => updateForm("status", value as PropertyRecord["status"])} options={["disponivel", "alugado", "vendido"]} />
                </Field>
                <Field label="Preco">
                  <Input type="number" value={propertyForm.price ?? 0} onChange={(e) => updateForm("price", Number(e.target.value))} />
                </Field>
                <Field label="Rotulo do preco">
                  <Input value={propertyForm.price_label || ""} onChange={(e) => updateForm("price_label", e.target.value)} placeholder="/diaria" />
                </Field>
                <Field label="Quartos">
                  <Input type="number" value={propertyForm.bedrooms ?? 0} onChange={(e) => updateForm("bedrooms", Number(e.target.value))} />
                </Field>
                <Field label="Banheiros">
                  <Input type="number" value={propertyForm.bathrooms ?? 0} onChange={(e) => updateForm("bathrooms", Number(e.target.value))} />
                </Field>
                <Field label="Area m2">
                  <Input type="number" value={propertyForm.area ?? 0} onChange={(e) => updateForm("area", Number(e.target.value))} />
                </Field>
                <Field label="Max hospedes">
                  <Input type="number" value={propertyForm.max_guests ?? 1} onChange={(e) => updateForm("max_guests", Number(e.target.value))} />
                </Field>
                <Field label="Min noites">
                  <Input type="number" value={propertyForm.min_nights ?? 1} onChange={(e) => updateForm("min_nights", Number(e.target.value))} />
                </Field>
                <Field label="Cidade">
                  <Input value={propertyForm.city || ""} onChange={(e) => updateForm("city", e.target.value)} />
                </Field>
                <Field label="UF">
                  <Input value={propertyForm.state || ""} maxLength={2} onChange={(e) => updateForm("state", e.target.value.toUpperCase())} />
                </Field>
                <Field label="Bairro/regiao" className="md:col-span-2">
                  <Input value={propertyForm.location || ""} onChange={(e) => updateForm("location", e.target.value)} />
                </Field>
                <Field label="Latitude">
                  <Input value={propertyForm.lat ?? ""} onChange={(e) => updateForm("lat", e.target.value ? Number(e.target.value) : null)} />
                </Field>
                <Field label="Longitude">
                  <Input value={propertyForm.lng ?? ""} onChange={(e) => updateForm("lng", e.target.value ? Number(e.target.value) : null)} />
                </Field>
                <Field label="WhatsApp">
                  <Input value={propertyForm.whatsapp || ""} onChange={(e) => updateForm("whatsapp", e.target.value)} placeholder="5573999990000" />
                </Field>
                <Field label="Metodo de reserva">
                  <Select value={propertyForm.booking_method} onChange={(value) => updateForm("booking_method", value as PropertyRecord["booking_method"])} options={["whatsapp", "email", "phone", "manual", "external"]} />
                </Field>
                <Field label="URL de reserva" className="md:col-span-2">
                  <Input value={propertyForm.booking_url || ""} onChange={(e) => updateForm("booking_url", e.target.value)} placeholder="Airbnb, Booking, formulario externo..." />
                </Field>
                <Field label="Comodidades" className="md:col-span-2">
                  <Input
                    value={(propertyForm.amenities || []).join(", ")}
                    onChange={(e) => updateForm("amenities", e.target.value.split(",").map((item) => item.trim()).filter(Boolean))}
                    placeholder="Piscina, Wi-Fi, Ar condicionado"
                  />
                </Field>
                <Field label="Descricao" className="md:col-span-2 xl:col-span-4">
                  <Textarea rows={5} value={propertyForm.description || ""} onChange={(e) => updateForm("description", e.target.value)} />
                </Field>
                <Field label="Notas de reserva" className="md:col-span-2 xl:col-span-4">
                  <Textarea rows={3} value={propertyForm.booking_notes || ""} onChange={(e) => updateForm("booking_notes", e.target.value)} />
                </Field>
                <div className="flex flex-wrap gap-3 md:col-span-2 xl:col-span-4">
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(propertyForm.featured)} onChange={(e) => updateForm("featured", e.target.checked)} /> Destaque</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(propertyForm.ocean_view)} onChange={(e) => updateForm("ocean_view", e.target.checked)} /> Vista para o mar</label>
                </div>
                <div className="md:col-span-2 xl:col-span-4">
                  <Button disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Salvar propriedade
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gallery" className="mt-5">
          <Card>
            <CardHeader>
              <CardTitle>Galeria da propriedade</CardTitle>
              <CardDescription>{selected ? selected.title : "Selecione uma propriedade na lista."}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <PropertyPicker properties={properties} value={selectedId} onChange={(id) => editProperty(properties.find((item) => item.id === id)!)} />
                <label className="inline-flex cursor-pointer items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                  {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  Enviar fotos
                  <input className="hidden" type="file" accept="image/*" multiple onChange={(e) => uploadPhotos(e.target.files)} />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {selectedPhotos.map((photo) => (
                  <Card key={photo.id} className="overflow-hidden">
                    <img src={photo.url} alt={photo.caption} className="h-48 w-full object-cover" />
                    <CardContent className="space-y-3 p-4">
                      <Input value={photo.caption} onChange={(e) => updatePhoto(photo, { caption: e.target.value })} />
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant={photo.cover ? "secondary" : "outline"} onClick={() => updatePhoto(photo, { cover: true })}>Capa</Button>
                        <Button size="sm" variant={photo.published ? "secondary" : "outline"} onClick={() => updatePhoto(photo, { published: !photo.published })}>{photo.published ? "Publicada" : "Oculta"}</Button>
                        <Button size="sm" variant="destructive" onClick={() => removePhoto(photo)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reservations" className="mt-5 grid gap-5 xl:grid-cols-[420px_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Nova reserva</CardTitle>
              <CardDescription>Registro manual de reservas e bloqueios.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={saveReservation} className="space-y-3">
                <Field label="Propriedade"><PropertyPicker properties={properties} value={reservationForm.property_id || ""} onChange={(id) => setReservationForm((prev) => ({ ...prev, property_id: id }))} /></Field>
                <Field label="Nome"><Input value={reservationForm.guest_name || ""} onChange={(e) => setReservationForm((prev) => ({ ...prev, guest_name: e.target.value }))} required /></Field>
                <Field label="E-mail"><Input type="email" value={reservationForm.email || ""} onChange={(e) => setReservationForm((prev) => ({ ...prev, email: e.target.value }))} required /></Field>
                <Field label="Telefone"><Input value={reservationForm.phone || ""} onChange={(e) => setReservationForm((prev) => ({ ...prev, phone: e.target.value }))} /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Check-in"><Input type="date" value={reservationForm.check_in || ""} onChange={(e) => setReservationForm((prev) => ({ ...prev, check_in: e.target.value }))} /></Field>
                  <Field label="Check-out"><Input type="date" value={reservationForm.check_out || ""} onChange={(e) => setReservationForm((prev) => ({ ...prev, check_out: e.target.value }))} /></Field>
                </div>
                <Field label="Total"><Input type="number" value={reservationForm.total ?? 0} onChange={(e) => setReservationForm((prev) => ({ ...prev, total: Number(e.target.value) }))} /></Field>
                <Field label="Notas"><Textarea value={reservationForm.notes || ""} onChange={(e) => setReservationForm((prev) => ({ ...prev, notes: e.target.value }))} /></Field>
                <Button><Plus className="mr-2 h-4 w-4" />Criar reserva</Button>
              </form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Reservas</CardTitle>
              <CardDescription>Atualize status conforme atendimento.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {reservations.map((reservation) => (
                <div key={reservation.id} className="rounded-lg border p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold">{reservation.guest_name}</p>
                      <p className="text-sm text-muted-foreground">{properties.find((item) => item.id === reservation.property_id)?.title} - {reservation.check_in} a {reservation.check_out}</p>
                    </div>
                    <div className="flex gap-2">
                      <Select value={reservation.status} onChange={(value) => updateReservation(reservation, value as ReservationRecord["status"])} options={["pendente", "confirmada", "cancelada"]} />
                      <Button variant="destructive" size="sm" onClick={async () => { await api.deleteReservation(reservation.id); await loadAll(selectedId); }}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  <p className="mt-2 text-sm">{reservation.email} {reservation.phone ? `- ${reservation.phone}` : ""} - {money(Number(reservation.total))}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list" className="mt-5">
          <Card>
            <CardHeader>
              <CardTitle>Propriedades cadastradas</CardTitle>
              <CardDescription>Clique para editar detalhes ou excluir.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {properties.map((property) => (
                <div key={property.id} className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between">
                  <button className="text-left" onClick={() => editProperty(property)}>
                    <p className="font-semibold">{property.title}</p>
                    <p className="text-sm text-muted-foreground"><MapPin className="mr-1 inline h-3 w-3" />{property.location}, {property.city}/{property.state}</p>
                    <p className="mt-1 text-sm"><Bed className="mr-1 inline h-3 w-3" />{property.bedrooms} <Bath className="mx-1 inline h-3 w-3" />{property.bathrooms} - {money(property.price)}{property.price_label}</p>
                  </button>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => editProperty(property)}>Editar</Button>
                    <Button variant="destructive" onClick={() => deleteProperty(property.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="flex items-center gap-2 text-2xl text-primary">
          <span className="[&_svg]:h-5 [&_svg]:w-5">{icon}</span>{value}
        </CardTitle>
      </CardHeader>
    </Card>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}

function Select({ value, options, onChange }: { value?: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <select value={value || ""} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
      {options.map((option) => <option key={option} value={option}>{option}</option>)}
    </select>
  );
}

function PropertyPicker({ properties, value, onChange }: { properties: PropertyRecord[]; value: string; onChange: (id: string) => void }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
      <option value="">Selecione</option>
      {properties.map((property) => <option key={property.id} value={property.id}>{property.title}</option>)}
    </select>
  );
}
