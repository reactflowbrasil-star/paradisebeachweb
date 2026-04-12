import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logoImg from "@/assets/logo-paradise.png";
import heroImg from "@/assets/hero-beach.jpg";
import sunsetImg from "@/assets/beach-sunset.jpg";
import prop1 from "@/assets/property-1.jpg";

const storageKey = "paradise_intro_seen_v2";

const phrases = [
  "Seu paraíso à beira-mar",
  "Imóveis de alto padrão no litoral brasileiro",
  "Exclusividade, conforto e sofisticação",
  "Descubra o estilo de vida dos seus sonhos",
];

const bgImages = [heroImg, sunsetImg, prop1];

export default function IntroSlides() {
  const [isOpen, setIsOpen] = useState(false);
  // phase: 0 = logo reveal, 1 = typewriter phrases
  const [phase, setPhase] = useState(0);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [bgIndex, setBgIndex] = useState(0);

  useEffect(() => {
    const seen = window.localStorage.getItem(storageKey);
    setIsOpen(!seen);
  }, []);

  // Phase 0 → 1: after logo reveal (2.5s)
  useEffect(() => {
    if (!isOpen || phase !== 0) return;
    const t = setTimeout(() => setPhase(1), 2500);
    return () => clearTimeout(t);
  }, [isOpen, phase]);

  // Typewriter effect
  useEffect(() => {
    if (!isOpen || phase !== 1) return;
    const currentPhrase = phrases[phraseIndex];
    if (!currentPhrase) return;

    if (charIndex < currentPhrase.length) {
      const t = setTimeout(() => setCharIndex((c) => c + 1), 50);
      return () => clearTimeout(t);
    }

    // Pause after phrase completes, then advance
    const t = setTimeout(() => {
      if (phraseIndex < phrases.length - 1) {
        setPhraseIndex((p) => p + 1);
        setCharIndex(0);
      } else {
        // All phrases done → close intro
        closeIntro();
      }
    }, 1800);
    return () => clearTimeout(t);
  }, [isOpen, phase, phraseIndex, charIndex]);

  // Background slide rotation
  useEffect(() => {
    if (!isOpen || phase !== 1) return;
    const t = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % bgImages.length);
    }, 4000);
    return () => clearInterval(t);
  }, [isOpen, phase]);

  const closeIntro = useCallback(() => {
    window.localStorage.setItem(storageKey, "1");
    setIsOpen(false);
  }, []);

  const currentText = phase === 1 && phrases[phraseIndex]
    ? phrases[phraseIndex].slice(0, charIndex)
    : "";

  const progress = phase === 0
    ? 0
    : ((phraseIndex + (charIndex / (phrases[phraseIndex]?.length || 1))) / phrases.length) * 100;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.8 } }}
          className="fixed inset-0 z-[70] overflow-hidden"
        >
          {/* Full-screen background slides */}
          <AnimatePresence mode="sync">
            <motion.img
              key={bgIndex}
              src={bgImages[bgIndex]}
              alt=""
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </AnimatePresence>

          {/* Dark overlay */}
          <div className="absolute inset-0 bg-foreground/75" />
          <div className="absolute inset-0 mesh-overlay opacity-20" />

          {/* Content */}
          <div className="relative z-10 flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center">
            {/* Logo — always visible */}
            <motion.div
              initial={{ opacity: 0, scale: 0.3, y: 20 }}
              animate={{
                opacity: 1,
                scale: phase === 0 ? 1.1 : 0.85,
                y: phase === 0 ? 0 : -20,
              }}
              transition={{
                duration: phase === 0 ? 1.4 : 0.8,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="relative mb-4"
            >
              {/* Glow */}
              <motion.div
                animate={{
                  boxShadow: [
                    "0 0 40px hsla(38,70%,55%,0)",
                    "0 0 80px hsla(38,70%,55%,0.35)",
                    "0 0 40px hsla(38,70%,55%,0)",
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="rounded-full"
              >
                <img
                  src={logoImg}
                  alt="Paradise Beach"
                  className="h-36 w-36 rounded-full border-2 border-gold/30 bg-white/95 object-cover p-3 shadow-luxury sm:h-44 sm:w-44"
                />
              </motion.div>

              {/* Decorative rings */}
              <motion.div
                className="absolute inset-[-10px] rounded-full border border-gold/20"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              />
              <motion.div
                className="absolute inset-[-22px] rounded-full border border-dashed border-gold/10"
                animate={{ rotate: -360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              />
            </motion.div>

            {/* Brand name in logo phase */}
            <AnimatePresence>
              {phase === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: 0.8, duration: 0.7 }}
                  className="mb-2"
                >
                  <h1 className="font-serif text-3xl font-bold text-primary-foreground sm:text-4xl">
                    Paradise<span className="text-gradient-gold">Beach</span>
                  </h1>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.35em] text-gold">
                    Imóveis de Alto Padrão
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Typewriter phase */}
            <AnimatePresence>
              {phase === 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="w-full max-w-2xl"
                >
                  {/* Progress bar */}
                  <div className="mx-auto mb-8 h-1 w-full max-w-xs overflow-hidden rounded-full bg-white/15">
                    <motion.div
                      className="h-full rounded-full bg-gradient-gold"
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>

                  <div className="min-h-[4rem] flex items-center justify-center">
                    <p className="text-2xl font-light leading-relaxed text-primary-foreground sm:text-3xl md:text-4xl">
                      {currentText}
                      <motion.span
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, repeatType: "reverse" }}
                        className="inline-block w-[3px] h-[1em] bg-gold ml-1 align-middle"
                      />
                    </p>
                  </div>

                  {/* Phrase dots */}
                  <div className="mt-8 flex items-center justify-center gap-2.5">
                    {phrases.map((_, i) => (
                      <div
                        key={i}
                        className={`h-2 rounded-full transition-all duration-500 ${
                          i === phraseIndex ? "w-7 bg-gold" : i < phraseIndex ? "w-2 bg-gold/50" : "w-2 bg-white/25"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Skip button */}
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    onClick={closeIntro}
                    className="mt-10 text-xs uppercase tracking-[0.2em] text-primary-foreground/50 hover:text-gold transition-colors"
                  >
                    Pular introdução
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
