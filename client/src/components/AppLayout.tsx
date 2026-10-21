import { useLocation, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, CalendarDays, Map, Users, User } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { PUBLIC_NAV_ITEMS } from "@/lib/publicShell";
import { useAppearance } from "@/contexts/AppearanceContext";
import { NotificationBell, NotificationPopup, SiteBanner } from "@/components/NotificationCenter";

const NAV_ICONS = { compass: Compass, calendar: CalendarDays, map: Map, users: Users, user: User } as const;

export default function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { resolved } = useAppearance();
  const hideNav = location.startsWith("/book/") || location.startsWith("/trip/");
  const hideBell = hideNav || location.startsWith("/notifications");

  // Dark appearance applies to public pages only; admin keeps its own styling.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("mr-dark", resolved === "dark");
    return () => root.classList.remove("mr-dark");
  }, [resolved]);

  return (
    <div className="min-h-screen bg-[#f7f8f5] text-[#172019] flex flex-col">
      <SiteBanner />
      {!hideBell && (
        <div className="sticky top-0 z-50 h-0">
          <div className="pointer-events-none mx-auto flex max-w-2xl justify-end px-4 pt-3">
            <NotificationBell className="pointer-events-auto" />
          </div>
        </div>
      )}
      <NotificationPopup />
      <main className={`flex-1 ${hideNav ? "" : "pb-24"}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {!hideNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-3">
          <div className="mx-auto max-w-md rounded-3xl border border-black/[0.06] bg-white/95 p-2 shadow-[0_12px_40px_rgba(41,58,42,0.14)] backdrop-blur-xl">
            <div className="grid grid-cols-5 gap-1">
              {PUBLIC_NAV_ITEMS.map((item) => {
                const isActive = item.path === "/"
                  ? location === "/"
                  : location.startsWith(item.path) || (item.path === "/trails" && (location.startsWith("/trail/") || location.startsWith("/recording/")));
                const Icon = NAV_ICONS[item.icon];
                return (
                  <Link key={item.path} href={item.path}>
                    <motion.div
                      whileTap={{ scale: 0.94 }}
                      className={`relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-semibold transition-colors ${
                        isActive ? "bg-[#eef5d8] text-[#719000]" : "text-[#8b948d] hover:bg-[#f5f7f2]"
                      }`}
                    >
                      <Icon size={19} strokeWidth={isActive ? 2.4 : 1.8} />
                      <span>{item.label}</span>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
            <div className="h-[env(safe-area-inset-bottom)]" />
          </div>
        </nav>
      )}
    </div>
  );
}
