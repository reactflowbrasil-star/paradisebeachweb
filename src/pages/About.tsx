import { motion } from "framer-motion";
import SectionTitle from "@/components/SectionTitle";
import sunsetImg from "@/assets/beach-sunset.jpg";
import { Award, Users, Home, Globe } from "lucide-react";

const stats = [
  { icon: Award, value: "5+", label: "Anos de experiência" },
  { icon: Globe, value: "4", label: "Cidades de atuação" },
  { icon: Home, value: "Locação", label: "Casas e apartamentos de temporada" },
  { icon: Users, value: "Venda", label: "Imóveis selecionados para diferentes perfis" },
];

export default function About() {
  return (
    <div className="pb-16 pt-24 sm:pt-28">
      {/* Hero */}
      <section className="relative overflow-hidden py-24">
        <img
          src={sunsetImg}
          alt="Praia ao pôr do sol"
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          width={1920}
          height={800}
        />
        <div className="absolute inset-0 bg-foreground/60" />
        <div className="relative z-10 mx-auto text-center mobile-shell">
          <SectionTitle
            label="Quem Somos"
            title="Paradise Beach Imobiliária"
            subtitle="Experiência, confiança e excelência no mercado imobiliário de João Pessoa, Cabedelo, Campina Grande e Porto de Galinhas."
            light
          />
        </div>
      </section>

      {/* Story */}
      <section className="bg-background py-24">
        <div className="mx-auto max-w-3xl mobile-shell">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="mb-6 font-serif text-3xl font-bold text-foreground">Paradise Beach Imobiliária</h2>
            <p className="mb-6 leading-relaxed text-muted-foreground">
              Com mais de 5 anos de experiência no mercado imobiliário, a Paradise Beach Imobiliária se consolidou como referência em qualidade, confiança e excelência no atendimento nas cidades de João Pessoa e Cabedelo.
            </p>
            <p className="mb-6 leading-relaxed text-muted-foreground">
              Especializada em casas amplas e apartamentos de temporada para locação, a empresa sempre teve como foco proporcionar conforto, praticidade e experiências únicas para seus clientes, seja para lazer ou moradia.
            </p>
            <p className="mb-6 leading-relaxed text-muted-foreground">
              Agora, iniciando uma nova fase de expansão, a Paradise Beach chega à cidade de Campina Grande e Porto de Galinhas ampliando sua atuação e trazendo ainda mais oportunidades para quem deseja investir ou conquistar o imóvel ideal.
            </p>

            <h2 className="mb-6 mt-12 font-serif text-3xl font-bold text-foreground">Nova Fase, Novas Oportunidades</h2>
            <p className="mb-6 leading-relaxed text-muted-foreground">
              Além das locações por temporada, a imobiliária passa a atuar também com a venda de imóveis, oferecendo opções selecionadas que atendem diferentes perfis, desde quem busca o primeiro imóvel até investidores que valorizam segurança e rentabilidade.
            </p>
            <p className="leading-relaxed text-muted-foreground">
              Nosso compromisso é conectar pessoas a oportunidades, com transparência, agilidade e um atendimento personalizado que faz toda a diferença.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-sand py-20">
        <div className="mx-auto mobile-shell">
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
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
                <p className="mb-1 font-serif text-4xl font-bold text-foreground">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
