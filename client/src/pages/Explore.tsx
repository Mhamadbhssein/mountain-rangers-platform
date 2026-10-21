import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Cloud, MapPin, Search, Star, Wind, Loader2, Mountain } from "lucide-react";
import { IMAGES, LOGOS } from "@/lib/data";
import { trpc } from "@/lib/trpc";

const FILTERS = ["All", "Easy", "Moderate", "Hard", "Expert"];

export default function Explore() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const { data: trips, isLoading } = trpc.trips.list.useQuery();
  const { data: banners } = trpc.trailExplorer.homeBanners.useQuery();
  const banner = banners?.[0];
  const filtered = (trips ?? []).filter((trip) => {
    const query = search.toLowerCase();
    return (trip.title.toLowerCase().includes(query) || trip.location.toLowerCase().includes(query)) && (activeFilter === "All" || trip.difficulty === activeFilter);
  });

  return (
    <div className="min-h-screen bg-[#f7f8f5] pb-8">
      <section className="relative min-h-[390px] overflow-hidden rounded-b-[2.4rem] bg-[#223327]">
        <img src={banner?.imageUrl || IMAGES.hero} alt="Lebanon mountain landscape" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#172019] via-[#172019]/35 to-[#172019]/10" />
        <div className="relative flex min-h-[390px] flex-col justify-between px-5 pb-8 pt-6">
          <div className="flex items-start justify-between"><img src={LOGOS.nameWhite} alt="Mountain Rangers" className="h-8 w-auto" /><div className="rounded-full border border-white/20 bg-black/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white/80">Lebanon</div></div>
          <div><p className="text-xs font-bold uppercase tracking-[0.22em] text-[#c9e66b]">{banner?.eyebrow || "Premium Outdoor Adventures"}</p><h1 className="mt-3 max-w-xs text-4xl font-bold leading-[1.05] tracking-tight text-white">{banner?.title ? banner.title : <>Discover Your<br />Next Adventure</>}</h1><p className="mt-3 max-w-sm text-sm leading-relaxed text-white/75">{banner?.subtitle || "Curated hiking experiences across Lebanon's most iconic trails"}</p><div className="mt-6 flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-[#9aa39b] shadow-lg"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search trips by destination..." className="min-w-0 flex-1 bg-transparent text-sm text-[#263229] outline-none placeholder:text-[#aeb5ae]" /></div></div>
        </div>
      </section>

      <main className="mx-auto max-w-2xl px-5">
        <section className="-mt-4 rounded-2xl border border-black/[0.05] bg-white p-3 shadow-sm"><div className="flex items-center justify-between"><div><p className="flex items-center gap-1 text-[10px] text-[#8d968e]"><MapPin size={11} /> Beirut</p><p className="mt-1 text-xs font-semibold text-[#526057]">Overcast</p></div><div className="text-right"><p className="text-lg font-bold text-[#263229]">23°</p><p className="text-[10px] text-[#9ba39c]">20° / 24°</p></div><div className="hidden items-center gap-3 text-[10px] text-[#9ba39c] sm:flex"><span className="flex items-center gap-1"><Wind size={12} />11km/h</span><span>0%</span></div></div></section>

        <section className="mt-4 grid grid-cols-3 gap-2"><div className="rounded-2xl border border-black/[0.05] bg-white p-3"><p className="text-lg font-bold text-[#719000]">{trips?.length ?? 0}</p><p className="text-[10px] font-medium text-[#8d968e]">Upcoming</p></div><div className="rounded-2xl border border-black/[0.05] bg-white p-3"><p className="text-lg font-bold text-[#263229]">500+</p><p className="text-[10px] font-medium text-[#8d968e]">Members</p></div><div className="rounded-2xl border border-black/[0.05] bg-white p-3"><p className="flex items-center gap-1 text-lg font-bold text-[#263229]">4.8<Star size={14} className="fill-[#b8d435] text-[#91a72b]" /></p><p className="text-[10px] font-medium text-[#8d968e]">Rated</p></div></section>

        <Link href="/private-trips"><section className="group relative mt-4 overflow-hidden rounded-2xl bg-[#273129] p-4 text-white"><img src="https://images.unsplash.com/photo-1454496522488-3558b0cbd0ac?w=800&q=80" alt="Private mountain trip" className="absolute inset-0 h-full w-full object-cover opacity-35 transition group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-r from-[#273129]/95 to-[#273129]/20" /><div className="relative"><p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#c9e66b]">Made for your group</p><h2 className="mt-1 text-lg font-bold">Private Trips, Hikes & Camps</h2><p className="mt-1 text-[10px] text-white/65">Schools · Families · Teams · Expats</p><span className="absolute right-0 top-5 grid h-9 w-9 place-items-center rounded-full bg-[#b8d435] text-[#263229]"><ArrowRight size={17} /></span></div></section></Link>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 no-scrollbar">{FILTERS.map((filter) => <button key={filter} onClick={() => setActiveFilter(filter)} className={`rounded-full border px-4 py-2 text-xs font-semibold whitespace-nowrap transition ${activeFilter === filter ? "border-[#b8d435] bg-[#b8d435] text-[#263229]" : "border-[#e0e5dd] bg-white text-[#7e887f]"}`}>{filter}</button>)}</div>

        <section className="mt-6"><div className="mb-3 flex items-center justify-between"><h2 className="text-xl font-bold text-[#263229]">Upcoming Trips</h2><span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#8d968e]">{filtered.length} trips</span></div>{isLoading ? <div className="flex justify-center py-14"><Loader2 className="animate-spin text-[#91a72b]" /></div> : filtered.length === 0 ? <div className="rounded-3xl border border-dashed border-[#d9dfd5] bg-white/70 px-5 py-14 text-center"><Mountain className="mx-auto mb-3 text-[#c2c9c0]" size={34} /><p className="font-bold text-[#445047]">No trips found</p><p className="mt-1 text-sm text-[#909990]">Try adjusting your filters</p></div> : <div className="space-y-3">{filtered.map((trip, index) => <Link key={trip.id} href={`/trip/${trip.id}`}><motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="flex gap-3 rounded-2xl border border-black/[0.05] bg-white p-3 shadow-sm"><img src={trip.imageUrl || IMAGES.tripCard1} alt={trip.title} className="h-20 w-24 rounded-xl object-cover" /><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><h3 className="truncate font-bold text-[#263229]">{trip.title}</h3><span className="rounded-full bg-[#eef5d8] px-2 py-1 text-[9px] font-bold text-[#719000]">{trip.difficulty}</span></div><p className="mt-1 text-xs text-[#8d968e]">{trip.location}</p><p className="mt-3 text-xs font-semibold text-[#719000]">{new Date(trip.date).toLocaleDateString()}</p></div></motion.div></Link>)}</div>}</section>
      </main>
    </div>
  );
}
