import { useEffect, useState } from "react";
import { api, type DbPhoto, type DbProperty, getImageUrl } from "@/lib/api";

export type { DbPhoto, DbProperty } from "@/lib/api";

export interface Property {
  id: string;
  title: string;
  type: "casa" | "villa" | "apartamento" | "terreno";
  listing: "venda" | "aluguel";
  price: number;
  priceLabel?: string;
  location: string;
  city: string;
  state: string;
  description: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  oceanView: boolean;
  featured: boolean;
  status: "disponivel" | "vendido" | "alugado";
  images: string[];
  amenities: string[];
  lat: number;
  lng: number;
  whatsapp: string;
}

function parseSafeCoord(value: number | string | null | undefined): number {
  if (value == null || value === "") return NaN;
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

function mapDbToProperty(p: DbProperty, photos: DbPhoto[]): Property {
  const propertyPhotos = photos
    .filter((ph) => ph.property_id === p.id && ph.published)
    .sort((a, b) => {
      if (a.cover && !b.cover) return -1;
      if (!a.cover && b.cover) return 1;
      return a.sort_order - b.sort_order;
    });

  const images =
    propertyPhotos.length > 0
      ? propertyPhotos.map((ph) => getImageUrl(ph.url))
      : ["/placeholder.svg"];

  return {
    id: p.id,
    title: p.title,
    type: p.type,
    listing: p.listing,
    price: Number(p.price),
    priceLabel: p.price_label ?? undefined,
    location: p.location,
    city: p.city,
    state: p.state,
    description: p.description,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    area: Number(p.area),
    oceanView: p.ocean_view,
    featured: p.featured,
    status: p.status,
    images,
    amenities: p.amenities ?? [],
    lat: parseSafeCoord(p.lat),
    lng: parseSafeCoord(p.lng),
    whatsapp: p.whatsapp ?? "",
  };
}

export function useProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [props, photos] = await Promise.all([api.getProperties(), api.getPhotos()]);
        setProperties(props.map((property) => mapDbToProperty(property, photos)));
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return { properties, loading };
}

export function useProperty(id: string | undefined) {
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const [prop, photos] = await Promise.all([api.getProperty(id), api.getPhotos()]);
        setProperty(mapDbToProperty(prop, photos));
      } catch {
        setProperty(null);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);

  return { property, loading };
}

export const formatPrice = (price: number, label?: string) =>
  `R$ ${price.toLocaleString("pt-BR")}${label || ""}`;
