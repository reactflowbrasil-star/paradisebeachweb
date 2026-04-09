import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const AUTO_REVEAL_SELECTOR = [
  "main section",
  "main h1",
  "main h2",
  "main h3",
  "main p",
  "main form",
  "main .shadow-card",
  "main .shadow-luxury",
].join(",");

export function useWebflowEffects() {
  const location = useLocation();

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    // Small delay to let DOM settle
    const raf = requestAnimationFrame(() => {
      const manualReveal = gsap.utils.toArray<HTMLElement>("[data-reveal]");
      const autoReveal = gsap.utils
        .toArray<HTMLElement>(AUTO_REVEAL_SELECTOR)
        .filter((el) => !el.closest("[data-reveal]") && !el.hasAttribute("data-no-reveal"));

      const revealElements = [...new Set([...manualReveal, ...autoReveal])];

      revealElements.forEach((element) => {
        gsap.fromTo(
          element,
          { y: 24, opacity: 0, filter: "blur(5px)" },
          {
            y: 0,
            opacity: 1,
            filter: "blur(0px)",
            ease: "power3.out",
            duration: 0.7,
            scrollTrigger: {
              trigger: element,
              start: "top 88%",
              once: true,
            },
          },
        );
      });

      gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((element) => {
        gsap.fromTo(
          element,
          { yPercent: -7 },
          {
            yPercent: 7,
            ease: "none",
            scrollTrigger: {
              trigger: element.parentElement ?? element,
              scrub: true,
              start: "top bottom",
              end: "bottom top",
            },
          },
        );
      });

      // Magnetic buttons (desktop only)
      const magneticButtons = gsap.utils.toArray<HTMLElement>("[data-magnetic]");
      const magneticHandlers: Array<{ el: HTMLElement; move: (e: PointerEvent) => void; leave: () => void }> = [];

      if (window.innerWidth >= 768) {
        magneticButtons.forEach((button) => {
          const onMove = (event: PointerEvent) => {
            const rect = button.getBoundingClientRect();
            const x = event.clientX - rect.left - rect.width / 2;
            const y = event.clientY - rect.top - rect.height / 2;
            gsap.to(button, { x: x * 0.14, y: y * 0.18, duration: 0.3, ease: "power2.out" });
          };
          const onLeave = () => {
            gsap.to(button, { x: 0, y: 0, duration: 0.35, ease: "power3.out" });
          };
          button.addEventListener("pointermove", onMove);
          button.addEventListener("pointerleave", onLeave);
          magneticHandlers.push({ el: button, move: onMove, leave: onLeave });
        });
      }

      ScrollTrigger.refresh();

      // Store cleanup ref
      cleanupRef = () => {
        ScrollTrigger.getAll().forEach((t) => t.kill());
        magneticHandlers.forEach(({ el, move, leave }) => {
          el.removeEventListener("pointermove", move);
          el.removeEventListener("pointerleave", leave);
        });
      };
    });

    let cleanupRef: (() => void) | null = null;

    return () => {
      cancelAnimationFrame(raf);
      cleanupRef?.();
    };
  }, [location.pathname]);
}
