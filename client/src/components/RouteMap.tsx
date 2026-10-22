import { useEffect, useRef } from "react";
import { MapView, mapboxgl } from "@/components/Map";
import type { RoutePoint } from "@/lib/trailMath";

const LEBANON_CENTER = { lat: 33.89, lng: 35.86 };

function markerElement(label: string, color: string) {
  const el = document.createElement("div");
  el.textContent = label;
  el.style.cssText = `width:26px;height:26px;border-radius:9999px;background:${color};color:#fff;font:700 12px Poppins,sans-serif;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3)`;
  return el;
}

export default function RouteMap({ points, className, live = false }: { points: RoutePoint[]; className?: string; live?: boolean }) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const routeId = useRef(`route-${Math.random().toString(36).slice(2)}`);

  const draw = () => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const id = routeId.current;
    if (map.getLayer(`${id}-line`)) map.removeLayer(`${id}-line`);
    if (map.getSource(id)) map.removeSource(id);
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
    if (points.length === 0) return;

    const coordinates = points.map((point) => [point.lng, point.lat] as [number, number]);
    map.addSource(id, { type: "geojson", data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates } } });
    map.addLayer({ id: `${id}-line`, type: "line", source: id, layout: { "line-join": "round", "line-cap": "round" }, paint: { "line-color": "#8fb31c", "line-width": 4, "line-opacity": 0.92 } });

    markersRef.current.push(new mapboxgl.Marker({ element: markerElement("S", "#2f9e44") }).setLngLat(coordinates[0]).addTo(map));
    if (coordinates.length > 1) markersRef.current.push(new mapboxgl.Marker({ element: markerElement(live ? "•" : "E", live ? "#1c7ed6" : "#e03131") }).setLngLat(coordinates[coordinates.length - 1]).addTo(map));

    if (coordinates.length === 1) {
      map.setCenter(coordinates[0]);
      map.setZoom(16);
    } else if (!live || coordinates.length < 3) {
      const bounds = coordinates.reduce((bounds, point) => bounds.extend(point), new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));
      map.fitBounds(bounds, { padding: 32, maxZoom: 15 });
    } else {
      map.panTo(coordinates[coordinates.length - 1]);
    }
  };

  useEffect(() => {
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, live]);

  useEffect(() => () => {
    markersRef.current.forEach((marker) => marker.remove());
    const map = mapRef.current;
    const id = routeId.current;
    if (map?.getLayer(`${id}-line`)) map.removeLayer(`${id}-line`);
    if (map?.getSource(id)) map.removeSource(id);
  }, []);

  return <MapView className={className ?? "h-64 rounded-2xl"} initialCenter={points[0] ? { lat: points[0].lat, lng: points[0].lng } : LEBANON_CENTER} initialZoom={points.length ? 13 : 8} onMapReady={(map) => { mapRef.current = map; draw(); }} />;
}
