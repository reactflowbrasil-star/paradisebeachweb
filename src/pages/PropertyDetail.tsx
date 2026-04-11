import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useProperty, formatPrice } from "@/hooks/useProperties";
import { Bed, Bath, Maximize, MapPin, ArrowLeft, Phone, Share2, Check, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import LazyImage from "@/components/LazyImage";
import PropertyMap from "@/components/PropertyMap";

export default function PropertyDetail() {
  const { id } = useParams();
  const { property, loading } = useProperty(id);
  const [currentImg, setCurrentImg] = useState(0);

  if (loading) {
    return (
      <div className="pt-32 pb-16 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="pt-32 pb-16 text-center">
        <h1 className="font-serif text-3xl font-bold text-foreground mb-4">Imóvel não encontrado</h1>
        <Link to="/aluguel" className="text-primary hover:underline">Voltar aos imóveis</Link>
      </div>
    );
  }

  const whatsappNumber = property.whatsapp || "5573999990000";

  return (
    <div className="pb-16 pt-24 sm:pt-28">
      <div className="mobile-shell mx-auto">
        <Link to="/aluguel" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 transition-colors">
          <ArrowLeft size={16} /> Voltar
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
              {/* Image gallery */}
              <div className="relative rounded-lg overflow-hidden mb-4 aspect-[16/10]">
                <LazyImage
                  src={property.images[currentImg]}
                  alt={property.title}
                  width={800}
                  height={500}
                />
                {property.images.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImg((prev) => (prev - 1 + property.images.length) % property.images.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={() => setCurrentImg((prev) => (prev + 1) % property.images.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition"
                    >
                      <ChevronRight size={20} />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {property.images.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentImg(i)}
                          className={`h-2 rounded-full transition-all ${i === currentImg ? "w-6 bg-white" : "w-2 bg-white/50"}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {property.images.length > 1 && (
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                  {property.images.map((img, i) => (
                    <button key={i} onClick={() => setCurrentImg(i)} className={`shrink-0 rounded-md overflow-hidden border-2 transition ${i === currentImg ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"}`}>
                      <img src={img} alt="" className="h-16 w-20 object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                <MapPin size={14} />
                <span>{property.location}, {property.city} — {property.state}</span>
              </div>
              <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">{property.title}</h1>

              <div className="flex flex-wrap gap-4 mb-8">
                {property.bedrooms > 0 && (
                  <span className="flex items-center gap-2 px-4 py-2 bg-muted rounded-full text-sm text-foreground"><Bed size={16} /> {property.bedrooms} Quartos</span>
                )}
                {property.bathrooms > 0 && (
                  <span className="flex items-center gap-2 px-4 py-2 bg-muted rounded-full text-sm text-foreground"><Bath size={16} /> {property.bathrooms} Banheiros</span>
                )}
                <span className="flex items-center gap-2 px-4 py-2 bg-muted rounded-full text-sm text-foreground"><Maximize size={16} /> {property.area}m²</span>
              </div>

              <h2 className="font-serif text-xl font-semibold text-foreground mb-4">Descrição</h2>
              <p className="text-muted-foreground leading-relaxed mb-8">{property.description}</p>

              {property.amenities.length > 0 && (
                <>
                  <h2 className="font-serif text-xl font-semibold text-foreground mb-4">Comodidades</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
                    {property.amenities.map((a) => (
                      <span key={a} className="flex items-center gap-2 text-sm text-foreground">
                        <Check size={14} className="text-primary" /> {a}
                      </span>
                    ))}
                  </div>
                </>
              )}

              <h2 className="font-serif text-xl font-semibold text-foreground mb-4">Localização</h2>
              <PropertyMap property={property} />
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="sticky top-28"
            >
              <div className="bg-card rounded-lg shadow-luxury p-8">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full uppercase">
                    Aluguel
                  </span>
                  <span className="capitalize text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">{property.type}</span>
                </div>
                <p className="text-3xl font-bold text-primary mb-6">
                  {formatPrice(property.price, property.priceLabel)}
                </p>

                <a
                  href={`https://wa.me/${whatsappNumber}?text=Olá! Tenho interesse no imóvel: ${property.title}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button-pop w-full bg-gradient-gold text-gold-foreground py-4 rounded-full font-semibold text-center block mb-3 hover:shadow-gold transition-all" data-magnetic
                >
                  <Phone size={16} className="inline mr-2" /> Reservar via WhatsApp
                </a>

                <button className="w-full py-3 rounded-full border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors flex items-center justify-center gap-2">
                  <Share2 size={14} /> Compartilhar
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
