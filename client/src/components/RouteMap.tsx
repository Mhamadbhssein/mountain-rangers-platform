import { useEffect, useRef } from "react";
import { MapView } from "@/components/Map";
import type { RoutePoint } from "@/lib/trailMath";

const LEBANON_CENTER = { lat: 33.89, lng: 35.86 };

function markerElement(label: string, color: string) {
  const el = document.createElement("div");
  el.textContent = label;
  el.style.cssText = `width:26px;height:26px;border-radius:9999px;background:${color};color:#fff;font:700 12px Poppins,sans-serif;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3)`;
  return el;
}

/** Google map showing a route polyline with S (start) and E (end) markers. */
export default function RouteMap({ points, className, live = false }: { points: RoutePoint[]; className?: string; live?: boolean }) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const lineRef = useRef<google.maps.Polyline | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);

  const draw = () => {
    const map = mapRef.current;
    if (!map || !window.google) return;
    lineRef.current?.setMap(null);
    markersRef.current.forEach((m) => (m.map = null));
    markersRef.current = [];
    if (points.length === 0) return;
    const path = points.map((p) => ({ lat: p.lat, lng: p.lng }));
    lineRef.current = new google.maps.Polyline({ path, map, strokeColor: "#8fb31c", strokeOpacity: 0.95, strokeWeight: 4 });
    const start = new google.maps.marker.AdvancedMarkerElement({ map, position: path[0], content: markerElement("S", "#2f9e44"), title: "Start" });
    markersRef.current.push(start);
    if (path.length > 1) {
      const end = new google.maps.marker.AdvancedMarkerElement({ map, position: path[path.length - 1], content: markerElement(live ? "•" : "E", live ? "#1c7ed6" : "#e03131"), title: live ? "You" : "End" });
      markersRef.current.push(end);
    }
    if (path.length === 1) {
      map.setCenter(path[0]);
      map.setZoom(16);
    } else if (!live || path.length < 3) {
      const bounds = new google.maps.LatLngBounds();
      path.forEach((p) => bounds.extend(p));
      map.fitBounds(bounds, 32);
    } else {
      map.panTo(path[path.length - 1]);
    }
  };

  useEffect(() => {
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, live]);

  return (
    <MapView
      className={className ?? "h-64 rounded-2xl"}
      initialCenter={points[0] ? { lat: points[0].lat, lng: points[0].lng } : LEBANON_CENTER}
      initialZoom={points.length ? 13 : 8}
      onMapReady={(map) => {
        mapRef.current = map;
        map.setOptions({ mapTypeId: "terrain", streetViewControl: false });
        draw();
      }}
    />
  );
}
