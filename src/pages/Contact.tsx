import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import SectionTitle from "@/components/SectionTitle";
import { Clock, Mail, MapPin, Phone, Send } from "lucide-react";
import { toast } from "sonner";
import { findSection, findSectionItems, usePublicPage } from "@/hooks/useCms";
import { resolveCmsIcon } from "@/lib/cms-icons";
import { useSettings } from "@/contexts/SettingsContext";

const contactSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100, "Nome muito longo"),
  email: z.string().email("E-mail invalido"),
  phone: z.string().min(10, "Telefone deve ter pelo menos 10 digitos").regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, "Formato: (00) 00000-0000"),
  message: z.string().min(10, "Mensagem deve ter pelo menos 10 caracteres").max(1000, "Mensagem muito longa"),
});

type ContactForm = z.infer<typeof contactSchema>;

export default function Contact() {
  const { settings } = useSettings();
  const { data: cmsContact } = usePublicPage("contato");
  const heroSection = findSection(cmsContact, "hero");
  const infoSection = findSection(cmsContact, "info");
  const hoursSection = findSection(cmsContact, "hours");

  const infoItems = findSectionItems(infoSection).length
    ? findSectionItems(infoSection).map((item) => ({ title: item.title || "Info", description: item.description || "", icon: resolveCmsIcon(item.icon_name) }))
    : [
        { title: "Telefone", description: String(settings.contact_phone || "(81) 9229-2821"), icon: Phone },
        { title: "WhatsApp", description: String(settings.contact_whatsapp || "+55 81 9652-0169"), icon: Phone },
        { title: "E-mail", description: String(settings.contact_email || "reservaparadisebeach@gmail.com"), icon: Mail },
        { title: "Endereco", description: String(settings.contact_address || "Av. Fernando Luiz Henrique, Joao Pessoa - PB"), icon: MapPin },
      ];

  const hoursText = findSectionItems(hoursSection)[0]?.description || "Seg - Sex: 9h as 18h\nSab: 9h as 13h";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactForm>({ resolver: zodResolver(contactSchema) });

  const onSubmit = async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success("Mensagem enviada com sucesso! Retornaremos em breve.");
    reset();
  };

  return (
    <div className="section-padding pt-24 sm:pt-28">
      <Helmet>
        <title>{cmsContact?.seo?.seo_title || heroSection?.title || "Fale Conosco"}</title>
        <meta name="description" content={cmsContact?.seo?.seo_description || heroSection?.subtitle || "Entre em contato com a equipe da Paradise Beach."} />
      </Helmet>
      <div className="mobile-shell mx-auto">
        <SectionTitle
          label="Contato"
          title={heroSection?.title || "Fale Conosco"}
          subtitle={heroSection?.subtitle || "Estamos prontos para ajuda-lo a encontrar o imovel dos seus sonhos."}
        />

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-12 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 rounded-lg bg-card p-8 shadow-luxury">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Nome completo</label>
                <input {...register("name")} className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Seu nome" />
                {errors.name ? <p className="mt-1 text-sm text-red-500">{errors.name.message}</p> : null}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">E-mail</label>
                  <input {...register("email")} type="email" className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="seu@email.com" />
                  {errors.email ? <p className="mt-1 text-sm text-red-500">{errors.email.message}</p> : null}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Telefone</label>
                  <input {...register("phone")} className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="(00) 00000-0000" />
                  {errors.phone ? <p className="mt-1 text-sm text-red-500">{errors.phone.message}</p> : null}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Mensagem</label>
                <textarea {...register("message")} rows={5} className="w-full resize-none rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Como podemos ajuda-lo?" />
                {errors.message ? <p className="mt-1 text-sm text-red-500">{errors.message.message}</p> : null}
              </div>
              <button type="submit" disabled={isSubmitting} className="button-pop flex w-full items-center justify-center gap-2 rounded-full bg-gradient-gold py-4 font-semibold text-gold-foreground transition-all hover:shadow-gold disabled:cursor-not-allowed disabled:opacity-50" data-magnetic>
                <Send size={16} /> {isSubmitting ? "Enviando..." : "Enviar Mensagem"}
              </button>
            </form>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="space-y-8">
            <div>
              <h3 className="mb-6 font-serif text-2xl font-bold text-foreground">{infoSection?.title || "Informacoes de Contato"}</h3>
              <div className="space-y-5">
                {infoItems.map((item) => (
                  <div key={item.title} className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent"><item.icon size={20} className="text-primary" /></div>
                    <div>
                      <p className="font-medium text-foreground">{item.title}</p>
                      <p className="whitespace-pre-line text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                ))}
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent"><Clock size={20} className="text-primary" /></div>
                  <div>
                    <p className="font-medium text-foreground">{hoursSection?.title || "Horario de Atendimento"}</p>
                    <p className="whitespace-pre-line text-muted-foreground">{hoursText}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
