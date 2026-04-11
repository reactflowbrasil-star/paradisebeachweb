import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  BarChart3,
  Bed,
  CalendarDays,
  Camera,
  ChevronLeft,
  Home,
  Loader2,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Waves,
} from "lucide-react";
import { toast } from "sonner";

const NAV_ITEMS = [
  { to: "/admin", icon: BarChart3, label: "Dashboard", end: true },
  { to: "/admin/propriedades", icon: Home, label: "Propriedades" },
  { to: "/admin/fotos", icon: Camera, label: "Galeria de Fotos" },
  { to: "/admin/reservas", icon: CalendarDays, label: "Reservas" },
  { to: "/admin/config", icon: Settings, label: "Configurações" },
] as const;

function SidebarNav({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1 px-2">
      {NAV_ITEMS.map(({ to, icon: Icon, label, ...rest }) => (
        <NavLink
          key={to}
          to={to}
          end={"end" in rest ? rest.end : false}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            } ${collapsed ? "justify-center px-2" : ""}`
          }
        >
          <Icon className="h-4.5 w-4.5 shrink-0" />
          {!collapsed && <span>{label}</span>}
        </NavLink>
      ))}
    </nav>
  );
}

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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-ocean/10 blur-3xl" />
      </div>
      <Card className="relative w-full max-w-md border-white/10 bg-white/5 backdrop-blur-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-ocean shadow-lg">
            <Waves className="h-7 w-7 text-white" />
          </div>
          <CardTitle className="text-2xl text-white">Paradise Beach</CardTitle>
          <p className="text-sm text-white/60">Painel Administrativo</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="login-email" className="text-white/80">E-mail</Label>
              <Input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-primary"
                placeholder="admin@paradisebeach.com.br"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="login-password" className="text-white/80">Senha</Label>
              <Input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-primary"
              />
            </div>
            <Button type="submit" className="w-full bg-gradient-ocean hover:opacity-90" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminLayout() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin");
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-slate-200 bg-white transition-all duration-300 lg:flex ${
          collapsed ? "w-[68px]" : "w-[260px]"
        }`}
      >
        {/* Sidebar header */}
        <div className={`flex h-16 items-center border-b border-slate-100 ${collapsed ? "justify-center px-2" : "gap-3 px-4"}`}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-ocean">
            <Waves className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="truncate text-sm font-bold text-foreground">Paradise Beach</p>
              <p className="truncate text-xs text-muted-foreground">Painel Admin</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <ScrollArea className="flex-1 py-4">
          <SidebarNav collapsed={collapsed} />
        </ScrollArea>

        {/* Sidebar footer */}
        <div className="border-t border-slate-100 p-3">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <><PanelLeftClose className="h-4 w-4" /><span>Recolher</span></>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className={`flex flex-1 flex-col transition-all duration-300 ${collapsed ? "lg:ml-[68px]" : "lg:ml-[260px]"}`}>
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur-lg lg:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0">
                <div className="flex h-16 items-center gap-3 border-b px-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-ocean">
                    <Waves className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Paradise Beach</p>
                    <p className="text-xs text-muted-foreground">Painel Admin</p>
                  </div>
                </div>
                <ScrollArea className="flex-1 py-4">
                  <SidebarNav collapsed={false} onNavigate={() => setMobileOpen(false)} />
                </ScrollArea>
              </SheetContent>
            </Sheet>

            <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground transition hover:text-primary">
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Voltar ao site</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">{user.email}</span>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2 text-muted-foreground hover:text-destructive">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
