import { CalendarDays, ChevronLeft, ChevronRight, Clock, Compass, Loader2, MapPin, Ticket } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

const TABS = ["All Trips", "My Trips", "Calendar"] as const;
type Tab = (typeof TABS)[number];

const STATUS_STYLE: Record<string, string> = {
  confirmed: "bg-[#eaf1d0] text-[#617900]",
  pending: "bg-amber-100 text-amber-700",
  completed: "bg-sky-100 text-sky-700",
  cancelled: "bg-red-100 text-red-600",
};

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

export default function Schedule() {
  const { isAuthenticated } = useAuth();
  const [tab, setTab] = useState<Tab>("All Trips");
  const [month, setMonth] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const { data: trips = [], isLoading } = trpc.trips.list.useQuery();
  const { data: myBookings = [], isLoading: bookingsLoading } = trpc.bookings.myBookings.useQuery(undefined, { enabled: isAuthenticated });

  const now = new Date();
  const upcomingTrips = useMemo(() => trips.filter((t) => new Date(t.date) >= now).sort((a, b) => +new Date(a.date) - +new Date(b.date)), [trips]);
  const activeBookings = myBookings.filter((b) => b.booking.status !== "cancelled");
  const myUpcoming = activeBookings.filter((b) => new Date(b.trip.date) >= now && b.booking.status !== "completed");
  const myBookedTripIds = new Set(activeBookings.map((b) => b.trip.id));

  const tripsByDay = useMemo(() => {
    const map = new Map<string, typeof trips>();
    for (const trip of trips) {
      const key = dayKey(new Date(trip.date));
      map.set(key, [...(map.get(key) ?? []), trip]);
    }
    return map;
  }, [trips]);

  const monthLabel = month.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const days: Array<number | null> = [
    ...Array.from({ length: firstDay === 0 ? 6 : firstDay - 1 }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  const monthTrips = trips.filter((t) => { const d = new Date(t.date); return d.getFullYear() === month.getFullYear() && d.getMonth() === month.getMonth(); }).sort((a, b) => +new Date(a.date) - +new Date(b.date));
  const calendarList = selectedDay ? tripsByDay.get(dayKey(new Date(month.getFullYear(), month.getMonth(), selectedDay))) ?? [] : monthTrips;
  const changeMonth = (delta: number) => { setMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1)); setSelectedDay(null); };

  return (
    <div className="min-h-screen bg-[#f7f8f5] px-5 pb-8 pt-10">
      <div className="mx-auto max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#91a72b]">Mountain Rangers</p>
        <div className="mt-2 flex items-end justify-between gap-4 pr-12">
          <div>
            <p className="text-sm font-medium text-[#7f8981]">Plan your next outing</p>
            <h1 className="text-3xl font-bold tracking-tight text-[#172019]">Schedule</h1>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <Stat value={upcomingTrips.length} label="Upcoming" accent />
          <Stat value={isAuthenticated ? activeBookings.length : "—"} label="My Bookings" />
          <Stat value={isAuthenticated ? activeBookings.filter((b) => b.booking.status === "completed").length : "—"} label="Completed" />
        </div>

        <div className="mt-6 flex rounded-2xl bg-white p-1 shadow-sm">
          {TABS.map((t) => <button key={t} onClick={() => setTab(t)} className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition ${tab === t ? "bg-[#b8d435] text-[#172019]" : "text-[#7f8981]"}`}>{t}</button>)}
        </div>

        {tab === "All Trips" && (
          <section className="mt-5">
            <SectionTitle title="Upcoming Trips" count={upcomingTrips.length} />
            {isLoading ? <Spinner /> : upcomingTrips.length === 0 ? <Empty title="No trips scheduled" text="New adventures are added often. Check back soon." /> : (
              <div className="space-y-3">{upcomingTrips.map((trip) => <TripRow key={trip.id} trip={trip} booked={myBookedTripIds.has(trip.id)} />)}</div>
            )}
          </section>
        )}

        {tab === "My Trips" && (
          <section className="mt-5">
            {!isAuthenticated ? (
              <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
                <Ticket className="mx-auto text-[#b8d435]" size={30} />
                <p className="mt-3 font-bold text-[#172019]">Sign in to see your trips</p>
                <button onClick={() => (window.location.href = getLoginUrl())} className="mt-4 rounded-2xl bg-[#b8d435] px-6 py-2.5 text-sm font-bold text-[#172019]">Sign In</button>
              </div>
            ) : bookingsLoading ? <Spinner /> : myBookings.length === 0 ? <Empty title="No bookings yet" text="Reserve a seat on an upcoming trip to see it here." link /> : (
              <>
                <SectionTitle title="Upcoming" count={myUpcoming.length} />
                {myUpcoming.length === 0 ? <p className="mb-6 rounded-2xl bg-white p-4 text-sm text-[#8a938c] shadow-sm">No upcoming trips booked.</p> : <div className="mb-6 space-y-3">{myUpcoming.map((b) => <BookingRow key={b.booking.id} item={b} />)}</div>}
                <SectionTitle title="Past & Cancelled" count={myBookings.length - myUpcoming.length} />
                <div className="space-y-3">{myBookings.filter((b) => !myUpcoming.includes(b)).map((b) => <BookingRow key={b.booking.id} item={b} />)}</div>
              </>
            )}
          </section>
        )}

        {tab === "Calendar" && (
          <>
            <section className="mt-5 rounded-3xl border border-black/[0.05] bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#172019]">{monthLabel}</h2>
                <div className="flex gap-1">
                  <button onClick={() => changeMonth(-1)} aria-label="Previous month" className="rounded-full p-2 text-[#7f8981] hover:bg-[#f1f4ee]"><ChevronLeft size={17} /></button>
                  <button onClick={() => changeMonth(1)} aria-label="Next month" className="rounded-full p-2 text-[#7f8981] hover:bg-[#f1f4ee]"><ChevronRight size={17} /></button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wide text-[#a0a7a0]">{["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => <span key={d} className="py-2">{d}</span>)}</div>
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => {
                  if (!day) return <div key={`${monthLabel}-${index}`} />;
                  const date = new Date(month.getFullYear(), month.getMonth(), day);
                  const dayTrips = tripsByDay.get(dayKey(date)) ?? [];
                  const isToday = dayKey(date) === dayKey(now);
                  const isSelected = selectedDay === day;
                  const hasMine = dayTrips.some((t) => myBookedTripIds.has(t.id));
                  return (
                    <button key={`${monthLabel}-${index}`} onClick={() => setSelectedDay(isSelected ? null : day)} disabled={dayTrips.length === 0 && !isSelected} className={`relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm transition ${isSelected ? "bg-[#172019] font-bold text-white" : isToday ? "bg-[#b8d435] font-bold text-[#172019]" : dayTrips.length ? "font-semibold text-[#172019] hover:bg-[#f1f4ee]" : "text-[#9aa39b]"}`}>
                      {day}
                      {dayTrips.length > 0 && <span className="absolute bottom-1.5 flex gap-0.5">{dayTrips.slice(0, 3).map((t) => <span key={t.id} className={`h-1.5 w-1.5 rounded-full ${myBookedTripIds.has(t.id) ? "bg-amber-500" : isSelected ? "bg-[#b8d435]" : "bg-[#8fb31c]"}`} />)}</span>}
                      {hasMine && <span className="sr-only">You are booked</span>}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex items-center gap-4 text-[11px] text-[#8a938c]"><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#8fb31c]" />Trip day</span>{isAuthenticated && <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" />You are booked</span>}</div>
            </section>
            <section className="mt-6">
              <SectionTitle title={selectedDay ? new Date(month.getFullYear(), month.getMonth(), selectedDay).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }) : `Trips in ${month.toLocaleDateString("en-US", { month: "long" })}`} count={calendarList.length} />
              {calendarList.length === 0 ? <Empty title="No trips this month" text="Use the arrows to check other months." /> : <div className="space-y-3">{calendarList.map((trip) => <TripRow key={trip.id} trip={trip} booked={myBookedTripIds.has(trip.id)} />)}</div>}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ value, label, accent }: { value: number | string; label: string; accent?: boolean }) {
  return <div className="rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm"><p className={`text-2xl font-bold ${accent ? "text-[#719000]" : "text-[#172019]"}`}>{value}</p><p className="mt-1 text-xs font-medium text-[#8a938c]">{label}</p></div>;
}

function SectionTitle({ title, count }: { title: string; count: number }) {
  return <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold text-[#172019]">{title}</h2><span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#7f8981]">{count} {count === 1 ? "trip" : "trips"}</span></div>;
}

function Spinner() {
  return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[#91a72b]" /></div>;
}

function Empty({ title, text, link }: { title: string; text: string; link?: boolean }) {
  return <div className="rounded-3xl border border-dashed border-[#d9dfd5] bg-white/70 px-5 py-12 text-center"><CalendarDays className="mx-auto mb-3 text-[#c2c9c0]" size={32} /><p className="font-bold text-[#445047]">{title}</p><p className="mt-1 text-sm text-[#909990]">{text}</p>{link && <Link href="/" className="mt-4 inline-block rounded-full bg-[#eaf1d0] px-4 py-2 text-xs font-bold text-[#617900]">Explore trips</Link>}</div>;
}

function TripRow({ trip, booked }: { trip: any; booked: boolean }) {
  const date = new Date(trip.date);
  return (
    <Link href={`/trip/${trip.id}`}>
      <div className="flex items-center gap-3 rounded-2xl border border-black/[0.05] bg-white p-3 shadow-sm">
        <div className="flex w-14 shrink-0 flex-col items-center rounded-xl bg-[#eef5d8] py-2 text-[#617900]"><span className="text-[10px] font-bold uppercase">{date.toLocaleDateString("en-US", { month: "short" })}</span><span className="text-xl font-bold leading-none">{date.getDate()}</span></div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-[#172019]">{trip.title}</p>
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-[#8a938c]"><MapPin size={11} />{trip.location}</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-[#8a938c]"><Clock size={11} />{trip.time} · {trip.difficulty}</p>
        </div>
        {booked ? <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-700">Booked</span> : <span className="shrink-0 text-sm font-bold text-[#172019]">${Number(trip.price).toFixed(0)}</span>}
      </div>
    </Link>
  );
}

function BookingRow({ item }: { item: any }) {
  const { booking, trip } = item;
  const date = new Date(trip.date);
  return (
    <Link href="/bookings">
      <div className="flex items-center gap-3 rounded-2xl border border-black/[0.05] bg-white p-3 shadow-sm">
        <div className="rounded-xl bg-[#eef5d8] p-3 text-[#719000]"><Compass size={18} /></div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-[#172019]">{trip.title}</p>
          <p className="text-xs text-[#8a938c]">{date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · {booking.passengers} {booking.passengers === 1 ? "seat" : "seats"} · {booking.referenceCode}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${STATUS_STYLE[booking.status] ?? "bg-gray-100 text-gray-600"}`}>{booking.status}</span>
      </div>
    </Link>
  );
}
