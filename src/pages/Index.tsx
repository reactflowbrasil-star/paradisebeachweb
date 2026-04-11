import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Loader2, Star } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import heroImg from "@/assets/hero-beach.jpg";
import sunsetImg from "@/assets/beach-sunset.jpg";
import prop1 from "@/assets/property-1.jpg";
import prop2 from "@/assets/property-2.jpg";
import prop3 from "@/assets/property-3.jpg";
import { useProperties } from "@/hooks/useProperties";
import PropertyCard from "@/components/PropertyCard";
import SectionTitle from "@/components/SectionTitle";
import { useSettings } from "@/contexts/SettingsContext";
import { getImageUrl } from "@/lib/api";
import { findContentItem, findSection, findSectionItems, usePublicPage } from "@/hooks/useCms";
import { resolveCmsIcon } from "@/lib/cms-icons";

const defaultHeroSlides = [
  { src: heroImg, alt: "Villa de luxo a beira-mar com piscina infinita ao por do sol" },
  { src: sunsetImg, alt: "Por do sol na praia paradisica" },
  { src: prop1, alt: "Propriedade de luxo com vista para o mar" },
  { src: prop2, alt: "Casa premium a beira-mar" },
  { src: prop3, alt: "Imovel exclusivo no litoral" },
];

const fallbackBenefits = [
  { icon: resolveCmsIcon("Gem"), title: "Exclusividade", desc: "Imoveis selecionados e curados para os mais exigentes." },
  { icon: resolveCmsIcon("Shield"), title: "Seguranca", desc: "Transacoes seguras com assessoria juridica completa." },
  { icon: resolveCmsIcon("TrendingUp"), title: "Rentabilidade", desc: "Alto potencial de valorizacao em localizacoes premium." },
  { icon: resolveCmsIcon("MapPin"), title: "Localizacao", desc: "As praias mais paradisiacas do litoral brasileiro." },
];

const fallbackTestimonials = [
  { name: "Marina Oliveira", role: "Empresaria", text: "A Paradise Beach transformou meu sonho em realidade. O atendimento foi impecavel do inicio ao fim.", rating: 5 },
  { name: "Carlos Mendes", role: "Investidor", text: "Profissionalismo e exclusividade. Encontraram a villa perfeita em Trancoso para minha familia.", rating: 5 },
  { name: "Fernanda Costa", role: "Arquiteta", text: "Uma curadoria excepcional de propriedades. Cada imovel e uma obra de arte a beira-mar.", rating: 5 },
];

