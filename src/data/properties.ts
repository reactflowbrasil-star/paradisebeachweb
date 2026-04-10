import property1 from "@/assets/property-1.jpg";
import property2 from "@/assets/property-2.jpg";
import property3 from "@/assets/property-3.jpg";
import property4 from "@/assets/property-4.jpg";
import property5 from "@/assets/property-5.jpg";
import property6 from "@/assets/property-6.jpg";

export type PropertyType = "casa" | "villa" | "apartamento" | "terreno";
export type PropertyListing = "venda" | "aluguel";
export type PropertyStatus = "disponivel" | "indisponivel" | "manutencao" | "vendido" | "alugado";

export interface Property {
  id: string;
  code: string;
  title: string;
  type: PropertyType;
  listing: PropertyListing;
  price: number;
  priceLabel?: string;
  location: string;
  city: string;
  state: string;
  description: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  maxGuests: number;
  minNights: number;
  checkInTime: string;
  checkOutTime: string;
  oceanView: boolean;
  featured: boolean;
  status: PropertyStatus;
  images: string[];
  amenities: string[];
  lat: number;
  lng: number;
}

export const defaultProperties: Property[] = [
  {
    id: "1",
    code: "PB-101",
    title: "Villa Paradiso Frente Mar",
    type: "villa",
    listing: "venda",
    price: 8500000,
    location: "Praia do Espelho",
    city: "Trancoso",
    state: "BA",
    description: "Villa de alto padrao com acesso privativo a praia, piscina infinita e amplos ambientes integrados para viver ou investir no litoral.",
    bedrooms: 5,
    bathrooms: 6,
    area: 650,
    maxGuests: 12,
    minNights: 2,
    checkInTime: "14:00",
    checkOutTime: "11:00",
    oceanView: true,
    featured: true,
    status: "disponivel",
    images: [property1],
    amenities: ["Piscina infinita", "Acesso a praia", "Jardim tropical", "Cozinha gourmet", "Suite master", "Garagem"],
    lat: -16.4536,
    lng: -39.0972,
  },
  {
    id: "2",
    code: "PB-102",
    title: "Penthouse Sky Ocean",
    type: "apartamento",
    listing: "venda",
    price: 4200000,
    location: "Beira Mar",
    city: "Florianopolis",
    state: "SC",
    description: "Penthouse exclusiva com vista panoramica, terraco amplo e acabamento premium em uma das regioes mais valorizadas do litoral.",
    bedrooms: 4,
    bathrooms: 5,
    area: 380,
    maxGuests: 8,
    minNights: 2,
    checkInTime: "14:00",
    checkOutTime: "11:00",
    oceanView: true,
    featured: true,
    status: "disponivel",
    images: [property2],
    amenities: ["Vista 360", "Terraco", "Automacao", "Piscina privativa", "Duas vagas", "Portaria"],
    lat: -27.5954,
    lng: -48.548,
  },
  {
    id: "3",
    code: "PB-201",
    title: "Refugio Tropical Bali Style",
    type: "villa",
    listing: "aluguel",
    price: 3500,
    priceLabel: "/diaria",
    location: "Praia de Itapororoca",
    city: "Trancoso",
    state: "BA",
    description: "Hospedagem premium com piscina privativa, deck de madeira e experiencia exclusiva para familias, casais ou pequenos grupos.",
    bedrooms: 4,
    bathrooms: 4,
    area: 420,
    maxGuests: 10,
    minNights: 2,
    checkInTime: "15:00",
    checkOutTime: "12:00",
    oceanView: true,
    featured: true,
    status: "disponivel",
    images: [property3],
    amenities: ["Piscina privativa", "Deck de madeira", "Praia privativa", "Wi-Fi", "Ar-condicionado", "Chef sob consulta"],
    lat: -16.5883,
    lng: -39.0953,
  },
  {
    id: "4",
    code: "PB-202",
    title: "Residencial Azure Tower",
    type: "apartamento",
    listing: "aluguel",
    price: 1800,
    priceLabel: "/diaria",
    location: "Praia de Maresias",
    city: "Sao Sebastiao",
    state: "SP",
    description: "Apartamento de temporada com estrutura completa, servicos de apoio e localizacao privilegiada para estadias confortaveis.",
    bedrooms: 3,
    bathrooms: 4,
    area: 220,
    maxGuests: 7,
    minNights: 2,
    checkInTime: "14:00",
    checkOutTime: "11:00",
    oceanView: true,
    featured: true,
    status: "disponivel",
    images: [property4],
    amenities: ["Piscina", "Academia", "Sauna", "Quadra", "Seguranca 24h", "Playground"],
    lat: -23.7898,
    lng: -45.5654,
  },
  {
    id: "5",
    code: "PB-301",
    title: "Terreno Praia dos Sonhos",
    type: "terreno",
    listing: "venda",
    price: 3200000,
    location: "Praia dos Coqueiros",
    city: "Marau",
    state: "BA",
    description: "Terreno frente mar com metragem generosa para desenvolvimento de empreendimento de hospedagem ou residencia exclusiva.",
    bedrooms: 0,
    bathrooms: 0,
    area: 2500,
    maxGuests: 0,
    minNights: 0,
    checkInTime: "14:00",
    checkOutTime: "11:00",
    oceanView: true,
    featured: false,
    status: "disponivel",
    images: [property5],
    amenities: ["Frente mar", "Escritura", "Acesso pavimentado", "Energia", "Agua encanada", "Area preservada"],
    lat: -14.0989,
    lng: -38.9981,
  },
  {
    id: "6",
    code: "PB-203",
    title: "Mansao Cliff Edge",
    type: "casa",
    listing: "aluguel",
    price: 6500,
    priceLabel: "/diaria",
    location: "Praia da Ferradura",
    city: "Buzios",
    state: "RJ",
    description: "Casa de temporada com vista panoramica, estrutura completa de lazer e experiencia premium para estadias memoraveis.",
    bedrooms: 6,
    bathrooms: 8,
    area: 900,
    maxGuests: 14,
    minNights: 3,
    checkInTime: "15:00",
    checkOutTime: "12:00",
    oceanView: true,
    featured: true,
    status: "disponivel",
    images: [property6],
    amenities: ["Piscina infinita", "Spa", "Cinema", "Adega", "Area gourmet", "Vista mar"],
    lat: -22.7669,
    lng: -41.8818,
  },
];

export const properties = defaultProperties;

export const formatPrice = (price: number, label?: string) => `R$ ${price.toLocaleString("pt-BR")}${label || ""}`;
