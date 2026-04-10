import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Property, defaultProperties } from "@/data/properties";

export type ReservationStatus = "nova" | "confirmada" | "check-in" | "check-out" | "cancelada";
export type ReservationSource = "site" | "whatsapp" | "booking" | "manual";

export interface Reservation {
  id: string;
  propertyId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  total: number;
  deposit: number;
  source: ReservationSource;
  status: ReservationStatus;
  notes: string;
  createdAt: string;
}

interface HotelAdminContextValue {
  properties: Property[];
  reservations: Reservation[];
  saveProperty: (property: Property) => void;
  deleteProperty: (propertyId: string) => void;
  saveReservation: (reservation: Reservation) => void;
  deleteReservation: (reservationId: string) => void;
  updateReservationStatus: (reservationId: string, status: ReservationStatus) => void;
  resetDemoData: () => void;
}

const STORAGE_KEYS = {
  properties: "hotel.admin.properties.v2",
  reservations: "hotel.admin.reservations.v2",
} as const;

const initialReservations: Reservation[] = [
  {
    id: "RES-1001",
    propertyId: "3",
    guestName: "Ana Ferreira",
    guestEmail: "ana@email.com",
    guestPhone: "(83) 99999-1001",
    checkIn: "2026-05-12",
    checkOut: "2026-05-18",
    adults: 2,
    children: 1,
    total: 21000,
    deposit: 5000,
    source: "whatsapp",
    status: "confirmada",
    notes: "Solicitou berco e check-in apos 16h.",
    createdAt: "2026-04-01",
  },
  {
    id: "RES-1002",
    propertyId: "4",
    guestName: "Lucas Nascimento",
    guestEmail: "lucas@email.com",
    guestPhone: "(83) 99999-1002",
    checkIn: "2026-06-03",
    checkOut: "2026-06-10",
    adults: 4,
    children: 0,
    total: 12600,
    deposit: 3000,
    source: "site",
    status: "nova",
    notes: "Aguardando confirmacao de pagamento.",
    createdAt: "2026-04-04",
  },
];

const HotelAdminContext = createContext<HotelAdminContextValue | null>(null);

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function ensureProperty(property: Partial<Property>): Property {
  return {
    id: property.id ?? `${Date.now()}`,
    code: property.code ?? "PB-NEW",
    title: property.title ?? "Nova propriedade",
    type: property.type ?? "apartamento",
    listing: property.listing ?? "aluguel",
    price: Number(property.price ?? 0),
    priceLabel: property.priceLabel ?? "/diaria",
    location: property.location ?? "Beira mar",
    city: property.city ?? "Joao Pessoa",
    state: property.state ?? "PB",
    description: property.description ?? "Descricao da propriedade.",
    bedrooms: Number(property.bedrooms ?? 1),
    bathrooms: Number(property.bathrooms ?? 1),
    area: Number(property.area ?? 50),
    maxGuests: Number(property.maxGuests ?? 2),
    minNights: Number(property.minNights ?? 1),
    checkInTime: property.checkInTime ?? "14:00",
    checkOutTime: property.checkOutTime ?? "11:00",
    oceanView: Boolean(property.oceanView),
    featured: Boolean(property.featured),
    status: property.status ?? "disponivel",
    images: property.images && property.images.length ? property.images : ["/placeholder.svg"],
    amenities: property.amenities && property.amenities.length ? property.amenities : ["Wi-Fi"],
    lat: Number(property.lat ?? -7.1195),
    lng: Number(property.lng ?? -34.845),
  };
}

function ensureReservation(reservation: Partial<Reservation>): Reservation {
  return {
    id: reservation.id ?? `RES-${Date.now()}`,
    propertyId: reservation.propertyId ?? defaultProperties[0]?.id ?? "",
    guestName: reservation.guestName ?? "",
    guestEmail: reservation.guestEmail ?? "",
    guestPhone: reservation.guestPhone ?? "",
    checkIn: reservation.checkIn ?? new Date().toISOString().slice(0, 10),
    checkOut: reservation.checkOut ?? new Date().toISOString().slice(0, 10),
    adults: Number(reservation.adults ?? 2),
    children: Number(reservation.children ?? 0),
    total: Number(reservation.total ?? 0),
    deposit: Number(reservation.deposit ?? 0),
    source: reservation.source ?? "manual",
    status: reservation.status ?? "nova",
    notes: reservation.notes ?? "",
    createdAt: reservation.createdAt ?? new Date().toISOString().slice(0, 10),
  };
}

export function HotelAdminProvider({ children }: { children: ReactNode }) {
  const [properties, setProperties] = useState<Property[]>(() => readStorage(STORAGE_KEYS.properties, defaultProperties).map(ensureProperty));
  const [reservations, setReservations] = useState<Reservation[]>(() => readStorage(STORAGE_KEYS.reservations, initialReservations).map(ensureReservation));

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.properties, JSON.stringify(properties));
  }, [properties]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.reservations, JSON.stringify(reservations));
  }, [reservations]);

  const saveProperty = useCallback((property: Property) => {
    const normalized = ensureProperty(property);

    setProperties((prev) => {
      const exists = prev.some((item) => item.id === normalized.id);
      if (!exists) return [normalized, ...prev];
      return prev.map((item) => (item.id === normalized.id ? normalized : item));
    });
  }, []);

  const deleteProperty = useCallback((propertyId: string) => {
    setProperties((prev) => prev.filter((property) => property.id !== propertyId));
    setReservations((prev) => prev.filter((reservation) => reservation.propertyId !== propertyId));
  }, []);

  const saveReservation = useCallback((reservation: Reservation) => {
    const normalized = ensureReservation(reservation);

    setReservations((prev) => {
      const exists = prev.some((item) => item.id === normalized.id);
      if (!exists) return [normalized, ...prev];
      return prev.map((item) => (item.id === normalized.id ? normalized : item));
    });
  }, []);

  const deleteReservation = useCallback((reservationId: string) => {
    setReservations((prev) => prev.filter((reservation) => reservation.id !== reservationId));
  }, []);

  const updateReservationStatus = useCallback((reservationId: string, status: ReservationStatus) => {
    setReservations((prev) => prev.map((reservation) => (reservation.id === reservationId ? { ...reservation, status } : reservation)));
  }, []);

  const resetDemoData = useCallback(() => {
    setProperties(defaultProperties.map(ensureProperty));
    setReservations(initialReservations.map(ensureReservation));
  }, []);

  const value = useMemo(
    () => ({
      properties,
      reservations,
      saveProperty,
      deleteProperty,
      saveReservation,
      deleteReservation,
      updateReservationStatus,
      resetDemoData,
    }),
    [deleteProperty, deleteReservation, properties, reservations, resetDemoData, saveProperty, saveReservation, updateReservationStatus],
  );

  return <HotelAdminContext.Provider value={value}>{children}</HotelAdminContext.Provider>;
}

export function useHotelAdmin() {
  const context = useContext(HotelAdminContext);
  if (!context) {
    throw new Error("useHotelAdmin must be used within HotelAdminProvider");
  }
  return context;
}

export function calculateNights(checkIn: string, checkOut: string) {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diff = end.getTime() - start.getTime();
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
