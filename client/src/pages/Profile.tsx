import { Link } from "wouter";
import {
  Award,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Loader2,
  LogOut,
  MessageCircle,
  Monitor,
  Moon,
  Mountain,
  Navigation,
  Pencil,
  Plus,
  Ruler,
  Shield,
  Star,
  Sun,
  Trash2,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { LOGOS, LOYALTY_LEVELS } from "@/lib/data";
import { COUNTRY_CODES, splitPhone } from "@/lib/phone";
import { useAppearance, type AppearancePreference } from "@/contexts/AppearanceContext";

export default function Profile() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const utils = trpc.useUtils();
  const { data: stats } = trpc.profile.stats.useQuery(undefined, { enabled: isAuthenticated });
  const { data: loyaltyData } = trpc.loyalty.get.useQuery(undefined, { enabled: isAuthenticated });
  const { data: bookings = [] } = trpc.bookings.myBookings.useQuery(undefined, { enabled: isAuthenticated });

  if (authLoading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 size={30} className="animate-spin text-[#91a72b]" /></div>;
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <Mountain size={44} className="mb-4 text-[#b8d435]" />
        <p className="text-xl font-bold text-[#172019]">Sign in to view your profile</p>
        <p className="mb-6 mt-2 text-sm text-[#7f8981]">Track your trips, record trails, and earn loyalty points.</p>
        <Button className="rounded-2xl bg-[#b8d435] px-8 py-5 font-bold text-[#172019] hover:bg-[#c7e04d]" onClick={() => { window.location.href = getLoginUrl(); }}>Sign In</Button>
      </div>
    );
  }

  const level = loyaltyData?.level ?? "Explorer";
  const points = loyaltyData?.points ?? 0;
  const levelIdx = LOYALTY_LEVELS.findIndex((l) => l.name === level);
  const levelData = LOYALTY_LEVELS[levelIdx];
  const nextLevel = LOYALTY_LEVELS[levelIdx + 1];
  const progress = nextLevel ? ((points - (levelData?.minPoints ?? 0)) / (nextLevel.minPoints - (levelData?.minPoints ?? 0))) * 100 : 100;
  const activeBookings = bookings.filter(({ booking }) => booking.status !== "cancelled").length;
  const initials = (user.name ?? "M R").split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen px-5 pb-8 pt-10">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between pr-12">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#91a72b]">My Profile</p>
          <button onClick={() => { logout(); toast.success("Signed out"); }} className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#7f8981] shadow-sm"><LogOut size={13} />Logout</button>
        </div>

        <section className="mt-4 rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            {user.avatarUrl ? <img src={user.avatarUrl} alt={user.name ?? "Member"} className="h-16 w-16 rounded-full object-cover" /> : <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#eaf1d0] text-lg font-bold text-[#617900]">{initials}</div>}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-lg font-bold text-[#172019]">{user.name ?? "Mountain Ranger"}</h1>
                {user.role === "admin" && <span className="rounded-full bg-[#18221b] px-2 py-0.5 text-[10px] font-bold text-[#b8d435]">Admin</span>}
              </div>
              <p className="truncate text-xs text-[#7f8981]">{user.email ?? ""}</p>
              <p className="mt-1 flex items-center gap-1 text-xs font-semibold" style={{ color: levelData?.color ?? "#91a72b" }}><Award size={12} />{level}</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-4 gap-2 border-t border-black/[0.05] pt-4 text-center">
            {[["Posts", stats?.posts ?? 0], ["Followers", stats?.followers ?? 0], ["Following", stats?.following ?? 0], ["Likes", stats?.likesReceived ?? 0]].map(([label, value]) => (
              <div key={label}><p className="text-lg font-bold text-[#172019]">{value}</p><p className="text-[10px] font-semibold uppercase tracking-wide text-[#9aa39b]">{label}</p></div>
            ))}
          </div>
        </section>

        <h2 className="mt-7 text-base font-bold text-[#172019]">Your Stats</h2>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            { icon: CalendarDays, value: stats?.tripsBooked ?? 0, label: "Trips Booked" },
            { icon: Ruler, value: `${stats?.distanceKm ?? 0} km`, label: "Distance Hiked" },
            { icon: TrendingUp, value: `${(stats?.elevationM ?? 0).toLocaleString()}m`, label: "Elevation Gained" },
            { icon: Clock3, value: `${Math.round((stats?.trailMinutes ?? 0) / 60)}h`, label: "Trail Time" },
            { icon: Star, value: `${(stats?.points ?? 0).toLocaleString()}pts`, label: "Loyalty Points" },
            { icon: MessageCircle, value: stats?.posts ?? 0, label: "Community Posts" },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="rounded-2xl bg-white p-3 shadow-sm"><Icon size={15} className="text-[#8fb31c]" /><p className="mt-2 text-base font-bold text-[#172019]">{value}</p><p className="text-[10px] text-[#8a938c]">{label}</p></div>
          ))}
        </div>

        <Link href="/loyalty">
          <div className="relative mt-5 cursor-pointer overflow-hidden rounded-3xl bg-[#18221b] p-5 text-white">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#b8d435]/15" />
            <div className="relative flex items-center justify-between"><img src={LOGOS.iconWhite} alt="Mountain Rangers" className="h-12" /><span className="text-[10px] font-semibold tracking-widest text-[#b8d435]/70">LOYALTY CARD</span></div>
            <div className="relative mt-4 flex items-end justify-between"><div><p className="text-[11px] text-white/50">Current Level</p><p className="text-lg font-bold" style={{ color: levelData?.color }}>{level}</p></div><div className="text-right"><p className="text-[11px] text-white/50">Points</p><p className="text-lg font-bold text-[#b8d435]">{points.toLocaleString()}</p></div></div>
            <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#b8d435]" style={{ width: `${Math.max(0, Math.min(progress, 100))}%` }} /></div>
            <div className="relative mt-3 flex items-center justify-between text-xs text-white/60"><span>{nextLevel ? `${(nextLevel.minPoints - points).toLocaleString()} pts to ${nextLevel.name}` : "Max level reached"}</span><ChevronRight size={14} className="text-[#b8d435]" /></div>
          </div>
        </Link>

        <PersonalInfo user={user} onSaved={() => utils.auth.me.invalidate()} />
        <GearChecklists />
        <AppearancePicker />

        <section className="mt-6 overflow-hidden rounded-3xl bg-white shadow-sm">
          {[
            { href: "/bookings", icon: CalendarDays, title: "My Bookings", subtitle: `${activeBookings} trip${activeBookings === 1 ? "" : "s"} booked` },
            { href: "/trails?tab=My%20Trails", icon: Navigation, title: "Trail Recordings", subtitle: `${stats?.recordings ?? 0} recorded route${stats?.recordings === 1 ? "" : "s"}` },
            { href: "/community", icon: Users, title: "Community Feed", subtitle: `${stats?.followers ?? 0} followers · ${stats?.following ?? 0} following` },
            ...(user.role === "admin" ? [{ href: "/admin/mission-control", icon: Shield, title: "Admin Dashboard", subtitle: "Manage trips, bookings & users" }] : []),
          ].map(({ href, icon: Icon, title, subtitle }, i, arr) => (
            <Link key={href} href={href}>
              <div className={`flex cursor-pointer items-center gap-3 px-4 py-3.5 transition hover:bg-[#f5f7f2] ${i < arr.length - 1 ? "border-b border-black/[0.05]" : ""}`}>
                <div className="rounded-xl bg-[#eaf1d0] p-2 text-[#617900]"><Icon size={16} /></div>
                <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-[#172019]">{title}</p><p className="text-xs text-[#8a938c]">{subtitle}</p></div>
                <ChevronRight size={15} className="text-[#9aa39b]" />
              </div>
            </Link>
          ))}
        </section>

        <a href={`https://wa.me/96176828401?text=${encodeURIComponent(`Hi Mountain Rangers, I would like to delete my account (${user.email ?? user.name ?? ""}).`)}`} target="_blank" rel="noreferrer" className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-500"><Trash2 size={15} />Delete Account</a>
        <p className="mt-2 text-center text-[11px] text-[#9aa39b]">Account deletion requests are handled by our team on WhatsApp.</p>
      </div>
    </div>
  );
}

