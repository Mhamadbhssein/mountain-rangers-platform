import { Link } from "wouter";
import { Check, Clock3, Map, MessageCircle, Mountain, Play, Sparkles, TrendingUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";

const BENEFITS = [
  ["Full GPS trail routes & waypoints", "Navigate like a pro"],
  ["Elevation profiles for all trails", "Plan every climb"],
  ["AI trail guide & safety tips", "Expert guidance"],
  ["Unlimited trail recordings", "Track your adventures"],
  ["Premium trail details & filters", "Full access"],
];
const FILTERS = ["All", "Easy", "Moderate", "Hard", "Expert"] as const;

type Tab = "Explore" | "Record" | "My Trails" | "Community";

export default function Trails() {
  const { isAuthenticated } = useAuth();
  const [tab, setTab] = useState<Tab>("Explore");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [title, setTitle] = useState("");
  const [distance, setDistance] = useState("");
  const [elevation, setElevation] = useState("");
  const [duration, setDuration] = useState("");
  const { data: trails = [], isLoading } = trpc.trailExplorer.catalog.useQuery();
  const { data: recordings = [] } = trpc.trailExplorer.recordings.useQuery(undefined, { enabled: isAuthenticated && tab === "My Trails" });
  const { data: subscription } = trpc.trailExplorer.subscription.useQuery(undefined, { enabled: isAuthenticated });
  const utils = trpc.useUtils();
  const subscribe = trpc.trailExplorer.subscribe.useMutation({
    onSuccess: () => { utils.trailExplorer.subscription.invalidate(); toast.success("Trails Premium is active on your account"); },
    onError: (error) => toast.error(error.message),
  });
  const record = trpc.trailExplorer.record.useMutation({
    onSuccess: () => { toast.success("Trail recording saved"); setTitle(""); setDistance(""); setElevation(""); setDuration(""); setTab("My Trails"); utils.trailExplorer.recordings.invalidate(); },
    onError: (error) => toast.error(error.message),
  });
  const visibleTrails = trails.filter((trail) => filter === "All" || trail.difficulty === filter);

  return (
    <div className="min-h-screen bg-[#f7f8f5] px-5 pb-8 pt-10">
      <div className="mx-auto max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#91a72b]">Explore Lebanon</p>
        <div className="mt-2 flex items-end justify-between gap-4"><div><p className="text-sm font-medium text-[#7f8981]">Find your route</p><h1 className="text-3xl font-bold tracking-tight text-[#172019]">Trail Explorer</h1></div><div className="rounded-2xl bg-[#eaf1d0] p-3 text-[#719000]"><Map size={22} /></div></div>

        <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
          {(["Explore", "Record", "My Trails"] as Tab[]).map((item) => (
            <button key={item} onClick={() => setTab(item)} className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold ${tab === item ? "bg-[#b8d435] text-[#172019]" : "bg-white text-[#7f8981]"}`}>
              {item}
            </button>
          ))}
          <Link href="/community" className="rounded-full bg-white px-4 py-2 text-xs font-bold text-[#7f8981]">Community</Link>
        </div>

        {tab === "Explore" && (
          <>
            <section className="relative mt-6 overflow-hidden rounded-3xl bg-[#18221b] p-6 text-white shadow-[0_16px_35px_rgba(24,34,27,0.16)]">
              <div className="absolute -right-8 -top-12 h-40 w-40 rounded-full bg-[#b8d435]/20 blur-2xl" /><Mountain className="absolute right-6 top-8 text-[#b8d435]/40" size={92} strokeWidth={1} />
              <div className="relative"><div className="flex items-start justify-between"><div className="rounded-xl bg-[#b8d435] p-2 text-[#172019]"><Sparkles size={18} /></div><span className="text-2xl font-bold">$4</span></div><p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-[#b8d435]">Trails Premium</p><h2 className="mt-2 text-2xl font-bold">Unlock Lebanon's full trail network</h2><p className="mt-2 text-sm text-white/65">Monthly subscription · Cancel anytime</p><button onClick={() => isAuthenticated ? subscribe.mutate({ plan: "monthly" }) : toast.info("Sign in to subscribe")} disabled={subscription?.status === "active" || subscribe.isPending} className="mt-6 w-full rounded-2xl bg-[#b8d435] px-4 py-3 text-sm font-bold text-[#172019] transition hover:bg-[#c7e04d]">{subscription?.status === "active" ? "Premium Active" : subscribe.isPending ? "Activating..." : "Subscribe for $4/mo"}</button></div>
            </section>

            <div className="mt-6 flex gap-2 overflow-x-auto">{FILTERS.map((item) => <button key={item} onClick={() => setFilter(item)} className={`rounded-full px-3 py-2 text-xs font-bold ${filter === item ? "bg-[#b8d435] text-[#172019]" : "bg-white text-[#7f8981]"}`}>{item}</button>)}</div>
            <div className="mt-6 flex items-center justify-between"><h2 className="text-lg font-bold text-[#172019]">Explore Trails</h2><span className="text-xs text-[#8a938c]">{visibleTrails.length} shown</span></div>
            {isLoading ? <div className="mt-5 rounded-3xl bg-white p-8 text-center text-sm text-[#8a938c]">Loading trails...</div> : visibleTrails.length === 0 ? <div className="mt-5 rounded-3xl bg-white p-8 text-center"><Mountain className="mx-auto text-[#b8d435]" /><p className="mt-3 text-sm font-bold text-[#263229]">No trails yet</p><p className="mt-1 text-xs text-[#8a938c]">Admin can add routes from Mission Control.</p></div> : <div className="mt-4 space-y-3">{visibleTrails.map((trail) => <article key={trail.id} className="overflow-hidden rounded-3xl bg-white shadow-sm"><div className="h-28 bg-[#dfe8c4]">{trail.imageUrl && <img src={trail.imageUrl} alt={trail.title} className="h-full w-full object-cover" />}</div><div className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-[#91a72b]">{trail.difficulty} · {trail.location}</p><h3 className="mt-1 text-lg font-bold text-[#172019]">{trail.title}</h3></div>{trail.isPremium && <Sparkles size={17} className="text-[#91a72b]" />}</div><div className="mt-3 flex gap-4 text-xs text-[#7f8981]"><span className="flex items-center gap-1"><TrendingUp size={13} />{trail.distanceKm} km</span><span className="flex items-center gap-1"><Mountain size={13} />+{trail.elevationM} m</span><span className="flex items-center gap-1"><Clock3 size={13} />{trail.duration}</span></div></div></article>)}</div>}
          </>
        )}

        {tab === "Record" && <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><div className="rounded-xl bg-[#eaf1d0] p-3 text-[#719000]"><Play size={20} /></div><div><h2 className="text-lg font-bold text-[#172019]">Record a trail</h2><p className="text-xs text-[#8a938c]">Save your route stats to your Trail Recordings.</p></div></div>{!isAuthenticated ? <p className="mt-6 rounded-2xl bg-[#f4f6ef] p-4 text-center text-sm text-[#7f8981]">Sign in to record and save trails.</p> : <div className="mt-6 space-y-3"><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Trail or route name" className="w-full rounded-2xl border-0 bg-[#f4f6ef] px-4 py-3 text-sm outline-none" /><div className="grid grid-cols-3 gap-2"><input value={distance} onChange={(e) => setDistance(e.target.value)} placeholder="km" type="number" className="rounded-2xl border-0 bg-[#f4f6ef] px-4 py-3 text-sm outline-none" /><input value={elevation} onChange={(e) => setElevation(e.target.value)} placeholder="elevation m" type="number" className="rounded-2xl border-0 bg-[#f4f6ef] px-4 py-3 text-sm outline-none" /><input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="minutes" type="number" className="rounded-2xl border-0 bg-[#f4f6ef] px-4 py-3 text-sm outline-none" /></div><Button onClick={() => record.mutate({ title, distanceKm: Number(distance), elevationM: Number(elevation || 0), durationMinutes: Number(duration || 0) })} disabled={record.isPending || !title || !distance} className="w-full rounded-2xl bg-[#b8d435] py-6 font-bold text-[#172019]">{record.isPending ? "Saving..." : "Save recording"}</Button></div>}</section>}

        {tab === "My Trails" && <section className="mt-6"><h2 className="text-lg font-bold text-[#172019]">My Trail Recordings</h2>{recordings.length === 0 ? <div className="mt-4 rounded-3xl bg-white p-8 text-center text-sm text-[#8a938c]">No recordings yet. Record your next adventure here.</div> : <div className="mt-4 space-y-3">{recordings.map(({ recording, trail }) => <div key={recording.id} className="rounded-3xl bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><h3 className="font-bold text-[#172019]">{recording.title}</h3><span className="text-xs text-[#91a72b]">{trail?.title ?? "Personal route"}</span></div><div className="mt-3 flex gap-4 text-xs text-[#7f8981]"><span>{recording.distanceKm} km</span><span>+{recording.elevationM} m</span><span>{recording.durationMinutes} min</span></div></div>)}</div>}</section>}

        <a href="https://wa.me/96176828401?text=Hi%20Mountain%20Rangers%2C%20I%27d%20like%20to%20subscribe%20to%20Trails%20Premium." target="_blank" rel="noreferrer" className="mt-5 flex items-center justify-center gap-2 rounded-2xl border border-[#dfe6c7] bg-[#f1f6dd] px-4 py-3 text-sm font-bold text-[#617900]"><MessageCircle size={17} />Have questions? Chat on WhatsApp</a>
      </div>
    </div>
  );
}
