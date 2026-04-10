import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Property, PropertyListing, PropertyStatus, PropertyType, formatPrice } from "@/data/properties";
import { Reservation, ReservationSource, ReservationStatus, calculateNights, useHotelAdmin } from "@/lib/hotel-admin";
import { CalendarDays, Camera, Home, ImagePlus, Plus, RefreshCw, Save, Trash2, Users } from "lucide-react";

const today = new Date().toISOString().slice(0, 10);
const propertyTypes: PropertyType[] = ["casa", "villa", "apartamento", "terreno"];
const propertyListings: PropertyListing[] = ["aluguel", "venda"];
const propertyStatuses: PropertyStatus[] = ["disponivel", "indisponivel", "manutencao", "vendido", "alugado"];
const reservationStatuses: ReservationStatus[] = ["nova", "confirmada", "check-in", "check-out", "cancelada"];
const reservationSources: ReservationSource[] = ["site", "whatsapp", "booking", "manual"];

const reservationStatusTone: Record<ReservationStatus, string> = {
  nova: "bg-sky-100 text-sky-700",
  confirmada: "bg-emerald-100 text-emerald-700",
  "check-in": "bg-violet-100 text-violet-700",
  "check-out": "bg-slate-200 text-slate-700",
  cancelada: "bg-rose-100 text-rose-700",
};

function createEmptyProperty(): Property {
  const id = `PROP-${Date.now()}`;

  return {
    id,
    code: `PB-${String(Date.now()).slice(-4)}`,
    title: "",
    type: "apartamento",
    listing: "aluguel",
    price: 0,
    priceLabel: "/diaria",
    location: "",
    city: "Joao Pessoa",
    state: "PB",
    description: "",
    bedrooms: 1,
    bathrooms: 1,
    area: 45,
    maxGuests: 2,
    minNights: 1,
    checkInTime: "14:00",
    checkOutTime: "11:00",
    oceanView: false,
    featured: false,
    status: "disponivel",
    images: ["/placeholder.svg"],
    amenities: ["Wi-Fi"],
    lat: -7.1195,
    lng: -34.845,
  };
}

function cloneProperty(property: Property): Property {
  return {
    ...property,
    images: [...property.images],
    amenities: [...property.amenities],
  };
}

function createEmptyReservation(propertyId?: string): Reservation {
  return {
    id: `RES-${Date.now()}`,
    propertyId: propertyId ?? "",
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    checkIn: today,
    checkOut: today,
    adults: 2,
    children: 0,
    total: 0,
    deposit: 0,
    source: "manual",
    status: "nova",
    notes: "",
    createdAt: today,
  };
}

