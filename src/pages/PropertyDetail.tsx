import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { formatPrice } from "@/data/properties";
import { Bed, Bath, Maximize, MapPin, ArrowLeft, Phone, Heart, Share2, Check, Users, Clock } from "lucide-react";
import { motion } from "framer-motion";
import LazyImage from "@/components/LazyImage";
import PropertyMap from "@/components/PropertyMap";
import { CONTACT_PHONE_RAW } from "@/lib/contact";
import { useHotelAdmin } from "@/lib/hotel-admin";

export default function PropertyDetail() {
  const { id } = useParams();
  const { properties } = useHotelAdmin();
  const property = useMemo(() => properties.find((item) => item.id === id), [id, properties]);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    setSelectedImage(0);
  }, [id]);

  if (!property) {
    return (
      <div className="pt-32 pb-16 text-center">
        <h1 className="mb-4 font-serif text-3xl font-bold text-foreground">Imovel nao encontrado</h1>
        <Link to="/venda" className="text-primary hover:underline">Voltar aos imoveis</Link>
      </div>
    );
  }

  const gallery = property.images.length ? property.images : ["/placeholder.svg"];
  const currentImage = gallery[selectedImage] ?? gallery[0];
  const contactLabel = property.listing === "aluguel" ? "Reservar via WhatsApp" : "Entrar em Contato";

  return (
    <div className="pb-16 pt-24 sm:pt-28">
      <div className="mobile-shell mx-auto">
        <Link to={property.listing === "venda" ? "/venda" : "/aluguel"} className="mb-6 inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary">
          <ArrowLeft size={16} /> Voltar
        </Link>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
              <div className="mb-4 overflow-hidden rounded-lg aspect-[16/10]">
                <LazyImage src={currentImage} alt={property.title} width={1200} height={760} />
              </div>

              {gallery.length > 1 ? (
                <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {gallery.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() => setSelectedImage(index)}
                      className={`overflow-hidden rounded-lg border transition ${index === selectedImage ? "border-primary ring-2 ring-primary/20" : "border-border"}`}
                    >
                      <LazyImage src={image} alt={`${property.title} ${index + 1}`} width={320} height={220} className="aspect-[4/3] object-cover" />
                    </button>
                  ))}
                </div>
              ) : null}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin size={14} />
                <span>{property.location}, {property.city} - {property.state}</span>
              </div>
              <h1 className="mb-4 font-serif text-3xl font-bold text-foreground md:text-4xl">{property.title}</h1>

              <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                {property.bedrooms > 0 ? <span className="flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm text-foreground"><Bed size={16} /> {property.bedrooms} quartos</span> : null}
                {property.bathrooms > 0 ? <span className="flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm text-foreground"><Bath size={16} /> {property.bathrooms} banheiros</span> : null}
                <span className="flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm text-foreground"><Maximize size={16} /> {property.area}m2</span>
                {property.maxGuests > 0 ? <span className="flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm text-foreground"><Users size={16} /> {property.maxGuests} hospedes</span> : null}
                {property.minNights > 0 ? <span className="flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm text-foreground"><Clock size={16} /> Min. {property.minNights} noites</span> : null}
                <span className="flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm text-foreground"><Clock size={16} /> Check-in {property.checkInTime}</span>
              </div>

              <h2 className="mb-4 font-serif text-xl font-semibold text-foreground">Descricao</h2>
              <p className="mb-8 leading-relaxed text-muted-foreground">{property.description}</p>

              <h2 className="mb-4 font-serif text-xl font-semibold text-foreground">Comodidades</h2>
              <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3">
                {property.amenities.map((amenity) => (
                  <span key={amenity} className="flex items-center gap-2 text-sm text-foreground">
                    <Check size={14} className="text-primary" /> {amenity}
                  </span>
                ))}
              </div>

              <h2 className="mb-4 font-serif text-xl font-semibold text-foreground">Localizacao</h2>
              <PropertyMap property={property} />
            </motion.div>
          </div>

          <div className="lg:col-span-1">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="sticky top-28">
              <div className="rounded-lg bg-card p-8 shadow-luxury">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold uppercase text-primary-foreground">
                    {property.listing === "venda" ? "Venda" : "Hospedagem"}
                  </span>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs capitalize text-muted-foreground">{property.type}</span>
                </div>
                <p className="mb-6 text-3xl font-bold text-primary">{formatPrice(property.price, property.priceLabel)}</p>

                <div className="mb-6 space-y-2 rounded-2xl border border-border bg-background p-4 text-sm text-muted-foreground">
                  <p><strong className="text-foreground">Codigo:</strong> {property.code}</p>
                  <p><strong className="text-foreground">Status:</strong> {property.status}</p>
                  <p><strong className="text-foreground">Check-in:</strong> {property.checkInTime}</p>
                  <p><strong className="text-foreground">Check-out:</strong> {property.checkOutTime}</p>
                </div>

                <a
                  href={`https://wa.me/55${CONTACT_PHONE_RAW}?text=${encodeURIComponent(`Ola! Tenho interesse na propriedade ${property.title}.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button-pop mb-3 block w-full rounded-full bg-gradient-gold py-4 text-center font-semibold text-gold-foreground transition-all hover:shadow-gold"
                  data-magnetic
                >
                  <Phone size={16} className="mr-2 inline" /> {contactLabel}
                </a>

                <div className="flex gap-3">
                  <button className="flex flex-1 items-center justify-center gap-2 rounded-full border border-border py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted">
                    <Heart size={14} /> Favoritar
                  </button>
                  <button className="flex flex-1 items-center justify-center gap-2 rounded-full border border-border py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted">
                    <Share2 size={14} /> Compartilhar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
