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
  Star,
  Loader2,
} from "lucide-react";
import { LOYALTY_LEVELS, LOGOS } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

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
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const { data: loyaltyData, isLoading } = trpc.loyalty.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const requestNfcMutation = trpc.loyalty.requestNfcCard.useMutation({
    onSuccess: () => {
      toast.success("NFC card request submitted!");
    },
    onError: () => {
      toast.error("Failed to request NFC card");
    },
  });

  if (authLoading || isLoading) {
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
        <p className="text-foreground font-serif text-xl mb-2">Sign in to view loyalty card</p>
        <p className="text-muted-foreground text-sm mb-6 text-center">
          Log in to track your points and badges
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
  const nfcCardRequested = loyaltyData?.nfcCardRequested ?? false;

  const currentLevelIndex = LOYALTY_LEVELS.findIndex((l) => l.name === level);
  const currentLevelData = LOYALTY_LEVELS[currentLevelIndex];
  const nextLevel = LOYALTY_LEVELS[currentLevelIndex + 1];
  const nextLevelPoints = nextLevel?.minPoints ?? 5000;
  const currentLevelMinPoints = currentLevelData?.minPoints ?? 0;
  const progressPercent = nextLevel
    ? ((points - currentLevelMinPoints) / (nextLevelPoints - currentLevelMinPoints)) * 100
    : 100;

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "2024";

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
              <img src={LOGOS.iconWhite} alt="Mountain Rangers" className="h-18" />
              <div className="text-right">
                <p className="text-[10px] text-lime/50 font-mono tracking-widest">
                  MEMBERSHIP
                </p>
                <p className="text-xs text-lime/70 font-mono">
                  Since {memberSince}
                </p>
              </div>
            </div>

            {/* Member info */}
            <div className="mb-6">
              <p className="text-white/50 text-xs mb-1">Member</p>
              <p className="text-white text-xl font-semibold font-sans">
                {user?.name ?? "Trail Explorer"}
              </p>
            </div>

            {/* Level & Points */}
            <div className="flex items-end justify-between">
              <div>
                <p className="text-white/50 text-xs mb-1">Level</p>
                <p
                  className="text-xl font-bold font-sans"
                  style={{ color: currentLevelData?.color || "#B8D435" }}
                >
                  {level}
                </p>
              </div>
              <div className="text-right">
                <p className="text-white/50 text-xs mb-1">Points</p>
                <p className="text-2xl font-bold text-lime font-sans">
                  {points.toLocaleString()}
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
                {level}
              </span>
              <span className="text-sm text-muted-foreground">
                {nextLevel?.name ?? "Max Level"}
              </span>
            </div>
            <div className="h-3 bg-white/5 rounded-full overflow-hidden relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progressPercent, 100)}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-lime-dark to-lime"
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground">
                {points.toLocaleString()} pts
              </span>
              <span className="text-xs text-lime">
                {nextLevel ? `${(nextLevelPoints - points).toLocaleString()} pts to go` : "Max level reached!"}
              </span>
            </div>
          </div>

          {/* Level tiers */}
          <div className="flex items-center gap-1 mt-2">
            {LOYALTY_LEVELS.map((lvl, i) => {
              const isActive = i <= currentLevelIndex;
              return (
                <div key={lvl.name} className="flex-1 flex flex-col items-center">
                  <div
                    className={`w-full h-1.5 rounded-full mb-2 ${
                      isActive ? "" : "bg-white/5"
                    }`}
                    style={isActive ? { background: lvl.color } : {}}
                  />
                  <span
                    className="text-[9px] font-medium"
                    style={{ color: isActive ? lvl.color : "oklch(0.5 0 0)" }}
                  >
                    {lvl.name}
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
          {badges.map((badge, i) => {
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
                onClick={() => {
                  if (nfcCardRequested) {
                    toast.info("NFC card already requested!");
                    return;
                  }
                  requestNfcMutation.mutate();
                }}
                disabled={requestNfcMutation.isPending || nfcCardRequested}
                className="bg-lime hover:bg-lime-light text-black font-semibold px-6 rounded-xl"
              >
                {nfcCardRequested ? "Requested" : requestNfcMutation.isPending ? "..." : "Order Card"}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
