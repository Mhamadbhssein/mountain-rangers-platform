export type RoutePoint = { lat: number; lng: number; ele?: number };

const EARTH_RADIUS_KM = 6371;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

/** Great-circle distance between two coordinates in kilometres. */
export function haversineKm(a: RoutePoint, b: RoutePoint) {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Total route length in kilometres, rounded to 2 decimals. */
export function routeDistanceKm(points: RoutePoint[]) {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += haversineKm(points[i - 1], points[i]);
  return Math.round(total * 100) / 100;
}

/**
 * Cumulative positive elevation change in metres. Small changes below the
 * threshold are ignored so GPS noise does not inflate the climb.
 */
export function elevationGainM(points: RoutePoint[], threshold = 3) {
  let gain = 0;
  let reference: number | undefined;
  for (const point of points) {
    if (typeof point.ele !== "number" || Number.isNaN(point.ele)) continue;
    if (reference === undefined) {
      reference = point.ele;
      continue;
    }
    const diff = point.ele - reference;
    if (diff >= threshold) {
      gain += diff;
      reference = point.ele;
    } else if (diff <= -threshold) {
      reference = point.ele;
    }
  }
  return Math.round(gain);
}

export function maxElevationM(points: RoutePoint[]) {
  const values = points.map((p) => p.ele).filter((v): v is number => typeof v === "number" && !Number.isNaN(v));
  return values.length ? Math.round(Math.max(...values)) : null;
}

/** Elevation chart series: cumulative distance (km) vs elevation (m). */
export function elevationSeries(points: RoutePoint[], maxSamples = 200) {
  const series: { km: number; ele: number }[] = [];
  let distance = 0;
  for (let i = 0; i < points.length; i++) {
    if (i > 0) distance += haversineKm(points[i - 1], points[i]);
    const ele = points[i].ele;
    if (typeof ele === "number" && !Number.isNaN(ele)) series.push({ km: Math.round(distance * 100) / 100, ele: Math.round(ele) });
  }
  if (series.length <= maxSamples) return series;
  const step = series.length / maxSamples;
  return Array.from({ length: maxSamples }, (_, i) => series[Math.floor(i * step)]).concat(series[series.length - 1]);
}

/** Parses GPX XML text into route points (trkpt, rtept, or wpt). */
export function parseGpx(xml: string): RoutePoint[] {
  const points: RoutePoint[] = [];
  const pattern = /<(trkpt|rtept)\b([^>]*)>([\s\S]*?)<\/\1>|<(trkpt|rtept)\b([^>]*)\/>/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(xml)) !== null) {
    const attrs = match[2] ?? match[5] ?? "";
    const body = match[3] ?? "";
    const lat = Number(/lat\s*=\s*["']([^"']+)["']/.exec(attrs)?.[1]);
    const lng = Number(/lon\s*=\s*["']([^"']+)["']/.exec(attrs)?.[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const eleText = /<ele>\s*([^<]+)\s*<\/ele>/.exec(body)?.[1];
    const ele = eleText !== undefined ? Number(eleText) : undefined;
    points.push(Number.isFinite(ele) ? { lat, lng, ele } : { lat, lng });
  }
  return points;
}

/** Reduces a long route to at most maxPoints while keeping start and end. */
export function simplifyRoute(points: RoutePoint[], maxPoints = 5000) {
  if (points.length <= maxPoints) return points;
  const step = (points.length - 1) / (maxPoints - 1);
  return Array.from({ length: maxPoints }, (_, i) => points[Math.round(i * step)]);
}

export function formatMinutes(totalMinutes: number) {
  const minutes = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  if (rest === 0) return `${hours} h`;
  return `${hours} h ${rest} min`;
}

export function formatClock(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}
