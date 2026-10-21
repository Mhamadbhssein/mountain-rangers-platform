/* ============================================================
 * Profile — User profile with stats and settings
 * Design: Alpine Glass / Lime-green brand
 * Avatar, stats grid, loyalty card preview, settings list
 * ============================================================ */

import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Settings,
  ChevronRight,
  Mountain,
  Trophy,
  Calendar,
  Star,
  CreditCard,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  Award,
  Loader2,
  Check,
  Plus,
} from "lucide-react";
import { LOGOS, LOYALTY_LEVELS } from "@/lib/data";
import { toast } from "sonner";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";

const MENU_ITEMS = [
  { icon: Bell, label: "Notifications", action: "toast" },
  { icon: CreditCard, label: "Payment Methods", action: "toast" },
  { icon: Shield, label: "Privacy & Security", action: "toast" },
  { icon: HelpCircle, label: "Help & Support", action: "toast" },
  { icon: Settings, label: "App Settings", action: "toast" },
];

export default function Profile() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();

  const { data: loyaltyData, isLoading: loyaltyLoading } = trpc.loyalty.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: checklists = [] } = trpc.trailExplorer.checklists.useQuery(undefined, { enabled: isAuthenticated });
  const checklistUtils = trpc.useUtils();
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [newItem, setNewItem] = useState("");
  const [draftItems, setDraftItems] = useState<{ label: string; checked: boolean }[]>([]);
  const createChecklist = trpc.trailExplorer.createChecklist.useMutation({
    onSuccess: () => { toast.success("Gear checklist saved"); setNewChecklistTitle(""); setDraftItems([]); checklistUtils.trailExplorer.checklists.invalidate(); },
    onError: (error) => toast.error(error.message),
  });
  const updateChecklist = trpc.trailExplorer.updateChecklist.useMutation({
    onSuccess: () => checklistUtils.trailExplorer.checklists.invalidate(),
    onError: (error) => toast.error(error.message),
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="text-lime animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5">
        <Mountain size={48} className="text-muted-foreground/30 mb-4" />
        <p className="text-foreground font-serif text-xl mb-2">Sign in to view your profile</p>
        <p className="text-muted-foreground text-sm mb-6 text-center">
          Log in to track your trips, earn points, and manage your account
        </p>
        <Button
          className="bg-lime hover:bg-lime-light text-black font-semibold px-8 py-5 rounded-xl"
          onClick={() => { window.location.href = getLoginUrl(); }}
        >
          Sign In
        </Button>
      </div>
    );
  }

  const points = loyaltyData?.points ?? 0;
  const level = loyaltyData?.level ?? "Explorer";
  const tripsCompleted = loyaltyData?.tripsCompleted ?? 0;
  const badges = (loyaltyData?.badges ?? []) as { name: string; icon: string; earned: boolean }[];

  const currentLevelData = LOYALTY_LEVELS.find((l) => l.name === level);
  const currentLevelIdx = LOYALTY_LEVELS.findIndex((l) => l.name === level);
  const nextLevel = LOYALTY_LEVELS[currentLevelIdx + 1];
  const nextLevelPoints = nextLevel?.minPoints ?? 5000;
  const currentLevelMinPoints = currentLevelData?.minPoints ?? 0;
  const progressPercent = nextLevel
    ? ((points - currentLevelMinPoints) / (nextLevelPoints - currentLevelMinPoints)) * 100
    : 100;

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "2024";

  return (
    <div className="min-h-screen px-5 pt-12 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif text-foreground">Profile</h1>
        <button
          onClick={() => toast.info("Feature coming soon")}
          className="glass rounded-full p-2.5"
        >
          <Settings size={20} className="text-muted-foreground" />
        </button>
      </div>

      {/* User card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-5 mb-5"
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-lime/10 border-2 border-lime/30 flex items-center justify-center">
            <Mountain size={28} className="text-lime" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground font-sans">
              {user?.name ?? "Trail Explorer"}
            </h2>
            <p className="text-sm text-muted-foreground">
              Member since {memberSince}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <Award size={14} className="text-lime" />
              <span
                className="text-xs font-medium"
                style={{ color: currentLevelData?.color || "#B8D435" }}
              >
                {level}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { icon: Calendar, value: tripsCompleted, label: "Trips" },
          { icon: Star, value: points.toLocaleString(), label: "Points" },
          { icon: Trophy, value: badges.filter((b) => b.earned).length, label: "Badges" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass rounded-xl p-3 text-center"
          >
            <stat.icon size={18} className="text-lime mx-auto mb-1.5" />
            <p className="text-lg font-bold text-foreground">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Loyalty card preview */}
      <Link href="/loyalty">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileTap={{ scale: 0.98 }}
          className="relative overflow-hidden rounded-2xl p-5 mb-5"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.15 0.01 120) 0%, oklch(0.10 0.005 250) 100%)",
            border: "1px solid oklch(0.82 0.18 120 / 20%)",
          }}
        >
          {/* Decorative circles */}
          <div
            className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-10"
            style={{ background: "oklch(0.82 0.18 120)" }}
          />
          <div
            className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full opacity-5"
            style={{ background: "oklch(0.82 0.18 120)" }}
          />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <img src={LOGOS.iconWhite} alt="MR" className="h-16" />
              <span className="text-xs text-lime/60 font-mono">
                LOYALTY CARD
              </span>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Current Level
                </p>
                <p
                  className="text-lg font-bold"
                  style={{ color: currentLevelData?.color }}
                >
                  {level}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-1">Points</p>
                <p className="text-lg font-bold text-lime">
                  {points.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-muted-foreground">
                  Progress to {nextLevel?.name ?? "Max Level"}
                </span>
                <span className="text-[10px] text-lime">
                  {nextLevelPoints.toLocaleString()} pts
                </span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(progressPercent, 100)}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full rounded-full bg-lime"
                />
              </div>
            </div>
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-muted-foreground">
                View full loyalty card
              </span>
              <ChevronRight size={14} className="text-lime" />
            </div>
          </div>
        </motion.div>
      </Link>

      {/* Admin Dashboard Link (admin only) */}
      {user?.role === "admin" && (
        <Link href="/admin">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-lime rounded-2xl px-4 py-3.5 flex items-center gap-3 mb-5 cursor-pointer hover:bg-lime/10 transition-colors"
          >
            <Shield size={18} className="text-lime" />
            <span className="text-sm font-semibold text-lime flex-1">Admin Dashboard</span>
            <ChevronRight size={14} className="text-lime" />
          </motion.div>
        </Link>
      )}

      {/* Gear checklists */}
      <section className="glass rounded-2xl p-4 mb-5">
        <div className="flex items-center justify-between gap-3">
          <div><h2 className="text-sm font-semibold text-foreground">Gear Checklists</h2><p className="text-xs text-muted-foreground mt-1">Prepare before your next hike.</p></div>
          <Plus size={17} className="text-lime" />
        </div>
        {checklists.length > 0 && <div className="mt-4 space-y-2">{checklists.map((checklist) => <div key={checklist.id} className="rounded-xl bg-white/5 p-3"><p className="text-sm font-semibold text-foreground">{checklist.title}</p><div className="mt-2 space-y-1">{(checklist.items ?? []).map((item, index) => <button key={`${checklist.id}-${index}`} onClick={() => updateChecklist.mutate({ id: checklist.id, items: checklist.items.map((entry, entryIndex) => entryIndex === index ? { ...entry, checked: !entry.checked } : entry) })} className="flex w-full items-center gap-2 text-left text-xs text-muted-foreground"><span className={`flex h-4 w-4 items-center justify-center rounded border ${item.checked ? "border-lime bg-lime text-black" : "border-white/20"}`}>{item.checked && <Check size={11} />}</span>{item.label}</button>)}</div></div>)}</div>}
        <div className="mt-4 space-y-2"><input value={newChecklistTitle} onChange={(event) => setNewChecklistTitle(event.target.value)} placeholder="New checklist name" className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-foreground outline-none" /><div className="flex gap-2"><input value={newItem} onChange={(event) => setNewItem(event.target.value)} placeholder="Add gear item" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-foreground outline-none" /><button onClick={() => { if (!newItem.trim()) return; setDraftItems((items) => [...items, { label: newItem.trim(), checked: false }]); setNewItem(""); }} className="rounded-xl bg-white/10 px-3 text-xs text-foreground">Add</button></div>{draftItems.length > 0 && <p className="text-xs text-muted-foreground">{draftItems.length} item{draftItems.length === 1 ? "" : "s"} ready to save</p>}<button onClick={() => createChecklist.mutate({ title: newChecklistTitle.trim() || "Hiking Gear", items: draftItems })} disabled={createChecklist.isPending || draftItems.length === 0} className="w-full rounded-xl bg-lime py-2.5 text-xs font-semibold text-black disabled:opacity-50">{createChecklist.isPending ? "Saving..." : "Save checklist"}</button></div>
      </section>

      {/* Menu items */}
      <div className="glass rounded-2xl overflow-hidden mb-5">
        {MENU_ITEMS.map((item, i) => (
          <button
            key={item.label}
            onClick={() => toast.info("Feature coming soon")}
            className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 transition-colors ${
              i < MENU_ITEMS.length - 1 ? "border-b border-white/5" : ""
            }`}
          >
            <item.icon size={18} className="text-muted-foreground" />
            <span className="text-sm text-foreground flex-1 text-left">
              {item.label}
            </span>
            <ChevronRight size={14} className="text-muted-foreground" />
          </button>
        ))}
      </div>

      {/* Sign out */}
      <button
        onClick={() => {
          logout();
          toast.success("Signed out successfully");
        }}
        className="w-full glass rounded-2xl px-4 py-3.5 flex items-center gap-3 text-red-400 hover:bg-red-400/5 transition-colors"
      >
        <LogOut size={18} />
        <span className="text-sm font-medium">Sign Out</span>
      </button>
    </div>
  );
}
