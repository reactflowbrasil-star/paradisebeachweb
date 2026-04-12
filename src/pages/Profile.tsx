import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api, type DbReservation, getImageUrl } from "@/lib/api";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  User, 
  Settings, 
  CalendarDays, 
  LogOut, 
  ChevronRight, 
  MapPin, 
  Clock, 
  CreditCard,
  History,
  ShieldCheck,
  Plus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatPrice } from "@/hooks/useProperties";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

type Tab = "reservas" | "dados" | "seguranca";

export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("reservas");
  const [reservations, setReservations] = useState<DbReservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchReservations = async () => {
      try {
        // Search by email first since we might not have a client_id link yet
        const data = await api.getReservations();
        const userReservations = data.filter(r => r.email === user.email);
        setReservations(userReservations);
      } catch (error) {
        console.error("Erro ao buscar reservas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, [user, navigate]);

  const handleLogout = async () => {
    await signOut();
    toast.success("Sessão encerrada com sucesso.");
    navigate("/");
  };

  if (!user) return null;

  return (
    <div className="section-padding min-h-screen bg-sand/20 pt-32 pb-16">
      <div className="mobile-shell mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-card rounded-2xl p-6 shadow-luxury sticky top-28"
            >
              <div className="flex flex-col items-center text-center mb-8">
                <div className="h-20 w-20 rounded-full bg-gradient-ocean flex items-center justify-center text-white text-3xl font-serif mb-4 shadow-lg">
                  {user.name.charAt(0)}
                </div>
                <h2 className="text-xl font-serif font-bold text-foreground truncate w-full">{user.name}</h2>
                <p className="text-sm text-muted-foreground truncate w-full">{user.email}</p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold uppercase tracking-wider">
                  <ShieldCheck size={12} /> Cliente VIP
                </div>
              </div>

              <div className="space-y-1">
                <button 
                  onClick={() => setActiveTab("reservas")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === "reservas" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-muted"}`}
                >
                  <CalendarDays size={18} />
                  <span>Minhas Reservas</span>
                  <ChevronRight size={14} className={`ml-auto opacity-50 ${activeTab === "reservas" ? "rotate-90" : ""}`} />
                </button>
                <button 
                  onClick={() => setActiveTab("dados")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === "dados" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-muted"}`}
                >
                  <User size={18} />
                  <span>Meus Dados</span>
                  <ChevronRight size={14} className={`ml-auto opacity-50 ${activeTab === "dados" ? "rotate-90" : ""}`} />
                </button>
                <button 
                  onClick={() => setActiveTab("seguranca")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === "seguranca" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-muted"}`}
                >
                  <Settings size={18} />
                  <span>Segurança</span>
                  <ChevronRight size={14} className={`ml-auto opacity-50 ${activeTab === "seguranca" ? "rotate-90" : ""}`} />
                </button>
              </div>

              <div className="mt-8 pt-6 border-t border-border">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/5 transition-all"
                >
                  <LogOut size={18} />
                  <span>Sair da Conta</span>
                </button>
              </div>
            </motion.div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {activeTab === "reservas" && (
                <motion.div
                  key="reservas"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h1 className="font-serif text-3xl font-bold text-foreground">Minhas Reservas</h1>
                    <Button variant="outline" className="rounded-full gap-2 text-xs" onClick={() => navigate("/aluguel")}>
                      <Plus size={14} /> Nova Reserva
                    </Button>
                  </div>

                  {loading ? (
                    <div className="bg-card rounded-2xl p-12 text-center shadow-luxury">
                      <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Carregando suas estadias...</p>
                    </div>
                  ) : reservations.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                      {reservations.map((res) => (
                        <div key={res.id} className="bg-card rounded-2xl overflow-hidden shadow-luxury border border-border group">
                          <div className="flex flex-col md:flex-row">
                            <div className="md:w-48 h-32 md:h-auto bg-muted">
                              {/* Ideally we'd fetch property image here, for now it's placeholder */}
                              <div className="w-full h-full flex items-center justify-center bg-gradient-ocean text-white/20">
                                <History size={48} />
                              </div>
                            </div>
                            <div className="flex-1 p-5 flex flex-col justify-between">
                              <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">{res.booking_code}</p>
                                  <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">Reserva em Paradise Beach</h3>
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                                    <MapPin size={12} />
                                    <span>Paraíso Tropical, João Pessoa - PB</span>
                                  </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  res.status === 'confirmada' ? 'bg-green-100 text-green-700' : 
                                  res.status === 'pendente' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                }`}>
                                  {res.status}
                                </span>
                              </div>
                              
                              <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 pt-4 border-t border-border">
                                <div className="flex items-center gap-2 text-xs">
                                  <Clock size={14} className="text-muted-foreground" />
                                  <span className="text-muted-foreground">Check-in:</span>
                                  <span className="font-bold">{format(new Date(res.check_in), "dd MMM, yyyy", { locale: ptBR })}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                  <Clock size={14} className="text-muted-foreground" />
                                  <span className="text-muted-foreground">Check-out:</span>
                                  <span className="font-bold">{format(new Date(res.check_out), "dd MMM, yyyy", { locale: ptBR })}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs ml-auto">
                                  <CreditCard size={14} className="text-muted-foreground" />
                                  <span className="font-bold text-primary text-sm">{formatPrice(res.total)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-card rounded-2xl p-16 text-center shadow-luxury border border-dashed border-border">
                      <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6 text-muted-foreground">
                        <CalendarDays size={32} />
                      </div>
                      <h3 className="text-xl font-serif font-bold text-foreground mb-2">Nenhuma reserva encontrada</h3>
                      <p className="text-muted-foreground max-w-xs mx-auto mb-8">Parece que você ainda não realizou nenhuma reserva conosco. Vamos planejar sua próxima viagem?</p>
                      <Button className="rounded-full px-8 h-12 bg-gradient-gold text-gold-foreground font-bold shadow-gold" onClick={() => navigate("/aluguel")}>
                        Explorar Imóveis
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "dados" && (
                <motion.div
                  key="dados"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-card rounded-2xl p-8 shadow-luxury"
                >
                  <h1 className="font-serif text-3xl font-bold text-foreground mb-8">Meus Dados Pessoais</h1>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Nome Completo</label>
                      <div className="w-full p-4 rounded-xl bg-muted/30 border border-border text-foreground font-medium">
                        {user.name}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">E-mail</label>
                      <div className="w-full p-4 rounded-xl bg-muted/30 border border-border text-foreground font-medium">
                        {user.email}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Telefone</label>
                      <div className="w-full p-4 rounded-xl border border-border text-foreground/50 italic">
                        Não informado
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">CPF / Documento</label>
                      <div className="w-full p-4 rounded-xl border border-border text-foreground/50 italic">
                        Não informado
                      </div>
                    </div>
                  </div>

                  <div className="mt-12 bg-primary/5 rounded-2xl p-6 border border-primary/10 flex items-start gap-4">
                    <History size={24} className="text-primary mt-1" />
                    <div>
                      <h4 className="font-bold text-foreground">Complete seu perfil</h4>
                      <p className="text-sm text-muted-foreground mt-1">Ao completar seus dados, o processo de reserva se torna muito mais rápido e seguro.</p>
                      <Button variant="link" className="text-primary font-bold p-0 h-auto mt-2">Atualizar dados agora</Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "seguranca" && (
                <motion.div
                  key="seguranca"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-card rounded-2xl p-8 shadow-luxury"
                >
                  <h1 className="font-serif text-3xl font-bold text-foreground mb-8">Segurança da Conta</h1>
                  
                  <div className="space-y-6 max-w-md">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Senha Atual</label>
                      <input type="password" placeholder="••••••••" className="w-full p-4 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Nova Senha</label>
                      <input type="password" placeholder="Mínimo 8 caracteres" className="w-full p-4 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Confirmar Nova Senha</label>
                      <input type="password" placeholder="••••••••" className="w-full p-4 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono" />
                    </div>
                    
                    <Button className="rounded-full px-8 h-12 bg-primary font-bold shadow-lg">Salvar Nova Senha</Button>
                  </div>

                  <div className="mt-12 pt-8 border-t border-border">
                    <h3 className="text-lg font-serif font-bold text-foreground mb-4">Gerenciamento de Dados</h3>
                    <p className="text-sm text-muted-foreground mb-4">Respeitamos sua privacidade e a LGPD. Você pode solicitar uma cópia dos seus dados ou a exclusão da sua conta a qualquer momento.</p>
                    <div className="flex gap-4">
                      <Button variant="outline" className="rounded-full text-xs font-bold border-border">Baixar Meus Dados (JSON)</Button>
                      <Button variant="outline" className="rounded-full text-xs font-bold border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 transition-all">Excluir Minha Conta Permanentemente</Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
