import { Link } from "react-router-dom";
import { Facebook, Instagram, Mail, MapPin, Phone } from "lucide-react";
import logoImg from "@/assets/logo-paradise.png";
import { usePublicMenu } from "@/hooks/useCms";
import { useSettings } from "@/contexts/SettingsContext";

const fallbackLinks = [
  { to: "/venda", label: "Imoveis a Venda" },
  { to: "/aluguel", label: "Imoveis para Aluguel" },
  { to: "/sobre", label: "Sobre Nos" },
  { to: "/contato", label: "Contato" },
];

export default function Footer() {
  const { data: footerMenu } = usePublicMenu("footer");
  const { settings } = useSettings();

  const links = footerMenu?.length
    ? footerMenu.map((item) => ({ to: item.url, label: item.label }))
    : fallbackLinks;

  const brandName = String(settings.brand_name || "Paradise Beach");
  const [brandPrimary, brandSecondary = "Beach"] = brandName.split(" ");
  const footerDescription = String(settings.footer_description || "Seu paraiso a beira-mar. Especialistas em reservas e imoveis de luxo no litoral brasileiro.");
  const contactPhone = String(settings.contact_phone || "(81) 9229-2821");
  const contactEmail = String(settings.contact_email || "reservaparadisebeach@gmail.com");
  const contactAddress = String(settings.contact_address || "Av. Fernando Luiz Henrique, Joao Pessoa - PB");
  const instagramUrl = String(settings.social_instagram || "#");
  const facebookUrl = String(settings.social_facebook || "#");

  return (
    <footer className="bg-foreground text-primary-foreground">
      <div className="mobile-shell mx-auto py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <img src={logoImg} alt="Paradise Beach" className="h-12 w-12 rounded-full object-cover bg-white/90 p-0.5" />
              <h3 className="font-serif text-2xl font-bold">
                {brandPrimary}<span className="text-gradient-gold">{brandSecondary}</span>
              </h3>
            </div>
            <p className="text-sm leading-relaxed text-primary-foreground/70">{footerDescription}</p>
          </div>

          <div>
            <h4 className="mb-4 font-serif text-lg font-semibold">Navegacao</h4>
            <div className="flex flex-col gap-3">
              {links.map((item) => (
                <Link key={item.to} to={item.to} className="text-sm text-primary-foreground/70 transition-colors hover:text-gold">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-4 font-serif text-lg font-semibold">Contato</h4>
            <div className="flex flex-col gap-3 text-sm text-primary-foreground/70">
              <span className="flex items-center gap-2"><Phone size={16} className="text-gold" /> {contactPhone}</span>
              <span className="flex items-center gap-2"><Mail size={16} className="text-gold" /> {contactEmail}</span>
              <span className="flex items-center gap-2"><MapPin size={16} className="text-gold" /> {contactAddress}</span>
            </div>
          </div>

          <div>
            <h4 className="mb-4 font-serif text-lg font-semibold">Redes Sociais</h4>
            <div className="flex gap-4">
              <a href={instagramUrl} className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground/10 transition-colors hover:bg-gold" aria-label="Instagram" target="_blank" rel="noreferrer">
                <Instagram size={18} />
              </a>
              <a href={facebookUrl} className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground/10 transition-colors hover:bg-gold" aria-label="Facebook" target="_blank" rel="noreferrer">
                <Facebook size={18} />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-primary-foreground/10 pt-8 text-center text-sm text-primary-foreground/50">
          © {new Date().getFullYear()} {brandName}. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
