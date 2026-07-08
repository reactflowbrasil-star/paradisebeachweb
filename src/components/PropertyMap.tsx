import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import { MapPin, Navigation } from "lucide-react";
import { Property } from "@/data/properties";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface PropertyMapProps {
  property: Property;
}

function LocateButton({ onLocate }: { onLocate: (coords: [number, number]) => void }) {
  const map = useMap();
  const [locating, setLocating] = useState(false);

  const handleLocate = () => {
    if (!navigator.geolocation) {
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const position: [number, number] = [coords.latitude, coords.longitude];
        onLocate(position);
        map.flyTo(position, 13, { duration: 1.2 });
        setLocating(false);
      },
      () => {
        setLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  };

  return (
    <div className="leaflet-top leaflet-right">
      <div className="leaflet-control" style={{ pointerEvents: 'auto' }}>
        <button
          type="button"
          onClick={handleLocate}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground shadow-sm hover:bg-muted transition-colors"
          aria-label="Localizar minha posição"
        >
          <Navigation size={16} />
          {locating ? "Buscando..." : "Minha localização"}
        </button>
      </div>
    </div>
  );
}

export default function PropertyMap({ property }: PropertyMapProps) {
  const token = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);

  const lat = Number(property.lat);
  const lng = Number(property.lng);
  const hasCoords =
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    (lat !== 0 || lng !== 0) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180;

  const tileUrl = token
    ? `https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${token}`
    : "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

  const attribution = token
    ? '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    : '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

  if (!hasCoords) {
    return (
      <div className="rounded-lg overflow-hidden bg-muted">
        <div className="flex items-center gap-2 text-sm text-foreground/80 border-b border-border bg-card px-4 py-3">
          <MapPin size={16} />
          <span>{property.location}, {property.city} — {property.state}</span>
        </div>
        <div className="h-[28rem] flex items-center justify-center text-sm text-foreground/60">
          Localização precisa não informada.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden bg-muted">
      <div className="flex items-center gap-2 text-sm text-foreground/80 border-b border-border bg-card px-4 py-3">
        <MapPin size={16} />
        <span>{property.location}, {property.city} — {property.state}</span>
      </div>
      <div className="h-[28rem]">
        <MapContainer
          center={[lat, lng]}
          zoom={12}
          scrollWheelZoom={false}
          className="h-full w-full"
          attributionControl={false}
        >
          <TileLayer
            url={tileUrl}
            attribution={attribution}
            tileSize={token ? 512 : undefined}
            zoomOffset={token ? -1 : undefined}
          />
          <Marker position={[lat, lng]}>
            <Popup>{property.title}</Popup>
          </Marker>
          {userPosition ? (
            <>
              <Marker position={userPosition}>
                <Popup>Você está aqui</Popup>
              </Marker>
              <Circle center={userPosition} radius={70} pathOptions={{ color: "#22c55e", fillColor: "#bbf7d0", fillOpacity: 0.3 }} />
            </>
          ) : null}
          <LocateButton onLocate={setUserPosition} />
        </MapContainer>
      </div>
      {!token ? (
        <div className="border-t border-border px-4 py-3 text-xs text-foreground/70">
          Adicione <code>VITE_MAPBOX_TOKEN</code> no seu <code>.env</code> para usar o estilo Mapbox. O mapa está usando tiles do OpenStreetMap por padrão.
        </div>
      ) : null}
    </div>
  );
}
