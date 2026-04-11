import { useEffect, useRef, useState } from "react";
import Map, { Marker, NavigationControl, GeolocateControl, type MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapPin } from "lucide-react";

interface MapboxPickerProps {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
  token: string;
}

export default function MapboxPicker({ lat, lng, onChange, token }: MapboxPickerProps) {
  const mapRef = useRef<MapRef>(null);
  const [viewState, setViewState] = useState({
    latitude: lat || -16.4536, // Default to Porto Seguro area if none
    longitude: lng || -39.0972,
    zoom: lat && lng ? 14 : 4,
  });

  // Update map when external lat/lng changes (e.g. from CEP lookup)
  useEffect(() => {
    if (lat && lng) {
      setViewState((prev) => ({
        ...prev,
        latitude: lat,
        longitude: lng,
        zoom: 14,
      }));
      mapRef.current?.flyTo({ center: [lng, lat], zoom: 14, duration: 2000 });
    }
  }, [lat, lng]);

  const handleMapClick = (e: any) => {
    const { lng, lat } = e.lngLat;
    onChange(lat, lng);
  };

  return (
    <div className="relative h-72 w-full overflow-hidden rounded-xl border border-slate-200">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        onClick={handleMapClick}
        mapStyle="mapbox://styles/mapbox/streets-v11"
        mapboxAccessToken={token}
        style={{ width: "100%", height: "100%" }}
      >
        <GeolocateControl position="top-right" trackUserLocation={true} />
        <NavigationControl position="top-right" />
        
        {lat !== null && lng !== null && (
          <Marker latitude={lat} longitude={lng} draggable onDragEnd={(e) => onChange(e.lngLat.lat, e.lngLat.lng)}>
            <div className="relative flex flex-col items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary shadow-lg ring-4 ring-white">
                <MapPin className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="mt-1 rounded bg-black/80 px-2 py-0.5 text-[10px] text-white backdrop-blur-sm">
                Local do imóvel
              </div>
            </div>
          </Marker>
        )}
      </Map>
      <div className="absolute bottom-2 left-2 right-2 rounded-lg bg-white/90 p-2 text-[10px] text-slate-500 shadow-sm backdrop-blur-sm">
        Clique no mapa ou arraste o marcador para ajustar a localização exata.
      </div>
    </div>
  );
}
