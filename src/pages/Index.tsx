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
import { properties } from "@/data/properties";
import PropertyCard from "@/components/PropertyCard";
import SectionTitle from "@/components/SectionTitle";

const heroSlides = [
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
  const featured = properties.filter((p) => p.featured).slice(0, 6);
  const [slideIndex, setSlideIndex] = useState(0);

  const nextSlide = useCallback(() => {
    setSlideIndex((prev) => (prev + 1) % heroSlides.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  return (
    <>
      <Helmet>
        <title>Paradise Beach - Imóveis de Luxo à Beira-Mar | Venda e Aluguel</title>
        <meta name="description" content="Encontre imóveis de luxo à beira-mar no Paradise Beach. Villas, casas e apartamentos premium para venda e aluguel nas melhores praias do Brasil." />
        <meta name="keywords" content="imóveis beira-mar, villas luxo, casas praia, aluguel temporada, venda imóveis litoral" />
        <meta property="og:title" content="Paradise Beach - Imóveis de Luxo à Beira-Mar" />
        <meta property="og:description" content="Viva o paraíso: imóveis premium à beira-mar para venda e aluguel." />
        <meta property="og:image" content={heroImg} />
        <meta property="og:url" content="https://paradisebeach.com" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href="https://paradisebeach.com" />
      </Helmet>
      {/* Hero – full-screen with sliding backgrounds */}
      <section className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden">
        {/* Background slides */}
        <AnimatePresence mode="wait">
          <motion.img
            key={slideIndex}
            src={heroSlides[slideIndex].src}
            alt={heroSlides[slideIndex].alt}
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="absolute inset-0 h-full w-full object-cover"
            width={1920}
            height={1080}
          />
        </AnimatePresence>

        {/* Gradient overlays for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/60 via-foreground/30 to-foreground/75" />
        <div className="absolute inset-0 mesh-overlay opacity-30" />

        {/* Slide indicators */}
        <div className="absolute bottom-28 left-1/2 z-20 flex -translate-x-1/2 gap-2.5">
          {heroSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlideIndex(i)}
              className={`h-2 rounded-full transition-all duration-500 ${i === slideIndex ? "w-8 bg-gold" : "w-2 bg-white/40"}`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="mobile-shell relative z-10 mx-auto text-center" data-reveal>
          <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }}>
            <span className="mb-3 block text-xs font-semibold uppercase tracking-[0.3em] text-gold sm:text-sm">Imobiliária de Luxo</span>
            <h1 className="mb-5 text-4xl font-bold leading-tight text-primary-foreground sm:text-5xl md:text-6xl lg:text-7xl">
              Seu Paraíso<br />à Beira-Mar
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-base font-light text-primary-foreground/80 sm:text-lg md:text-xl">
              Descubra propriedades exclusivas nas praias mais deslumbrantes do Brasil. Viva o estilo de vida que você sempre sonhou.
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
              <Link to="/venda" data-magnetic className="button-pop rounded-full bg-gradient-gold px-7 py-3.5 text-base font-semibold text-gold-foreground hover:shadow-gold sm:px-8 sm:text-lg">
                Ver Imóveis à Venda
              </Link>
              <Link to="/aluguel" className="button-pop rounded-full border-2 border-primary-foreground/40 px-7 py-3.5 text-base font-semibold text-primary-foreground hover:bg-primary-foreground/10 sm:px-8 sm:text-lg">
                Imóveis para Alugar
              </Link>
            </div>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Benefits */}
      <section className="bg-background py-16 sm:py-20 md:py-24">
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
      <section className="bg-sand py-16 sm:py-20 md:py-24">
        <div className="mobile-shell mx-auto">
          <div data-reveal>
            <SectionTitle label="Portfólio" title="Imóveis em Destaque" subtitle="Propriedades excepcionais selecionadas para você." />
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 sm:gap-8">
            {featured.map((p, i) => (
              <PropertyCard key={p.id} property={p} index={i} />
            ))}
          </div>
          <div className="mt-10 text-center" data-reveal>
            <Link to="/venda" className="button-pop inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 font-semibold text-primary-foreground hover:shadow-luxury">
              Ver Todos os Imóveis <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-background py-16 sm:py-20 md:py-24">
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
      <section className="relative overflow-hidden py-16 sm:py-20 md:py-24">
        <img src={sunsetImg} alt="Pôr do sol na praia" className="absolute inset-0 h-full w-full object-cover" loading="lazy" width={1920} height={800} data-parallax />
        <div className="absolute inset-0 bg-foreground/70" />
        <div className="mobile-shell relative z-10 mx-auto text-center" data-reveal>
          <SectionTitle label="Newsletter" title="Receba Novidades Exclusivas" subtitle="Cadastre-se e seja o primeiro a conhecer nossos lançamentos e oportunidades únicas." light />
          <form className="mx-auto flex w-full max-w-md flex-col gap-3 sm:max-w-xl sm:flex-row" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="Seu melhor e-mail"
              className="flex-1 rounded-full border border-primary-foreground/20 bg-card/10 px-6 py-4 text-primary-foreground backdrop-blur-sm placeholder:text-primary-foreground/50 focus:border-gold focus:outline-none"
              aria-label="Email para newsletter"
            />
            <button type="submit" className="button-pop rounded-full bg-gradient-gold px-8 py-4 font-semibold text-gold-foreground hover:shadow-gold">
              Inscrever-se
            </button>
          </form>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-background py-16 sm:py-20 md:py-24">
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
