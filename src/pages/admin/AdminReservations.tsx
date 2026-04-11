import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  api,
  type DbClient,
  type DbProperty,
  type DbReservation,
  type DbReservationGuest,
  type DbReservationPayment,
  type GuestType,
  type PaymentMethod,
  type PaymentStatus,
  type PreCheckinStatus,
} from "@/lib/api";
import { CalendarCheck, CalendarClock, CalendarDays, CalendarRange, CreditCard, Loader2, Mail, MapPin, Pencil, Plus, Search, ShieldCheck, Trash2, User, Users } from "lucide-react";
import { toast } from "sonner";

const statusBadge: Record<DbReservation["status"], string> = {
  confirmada: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pendente: "bg-amber-50 text-amber-700 border-amber-200",
  cancelada: "bg-rose-50 text-rose-700 border-rose-200",
};

const preCheckinBadge: Record<PreCheckinStatus, string> = {
  confirmado: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pendente: "bg-blue-50 text-blue-700 border-blue-200",
  atrasado: "bg-rose-50 text-rose-700 border-rose-200",
  dispensado: "bg-slate-100 text-slate-700 border-slate-200",
};

const paymentMethodLabel: Record<PaymentMethod, string> = {
  pix: "Pix",
  cartao_credito: "Cartao de credito",
  cartao_debito: "Cartao de debito",
  transferencia: "Transferencia",
  boleto: "Boleto",
  dinheiro: "Dinheiro",
};

const paymentStatusLabel: Record<PaymentStatus, string> = {
  pendente: "Pendente",
  parcial: "Parcial",
  pago: "Pago",
  reembolsado: "Reembolsado",
  cancelado: "Cancelado",
};

type GuestForm = {
  local_id: string;
  client_id: string;
  full_name: string;
  email: string;
  phone: string;
  document: string;
  birth_date: string;
  guest_type: GuestType;
  is_primary: boolean;
  notes: string;
};

type PaymentForm = {
  local_id: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: string;
  installments: string;
  due_at: string;
  paid_at: string;
  reference_code: string;
  pix_copy_paste: string;
  card_brand: string;
  card_last4: string;
  receipt_url: string;
  notes: string;
};

type ReservationFormState = {
  propertyId: string;
  clientId: string;
  bookingCode: string;
  guestName: string;
  email: string;
  checkIn: string;
  checkOut: string;
  status: DbReservation["status"];
  adultsCount: string;
  childrenCount: string;
  infantsCount: string;
  total: string;
  paidAmount: string;
  paymentMethod: PaymentMethod | "";
  paymentStatus: PaymentStatus;
  paymentDueDate: string;
  paymentReference: string;
  paymentInstallments: string;
  paymentReceiptUrl: string;
  paymentGateway: string;
  paymentNotes: string;
  specialRequests: string;
  notes: string;
  preCheckinStatus: PreCheckinStatus;
  preCheckinDueAt: string;
  preCheckinConfirmedAt: string;
  preCheckinNotes: string;
  guests: GuestForm[];
  payments: PaymentForm[];
};

const today = new Date().toISOString().split("T")[0];
const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

function emptyGuest(primary = false): GuestForm {
  return {
    local_id: Math.random().toString(36).slice(2),
    client_id: "",
    full_name: "",
    email: "",
    phone: "",
    document: "",
    birth_date: "",
    guest_type: "adulto",
    is_primary: primary,
    notes: "",
  };
}

function emptyPayment(): PaymentForm {
  return {
    local_id: Math.random().toString(36).slice(2),
    method: "pix",
    status: "pendente",
    amount: "0",
    installments: "1",
    due_at: "",
    paid_at: "",
    reference_code: "",
    pix_copy_paste: "",
    card_brand: "",
    card_last4: "",
    receipt_url: "",
    notes: "",
  };
}

function emptyForm(propertyId = ""): ReservationFormState {
  return {
    propertyId,
    clientId: "",
    bookingCode: "",
    guestName: "",
    email: "",
    checkIn: today,
    checkOut: tomorrow,
    status: "pendente",
    adultsCount: "1",
    childrenCount: "0",
    infantsCount: "0",
    total: "0",
    paidAmount: "0",
    paymentMethod: "pix",
    paymentStatus: "pendente",
    paymentDueDate: today,
    paymentReference: "",
    paymentInstallments: "1",
    paymentReceiptUrl: "",
    paymentGateway: "",
    paymentNotes: "",
    specialRequests: "",
    notes: "",
    preCheckinStatus: "pendente",
    preCheckinDueAt: "",
    preCheckinConfirmedAt: "",
    preCheckinNotes: "",
    guests: [emptyGuest(true)],
    payments: [emptyPayment()],
  };
}

