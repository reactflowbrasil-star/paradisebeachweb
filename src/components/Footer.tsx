import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Instagram, Facebook } from "lucide-react";
import logoImg from "@/assets/logo-paradise.png";

export default function Footer() {
  return (
    <footer className="bg-foreground text-primary-foreground">
      <div className="mobile-shell mx-auto py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src={logoImg} alt="Paradise Beach" className="h-12 w-12 rounded-full object-cover bg-white/90 p-0.5" />
              <h3 className="font-serif text-2xl font-bold">
                Paradise<span className="text-gradient-gold">Beach</span>
              </h3>
            </div>
            <p className="text-primary-foreground/70 text-sm leading-relaxed">
              Seu paraíso à beira-mar. Especialistas em reservas e imóveis de luxo no litoral brasileiro.
            </p>
          </div>

          <div>
            <h4 className="font-serif text-lg font-semibold mb-4">Navegação</h4>
            <div className="flex flex-col gap-3">
              <Link to="/venda" className="text-sm text-primary-foreground/70 hover:text-gold transition-colors">Imóveis à Venda</Link>
              <Link to="/aluguel" className="text-sm text-primary-foreground/70 hover:text-gold transition-colors">Imóveis para Aluguel</Link>
              <Link to="/sobre" className="text-sm text-primary-foreground/70 hover:text-gold transition-colors">Sobre Nós</Link>
              <Link to="/contato" className="text-sm text-primary-foreground/70 hover:text-gold transition-colors">Contato</Link>
            </div>
          </div>

          <div>
            <h4 className="font-serif text-lg font-semibold mb-4">Contato</h4>
            <div className="flex flex-col gap-3 text-sm text-primary-foreground/70">
              <span className="flex items-center gap-2"><Phone size={16} className="text-gold" /> (81) 9229-2821</span>
              <span className="flex items-center gap-2"><Mail size={16} className="text-gold" /> reservaparadisebeach@gmail.com</span>
              <span className="flex items-center gap-2"><MapPin size={16} className="text-gold" /> Av. Fernando Luiz Henrique, João Pessoa — PB</span>
            </div>
          </div>

          <div>
            <h4 className="font-serif text-lg font-semibold mb-4">Redes Sociais</h4>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-gold transition-colors" aria-label="Instagram">
                <Instagram size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-gold transition-colors" aria-label="Facebook">
                <Facebook size={18} />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 mt-12 pt-8 text-center text-sm text-primary-foreground/50">
          © {new Date().getFullYear()} Paradise Beach Imobiliária. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
