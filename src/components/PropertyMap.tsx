import { useState, useRef, useEffect } from "react";
import Map, { Marker, NavigationControl, GeolocateControl, type MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapPin, Navigation } from "lucide-react";
import { type DbProperty } from "@/lib/api";

interface PropertyMapProps {
  property: DbProperty;
}

export default function PropertyMap({ property }: PropertyMapProps) {
  const mapRef = useRef<MapRef>(null);
  const token = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

  const hasValidCoords =
    Number.isFinite(property.lat) &&
    Number.isFinite(property.lng) &&
    !(property.lat === 0 && property.lng === 0);

  const [viewState, setViewState] = useState({
    latitude: property.lat || -16.4536,
    longitude: property.lng || -39.0972,
    zoom: 13,
  });

  // Re-center when property changes
  useEffect(() => {
    if (hasValidCoords) {
      setViewState({
        latitude: property.lat!,
        longitude: property.lng!,
        zoom: 14,
      });
      mapRef.current?.flyTo({
        center: [property.lng!, property.lat!],
        zoom: 14,
        duration: 2000,
      });
    }
  }, [property.id, property.lat, property.lng, hasValidCoords]);

  if (!hasValidCoords) {
    return (
      <div className="rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
        <div className="flex items-center gap-2 text-sm text-slate-600 border-b border-slate-200 bg-white px-4 py-3">
          <MapPin size={16} className="text-primary" />
          <span className="font-medium">{property.location}, {property.city} — {property.state}</span>
        </div>
        <div className="h-[28rem] flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
          <MapPin size={32} className="opacity-20" />
          <p>Localização indisponível no mapa para este imóvel.</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="rounded-xl overflow-hidden bg-rose-50 border border-rose-100 p-8 text-center">
        <p className="text-rose-600 font-medium">Erro: Mapbox Token não configurado.</p>
        <p className="text-rose-500 text-sm mt-1">Adicione VITE_MAPBOX_TOKEN no arquivo .env para visualizar o mapa.</p>
      </div>
    );
  }

  return (
    <div className="group rounded-xl overflow-hidden bg-slate-100 border border-slate-200 transition-all hover:shadow-lg">
      <div className="flex items-center justify-between gap-2 text-sm text-slate-600 border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-primary" />
          <span className="font-medium">{property.location}, {property.city} — {property.state}</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary animate-pulse">
           <div className="h-1.5 w-1.5 rounded-full bg-primary" />
           AO VIVO
        </div>
      </div>
      
      <div className="h-[32rem] relative">
        <Map
          ref={mapRef}
          {...viewState}
          onMove={(evt) => setViewState(evt.viewState)}
          mapStyle="mapbox://styles/mapbox/streets-v11"
          mapboxAccessToken={token}
          style={{ width: "100%", height: "100%" }}
        >
          <GeolocateControl 
            position="top-right" 
            trackUserLocation={true}
            positionOptions={{ enableHighAccuracy: true }}
            showUserHeading={true}
          />
          <NavigationControl position="top-right" />
          
          <Marker latitude={property.lat!} longitude={property.lng!}>
            <div className="relative flex flex-col items-center group cursor-pointer">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary shadow-xl ring-4 ring-white transition-transform group-hover:scale-110">
                <MapPin className="h-7 w-7 text-primary-foreground" />
              </div>
              <div className="mt-2 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-slate-900 shadow-lg border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {property.title}
              </div>
              <div className="h-3 w-3 bg-primary rotate-45 -mt-1.5 shadow-lg" />
            </div>
          </Marker>
        </Map>
        
        {/* Floating overlay for info */}
        <div className="absolute bottom-4 left-4 right-4 md:right-auto md:w-64 rounded-xl bg-white/95 p-4 shadow-xl backdrop-blur-sm border border-slate-100 pointer-events-none transition-transform group-hover:-translate-y-1">
          <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">Localização Exata</p>
          <h4 className="text-sm font-bold text-slate-900 leading-tight">{property.title}</h4>
          <p className="text-xs text-slate-500 mt-1">{property.area}m² • {property.bedrooms} Quartos</p>
        </div>
      </div>
    </div>
  );
}