function toDatetimeLocal(value: string | null) {
  if (!value) return "";
  return value.slice(0, 16);
}

function fromReservation(reservation: DbReservation): ReservationFormState {
  return {
    propertyId: reservation.property_id,
    clientId: reservation.client_id || "",
    bookingCode: reservation.booking_code || "",
    guestName: reservation.guest_name,
    email: reservation.email,
    checkIn: reservation.check_in,
    checkOut: reservation.check_out,
    status: reservation.status,
    adultsCount: String(reservation.adults_count || 1),
    childrenCount: String(reservation.children_count || 0),
    infantsCount: String(reservation.infants_count || 0),
    total: String(reservation.total || 0),
    paidAmount: String(reservation.paid_amount || 0),
    paymentMethod: reservation.payment_method || "",
    paymentStatus: reservation.payment_status,
    paymentDueDate: reservation.payment_due_date || "",
    paymentReference: reservation.payment_reference || "",
    paymentInstallments: String(reservation.payment_installments || 1),
    paymentReceiptUrl: reservation.payment_receipt_url || "",
    paymentGateway: reservation.payment_gateway || "",
    paymentNotes: reservation.payment_notes || "",
    specialRequests: reservation.special_requests || "",
    notes: reservation.notes || "",
    preCheckinStatus: reservation.pre_checkin_status,
    preCheckinDueAt: toDatetimeLocal(reservation.pre_checkin_due_at),
    preCheckinConfirmedAt: toDatetimeLocal(reservation.pre_checkin_confirmed_at),
    preCheckinNotes: reservation.pre_checkin_notes || "",
    guests: reservation.guests.length ? reservation.guests.map((guest) => ({ ...guest, local_id: guest.id, client_id: guest.client_id || "", email: guest.email || "", phone: guest.phone || "", document: guest.document || "", birth_date: guest.birth_date || "", notes: guest.notes || "" })) : [emptyGuest(true)],
    payments: reservation.payments.length ? reservation.payments.map((payment) => ({ local_id: payment.id, method: payment.method, status: payment.status, amount: String(payment.amount || 0), installments: String(payment.installments || 1), due_at: toDatetimeLocal(payment.due_at), paid_at: toDatetimeLocal(payment.paid_at), reference_code: payment.reference_code || "", pix_copy_paste: payment.pix_copy_paste || "", card_brand: payment.card_brand || "", card_last4: payment.card_last4 || "", receipt_url: payment.receipt_url || "", notes: payment.notes || "" })) : [emptyPayment()],
  };
}

