import property1 from "@/assets/property-1.jpg";
import property2 from "@/assets/property-2.jpg";
import property3 from "@/assets/property-3.jpg";
import property4 from "@/assets/property-4.jpg";
import property5 from "@/assets/property-5.jpg";
import property6 from "@/assets/property-6.jpg";

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

export const properties: Property[] = [
  {
    id: "1",
    title: "Villa Paradiso — Frente ao Mar",
    type: "villa",
    listing: "venda",
    price: 8500000,
    location: "Praia do Espelho",
    city: "Trancoso",
    state: "BA",
    description: "Villa deslumbrante com acesso privativo à praia, piscina infinita e jardim tropical exuberante. Arquitetura contemporânea que se harmoniza perfeitamente com a natureza circundante. Acabamentos de altíssimo padrão, cozinha gourmet completa e amplas varandas com vista panorâmica para o oceano.",
    bedrooms: 5,
    bathrooms: 6,
    area: 650,
    oceanView: true,
    featured: true,
    status: "disponivel",
    images: [property1],
    amenities: ["Piscina Infinita", "Acesso à Praia", "Jardim Tropical", "Cozinha Gourmet", "Suíte Master", "Garagem 4 Carros"],
    lat: -16.4536,
    lng: -39.0972,
  },
  {
    id: "2",
    title: "Penthouse Sky Ocean",
    type: "apartamento",
    listing: "venda",
    price: 4200000,
    location: "Beira Mar",
    city: "Florianópolis",
    state: "SC",
    description: "Penthouse exclusiva com vista 360° do oceano e da cidade. Terraço amplo, acabamentos em mármore italiano e automação residencial completa. Localização privilegiada na região mais nobre da ilha.",
    bedrooms: 4,
    bathrooms: 5,
    area: 380,
    oceanView: true,
    featured: true,
    status: "disponivel",
    images: [property2],
    amenities: ["Vista 360°", "Terraço Panorâmico", "Automação", "Mármore Italiano", "Piscina Privativa", "2 Vagas"],
    lat: -27.5954,
    lng: -48.5480,
  },
  {
    id: "3",
    title: "Refúgio Tropical Bali Style",
    type: "villa",
    listing: "aluguel",
    price: 3500,
    priceLabel: "/diária",
    location: "Praia de Itapororoca",
    city: "Trancoso",
    state: "BA",
    description: "Villa no estilo balinês com piscina privativa, deck de madeira nobre e acesso direto à praia. Perfeita para férias inesquecíveis em família ou retiro de luxo.",
    bedrooms: 4,
    bathrooms: 4,
    area: 420,
    oceanView: true,
    featured: true,
    status: "disponivel",
    images: [property3],
    amenities: ["Piscina Privativa", "Deck de Madeira", "Praia Privativa", "Chef Disponível", "Wi-Fi", "Ar Condicionado"],
    lat: -16.5883,
    lng: -39.0953,
  },
  {
    id: "4",
    title: "Residencial Azure Tower",
    type: "apartamento",
    listing: "venda",
    price: 2800000,
    location: "Praia de Maresias",
    city: "São Sebastião",
    state: "SP",
    description: "Apartamento de alto padrão no condomínio mais exclusivo da região. Infraestrutura completa de lazer, segurança 24h e localização privilegiada a poucos passos da praia.",
    bedrooms: 3,
    bathrooms: 4,
    area: 220,
    oceanView: true,
    featured: true,
    status: "disponivel",
    images: [property4],
    amenities: ["Piscina", "Academia", "Sauna", "Quadra de Tênis", "Segurança 24h", "Playground"],
    lat: -23.7898,
    lng: -45.5654,
  },
  {
    id: "5",
    title: "Terreno Praia dos Sonhos",
    type: "terreno",
    listing: "venda",
    price: 3200000,
    location: "Praia dos Coqueiros",
    city: "Maraú",
    state: "BA",
    description: "Terreno excepcional de frente para o mar com 2.500m² em uma das praias mais preservadas do litoral baiano. Ideal para construir a residência dos seus sonhos em um verdadeiro paraíso.",
    bedrooms: 0,
    bathrooms: 0,
    area: 2500,
    oceanView: true,
    featured: true,
    status: "disponivel",
    images: [property5],
    amenities: ["Frente ao Mar", "Escritura Definitiva", "Acesso Pavimentado", "Energia Elétrica", "Água Encanada", "Área Preservada"],
    lat: -14.0989,
    lng: -38.9981,
  },
  {
    id: "6",
    title: "Mansão Cliff Edge",
    type: "casa",
    listing: "venda",
    price: 12000000,
    location: "Praia da Ferradura",
    city: "Búzios",
    state: "RJ",
    description: "Mansão espetacular no topo do penhasco com vista infinita para o oceano. Piscina de borda infinita, heliponto, spa completo e 6 suítes de luxo. Uma propriedade verdadeiramente única no litoral brasileiro.",
    bedrooms: 6,
    bathrooms: 8,
    area: 900,
    oceanView: true,
    featured: true,
    status: "disponivel",
    images: [property6],
    amenities: ["Piscina Infinita", "Heliponto", "Spa", "Cinema", "Adega Climatizada", "Elevador"],
    lat: -22.7669,
    lng: -41.8818,
  },
];

export const formatPrice = (price: number, label?: string) => {
  return `R$ ${price.toLocaleString("pt-BR")}${label || ""}`;
};
