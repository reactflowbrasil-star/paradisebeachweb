import { useState, useRef, useEffect } from "react";
import Map, { Marker, NavigationControl, GeolocateControl, FullscreenControl, type MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapPin, Navigation, X, Volume2, Map as MapIcon, Share2, ExternalLink } from "lucide-react";
import { type DbProperty } from "@/lib/api";
import { useSettings } from "@/contexts/SettingsContext";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";

interface PropertyMapProps {
  property: DbProperty;
}

export default function PropertyMap({ property }: PropertyMapProps) {
  const mapRef = useRef<MapRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { mapboxToken: token } = useSettings();
  const [isNavigating, setIsNavigating] = useState(false);

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

  const startNavigation = () => {
    setIsNavigating(true);
    
    // Voice Feedback
    if ("speechSynthesis" in window) {
      const msg = new SpeechSynthesisUtterance();
      msg.text = `Iniciando navegação para ${property.title}. Prepare-se para conhecer o seu paraíso.`;
      msg.lang = "pt-BR";
      msg.rate = 1;
      window.speechSynthesis.speak(msg);
    }

    // Try to enter fullscreen
    if (containerRef.current?.requestFullscreen) {
      containerRef.current.requestFullscreen();
    }
  };

  const openInApp = (app: "google" | "waze" | "apple") => {
    const lat = property.lat;
    const lng = property.lng;
    let url = "";

    if (app === "google") {
      url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    } else if (app === "waze") {
      url = `https://www.waze.com/ul?ll=${lat},${lng}&navigate=yes`;
    } else if (app === "apple") {
      url = `http://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`;
    }

    window.open(url, "_blank");
  };

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
    <div ref={containerRef} className="group relative rounded-xl overflow-hidden bg-slate-100 border border-slate-200 transition-all hover:shadow-lg">
      <div className="flex items-center justify-between gap-2 text-sm text-slate-600 border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-primary" />
          <span className="font-medium">{property.location}, {property.city} — {property.state}</span>
        </div>
        <button 
          onClick={startNavigation}
          className="flex items-center gap-2 bg-gradient-ocean px-4 py-1.5 rounded-full text-xs font-bold text-white shadow-md hover:opacity-90 active:scale-95 transition-all"
        >
          <Navigation size={14} className="fill-white" />
          COMO CHEGAR
        </button>
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
          <FullscreenControl position="top-right" />
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

        <AnimatePresence>
          {isNavigating && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[60] bg-slate-900/90 backdrop-blur-md p-6 flex flex-col items-center justify-center text-center text-white"
            >
              <button 
                onClick={() => {
                  setIsNavigating(false);
                  if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
                }}
                className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X size={24} />
              </button>

              <motion.div
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="max-w-md w-full"
              >
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl animate-pulse">
                  <Navigation size={40} className="text-primary-foreground" />
                </div>
                
                <h3 className="text-2xl font-serif font-bold mb-2">GPS Ativo</h3>
                <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                  Para instruções de voz e navegação curva a curva em tempo real, escolha o seu navegador favorito:
                </p>

                <div className="grid gap-4">
                  <Button 
                    onClick={() => openInApp("google")}
                    className="h-16 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 flex items-center justify-between px-6"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <MapIcon size={20} className="text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold">Google Maps</p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">Navegação por Voz</p>
                      </div>
                    </div>
                    <ExternalLink size={20} className="text-slate-300" />
                  </Button>

                  <Button 
                    onClick={() => openInApp("waze")}
                    className="h-16 rounded-2xl bg-sky-500 text-white hover:bg-sky-600 flex items-center justify-between px-6 border-0"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                        <Volume2 size={20} className="text-sky-500" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold">Waze</p>
                        <p className="text-[10px] text-sky-100 uppercase tracking-widest">Melhores Rotas</p>
                      </div>
                    </div>
                    <ExternalLink size={20} className="text-sky-200" />
                  </Button>
                </div>

                <div className="mt-8 pt-8 border-t border-white/10 flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-2"><MapPin size={12} /> {property.lat?.toFixed(5)}, {property.lng?.toFixed(5)}</span>
                  <span>DESTINO: {property.title.toUpperCase()}</span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Floating overlay for info */}
        {!isNavigating && (
          <div className="absolute bottom-4 left-4 right-4 md:right-auto md:w-64 rounded-xl bg-white/95 p-4 shadow-xl backdrop-blur-sm border border-slate-100 pointer-events-none transition-transform group-hover:-translate-y-1">
            <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">Localização Exata</p>
            <h4 className="text-sm font-bold text-slate-900 leading-tight">{property.title}</h4>
            <p className="text-xs text-slate-500 mt-1">{property.area}m² • {property.bedrooms} Quartos</p>
          </div>
        )}
      </div>
    </div>
  );
}
