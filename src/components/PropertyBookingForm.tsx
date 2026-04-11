import { useState, useMemo } from "react";
import { addDays, format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, Users, Loader2, CheckCircle2 } from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, DbProperty } from "@/lib/api";
import { toast } from "sonner";
import { formatPrice } from "@/hooks/useProperties";
import { motion, AnimatePresence } from "framer-motion";

interface PropertyBookingFormProps {
  property: DbProperty;
}

export default function PropertyBookingForm({ property }: PropertyBookingFormProps) {
  const [date, setDate] = useState<DateRange | undefined>({
    from: addDays(new Date(), 1),
    to: addDays(new Date(), 4),
  });
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const nights = useMemo(() => {
    if (date?.from && date?.to) {
      return Math.max(1, differenceInDays(date.to, date.from));
    }
    return 0;
  }, [date]);

  const totalPrice = useMemo(() => {
    return property.price * nights;
  }, [property.price, nights]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date?.from || !date?.to) {
      toast.error("Por favor, selecione as datas de check-in e check-out.");
      return;
    }
    if (!name || !email) {
      toast.error("Por favor, preencha seu nome e e-mail.");
      return;
    }

    setLoading(true);
    try {
      await api.createReservation({
        property_id: property.id,
        guest_name: name,
        email: email,
        check_in: format(date.from, "yyyy-MM-dd"),
        check_out: format(date.to, "yyyy-MM-dd"),
        adults_count: adults,
        children_count: children,
        total: totalPrice,
        status: "pendente",
        payment_status: "pendente",
      });
      setSuccess(true);
      toast.success("Solicitação de reserva enviada com sucesso!");
    } catch (error) {
      console.error("Booking error:", error);
      toast.error("Ocorreu um erro ao processar sua reserva. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-xl p-8 text-center shadow-luxury border border-primary/20"
      >
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="text-primary w-10 h-10" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">Solicitação Enviada!</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Recebemos o seu pedido de reserva para <strong>{property.title}</strong>. 
          Nossa equipe entrará em contato via e-mail ({email}) para confirmar os detalhes e o pagamento.
        </p>
        <Button 
          variant="outline" 
          className="w-full rounded-full"
          onClick={() => setSuccess(false)}
        >
          Nova Reserva
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="bg-card rounded-xl shadow-luxury p-6 border border-border">
      <div className="mb-6">
        <p className="text-sm text-muted-foreground font-medium mb-1">Preço por noite</p>
        <p className="text-3xl font-bold text-primary">
          {formatPrice(property.price, property.priceLabel)}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Date Selection */}
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Datas da Estadia</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal h-12 rounded-lg border-muted-foreground/20",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon size={16} className="mr-2 text-primary" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "dd/MM", { locale: ptBR })} - {format(date.to, "dd/MM", { locale: ptBR })}
                    </>
                  ) : (
                    format(date.from, "dd/MM", { locale: ptBR })
                  )
                ) : (
                  <span>Selecionar datas</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
                disabled={{ before: new Date() }}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Guest Selection */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Adultos</Label>
            <div className="relative">
              <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <select 
                title="Adultos"
                value={adults}
                onChange={(e) => setAdults(Number(e.target.value))}
                className="w-full pl-9 pr-4 h-11 rounded-lg border border-muted-foreground/20 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Crianças</Label>
            <select 
              title="Crianças"
              value={children}
              onChange={(e) => setChildren(Number(e.target.value))}
              className="w-full px-4 h-11 rounded-lg border border-muted-foreground/20 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
            >
              {[0, 1, 2, 3, 4, 5, 6].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Personal Info */}
        <div className="space-y-3 pt-2">
          <div className="space-y-1">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Seu Nome</Label>
            <Input 
              placeholder="Nome completo" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 rounded-lg border-muted-foreground/20"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Seu E-mail</Label>
            <Input 
              type="email"
              placeholder="e-mail@exemplo.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 rounded-lg border-muted-foreground/20"
            />
          </div>
        </div>

        {/* Price Breakdown */}
        {nights > 0 && (
          <div className="pt-4 space-y-2 border-t border-border mt-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{formatPrice(property.price)} x {nights} noites</span>
              <span className="text-foreground font-medium">{formatPrice(totalPrice)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-dashed border-border">
              <span>Total</span>
              <span className="text-primary">{formatPrice(totalPrice)}</span>
            </div>
          </div>
        )}

        <Button 
          type="submit" 
          disabled={loading || !date?.to}
          className="w-full h-14 rounded-full bg-gradient-gold text-gold-foreground font-bold hover:shadow-gold transition-all mt-4"
        >
          {loading ? (
            <Loader2 className="animate-spin mr-2" />
          ) : (
            "Solicitar Reserva agora"
          )}
        </Button>
        <p className="text-[10px] text-center text-muted-foreground">
          Você não será cobrado ainda. Nossa equipe entrará em contato.
        </p>
      </form>
    </div>
  );
}
