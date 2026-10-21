import { Link, useLocation, useSearch } from "wouter";
import { Check, Clock3, Loader2, Map, MessageCircle, Mountain, Navigation, Pause, Play, Search, Sparkles, Square, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import RouteMap from "@/components/RouteMap";
import { useTrailRecorder } from "@/hooks/useTrailRecorder";
import { formatClock, formatMinutes } from "@/lib/trailMath";

const BENEFITS = [
  "Full GPS trail routes & waypoints",
  "Elevation profiles for all trails",
  "AI trail guide & safety tips",
  "Unlimited trail recordings",
];
const FILTERS = ["All", "Easy", "Moderate", "Hard", "Expert"] as const;
const TABS = ["Explore", "Record", "My Trails"] as const;
type Tab = (typeof TABS)[number];

export default function Trails() {
  const search = useSearch();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const initialTab = (TABS as readonly string[]).includes(params.get("tab") ?? "") ? (params.get("tab") as Tab) : "Explore";
  const { isAuthenticated } = useAuth();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [query, setQuery] = useState("");
  const { data: trails = [], isLoading } = trpc.trailExplorer.catalog.useQuery();
  const { data: recordings = [], isLoading: recordingsLoading } = trpc.trailExplorer.recordings.useQuery(undefined, { enabled: isAuthenticated });
  const { data: subscription } = trpc.trailExplorer.subscription.useQuery(undefined, { enabled: isAuthenticated });
  const utils = trpc.useUtils();
  const subscribe = trpc.trailExplorer.subscribe.useMutation({
    onSuccess: () => { utils.trailExplorer.subscription.invalidate(); toast.success("Trails Premium is active on your account"); },
    onError: (error) => toast.error(error.message),
  });

  useEffect(() => setTab(initialTab), [initialTab]);

  const visibleTrails = trails.filter((trail) =>
    (filter === "All" || trail.difficulty === filter) &&
    (!query.trim() || `${trail.title} ${trail.location}`.toLowerCase().includes(query.trim().toLowerCase())),
  );
  const premiumCount = trails.filter((t) => t.isPremium).length;
  const isPremium = subscription?.status === "active";

  return (
    <div className="min-h-screen bg-[#f7f8f5] px-5 pb-8 pt-10">
      <div className="mx-auto max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#91a72b]">Explore Lebanon</p>
        <div className="mt-2 flex items-end justify-between gap-4">
          <div><p className="text-sm font-medium text-[#7f8981]">Find your route</p><h1 className="text-3xl font-bold tracking-tight text-[#172019]">Trail Explorer</h1></div>
          <button onClick={() => setTab("Record")} className="flex items-center gap-1.5 rounded-2xl bg-[#18221b] px-4 py-3 text-xs font-bold text-white"><Navigation size={15} className="text-[#b8d435]" />Record</button>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          {[["Total Trails", trails.length], ["Shown", visibleTrails.length], ["Premium", premiumCount]].map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-white p-3 text-center shadow-sm"><p className="text-xl font-bold text-[#172019]">{value}</p><p className="text-[11px] text-[#8a938c]">{label}</p></div>
          ))}
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          {TABS.map((item) => (
            <button key={item} onClick={() => setTab(item)} className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold ${tab === item ? "bg-[#b8d435] text-[#172019]" : "bg-white text-[#7f8981]"}`}>{item}</button>
          ))}
          <Link href="/community" className="whitespace-nowrap rounded-full bg-white px-4 py-2 text-xs font-bold text-[#7f8981]">Community</Link>
        </div>

        {tab === "Explore" && (
          <>
            {!isPremium && (
              <section className="relative mt-6 overflow-hidden rounded-3xl bg-[#18221b] p-6 text-white shadow-[0_16px_35px_rgba(24,34,27,0.16)]">
                <div className="absolute -right-8 -top-12 h-40 w-40 rounded-full bg-[#b8d435]/20 blur-2xl" /><Mountain className="absolute right-6 top-8 text-[#b8d435]/40" size={92} strokeWidth={1} />
                <div className="relative">
                  <div className="flex items-start justify-between"><div className="rounded-xl bg-[#b8d435] p-2 text-[#172019]"><Sparkles size={18} /></div><span className="text-2xl font-bold">$4</span></div>
                  <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-[#b8d435]">Trails Premium</p>
                  <h2 className="mt-2 text-2xl font-bold">Unlock Lebanon's full trail network</h2>
                  <ul className="mt-4 space-y-1.5">{BENEFITS.map((b) => <li key={b} className="flex items-center gap-2 text-sm text-white/80"><Check size={14} className="text-[#b8d435]" />{b}</li>)}</ul>
                  <p className="mt-4 text-xs text-white/55">Monthly subscription · Cancel anytime</p>
                  <button onClick={() => isAuthenticated ? subscribe.mutate({ plan: "monthly" }) : (window.location.href = getLoginUrl())} disabled={subscribe.isPending} className="mt-4 w-full rounded-2xl bg-[#b8d435] px-4 py-3 text-sm font-bold text-[#172019] transition hover:bg-[#c7e04d]">{subscribe.isPending ? "Activating..." : isAuthenticated ? "Subscribe for $4/mo" : "Sign in to subscribe"}</button>
                </div>
              </section>
            )}
            {isPremium && <div className="mt-6 flex items-center gap-2 rounded-2xl bg-[#eaf1d0] px-4 py-3 text-sm font-bold text-[#617900]"><Sparkles size={16} />Trails Premium active{subscription?.renewalDate ? ` · renews ${new Date(subscription.renewalDate).toLocaleDateString()}` : ""}</div>}

            <div className="mt-5 flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-sm"><Search size={16} className="text-[#9aa39b]" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search trails or regions..." className="min-w-0 flex-1 bg-transparent text-sm outline-none" /></div>
            <div className="mt-4 flex gap-2 overflow-x-auto">{FILTERS.map((item) => <button key={item} onClick={() => setFilter(item)} className={`rounded-full px-3 py-2 text-xs font-bold ${filter === item ? "bg-[#b8d435] text-[#172019]" : "bg-white text-[#7f8981]"}`}>{item}</button>)}</div>
            <div className="mt-6 flex items-center justify-between"><h2 className="text-lg font-bold text-[#172019]">Explore Trails</h2><span className="text-xs text-[#8a938c]">{visibleTrails.length} shown</span></div>
            {isLoading ? (
              <div className="mt-5 flex justify-center rounded-3xl bg-white p-8"><Loader2 className="animate-spin text-[#91a72b]" /></div>
            ) : visibleTrails.length === 0 ? (
              <div className="mt-5 rounded-3xl bg-white p-8 text-center"><Mountain className="mx-auto text-[#b8d435]" /><p className="mt-3 text-sm font-bold text-[#263229]">{trails.length === 0 ? "No trails yet" : "No trails match your search"}</p><p className="mt-1 text-xs text-[#8a938c]">{trails.length === 0 ? "New routes will appear here soon." : "Try another difficulty or keyword."}</p></div>
            ) : (
              <div className="mt-4 space-y-3">
                {visibleTrails.map((trail) => (
                  <Link key={trail.id} href={`/trail/${trail.id}`}>
                    <article className="mb-3 overflow-hidden rounded-3xl bg-white shadow-sm transition hover:shadow-md">
                      <div className="relative h-32 bg-[#dfe8c4]">
                        {trail.imageUrl ? <img src={trail.imageUrl} alt={trail.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><Mountain size={40} className="text-[#91a72b]/50" strokeWidth={1.2} /></div>}
                        {trail.isPremium && <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-[#18221b]/85 px-2.5 py-1 text-[10px] font-bold text-[#b8d435]"><Sparkles size={10} />Premium</span>}
                      </div>
                      <div className="p-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-[#91a72b]">{trail.difficulty} · {trail.location}</p>
                        <h3 className="mt-1 text-lg font-bold text-[#172019]">{trail.title}</h3>
                        <div className="mt-3 flex flex-wrap gap-4 text-xs text-[#7f8981]"><span className="flex items-center gap-1"><TrendingUp size={13} />{trail.distanceKm} km</span><span className="flex items-center gap-1"><Mountain size={13} />+{trail.elevationM} m</span><span className="flex items-center gap-1"><Clock3 size={13} />{trail.duration}</span></div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "Record" && <RecordPanel trails={trails} defaultTrailId={params.get("trailId") ? Number(params.get("trailId")) : undefined} isAuthenticated={isAuthenticated} onSaved={() => setTab("My Trails")} />}

        {tab === "My Trails" && (
          <section className="mt-6">
            <h2 className="text-lg font-bold text-[#172019]">My Trail Recordings</h2>
            {!isAuthenticated ? (
              <div className="mt-4 rounded-3xl bg-white p-8 text-center text-sm text-[#8a938c]">Sign in to see your recorded routes.</div>
            ) : recordingsLoading ? (
              <div className="mt-4 flex justify-center rounded-3xl bg-white p-8"><Loader2 className="animate-spin text-[#91a72b]" /></div>
            ) : recordings.length === 0 ? (
              <div className="mt-4 rounded-3xl bg-white p-8 text-center text-sm text-[#8a938c]">No recordings yet. Record your next adventure from the Record tab.</div>
            ) : (
              <div className="mt-4 space-y-3">
                {recordings.map(({ recording, trail }) => (
                  <Link key={recording.id} href={`/recording/${recording.id}`}>
                    <div className="mb-3 rounded-3xl bg-white p-4 shadow-sm transition hover:shadow-md">
                      <div className="flex items-center justify-between gap-3"><h3 className="truncate font-bold text-[#172019]">{recording.title}</h3><span className="shrink-0 text-xs text-[#91a72b]">{trail?.title ?? "Personal route"}</span></div>
                      <p className="mt-1 text-[11px] text-[#9aa39b]">{new Date(recording.startedAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</p>
                      <div className="mt-3 flex gap-4 text-xs text-[#7f8981]"><span>{recording.distanceKm} km</span><span>+{recording.elevationM} m</span><span>{formatMinutes(recording.durationMinutes)}</span>{Array.isArray(recording.routeData) && recording.routeData.length > 1 && <span className="flex items-center gap-1 text-[#91a72b]"><Navigation size={11} />GPS</span>}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        <a href="https://wa.me/96176828401?text=Hi%20Mountain%20Rangers%2C%20I%20have%20a%20question%20about%20the%20trails." target="_blank" rel="noreferrer" className="mt-5 flex items-center justify-center gap-2 rounded-2xl border border-[#dfe6c7] bg-[#f1f6dd] px-4 py-3 text-sm font-bold text-[#617900]"><MessageCircle size={17} />Have questions? Chat on WhatsApp</a>
      </div>
    </div>
  );
}

function RecordPanel({ trails, defaultTrailId, isAuthenticated, onSaved }: { trails: { id: number; title: string }[]; defaultTrailId?: number; isAuthenticated: boolean; onSaved: () => void }) {
  const [, navigate] = useLocation();
  const recorder = useTrailRecorder();
  const utils = trpc.useUtils();
  const [mode, setMode] = useState<"gps" | "manual">("gps");
  const [title, setTitle] = useState("");
  const [trailId, setTrailId] = useState<number | undefined>(defaultTrailId);
  const [distance, setDistance] = useState("");
  const [elevation, setElevation] = useState("");
  const [duration, setDuration] = useState("");
  const record = trpc.trailExplorer.record.useMutation({
    onSuccess: (result) => {
      toast.success("Trail recording saved");
      utils.trailExplorer.recordings.invalidate();
      utils.profile.stats.invalidate();
      utils.trailExplorer.myChallenges.invalidate();
      setTitle(""); setDistance(""); setElevation(""); setDuration("");
      recorder.reset();
      if (result?.id) navigate(`/recording/${result.id}`); else onSaved();
    },
    onError: (error) => toast.error(error.message),
  });

  useEffect(() => {
    if (defaultTrailId && !title) setTitle(trails.find((t) => t.id === defaultTrailId)?.title ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultTrailId, trails]);

  if (!isAuthenticated) {
    return <section className="mt-6 rounded-3xl bg-white p-6 text-center shadow-sm"><Navigation className="mx-auto text-[#b8d435]" /><p className="mt-3 text-sm text-[#7f8981]">Sign in to record and save your hikes.</p><Button onClick={() => (window.location.href = getLoginUrl())} className="mt-4 rounded-2xl bg-[#b8d435] font-bold text-[#172019] hover:bg-[#c7e04d]">Sign in</Button></section>;
  }

  const finishGps = () => {
    const summary = recorder.stop();
    if (summary.points.length < 2) {
      toast.error("Not enough GPS points were captured to save this route.");
      return;
    }
    record.mutate({
      title: title.trim() || `Hike on ${new Date().toLocaleDateString()}`,
      trailId,
      distanceKm: summary.distanceKm,
      elevationM: summary.elevationM,
      durationMinutes: summary.durationMinutes,
      routeData: summary.points,
      startedAt: summary.startedAt,
      endedAt: summary.endedAt,
    });
  };

  return (
    <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3"><div className="rounded-xl bg-[#eaf1d0] p-3 text-[#719000]"><Play size={20} /></div><div><h2 className="text-lg font-bold text-[#172019]">Record a trail</h2><p className="text-xs text-[#8a938c]">Track your hike live with GPS or enter it manually.</p></div></div>
      <div className="mt-4 grid grid-cols-2 gap-1 rounded-2xl bg-[#f4f6ef] p-1">
        {(["gps", "manual"] as const).map((m) => <button key={m} onClick={() => recorder.status === "idle" && setMode(m)} disabled={recorder.status !== "idle"} className={`rounded-xl py-2 text-xs font-bold ${mode === m ? "bg-white text-[#172019] shadow-sm" : "text-[#7f8981]"}`}>{m === "gps" ? "Live GPS" : "Manual entry"}</button>)}
      </div>

      <div className="mt-4 space-y-3">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Trail or route name" className="w-full rounded-2xl bg-[#f4f6ef] px-4 py-3 text-sm outline-none" />
        <select value={trailId ?? ""} onChange={(e) => setTrailId(e.target.value ? Number(e.target.value) : undefined)} className="w-full rounded-2xl bg-[#f4f6ef] px-4 py-3 text-sm text-[#3d4a40] outline-none">
          <option value="">Personal route (not linked to a trail)</option>
          {trails.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
        </select>
      </div>

      {mode === "gps" ? (
        <div className="mt-4">
          {!recorder.supported && <p className="rounded-2xl bg-amber-50 p-3 text-xs text-amber-700">GPS is not available in this browser. Use manual entry instead.</p>}
          <div className="grid grid-cols-3 gap-2">
            <Metric label="Time" value={formatClock(recorder.elapsedSeconds)} />
            <Metric label="Distance" value={`${recorder.distanceKm.toFixed(2)} km`} />
            <Metric label="Climb" value={`+${recorder.elevationM} m`} />
          </div>
          {recorder.status !== "idle" && <div className="mt-3 overflow-hidden rounded-2xl"><RouteMap points={recorder.points} live className="h-56 w-full" /></div>}
          <p className="mt-2 text-center text-[11px] text-[#9aa39b]">{recorder.status === "recording" ? `Recording · ${recorder.points.length} points${recorder.accuracy ? ` · ±${Math.round(recorder.accuracy)} m` : ""}` : recorder.status === "paused" ? "Paused" : "Keep this screen open while you hike for the best tracking."}</p>
          {recorder.error && <p className="mt-2 rounded-2xl bg-red-50 p-3 text-xs text-red-600">{recorder.error}</p>}
          <div className="mt-4 flex gap-2">
            {recorder.status === "idle" && <Button onClick={recorder.start} disabled={!recorder.supported || record.isPending} className="flex-1 rounded-2xl bg-[#b8d435] py-6 font-bold text-[#172019] hover:bg-[#c7e04d]"><Play size={16} className="mr-2" />{record.isPending ? "Saving..." : "Start recording"}</Button>}
            {recorder.status === "recording" && <Button onClick={recorder.pause} className="flex-1 rounded-2xl bg-[#f4f6ef] py-6 font-bold text-[#172019] hover:bg-[#e9eee2]"><Pause size={16} className="mr-2" />Pause</Button>}
            {recorder.status === "paused" && <Button onClick={recorder.resume} className="flex-1 rounded-2xl bg-[#b8d435] py-6 font-bold text-[#172019] hover:bg-[#c7e04d]"><Play size={16} className="mr-2" />Resume</Button>}
            {recorder.status !== "idle" && <Button onClick={finishGps} className="flex-1 rounded-2xl bg-[#18221b] py-6 font-bold text-white hover:bg-[#243026]"><Square size={14} className="mr-2" />Finish & save</Button>}
          </div>
          {recorder.status !== "idle" && <button onClick={() => { if (window.confirm("Discard this recording?")) recorder.reset(); }} className="mt-3 w-full text-center text-xs font-medium text-[#9aa39b] hover:text-red-500">Discard recording</button>}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <input value={distance} onChange={(e) => setDistance(e.target.value)} placeholder="km" type="number" min="0" step="0.1" className="rounded-2xl bg-[#f4f6ef] px-4 py-3 text-sm outline-none" />
            <input value={elevation} onChange={(e) => setElevation(e.target.value)} placeholder="climb m" type="number" min="0" className="rounded-2xl bg-[#f4f6ef] px-4 py-3 text-sm outline-none" />
            <input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="minutes" type="number" min="0" className="rounded-2xl bg-[#f4f6ef] px-4 py-3 text-sm outline-none" />
          </div>
          <Button onClick={() => record.mutate({ title: title.trim(), trailId, distanceKm: Number(distance), elevationM: Number(elevation || 0), durationMinutes: Number(duration || 0) })} disabled={record.isPending || !title.trim() || !distance || Number(distance) <= 0} className="w-full rounded-2xl bg-[#b8d435] py-6 font-bold text-[#172019] hover:bg-[#c7e04d]">{record.isPending ? "Saving..." : "Save recording"}</Button>
        </div>
      )}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-[#f4f6ef] p-3 text-center"><p className="text-base font-bold tabular-nums text-[#172019]">{value}</p><p className="text-[11px] text-[#8a938c]">{label}</p></div>;
}
