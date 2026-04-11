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

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const fallback = "Erro ao processar a requisição.";
    const data = await response.json().catch(() => ({ message: fallback }));
    throw new Error(data.message || fallback);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; user: { email: string } }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  getProperties: () => request<DbProperty[]>("/api/properties"),
  getProperty: (id: string) => request<DbProperty>(`/api/properties/${id}`),
  createProperty: (payload: Partial<DbProperty>) =>
    request<DbProperty>("/api/properties", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateProperty: (id: string, payload: Partial<DbProperty>) =>
    request<DbProperty>(`/api/properties/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteProperty: (id: string) =>
    request<void>(`/api/properties/${id}`, { method: "DELETE" }),
  getPhotos: () => request<DbPhoto[]>("/api/photos"),
  uploadPhotos: async (propertyId: string, files: File[]) => {
    const formData = new FormData();
    formData.append("property_id", propertyId);
    files.forEach((file) => formData.append("photos", file));
    const response = await fetch("/api/photos/upload", {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({ message: "Erro ao enviar as fotos." }));
      throw new Error(data.message || "Erro ao enviar as fotos.");
    }
    return response.json() as Promise<DbPhoto[]>;
  },
  updatePhoto: (id: string, payload: Partial<DbPhoto>) =>
    request<DbPhoto>(`/api/photos/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deletePhoto: (id: string) => request<void>(`/api/photos/${id}`, { method: "DELETE" }),
  getReservations: () => request<DbReservation[]>("/api/reservations"),
  createReservation: (payload: Partial<DbReservation>) =>
    request<DbReservation>("/api/reservations", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateReservation: (id: string, payload: Partial<DbReservation>) =>
    request<DbReservation>(`/api/reservations/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
};
