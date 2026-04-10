import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import SectionTitle from "@/components/SectionTitle";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";
import { toast } from "sonner";
import { CONTACT_ADDRESS_LINES, CONTACT_EMAIL, CONTACT_PHONE_DISPLAY, CONTACT_WHATSAPP_URL } from "@/lib/contact";

const contactSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100, "Nome muito longo"),
  email: z.string().email("E-mail inválido"),
  phone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos").regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, "Formato: (00) 00000-0000"),
  message: z.string().min(10, "Mensagem deve ter pelo menos 10 caracteres").max(1000, "Mensagem muito longa"),
});

type ContactForm = z.infer<typeof contactSchema>;

export default function Contact() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (_data: ContactForm) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success("Mensagem enviada com sucesso! Retornaremos em breve.");
    reset();
  };

  return (
    <div className="pb-16 pt-24 sm:pt-28">
      <div className="mobile-shell mx-auto">
        <SectionTitle label="Contato" title="Fale Conosco" subtitle="Estamos prontos para ajudá-lo a encontrar o imóvel dos seus sonhos." />

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-12 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 rounded-lg bg-card p-8 shadow-luxury">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Nome completo</label>
                <input
                  {...register("name")}
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Seu nome"
                />
                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">E-mail</label>
                  <input
                    {...register("email")}
                    type="email"
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="seu@email.com"
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Telefone</label>
                  <input
                    {...register("phone")}
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="(00) 00000-0000"
                  />
                  {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone.message}</p>}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Mensagem</label>
                <textarea
                  {...register("message")}
                  rows={5}
                  className="w-full resize-none rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Como podemos ajudá-lo?"
                />
                {errors.message && <p className="mt-1 text-sm text-red-500">{errors.message.message}</p>}
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="button-pop flex w-full items-center justify-center gap-2 rounded-full bg-gradient-gold py-4 font-semibold text-gold-foreground transition-all hover:shadow-gold disabled:cursor-not-allowed disabled:opacity-50"
                data-magnetic
              >
                <Send size={16} /> {isSubmitting ? "Enviando..." : "Enviar Mensagem"}
              </button>
            </form>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="space-y-8">
            <div>
              <h3 className="mb-6 font-serif text-2xl font-bold text-foreground">Informações de Contato</h3>
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent"><Phone size={20} className="text-primary" /></div>
                  <div>
                    <p className="font-medium text-foreground">Telefone</p>
                    <p className="text-muted-foreground">{CONTACT_PHONE_DISPLAY}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent"><Phone size={20} className="text-primary" /></div>
                  <div>
                    <p className="font-medium text-foreground">WhatsApp</p>
                    <p className="text-muted-foreground">{CONTACT_PHONE_DISPLAY}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent"><Mail size={20} className="text-primary" /></div>
                  <div>
                    <p className="font-medium text-foreground">E-mail</p>
                    <p className="text-muted-foreground break-all">{CONTACT_EMAIL}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent"><MapPin size={20} className="text-primary" /></div>
                  <div>
                    <p className="font-medium text-foreground">Endereço</p>
                    <div className="text-muted-foreground">
                      {CONTACT_ADDRESS_LINES.map((line) => (
                        <p key={line}>{line}</p>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent"><Clock size={20} className="text-primary" /></div>
                  <div>
                    <p className="font-medium text-foreground">Horário de Atendimento</p>
                    <p className="text-muted-foreground">Seg a Sex: 9h às 18h<br />Sáb: 9h às 13h</p>
                  </div>
                </div>
              </div>
              <a
                href={CONTACT_WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="button-pop mt-8 inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-4 font-semibold text-primary-foreground transition-all hover:shadow-luxury"
                data-magnetic
              >
                Falar via WhatsApp
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
