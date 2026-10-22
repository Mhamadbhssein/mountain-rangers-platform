import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { CalendarCheck, CreditCard, Megaphone, Mountain, Plus, Route, ShieldCheck, Sparkles, Trophy, Upload } from "lucide-react";

const tabs = ["Overview", "Manifest", "Trails", "Import Trails", "Recordings", "Trail Subscriptions", "Broadcast", "Challenges", "Rewards", "Home Banner"] as const;
type Tab = (typeof tabs)[number];

export default function AdminMissionControl() {
  const [tab, setTab] = useState<Tab>("Overview");
  const [showCreate, setShowCreate] = useState(false);
  const utils = trpc.useUtils();
  const { data: stats } = trpc.admin.stats.useQuery();
  const { data: overview } = trpc.admin.missionOverview.useQuery(undefined, { enabled: tab === "Overview" });
  const { data: manifest } = trpc.admin.manifest.useQuery(undefined, { enabled: tab === "Manifest" || tab === "Overview" });
  const { data: trails } = trpc.admin.trailCatalog.useQuery(undefined, { enabled: tab === "Trails" });
  const { data: recordings } = trpc.admin.allRecordings.useQuery(undefined, { enabled: tab === "Recordings" });
  const { data: subscriptions } = trpc.admin.trailSubscriptions.useQuery(undefined, { enabled: tab === "Trail Subscriptions" });
  const { data: broadcasts } = trpc.admin.broadcasts.useQuery(undefined, { enabled: tab === "Broadcast" });
  const { data: challenges } = trpc.admin.challenges.useQuery(undefined, { enabled: tab === "Challenges" });
  const { data: rewards } = trpc.admin.rewards.useQuery(undefined, { enabled: tab === "Rewards" });
  const { data: banners } = trpc.admin.homeBanners.useQuery(undefined, { enabled: tab === "Home Banner" });

  const checkIn = trpc.admin.checkInBooking.useMutation({
    onSuccess: () => { utils.admin.manifest.invalidate(); toast.success("Manifest updated"); },
    onError: (error) => toast.error(error.message),
  });
  const createTrail = trpc.admin.createTrail.useMutation({ onSuccess: () => { utils.admin.trailCatalog.invalidate(); setShowCreate(false); toast.success("Trail added"); } });
  const importTrails = trpc.admin.importTrails.useMutation({ onSuccess: (result) => { utils.admin.trailCatalog.invalidate(); setShowCreate(false); toast.success(`${result.imported} trails imported`); }, onError: (error) => toast.error(error.message) });
  const createChallenge = trpc.admin.createChallenge.useMutation({ onSuccess: () => { utils.admin.challenges.invalidate(); setShowCreate(false); toast.success("Challenge added"); } });
  const createReward = trpc.admin.createReward.useMutation({ onSuccess: () => { utils.admin.rewards.invalidate(); setShowCreate(false); toast.success("Reward added"); } });
  const createBanner = trpc.admin.createHomeBanner.useMutation({ onSuccess: () => { utils.admin.homeBanners.invalidate(); setShowCreate(false); toast.success("Home banner added"); } });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-lime-400">Admin</p>
            <h1 className="mt-1 text-3xl font-bold text-white">Mission Control</h1>
            <p className="mt-1 text-sm text-gray-400">Manage trips, members, content, rewards, and trail activity.</p>
          </div>
          {tab !== "Overview" && tab !== "Manifest" && tab !== "Broadcast" && tab !== "Import Trails" && tab !== "Recordings" && tab !== "Trail Subscriptions" && (
            <Button onClick={() => setShowCreate((value) => !value)} className="bg-lime-500 text-black hover:bg-lime-400">
              <Plus className="mr-2 h-4 w-4" /> New {tab}
            </Button>
          )}
        </header>

        <div className="flex gap-2 overflow-x-auto border-b border-[#1a2a1a] pb-2">
          {tabs.map((item) => (
            <button key={item} onClick={() => { setTab(item); setShowCreate(false); }} className={`whitespace-nowrap rounded-full px-3 py-2 text-xs font-medium transition ${tab === item ? "bg-lime-500 text-black" : "bg-white/5 text-gray-400 hover:text-white"}`}>
              {item}
            </button>
          ))}
        </div>

        {tab === "Overview" && <Overview stats={stats} overview={overview} manifestCount={manifest?.length ?? 0} />}
        {tab === "Manifest" && <Manifest rows={manifest ?? []} onCheckIn={(id, checkedIn) => checkIn.mutate({ bookingId: id, checkedIn })} />}
        {tab === "Trails" && <TrailPanel trails={trails ?? []} showCreate={showCreate} onCreate={(value) => createTrail.mutate(value)} />}
        {tab === "Import Trails" && <ImportPanel onImport={(value) => importTrails.mutate({ trails: value })} />}
        {tab === "Recordings" && <RecordingPanel rows={recordings ?? []} />}
        {tab === "Trail Subscriptions" && <SubscriptionPanel rows={subscriptions ?? []} />}
        {tab === "Broadcast" && <BroadcastPanel rows={broadcasts ?? []} />}
        {tab === "Challenges" && <ChallengePanel rows={challenges ?? []} showCreate={showCreate} onCreate={(value) => createChallenge.mutate(value)} />}
        {tab === "Rewards" && <RewardPanel rows={rewards ?? []} showCreate={showCreate} onCreate={(value) => createReward.mutate(value)} />}
        {tab === "Home Banner" && <BannerPanel rows={banners ?? []} showCreate={showCreate} onCreate={(value) => createBanner.mutate(value)} />}
      </div>
    </AdminLayout>
  );
}

