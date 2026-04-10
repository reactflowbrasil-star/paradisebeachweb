import { useEffect, useState } from "react";
import { supabase, SUPABASE_CONFIGURED } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type DbProperty = Tables<"properties">;
export type DbPhoto = Tables<"property_photos">;

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
}

function mapDbToProperty(p: DbProperty, photos: DbPhoto[]): Property {
  const propertyPhotos = photos
    .filter((ph) => ph.property_id === p.id && ph.published)
    .sort((a, b) => {
      if (a.cover && !b.cover) return -1;
      if (!a.cover && b.cover) return 1;
      return a.sort_order - b.sort_order;
    });

  const images = propertyPhotos.length > 0
    ? propertyPhotos.map((ph) => ph.url)
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
    lat: Number(p.lat ?? 0),
    lng: Number(p.lng ?? 0),
  };
}

export function useProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!SUPABASE_CONFIGURED) {
      setLoading(false);
      return;
    }

    async function fetch() {
      const [{ data: props }, { data: photos }] = await Promise.all([
        supabase.from("properties").select("*").order("created_at", { ascending: false }),
        supabase.from("property_photos").select("*"),
      ]);

      if (props) {
        setProperties(props.map((p) => mapDbToProperty(p, photos ?? [])));
      }
      setLoading(false);
    }

    fetch();
  }, []);

  return { properties, loading };
}

export function useProperty(id: string | undefined) {
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!SUPABASE_CONFIGURED || !id) {
      setLoading(false);
      return;
    }

    async function fetch() {
      const [{ data: prop }, { data: photos }] = await Promise.all([
        supabase.from("properties").select("*").eq("id", id!).single(),
        supabase.from("property_photos").select("*").eq("property_id", id!),
      ]);

      if (prop) {
        setProperty(mapDbToProperty(prop, photos ?? []));
      }
      setLoading(false);
    }

    fetch();
  }, [id]);

  return { property, loading };
}

export const formatPrice = (price: number, label?: string) =>
  `R$ ${price.toLocaleString("pt-BR")}${label || ""}`;
