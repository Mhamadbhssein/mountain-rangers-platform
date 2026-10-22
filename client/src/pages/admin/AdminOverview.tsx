import { Link } from "wouter";
import { CalendarCheck, CheckCircle2, Clock3, DollarSign, MapPin, Mountain, Users, XCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

const navItems = [
  ["Overview", "/admin"],
  ["Trips", "/admin/trips"],
  ["Bookings", "/admin/bookings"],
  ["Manifest", "/admin/mission-control?tab=Manifest"],
  ["Loyalty", "/admin/loyalty"],
  ["Users", "/admin/users"],
  ["Broadcast", "/admin/notifications"],
  ["Import Trails", "/admin/mission-control?tab=Import%20Trails"],
  ["Trail Subs", "/admin/mission-control?tab=Trail%20Subscriptions"],
  ["Challenges", "/admin/mission-control?tab=Challenges"],
  ["Rewards", "/admin/mission-control?tab=Rewards"],
  ["Home Banner", "/admin/mission-control?tab=Home%20Banner"],
] as const;

export default function AdminOverview() {
  const { data: stats } = trpc.admin.stats.useQuery();
  const { data: overview } = trpc.admin.missionOverview.useQuery();
  const { data: recentBookings = [] } = trpc.admin.recentBookings.useQuery();
  const maxRevenue = Math.max(...(overview?.revenueByMonth ?? []).map((item) => item.revenue), 1);
  const statCards = [
    { label: "Total Revenue", value: `$${Math.round(stats?.totalRevenue ?? 0)}`, icon: DollarSign, tone: "text-[#41b883]", bg: "bg-[#effaf4]" },
    { label: "Passengers", value: String(stats?.confirmedBookings ?? 0), icon: Users, tone: "text-[#4b91e8]", bg: "bg-[#eef5ff]" },
    { label: "Active Trips", value: String(stats?.activeTrips ?? 0), icon: Mountain, tone: "text-[#91a72b]", bg: "bg-[#f2f8df]" },
    { label: "Total Bookings", value: String(stats?.totalBookings ?? 0), icon: CalendarCheck, tone: "text-[#e5ad26]", bg: "bg-[#fff8e7]" },
    { label: "Trail Subs MRR", value: `$${overview?.trailSubsMrr ?? 0}/mo`, icon: DollarSign, tone: "text-[#9c78d8]", bg: "bg-[#f6f0ff]" },
  ];
  const statusItems = [
    ["Pending", "pending", Clock3, "text-[#e8ad2b]"],
    ["Confirmed", "confirmed", CheckCircle2, "text-[#91a72b]"],
    ["Checked In", "checkedIn", CheckCircle2, "text-[#41b883]"],
    ["Completed", "completed", CheckCircle2, "text-[#4b91e8]"],
    ["Cancelled", "cancelled", XCircle, "text-[#e46c74]"],
  ] as const;

  return (
    <div className="min-h-screen bg-[#f7f7f5] px-4 py-4 text-[#242d27] sm:px-6 lg:px-8">
      <header className="mx-auto max-w-[1500px]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3"><div className="grid h-8 w-8 place-items-center rounded-lg bg-[#b8d435] text-[#263229]"><Mountain size={17} /></div><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#91a72b]">Admin</p><h1 className="text-xl font-bold tracking-tight">Mission Control</h1></div></div>
          <Link href="/admin/trips" className="rounded-full bg-[#b8d435] px-4 py-2 text-xs font-bold text-[#263229] shadow-sm transition hover:bg-[#a9c52a]">+ New Trip</Link>
        </div>
        <nav className="mt-5 flex gap-2 overflow-x-auto border-b border-[#e3e7e1] pb-2 no-scrollbar">{navItems.map(([label, href]) => <Link key={label} href={href} className={`whitespace-nowrap rounded-full px-3 py-2 text-[11px] font-semibold transition ${label === "Overview" ? "bg-[#b8d435] text-[#263229]" : "bg-white text-[#8b948d] shadow-sm hover:text-[#263229]"}`}>{label}</Link>)}</nav>
      </header>

      <main className="mx-auto max-w-[1500px] space-y-5 py-5">
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{statCards.map(({ label, value, icon: Icon, tone, bg }) => <div key={label} className="flex items-center justify-between rounded-2xl border border-[#e7ebe5] bg-white px-4 py-4 shadow-[0_2px_10px_rgba(37,48,39,0.04)]"><div><p className="text-2xl font-bold text-[#27312a]">{value}</p><p className="mt-1 text-[10px] font-medium text-[#9aa39c]">{label}</p></div><div className={`grid h-10 w-10 place-items-center rounded-xl ${bg}`}><Icon size={18} className={tone} /></div></div>)}</section>

        <section className="rounded-2xl border border-[#e7ebe5] bg-white px-5 py-4 shadow-[0_2px_10px_rgba(37,48,39,0.04)]"><div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-bold">Booking Status</h2><span className="text-[10px] text-[#a0a8a1]">Live booking pipeline</span></div><div className="grid grid-cols-2 gap-4 sm:grid-cols-5">{statusItems.map(([label, key, Icon, tone]) => <div key={key} className="flex items-center gap-2"><Icon size={15} className={tone} /><div><p className={`text-lg font-bold ${tone}`}>{overview?.statusCounts?.[key] ?? 0}</p><p className="text-[10px] text-[#a0a8a1]">{label}</p></div></div>)}</div></section>

        <section className="rounded-2xl border border-[#e7ebe5] bg-white p-5 shadow-[0_2px_10px_rgba(37,48,39,0.04)]"><div className="mb-5 flex items-center justify-between"><h2 className="text-sm font-bold">Revenue <span className="font-normal text-[#a0a8a1]">(last 6 months)</span></h2><span className="text-[10px] text-[#a0a8a1]">Confirmed and completed bookings</span></div><div className="flex h-48 items-end gap-3 border-b border-[#edf0ec] px-2">{(overview?.revenueByMonth ?? []).map((item) => <div key={item.month} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><span className="text-[10px] text-[#8e9890]">${Math.round(item.revenue)}</span><div className="w-full max-w-24 rounded-t-lg bg-[#b8d435] transition-all" style={{ height: `${Math.max(10, item.revenue / maxRevenue * 120)}px` }} /><span className="text-[10px] text-[#8e9890]">{item.month}</span></div>)}</div></section>

        <section className="rounded-2xl border border-[#e7ebe5] bg-white p-5 shadow-[0_2px_10px_rgba(37,48,39,0.04)]"><div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-bold">Upcoming Trips</h2><Link href="/admin/trips" className="text-[11px] font-semibold text-[#91a72b]">Manage trips</Link></div>{(overview?.upcomingTrips ?? []).length === 0 ? <div className="py-10 text-center text-sm text-[#a0a8a1]">No upcoming trips yet.</div> : <div className="space-y-2">{(overview?.upcomingTrips ?? []).map((trip) => <div key={trip.id} className="flex items-center gap-3 rounded-xl border border-[#edf0ec] p-3"><div className="grid h-10 w-10 place-items-center rounded-lg bg-[#f2f8df] text-[#91a72b]"><Mountain size={18} /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{trip.title}</p><p className="flex items-center gap-1 text-[10px] text-[#9aa39c]"><MapPin size={11} />{new Date(trip.date).toLocaleDateString()} · {trip.time} · {trip.totalSeats} seats</p></div><Link href={`/trip/${trip.id}`} className="rounded-full border border-[#dce5c0] px-3 py-1.5 text-[10px] font-semibold text-[#91a72b]">View</Link></div>)}</div>}</section>

        <section className="rounded-2xl border border-[#e7ebe5] bg-white p-5 shadow-[0_2px_10px_rgba(37,48,39,0.04)]"><div className="mb-4 flex items-center gap-2"><Clock3 size={16} className="text-[#91a72b]" /><h2 className="text-sm font-bold">Recent Bookings</h2></div>{recentBookings.length === 0 ? <p className="py-6 text-center text-sm text-[#a0a8a1]">No bookings yet.</p> : <div className="space-y-2">{recentBookings.slice(0, 6).map((item) => <div key={item.booking.id} className="flex items-center justify-between gap-3 rounded-xl bg-[#fafbf9] p-3"><div className="min-w-0"><p className="truncate text-xs font-bold">{item.user.name ?? "Member"}</p><p className="truncate text-[10px] text-[#9aa39c]">{item.trip.title} · {item.booking.referenceCode}</p></div><span className="shrink-0 text-xs font-bold text-[#91a72b]">${Number(item.booking.totalPrice).toFixed(0)}</span></div>)}</div>}</section>
      </main>
    </div>
  );
}
