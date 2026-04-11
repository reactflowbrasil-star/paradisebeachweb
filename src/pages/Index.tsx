import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, MapPin, TrendingUp, Gem, Star, ArrowRight } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import heroImg from "@/assets/hero-beach.jpg";
import sunsetImg from "@/assets/beach-sunset.jpg";
import prop1 from "@/assets/property-1.jpg";
import prop2 from "@/assets/property-2.jpg";
import prop3 from "@/assets/property-3.jpg";
import { useProperties } from "@/hooks/useProperties";
import PropertyCard from "@/components/PropertyCard";
import SectionTitle from "@/components/SectionTitle";
import { Loader2 } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { getImageUrl } from "@/lib/api";

const defaultHeroSlides = [
  { src: heroImg, alt: "Villa de luxo à beira-mar com piscina infinita ao pôr do sol" },
  { src: sunsetImg, alt: "Pôr do sol deslumbrante na praia paradisíaca" },
  { src: prop1, alt: "Propriedade de luxo com vista para o mar" },
  { src: prop2, alt: "Casa premium à beira-mar" },
  { src: prop3, alt: "Imóvel exclusivo no litoral" },
];

const benefits = [
  { icon: Gem, title: "Exclusividade", desc: "Imóveis selecionados e curados para os mais exigentes." },
  { icon: Shield, title: "Segurança", desc: "Transações seguras com assessoria jurídica completa." },
  { icon: TrendingUp, title: "Rentabilidade", desc: "Alto potencial de valorização em localizações premium." },
  { icon: MapPin, title: "Localização", desc: "As praias mais paradisíacas do litoral brasileiro." },
];

const testimonials = [
  { name: "Marina Oliveira", role: "Empresária", text: "A Paradise Beach transformou meu sonho em realidade. O atendimento foi impecável do início ao fim.", rating: 5 },
  { name: "Carlos Mendes", role: "Investidor", text: "Profissionalismo e exclusividade. Encontraram a villa perfeita em Trancoso para minha família.", rating: 5 },
  { name: "Fernanda Costa", role: "Arquiteta", text: "Uma curadoria excepcional de propriedades. Cada imóvel é uma obra de arte à beira-mar.", rating: 5 },
];

