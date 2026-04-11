import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import SectionTitle from "@/components/SectionTitle";
import sunsetImg from "@/assets/beach-sunset.jpg";
import { useSettings } from "@/contexts/SettingsContext";
import { findSection, findSectionItems, usePublicPage } from "@/hooks/useCms";
import { resolveCmsIcon } from "@/lib/cms-icons";

const fallbackStats = [
  { icon: resolveCmsIcon("Home"), value: "500+", label: "Propriedades vendidas" },
  { icon: resolveCmsIcon("Users"), value: "1.200+", label: "Clientes satisfeitos" },
  { icon: resolveCmsIcon("Globe"), value: "15+", label: "Regioes atendidas" },
  { icon: resolveCmsIcon("Award"), value: "14", label: "Anos de experiencia" },
];

export default function About() {
  const { settings } = useSettings();
  const { data: cmsAbout } = usePublicPage("sobre");
  const heroSection = findSection(cmsAbout, "hero");
  const storySection = findSection(cmsAbout, "story");
  const valuesSection = findSection(cmsAbout, "values");
  const statsSection = findSection(cmsAbout, "stats");

  const storyText = String(
    storySection?.text_content ||
      settings?.site_about ||
      "Fundada em 2010 em Trancoso, Bahia, a Paradise Beach nasceu da paixao por unir pessoas extraordinarias a propriedades excepcionais."
  );

  const values = findSectionItems(valuesSection).length
    ? findSectionItems(valuesSection).map((item) => ({ title: item.title || "Valor", description: item.description || "" }))
    : [
        { title: "Excelencia", description: "Cada detalhe importa. Buscamos a perfeicao em tudo que fazemos." },
        { title: "Confianca", description: "Relacoes transparentes e eticas sao a base do nosso trabalho." },
        { title: "Exclusividade", description: "Selecionamos apenas as melhores propriedades para nossos clientes." },
        { title: "Paixao", description: "Amamos o que fazemos e isso se reflete em cada atendimento." },
      ];

  const stats = findSectionItems(statsSection).length
    ? findSectionItems(statsSection).map((item) => ({
        icon: resolveCmsIcon(item.icon_name),
        value: item.title || "0",
        label: item.subtitle || item.description || "",
      }))
    : fallbackStats;

  return (
    <div className="section-padding pt-24 sm:pt-28">
      <Helmet>
        <title>{cmsAbout?.seo?.seo_title || heroSection?.title || "Sobre a Paradise Beach"}</title>
        <meta name="description" content={cmsAbout?.seo?.seo_description || heroSection?.subtitle || storyText.slice(0, 160)} />
      </Helmet>
      <section className="relative overflow-hidden py-24">
        <img src={sunsetImg} alt="Praia ao por do sol" className="absolute inset-0 h-full w-full object-cover" loading="lazy" width={1920} height={800} />
        <div className="absolute inset-0 bg-foreground/60" />
        <div className="relative z-10 mobile-shell mx-auto text-center">
          <SectionTitle
            label="Nossa Historia"
            title={heroSection?.title || `Sobre a ${settings?.brand_name || settings?.site_title || "Paradise Beach"}`}
            subtitle={heroSection?.subtitle || "Mais de uma decada conectando pessoas aos seus sonhos a beira-mar."}
            light
          />
        </div>
      </section>

      <section className="bg-background py-24">
        <div className="mobile-shell mx-auto max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="mb-6 font-serif text-3xl font-bold text-foreground">{storySection?.title || "Nossa Missao"}</h2>
            {storyText.split("\n").map((paragraph, idx) => (
              paragraph.trim() ? <p key={idx} className="mb-6 leading-relaxed text-muted-foreground">{paragraph}</p> : null
            ))}
            <h2 className="mb-6 mt-12 font-serif text-3xl font-bold text-foreground">{valuesSection?.title || "Nossos Valores"}</h2>
            <ul className="space-y-4 text-muted-foreground">
              {values.map((value) => (
                <li key={value.title} className="flex items-start gap-3">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-gold" />
                  <span><strong className="text-foreground">{value.title}:</strong> {value.description}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      <section className="bg-sand py-20">
        <div className="mobile-shell mx-auto">
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="text-center">
                <stat.icon size={32} className="mx-auto mb-3 text-primary" />
                <p className="mb-1 font-serif text-4xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
