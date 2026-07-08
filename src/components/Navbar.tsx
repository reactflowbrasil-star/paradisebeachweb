import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logoImg from "@/assets/logo-paradise.png";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/aluguel", label: "Imoveis de temporada" },
  { to: "/sobre", label: "Sobre Nós" },
  { to: "/contato", label: "Contato" },
  { to: "/admin", label: "Admin" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <nav className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${isHome ? "bg-foreground/20 backdrop-blur-md" : "bg-card/95 backdrop-blur-md shadow-card"}`}>
      <div className="mobile-shell mx-auto flex items-center justify-between py-2 md:py-3">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={logoImg} alt="Paradise Beach" className="h-10 w-10 rounded-full object-cover bg-white/90 p-0.5 sm:h-11 sm:w-11" />
          <span className={`font-serif text-xl font-bold tracking-tight sm:text-2xl ${isHome ? "text-primary-foreground" : "text-primary"}`}>
            Paradise<span className="text-gradient-gold">Beach</span>
          </span>
        </Link>

        <div className="hidden items-center gap-6 lg:flex">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`text-sm font-medium tracking-wide transition-colors hover:text-primary ${
                location.pathname === l.to
                  ? isHome ? "text-primary-foreground border-b-2 border-gold pb-0.5" : "text-primary border-b-2 border-primary pb-0.5"
                  : isHome ? "text-primary-foreground/80" : "text-muted-foreground"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link
            to="/contato"
            data-magnetic
            className="button-pop rounded-full bg-gradient-gold px-6 py-2.5 text-sm font-semibold text-gold-foreground hover:shadow-gold"
          >
            Fale Conosco
          </Link>
        </div>

        <button
          onClick={() => setOpen(!open)}
          className={`rounded-md p-2 lg:hidden ${isHome ? "text-primary-foreground" : "text-foreground"}`}
          aria-label="Menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card lg:hidden"
          >
            <div className="mobile-shell flex flex-col gap-2 py-5">
              {navLinks.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className={`rounded-md py-2 text-base font-medium transition-colors ${location.pathname === l.to ? "text-primary" : "text-foreground"}`}
                >
                  {l.label}
                </Link>
              ))}
              <Link
                to="/contato"
                onClick={() => setOpen(false)}
                className="mt-2 rounded-full bg-gradient-gold px-6 py-3 text-center font-semibold text-gold-foreground"
              >
                Fale Conosco
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