function Overview({ stats, overview, manifestCount }: { stats?: { totalRevenue: number; totalBookings: number; activeTrips: number; totalUsers: number }; overview?: { statusCounts: Record<string, number>; trailSubsMrr: number; revenueByMonth: { month: string; revenue: number }[]; upcomingTrips: any[] }; manifestCount: number }) {
  const cards = [
    ["Total Revenue", `$${stats?.totalRevenue ?? 0}`, Sparkles],
    ["Total Bookings", String(stats?.totalBookings ?? 0), CalendarCheck],
    ["Active Trips", String(stats?.activeTrips ?? 0), Mountain],
    ["Trail Subs MRR", `$${overview?.trailSubsMrr ?? 0}/mo`, CreditCard],
    ["Members", String(stats?.totalUsers ?? 0), ShieldCheck],
  ] as const;
  const maxRevenue = Math.max(...(overview?.revenueByMonth ?? []).map((item) => item.revenue), 1);
  const statuses = [["Pending", "pending"], ["Confirmed", "confirmed"], ["Checked In", "checkedIn"], ["Completed", "completed"], ["Cancelled", "cancelled"]] as const;
  return <div className="space-y-5">
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{cards.map(([label, value, Icon]) => <div key={label} className="rounded-2xl border border-[#1a2a1a] bg-[#0d150d] p-4"><Icon className="h-5 w-5 text-lime-400" /><p className="mt-4 text-2xl font-bold text-white">{value}</p><p className="mt-1 text-xs text-gray-500">{label}</p></div>)}</div>
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel title="Booking Status" icon={CalendarCheck}><div className="grid grid-cols-2 gap-2 sm:grid-cols-5">{statuses.map(([label, key]) => <div key={key} className="rounded-xl bg-white/5 p-3"><p className="text-xl font-bold text-white">{overview?.statusCounts?.[key] ?? 0}</p><p className="text-[11px] text-gray-500">{label}</p></div>)}</div></Panel>
      <Panel title="Revenue · Last 6 Months" icon={CreditCard}><div className="flex h-32 items-end gap-2">{(overview?.revenueByMonth ?? []).map((item) => <div key={item.month} className="flex flex-1 flex-col items-center gap-1"><span className="text-[10px] text-gray-400">${Math.round(item.revenue)}</span><div className="w-full rounded-t bg-lime-500" style={{ height: `${Math.max(8, item.revenue / maxRevenue * 88)}px` }} /><span className="text-[10px] text-gray-500">{item.month}</span></div>)}</div></Panel>
    </div>
    <Panel title="Upcoming Trips" icon={Mountain}>{(overview?.upcomingTrips ?? []).length === 0 ? <Empty text="No upcoming trips." /> : <List rows={overview?.upcomingTrips ?? []} render={(trip) => <><p className="font-semibold text-white">{trip.title}</p><p className="text-xs text-gray-500">{new Date(trip.date).toLocaleDateString()} · {trip.time} · {trip.totalSeats} seats</p></>} />}</Panel>
    <p className="text-xs text-gray-500">Manifest currently has {manifestCount} active booking rows.</p>
  </div>;
}
function Manifest({ rows, onCheckIn }: { rows: any[]; onCheckIn: (id: number, checkedIn: boolean) => void }) {
  return <Panel title="Trip Manifest" icon={CalendarCheck}>{rows.length === 0 ? <Empty text="No active bookings in the manifest." /> : <div className="space-y-2">{rows.map(({ booking, trip, user }) => <div key={booking.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-[#1a2a1a] bg-[#0d150d] p-3"><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-white">{user.name ?? "Guest"} · {trip.title}</p><p className="text-xs text-gray-500">{booking.referenceCode} · seats {(booking.seats ?? []).join(", ")} · {booking.phone ?? user.phone ?? "No phone"}</p></div><Button size="sm" onClick={() => onCheckIn(booking.id, !booking.checkedIn)} className={booking.checkedIn ? "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30" : "bg-lime-500 text-black hover:bg-lime-400"}>{booking.checkedIn ? "Checked in" : "Check in"}</Button></div>)}</div>}</Panel>;
}

function TrailPanel({ trails, showCreate, onCreate }: { trails: any[]; showCreate: boolean; onCreate: (value: any) => void }) {
  const [title, setTitle] = useState(""); const [location, setLocation] = useState(""); const [distance, setDistance] = useState("7"); const [elevation, setElevation] = useState("0"); const [maxElevation, setMaxElevation] = useState(""); const [season, setSeason] = useState(""); const [description, setDescription] = useState(""); const [tags, setTags] = useState("");
  return <Panel title="Trail Catalog" icon={Mountain}>{showCreate && <SimpleForm onSubmit={() => onCreate({ title, location, difficulty: "Moderate", distanceKm: Number(distance), elevationM: Number(elevation), maxElevationM: maxElevation ? Number(maxElevation) : undefined, duration: "2 hours", bestSeason: season || undefined, description: description || undefined, tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean), routeType: "Loop", isPremium: false })}><Input placeholder="Trail name" value={title} onChange={(e) => setTitle(e.target.value)} /><Input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} /><Input placeholder="Distance km" value={distance} onChange={(e) => setDistance(e.target.value)} /><Input placeholder="Elevation gain m" value={elevation} onChange={(e) => setElevation(e.target.value)} /><Input placeholder="Max elevation m" value={maxElevation} onChange={(e) => setMaxElevation(e.target.value)} /><Input placeholder="Best season" value={season} onChange={(e) => setSeason(e.target.value)} /><Input placeholder="Tags, comma separated" value={tags} onChange={(e) => setTags(e.target.value)} /><Input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} /></SimpleForm>}<List rows={trails} render={(row) => <><p className="font-semibold text-white">{row.title}</p><p className="text-xs text-gray-500">{row.location} · {row.difficulty} · {row.distanceKm} km · +{row.elevationM} m · max {row.maxElevationM ?? "—"} m · {row.routeType ?? "Loop"}</p><p className="mt-1 text-xs text-gray-600">{row.bestSeason ?? "Season not set"}{row.tags?.length ? ` · ${row.tags.join(", ")}` : ""}</p></>} /></Panel>;
}

function BroadcastPanel({ rows }: { rows: any[]; showCreate?: boolean; onCreate?: (value: any) => void }) {
  return <Panel title="Broadcast Center" icon={Megaphone}><div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-lime-500/20 bg-lime-500/5 p-3"><p className="text-sm text-gray-300">Write, target, preview, and send custom notifications from the Notifications page.</p><Link href="/admin/notifications" className="rounded-lg bg-lime-500 px-3 py-2 text-xs font-semibold text-black hover:bg-lime-400">Open Notifications</Link></div><List rows={rows} render={(row) => <><p className="font-semibold text-white">{row.title}</p><p className="text-xs text-gray-500">{row.message} · {row.audience} · {row.status}{row.status === "sent" ? ` · ${row.recipientCount ?? 0} recipients` : ""}</p></>} /></Panel>;
}
function ChallengePanel({ rows, showCreate, onCreate }: { rows: any[]; showCreate: boolean; onCreate: (value: any) => void }) {
  const [title, setTitle] = useState(""); const [description, setDescription] = useState("");
  return <Panel title="Challenges" icon={Trophy}>{showCreate && <SimpleForm onSubmit={() => onCreate({ title, description, target: 1, rewardPoints: 100 })}><Input placeholder="Challenge title" value={title} onChange={(e) => setTitle(e.target.value)} /><Input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} /></SimpleForm>}<List rows={rows} render={(row) => <><p className="font-semibold text-white">{row.title}</p><p className="text-xs text-gray-500">{row.description} · target {row.target} · {row.rewardPoints} points</p></>} /></Panel>;
}

function RewardPanel({ rows, showCreate, onCreate }: { rows: any[]; showCreate: boolean; onCreate: (value: any) => void }) {
  const [title, setTitle] = useState(""); const [description, setDescription] = useState("");
  return <Panel title="Rewards Store" icon={Sparkles}>{showCreate && <SimpleForm onSubmit={() => onCreate({ title, description, pointsCost: 100 })}><Input placeholder="Reward title" value={title} onChange={(e) => setTitle(e.target.value)} /><Input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} /></SimpleForm>}<List rows={rows} render={(row) => <><p className="font-semibold text-white">{row.title}</p><p className="text-xs text-gray-500">{row.description} · {row.pointsCost} points</p></>} /></Panel>;
}

