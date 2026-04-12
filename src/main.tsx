import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";
import "leaflet/dist/leaflet.css";

registerSW({
  immediate: true,
  onRegisteredSW(_, registration) {
    if (!registration) return;

    setInterval(() => {
      registration.update();
    }, 60 * 60 * 1000);
  },
});

createRoot(document.getElementById("root")!).render(<App />);
