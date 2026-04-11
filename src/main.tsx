import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";
import "leaflet/dist/leaflet.css";

if (import.meta.env.PROD) {
  registerSW({
    immediate: true,
    onRegisteredSW(_, registration) {
      if (!registration) return;

      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000);
    },
  });
} else if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.unregister();
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
