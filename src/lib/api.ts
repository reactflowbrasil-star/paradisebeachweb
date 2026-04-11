export type PropertyType = "casa" | "villa" | "apartamento" | "terreno";
export type ListingType = "venda" | "aluguel";
export type PropertyStatus = "disponivel" | "vendido" | "alugado";
export type ReservationStatus = "confirmada" | "pendente" | "cancelada";

export interface DbProperty {
  id: string;
  title: string;
  type: PropertyType;
  listing: ListingType;
  price: number;
  price_label: string | null;
  location: string;
  city: string;
  state: string;
  description: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  ocean_view: boolean;
  featured: boolean;
  status: PropertyStatus;
  amenities: string[];
  lat: number | null;
  lng: number | null;
  whatsapp: string | null;
  address: string | null;
  cep: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbPhoto {
  id: string;
  property_id: string;
  url: string;
  caption: string;
  published: boolean;
  cover: boolean;
  sort_order: number;
  created_at: string;
}

export interface DbReservation {
  id: string;
  property_id: string;
  guest_name: string;
  email: string;
  check_in: string;
  check_out: string;
  status: ReservationStatus;
  total: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const runtimeApiBaseUrl = (() => {
  if (typeof window === "undefined") return "";
  const host = window.location.hostname;
  // Local dev: proxy handled by Vite
  if (host === "localhost" || host === "127.0.0.1" || host === "::1") {
    return "";
  }
  // Same-origin when served from the main domain (no CORS needed)
  if (host === "paradisebeach.com.br" || host === "www.paradisebeach.com.br") {
    return "";
  }
  // External domains (lovable.app, etc.) → cross-origin to production API
  return "https://paradisebeach.com.br";
})();

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || runtimeApiBaseUrl).replace(/\/$/, "");

function apiUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}

async function parseResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();

  if (!text) {
    return undefined as T;
  }

  if (contentType.includes("application/json")) {
    return JSON.parse(text) as T;
  }

  if (text.trimStart().startsWith("<")) {
    throw new Error(
      "A API retornou HTML em vez de JSON. Verifique se o backend está ativo e se o navegador não está usando um service worker antigo."
    );
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(fallbackMessage);
  }
}

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(input), {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const fallback = "Erro ao processar a requisição.";
    const data = await parseResponse<{ message?: string }>(response, fallback).catch(() => ({ message: fallback }));
    throw new Error(data.message || fallback);
  }

  return parseResponse<T>(response, "Resposta inválida da API.");
}

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; user: { email: string } }>("/api/auth/login.php", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  getProperties: () => request<DbProperty[]>("/api/properties.php"),
  getProperty: (id: string) => request<DbProperty>(`/api/property.php?id=${encodeURIComponent(id)}`),
  createProperty: (payload: Partial<DbProperty>) =>
    request<DbProperty>("/api/properties.php", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateProperty: (id: string, payload: Partial<DbProperty>) =>
    request<DbProperty>(`/api/property.php?id=${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteProperty: (id: string) =>
    request<void>(`/api/property.php?id=${encodeURIComponent(id)}`, { method: "DELETE" }),
  getPhotos: () => request<DbPhoto[]>("/api/photos.php"),
  uploadPhotos: async (propertyId: string, files: File[]) => {
    const formData = new FormData();
    formData.append("property_id", propertyId);
    files.forEach((file) => formData.append("photos", file));

    const response = await fetch(apiUrl("/api/upload-photos.php"), {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const data = await parseResponse<{ message?: string }>(response, "Erro ao enviar as fotos.").catch(() => ({
        message: "Erro ao enviar as fotos.",
      }));
      throw new Error(data.message || "Erro ao enviar as fotos.");
    }

    return parseResponse<DbPhoto[]>(response, "Resposta inválida ao enviar fotos.");
  },
  updatePhoto: (id: string, payload: Partial<DbPhoto>) =>
    request<DbPhoto>(`/api/photo.php?id=${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deletePhoto: (id: string) => request<void>(`/api/photo.php?id=${encodeURIComponent(id)}`, { method: "DELETE" }),
  getReservations: () => request<DbReservation[]>("/api/reservations.php"),
  createReservation: (payload: Partial<DbReservation>) =>
    request<DbReservation>("/api/reservations.php", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateReservation: (id: string, payload: Partial<DbReservation>) =>
    request<DbReservation>(`/api/reservation.php?id=${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
};
