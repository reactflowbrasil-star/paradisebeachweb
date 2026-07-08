export type PropertyRecord = {
  id: string;
  title: string;
  type: "casa" | "villa" | "apartamento" | "terreno";
  listing: "venda" | "aluguel";
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
  status: "disponivel" | "vendido" | "alugado";
  amenities: string[];
  lat: number | null;
  lng: number | null;
  whatsapp: string | null;
  booking_method: "whatsapp" | "email" | "phone" | "manual" | "external";
  booking_url: string | null;
  booking_notes: string | null;
  min_nights: number;
  max_guests: number;
  created_at?: string;
  updated_at?: string;
};

export type PropertyPhoto = {
  id: string;
  property_id: string;
  url: string;
  caption: string;
  published: boolean;
  cover: boolean;
  sort_order: number;
  created_at?: string;
};

export type ReservationRecord = {
  id: string;
  property_id: string;
  guest_name: string;
  email: string;
  phone: string | null;
  check_in: string;
  check_out: string;
  status: "confirmada" | "pendente" | "cancelada";
  total: number;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
};

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? window.localStorage.getItem("pb_admin_token") : null;
  const headers: Record<string, string> = { ...(init?.headers as Record<string, string> | undefined) };
  if (!(init?.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const response = await fetch(url, { ...init, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "Erro na API");
  }
  return payload as T;
}

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string }>("/api/admin/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  getMe: () => request<{ admin: { id: string; email: string } }>("/api/admin/me"),
  getProperties: () => request<{ properties: PropertyRecord[]; photos: PropertyPhoto[] }>("/api/properties"),
  getProperty: (id: string) => request<{ property: PropertyRecord; photos: PropertyPhoto[] }>(`/api/properties/${id}`),
  createProperty: (data: Partial<PropertyRecord>) => request<{ id: string }>("/api/properties", { method: "POST", body: JSON.stringify(data) }),
  updateProperty: (id: string, data: Partial<PropertyRecord>) => request<{ ok: boolean }>(`/api/properties/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteProperty: (id: string) => request<{ ok: boolean }>(`/api/properties/${id}`, { method: "DELETE" }),
  uploadPhotos: (propertyId: string, files: FileList | File[]) => {
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("photos", file));
    return request<{ photos: PropertyPhoto[] }>(`/api/properties/${propertyId}/photos`, { method: "POST", body: formData });
  },
  updatePhoto: (id: string, data: Partial<PropertyPhoto>) => request<{ ok: boolean }>(`/api/photos/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deletePhoto: (id: string) => request<{ ok: boolean }>(`/api/photos/${id}`, { method: "DELETE" }),
  getReservations: () => request<{ reservations: ReservationRecord[] }>("/api/reservations"),
  createReservation: (data: Partial<ReservationRecord>) => request<{ id: string }>("/api/reservations", { method: "POST", body: JSON.stringify(data) }),
  updateReservation: (id: string, data: Partial<ReservationRecord>) => request<{ ok: boolean }>(`/api/reservations/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteReservation: (id: string) => request<{ ok: boolean }>(`/api/reservations/${id}`, { method: "DELETE" }),
};

