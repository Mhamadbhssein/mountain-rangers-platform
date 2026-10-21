import { Link, useLocation, useParams } from "wouter";
import { ArrowLeft, CalendarDays, Clock3, Gauge, Loader2, Mountain, Navigation, Ruler, Share2, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import RouteMap from "@/components/RouteMap";
import ElevationProfile from "@/components/ElevationProfile";
import { formatMinutes, maxElevationM, type RoutePoint } from "@/lib/trailMath";

export default function RecordingDetail() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [, navigate] = useLocation();
  const { isAuthenticated, loading } = useAuth();
  const { data, isLoading, error } = trpc.trailExplorer.recording.useQuery({ id }, { enabled: isAuthenticated && Number.isFinite(id) });

  if (loading || isLoading) return <div className="flex min-h-screen items-center justify-center bg-[#f7f8f5]"><Loader2 className="animate-spin text-[#91a72b]" /></div>;
  if (!isAuthenticated || error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f7f8f5] px-6 text-center">
        <Navigation className="text-[#b8d435]" size={36} />
        <p className="mt-3 font-bold text-[#172019]">{!isAuthenticated ? "Sign in to view this recording" : "Recording not found"}</p>
        <Link href="/trails?tab=My%20Trails" className="mt-4 rounded-full bg-[#b8d435] px-5 py-2 text-sm font-bold text-[#172019]">My trails</Link>
      </div>
    );
  }

  const { recording, trail } = data;
  const route = (recording.routeData ?? []) as RoutePoint[];
  const distance = parseFloat(String(recording.distanceKm));
  const pace = distance > 0 && recording.durationMinutes > 0 ? recording.durationMinutes / distance : null;
  const peak = maxElevationM(route);
  const stats = [
    { label: "Distance", value: `${recording.distanceKm} km`, icon: Ruler },
    { label: "Elevation Gain", value: `+${recording.elevationM} m`, icon: TrendingUp },
    { label: "Moving Time", value: formatMinutes(recording.durationMinutes), icon: Clock3 },
    { label: "Avg Pace", value: pace ? `${Math.floor(pace)}:${String(Math.round((pace % 1) * 60)).padStart(2, "0")} /km` : "—", icon: Gauge },
  ];

  const share = async () => {
    const text = `I hiked ${recording.distanceKm} km with +${recording.elevationM} m of climbing on "${recording.title}" with Mountain Rangers.`;
    try {
      if (navigator.share) await navigator.share({ title: recording.title, text, url: window.location.origin });
      else { await navigator.clipboard.writeText(`${text} ${window.location.origin}`); toast.success("Copied to clipboard"); }
    } catch { /* user cancelled */ }
  };

  return (
    <div className="min-h-screen bg-[#f7f8f5] px-5 pb-10 pt-8">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <button onClick={() => (window.history.length > 1 ? window.history.back() : navigate("/trails"))} aria-label="Back" className="rounded-full bg-white p-2.5 shadow-sm"><ArrowLeft size={18} className="text-[#172019]" /></button>
          <button onClick={share} aria-label="Share" className="rounded-full bg-white p-2.5 shadow-sm"><Share2 size={17} className="text-[#172019]" /></button>
        </div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.22em] text-[#91a72b]">Trail Recording</p>
        <h1 className="mt-1 text-2xl font-bold text-[#172019]">{recording.title}</h1>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[#7f8981]">
          <span className="flex items-center gap-1"><CalendarDays size={12} />{new Date(recording.startedAt).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
          {trail && <Link href={`/trail/${trail.id}`} className="flex items-center gap-1 font-semibold text-[#617900]"><Mountain size={12} />{trail.title}</Link>}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-sm"><Icon size={17} className="text-[#8fb31c]" /><div><p className="text-[11px] text-[#8a938c]">{label}</p><p className="text-sm font-bold text-[#172019]">{value}</p></div></div>
          ))}
        </div>

        <section className="mt-6">
          <h2 className="text-base font-bold text-[#172019]">Route</h2>
          {route.length > 1 ? (
            <>
              <div className="mt-3 overflow-hidden rounded-2xl shadow-sm"><RouteMap points={route} className="h-72 w-full" /></div>
              <p className="mt-2 text-center text-xs text-[#8a938c]">{route.length.toLocaleString()} GPS points{peak ? ` · highest point ${peak} m` : ""}</p>
            </>
          ) : (
            <div className="mt-3 rounded-2xl bg-white p-6 text-center text-xs text-[#8a938c]">This recording was entered manually, so there is no GPS route.</div>
          )}
        </section>

        {route.length > 1 && (
          <section className="mt-6">
            <h2 className="text-base font-bold text-[#172019]">Elevation Profile</h2>
            <div className="mt-3"><ElevationProfile points={route} /></div>
          </section>
        )}
      </div>
    </div>
  );
}
