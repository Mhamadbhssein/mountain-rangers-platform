import { Check, Map, MessageCircle, Mountain, Sparkles } from "lucide-react";

const BENEFITS = [
  ["Full GPS trail routes & waypoints", "Navigate like a pro"],
  ["Elevation profiles for all trails", "Plan every climb"],
  ["AI trail guide & safety tips", "Expert guidance"],
  ["Unlimited trail recordings", "Track your adventures"],
  ["Premium trail details & filters", "Full access"],
];

export default function Trails() {
  return (
    <div className="min-h-screen bg-[#f7f8f5] px-5 pb-8 pt-10">
      <div className="mx-auto max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#91a72b]">Explore Lebanon</p>
        <div className="mt-2 flex items-end justify-between gap-4"><div><p className="text-sm font-medium text-[#7f8981]">Find your route</p><h1 className="text-3xl font-bold tracking-tight text-[#172019]">Trail Explorer</h1></div><div className="rounded-2xl bg-[#eaf1d0] p-3 text-[#719000]"><Map size={22} /></div></div>

        <section className="relative mt-7 overflow-hidden rounded-3xl bg-[#18221b] p-6 text-white shadow-[0_16px_35px_rgba(24,34,27,0.16)]">
          <div className="absolute -right-8 -top-12 h-40 w-40 rounded-full bg-[#b8d435]/20 blur-2xl" /><Mountain className="absolute right-6 top-8 text-[#b8d435]/40" size={92} strokeWidth={1} />
          <div className="relative"><div className="flex items-start justify-between"><div className="rounded-xl bg-[#b8d435] p-2 text-[#172019]"><Sparkles size={18} /></div><span className="text-2xl font-bold">$4</span></div><p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-[#b8d435]">Trails Premium</p><h2 className="mt-2 text-2xl font-bold">Unlock Lebanon's full trail network</h2><p className="mt-2 text-sm text-white/65">Monthly subscription · Cancel anytime</p><button className="mt-6 w-full rounded-2xl bg-[#b8d435] px-4 py-3 text-sm font-bold text-[#172019] transition hover:bg-[#c7e04d]">Subscribe for $4/mo</button></div>
        </section>

        <section className="mt-7 rounded-3xl border border-black/[0.05] bg-white p-5 shadow-sm"><h2 className="text-lg font-bold text-[#172019]">Included with Premium</h2><div className="mt-4 space-y-4">{BENEFITS.map(([title, subtitle]) => <div key={title} className="flex items-start gap-3"><div className="mt-0.5 rounded-full bg-[#eef5d8] p-1.5 text-[#719000]"><Check size={14} strokeWidth={3} /></div><div><p className="text-sm font-bold text-[#263229]">{title}</p><p className="mt-0.5 text-xs text-[#8a938c]">{subtitle}</p></div></div>)}</div></section>

        <a href="https://wa.me/96176828401?text=Hi%20Mountain%20Rangers%2C%20I%27d%20like%20to%20subscribe%20to%20Trails%20Premium." target="_blank" rel="noreferrer" className="mt-5 flex items-center justify-center gap-2 rounded-2xl border border-[#dfe6c7] bg-[#f1f6dd] px-4 py-3 text-sm font-bold text-[#617900]"><MessageCircle size={17} />Have questions? Chat on WhatsApp</a>
      </div>
    </div>
  );
}
