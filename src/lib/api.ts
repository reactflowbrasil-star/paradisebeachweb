export type PropertyType = "casa" | "villa" | "apartamento" | "terreno";
export type ListingType = "venda" | "aluguel";
export type PropertyStatus = "disponivel" | "vendido" | "alugado";
export type ReservationStatus = "confirmada" | "pendente" | "cancelada";
export type PaymentMethod =
  | "pix"
  | "cartao_credito"
  | "cartao_debito"
  | "transferencia"
  | "boleto"
  | "dinheiro";
export type PaymentStatus = "pendente" | "parcial" | "pago" | "reembolsado" | "cancelado";
export type GuestType = "adulto" | "crianca" | "bebe";
export type PreCheckinStatus = "pendente" | "confirmado" | "atrasado" | "dispensado";

export interface DbReservationGuest {
  id: string;
  reservation_id: string;
  client_id: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  document: string | null;
  birth_date: string | null;
  guest_type: GuestType;
  is_primary: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbReservationPayment {
  id: string;
  reservation_id: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  currency: string;
  reference_code: string | null;
  external_transaction_id: string | null;
  installments: number;
  due_at: string | null;
  paid_at: string | null;
  pix_qr_code: string | null;
  pix_copy_paste: string | null;
  card_brand: string | null;
  card_last4: string | null;
  receipt_url: string | null;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

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
  client_id: string | null;
  booking_code: string | null;
  guest_name: string;
  email: string;
  check_in: string;
  check_out: string;
  status: ReservationStatus;
  adults_count: number;
  children_count: number;
  infants_count: number;
  special_requests: string | null;
  payment_method: PaymentMethod | null;
  payment_status: PaymentStatus;
  paid_amount: number;
  total: number;
  payment_due_date: string | null;
  payment_reference: string | null;
  payment_installments: number;
  payment_receipt_url: string | null;
  payment_gateway: string | null;
  payment_metadata: Record<string, unknown> | null;
  payment_notes: string | null;
  pre_checkin_status: PreCheckinStatus;
  pre_checkin_confirmed_at: string | null;
  pre_checkin_due_at: string | null;
  pre_checkin_notes: string | null;
  notes: string | null;
  guests: DbReservationGuest[];
  payments: DbReservationPayment[];
  created_at: string;
  updated_at: string;
}

export interface DbClient {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  document: string | null;
  document_type: string | null;
  birth_date: string | null;
  nationality: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  zip_code: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  vip_status: boolean;
  tags_json: string[] | null;
  profile_photo_url: string | null;
  preferred_payment_method: PaymentMethod | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type CmsStatus = "draft" | "published" | "inactive";

export interface CmsPageSummary {
  id: string;
  slug: string;
  page_key: string;
  name: string;
  title: string | null;
  description: string | null;
  template: string;
  status: CmsStatus;
  sort_order: number;
  section_count: number;
  content_count: number;
  created_at: string;
  updated_at: string;
}

export interface CmsSection {
  id: string;
  page_id: string;
  section_key: string;
  name: string;
  section_type: string;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  text_content: string | null;
  image_url: string | null;
  link_url: string | null;
  button_label: string | null;
  media_id: string | null;
  config_json: Record<string, unknown> | null;
  sort_order: number;
  status: CmsStatus;
  item_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CmsContentItem {
  id: string;
  page_id: string;
  section_id: string | null;
  item_type: string;
  category: string | null;
  content_key: string;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  text_content: string | null;
  image_url: string | null;
  icon_name: string | null;
  link_url: string | null;
  button_label: string | null;
  media_id?: string | null;
  meta_json: Record<string, unknown> | null;
  sort_order: number;
  status: CmsStatus;
  page_name?: string;
  page_slug?: string;
  section_name?: string;
  section_key?: string;
  created_at: string;
  updated_at: string;
}

export interface CmsMenuItem {
  id: string;
  menu_key: string;
  label: string;
  url: string;
  page_id: string | null;
  parent_id: string | null;
  target: string;
  css_class: string | null;
  sort_order: number;
  status: CmsStatus;
  page_slug?: string | null;
  children?: CmsMenuItem[];
  created_at: string;
  updated_at: string;
}

export interface CmsSiteSetting {
  id: string;
  setting_group: string;
  setting_key: string;
  label: string;
  value_type: "text" | "textarea" | "number" | "boolean" | "json" | "url" | "email" | "phone";
  setting_value: string | null;
  sort_order: number;
  status: CmsStatus;
  created_at: string;
  updated_at: string;
}

export interface CmsSeoMetadata {
  id: string;
  page_id: string | null;
  route_path: string;
  seo_title: string | null;
  seo_description: string | null;
  canonical_url: string | null;
  og_image_url: string | null;
  robots: string | null;
  schema_json: Record<string, unknown> | null;
  status: CmsStatus;
  created_at: string;
  updated_at: string;
}

export interface PublicPagePayload {
  page: Omit<CmsPageSummary, "section_count" | "content_count">;
  seo: CmsSeoMetadata | null;
  sections: Array<CmsSection & { items: CmsContentItem[] }>;
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

export function apiUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}

function buildQuery(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  });
  const output = search.toString();
  return output ? `?${output}` : "";
}

export function getImageUrl(path: string) {
  if (!path) return "/placeholder.svg";
  if (path.startsWith("http") || path.startsWith("data:")) return path;
  if (path.startsWith("/")) return `${API_BASE_URL}${path}`;
  return `${API_BASE_URL}/${path}`;
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
    files.forEach((file) => formData.append("photos[]", file));

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
  getReservations: (clientId?: string) =>
    request<DbReservation[]>(
      clientId ? `/api/reservations.php?client_id=${encodeURIComponent(clientId)}` : "/api/reservations.php"
    ),
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
  getSettings: () => request<Record<string, string>>("/api/settings.php"),
  updateSettings: (payload: Record<string, string>) =>
    request<{ message: string }>("/api/settings.php", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getAdminPages: () => request<CmsPageSummary[]>("/api/admin/pages"),
  getAdminPageSections: (pageId: string) => request<{ page: CmsPageSummary; sections: CmsSection[] }>(`/api/admin/pages/${encodeURIComponent(pageId)}/sections`),
  updateAdminSection: (id: string, payload: Partial<CmsSection>) =>
    request<CmsSection>(`/api/admin/sections/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  getAdminContent: (filters?: { page_id?: string; section_id?: string; status?: CmsStatus; item_type?: string }) =>
    request<CmsContentItem[]>(`/api/admin/content${buildQuery(filters || {})}`),
  getAdminContentItem: (id: string) => request<CmsContentItem>(`/api/admin/content/${encodeURIComponent(id)}`),
  createAdminContent: (payload: Partial<CmsContentItem>) =>
    request<CmsContentItem>("/api/admin/content", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateAdminContent: (id: string, payload: Partial<CmsContentItem>) =>
    request<CmsContentItem>(`/api/admin/content/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  updateAdminContentStatus: (id: string, status: CmsStatus) =>
    request<CmsContentItem>(`/api/admin/content/${encodeURIComponent(id)}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  deleteAdminContent: (id: string) =>
    request<void>(`/api/admin/content/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
  getAdminMenus: (menuKey?: string) =>
    request<CmsMenuItem[]>(`/api/admin/menus${buildQuery({ menu_key: menuKey })}`),
  updateAdminMenu: (id: string, payload: Partial<CmsMenuItem>) =>
    request<CmsMenuItem>(`/api/admin/menus/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  getAdminSiteSettings: () => request<CmsSiteSetting[]>("/api/admin/site-settings"),
  updateAdminSiteSetting: (id: string, payload: Partial<CmsSiteSetting>) =>
    request<CmsSiteSetting>(`/api/admin/site-settings/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  getPublicPage: (slug: string) => request<PublicPagePayload>(`/api/public/pages/${encodeURIComponent(slug)}`),
  getPublicSiteSettings: () => request<Record<string, unknown>>("/api/public/site-settings"),
  getPublicMenu: (menuKey = "main") => request<CmsMenuItem[]>(`/api/public/menu${buildQuery({ menu_key: menuKey })}`),
  getClients: () => request<DbClient[]>("/api/clients.php"),
  getClient: (id: string) => request<DbClient>(`/api/client.php?id=${encodeURIComponent(id)}`),
  createClient: (payload: Partial<DbClient>) =>
    request<DbClient>("/api/clients.php", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateClient: (id: string, payload: Partial<DbClient>) =>
    request<DbClient>(`/api/client.php?id=${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteClient: (id: string) =>
    request<void>(`/api/client.php?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
  uploadClientPhoto: async (file: File) => {
    const formData = new FormData();
    formData.append("photo", file);
    const response = await fetch(apiUrl("/api/upload-client-photo.php"), {
      method: "POST",
      body: formData,
    });
    if (!response.ok) throw new Error("Erro ao enviar foto do cliente.");
    return parseResponse<{ url: string }>(response, "Resposta inválida.");
  },
  uploadSitePhoto: async (file: File) => {
    const formData = new FormData();
    formData.append("photo", file);
    const response = await fetch(apiUrl("/api/upload-site.php"), {
      method: "POST",
      body: formData,
    });
    if (!response.ok) throw new Error("Erro ao enviar imagem.");
    return parseResponse<{ url: string }>(response, "Resposta inválida.");
  },
};