const formatCurrency = (value: number) => `R$ ${value.toLocaleString("pt-BR")}`;
export default function AdminReservations() {
  const [reservations, setReservations] = useState<DbReservation[]>([]);
  const [properties, setProperties] = useState<DbProperty[]>([]);
  const [clients, setClients] = useState<DbClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<DbReservation | null>(null);
  const [editingReservation, setEditingReservation] = useState<DbReservation | null>(null);
  const [form, setForm] = useState<ReservationFormState>(emptyForm());
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [reservationsData, propsData, clientsData] = await Promise.all([api.getReservations(), api.getProperties(), api.getClients()]);
      setReservations(reservationsData);
      setProperties(propsData);
      setClients(clientsData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { if (properties.length && !form.propertyId) setForm((current) => ({ ...current, propertyId: properties[0].id })); }, [properties, form.propertyId]);

  const propertyNameById = useMemo(() => Object.fromEntries(properties.map((property) => [property.id, property.title])), [properties]);
  const clientById = useMemo(() => Object.fromEntries(clients.map((client) => [client.id, client])), [clients]);

  const filtered = useMemo(() => {
    let list = reservations;
    if (filterStatus !== "todos") list = list.filter((reservation) => reservation.status === filterStatus);
    const query = search.toLowerCase().trim();
    if (!query) return list;
    return list.filter((reservation) => `${reservation.guest_name} ${reservation.email} ${reservation.booking_code ?? ""} ${propertyNameById[reservation.property_id] ?? ""}`.toLowerCase().includes(query));
  }, [reservations, filterStatus, search, propertyNameById]);

  const metrics = useMemo(() => ({
    total: reservations.length,
    confirmed: reservations.filter((reservation) => reservation.status === "confirmada").length,
    pendingPreCheckin: reservations.filter((reservation) => reservation.pre_checkin_status === "pendente").length,
    overduePreCheckin: reservations.filter((reservation) => reservation.pre_checkin_status === "atrasado").length,
  }), [reservations]);

  const openCreate = () => {
    setEditingReservation(null);
    setForm(emptyForm(properties[0]?.id || ""));
    setDialogOpen(true);
  };

  const openEdit = (reservation: DbReservation) => {
    setEditingReservation(reservation);
    setForm(fromReservation(reservation));
    setDialogOpen(true);
  };

  const openDetail = (reservation: DbReservation) => {
    setSelectedReservation(reservation);
    setDetailDialogOpen(true);
  };

  const handleClientChange = (clientId: string) => {
    const client = clientById[clientId];
    setForm((current) => ({
      ...current,
      clientId,
      guestName: client?.full_name || current.guestName,
      email: client?.email || current.email,
      paymentMethod: (client?.preferred_payment_method || current.paymentMethod) as PaymentMethod | "",
      guests: current.guests.map((guest, index) => index === 0 ? { ...guest, client_id: clientId, full_name: client?.full_name || guest.full_name, email: client?.email || guest.email, phone: client?.phone || guest.phone, document: client?.document || guest.document, birth_date: client?.birth_date || guest.birth_date } : guest),
    }));
  };

  const updateGuest = (localId: string, field: keyof GuestForm, value: string | boolean) => {
    setForm((current) => ({ ...current, guests: current.guests.map((guest) => guest.local_id === localId ? { ...guest, [field]: value } : guest) }));
  };
  const updatePayment = (localId: string, field: keyof PaymentForm, value: string) => {
    setForm((current) => ({ ...current, payments: current.payments.map((payment) => payment.local_id === localId ? { ...payment, [field]: value } : payment) }));
  };
  const addGuest = () => setForm((current) => ({ ...current, guests: [...current.guests, emptyGuest(false)] }));
  const removeGuest = (localId: string) => setForm((current) => ({ ...current, guests: current.guests.length === 1 ? current.guests : current.guests.filter((guest) => guest.local_id !== localId) }));
  const addPayment = () => setForm((current) => ({ ...current, payments: [...current.payments, emptyPayment()] }));
  const removePayment = (localId: string) => setForm((current) => ({ ...current, payments: current.payments.length === 1 ? current.payments : current.payments.filter((payment) => payment.local_id !== localId) }));

  const buildPayload = () => ({
    property_id: form.propertyId,
    client_id: form.clientId || null,
    booking_code: form.bookingCode || null,
    guest_name: form.guestName,
    email: form.email,
    check_in: form.checkIn,
    check_out: form.checkOut,
    status: form.status,
    adults_count: Number(form.adultsCount || 1),
    children_count: Number(form.childrenCount || 0),
    infants_count: Number(form.infantsCount || 0),
    total: Number(form.total || 0),
    paid_amount: Number(form.paidAmount || 0),
    payment_method: form.paymentMethod || null,
    payment_status: form.paymentStatus,
    payment_due_date: form.paymentDueDate || null,
    payment_reference: form.paymentReference || null,
    payment_installments: Number(form.paymentInstallments || 1),
    payment_receipt_url: form.paymentReceiptUrl || null,
    payment_gateway: form.paymentGateway || null,
    payment_notes: form.paymentNotes || null,
    special_requests: form.specialRequests || null,
    notes: form.notes || null,
    pre_checkin_status: form.preCheckinStatus,
    pre_checkin_due_at: form.preCheckinDueAt ? form.preCheckinDueAt.replace("T", " ") + ":00" : null,
    pre_checkin_confirmed_at: form.preCheckinConfirmedAt ? form.preCheckinConfirmedAt.replace("T", " ") + ":00" : null,
    pre_checkin_notes: form.preCheckinNotes || null,
    guests: form.guests.map((guest) => ({ client_id: guest.client_id || null, full_name: guest.full_name, email: guest.email || null, phone: guest.phone || null, document: guest.document || null, birth_date: guest.birth_date || null, guest_type: guest.guest_type, is_primary: guest.is_primary, notes: guest.notes || null })),
    payments: form.payments.map((payment) => ({ method: payment.method, status: payment.status, amount: Number(payment.amount || 0), installments: Number(payment.installments || 1), due_at: payment.due_at ? payment.due_at.replace("T", " ") + ":00" : null, paid_at: payment.paid_at ? payment.paid_at.replace("T", " ") + ":00" : null, reference_code: payment.reference_code || null, pix_copy_paste: payment.pix_copy_paste || null, card_brand: payment.card_brand || null, card_last4: payment.card_last4 || null, receipt_url: payment.receipt_url || null, notes: payment.notes || null })),
  });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = buildPayload();
      if (editingReservation) {
        await api.updateReservation(editingReservation.id, payload);
        toast.success("Reserva atualizada com sucesso.");
      } else {
        await api.createReservation(payload);
        toast.success("Reserva criada com sucesso.");
      }
      setDialogOpen(false);
      await fetchAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar reserva.");
    } finally {
      setSaving(false);
    }
  };

  const quickUpdate = async (reservation: DbReservation, patch: Partial<DbReservation>) => {
    try {
      await api.updateReservation(reservation.id, patch);
      await fetchAll();
      toast.success("Reserva atualizada.");
      if (selectedReservation?.id === reservation.id) {
        const next = await api.getReservations();
        setSelectedReservation(next.find((item) => item.id === reservation.id) || null);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar reserva.");
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Reservas</h1>
          <p className="text-muted-foreground">Controle completo de reserva, hospedes, pagamentos e confirmacao de pre-check-in.</p>
        </div>
        <Button onClick={openCreate} className="gap-2 bg-gradient-ocean hover:opacity-90"><Plus className="h-4 w-4" /> Nova Reserva</Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <button onClick={() => setFilterStatus("todos")} className={`rounded-xl border p-4 text-left transition ${filterStatus === "todos" ? "border-primary bg-primary/5" : "border-slate-200"}`}><p className="text-sm text-muted-foreground">Total</p><p className="text-2xl font-bold text-foreground">{metrics.total}</p></button>
        <button onClick={() => setFilterStatus("confirmada")} className={`rounded-xl border p-4 text-left transition ${filterStatus === "confirmada" ? "border-emerald-400 bg-emerald-50" : "border-slate-200"}`}><p className="text-sm text-emerald-600">Confirmadas</p><p className="text-2xl font-bold text-emerald-700">{metrics.confirmed}</p></button>
        <div className="rounded-xl border border-slate-200 p-4"><p className="text-sm text-blue-600">Pre-check-in pendente</p><p className="text-2xl font-bold text-blue-700">{metrics.pendingPreCheckin}</p></div>
        <div className="rounded-xl border border-slate-200 p-4"><p className="text-sm text-rose-600">Pre-check-in atrasado</p><p className="text-2xl font-bold text-rose-700">{metrics.overduePreCheckin}</p></div>
      </div>

      <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Buscar por hospede, e-mail, codigo da reserva ou imovel..." value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" /></div>
      {filtered.length === 0 ? (
        <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center py-16 text-center"><CalendarDays className="mb-4 h-12 w-12 text-muted-foreground/30" /><h3 className="mb-1 text-lg font-semibold text-foreground">Nenhuma reserva encontrada</h3><p className="text-sm text-muted-foreground">Ajuste os filtros ou crie a primeira reserva completa.</p></CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((reservation) => (
            <Card key={reservation.id} className="cursor-pointer overflow-hidden border-slate-200 transition hover:shadow-md" onClick={() => openDetail(reservation)}>
              <CardContent className="p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2"><p className="text-base font-semibold text-foreground">{reservation.guest_name}</p><Badge variant="outline" className={statusBadge[reservation.status]}>{reservation.status}</Badge><Badge variant="outline" className={preCheckinBadge[reservation.pre_checkin_status]}>{reservation.pre_checkin_status}</Badge>{reservation.booking_code ? <Badge variant="outline">{reservation.booking_code}</Badge> : null}</div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {propertyNameById[reservation.property_id] ?? "-"}</span>
                      <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {reservation.email}</span>
                      <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {reservation.guests.length} hospedes</span>
                      <span className="flex items-center gap-1"><CalendarRange className="h-3.5 w-3.5" /> {reservation.check_in} ate {reservation.check_out}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2" onClick={(event) => event.stopPropagation()}>
                    <Button size="sm" variant="outline" onClick={() => openEdit(reservation)}><Pencil className="mr-2 h-4 w-4" /> Editar</Button>
                    {reservation.pre_checkin_status !== "confirmado" ? <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => quickUpdate(reservation, { pre_checkin_status: "confirmado", pre_checkin_confirmed_at: new Date().toISOString().slice(0, 19).replace("T", " ") })}><ShieldCheck className="mr-2 h-4 w-4" /> Confirmar pre-check-in</Button> : null}
                  </div>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  <div><p className="text-xs text-muted-foreground">Total</p><p className="font-semibold text-foreground">{formatCurrency(Number(reservation.total))}</p></div>
                  <div><p className="text-xs text-muted-foreground">Pago</p><p className="font-semibold text-foreground">{formatCurrency(Number(reservation.paid_amount))}</p></div>
                  <div><p className="text-xs text-muted-foreground">Pagamento</p><p className="font-semibold text-foreground">{reservation.payment_method ? paymentMethodLabel[reservation.payment_method] : "Nao definido"}</p></div>
                  <div><p className="text-xs text-muted-foreground">Parcelas</p><p className="font-semibold text-foreground">{reservation.payment_installments || 1}x</p></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Resumo da reserva</DialogTitle>
            <DialogDescription>{selectedReservation ? `${selectedReservation.guest_name} • ${selectedReservation.booking_code || "sem codigo"}` : "Sem reserva selecionada."}</DialogDescription>
          </DialogHeader>
          {selectedReservation ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Hospede principal</p><p className="font-semibold text-foreground">{selectedReservation.guest_name}</p><p className="text-xs text-muted-foreground">{selectedReservation.email}</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Periodo</p><p className="font-semibold text-foreground">{selectedReservation.check_in}</p><p className="text-xs text-muted-foreground">ate {selectedReservation.check_out}</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Pre-check-in</p><Badge variant="outline" className={preCheckinBadge[selectedReservation.pre_checkin_status]}>{selectedReservation.pre_checkin_status}</Badge><p className="mt-2 text-xs text-muted-foreground">Prazo: {selectedReservation.pre_checkin_due_at || "-"}</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Pagamento</p><p className="font-semibold text-foreground">{formatCurrency(Number(selectedReservation.paid_amount))} / {formatCurrency(Number(selectedReservation.total))}</p><p className="text-xs text-muted-foreground">{selectedReservation.payment_method ? paymentMethodLabel[selectedReservation.payment_method] : "Sem metodo"}</p></CardContent></Card>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card><CardContent className="space-y-2 p-4 text-sm"><p className="font-semibold text-foreground">Reserva</p><p><strong>Imovel:</strong> {propertyNameById[selectedReservation.property_id] ?? "-"}</p><p><strong>Cliente:</strong> {selectedReservation.client_id ? clientById[selectedReservation.client_id]?.full_name || selectedReservation.client_id : "Nao vinculado"}</p><p><strong>Hospedes:</strong> {selectedReservation.adults_count} adultos, {selectedReservation.children_count} criancas, {selectedReservation.infants_count} bebes</p><p><strong>Solicitacoes:</strong> {selectedReservation.special_requests || "Nenhuma"}</p><p><strong>Observacoes:</strong> {selectedReservation.notes || "Nenhuma"}</p></CardContent></Card>
                <Card><CardContent className="space-y-2 p-4 text-sm"><p className="font-semibold text-foreground">Pre-check-in</p><p><strong>Status:</strong> {selectedReservation.pre_checkin_status}</p><p><strong>Confirmado em:</strong> {selectedReservation.pre_checkin_confirmed_at || "Nao confirmado"}</p><p><strong>Prazo:</strong> {selectedReservation.pre_checkin_due_at || "Nao definido"}</p><p><strong>Notas:</strong> {selectedReservation.pre_checkin_notes || "Sem notas"}</p></CardContent></Card>
              </div>

              <Card><CardContent className="space-y-3 p-4"><div className="flex items-center justify-between"><p className="font-semibold text-foreground">Hospedes vinculados</p><Badge variant="outline">{selectedReservation.guests.length}</Badge></div>{selectedReservation.guests.map((guest) => <div key={guest.id} className="rounded-lg border p-3 text-sm"><div className="flex items-center gap-2"><p className="font-medium text-foreground">{guest.full_name}</p>{guest.is_primary ? <Badge variant="outline">Principal</Badge> : null}<Badge variant="outline">{guest.guest_type}</Badge></div><p className="text-muted-foreground">{[guest.email, guest.phone, guest.document].filter(Boolean).join(" • ") || "Sem contatos adicionais"}</p></div>)}</CardContent></Card>

              <Card><CardContent className="space-y-3 p-4"><div className="flex items-center justify-between"><p className="font-semibold text-foreground">Pagamentos</p><Badge variant="outline">{selectedReservation.payments.length}</Badge></div>{selectedReservation.payments.map((payment) => <div key={payment.id} className="rounded-lg border p-3 text-sm"><div className="flex items-center justify-between"><p className="font-medium text-foreground">{paymentMethodLabel[payment.method]}</p><Badge variant="outline">{paymentStatusLabel[payment.status]}</Badge></div><p className="text-muted-foreground">{formatCurrency(payment.amount)} • {payment.installments}x • ref. {payment.reference_code || "sem referencia"}</p>{payment.pix_copy_paste ? <p className="mt-1 break-all text-xs text-muted-foreground">Pix copia e cola: {payment.pix_copy_paste}</p> : null}</div>)}</CardContent></Card>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingReservation ? "Editar reserva" : "Nova reserva"}</DialogTitle>
            <DialogDescription>Configure dados da reserva, lista de hospedes, pagamento e confirmacao antes do check-in.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-1.5"><Label>Imovel</Label><select value={form.propertyId} onChange={(event) => setForm((current) => ({ ...current, propertyId: event.target.value }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" required>{properties.map((property) => <option key={property.id} value={property.id}>{property.title}</option>)}</select></div>
              <div className="space-y-1.5"><Label>Cliente</Label><select value={form.clientId} onChange={(event) => handleClientChange(event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">Sem vinculo</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.full_name}</option>)}</select></div>
              <div className="space-y-1.5"><Label>Codigo da reserva</Label><Input value={form.bookingCode} onChange={(event) => setForm((current) => ({ ...current, bookingCode: event.target.value }))} placeholder="PB-20260411-ABC123" /></div>
              <div className="space-y-1.5"><Label>Status</Label><select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as DbReservation["status"] }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="pendente">Pendente</option><option value="confirmada">Confirmada</option><option value="cancelada">Cancelada</option></select></div>
              <div className="space-y-1.5"><Label>Hospede principal</Label><Input value={form.guestName} onChange={(event) => setForm((current) => ({ ...current, guestName: event.target.value }))} required /></div>
              <div className="space-y-1.5"><Label>E-mail principal</Label><Input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required /></div>
              <div className="space-y-1.5"><Label>Check-in</Label><Input type="date" value={form.checkIn} onChange={(event) => setForm((current) => ({ ...current, checkIn: event.target.value }))} required /></div>
              <div className="space-y-1.5"><Label>Check-out</Label><Input type="date" value={form.checkOut} onChange={(event) => setForm((current) => ({ ...current, checkOut: event.target.value }))} required /></div>
              <div className="space-y-1.5"><Label>Adultos</Label><Input type="number" min={1} value={form.adultsCount} onChange={(event) => setForm((current) => ({ ...current, adultsCount: event.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Criancas</Label><Input type="number" min={0} value={form.childrenCount} onChange={(event) => setForm((current) => ({ ...current, childrenCount: event.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Bebes</Label><Input type="number" min={0} value={form.infantsCount} onChange={(event) => setForm((current) => ({ ...current, infantsCount: event.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Solicitacoes especiais</Label><Input value={form.specialRequests} onChange={(event) => setForm((current) => ({ ...current, specialRequests: event.target.value }))} /></div>
            </div>

            <div className="space-y-3 rounded-xl border p-4">
              <div className="flex items-center justify-between"><div><p className="font-semibold text-foreground">Hospedes vinculados</p><p className="text-xs text-muted-foreground">Cadastre todos os hospedes da reserva.</p></div><Button type="button" variant="outline" size="sm" onClick={addGuest}><Plus className="mr-2 h-4 w-4" /> Adicionar hospede</Button></div>
              <div className="space-y-3">{form.guests.map((guest) => <div key={guest.local_id} className="grid gap-3 rounded-lg border p-3 md:grid-cols-2 xl:grid-cols-4"><Input value={guest.full_name} onChange={(event) => updateGuest(guest.local_id, "full_name", event.target.value)} placeholder="Nome completo" /><Input value={guest.email} onChange={(event) => updateGuest(guest.local_id, "email", event.target.value)} placeholder="E-mail" /><Input value={guest.phone} onChange={(event) => updateGuest(guest.local_id, "phone", event.target.value)} placeholder="Telefone" /><Input value={guest.document} onChange={(event) => updateGuest(guest.local_id, "document", event.target.value)} placeholder="Documento" /><Input type="date" value={guest.birth_date} onChange={(event) => updateGuest(guest.local_id, "birth_date", event.target.value)} /><select value={guest.guest_type} onChange={(event) => updateGuest(guest.local_id, "guest_type", event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="adulto">Adulto</option><option value="crianca">Crianca</option><option value="bebe">Bebe</option></select><div className="flex items-center gap-2 text-sm"><input type="checkbox" checked={guest.is_primary} onChange={(event) => updateGuest(guest.local_id, "is_primary", event.target.checked)} /><span>Principal</span></div><Button type="button" variant="ghost" className="justify-start text-destructive" onClick={() => removeGuest(guest.local_id)}><Trash2 className="mr-2 h-4 w-4" /> Remover</Button></div>)}</div>
            </div>

            <div className="space-y-3 rounded-xl border p-4">
              <div className="flex items-center justify-between"><div><p className="font-semibold text-foreground">Pagamentos</p><p className="text-xs text-muted-foreground">Registre Pix, cartao de credito e demais cobrancas.</p></div><Button type="button" variant="outline" size="sm" onClick={addPayment}><Plus className="mr-2 h-4 w-4" /> Adicionar pagamento</Button></div>
              <div className="space-y-3">{form.payments.map((payment) => <div key={payment.local_id} className="grid gap-3 rounded-lg border p-3 md:grid-cols-2 xl:grid-cols-4"><select value={payment.method} onChange={(event) => updatePayment(payment.local_id, "method", event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{Object.entries(paymentMethodLabel).map(([method, label]) => <option key={method} value={method}>{label}</option>)}</select><select value={payment.status} onChange={(event) => updatePayment(payment.local_id, "status", event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{Object.entries(paymentStatusLabel).map(([status, label]) => <option key={status} value={status}>{label}</option>)}</select><Input type="number" min={0} value={payment.amount} onChange={(event) => updatePayment(payment.local_id, "amount", event.target.value)} placeholder="Valor" /><Input type="number" min={1} value={payment.installments} onChange={(event) => updatePayment(payment.local_id, "installments", event.target.value)} placeholder="Parcelas" /><Input type="datetime-local" value={payment.due_at} onChange={(event) => updatePayment(payment.local_id, "due_at", event.target.value)} /><Input type="datetime-local" value={payment.paid_at} onChange={(event) => updatePayment(payment.local_id, "paid_at", event.target.value)} /><Input value={payment.reference_code} onChange={(event) => updatePayment(payment.local_id, "reference_code", event.target.value)} placeholder="Referencia / NSU" /><Input value={payment.card_brand} onChange={(event) => updatePayment(payment.local_id, "card_brand", event.target.value)} placeholder="Bandeira do cartao" /><Input value={payment.card_last4} onChange={(event) => updatePayment(payment.local_id, "card_last4", event.target.value)} placeholder="Ultimos 4 digitos" /><Input value={payment.pix_copy_paste} onChange={(event) => updatePayment(payment.local_id, "pix_copy_paste", event.target.value)} placeholder="Pix copia e cola" /><Input value={payment.receipt_url} onChange={(event) => updatePayment(payment.local_id, "receipt_url", event.target.value)} placeholder="URL do comprovante" className="xl:col-span-2" /><div className="xl:col-span-2 flex gap-2"><Textarea rows={2} value={payment.notes} onChange={(event) => updatePayment(payment.local_id, "notes", event.target.value)} placeholder="Observacoes do pagamento" className="flex-1" /><Button type="button" variant="ghost" className="self-start text-destructive" onClick={() => removePayment(payment.local_id)}><Trash2 className="mr-2 h-4 w-4" /> Remover</Button></div></div>)}</div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 rounded-xl border p-4">
              <div className="space-y-1.5"><Label>Total da reserva</Label><Input type="number" min={0} value={form.total} onChange={(event) => setForm((current) => ({ ...current, total: event.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Valor pago</Label><Input type="number" min={0} value={form.paidAmount} onChange={(event) => setForm((current) => ({ ...current, paidAmount: event.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Metodo principal</Label><select value={form.paymentMethod} onChange={(event) => setForm((current) => ({ ...current, paymentMethod: event.target.value as PaymentMethod | "" }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">Nao definido</option>{Object.entries(paymentMethodLabel).map(([method, label]) => <option key={method} value={method}>{label}</option>)}</select></div>
              <div className="space-y-1.5"><Label>Status pagamento</Label><select value={form.paymentStatus} onChange={(event) => setForm((current) => ({ ...current, paymentStatus: event.target.value as PaymentStatus }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{Object.entries(paymentStatusLabel).map(([status, label]) => <option key={status} value={status}>{label}</option>)}</select></div>
              <div className="space-y-1.5"><Label>Vencimento</Label><Input type="date" value={form.paymentDueDate} onChange={(event) => setForm((current) => ({ ...current, paymentDueDate: event.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Referencia</Label><Input value={form.paymentReference} onChange={(event) => setForm((current) => ({ ...current, paymentReference: event.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Parcelas</Label><Input type="number" min={1} value={form.paymentInstallments} onChange={(event) => setForm((current) => ({ ...current, paymentInstallments: event.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Gateway</Label><Input value={form.paymentGateway} onChange={(event) => setForm((current) => ({ ...current, paymentGateway: event.target.value }))} /></div>
              <div className="space-y-1.5 md:col-span-2 xl:col-span-4"><Label>Observacoes de pagamento</Label><Textarea rows={3} value={form.paymentNotes} onChange={(event) => setForm((current) => ({ ...current, paymentNotes: event.target.value }))} /></div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 rounded-xl border p-4">
              <div className="space-y-1.5"><Label>Status pre-check-in</Label><select value={form.preCheckinStatus} onChange={(event) => setForm((current) => ({ ...current, preCheckinStatus: event.target.value as PreCheckinStatus }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="pendente">Pendente</option><option value="confirmado">Confirmado</option><option value="atrasado">Atrasado</option><option value="dispensado">Dispensado</option></select></div>
              <div className="space-y-1.5"><Label>Prazo pre-check-in</Label><Input type="datetime-local" value={form.preCheckinDueAt} onChange={(event) => setForm((current) => ({ ...current, preCheckinDueAt: event.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Confirmado em</Label><Input type="datetime-local" value={form.preCheckinConfirmedAt} onChange={(event) => setForm((current) => ({ ...current, preCheckinConfirmedAt: event.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Comprovante principal</Label><Input value={form.paymentReceiptUrl} onChange={(event) => setForm((current) => ({ ...current, paymentReceiptUrl: event.target.value }))} /></div>
              <div className="space-y-1.5 md:col-span-2 xl:col-span-4"><Label>Notas do pre-check-in</Label><Textarea rows={3} value={form.preCheckinNotes} onChange={(event) => setForm((current) => ({ ...current, preCheckinNotes: event.target.value }))} /></div>
              <div className="space-y-1.5 md:col-span-2 xl:col-span-4"><Label>Observacoes gerais</Label><Textarea rows={3} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} /></div>
            </div>

            <div className="flex justify-end gap-2"><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="submit" disabled={saving} className="gap-2 bg-gradient-ocean hover:opacity-90">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{editingReservation ? "Salvar alteracoes" : "Criar reserva"}</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
