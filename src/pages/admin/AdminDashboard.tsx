import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api, type DbPhoto, type DbProperty, type DbReservation } from "@/lib/api";
import {
  ArrowDownRight,
  ArrowUpRight,
  Bed,
  CalendarCheck,
  CalendarDays,
  Camera,
  Home,
  Loader2,
  TrendingUp,
  Users,
} from "lucide-react";

const formatPrice = (price: number, label?: string | null) =>
  `R$ ${price.toLocaleString("pt-BR")}${label || ""}`;

const statusColor: Record<string, string> = {
  confirmada: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pendente: "bg-amber-50 text-amber-700 border-amber-200",
  cancelada: "bg-rose-50 text-rose-700 border-rose-200",
};

export default function AdminDashboard() {
  const [properties, setProperties] = useState<DbProperty[]>([]);
  const [photos, setPhotos] = useState<DbPhoto[]>([]);
  const [reservations, setReservations] = useState<DbReservation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [propsData, photosData, reservationsData] = await Promise.all([
        api.getProperties(),
        api.getPhotos(),
        api.getReservations(),
      ]);
      setProperties(propsData);
      setPhotos(photosData);
      setReservations(reservationsData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const metrics = useMemo(() => {
    const confirmed = reservations.filter((r) => r.status === "confirmada");
    const pending = reservations.filter((r) => r.status === "pendente");
    return {
      totalProperties: properties.length,
      totalPhotos: photos.length,
      confirmedBookings: confirmed.length,
      pendingBookings: pending.length,
      revenue: confirmed.reduce((sum, r) => sum + Number(r.total), 0),
      featuredProperties: properties.filter((p) => p.featured).length,
      totalGuests: new Set(reservations.map((r) => r.email)).size,
      occupancy: properties.length
        ? Math.round((properties.filter((p) => p.status === "alugado").length / properties.length) * 100)
        : 0,
    };
  }, [properties, photos, reservations]);

  const propertyNameById = useMemo(
    () => Object.fromEntries(properties.map((p) => [p.id, p.title])),
    [properties]
  );

  const recentReservations = useMemo(
    () => [...reservations].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5),
    [reservations]
  );

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
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do seu marketplace de hospedagens.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="group relative overflow-hidden border-slate-200">
          <div className="absolute right-0 top-0 h-24 w-24 -translate-y-4 translate-x-4 rounded-full bg-primary/5 transition-transform group-hover:scale-125" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-sm font-medium">Imóveis Cadastrados</CardDescription>
            <Home className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{metrics.totalProperties}</div>
            <p className="mt-1 flex items-center text-xs text-muted-foreground">
              <span className="text-primary font-medium">{metrics.featuredProperties}</span>
              <span className="ml-1">em destaque</span>
            </p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-slate-200">
          <div className="absolute right-0 top-0 h-24 w-24 -translate-y-4 translate-x-4 rounded-full bg-emerald-500/5 transition-transform group-hover:scale-125" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-sm font-medium">Reservas Confirmadas</CardDescription>
            <CalendarCheck className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{metrics.confirmedBookings}</div>
            <p className="mt-1 flex items-center text-xs">
              <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 text-[10px] px-1.5 py-0">
                {metrics.pendingBookings} pendentes
              </Badge>
            </p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-slate-200">
          <div className="absolute right-0 top-0 h-24 w-24 -translate-y-4 translate-x-4 rounded-full bg-blue-500/5 transition-transform group-hover:scale-125" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-sm font-medium">Receita Total</CardDescription>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{formatPrice(metrics.revenue)}</div>
            <p className="mt-1 flex items-center text-xs text-emerald-600">
              <ArrowUpRight className="mr-0.5 h-3 w-3" />
              reservas confirmadas
            </p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-slate-200">
          <div className="absolute right-0 top-0 h-24 w-24 -translate-y-4 translate-x-4 rounded-full bg-violet-500/5 transition-transform group-hover:scale-125" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-sm font-medium">Taxa de Ocupação</CardDescription>
            <Bed className="h-4 w-4 text-violet-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{metrics.occupancy}%</div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400 transition-all duration-500"
                style={{ width: `${metrics.occupancy}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom grid */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Recent reservations */}
        <Card className="border-slate-200 lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Reservas Recentes</CardTitle>
                <CardDescription>Últimas 5 reservas registradas.</CardDescription>
              </div>
              <CalendarDays className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {recentReservations.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma reserva encontrada.</p>
            ) : (
              <div className="space-y-3">
                {recentReservations.map((r) => (
                  <div key={r.id} className="flex items-center gap-4 rounded-lg border border-slate-100 bg-slate-50/50 p-3 transition hover:border-primary/30">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {r.guest_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{r.guest_name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {propertyNameById[r.property_id] ?? "—"} • {r.check_in} → {r.check_out}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-sm font-semibold text-foreground">{formatPrice(Number(r.total))}</span>
                      <Badge variant="outline" className={`text-[10px] ${statusColor[r.status] ?? ""}`}>
                        {r.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick stats */}
        <Card className="border-slate-200 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Resumo Rápido</CardTitle>
            <CardDescription>Métricas gerais do sistema.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Camera className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm text-foreground">Fotos no Sistema</span>
              </div>
              <span className="text-lg font-bold text-foreground">{metrics.totalPhotos}</span>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10">
                  <Users className="h-4 w-4 text-violet-600" />
                </div>
                <span className="text-sm text-foreground">Hóspedes Únicos</span>
              </div>
              <span className="text-lg font-bold text-foreground">{metrics.totalGuests}</span>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                </div>
                <span className="text-sm text-foreground">Taxa de Aprovação</span>
              </div>
              <span className="text-lg font-bold text-foreground">
                {reservations.length ? Math.round((metrics.confirmedBookings / reservations.length) * 100) : 0}%
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
                  <Home className="h-4 w-4 text-amber-600" />
                </div>
                <span className="text-sm text-foreground">Imóveis Disponíveis</span>
              </div>
              <span className="text-lg font-bold text-foreground">
                {properties.filter((p) => p.status === "disponivel").length}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
