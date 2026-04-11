import { Link } from "react-router-dom";
import { Bed, Bath, Maximize, MapPin } from "lucide-react";
import { type Property, formatPrice } from "@/hooks/useProperties";
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

        <div className="p-4 sm:p-5">
          <div className="mb-1.5 flex items-center gap-1 text-[11px] sm:text-xs text-muted-foreground">
            <MapPin size={12} />
            <span className="truncate">{property.location}, {property.city}</span>
          </div>
          <h3 className="mb-2 text-base sm:text-lg font-semibold text-foreground leading-snug transition-colors group-hover:text-primary line-clamp-1">
            {property.title}
          </h3>
          <p className="mb-4 text-xl sm:text-2xl font-bold text-primary">
            {formatPrice(property.price, property.priceLabel)}
          </p>
          <div className="flex items-center gap-4 border-t border-border pt-4 text-[13px] sm:text-sm text-muted-foreground font-medium">
            {property.bedrooms > 0 && <span className="flex items-center gap-1.5"><Bed size={15} className="text-primary/70" /> {property.bedrooms}</span>}
            {property.bathrooms > 0 && <span className="flex items-center gap-1.5"><Bath size={15} className="text-primary/70" /> {property.bathrooms}</span>}
            <span className="flex items-center gap-1.5"><Maximize size={15} className="text-primary/70" /> {property.area}m²</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