export default function Index() {
  const { properties, loading } = useProperties();
  const { settings } = useSettings();
  const featured = properties.filter((p) => p.featured).slice(0, 6);
  const [slideIndex, setSlideIndex] = useState(0);

  let rawHeroSlider: string[] = [];
  let rawSiteGallery: string[] = [];
  try {
    if (settings?.hero_slider) rawHeroSlider = JSON.parse(settings.hero_slider);
    if (settings?.site_gallery) rawSiteGallery = JSON.parse(settings.site_gallery);
  } catch (e) {}

  const currentHeroSlides = rawHeroSlider.length > 0 
    ? rawHeroSlider.map(url => ({ src: getImageUrl(url), alt: "Paradise Beach - Imóvel de Luxo" }))
    : defaultHeroSlides;

  const currentGallery = rawSiteGallery.length > 0 
    ? rawSiteGallery.map(url => getImageUrl(url)) 
    : [];

  const siteTitle = settings?.site_title || "Seu Paraíso à Beira-Mar";
  const siteSubtitle = settings?.site_subtitle || "Descubra propriedades exclusivas nas praias mais deslumbrantes do Brasil. Viva o estilo de vida que você sempre sonhou.";

  const nextSlide = useCallback(() => {
    setSlideIndex((prev) => (prev + 1) % currentHeroSlides.length);
  }, [currentHeroSlides.length]);

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  return (
    <>
      <Helmet>
        <title>{siteTitle} | Paradise Beach</title>
        <meta name="description" content={siteSubtitle} />
        <meta property="og:title" content={`${siteTitle} - Paradise Beach`} />
        <meta property="og:description" content={siteSubtitle} />
        <meta property="og:image" content={currentHeroSlides[0]?.src || heroImg} />
      </Helmet>

      {/* Hero */}
      <section className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.img
            key={slideIndex}
            src={currentHeroSlides[slideIndex]?.src}
            alt={currentHeroSlides[slideIndex]?.alt}
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="absolute inset-0 h-full w-full object-cover"
            width={1920}
            height={1080}
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/60 via-foreground/30 to-foreground/75" />
        <div className="absolute inset-0 mesh-overlay opacity-30" />
        <div className="absolute bottom-28 left-1/2 z-20 flex -translate-x-1/2 gap-2.5">
          {currentHeroSlides.map((_, i) => (
            <button key={i} onClick={() => setSlideIndex(i)} className={`h-2 rounded-full transition-all duration-500 ${i === slideIndex ? "w-8 bg-gold" : "w-2 bg-white/40"}`} aria-label={`Slide ${i + 1}`} />
          ))}
        </div>
        <div className="mobile-shell relative z-10 mx-auto text-center" data-reveal>
          <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }}>
            <span className="mb-3 block text-xs font-semibold uppercase tracking-[0.3em] text-gold sm:text-sm">Imobiliária de Luxo</span>
            <h1 className="mb-5 text-4xl font-bold leading-tight text-primary-foreground sm:text-5xl md:text-6xl lg:text-7xl">
              {siteTitle}
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-base font-normal text-primary-foreground/90 sm:text-lg md:text-xl">
              {siteSubtitle}
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/aluguel" data-magnetic className="button-pop w-full sm:w-auto rounded-full bg-gradient-gold px-8 py-4 text-base font-bold text-gold-foreground hover:shadow-gold sm:text-lg">
                Reservar Imóvel
              </Link>
              <Link to="/contato" className="button-pop w-full sm:w-auto rounded-full border-2 border-primary-foreground/40 px-8 py-4 text-base font-semibold text-primary-foreground hover:bg-primary-foreground/10 sm:text-lg">
                Fale Conosco
              </Link>
            </div>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Benefits */}
      <section className="bg-background section-padding">
        <div className="mobile-shell mx-auto">
          <div data-reveal>
            <SectionTitle label="Excelência" title="Por que Paradise Beach?" subtitle="Mais de uma década de expertise em imóveis de alto padrão no litoral brasileiro." />
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6 lg:gap-8">
            {benefits.map((b) => (
              <div key={b.title} data-reveal className="glass-card rounded-2xl p-6 text-center shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-luxury sm:p-8">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-accent">
                  <b.icon size={24} className="text-primary" />
                </div>
                <h3 className="mb-3 text-xl font-semibold text-foreground">{b.title}</h3>
                <p className="text-sm text-muted-foreground">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="bg-sand section-padding">
        <div className="mobile-shell mx-auto">
          <div data-reveal>
            <SectionTitle label="Portfólio" title="Imóveis em Destaque" subtitle="Propriedades excepcionais selecionadas para você." />
          </div>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : featured.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">Nenhum imóvel em destaque no momento.</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 sm:gap-8">
              {featured.map((p, i) => (
                <PropertyCard key={p.id} property={p} index={i} />
              ))}
            </div>
          )}
          <div className="mt-10 text-center" data-reveal>
            <Link to="/aluguel" className="button-pop inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 font-semibold text-primary-foreground hover:shadow-luxury">
              Ver Todos os Imóveis <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Dynamic Gallery */}
      {currentGallery.length > 0 && (
        <section className="bg-background section-padding">
          <div className="mobile-shell mx-auto">
            <div data-reveal>
              <SectionTitle label="Galeria" title="Vida no Paraíso" subtitle="Um vislumbre das paisagens e momentos que você pode vivenciar." />
            </div>
            <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
              {currentGallery.map((imgUrl, idx) => (
                <div key={idx} data-reveal className="relative group overflow-hidden rounded-xl break-inside-avoid">
                  <img src={imgUrl} className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      <section className="bg-sand section-padding">
        <div className="mobile-shell mx-auto">
          <div data-reveal>
            <SectionTitle label="Depoimentos" title="O Que Nossos Clientes Dizem" subtitle="A satisfação dos nossos clientes é o nosso maior patrimônio." />
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 sm:gap-8">
            {testimonials.map((t) => (
              <div key={t.name} data-reveal className="rounded-2xl bg-card p-6 shadow-card sm:p-8">
                <div className="mb-4 flex gap-1">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} size={16} className="fill-gold text-gold" />
                  ))}
                </div>
                <p className="mb-6 leading-relaxed text-foreground italic">"{t.text}"</p>
                <div>
                  <p className="font-semibold text-foreground">{t.name}</p>
                  <p className="text-sm text-muted-foreground">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="relative overflow-hidden section-padding">
        <img src={sunsetImg} alt="Pôr do sol na praia" className="absolute inset-0 h-full w-full object-cover" loading="lazy" width={1920} height={800} data-parallax />
        <div className="absolute inset-0 bg-foreground/70" />
        <div className="mobile-shell relative z-10 mx-auto text-center" data-reveal>
          <SectionTitle label="Newsletter" title="Receba Novidades Exclusivas" subtitle="Cadastre-se e seja o primeiro a conhecer nossos lançamentos e oportunidades únicas." light />
          <form className="mx-auto flex w-full max-w-md flex-col gap-3 sm:max-w-xl sm:flex-row" onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder="Seu melhor e-mail" className="flex-1 rounded-full border border-primary-foreground/20 bg-card/10 px-6 py-4 text-primary-foreground backdrop-blur-sm placeholder:text-primary-foreground/50 focus:border-gold focus:outline-none" aria-label="Email para newsletter" />
            <button type="submit" className="button-pop rounded-full bg-gradient-gold px-8 py-4 font-semibold text-gold-foreground hover:shadow-gold">Inscrever-se</button>
          </form>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-background section-padding">
        <div className="mobile-shell mx-auto text-center" data-reveal>
          <h2 className="mb-6 text-3xl font-bold text-foreground sm:text-4xl md:text-5xl">
            Pronto para Encontrar<br />seu Paraíso?
          </h2>
          <p className="mx-auto mb-10 max-w-xl text-base text-muted-foreground sm:text-lg">
            Nossa equipe de especialistas está pronta para ajudá-lo a encontrar a propriedade dos seus sonhos.
          </p>
          <Link to="/contato" data-magnetic className="button-pop inline-flex items-center gap-2 rounded-full bg-gradient-gold px-10 py-4 text-lg font-semibold text-gold-foreground hover:shadow-gold">
            Entre em Contato <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </>
  );
}
