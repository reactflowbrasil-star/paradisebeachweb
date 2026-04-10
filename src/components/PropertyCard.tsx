import { Link } from "react-router-dom";
import { Bed, Bath, Maximize, MapPin, Heart } from "lucide-react";
import { Property, formatPrice } from "@/data/properties";
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
              {property.listing === "venda" ? "Venda" : "Aluguel"}
            </span>
            {property.featured && (
              <span className="rounded-full bg-gradient-gold px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold-foreground">
                Destaque
              </span>
            )}
          </div>
          <button
            className="button-pop absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-card/80 backdrop-blur-sm transition-colors hover:bg-card"
            aria-label="Favoritar"
            onClick={(e) => e.preventDefault()}
          >
            <Heart size={16} className="text-foreground" />
          </button>
        </div>

        <div className="p-5">
          <div className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin size={12} />
            <span>{property.location}, {property.city} - {property.state}</span>
          </div>
          <h3 className="mb-2 text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
            {property.title}
          </h3>
          <p className="mb-4 text-2xl font-bold text-primary">
            {formatPrice(property.price, property.priceLabel)}
          </p>
          <div className="flex items-center gap-4 border-t border-border pt-4 text-sm text-muted-foreground">
            {property.bedrooms > 0 && <span className="flex items-center gap-1"><Bed size={14} /> {property.bedrooms}</span>}
            {property.bathrooms > 0 && <span className="flex items-center gap-1"><Bath size={14} /> {property.bathrooms}</span>}
            <span className="flex items-center gap-1"><Maximize size={14} /> {property.area}m2</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

