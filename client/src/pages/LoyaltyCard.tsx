/* ============================================================
 * LoyaltyCard — Full loyalty system view
 * Design: Alpine Glass / Lime-green brand
 * Digital card, level progression, badges, NFC request
 * ============================================================ */

import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Mountain,
  Trophy,
  Target,
  Crown,
  TreePine,
  Map,
  Users,
  Sunrise,
  CreditCard,
  Nfc,
  ChevronRight,
  Star,
} from "lucide-react";
import { LOYALTY, LOYALTY_LEVELS, LOGOS } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const BADGE_ICONS: Record<string, any> = {
  mountain: Mountain,
  sunrise: Sunrise,
  users: Users,
  target: Target,
  trophy: Trophy,
  "tree-pine": TreePine,
  map: Map,
  crown: Crown,
};

export default function LoyaltyCard() {
  const [, navigate] = useLocation();

  const currentLevelIndex = LOYALTY_LEVELS.findIndex(
    (l) => l.name === LOYALTY.level
  );
  const progressPercent =
    ((LOYALTY.points - (LOYALTY_LEVELS[currentLevelIndex]?.minPoints || 0)) /
      (LOYALTY.nextLevelPoints -
        (LOYALTY_LEVELS[currentLevelIndex]?.minPoints || 0))) *
    100;

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-4">
        <button
          onClick={() => navigate("/profile")}
          className="glass rounded-full p-2.5"
        >
          <ArrowLeft size={20} className="text-foreground" />
        </button>
        <h1 className="text-lg font-serif text-foreground">Loyalty Card</h1>
      </div>

      {/* Digital Card */}
      <section className="px-5 mb-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl p-6 glow-lime"
          style={{
            background:
              "linear-gradient(145deg, oklch(0.18 0.02 120) 0%, oklch(0.08 0.005 250) 60%, oklch(0.12 0.01 120) 100%)",
            border: "1px solid oklch(0.82 0.18 120 / 25%)",
            boxShadow: "0 20px 60px oklch(0 0 0 / 40%), 0 0 40px oklch(0.82 0.18 120 / 8%)",
          }}
        >
          {/* Decorative elements */}
          <div
            className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-5"
            style={{ background: "oklch(0.82 0.18 120)", filter: "blur(40px)" }}
          />
          <div
            className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-5"
            style={{ background: "oklch(0.82 0.18 120)", filter: "blur(30px)" }}
          />

          <div className="relative z-10">
            {/* Card header */}
            <div className="flex items-center justify-between mb-8">
              <img src={LOGOS.iconWhite} alt="Mountain Rangers" className="h-10" />
              <div className="text-right">
                <p className="text-[10px] text-lime/50 font-mono tracking-widest">
                  MEMBERSHIP
                </p>
                <p className="text-xs text-lime/70 font-mono">
                  Since {LOYALTY.memberSince}
                </p>
              </div>
            </div>

            {/* Member info */}
            <div className="mb-6">
              <p className="text-white/50 text-xs mb-1">Member</p>
              <p className="text-white text-xl font-semibold font-sans">
                Trail Explorer
              </p>
            </div>

            {/* Level & Points */}
            <div className="flex items-end justify-between">
              <div>
                <p className="text-white/50 text-xs mb-1">Level</p>
                <p
                  className="text-xl font-bold font-sans"
                  style={{
                    color:
                      LOYALTY_LEVELS.find((l) => l.name === LOYALTY.level)
                        ?.color || "#B8D435",
                  }}
                >
                  {LOYALTY.level}
                </p>
              </div>
              <div className="text-right">
                <p className="text-white/50 text-xs mb-1">Points</p>
                <p className="text-2xl font-bold text-lime font-sans">
                  {LOYALTY.points.toLocaleString()}
                </p>
              </div>
            </div>

            {/* NFC indicator */}
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/10">
              <Nfc size={14} className="text-lime/40" />
              <span className="text-[10px] text-white/30 font-mono">
                TAP TO OPEN PROFILE
              </span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Level Progression */}
      <section className="px-5 mb-6">
        <h2 className="text-lg font-serif text-foreground mb-4">
          Level Progression
        </h2>
        <div className="glass rounded-2xl p-4">
          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-foreground font-medium">
                {LOYALTY.level}
              </span>
              <span className="text-sm text-muted-foreground">
                {LOYALTY.nextLevel}
              </span>
            </div>
            <div className="h-3 bg-white/5 rounded-full overflow-hidden relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-lime-dark to-lime"
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground">
                {LOYALTY.points.toLocaleString()} pts
              </span>
              <span className="text-xs text-lime">
                {(LOYALTY.nextLevelPoints - LOYALTY.points).toLocaleString()} pts to go
              </span>
            </div>
          </div>

          {/* Level tiers */}
          <div className="flex items-center gap-1 mt-2">
            {LOYALTY_LEVELS.map((level, i) => {
              const isActive = i <= currentLevelIndex;
              return (
                <div key={level.name} className="flex-1 flex flex-col items-center">
                  <div
                    className={`w-full h-1.5 rounded-full mb-2 ${
                      isActive ? "" : "bg-white/5"
                    }`}
                    style={isActive ? { background: level.color } : {}}
                  />
                  <span
                    className="text-[9px] font-medium"
                    style={{ color: isActive ? level.color : "oklch(0.5 0 0)" }}
                  >
                    {level.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Badges */}
      <section className="px-5 mb-6">
        <h2 className="text-lg font-serif text-foreground mb-4">Badges</h2>
        <div className="grid grid-cols-4 gap-3">
          {LOYALTY.badges.map((badge, i) => {
            const IconComponent = BADGE_ICONS[badge.icon] || Star;
            return (
              <motion.div
                key={badge.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl ${
                  badge.earned ? "glass-lime" : "glass opacity-40"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    badge.earned ? "bg-lime/15" : "bg-white/5"
                  }`}
                >
                  <IconComponent
                    size={18}
                    className={badge.earned ? "text-lime" : "text-muted-foreground"}
                  />
                </div>
                <span className="text-[9px] text-center text-foreground/70 leading-tight">
                  {badge.name}
                </span>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* How to earn points */}
      <section className="px-5 mb-6">
        <h2 className="text-lg font-serif text-foreground mb-4">
          Earn Points
        </h2>
        <div className="glass rounded-2xl overflow-hidden">
          {[
            { action: "Complete a trip", points: "+100", icon: Mountain },
            { action: "Write a review", points: "+25", icon: Star },
            { action: "Refer a friend", points: "+50", icon: Users },
            { action: "Share on social", points: "+10", icon: Target },
          ].map((item, i) => (
            <div
              key={item.action}
              className={`flex items-center gap-3 px-4 py-3.5 ${
                i < 3 ? "border-b border-white/5" : ""
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-lime/10 flex items-center justify-center">
                <item.icon size={14} className="text-lime" />
              </div>
              <span className="text-sm text-foreground flex-1">
                {item.action}
              </span>
              <span className="text-sm text-lime font-semibold">
                {item.points}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Physical NFC Card */}
      <section className="px-5 mb-6">
        <div
          className="rounded-2xl p-5 relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.15 0.01 120) 0%, oklch(0.10 0.005 250) 100%)",
            border: "1px solid oklch(0.82 0.18 120 / 15%)",
          }}
        >
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard size={18} className="text-lime" />
              <h3 className="text-base font-semibold text-foreground font-sans">
                Physical NFC Card
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Get a physical loyalty card with NFC. Tap to instantly open your
              profile and earn points at events.
            </p>
            <div className="flex items-center justify-between">
              <span className="text-lime font-bold">$3.00</span>
              <Button
                onClick={() => toast.info("Feature coming soon")}
                className="bg-lime hover:bg-lime-light text-black font-semibold px-6 rounded-xl"
              >
                Order Card
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
