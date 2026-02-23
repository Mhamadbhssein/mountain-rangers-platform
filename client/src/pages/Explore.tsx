/* ============================================================
 * Explore Page — Trip discovery with hero + immersive cards
 * Design: Alpine Glass / Lime-green brand
 * Full-bleed hero, staggered trip cards, glass overlays
 * ============================================================ */

import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Search,
  MapPin,
  Clock,
  Star,
  ChevronRight,
  Mountain,
  Filter,
  TrendingUp,
} from "lucide-react";
import { TRIPS, IMAGES, LOGOS } from "@/lib/data";

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: "bg-green-500/20 text-green-400",
  Moderate: "bg-yellow-500/20 text-yellow-400",
  Hard: "bg-orange-500/20 text-orange-400",
  Expert: "bg-red-500/20 text-red-400",
};

const FILTERS = ["All", "Easy", "Moderate", "Hard"];

export default function Explore() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const filtered = TRIPS.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.location.toLowerCase().includes(search.toLowerCase());
    const matchesDifficulty =
      activeFilter === "All" || t.difficulty === activeFilter;
    return matchesSearch && matchesDifficulty;
  });

  return (
    <div className="min-h-screen">
      {/* Hero Section — Full bleed with glass overlay */}
      <section className="relative h-[70vh] min-h-[500px] overflow-hidden">
        <img
          src={IMAGES.hero}
          alt="Lebanese mountains at golden hour"
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-background" />

        {/* Hero content */}
        <div className="relative h-full flex flex-col justify-between px-5 pt-12 pb-8">
          {/* Top bar with logo */}
          <div className="flex items-center justify-between">
            <img
              src={LOGOS.iconWhite}
              alt="Mountain Rangers"
              className="h-10 w-auto"
            />
            <img
              src={LOGOS.nameWhite}
              alt="Mountain Rangers"
              className="h-6 w-auto opacity-90"
            />
          </div>

          {/* Hero text */}
          <div className="space-y-4">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-4xl md:text-5xl font-serif text-white leading-tight"
            >
              Discover
              <br />
              <span className="text-lime">Lebanon's Trails</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-white/70 text-base max-w-sm"
            >
              Book your next outdoor adventure with one tap. Premium hiking
              experiences across the mountains of Lebanon.
            </motion.p>

            {/* Search bar — Glass */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="glass rounded-2xl flex items-center gap-3 px-4 py-3.5"
            >
              <Search size={18} className="text-lime shrink-0" />
              <input
                type="text"
                placeholder="Search trips, locations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-white placeholder-white/40 text-sm flex-1 outline-none"
              />
              <button className="p-1.5 rounded-xl bg-lime/10 text-lime">
                <Filter size={16} />
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="px-5 -mt-4 relative z-10">
        <div className="glass rounded-2xl p-4 flex items-center justify-around">
          <div className="text-center">
            <p className="text-lime text-lg font-bold">5+</p>
            <p className="text-muted-foreground text-xs">Upcoming Trips</p>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="text-center">
            <p className="text-lime text-lg font-bold">24</p>
            <p className="text-muted-foreground text-xs">Seats per Trip</p>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="text-center">
            <p className="text-lime text-lg font-bold">4.8</p>
            <p className="text-muted-foreground text-xs">Avg Rating</p>
          </div>
        </div>
      </section>

      {/* Difficulty Filters */}
      <section className="px-5 mt-6">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeFilter === f
                  ? "bg-lime text-black"
                  : "glass text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </section>

      {/* Upcoming Trips */}
      <section className="px-5 mt-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-serif text-foreground">Upcoming Trips</h2>
          <span className="text-lime text-sm flex items-center gap-1">
            <TrendingUp size={14} />
            {filtered.length} available
          </span>
        </div>

        <div className="space-y-4">
          {filtered.map((trip, i) => (
            <Link key={trip.id} href={`/trip/${trip.id}`}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                whileTap={{ scale: 0.98 }}
                className="glass rounded-2xl overflow-hidden group"
              >
                <div className="flex gap-0">
                  {/* Trip image */}
                  <div className="w-28 h-36 shrink-0 relative overflow-hidden">
                    <img
                      src={trip.image}
                      alt={trip.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/30" />
                  </div>

                  {/* Trip info */}
                  <div className="flex-1 p-3.5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-foreground text-[15px] leading-tight font-sans">
                          {trip.title}
                        </h3>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
                            DIFFICULTY_COLORS[trip.difficulty]
                          }`}
                        >
                          {trip.difficulty}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-1.5 text-muted-foreground">
                        <MapPin size={12} />
                        <span className="text-xs">{trip.location}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock size={12} />
                          <span className="text-xs">{trip.date}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star
                            size={12}
                            className="text-lime fill-lime"
                          />
                          <span className="text-xs text-foreground">
                            {trip.rating}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-lime font-bold text-sm">
                          ${trip.price}
                        </span>
                        <ChevronRight
                          size={14}
                          className="text-muted-foreground"
                        />
                      </div>
                    </div>

                    {/* Seat availability bar */}
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-muted-foreground">
                          {trip.totalSeats - trip.bookedSeats.length} seats left
                        </span>
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${(trip.bookedSeats.length / trip.totalSeats) * 100}%`,
                            background:
                              trip.bookedSeats.length / trip.totalSeats > 0.7
                                ? "oklch(0.65 0.2 30)"
                                : "oklch(0.82 0.18 120)",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-12">
              <Mountain size={40} className="text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No trips found</p>
              <p className="text-muted-foreground/60 text-sm mt-1">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
