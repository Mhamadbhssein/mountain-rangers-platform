import { useCallback, useEffect, useRef, useState } from "react";
import { elevationGainM, haversineKm, routeDistanceKm, type RoutePoint } from "@/lib/trailMath";

export type RecorderStatus = "idle" | "recording" | "paused";

/** Minimum movement (km) before a new GPS point is kept, to filter jitter. */
const MIN_STEP_KM = 0.005;
/** Readings worse than this accuracy (metres) are ignored. */
const MAX_ACCURACY_M = 50;

/**
 * Records a live route with the browser Geolocation API. Elapsed time only
 * counts while recording, so pauses are excluded from the hike duration.
 */
export function useTrailRecorder() {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [points, setPoints] = useState<RoutePoint[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const watchId = useRef<number | null>(null);
  const tickId = useRef<number | null>(null);
  const startedAt = useRef<Date | null>(null);

  const supported = typeof navigator !== "undefined" && "geolocation" in navigator;

  const clearWatch = () => {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
    if (tickId.current !== null) window.clearInterval(tickId.current);
    tickId.current = null;
  };

  const beginWatch = useCallback(() => {
    if (!supported) {
      setError("GPS is not available on this device or browser.");
      return;
    }
    setError(null);
    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, altitude, accuracy: acc } = position.coords;
        setAccuracy(acc ?? null);
        if (acc && acc > MAX_ACCURACY_M) return;
        const next: RoutePoint = typeof altitude === "number" && !Number.isNaN(altitude)
          ? { lat: latitude, lng: longitude, ele: altitude }
          : { lat: latitude, lng: longitude };
        setPoints((prev) => {
          const last = prev[prev.length - 1];
          if (last && haversineKm(last, next) < MIN_STEP_KM) return prev;
          return [...prev, next];
        });
      },
      (err) => {
        setError(err.code === err.PERMISSION_DENIED
          ? "Location permission was denied. Allow location access in your browser settings to record."
          : "Unable to read your GPS position. Move to an open area and try again.");
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 },
    );
    tickId.current = window.setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
  }, [supported]);

  const start = useCallback(() => {
    setPoints([]);
    setElapsedSeconds(0);
    startedAt.current = new Date();
    setStatus("recording");
    beginWatch();
  }, [beginWatch]);

  const pause = useCallback(() => {
    clearWatch();
    setStatus("paused");
  }, []);

  const resume = useCallback(() => {
    setStatus("recording");
    beginWatch();
  }, [beginWatch]);

  const stop = useCallback(() => {
    clearWatch();
    const summary = {
      points,
      distanceKm: routeDistanceKm(points),
      elevationM: elevationGainM(points),
      durationMinutes: Math.max(1, Math.round(elapsedSeconds / 60)),
      startedAt: startedAt.current ?? new Date(),
      endedAt: new Date(),
    };
    setStatus("idle");
    return summary;
  }, [points, elapsedSeconds]);

  const reset = useCallback(() => {
    clearWatch();
    setPoints([]);
    setElapsedSeconds(0);
    setStatus("idle");
    setError(null);
  }, []);

  useEffect(() => () => clearWatch(), []);

  return {
    supported,
    status,
    points,
    elapsedSeconds,
    error,
    accuracy,
    distanceKm: routeDistanceKm(points),
    elevationM: elevationGainM(points),
    start,
    pause,
    resume,
    stop,
    reset,
  };
}
