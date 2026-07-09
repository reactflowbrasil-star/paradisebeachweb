import { Link } from "react-router-dom";
import { Bed, Bath, Maximize, MapPin, Phone } from "lucide-react";
import { type Property } from "@/hooks/useProperties";
import { motion } from "framer-motion";
import LazyImage from "./LazyImage";

interface Props {
  property: Property;
  index?: number;
}

export default function PropertyCard({ property, index = 0 }: Props) {
  return (
    <motion.div
      data-reveal
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 0.45 }}
    >
      <Link
        to={`/imovel/${property.id}`}
        className="group block overflow-hidden rounded-2xl bg-card shadow-card transition-all duration-500 hover:-translate-y-1 hover:shadow-luxury"
      >
        <div className="relative aspect-[4/3] overflow-hidden">
          <LazyImage
            src={property.images[0]}
            alt={property.title}
            width={800}
            height={600}
            className="transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute left-4 top-4 flex gap-2">
            <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary-foreground">
              Aluguel
            </span>
            {property.featured && (
              <span className="rounded-full bg-gradient-gold px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold-foreground">
                Destaque
              </span>
            )}
          </div>
        </div>

        <div className="p-5">
          <div className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin size={12} />
            <span>{property.location}, {property.city} - {property.state}</span>
          </div>
          <h3 className="mb-2 text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
            {property.title}
          </h3>
          <a
            href={`https://wa.me/${property.whatsapp || "5583991331939"}?text=Olá! Tenho interesse no imóvel: ${property.title}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-gold px-4 py-2 text-sm font-semibold text-gold-foreground hover:shadow-gold transition-all mb-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Phone size={14} /> Negociar via WhatsApp
          </a>
          <div className="flex items-center gap-4 border-t border-border pt-4 text-sm text-muted-foreground">
            {property.bedrooms > 0 && <span className="flex items-center gap-1"><Bed size={14} /> {property.bedrooms}</span>}
            {property.bathrooms > 0 && <span className="flex items-center gap-1"><Bath size={14} /> {property.bathrooms}</span>}
            <span className="flex items-center gap-1"><Maximize size={14} /> {property.area}m²</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