function BannerPanel({ rows, showCreate, onCreate }: { rows: any[]; showCreate: boolean; onCreate: (value: any) => void }) {
  const [title, setTitle] = useState(""); const [subtitle, setSubtitle] = useState("");
  return <Panel title="Home Banner" icon={Mountain}>{showCreate && <SimpleForm onSubmit={() => onCreate({ title, subtitle, sortOrder: 0 })}><Input placeholder="Banner title" value={title} onChange={(e) => setTitle(e.target.value)} /><Input placeholder="Subtitle" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} /></SimpleForm>}<List rows={rows} render={(row) => <><p className="font-semibold text-white">{row.title}</p><p className="text-xs text-gray-500">{row.subtitle ?? "No subtitle"} · {row.isActive ? "active" : "inactive"}</p></>} /></Panel>;
}

function ImportPanel({ onImport }: { onImport: (value: { title: string; location: string; difficulty: "Easy" | "Moderate" | "Hard" | "Expert"; distanceKm: number; elevationM: number; duration: string }[]) => void }) {
  const [csv, setCsv] = useState("title,location,difficulty,distanceKm,elevationM,duration\nHorsh Ehden,North Lebanon,Moderate,7.1,602,2 hours 43 minutes");
  const parse = () => {
    const rows = csv.trim().split(/\r?\n/).slice(1).map((line) => line.split(",")).filter((parts) => parts.length >= 6).map(([title, location, difficulty, distanceKm, elevationM, duration]) => ({
      title: title.trim(), location: location.trim(), difficulty: (["Easy", "Moderate", "Hard", "Expert"].includes(difficulty.trim()) ? difficulty.trim() : "Moderate") as "Easy" | "Moderate" | "Hard" | "Expert", distanceKm: Number(distanceKm), elevationM: Number(elevationM), duration: duration.trim(),
    })).filter((row) => row.title && row.location && Number.isFinite(row.distanceKm));
    if (rows.length === 0) { toast.error("Add at least one valid CSV row"); return; }
    onImport(rows);
  };
  return <Panel title="Import Trails" icon={Upload}><p className="mb-3 text-sm text-gray-400">Paste CSV rows using: title, location, difficulty, distanceKm, elevationM, duration.</p><textarea value={csv} onChange={(event) => setCsv(event.target.value)} rows={7} className="w-full rounded-xl border border-[#1a2a1a] bg-[#081008] p-3 font-mono text-xs text-white outline-none" /><Button onClick={parse} className="mt-3 bg-lime-500 text-black hover:bg-lime-400"><Upload className="mr-2 h-4 w-4" />Import CSV</Button></Panel>;
}

