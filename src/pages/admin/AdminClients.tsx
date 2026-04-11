import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { api, type DbClient, type DbProperty, type DbReservation, getImageUrl, type PaymentMethod } from "@/lib/api";
import { CreditCard, Loader2, MapPin, Phone, Plus, Search, ShieldCheck, Trash2, Upload, User, Users } from "lucide-react";
import { toast } from "sonner";

const paymentMethodLabel: Record<PaymentMethod, string> = {
  pix: "Pix",
  cartao_credito: "Cartao de credito",
  cartao_debito: "Cartao de debito",
  transferencia: "Transferencia",
  boleto: "Boleto",
  dinheiro: "Dinheiro",
};

const emptyForm = {
  full_name: "",
  email: "",
  phone: "",
  document: "",
  document_type: "CPF",
  birth_date: "",
  nationality: "Brasileira",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  country: "Brasil",
  zip_code: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  vip_status: false,
  tags_input: "",
  profile_photo_url: "",
  preferred_payment_method: "" as PaymentMethod | "",
  notes: "",
};

export default function AdminClients() {
  const [clients, setClients] = useState<DbClient[]>([]);
  const [reservations, setReservations] = useState<DbReservation[]>([]);
  const [properties, setProperties] = useState<DbProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [editing, setEditing] = useState<DbClient | null>(null);
  const [selectedClient, setSelectedClient] = useState<DbClient | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [clientsData, reservationsData, propertiesData] = await Promise.all([
        api.getClients(),
        api.getReservations(),
        api.getProperties(),
      ]);
      setClients(clientsData);
      setReservations(reservationsData);
      setProperties(propertiesData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const propertyNameById = useMemo(() => Object.fromEntries(properties.map((property) => [property.id, property.title])), [properties]);
  const reservationsByClient = useMemo(() => {
    const map: Record<string, DbReservation[]> = {};
    for (const reservation of reservations) {
      if (!reservation.client_id) continue;
      (map[reservation.client_id] ??= []).push(reservation);
    }
    return map;
  }, [reservations]);

  const filteredClients = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return clients;
    return clients.filter((client) =>
      `${client.full_name} ${client.email} ${client.phone ?? ""} ${client.document ?? ""} ${client.city ?? ""} ${client.tags_json?.join(" ") ?? ""}`
        .toLowerCase()
        .includes(query)
    );
  }, [clients, search]);

  const metrics = useMemo(() => ({
    totalClients: clients.length,
    vipClients: clients.filter((client) => client.vip_status).length,
    withReservations: clients.filter((client) => (reservationsByClient[client.id] ?? []).length > 0).length,
    totalRevenue: reservations.reduce((sum, reservation) => sum + Number(reservation.total), 0),
  }), [clients, reservations, reservationsByClient]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (client: DbClient) => {
    setEditing(client);
    setForm({
      full_name: client.full_name,
      email: client.email,
      phone: client.phone ?? "",
      document: client.document ?? "",
      document_type: client.document_type ?? "CPF",
      birth_date: client.birth_date ?? "",
      nationality: client.nationality ?? "Brasileira",
      address_line1: client.address_line1 ?? "",
      address_line2: client.address_line2 ?? "",
      city: client.city ?? "",
      state: client.state ?? "",
      country: client.country ?? "Brasil",
      zip_code: client.zip_code ?? "",
      emergency_contact_name: client.emergency_contact_name ?? "",
      emergency_contact_phone: client.emergency_contact_phone ?? "",
      vip_status: client.vip_status,
      tags_input: client.tags_json?.join(", ") ?? "",
      profile_photo_url: client.profile_photo_url ?? "",
      preferred_payment_method: client.preferred_payment_method ?? "",
      notes: client.notes ?? "",
    });
    setDialogOpen(true);
  };

  const openDetails = (client: DbClient) => {
    setSelectedClient(client);
    setDetailOpen(true);
  };
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const result = await api.uploadClientPhoto(file);
      setForm((current) => ({ ...current, profile_photo_url: result.url }));
      toast.success("Foto de perfil enviada com sucesso.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao enviar foto.");
    } finally {
      setUploadingPhoto(false);
      event.target.value = "";
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload: Partial<DbClient> = {
        full_name: form.full_name,
        email: form.email,
        phone: form.phone || null,
        document: form.document || null,
        document_type: form.document_type || null,
        birth_date: form.birth_date || null,
        nationality: form.nationality || null,
        address_line1: form.address_line1 || null,
        address_line2: form.address_line2 || null,
        city: form.city || null,
        state: form.state || null,
        country: form.country || null,
        zip_code: form.zip_code || null,
        emergency_contact_name: form.emergency_contact_name || null,
        emergency_contact_phone: form.emergency_contact_phone || null,
        vip_status: form.vip_status,
        tags_json: form.tags_input.split(",").map((tag) => tag.trim()).filter(Boolean),
        profile_photo_url: form.profile_photo_url || null,
        preferred_payment_method: (form.preferred_payment_method || null) as PaymentMethod | null,
        notes: form.notes || null,
      };

      if (editing) {
        await api.updateClient(editing.id, payload);
        toast.success("Cliente atualizado com sucesso.");
      } else {
        await api.createClient(payload);
        toast.success("Cliente cadastrado com sucesso.");
      }

      setDialogOpen(false);
      await fetchAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar cliente.");
    } finally {
      setSaving(false);
    }
  };

  const removeClient = async (client: DbClient) => {
    if (!confirm(`Deseja remover o cliente ${client.full_name}?`)) return;
    try {
      await api.deleteClient(client.id);
      toast.success("Cliente removido.");
      await fetchAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao remover cliente.");
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Clientes</h1>
          <p className="text-muted-foreground">Perfis completos, contato de emergencia, preferencias e historico financeiro.</p>
        </div>
        <Button onClick={openCreate} className="gap-2 bg-gradient-ocean hover:opacity-90"><Plus className="h-4 w-4" /> Novo Cliente</Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total de clientes</p><p className="text-2xl font-bold text-foreground">{metrics.totalClients}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Perfis VIP</p><p className="text-2xl font-bold text-foreground">{metrics.vipClients}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Com reservas</p><p className="text-2xl font-bold text-foreground">{metrics.withReservations}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Volume financeiro</p><p className="text-2xl font-bold text-foreground">R$ {metrics.totalRevenue.toLocaleString("pt-BR")}</p></CardContent></Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Buscar por nome, e-mail, telefone, cidade, tags..." value={search} onChange={(event) => setSearch(event.target.value)} />
      </div>

      {filteredClients.length === 0 ? (
        <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center py-16 text-center"><Users className="mb-4 h-12 w-12 text-muted-foreground/30" /><h3 className="mb-1 text-lg font-semibold text-foreground">Nenhum cliente encontrado</h3><p className="text-sm text-muted-foreground">Cadastre clientes para acompanhar reservas, hospedes e pagamentos.</p></CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredClients.map((client) => {
            const clientReservations = reservationsByClient[client.id] ?? [];
            const totalSpent = clientReservations.reduce((sum, reservation) => sum + Number(reservation.total), 0);
            return (
              <Card key={client.id} className="border-slate-200 transition hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {client.profile_photo_url ? <img src={getImageUrl(client.profile_photo_url)} alt={client.full_name} className="h-12 w-12 rounded-full object-cover" /> : <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"><User className="h-5 w-5" /></div>}
                      <div>
                        <div className="flex items-center gap-2"><p className="text-base font-semibold text-foreground">{client.full_name}</p>{client.vip_status ? <Badge className="bg-amber-100 text-amber-800">VIP</Badge> : null}</div>
                        <p className="text-xs text-muted-foreground">{client.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-1.5"><Button size="sm" variant="outline" onClick={() => openEdit(client)}>Editar</Button><Button size="sm" variant="ghost" className="text-destructive" onClick={() => removeClient(client)}><Trash2 className="h-4 w-4" /></Button></div>
                  </div>

                  <div className="mt-3 grid gap-1.5 text-sm text-muted-foreground">
                    {client.phone ? <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {client.phone}</p> : null}
                    {client.city || client.state ? <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {[client.city, client.state, client.country].filter(Boolean).join(" - ")}</p> : null}
                    {client.preferred_payment_method ? <p className="flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5" /> {paymentMethodLabel[client.preferred_payment_method]}</p> : null}
                    {client.emergency_contact_name ? <p className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> {client.emergency_contact_name} {client.emergency_contact_phone ? `- ${client.emergency_contact_phone}` : ""}</p> : null}
                  </div>

                  {client.tags_json?.length ? <div className="mt-3 flex flex-wrap gap-2">{client.tags_json.map((tag) => <Badge key={tag} variant="outline">{tag}</Badge>)}</div> : null}

                  <div className="mt-4 flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                    <div><p className="text-xs text-muted-foreground">Historico de reservas</p><p className="text-lg font-semibold text-foreground">{clientReservations.length}</p></div>
                    <div className="text-right"><p className="text-xs text-muted-foreground">Total movimentado</p><p className="text-sm font-semibold text-foreground">R$ {totalSpent.toLocaleString("pt-BR")}</p></div>
                    <Button size="sm" variant="secondary" onClick={() => openDetails(client)}>Ver perfil</Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar cliente" : "Cadastrar cliente"}</DialogTitle>
            <DialogDescription>Preencha dados de perfil, endereco, emergencia e preferencia de pagamento.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2"><Label>Nome completo</Label><Input value={form.full_name} onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))} required /></div>
              <div className="space-y-1.5"><Label>E-mail</Label><Input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required /></div>
              <div className="space-y-1.5"><Label>Telefone</Label><Input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Documento</Label><Input value={form.document} onChange={(event) => setForm((current) => ({ ...current, document: event.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Tipo do documento</Label><Input value={form.document_type} onChange={(event) => setForm((current) => ({ ...current, document_type: event.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Data de nascimento</Label><Input type="date" value={form.birth_date} onChange={(event) => setForm((current) => ({ ...current, birth_date: event.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Nacionalidade</Label><Input value={form.nationality} onChange={(event) => setForm((current) => ({ ...current, nationality: event.target.value }))} /></div>
              <div className="space-y-2 sm:col-span-2"><Label>Foto de perfil</Label><div className="flex items-center gap-3">{form.profile_photo_url ? <img src={getImageUrl(form.profile_photo_url)} alt="" className="h-14 w-14 rounded-full object-cover" /> : <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-muted-foreground"><User className="h-5 w-5" /></div>}<label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-2 text-sm transition hover:bg-accent">{uploadingPhoto ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Enviar foto<input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} /></label></div></div>

              <div className="space-y-1.5 sm:col-span-2"><Label>Endereco principal</Label><Input value={form.address_line1} onChange={(event) => setForm((current) => ({ ...current, address_line1: event.target.value }))} /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label>Complemento</Label><Input value={form.address_line2} onChange={(event) => setForm((current) => ({ ...current, address_line2: event.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Cidade</Label><Input value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Estado</Label><Input value={form.state} onChange={(event) => setForm((current) => ({ ...current, state: event.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Pais</Label><Input value={form.country} onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))} /></div>
              <div className="space-y-1.5"><Label>CEP</Label><Input value={form.zip_code} onChange={(event) => setForm((current) => ({ ...current, zip_code: event.target.value }))} /></div>

              <div className="space-y-1.5"><Label>Contato de emergencia</Label><Input value={form.emergency_contact_name} onChange={(event) => setForm((current) => ({ ...current, emergency_contact_name: event.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Telefone emergencia</Label><Input value={form.emergency_contact_phone} onChange={(event) => setForm((current) => ({ ...current, emergency_contact_phone: event.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Pagamento preferido</Label><select value={form.preferred_payment_method} onChange={(event) => setForm((current) => ({ ...current, preferred_payment_method: event.target.value as PaymentMethod | "" }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">Nao definido</option>{Object.entries(paymentMethodLabel).map(([method, label]) => <option key={method} value={method}>{label}</option>)}</select></div>
              <div className="space-y-1.5"><Label>Tags</Label><Input value={form.tags_input} onChange={(event) => setForm((current) => ({ ...current, tags_input: event.target.value }))} placeholder="vip, familia, pix" /></div>
              <div className="flex items-center justify-between rounded-lg border p-3 sm:col-span-2"><div><p className="font-medium text-foreground">Perfil VIP</p><p className="text-xs text-muted-foreground">Destaca o cliente no painel e no atendimento.</p></div><Switch checked={form.vip_status} onCheckedChange={(checked) => setForm((current) => ({ ...current, vip_status: checked }))} /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label>Observacoes</Label><Textarea rows={4} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} /></div>
            </div>

            <div className="flex justify-end gap-2"><DialogClose asChild><Button variant="outline" type="button">Cancelar</Button></DialogClose><Button type="submit" disabled={saving} className="gap-2 bg-gradient-ocean hover:opacity-90">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{editing ? "Salvar alteracoes" : "Cadastrar cliente"}</Button></div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Perfil do cliente</DialogTitle>
            <DialogDescription>{selectedClient ? `Resumo cadastral, financeiro e de hospedagem de ${selectedClient.full_name}.` : "Sem cliente selecionado."}</DialogDescription>
          </DialogHeader>
          {selectedClient ? (
            <div className="space-y-4">
              <div className="grid gap-4 rounded-xl border p-4 md:grid-cols-[auto_1fr_auto] md:items-center">
                {selectedClient.profile_photo_url ? <img src={getImageUrl(selectedClient.profile_photo_url)} alt={selectedClient.full_name} className="h-16 w-16 rounded-full object-cover" /> : <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary"><User className="h-6 w-6" /></div>}
                <div>
                  <div className="flex items-center gap-2"><p className="text-lg font-semibold text-foreground">{selectedClient.full_name}</p>{selectedClient.vip_status ? <Badge className="bg-amber-100 text-amber-800">VIP</Badge> : null}</div>
                  <p className="text-sm text-muted-foreground">{selectedClient.email}</p>
                  <p className="text-sm text-muted-foreground">{[selectedClient.city, selectedClient.state, selectedClient.country].filter(Boolean).join(" - ") || "Endereco nao informado"}</p>
                </div>
                <Button variant="outline" onClick={() => { setDetailOpen(false); openEdit(selectedClient); }}>Editar perfil</Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card><CardContent className="space-y-2 p-4 text-sm"><p className="font-semibold text-foreground">Documentacao</p><p><strong>Documento:</strong> {selectedClient.document || "Nao informado"}</p><p><strong>Tipo:</strong> {selectedClient.document_type || "Nao informado"}</p><p><strong>Nascimento:</strong> {selectedClient.birth_date || "Nao informado"}</p><p><strong>Nacionalidade:</strong> {selectedClient.nationality || "Nao informada"}</p></CardContent></Card>
                <Card><CardContent className="space-y-2 p-4 text-sm"><p className="font-semibold text-foreground">Contato e emergencia</p><p><strong>Telefone:</strong> {selectedClient.phone || "Nao informado"}</p><p><strong>Emergencia:</strong> {selectedClient.emergency_contact_name || "Nao informado"}</p><p><strong>Telefone emergencia:</strong> {selectedClient.emergency_contact_phone || "Nao informado"}</p><p><strong>Pagamento favorito:</strong> {selectedClient.preferred_payment_method ? paymentMethodLabel[selectedClient.preferred_payment_method] : "Nao definido"}</p></CardContent></Card>
              </div>

              {(selectedClient.tags_json?.length || selectedClient.notes) ? <Card><CardContent className="space-y-3 p-4 text-sm">{selectedClient.tags_json?.length ? <div className="flex flex-wrap gap-2">{selectedClient.tags_json.map((tag) => <Badge key={tag} variant="outline">{tag}</Badge>)}</div> : null}{selectedClient.notes ? <p className="text-muted-foreground">{selectedClient.notes}</p> : null}</CardContent></Card> : null}

              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">Historico de reservas</p>
                {(reservationsByClient[selectedClient.id] ?? []).length === 0 ? (
                  <Card className="border-dashed"><CardContent className="py-10 text-center text-sm text-muted-foreground">Nenhuma reserva vinculada a este cliente.</CardContent></Card>
                ) : (
                  (reservationsByClient[selectedClient.id] ?? []).map((reservation) => (
                    <Card key={reservation.id}><CardContent className="p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-semibold text-foreground">{propertyNameById[reservation.property_id] ?? "Imovel removido"}</p><p className="mt-1 text-xs text-muted-foreground">{reservation.check_in} ate {reservation.check_out} • {reservation.guests.length} hospedes</p></div><div className="text-right"><p className="text-sm font-semibold text-foreground">R$ {Number(reservation.total).toLocaleString("pt-BR")}</p><div className="mt-1 flex items-center gap-1"><Badge variant="outline">{reservation.status}</Badge><Badge variant="outline">{reservation.pre_checkin_status}</Badge></div></div></div></CardContent></Card>
                  ))
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
