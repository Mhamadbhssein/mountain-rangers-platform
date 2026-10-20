import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Compass, Loader2 } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

export default function Schedule() {
  const [month, setMonth] = useState(new Date());
  const { data: trips, isLoading } = trpc.trips.list.useQuery();
  const upcoming = trips?.filter((trip) => new Date(trip.date) >= new Date()).length ?? 0;
  const completed = trips?.filter((trip) => new Date(trip.date) < new Date()).length ?? 0;
  const monthLabel = month.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const days: Array<number | null> = [
    ...Array.from({ length: firstDay === 0 ? 6 : firstDay - 1 }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  return (
    <div className="min-h-screen bg-[#f7f8f5] px-5 pb-8 pt-10">
      <div className="mx-auto max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#91a72b]">Mountain Rangers</p>
        <div className="mt-2 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[#7f8981]">Plan your next outing</p>
            <h1 className="text-3xl font-bold tracking-tight text-[#172019]">Trip Calendar</h1>
          </div>
          <div className="rounded-2xl bg-[#eaf1d0] p-3 text-[#719000]"><CalendarDays size={22} /></div>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm"><p className="text-2xl font-bold text-[#719000]">{upcoming}</p><p className="mt-1 text-xs font-medium text-[#8a938c]">Upcoming</p></div>
          <div className="rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm"><p className="text-2xl font-bold text-[#172019]">{completed}</p><p className="mt-1 text-xs font-medium text-[#8a938c]">Completed</p></div>
        </div>

        <section className="mt-7 rounded-3xl border border-black/[0.05] bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#172019]">{monthLabel}</h2>
            <div className="flex gap-1"><button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="rounded-full p-2 text-[#7f8981] hover:bg-[#f1f4ee]"><ChevronLeft size={17} /></button><button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="rounded-full p-2 text-[#7f8981] hover:bg-[#f1f4ee]"><ChevronRight size={17} /></button></div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wide text-[#a0a7a0]">{["Mo","Tu","We","Th","Fr","Sa","Su"].map((day) => <span key={day} className="py-2">{day}</span>)}</div>
          <div className="grid grid-cols-7 gap-1">{days.map((day, index) => <div key={`${monthLabel}-${index}`} className={`flex aspect-square items-center justify-center rounded-xl text-sm ${day && day === new Date().getDate() && month.getMonth() === new Date().getMonth() ? "bg-[#b8d435] font-bold text-[#172019]" : day ? "text-[#667168] hover:bg-[#f1f4ee]" : ""}`}>{day}</div>)}</div>
        </section>

        <section className="mt-7">
          <div className="mb-3 flex items-center justify-between"><h2 className="text-xl font-bold text-[#172019]">Trips</h2><span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#7f8981]">{trips?.length ?? 0} trips</span></div>
          {isLoading ? <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[#91a72b]" /></div> : trips && trips.length > 0 ? <div className="space-y-3">{trips.map((trip) => <Link key={trip.id} href={`/trip/${trip.id}`}><div className="flex items-center gap-3 rounded-2xl border border-black/[0.05] bg-white p-3 shadow-sm"><div className="rounded-xl bg-[#eef5d8] p-3 text-[#719000]"><Compass size={18} /></div><div className="min-w-0 flex-1"><p className="truncate font-bold text-[#172019]">{trip.title}</p><p className="text-xs text-[#8a938c]">{new Date(trip.date).toLocaleDateString()} · {trip.location}</p></div><CheckCircle2 size={17} className="text-[#b8d435]" /></div></Link>)}</div> : <div className="rounded-3xl border border-dashed border-[#d9dfd5] bg-white/70 px-5 py-14 text-center"><CalendarDays className="mx-auto mb-3 text-[#c2c9c0]" size={34} /><p className="font-bold text-[#445047]">No trips scheduled</p><p className="mt-1 text-sm text-[#909990]">Explore the latest adventures to reserve your next date.</p></div>}
        </section>
      </div>
    </div>
  );
}