export default function Index() {
  const { properties, loading } = useProperties();
  const { settings } = useSettings();
  const { data: cmsHome } = usePublicPage("home");
  const featured = properties.filter((p) => p.featured).slice(0, 6);
  const [slideIndex, setSlideIndex] = useState(0);

  const heroSection = findSection(cmsHome, "hero");
  const benefitsSection = findSection(cmsHome, "benefits");
  const testimonialsSection = findSection(cmsHome, "testimonials");
  const newsletterSection = findSection(cmsHome, "newsletter");
  const ctaSection = findSection(cmsHome, "cta");
  const heroItem = findContentItem(findSectionItems(heroSection), "home-hero-primary");

  const heroSlider = Array.isArray(settings.hero_slider)
    ? settings.hero_slider
    : (() => {
        try {
          return settings.hero_slider ? JSON.parse(String(settings.hero_slider)) : [];
        } catch {
          return [];
        }
      })();

  const siteGallery = Array.isArray(settings.site_gallery)
    ? settings.site_gallery
    : (() => {
        try {
          return settings.site_gallery ? JSON.parse(String(settings.site_gallery)) : [];
        } catch {
          return [];
        }
      })();

  const currentHeroSlides = heroSlider.length > 0
    ? heroSlider.map((url: string) => ({ src: getImageUrl(url), alt: "Paradise Beach - Imovel de Luxo" }))
    : defaultHeroSlides;

  const currentGallery = siteGallery.length > 0 ? siteGallery.map((url: string) => getImageUrl(url)) : [];
  const siteTitleBase = String(heroItem?.title || settings.site_title || "Seu Paraiso a Beira-Mar");
  const siteSubtitle = String(heroItem?.subtitle || settings.site_subtitle || "Imoveis exclusivos de alto padrao para viver e investir no litoral brasileiro.");
  const [displayText, setDisplayText] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(150);

  const typewriterPhrases = useMemo(() => {
    const fromCms = Array.isArray(heroItem?.meta_json?.typewriterPhrases)
      ? heroItem?.meta_json?.typewriterPhrases.filter((entry): entry is string => typeof entry === "string")
      : [];

    return fromCms.length
      ? fromCms
      : [
          siteTitleBase,
          "Imoveis exclusivos a Beira-Mar",
          "Sua villa de luxo te espera",
          "Descubra o litoral Brasileiro",
          "Onde o luxo encontra a natureza",
        ];
  }, [heroItem?.meta_json, siteTitleBase]);

  const benefits = findSectionItems(benefitsSection).length
    ? findSectionItems(benefitsSection).map((item) => ({
        icon: resolveCmsIcon(item.icon_name),
        title: item.title || "Beneficio",
        desc: item.description || "",
      }))
    : fallbackBenefits;

  const testimonials = findSectionItems(testimonialsSection).length
    ? findSectionItems(testimonialsSection).map((item) => ({
        name: item.title || "Cliente",
        role: item.subtitle || "",
        text: item.text_content || item.description || "",
        rating: Number(item.meta_json?.rating || 5),
      }))
    : fallbackTestimonials;
  useEffect(() => {
    const handleTyping = () => {
      const currentPhrase = typewriterPhrases[phraseIndex];
      if (!currentPhrase) return;

      if (isDeleting) {
        setDisplayText(currentPhrase.substring(0, displayText.length - 1));
        setTypingSpeed(50);
      } else {
        setDisplayText(currentPhrase.substring(0, displayText.length + 1));
        setTypingSpeed(150);
      }

      if (!isDeleting && displayText === currentPhrase) {
        setTimeout(() => setIsDeleting(true), 2000);
      } else if (isDeleting && displayText === "") {
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % typewriterPhrases.length);
      }
    };

    const timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [displayText, isDeleting, phraseIndex, typingSpeed, typewriterPhrases]);

  const nextSlide = useCallback(() => {
    setSlideIndex((prev) => (prev + 1) % currentHeroSlides.length);
  }, [currentHeroSlides.length]);

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  const heroPrimaryButtonLabel = String(heroItem?.button_label || heroSection?.button_label || "Reservar Imovel");
  const heroPrimaryButtonUrl = String(heroItem?.link_url || heroSection?.link_url || "/aluguel");
  const heroSecondaryButtonLabel = String(heroItem?.meta_json?.secondaryButtonLabel || heroSection?.config_json?.secondaryButtonLabel || "Fale Conosco");
  const heroSecondaryButtonUrl = String(heroItem?.meta_json?.secondaryButtonUrl || heroSection?.config_json?.secondaryButtonUrl || "/contato");

  return (
    <>
      <Helmet>
        <title>{cmsHome?.seo?.seo_title || `${siteTitleBase} | Paradise Beach`}</title>
        <meta name="description" content={cmsHome?.seo?.seo_description || siteSubtitle} />
        <meta property="og:title" content={cmsHome?.seo?.seo_title || `${siteTitleBase} - Paradise Beach`} />
        <meta property="og:description" content={cmsHome?.seo?.seo_description || siteSubtitle} />
        <meta property="og:image" content={cmsHome?.seo?.og_image_url || currentHeroSlides[0]?.src || heroImg} />
      </Helmet>

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
            <span className="mb-3 block text-xs font-semibold uppercase tracking-[0.3em] text-gold sm:text-sm">Imobiliaria de Luxo</span>
            <h1 className="mb-5 min-h-[1.2em] text-4xl font-bold leading-tight text-primary-foreground sm:text-5xl md:text-6xl lg:text-7xl">
              {displayText}<span className="animate-pulse text-gold">|</span>
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-base font-normal text-primary-foreground/90 sm:text-lg md:text-xl">{siteSubtitle}</p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to={heroPrimaryButtonUrl} data-magnetic className="button-pop w-full rounded-full bg-gradient-gold px-8 py-4 text-base font-bold text-gold-foreground hover:shadow-gold sm:w-auto sm:text-lg">
                {heroPrimaryButtonLabel}
              </Link>
              <Link to={heroSecondaryButtonUrl} className="button-pop w-full rounded-full border-2 border-primary-foreground/40 px-8 py-4 text-base font-semibold text-primary-foreground hover:bg-primary-foreground/10 sm:w-auto sm:text-lg">
                {heroSecondaryButtonLabel}
              </Link>
            </div>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      <section className="bg-background section-padding">
        <div className="mobile-shell mx-auto">
          <div data-reveal>
            <SectionTitle
              label="Excelencia"
              title={benefitsSection?.title || "Por que Paradise Beach?"}
              subtitle={benefitsSection?.subtitle || "Mais de uma decada de expertise em imoveis de alto padrao no litoral brasileiro."}
            />
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6 lg:gap-8">
            {benefits.map((benefit) => (
              <div key={benefit.title} data-reveal className="glass-card rounded-2xl p-6 text-center shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-luxury sm:p-8">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-accent">
                  <benefit.icon size={24} className="text-primary" />
                </div>
                <h3 className="mb-3 text-xl font-semibold text-foreground">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-sand section-padding">
        <div className="mobile-shell mx-auto">
          <div data-reveal>
            <SectionTitle label="Portfolio" title="Imoveis em Destaque" subtitle="Propriedades excepcionais selecionadas para voce." />
          </div>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : featured.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">Nenhum imovel em destaque no momento.</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 sm:gap-8">
              {featured.map((property, index) => <PropertyCard key={property.id} property={property} index={index} />)}
            </div>
          )}
          <div className="mt-10 text-center" data-reveal>
            <Link to="/aluguel" className="button-pop inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 font-semibold text-primary-foreground hover:shadow-luxury">
              Ver Todos os Imoveis <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
      {currentGallery.length > 0 ? (
        <section className="bg-background section-padding">
          <div className="mobile-shell mx-auto">
            <div data-reveal>
              <SectionTitle label="Galeria" title="Vida no Paraiso" subtitle="Um vislumbre das paisagens e momentos que voce pode vivenciar." />
            </div>
            <div className="columns-2 gap-4 space-y-4 md:columns-3 lg:columns-4">
              {currentGallery.map((imgUrl, idx) => (
                <div key={idx} data-reveal className="group relative overflow-hidden rounded-xl break-inside-avoid">
                  <img src={imgUrl} className="h-auto w-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                  <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="bg-sand section-padding">
        <div className="mobile-shell mx-auto">
          <div data-reveal>
            <SectionTitle
              label="Depoimentos"
              title={testimonialsSection?.title || "O Que Nossos Clientes Dizem"}
              subtitle={testimonialsSection?.subtitle || "A satisfacao dos nossos clientes e o nosso maior patrimonio."}
            />
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 sm:gap-8">
            {testimonials.map((testimonial) => (
              <div key={testimonial.name} data-reveal className="rounded-2xl bg-card p-6 shadow-card sm:p-8">
                <div className="mb-4 flex gap-1">
                  {Array.from({ length: testimonial.rating }).map((_, index) => (
                    <Star key={index} size={16} className="fill-gold text-gold" />
                  ))}
                </div>
                <p className="mb-6 italic leading-relaxed text-foreground">"{testimonial.text}"</p>
                <div>
                  <p className="font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden section-padding">
        <img src={sunsetImg} alt="Por do sol na praia" className="absolute inset-0 h-full w-full object-cover" loading="lazy" width={1920} height={800} data-parallax />
        <div className="absolute inset-0 bg-foreground/70" />
        <div className="mobile-shell relative z-10 mx-auto text-center" data-reveal>
          <SectionTitle
            label="Newsletter"
            title={newsletterSection?.title || "Receba Novidades Exclusivas"}
            subtitle={newsletterSection?.subtitle || "Cadastre-se e seja o primeiro a conhecer nossos lancamentos e oportunidades unicas."}
            light
          />
          <form className="mx-auto flex w-full max-w-md flex-col gap-3 sm:max-w-xl sm:flex-row" onSubmit={(event) => event.preventDefault()}>
            <input type="email" placeholder="Seu melhor e-mail" className="flex-1 rounded-full border border-primary-foreground/20 bg-card/10 px-6 py-4 text-primary-foreground backdrop-blur-sm placeholder:text-primary-foreground/50 focus:border-gold focus:outline-none" aria-label="Email para newsletter" />
            <button type="submit" className="button-pop rounded-full bg-gradient-gold px-8 py-4 font-semibold text-gold-foreground hover:shadow-gold">{newsletterSection?.button_label || "Inscrever-se"}</button>
          </form>
        </div>
      </section>

      <section className="bg-background section-padding">
        <div className="mobile-shell mx-auto text-center" data-reveal>
          <h2 className="mb-6 text-3xl font-bold text-foreground sm:text-4xl md:text-5xl">{ctaSection?.title || "Pronto para Encontrar seu Paraiso?"}</h2>
          <p className="mx-auto mb-10 max-w-xl text-base text-muted-foreground sm:text-lg">{ctaSection?.subtitle || "Nossa equipe de especialistas esta pronta para ajuda-lo a encontrar a propriedade dos seus sonhos."}</p>
          <Link to={String(ctaSection?.link_url || "/contato")} data-magnetic className="button-pop inline-flex items-center gap-2 rounded-full bg-gradient-gold px-10 py-4 text-lg font-semibold text-gold-foreground hover:shadow-gold">
            {ctaSection?.button_label || "Entre em Contato"} <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </>
  );
}
