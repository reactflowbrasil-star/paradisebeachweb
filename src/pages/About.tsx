import { motion } from "framer-motion";
import SectionTitle from "@/components/SectionTitle";
import sunsetImg from "@/assets/beach-sunset.jpg";
import { Award, Users, Home, Globe } from "lucide-react";

const stats = [
  { icon: Home, value: "500+", label: "Propriedades vendidas" },
  { icon: Users, value: "1.200+", label: "Clientes satisfeitos" },
  { icon: Globe, value: "15+", label: "Regiões atendidas" },
  { icon: Award, value: "14", label: "Anos de experiência" },
];

export default function About() {
  return (
    <div className="pb-16 pt-24 sm:pt-28">
      {/* Hero */}
      <section className="relative py-24 overflow-hidden">
        <img src={sunsetImg} alt="Praia ao pôr do sol" className="absolute inset-0 w-full h-full object-cover" loading="lazy" width={1920} height={800} />
        <div className="absolute inset-0 bg-foreground/60" />
        <div className="relative z-10 mobile-shell mx-auto text-center">
          <SectionTitle label="Nossa História" title="Sobre a Paradise Beach" subtitle="Mais de uma década conectando pessoas aos seus sonhos à beira-mar." light />
        </div>
      </section>

      {/* Story */}
      <section className="py-24 bg-background">
        <div className="mobile-shell mx-auto max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="font-serif text-3xl font-bold text-foreground mb-6">Nossa Missão</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Fundada em 2010 em Trancoso, Bahia, a Paradise Beach nasceu da paixão por unir pessoas extraordinárias a propriedades excepcionais. Acreditamos que cada cliente merece um lar que reflita seus sonhos — e que esse lar deve estar nos cenários mais deslumbrantes do litoral brasileiro.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Nossa equipe de consultores imobiliários é formada por profissionais apaixonados pelo mercado de luxo, com profundo conhecimento das regiões litorâneas mais desejadas do Brasil. Oferecemos um serviço personalizado, discreto e de excelência em cada etapa da jornada.
            </p>
            <h2 className="font-serif text-3xl font-bold text-foreground mb-6 mt-12">Nossos Valores</h2>
            <ul className="space-y-4 text-muted-foreground">
              <li className="flex items-start gap-3"><span className="w-2 h-2 rounded-full bg-gold mt-2 shrink-0" /> <span><strong className="text-foreground">Excelência:</strong> Cada detalhe importa. Buscamos a perfeição em tudo que fazemos.</span></li>
              <li className="flex items-start gap-3"><span className="w-2 h-2 rounded-full bg-gold mt-2 shrink-0" /> <span><strong className="text-foreground">Confiança:</strong> Relações transparentes e éticas são a base do nosso trabalho.</span></li>
              <li className="flex items-start gap-3"><span className="w-2 h-2 rounded-full bg-gold mt-2 shrink-0" /> <span><strong className="text-foreground">Exclusividade:</strong> Selecionamos apenas as melhores propriedades para nossos clientes.</span></li>
              <li className="flex items-start gap-3"><span className="w-2 h-2 rounded-full bg-gold mt-2 shrink-0" /> <span><strong className="text-foreground">Paixão:</strong> Amamos o que fazemos e isso se reflete em cada atendimento.</span></li>
            </ul>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-sand">
        <div className="mobile-shell mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <s.icon size={32} className="mx-auto mb-3 text-primary" />
                <p className="font-serif text-4xl font-bold text-foreground mb-1">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
