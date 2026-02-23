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
  MapPin,
} from "lucide-react";
import { LOYALTY, LOGOS, LOYALTY_LEVELS } from "@/lib/data";
import { toast } from "sonner";

const MENU_ITEMS = [
  { icon: Bell, label: "Notifications", action: "toast" },
  { icon: CreditCard, label: "Payment Methods", action: "toast" },
  { icon: Shield, label: "Privacy & Security", action: "toast" },
  { icon: HelpCircle, label: "Help & Support", action: "toast" },
  { icon: Settings, label: "App Settings", action: "toast" },
];

export default function Profile() {
  const progressPercent =
    ((LOYALTY.points - 1000) / (LOYALTY.nextLevelPoints - 1000)) * 100;

  const currentLevelData = LOYALTY_LEVELS.find((l) => l.name === LOYALTY.level);

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
              Trail Explorer
            </h2>
            <p className="text-sm text-muted-foreground">
              Member since {LOYALTY.memberSince}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <Award size={14} className="text-lime" />
              <span
                className="text-xs font-medium"
                style={{ color: currentLevelData?.color || "#B8D435" }}
              >
                {LOYALTY.level}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          {
            icon: Calendar,
            value: LOYALTY.tripsCompleted,
            label: "Trips",
          },
          {
            icon: Star,
            value: LOYALTY.points.toLocaleString(),
            label: "Points",
          },
          {
            icon: Trophy,
            value: LOYALTY.badges.filter((b) => b.earned).length,
            label: "Badges",
          },
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
              <img src={LOGOS.iconWhite} alt="MR" className="h-8" />
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
                  {LOYALTY.level}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-1">Points</p>
                <p className="text-lg font-bold text-lime">
                  {LOYALTY.points.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-muted-foreground">
                  Progress to {LOYALTY.nextLevel}
                </span>
                <span className="text-[10px] text-lime">
                  {LOYALTY.nextLevelPoints.toLocaleString()} pts
                </span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
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
        onClick={() => toast.info("Feature coming soon")}
        className="w-full glass rounded-2xl px-4 py-3.5 flex items-center gap-3 text-red-400 hover:bg-red-400/5 transition-colors"
      >
        <LogOut size={18} />
        <span className="text-sm font-medium">Sign Out</span>
      </button>
    </div>
  );
}
