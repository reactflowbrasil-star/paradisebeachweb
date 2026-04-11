import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { api, type DbReservation } from "@/lib/api";

const POLL_INTERVAL_MS = 30_000;

function reservationSummary(reservation: DbReservation) {
  return `${reservation.guest_name} • ${reservation.check_in} ate ${reservation.check_out}`;
}

async function showBrowserNotification(title: string, body: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const icon = "/pwa-192.svg";

  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        body,
        icon,
        badge: icon,
        tag: "admin-new-reservation",
      });
      return;
    } catch {
      // Fallback below
    }
  }

  new Notification(title, { body, icon, tag: "admin-new-reservation" });
}

export function useReservationPushNotifications(enabled: boolean) {
  const knownIdsRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      knownIdsRef.current = new Set();
      initializedRef.current = false;
      return;
    }

    let disposed = false;

    const checkReservations = async () => {
      try {
        const reservations = await api.getReservations();
        if (disposed) return;

        const incomingIds = new Set(reservations.map((reservation) => reservation.id));

        if (!initializedRef.current) {
          knownIdsRef.current = incomingIds;
          initializedRef.current = true;
          return;
        }

        const newReservations = reservations
          .filter((reservation) => !knownIdsRef.current.has(reservation.id))
          .sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );

        knownIdsRef.current = incomingIds;

        if (newReservations.length === 0) return;

        const latest = newReservations[newReservations.length - 1];

        if (newReservations.length === 1) {
          toast.success("Nova reserva recebida!", {
            description: reservationSummary(latest),
          });
          await showBrowserNotification("Nova reserva recebida", reservationSummary(latest));
          return;
        }

        toast.success(`${newReservations.length} novas reservas recebidas!`, {
          description: `Ultima: ${reservationSummary(latest)}`,
        });
        await showBrowserNotification(
          `${newReservations.length} novas reservas`,
          `Ultima: ${reservationSummary(latest)}`
        );
      } catch (error) {
        console.error("Reservation notifier polling failed:", error);
      }
    };

    void checkReservations();
    const interval = window.setInterval(() => {
      void checkReservations();
    }, POLL_INTERVAL_MS);

    return () => {
      disposed = true;
      window.clearInterval(interval);
    };
  }, [enabled]);
}

