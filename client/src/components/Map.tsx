import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { cn } from "@/lib/utils";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || "";
mapboxgl.accessToken = MAPBOX_TOKEN;

export interface MapCenter {
  lat: number;
  lng: number;
}

interface MapViewProps {
  className?: string;
  initialCenter?: MapCenter;
  initialZoom?: number;
  onMapReady?: (map: mapboxgl.Map) => void;
}

export function MapView({
  className,
  initialCenter = { lat: 33.89, lng: 35.86 },
  initialZoom = 9,
  onMapReady,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const onMapReadyRef = useRef(onMapReady);

  useEffect(() => {
    onMapReadyRef.current = onMapReady;
  }, [onMapReady]);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/outdoors-v12",
      center: [initialCenter.lng, initialCenter.lat],
      zoom: initialZoom,
      attributionControl: true,
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), "top-right");
    map.addControl(new mapboxgl.FullscreenControl(), "top-right");
    map.on("load", () => onMapReadyRef.current?.(map));
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // Map instances intentionally initialize once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={mapContainer} className={cn("h-[500px] w-full", className)} />;
}

export { mapboxgl };
