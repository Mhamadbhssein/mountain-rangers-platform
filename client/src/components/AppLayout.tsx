/* ============================================================
 * AppLayout — Persistent bottom navigation + page container
 * Design: Alpine Glass / Lime-green brand identity
 * Bottom nav with glass effect, morphing active states
 * ============================================================ */

import { useLocation, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, CalendarCheck, Users, User } from "lucide-react";
import { type ReactNode } from "react";
import { LOGOS } from "@/lib/data";

const NAV_ITEMS = [
  { path: "/", label: "Explore", icon: Compass },
  { path: "/bookings", label: "Bookings", icon: CalendarCheck },
  { path: "/community", label: "Community", icon: Users },
  { path: "/profile", label: "Profile", icon: User },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  const hideNav = location.startsWith("/book/") || location.startsWith("/trip/");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Main content area with bottom padding for nav */}
      <main className={`flex-1 ${hideNav ? "" : "pb-20"}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation — Glass panel */}
      {!hideNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-50">
          <div className="glass-strong border-t border-white/[0.08]">
            <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
              {NAV_ITEMS.map((item) => {
                const isActive =
                  item.path === "/"
                    ? location === "/"
                    : location.startsWith(item.path);
                const Icon = item.icon;

                return (
                  <Link key={item.path} href={item.path}>
                    <motion.div
                      className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-2xl transition-colors relative ${
                        isActive ? "text-lime" : "text-muted-foreground"
                      }`}
                      whileTap={{ scale: 0.92 }}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="nav-indicator"
                          className="absolute inset-0 rounded-2xl"
                          style={{ background: "oklch(0.82 0.18 120 / 10%)" }}
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 30,
                          }}
                        />
                      )}
                      <Icon
                        size={22}
                        strokeWidth={isActive ? 2.5 : 1.8}
                        className="relative z-10"
                      />
                      <span className="text-[10px] font-medium relative z-10 tracking-wide">
                        {item.label}
                      </span>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
            {/* Safe area for notched phones */}
            <div className="h-[env(safe-area-inset-bottom)]" />
          </div>
        </nav>
      )}
    </div>
  );
}
