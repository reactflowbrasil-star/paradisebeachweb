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
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api, type DbProperty, type DbReservation } from "@/lib/api";
import {
  CalendarCheck,
  CalendarDays,
  CalendarX,
  Clock,
  Loader2,
  Mail,
  MapPin,
  Plus,
  Search,
  User,
} from "lucide-react";
import { toast } from "sonner";

const formatPrice = (price: number) => `R$ ${price.toLocaleString("pt-BR")}`;

const statusConfig: Record<string, { color: string; icon: typeof CalendarCheck; label: string }> = {
  confirmada: { color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CalendarCheck, label: "Confirmada" },
  pendente: { color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock, label: "Pendente" },
  cancelada: { color: "bg-rose-50 text-rose-700 border-rose-200", icon: CalendarX, label: "Cancelada" },
};

const emptyForm = {
  propertyId: "",
  guestName: "",
  email: "",
  checkIn: new Date().toISOString().split("T")[0],
  checkOut: new Date().toISOString().split("T")[0],
  total: "",
  notes: "",
};

export default function AdminReservations() {
  const [reservations, setReservations] = useState<DbReservation[]>([]);
  const [properties, setProperties] = useState<DbProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<DbReservation | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [reservationsData, propsData] = await Promise.all([
        api.getReservations(),
        api.getProperties(),
      ]);
      setReservations(reservationsData);
      setProperties(propsData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (properties.length > 0 && !form.propertyId) {
      setForm((prev) => ({ ...prev, propertyId: properties[0].id }));
    }
  }, [properties, form.propertyId]);

  const propertyNameById = useMemo(
    () => Object.fromEntries(properties.map((p) => [p.id, p.title])),
    [properties]
  );

  const filtered = useMemo(() => {
    let list = reservations;
    if (filterStatus !== "todos") {
      list = list.filter((r) => r.status === filterStatus);
    }
    const q = search.toLowerCase().trim();
    if (q) {
      list = list.filter((r) =>
        `${r.guest_name} ${r.email} ${propertyNameById[r.property_id] ?? ""}`.toLowerCase().includes(q)
      );
    }
    return list;
  }, [reservations, filterStatus, search, propertyNameById]);

  const metrics = useMemo(() => ({
    total: reservations.length,
    confirmed: reservations.filter((r) => r.status === "confirmada").length,
    pending: reservations.filter((r) => r.status === "pendente").length,
    cancelled: reservations.filter((r) => r.status === "cancelada").length,
  }), [reservations]);

  const openCreate = () => {
    setForm({ ...emptyForm, propertyId: properties[0]?.id ?? "" });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createReservation({
        property_id: form.propertyId,
        guest_name: form.guestName,
        email: form.email,
        check_in: form.checkIn,
        check_out: form.checkOut,
        total: Number(form.total),
        notes: form.notes || null,
      });
      toast.success("Reserva criada com sucesso!");
      setDialogOpen(false);
      fetchAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao criar reserva.");
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (id: string, status: DbReservation["status"]) => {
    try {
      await api.updateReservation(id, { status });
      toast.success(`Status alterado para "${status}".`);
      fetchAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar.");
    }
  };

  const openDetail = (r: DbReservation) => {
    setSelectedReservation(r);
    setDetailDialogOpen(true);
  };

  const daysDiff = (checkIn: string, checkOut: string) => {
    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    return Math.max(1, Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
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
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Reservas</h1>
          <p className="text-muted-foreground">Gerencie check-ins, check-outs e status de todas as reservas.</p>
        </div>
        <Button onClick={openCreate} className="gap-2 bg-gradient-ocean hover:opacity-90 shrink-0">
          <Plus className="h-4 w-4" />
          Nova Reserva
        </Button>
      </div>

      {/* Status stats */}
      <div className="grid gap-3 sm:grid-cols-4">
        <button
          onClick={() => setFilterStatus("todos")}
          className={`rounded-xl border p-4 text-left transition hover:shadow-sm ${filterStatus === "todos" ? "border-primary bg-primary/5" : "border-slate-200"}`}
        >
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold text-foreground">{metrics.total}</p>
        </button>
        <button
          onClick={() => setFilterStatus("confirmada")}
          className={`rounded-xl border p-4 text-left transition hover:shadow-sm ${filterStatus === "confirmada" ? "border-emerald-400 bg-emerald-50" : "border-slate-200"}`}
        >
          <p className="text-sm text-emerald-600">Confirmadas</p>
          <p className="text-2xl font-bold text-emerald-700">{metrics.confirmed}</p>
        </button>
        <button
          onClick={() => setFilterStatus("pendente")}
          className={`rounded-xl border p-4 text-left transition hover:shadow-sm ${filterStatus === "pendente" ? "border-amber-400 bg-amber-50" : "border-slate-200"}`}
        >
          <p className="text-sm text-amber-600">Pendentes</p>
          <p className="text-2xl font-bold text-amber-700">{metrics.pending}</p>
        </button>
        <button
          onClick={() => setFilterStatus("cancelada")}
          className={`rounded-xl border p-4 text-left transition hover:shadow-sm ${filterStatus === "cancelada" ? "border-rose-400 bg-rose-50" : "border-slate-200"}`}
        >
          <p className="text-sm text-rose-600">Canceladas</p>
          <p className="text-2xl font-bold text-rose-700">{metrics.cancelled}</p>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por hóspede, e-mail ou imóvel..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Reservation list */}
      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <CalendarDays className="mb-4 h-12 w-12 text-muted-foreground/30" />
            <h3 className="mb-1 text-lg font-semibold text-foreground">Nenhuma reserva encontrada</h3>
            <p className="text-sm text-muted-foreground">
              {search || filterStatus !== "todos"
                ? "Tente alterar os filtros."
                : "Crie sua primeira reserva para ver aqui."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((r) => {
            const config = statusConfig[r.status] ?? statusConfig.pendente;
            const StatusIcon = config.icon;
            const nights = daysDiff(r.check_in, r.check_out);

            return (
              <Card
                key={r.id}
                className="overflow-hidden border-slate-200 transition hover:shadow-md cursor-pointer"
                onClick={() => openDetail(r)}
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Left status bar */}
                  <div
                    className={`flex shrink-0 items-center justify-center p-4 sm:w-16 ${
                      r.status === "confirmada" ? "bg-emerald-50" : r.status === "pendente" ? "bg-amber-50" : "bg-rose-50"
                    }`}
                  >
                    <StatusIcon
                      className={`h-6 w-6 ${
                        r.status === "confirmada" ? "text-emerald-600" : r.status === "pendente" ? "text-amber-600" : "text-rose-600"
                      }`}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-foreground">{r.guest_name}</h3>
                        <Badge variant="outline" className={`text-[10px] ${config.color}`}>
                          {config.label}
                        </Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {propertyNameById[r.property_id] ?? "—"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5" />
                          {r.email}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {r.check_in} → {r.check_out}
                        </span>
                        <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full">{nights} {nights === 1 ? "diária" : "diárias"}</span>
                      </div>
                    </div>

                    {/* Price + actions */}
                    <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                      <p className="text-lg font-bold text-foreground">{formatPrice(Number(r.total))}</p>
                      <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <select
                          className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                          value={r.status}
                          onChange={(e) => changeStatus(r.id, e.target.value as DbReservation["status"])}
                        >
                          <option value="pendente">Pendente</option>
                          <option value="confirmada">Confirmada</option>
                          <option value="cancelada">Cancelada</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              Detalhes da Reserva
            </DialogTitle>
            <DialogDescription>Informações completas da reserva.</DialogDescription>
          </DialogHeader>
          {selectedReservation && (() => {
            const r = selectedReservation;
            const config = statusConfig[r.status] ?? statusConfig.pendente;
            const nights = daysDiff(r.check_in, r.check_out);
            return (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {r.guest_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{r.guest_name}</p>
                        <p className="text-xs text-muted-foreground">{r.email}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={config.color}>{config.label}</Badge>
                  </div>
                </div>

                <div className="grid gap-3 text-sm">
                  <div className="flex justify-between rounded-lg border p-3">
                    <span className="text-muted-foreground">Imóvel</span>
                    <span className="font-medium text-foreground">{propertyNameById[r.property_id] ?? "—"}</span>
                  </div>
                  <div className="flex justify-between rounded-lg border p-3">
                    <span className="text-muted-foreground">Check-in</span>
                    <span className="font-medium text-foreground">{r.check_in}</span>
                  </div>
                  <div className="flex justify-between rounded-lg border p-3">
                    <span className="text-muted-foreground">Check-out</span>
                    <span className="font-medium text-foreground">{r.check_out}</span>
                  </div>
                  <div className="flex justify-between rounded-lg border p-3">
                    <span className="text-muted-foreground">Diárias</span>
                    <span className="font-medium text-foreground">{nights}</span>
                  </div>
                  <div className="flex justify-between rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <span className="text-muted-foreground">Valor Total</span>
                    <span className="text-lg font-bold text-primary">{formatPrice(Number(r.total))}</span>
                  </div>
                  {r.notes && (
                    <div className="rounded-lg border p-3">
                      <span className="text-xs text-muted-foreground">Observações</span>
                      <p className="mt-1 text-foreground">{r.notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  {r.status !== "confirmada" && (
                    <Button
                      size="sm"
                      className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => { changeStatus(r.id, "confirmada"); setDetailDialogOpen(false); }}
                    >
                      <CalendarCheck className="h-4 w-4" /> Confirmar
                    </Button>
                  )}
                  {r.status !== "cancelada" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-1.5 text-rose-600 border-rose-200 hover:bg-rose-50"
                      onClick={() => { changeStatus(r.id, "cancelada"); setDetailDialogOpen(false); }}
                    >
                      <CalendarX className="h-4 w-4" /> Cancelar
                    </Button>
                  )}
                  {r.status !== "pendente" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-1.5"
                      onClick={() => { changeStatus(r.id, "pendente"); setDetailDialogOpen(false); }}
                    >
                      <Clock className="h-4 w-4" /> Pendente
                    </Button>
                  )}
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Reserva</DialogTitle>
            <DialogDescription>Crie uma reserva manual para um hóspede.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="res-property">Imóvel</Label>
              <select
                id="res-property"
                value={form.propertyId}
                onChange={(e) => setForm((f) => ({ ...f, propertyId: e.target.value }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.title} — {p.city}/{p.state}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="res-guest">Nome do Hóspede</Label>
                <Input id="res-guest" value={form.guestName} onChange={(e) => setForm((f) => ({ ...f, guestName: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="res-email">E-mail</Label>
                <Input id="res-email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="res-checkin">Check-in</Label>
                <Input id="res-checkin" type="date" value={form.checkIn} onChange={(e) => setForm((f) => ({ ...f, checkIn: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="res-checkout">Check-out</Label>
                <Input id="res-checkout" type="date" value={form.checkOut} onChange={(e) => setForm((f) => ({ ...f, checkOut: e.target.value }))} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="res-total">Valor Total (R$)</Label>
              <Input id="res-total" type="number" min={0} value={form.total} onChange={(e) => setForm((f) => ({ ...f, total: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="res-notes">Observações</Label>
              <Textarea id="res-notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={3} placeholder="Observações opcionais sobre a reserva..." />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={saving} className="gap-2 bg-gradient-ocean hover:opacity-90">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Criar Reserva
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