function parseAmenities(value: string) {
  return Array.from(
    new Set(
      value
        .split(/\n|,/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

function moveToFront<T>(items: T[], index: number) {
  const next = [...items];
  const [selected] = next.splice(index, 1);
  next.unshift(selected);
  return next;
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function AdminPanel() {
  const { properties, reservations, saveProperty, deleteProperty, saveReservation, deleteReservation, updateReservationStatus, resetDemoData } = useHotelAdmin();

  const [propertySearch, setPropertySearch] = useState("");
  const [reservationSearch, setReservationSearch] = useState("");
  const [reservationFilter, setReservationFilter] = useState<ReservationStatus | "todas">("todas");
  const [isCreatingProperty, setIsCreatingProperty] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState(properties[0]?.id ?? "");
  const [propertyDraft, setPropertyDraft] = useState<Property>(properties[0] ? cloneProperty(properties[0]) : createEmptyProperty());
  const [amenitiesText, setAmenitiesText] = useState(propertyDraft.amenities.join("\n"));
  const [reservationDraft, setReservationDraft] = useState<Reservation>(createEmptyReservation(properties[0]?.id));

  const propertyNameById = useMemo(() => Object.fromEntries(properties.map((property) => [property.id, property.title])), [properties]);

  const filteredProperties = useMemo(() => {
    const search = propertySearch.toLowerCase().trim();
    if (!search) return properties;

    return properties.filter((property) => `${property.title} ${property.city} ${property.location} ${property.code}`.toLowerCase().includes(search));
  }, [properties, propertySearch]);

  const filteredReservations = useMemo(() => {
    return reservations
      .filter((reservation) => (reservationFilter === "todas" ? true : reservation.status === reservationFilter))
      .filter((reservation) => {
        const search = reservationSearch.toLowerCase().trim();
        if (!search) return true;

        const propertyName = propertyNameById[reservation.propertyId] ?? "";
        return `${reservation.guestName} ${reservation.guestEmail} ${propertyName} ${reservation.id}`.toLowerCase().includes(search);
      })
      .sort((a, b) => a.checkIn.localeCompare(b.checkIn));
  }, [propertyNameById, reservationFilter, reservationSearch, reservations]);

  const upcomingReservations = useMemo(
    () => [...reservations].filter((reservation) => reservation.status !== "cancelada").sort((a, b) => a.checkIn.localeCompare(b.checkIn)).slice(0, 5),
    [reservations],
  );

  const dashboard = useMemo(() => {
    const confirmedRevenue = reservations
      .filter((reservation) => reservation.status === "confirmada" || reservation.status === "check-in" || reservation.status === "check-out")
      .reduce((sum, reservation) => sum + reservation.total, 0);

    const galleryImages = properties.reduce((sum, property) => sum + property.images.length, 0);
    const activeProperties = properties.filter((property) => property.status === "disponivel").length;
    const hostingProperties = properties.filter((property) => property.listing === "aluguel").length;
    const noGallery = properties.filter((property) => property.images.length <= 1 && property.images[0] === "/placeholder.svg").length;

    return {
      activeProperties,
      hostingProperties,
      galleryImages,
      confirmedRevenue,
      noGallery,
      newReservations: reservations.filter((reservation) => reservation.status === "nova").length,
      uniqueGuests: new Set(reservations.map((reservation) => reservation.guestEmail)).size,
    };
  }, [properties, reservations]);

  useEffect(() => {
    if (isCreatingProperty) return;

    const current = properties.find((property) => property.id === selectedPropertyId);
    if (current) {
      setPropertyDraft(cloneProperty(current));
      setAmenitiesText(current.amenities.join("\n"));
      return;
    }

    if (properties[0]) {
      setSelectedPropertyId(properties[0].id);
      setPropertyDraft(cloneProperty(properties[0]));
      setAmenitiesText(properties[0].amenities.join("\n"));
      return;
    }

    const empty = createEmptyProperty();
    setIsCreatingProperty(true);
    setSelectedPropertyId(empty.id);
    setPropertyDraft(empty);
    setAmenitiesText(empty.amenities.join("\n"));
  }, [isCreatingProperty, properties, selectedPropertyId]);

  useEffect(() => {
    if (reservationDraft.propertyId) return;
    if (!properties[0]) return;
    setReservationDraft((prev) => ({ ...prev, propertyId: properties[0].id }));
  }, [properties, reservationDraft.propertyId]);

  const selectProperty = (property: Property) => {
    setIsCreatingProperty(false);
    setSelectedPropertyId(property.id);
    setPropertyDraft(cloneProperty(property));
    setAmenitiesText(property.amenities.join("\n"));
  };

  const startNewProperty = () => {
    const empty = createEmptyProperty();
    setIsCreatingProperty(true);
    setSelectedPropertyId(empty.id);
    setPropertyDraft(empty);
    setAmenitiesText(empty.amenities.join("\n"));
  };

  const handlePropertyChange = <K extends keyof Property>(field: K, value: Property[K]) => {
    setPropertyDraft((prev) => ({
      ...prev,
      [field]: value,
      priceLabel: field === "listing" ? (value === "aluguel" ? "/diaria" : "") : prev.priceLabel,
    }));
  };

  const handleGalleryUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    const uploaded = await Promise.all(files.map(fileToDataUrl));
    setPropertyDraft((prev) => ({
      ...prev,
      images: [...prev.images.filter((image) => image !== "/placeholder.svg"), ...uploaded],
    }));
    event.target.value = "";
  };

  const handlePropertySubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextProperty: Property = {
      ...propertyDraft,
      title: propertyDraft.title.trim(),
      code: propertyDraft.code.trim() || `PB-${String(Date.now()).slice(-4)}`,
      location: propertyDraft.location.trim(),
      city: propertyDraft.city.trim(),
      state: propertyDraft.state.trim().toUpperCase(),
      description: propertyDraft.description.trim(),
      images: propertyDraft.images.length ? propertyDraft.images : ["/placeholder.svg"],
      amenities: parseAmenities(amenitiesText),
      priceLabel: propertyDraft.listing === "aluguel" ? (propertyDraft.priceLabel || "/diaria") : "",
    };

    saveProperty(nextProperty);
    setIsCreatingProperty(false);
    setSelectedPropertyId(nextProperty.id);
    setPropertyDraft(cloneProperty(nextProperty));
    setAmenitiesText(nextProperty.amenities.join("\n"));
  };

  const handleDeleteProperty = (propertyId: string) => {
    deleteProperty(propertyId);
    if (propertyId === selectedPropertyId) {
      startNewProperty();
    }
  };

  const handleReservationSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveReservation(reservationDraft);
    setReservationDraft(createEmptyReservation(reservationDraft.propertyId || properties[0]?.id));
  };

  const selectedReservationProperty = properties.find((property) => property.id === reservationDraft.propertyId);
  const suggestedReservationTotal = selectedReservationProperty ? calculateNights(reservationDraft.checkIn, reservationDraft.checkOut) * selectedReservationProperty.price : 0;

  return (
    <section className="mobile-shell py-28 md:py-32">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <Badge className="w-fit bg-primary/10 text-primary">Admin Hotel & Reservas</Badge>
          <h1 className="font-serif text-3xl font-bold text-primary md:text-4xl">Operacao completa de hospedagem e propriedades</h1>
          <p className="max-w-3xl text-muted-foreground">
            Painel para cadastrar propriedades, subir galerias de imagens, acompanhar reservas e organizar a operacao de hospedagem com persistencia local.
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={resetDemoData}>
          <RefreshCw className="h-4 w-4" /> Restaurar dados demo
        </Button>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Propriedades ativas</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl"><Home className="h-6 w-6 text-primary" />{dashboard.activeProperties}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Imagens na galeria</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl"><Camera className="h-6 w-6 text-primary" />{dashboard.galleryImages}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Reservas novas</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl"><CalendarDays className="h-6 w-6 text-primary" />{dashboard.newReservations}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Hospedes unicos</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl"><Users className="h-6 w-6 text-primary" />{dashboard.uniqueGuests}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="mt-8 space-y-4">
        <TabsList className="h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0">
          <TabsTrigger value="overview">Visao geral</TabsTrigger>
          <TabsTrigger value="properties">Propriedades</TabsTrigger>
          <TabsTrigger value="reservations">Reservas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-5">
          <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Proximas reservas</CardTitle>
                <CardDescription>Chegadas mais proximas para priorizar atendimento e operacional.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingReservations.length ? upcomingReservations.map((reservation) => (
                  <div key={reservation.id} className="rounded-xl border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">{reservation.guestName}</p>
                        <p className="text-sm text-muted-foreground">{propertyNameById[reservation.propertyId] ?? "Propriedade removida"}</p>
                      </div>
                      <Badge className={reservationStatusTone[reservation.status]}>{reservation.status}</Badge>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-4">
                      <span>Check-in: {reservation.checkIn}</span>
                      <span>Check-out: {reservation.checkOut}</span>
                      <span>Noites: {calculateNights(reservation.checkIn, reservation.checkOut)}</span>
                      <span>Total: {formatPrice(reservation.total)}</span>
                    </div>
                  </div>
                )) : <p className="text-sm text-muted-foreground">Nenhuma reserva cadastrada.</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Indicadores rapidos</CardTitle>
                <CardDescription>Visibilidade imediata sobre inventario e receita.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="rounded-xl border p-4">
                  <p className="text-sm text-muted-foreground">Receita confirmada</p>
                  <p className="text-2xl font-bold text-primary">{formatPrice(dashboard.confirmedRevenue)}</p>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="text-sm text-muted-foreground">Propriedades de hospedagem</p>
                  <p className="text-2xl font-bold text-primary">{dashboard.hostingProperties}</p>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="text-sm text-muted-foreground">Sem galeria completa</p>
                  <p className="text-2xl font-bold text-primary">{dashboard.noGallery}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="properties" className="space-y-5">
          <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>Inventario</CardTitle>
                    <CardDescription>Selecione uma propriedade para editar ou crie uma nova.</CardDescription>
                  </div>
                  <Button size="sm" className="gap-2" onClick={startNewProperty}>
                    <Plus className="h-4 w-4" /> Nova
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder="Buscar por nome, cidade ou codigo" value={propertySearch} onChange={(e) => setPropertySearch(e.target.value)} />
                <div className="space-y-3">
                  {filteredProperties.map((property) => (
                    <button
                      key={property.id}
                      type="button"
                      onClick={() => selectProperty(property)}
                      className={`w-full rounded-xl border p-4 text-left transition ${!isCreatingProperty && selectedPropertyId === property.id ? "border-primary bg-primary/5" : "hover:border-primary/40"}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-foreground">{property.title}</p>
                          <p className="text-sm text-muted-foreground">{property.code} - {property.city}/{property.state}</p>
                        </div>
                        {property.featured ? <Badge className="bg-amber-100 text-amber-700">Destaque</Badge> : null}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline">{property.listing}</Badge>
                        <Badge variant="outline">{property.status}</Badge>
                        <Badge variant="outline">{property.images.length} imagens</Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-5">
              <Card>
                <CardHeader>
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle>{isCreatingProperty ? "Nova propriedade" : `Editando ${propertyDraft.title || propertyDraft.code}`}</CardTitle>
                      <CardDescription>Cadastro completo para reservas de hospedagem, galeria e operacao.</CardDescription>
                    </div>
                    {!isCreatingProperty ? (
                      <Button variant="destructive" size="sm" className="gap-2" onClick={() => handleDeleteProperty(propertyDraft.id)}>
                        <Trash2 className="h-4 w-4" /> Excluir
                      </Button>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePropertySubmit} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="property-code">Codigo</Label>
                      <Input id="property-code" value={propertyDraft.code} onChange={(e) => handlePropertyChange("code", e.target.value)} required />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <Label htmlFor="property-title">Titulo</Label>
                      <Input id="property-title" value={propertyDraft.title} onChange={(e) => handlePropertyChange("title", e.target.value)} required />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="property-type">Tipo</Label>
                      <select id="property-type" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={propertyDraft.type} onChange={(e) => handlePropertyChange("type", e.target.value as PropertyType)}>
                        {propertyTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="property-listing">Operacao</Label>
                      <select id="property-listing" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={propertyDraft.listing} onChange={(e) => handlePropertyChange("listing", e.target.value as PropertyListing)}>
                        {propertyListings.map((listing) => <option key={listing} value={listing}>{listing}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="property-status">Status</Label>
                      <select id="property-status" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={propertyDraft.status} onChange={(e) => handlePropertyChange("status", e.target.value as PropertyStatus)}>
                        {propertyStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="property-price">Valor</Label>
                      <Input id="property-price" type="number" min={0} value={propertyDraft.price} onChange={(e) => handlePropertyChange("price", Number(e.target.value) || 0)} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="property-price-label">Complemento do preco</Label>
                      <Input id="property-price-label" value={propertyDraft.priceLabel || ""} onChange={(e) => handlePropertyChange("priceLabel", e.target.value)} placeholder="/diaria, /mes, etc." />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="property-location">Regiao / bairro</Label>
                      <Input id="property-location" value={propertyDraft.location} onChange={(e) => handlePropertyChange("location", e.target.value)} required />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="property-city">Cidade</Label>
                      <Input id="property-city" value={propertyDraft.city} onChange={(e) => handlePropertyChange("city", e.target.value)} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="property-state">UF</Label>
                      <Input id="property-state" maxLength={2} value={propertyDraft.state} onChange={(e) => handlePropertyChange("state", e.target.value.toUpperCase())} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="property-area">Area (m2)</Label>
                      <Input id="property-area" type="number" min={0} value={propertyDraft.area} onChange={(e) => handlePropertyChange("area", Number(e.target.value) || 0)} />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="property-bedrooms">Quartos</Label>
                      <Input id="property-bedrooms" type="number" min={0} value={propertyDraft.bedrooms} onChange={(e) => handlePropertyChange("bedrooms", Number(e.target.value) || 0)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="property-bathrooms">Banheiros</Label>
                      <Input id="property-bathrooms" type="number" min={0} value={propertyDraft.bathrooms} onChange={(e) => handlePropertyChange("bathrooms", Number(e.target.value) || 0)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="property-guests">Capacidade maxima</Label>
                      <Input id="property-guests" type="number" min={0} value={propertyDraft.maxGuests} onChange={(e) => handlePropertyChange("maxGuests", Number(e.target.value) || 0)} />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="property-min-nights">Minimo de noites</Label>
                      <Input id="property-min-nights" type="number" min={0} value={propertyDraft.minNights} onChange={(e) => handlePropertyChange("minNights", Number(e.target.value) || 0)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="property-checkin">Check-in</Label>
                      <Input id="property-checkin" type="time" value={propertyDraft.checkInTime} onChange={(e) => handlePropertyChange("checkInTime", e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="property-checkout">Check-out</Label>
                      <Input id="property-checkout" type="time" value={propertyDraft.checkOutTime} onChange={(e) => handlePropertyChange("checkOutTime", e.target.value)} />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="property-lat">Latitude</Label>
                      <Input id="property-lat" type="number" step="0.0001" value={propertyDraft.lat} onChange={(e) => handlePropertyChange("lat", Number(e.target.value) || 0)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="property-lng">Longitude</Label>
                      <Input id="property-lng" type="number" step="0.0001" value={propertyDraft.lng} onChange={(e) => handlePropertyChange("lng", Number(e.target.value) || 0)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Marcacoes</Label>
                      <div className="flex flex-wrap gap-3 rounded-lg border border-input px-3 py-2 text-sm">
                        <label className="inline-flex items-center gap-2">
                          <input type="checkbox" checked={propertyDraft.featured} onChange={(e) => handlePropertyChange("featured", e.target.checked)} /> Destaque
                        </label>
                        <label className="inline-flex items-center gap-2">
                          <input type="checkbox" checked={propertyDraft.oceanView} onChange={(e) => handlePropertyChange("oceanView", e.target.checked)} /> Vista mar
                        </label>
                      </div>
                    </div>

                    <div className="space-y-1.5 md:col-span-2 xl:col-span-3">
                      <Label htmlFor="property-description">Descricao</Label>
                      <Textarea id="property-description" rows={4} value={propertyDraft.description} onChange={(e) => handlePropertyChange("description", e.target.value)} required />
                    </div>

                    <div className="space-y-1.5 md:col-span-2 xl:col-span-3">
                      <Label htmlFor="property-amenities">Comodidades (uma por linha)</Label>
                      <Textarea id="property-amenities" rows={5} value={amenitiesText} onChange={(e) => setAmenitiesText(e.target.value)} />
                    </div>

                    <div className="md:col-span-2 xl:col-span-3">
                      <Button type="submit" className="gap-2">
                        <Save className="h-4 w-4" /> {isCreatingProperty ? "Cadastrar propriedade" : "Salvar alteracoes"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><ImagePlus className="h-5 w-5 text-primary" />Galeria da propriedade</CardTitle>
                  <CardDescription>Faça upload de imagens, escolha a capa e remova itens da galeria antes de salvar.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="text-sm text-muted-foreground">
                      {propertyDraft.images.filter((image) => image !== "/placeholder.svg").length} imagem(ns) adicionada(s). A primeira imagem e usada como capa.
                    </div>
                    <Input type="file" accept="image/*" multiple onChange={handleGalleryUpload} className="max-w-sm" />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {propertyDraft.images.map((image, index) => (
                      <div key={`${image}-${index}`} className="overflow-hidden rounded-2xl border bg-background">
                        <img src={image} alt={`Galeria ${index + 1}`} className="h-40 w-full object-cover" />
                        <div className="space-y-2 p-3">
                          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                            <span>{index === 0 ? "Capa" : `Imagem ${index + 1}`}</span>
                            {index === 0 ? <Badge className="bg-primary/10 text-primary">Capa</Badge> : null}
                          </div>
                          <div className="flex gap-2">
                            <Button type="button" size="sm" variant="outline" className="flex-1" onClick={() => setPropertyDraft((prev) => ({ ...prev, images: moveToFront(prev.images, index) }))} disabled={index === 0}>
                              Capa
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              className="flex-1"
                              onClick={() => setPropertyDraft((prev) => {
                                const nextImages = prev.images.filter((_, imageIndex) => imageIndex !== index);
                                return {
                                  ...prev,
                                  images: nextImages.length ? nextImages : ["/placeholder.svg"],
                                };
                              })}
                            >
                              Remover
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="reservations" className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Nova reserva</CardTitle>
              <CardDescription>Cadastre reservas manuais, acompanhe origem e controle o status da hospedagem.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleReservationSubmit} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-1.5">
                  <Label htmlFor="reservation-property">Propriedade</Label>
                  <select id="reservation-property" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={reservationDraft.propertyId} onChange={(e) => setReservationDraft((prev) => ({ ...prev, propertyId: e.target.value }))} required>
                    {properties.map((property) => <option key={property.id} value={property.id}>{property.title}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reservation-guest">Hospede</Label>
                  <Input id="reservation-guest" value={reservationDraft.guestName} onChange={(e) => setReservationDraft((prev) => ({ ...prev, guestName: e.target.value }))} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reservation-email">E-mail</Label>
                  <Input id="reservation-email" type="email" value={reservationDraft.guestEmail} onChange={(e) => setReservationDraft((prev) => ({ ...prev, guestEmail: e.target.value }))} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reservation-phone">Telefone</Label>
                  <Input id="reservation-phone" value={reservationDraft.guestPhone} onChange={(e) => setReservationDraft((prev) => ({ ...prev, guestPhone: e.target.value }))} required />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reservation-checkin">Check-in</Label>
                  <Input id="reservation-checkin" type="date" value={reservationDraft.checkIn} onChange={(e) => setReservationDraft((prev) => ({ ...prev, checkIn: e.target.value }))} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reservation-checkout">Check-out</Label>
                  <Input id="reservation-checkout" type="date" value={reservationDraft.checkOut} onChange={(e) => setReservationDraft((prev) => ({ ...prev, checkOut: e.target.value }))} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reservation-adults">Adultos</Label>
                  <Input id="reservation-adults" type="number" min={1} value={reservationDraft.adults} onChange={(e) => setReservationDraft((prev) => ({ ...prev, adults: Number(e.target.value) || 1 }))} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reservation-children">Criancas</Label>
                  <Input id="reservation-children" type="number" min={0} value={reservationDraft.children} onChange={(e) => setReservationDraft((prev) => ({ ...prev, children: Number(e.target.value) || 0 }))} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reservation-total">Valor total</Label>
                  <Input id="reservation-total" type="number" min={0} value={reservationDraft.total} onChange={(e) => setReservationDraft((prev) => ({ ...prev, total: Number(e.target.value) || 0 }))} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reservation-deposit">Sinal pago</Label>
                  <Input id="reservation-deposit" type="number" min={0} value={reservationDraft.deposit} onChange={(e) => setReservationDraft((prev) => ({ ...prev, deposit: Number(e.target.value) || 0 }))} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reservation-source">Origem</Label>
                  <select id="reservation-source" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={reservationDraft.source} onChange={(e) => setReservationDraft((prev) => ({ ...prev, source: e.target.value as ReservationSource }))}>
                    {reservationSources.map((source) => <option key={source} value={source}>{source}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reservation-status">Status inicial</Label>
                  <select id="reservation-status" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={reservationDraft.status} onChange={(e) => setReservationDraft((prev) => ({ ...prev, status: e.target.value as ReservationStatus }))}>
                    {reservationStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5 md:col-span-2 xl:col-span-4">
                  <Label htmlFor="reservation-notes">Observacoes</Label>
                  <Textarea id="reservation-notes" rows={4} value={reservationDraft.notes} onChange={(e) => setReservationDraft((prev) => ({ ...prev, notes: e.target.value }))} />
                </div>

                <div className="flex flex-col gap-3 md:col-span-2 md:flex-row md:items-center md:justify-between xl:col-span-4">
                  <p className="text-sm text-muted-foreground">
                    Sugestao com base na diaria e periodo: <strong className="text-foreground">{formatPrice(suggestedReservationTotal)}</strong>
                  </p>
                  <Button type="submit" className="gap-2">
                    <Plus className="h-4 w-4" /> Criar reserva
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle>Reservas cadastradas</CardTitle>
                  <CardDescription>Filtre por status, localize o hospede e atualize a operacao rapidamente.</CardDescription>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Input placeholder="Buscar hospede, email ou reserva" value={reservationSearch} onChange={(e) => setReservationSearch(e.target.value)} className="sm:w-72" />
                  <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={reservationFilter} onChange={(e) => setReservationFilter(e.target.value as ReservationStatus | "todas")}>
                    <option value="todas">todas</option>
                    {reservationStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredReservations.length ? filteredReservations.map((reservation) => (
                <div key={reservation.id} className="rounded-xl border p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-foreground">{reservation.id} - {reservation.guestName}</p>
                        <Badge className={reservationStatusTone[reservation.status]}>{reservation.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{propertyNameById[reservation.propertyId] ?? "Propriedade removida"}</p>
                      <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2 xl:grid-cols-4">
                        <span>E-mail: {reservation.guestEmail}</span>
                        <span>Telefone: {reservation.guestPhone}</span>
                        <span>Periodo: {reservation.checkIn} ate {reservation.checkOut}</span>
                        <span>Total: {formatPrice(reservation.total)}</span>
                      </div>
                      {reservation.notes ? <p className="text-sm text-muted-foreground">Observacao: {reservation.notes}</p> : null}
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                      <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={reservation.status} onChange={(e) => updateReservationStatus(reservation.id, e.target.value as ReservationStatus)}>
                        {reservationStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                      </select>
                      <Button variant="destructive" size="sm" className="gap-2" onClick={() => deleteReservation(reservation.id)}>
                        <Trash2 className="h-4 w-4" /> Excluir
                      </Button>
                    </div>
                  </div>
                </div>
              )) : <p className="text-sm text-muted-foreground">Nenhuma reserva encontrada para os filtros selecionados.</p>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  );
}
