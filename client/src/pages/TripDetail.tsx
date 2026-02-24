/* ============================================================
 * TripDetail — Immersive trip page with booking CTA
 * Design: Alpine Glass / Lime-green brand
 * Full-bleed image, glass info panels, sticky book button
 * ============================================================ */

import { useParams, useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Star,
  Users,
  CheckCircle2,
  Share2,
  Heart,
  CalendarDays,
  Ruler,
  TrendingUp,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Backpack,
  Info,
  ChevronRight as ChevronRightIcon,
} from "lucide-react";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { MapView } from "@/components/Map";

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: "bg-green-500/20 text-green-400 border-green-500/30",
  Moderate: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  Hard: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  Expert: "bg-red-500/20 text-red-400 border-red-500/30",
};

const WHAT_TO_BRING = [
  "Hiking boots or trail shoes",
  "Water (2L minimum)",
  "Snacks / packed lunch",
  "Sunscreen & sunglasses",
  "Layered clothing",
  "First aid kit",
  "Fully charged phone",
  "National ID / passport",
];

export default function TripDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [liked, setLiked] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const tripId = Number(id);
  const { data: trip, isLoading } = trpc.trips.getById.useQuery(
    { id: tripId },
    { enabled: !isNaN(tripId) }
  );

  const handleMapReady = useCallback((map: google.maps.Map) => {
    if (!trip?.meetingPointLat || !trip?.meetingPointLng) return;
    const pos = { lat: Number(trip.meetingPointLat), lng: Number(trip.meetingPointLng) };
    map.setCenter(pos);
    map.setZoom(14);
    new google.maps.marker.AdvancedMarkerElement({
      map,
      position: pos,
      title: trip.meetingPoint ?? "Meeting Point",
    });
  }, [trip]);

  const toggleCheck = (item: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="text-lime animate-spin" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Trip not found</p>
      </div>
    );
  }

  const seatsLeft = trip.availableSeats;
  const fillPercent = ((trip.totalSeats - seatsLeft) / trip.totalSeats) * 100;
  const highlights: string[] = Array.isArray(trip.highlights) ? trip.highlights : [];
  const included: string[] = Array.isArray(trip.included) ? trip.included : [];
  const additionalImages: string[] = Array.isArray(trip.additionalImages) ? trip.additionalImages : [];
  const allImages = [trip.imageUrl, ...additionalImages].filter(Boolean) as string[];
  const hasMeetingPointMap = trip.meetingPointLat && trip.meetingPointLng;

  const shortDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="min-h-screen pb-28">
      {/* Hero Image */}
      <section className="relative h-[55vh] min-h-[380px]">
        <img
          src={allImages[galleryIndex] ?? ""}
          alt={trip.title}
          className="absolute inset-0 w-full h-full object-cover transition-all duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-background" />

        {/* Top navigation */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-12">
          <button
            onClick={() => navigate("/")}
            className="glass rounded-full p-2.5"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => setLiked(!liked)}
              className="glass rounded-full p-2.5"
            >
              <Heart
                size={20}
                className={liked ? "text-red-400 fill-red-400" : "text-white"}
              />
            </button>
            <button className="glass rounded-full p-2.5">
              <Share2 size={20} className="text-white" />
            </button>
          </div>
        </div>

        {/* Difficulty badge */}
        <div className="absolute bottom-6 left-5">
          <span
            className={`text-xs px-3 py-1.5 rounded-full font-medium border ${DIFFICULTY_COLORS[trip.difficulty]}`}
          >
            {trip.difficulty}
          </span>
        </div>

        {/* Gallery navigation arrows (only if multiple images) */}
        {allImages.length > 1 && (
          <>
            <button
              onClick={() => setGalleryIndex((i) => (i - 1 + allImages.length) % allImages.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 glass rounded-full p-2"
            >
              <ChevronLeft size={18} className="text-white" />
            </button>
            <button
              onClick={() => setGalleryIndex((i) => (i + 1) % allImages.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 glass rounded-full p-2"
            >
              <ChevronRight size={18} className="text-white" />
            </button>
            {/* Dots */}
            <div className="absolute bottom-6 right-5 flex gap-1.5">
              {allImages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setGalleryIndex(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    i === galleryIndex ? "bg-lime w-4" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </section>

      {/* Trip Info */}
      <section className="px-5 -mt-6 relative z-10 space-y-5">
        {/* Title & Rating */}
        <div>
          <h1 className="text-2xl font-serif text-foreground">{trip.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin size={14} className="text-lime" />
              <span className="text-sm">{trip.location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star size={14} className="text-lime fill-lime" />
              <span className="text-sm text-foreground font-medium">
                {trip.rating}
              </span>
              <span className="text-xs text-muted-foreground">
                ({trip.reviewCount})
              </span>
            </div>
          </div>
        </div>

        {/* Quick stats grid */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: CalendarDays, label: "Date", value: shortDate(trip.date) },
            { icon: Clock, label: "Duration", value: trip.duration },
            { icon: TrendingUp, label: "Elevation", value: trip.elevation ?? "N/A" },
            { icon: Ruler, label: "Distance", value: trip.distance ?? "N/A" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="glass rounded-xl p-3 text-center"
            >
              <stat.icon size={16} className="text-lime mx-auto mb-1.5" />
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              <p className="text-xs font-semibold text-foreground mt-0.5">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Seat availability */}
        <div className="glass rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-lime" />
              <span className="text-sm font-medium text-foreground">
                Seat Availability
              </span>
            </div>
            <span className="text-sm text-lime font-semibold">
              {seatsLeft}/{trip.totalSeats} left
            </span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${fillPercent}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{
                background:
                  fillPercent > 70
                    ? "oklch(0.65 0.2 30)"
                    : "oklch(0.82 0.18 120)",
              }}
            />
          </div>
          {seatsLeft <= 5 && (
            <p className="text-orange-400 text-xs mt-2 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse" />
              Filling up fast — only {seatsLeft} seats remaining!
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <h2 className="text-lg font-serif text-foreground mb-2">About this Trip</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {trip.description}
          </p>
        </div>

        {/* Additional Photos Gallery */}
        {additionalImages.length > 0 && (
          <div>
            <h2 className="text-lg font-serif text-foreground mb-3">Photo Gallery</h2>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setGalleryIndex(idx);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={`shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                    galleryIndex === idx ? "border-lime" : "border-transparent"
                  }`}
                >
                  <img
                    src={img}
                    alt={`Photo ${idx + 1}`}
                    className="w-24 h-24 object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Highlights */}
        {highlights.length > 0 && (
          <div>
            <h2 className="text-lg font-serif text-foreground mb-3">Highlights</h2>
            <div className="flex flex-wrap gap-2">
              {highlights.map((h) => (
                <span
                  key={h}
                  className="glass-lime rounded-full px-3 py-1.5 text-xs text-lime font-medium"
                >
                  {h}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* What's included */}
        {included.length > 0 && (
          <div>
            <h2 className="text-lg font-serif text-foreground mb-3">What's Included</h2>
            <div className="space-y-2">
              {included.map((item) => (
                <div key={item} className="flex items-center gap-2.5">
                  <CheckCircle2 size={16} className="text-lime shrink-0" />
                  <span className="text-sm text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── What to Bring ── */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-full bg-lime/15 flex items-center justify-center">
              <Backpack size={16} className="text-lime" />
            </div>
            <h2 className="text-base font-semibold text-foreground">What to Bring</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {WHAT_TO_BRING.map((item) => {
              const checked = checkedItems.has(item);
              return (
                <button
                  key={item}
                  onClick={() => toggleCheck(item)}
                  className="flex items-start gap-2.5 text-left group"
                >
                  <div
                    className={`mt-0.5 w-4 h-4 rounded shrink-0 border transition-all ${
                      checked
                        ? "bg-lime border-lime"
                        : "border-white/30 bg-white/5"
                    }`}
                  >
                    {checked && (
                      <svg viewBox="0 0 12 12" fill="none" className="w-full h-full p-0.5">
                        <path d="M2 6l3 3 5-5" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-xs leading-snug transition-colors ${checked ? "text-lime line-through" : "text-muted-foreground"}`}>
                    {item}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Important Notes ── */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-full bg-blue-500/15 flex items-center justify-center">
              <Info size={16} className="text-blue-400" />
            </div>
            <h2 className="text-base font-semibold text-foreground">Important Notes</h2>
          </div>
          <div className="space-y-3">
            {[
              { text: "Please arrive at the meeting point", bold: "30 minutes early", suffix: "." },
              { text: "Keep your QR code accessible for scanning at departure.", bold: null, suffix: null },
              { text: "Cancellations within 24 hours of departure may not be eligible for a refund.", bold: null, suffix: null },
              { text: "In case of bad weather, the organiser will contact you with updates.", bold: null, suffix: null },
            ].map((note, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <ChevronRightIcon size={14} className="text-lime shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground leading-snug">
                  {note.text}{" "}
                  {note.bold && <span className="font-bold text-foreground">{note.bold}</span>}
                  {note.suffix}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Meeting point */}
        <div className="space-y-3">
          <h2 className="text-lg font-serif text-foreground">Meeting Point</h2>
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <MapPin size={16} className="text-lime" />
              <span className="text-sm font-medium text-foreground">
                {trip.meetingPoint || "To be announced"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground/60 ml-6">
              Departure at {trip.time} sharp
            </p>
          </div>

          {/* Map showing meeting point */}
          {hasMeetingPointMap && (
            <div className="rounded-xl overflow-hidden border border-white/10">
              <MapView
                className="h-[220px]"
                initialCenter={{
                  lat: Number(trip.meetingPointLat),
                  lng: Number(trip.meetingPointLng),
                }}
                initialZoom={14}
                onMapReady={handleMapReady}
              />
            </div>
          )}
        </div>
      </section>

      {/* Sticky Book Button */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
        <div className="glass-strong rounded-2xl p-4 flex items-center justify-between max-w-lg mx-auto">
          <div>
            <p className="text-xs text-muted-foreground">Price per person</p>
            <p className="text-2xl font-bold text-lime">
              ${trip.price}
              <span className="text-sm text-muted-foreground font-normal ml-1">
                USD
              </span>
            </p>
          </div>
          <Link href={`/book/${trip.id}`}>
            <Button
              className="bg-lime hover:bg-lime-light text-black font-semibold px-8 py-6 rounded-xl text-base"
            >
              Book Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