function PersonalInfo({ user, onSaved }: { user: { name: string | null; email: string | null; phone?: string | null; dateOfBirth?: string | null }; onSaved: () => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name ?? "");
  const initialPhone = splitPhone(user.phone);
  const [countryCode, setCountryCode] = useState(initialPhone.countryCode);
  const [phone, setPhone] = useState(initialPhone.local);
  const [dob, setDob] = useState(user.dateOfBirth ?? "");
  const update = trpc.profile.update.useMutation({
    onSuccess: () => { toast.success("Personal info updated"); setEditing(false); onSaved(); },
    onError: (error) => toast.error(error.message),
  });

  useEffect(() => {
    if (editing) return;
    setName(user.name ?? "");
    const p = splitPhone(user.phone);
    setCountryCode(p.countryCode);
    setPhone(p.local);
    setDob(user.dateOfBirth ?? "");
  }, [user, editing]);

  const save = () => {
    const local = phone.replace(/[^\d]/g, "");
    update.mutate({ name: name.trim(), phone: local ? `${countryCode}${local}` : "", dateOfBirth: dob });
  };

  const formatDob = (value?: string | null) => value ? new Date(`${value}T00:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—";
  const formatPhone = (value?: string | null) => { if (!value) return "—"; const p = splitPhone(value); return `${p.countryCode} ${p.local}`; };

  return (
    <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-[#172019]">Personal Info</h2>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="flex items-center gap-1 rounded-full bg-[#f4f6ef] px-3 py-1.5 text-xs font-semibold text-[#3d4a40]"><Pencil size={12} />Edit</button>
        ) : (
          <button onClick={() => setEditing(false)} aria-label="Cancel" className="rounded-full p-1.5 text-[#8a938c] hover:bg-[#f4f6ef]"><X size={16} /></button>
        )}
      </div>
      {!editing ? (
        <dl className="mt-4 space-y-3">
          {[["Full Name", user.name ?? "—"], ["Email", user.email ?? "—"], ["Phone", formatPhone(user.phone)], ["Date of Birth", formatDob(user.dateOfBirth)]].map(([label, value]) => (
            <div key={label}><dt className="text-[10px] font-semibold uppercase tracking-wider text-[#9aa39b]">{label}</dt><dd className="mt-0.5 text-sm text-[#172019]">{value}</dd></div>
          ))}
        </dl>
      ) : (
        <div className="mt-4 space-y-3">
          <label className="block"><span className="text-[10px] font-semibold uppercase tracking-wider text-[#9aa39b]">Full Name</span><input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} className="mt-1 w-full rounded-2xl bg-[#f4f6ef] px-4 py-3 text-sm outline-none" /></label>
          <div><span className="text-[10px] font-semibold uppercase tracking-wider text-[#9aa39b]">Email</span><p className="mt-1 rounded-2xl bg-[#f4f6ef] px-4 py-3 text-sm text-[#8a938c]">{user.email ?? "—"}</p></div>
          <label className="block"><span className="text-[10px] font-semibold uppercase tracking-wider text-[#9aa39b]">Phone</span>
            <div className="mt-1 flex gap-2">
              <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)} className="w-28 rounded-2xl bg-[#f4f6ef] px-3 py-3 text-sm outline-none">{COUNTRY_CODES.map((c) => <option key={c.code} value={c.code}>{c.label} {c.code}</option>)}</select>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" placeholder="XX XXX XXX" className="min-w-0 flex-1 rounded-2xl bg-[#f4f6ef] px-4 py-3 text-sm outline-none" />
            </div>
          </label>
          <label className="block"><span className="text-[10px] font-semibold uppercase tracking-wider text-[#9aa39b]">Date of Birth</span><input value={dob} onChange={(e) => setDob(e.target.value)} type="date" max={new Date().toISOString().slice(0, 10)} className="mt-1 w-full rounded-2xl bg-[#f4f6ef] px-4 py-3 text-sm outline-none" /></label>
          <Button onClick={save} disabled={update.isPending || !name.trim()} className="w-full rounded-2xl bg-[#b8d435] py-5 font-bold text-[#172019] hover:bg-[#c7e04d]">{update.isPending ? "Saving..." : "Save changes"}</Button>
        </div>
      )}
    </section>
  );
}

function GearChecklists() {
  const utils = trpc.useUtils();
  const { data: checklists = [] } = trpc.trailExplorer.checklists.useQuery();
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [item, setItem] = useState("");
  const [items, setItems] = useState<{ label: string; checked: boolean }[]>([]);
  const create = trpc.trailExplorer.createChecklist.useMutation({
    onSuccess: () => { toast.success("Gear checklist saved"); setTitle(""); setItems([]); setCreating(false); utils.trailExplorer.checklists.invalidate(); },
    onError: (error) => toast.error(error.message),
  });
  const update = trpc.trailExplorer.updateChecklist.useMutation({
    onSuccess: () => utils.trailExplorer.checklists.invalidate(),
    onError: (error) => toast.error(error.message),
  });
  const addItem = () => { if (!item.trim()) return; setItems((prev) => [...prev, { label: item.trim(), checked: false }]); setItem(""); };

  return (
    <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-[#172019]">Gear Checklists <span className="text-sm font-medium text-[#9aa39b]">({checklists.length})</span></h2>
        <button onClick={() => setCreating((v) => !v)} className="flex items-center gap-1 rounded-full bg-[#b8d435] px-3 py-1.5 text-xs font-bold text-[#172019]">{creating ? <X size={12} /> : <Plus size={12} />}{creating ? "Close" : "New"}</button>
      </div>
      {checklists.length === 0 && !creating && <p className="mt-3 text-xs text-[#8a938c]">Create a list of everything you need before your next hike.</p>}
      {checklists.length > 0 && (
        <div className="mt-4 space-y-3">
          {checklists.map((list) => {
            const done = list.items.filter((i) => i.checked).length;
            return (
              <div key={list.id} className="rounded-2xl bg-[#f4f6ef] p-3">
                <div className="flex items-center justify-between"><p className="text-sm font-semibold text-[#172019]">{list.title}</p><span className="text-[11px] font-semibold text-[#617900]">{done}/{list.items.length}</span></div>
                <div className="mt-2 space-y-1.5">
                  {list.items.map((entry, index) => (
                    <button key={`${list.id}-${index}`} onClick={() => update.mutate({ id: list.id, items: list.items.map((e, i) => i === index ? { ...e, checked: !e.checked } : e) })} className="flex w-full items-center gap-2 text-left text-xs text-[#3d4a40]">
                      <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${entry.checked ? "border-[#8fb31c] bg-[#b8d435] text-[#172019]" : "border-[#c2c9c0] bg-white"}`}>{entry.checked && <Check size={11} />}</span>
                      <span className={entry.checked ? "text-[#9aa39b] line-through" : ""}>{entry.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {creating && (
        <div className="mt-4 space-y-2 rounded-2xl border border-[#dfe6c7] p-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Checklist name (e.g. Day hike)" className="w-full rounded-xl bg-[#f4f6ef] px-3 py-2.5 text-sm outline-none" />
          <div className="flex gap-2"><input value={item} onChange={(e) => setItem(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addItem(); } }} placeholder="Add gear item" className="min-w-0 flex-1 rounded-xl bg-[#f4f6ef] px-3 py-2.5 text-sm outline-none" /><button onClick={addItem} className="rounded-xl bg-[#18221b] px-4 text-xs font-bold text-white">Add</button></div>
          {items.length > 0 && <div className="flex flex-wrap gap-1.5">{items.map((i, idx) => <span key={idx} className="flex items-center gap-1 rounded-full bg-[#eaf1d0] px-2.5 py-1 text-[11px] text-[#3d4a40]">{i.label}<button onClick={() => setItems((prev) => prev.filter((_, j) => j !== idx))} aria-label={`Remove ${i.label}`}><X size={10} /></button></span>)}</div>}
          <Button onClick={() => create.mutate({ title: title.trim() || "Hiking Gear", items })} disabled={create.isPending || items.length === 0} className="w-full rounded-xl bg-[#b8d435] font-bold text-[#172019] hover:bg-[#c7e04d]">{create.isPending ? "Saving..." : "Save checklist"}</Button>
        </div>
      )}
    </section>
  );
}

function AppearancePicker() {
  const { preference, setPreference } = useAppearance();
  const options: { value: AppearancePreference; label: string; icon: typeof Sun }[] = [
    { value: "light", label: "Light", icon: Sun },
    { value: "auto", label: "Auto", icon: Monitor },
    { value: "dark", label: "Dark", icon: Moon },
  ];
  return (
    <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm">
      <h2 className="text-base font-bold text-[#172019]">Appearance</h2>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {options.map(({ value, label, icon: Icon }) => (
          <button key={value} onClick={() => setPreference(value)} className={`flex flex-col items-center gap-1.5 rounded-2xl border py-3 text-xs font-semibold transition ${preference === value ? "border-[#b8d435] bg-[#eaf1d0] text-[#617900]" : "border-transparent bg-[#f4f6ef] text-[#7f8981]"}`}>
            <Icon size={17} />{label}
          </button>
        ))}
      </div>
    </section>
  );
}
