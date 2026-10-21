import { useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { ArrowLeft, Bot, CalendarDays, Clock3, Loader2, MapPin, Mountain, Pencil, Play, RefreshCcw, Ruler, Send, Sparkles, Tag, TrendingUp, X } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import RouteMap from "@/components/RouteMap";
import ElevationProfile from "@/components/ElevationProfile";
import type { RoutePoint } from "@/lib/trailMath";

const DIFFICULTY_STYLE: Record<string, string> = {
  Easy: "bg-emerald-100 text-emerald-700",
  Moderate: "bg-amber-100 text-amber-700",
  Hard: "bg-orange-100 text-orange-700",
  Expert: "bg-red-100 text-red-700",
};

export default function TrailDetail() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [guideOpen, setGuideOpen] = useState(false);
  const { data: trail, isLoading, error } = trpc.trailExplorer.trail.useQuery({ id }, { enabled: Number.isFinite(id) });
  const { data: subscription } = trpc.trailExplorer.subscription.useQuery(undefined, { enabled: isAuthenticated });

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#f7f8f5]"><Loader2 className="animate-spin text-[#91a72b]" /></div>;
  }
  if (error || !trail) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f7f8f5] px-6 text-center">
        <Mountain className="text-[#b8d435]" size={40} />
        <p className="mt-3 font-bold text-[#172019]">Trail not found</p>
        <Link href="/trails" className="mt-4 rounded-full bg-[#b8d435] px-5 py-2 text-sm font-bold text-[#172019]">Back to trails</Link>
      </div>
    );
  }

  const isAdmin = user?.role === "admin";
  const premiumLocked = trail.isPremium && subscription?.status !== "active" && !isAdmin;
  const route = (trail.routeData ?? []) as RoutePoint[];
  const stats = [
    { label: "Distance", value: `${trail.distanceKm} km`, icon: Ruler },
    { label: "Elevation Gain", value: `+${trail.elevationM} m`, icon: TrendingUp },
    { label: "Max Elevation", value: trail.maxElevationM ? `${trail.maxElevationM} m` : "N/A", icon: Mountain },
    { label: "Est. Duration", value: trail.duration, icon: Clock3 },
  ];

  return (
    <div className="min-h-screen bg-[#f7f8f5] pb-28">
      <div className="relative h-64 overflow-hidden bg-[#2a3a2c]">
        {trail.imageUrl ? <img src={trail.imageUrl} alt={trail.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><Mountain size={80} className="text-[#b8d435]/40" strokeWidth={1} /></div>}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/30" />
        <button onClick={() => (window.history.length > 1 ? window.history.back() : navigate("/trails"))} aria-label="Back" className="absolute left-4 top-4 rounded-full bg-black/45 p-2.5 text-white backdrop-blur"><ArrowLeft size={18} /></button>
        {isAdmin && <Link href={`/admin/mission-control?tab=Trails&edit=${trail.id}`} aria-label="Edit trail" className="absolute right-4 top-4 rounded-full bg-black/45 p-2.5 text-white backdrop-blur"><Pencil size={16} /></Link>}
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-2xl px-5 pb-5">
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${DIFFICULTY_STYLE[trail.difficulty] ?? "bg-white text-[#172019]"}`}>{trail.difficulty}</span>
            {trail.isPremium && <span className="flex items-center gap-1 rounded-full bg-[#b8d435] px-2.5 py-1 text-[11px] font-bold text-[#172019]"><Sparkles size={11} />Premium</span>}
          </div>
          <h1 className="mt-2 text-2xl font-bold leading-tight text-white">{trail.title}</h1>
          <p className="mt-1 flex items-center gap-1 text-sm text-white/80"><MapPin size={14} />{trail.location}</p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-5">
        <div className="mt-5 grid grid-cols-2 gap-3">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-sm">
              <Icon size={17} className="shrink-0 text-[#8fb31c]" />
              <div className="min-w-0"><p className="text-[11px] text-[#8a938c]">{label}</p><p className="truncate text-sm font-bold text-[#172019]">{value}</p></div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-[#3d4a40] shadow-sm"><RefreshCcw size={12} className="text-[#8fb31c]" />{trail.routeType === "Loop" ? "Loop Trail" : trail.routeType}</span>
          {trail.bestSeason && <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-[#3d4a40] shadow-sm"><CalendarDays size={12} className="text-[#8fb31c]" />Best: {trail.bestSeason}</span>}
        </div>

        {trail.description && (
          <section className="mt-6">
            <h2 className="text-base font-bold text-[#172019]">About this Trail</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#5d675f]">{trail.description}</p>
          </section>
        )}

        <section className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#172019]">GPS Route</h2>
            {route.length > 1 && !premiumLocked && <Link href={`/trails?tab=Record&trailId=${trail.id}`} className="flex items-center gap-1 rounded-full bg-[#eaf1d0] px-3 py-1.5 text-xs font-bold text-[#617900]"><Play size={12} />Hike this trail</Link>}
          </div>
          {premiumLocked ? (
            <div className="mt-3 rounded-2xl bg-[#18221b] p-5 text-center text-white">
              <Sparkles className="mx-auto text-[#b8d435]" />
              <p className="mt-2 font-bold">Premium route</p>
              <p className="mt-1 text-xs text-white/65">Subscribe to Trails Premium to see the full GPS route and elevation profile.</p>
              <Link href="/trails" className="mt-4 inline-block rounded-full bg-[#b8d435] px-5 py-2 text-sm font-bold text-[#172019]">View plans</Link>
            </div>
          ) : route.length > 0 ? (
            <>
              <div className="mt-3 overflow-hidden rounded-2xl shadow-sm"><RouteMap points={route} className="h-64 w-full" /></div>
              <p className="mt-2 text-center text-xs text-[#8a938c]">{route.length.toLocaleString()} recorded waypoints</p>
            </>
          ) : (
            <div className="mt-3 rounded-2xl bg-white p-6 text-center text-xs text-[#8a938c]">The GPS route for this trail has not been uploaded yet.</div>
          )}
        </section>

        {!premiumLocked && (
          <section className="mt-6">
            <h2 className="text-base font-bold text-[#172019]">Elevation Profile</h2>
            <div className="mt-3"><ElevationProfile points={route} /></div>
          </section>
        )}

        {trail.tags && trail.tags.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {trail.tags.map((tag) => <span key={tag} className="flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs text-[#5d675f] shadow-sm"><Tag size={11} />{tag}</span>)}
          </div>
        )}
      </div>

      <button onClick={() => setGuideOpen(true)} className="fixed bottom-24 right-5 z-40 flex items-center gap-2 rounded-full bg-[#18221b] px-4 py-3 text-sm font-bold text-white shadow-lg"><Bot size={17} className="text-[#b8d435]" />AI Trail Guide</button>
      {guideOpen && <TrailGuide trailId={trail.id} trailTitle={trail.title} onClose={() => setGuideOpen(false)} />}
    </div>
  );
}

const SUGGESTIONS = ["What should I bring?", "Is it good for beginners?", "Best time of day to start?", "Is there water on the trail?"];

function TrailGuide({ trailId, trailTitle, onClose }: { trailId: number; trailTitle: string; onClose: () => void }) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "guide"; text: string }[]>([]);
  const ask = trpc.trailExplorer.trailGuide.useMutation({
    onSuccess: (result) => setMessages((prev) => [...prev, { role: "guide", text: result.answer }]),
    onError: (error) => toast.error(error.message),
  });
  const send = (text: string) => {
    const value = text.trim();
    if (!value || ask.isPending) return;
    setMessages((prev) => [...prev, { role: "user", text: value }]);
    setQuestion("");
    ask.mutate({ trailId, question: value });
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-t-3xl bg-white" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
          <div className="flex items-center gap-2"><div className="rounded-xl bg-[#18221b] p-2"><Bot size={16} className="text-[#b8d435]" /></div><div><p className="text-sm font-bold text-[#172019]">AI Trail Guide</p><p className="text-[11px] text-[#8a938c]">{trailTitle}</p></div></div>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-2 text-[#8a938c] hover:bg-[#f1f4ee]"><X size={18} /></button>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {messages.length === 0 && (
            <div>
              <p className="text-sm text-[#5d675f]">Ask about gear, difficulty, timing, or safety on this trail.</p>
              <div className="mt-3 flex flex-wrap gap-2">{SUGGESTIONS.map((s) => <button key={s} onClick={() => send(s)} className="rounded-full bg-[#f1f6dd] px-3 py-1.5 text-xs font-medium text-[#617900]">{s}</button>)}</div>
            </div>
          )}
          {messages.map((m, i) => <div key={i} className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${m.role === "user" ? "ml-auto bg-[#b8d435] text-[#172019]" : "bg-[#f4f6ef] text-[#2b352d]"}`}>{m.text}</div>)}
          {ask.isPending && <div className="flex items-center gap-2 text-xs text-[#8a938c]"><Loader2 size={14} className="animate-spin" />Thinking...</div>}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); send(question); }} className="flex gap-2 border-t border-black/5 p-4 pb-6">
          <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask the trail guide..." maxLength={500} className="min-w-0 flex-1 rounded-full bg-[#f4f6ef] px-4 py-2.5 text-sm outline-none" />
          <button type="submit" disabled={!question.trim() || ask.isPending} aria-label="Send" className="rounded-full bg-[#b8d435] p-3 text-[#172019] disabled:opacity-50"><Send size={16} /></button>
        </form>
      </div>
    </div>
  );
}