function RecordingPanel({ rows }: { rows: any[] }) {
  return <Panel title="Trail Recordings" icon={Route}><List rows={rows} render={({ recording, user, trail }) => <><p className="font-semibold text-white">{recording.title}</p><p className="text-xs text-gray-500">{user?.name ?? "Member"} · {trail?.title ?? "Personal route"} · {recording.distanceKm} km · +{recording.elevationM} m · {recording.durationMinutes} min</p></>} /></Panel>;
}

function SubscriptionPanel({ rows }: { rows: any[] }) {
  return <Panel title="Trail Subscriptions" icon={CreditCard}><List rows={rows} render={({ subscription, user }) => <><p className="font-semibold text-white">{user?.name ?? "Member"}</p><p className="text-xs text-gray-500">{user?.email ?? "No email"} · {subscription.plan} · {subscription.status} · renews {subscription.renewalDate ? new Date(subscription.renewalDate).toLocaleDateString() : "—"}</p></>} /></Panel>;
}

function Panel({ title, icon: Icon, children }: { title: string; icon: typeof Mountain; children: React.ReactNode }) { return <section className="rounded-2xl border border-[#1a2a1a] bg-[#0d150d] p-5"><div className="mb-4 flex items-center gap-2"><Icon className="h-5 w-5 text-lime-400" /><h2 className="text-lg font-bold text-white">{title}</h2></div>{children}</section>; }
function SimpleForm({ children, onSubmit }: { children: React.ReactNode; onSubmit: () => void }) { return <div className="mb-5 grid gap-2 rounded-xl border border-lime-500/20 bg-lime-500/5 p-3 sm:grid-cols-[1fr_1fr_auto]"><div className="contents">{children}</div><Button onClick={onSubmit} className="bg-lime-500 text-black hover:bg-lime-400">Save</Button></div>; }
function List({ rows, render }: { rows: any[]; render: (row: any) => React.ReactNode }) { return rows.length === 0 ? <Empty text="Nothing here yet." /> : <div className="space-y-2">{rows.map((row, index) => <div key={row.id ?? index} className="rounded-xl border border-[#1a2a1a] p-3">{render(row)}</div>)}</div>; }
function Empty({ text }: { text: string }) { return <p className="py-8 text-center text-sm text-gray-500">{text}</p>; }
