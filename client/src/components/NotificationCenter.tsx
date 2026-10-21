import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Bell, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { isInternalLink, notificationMeta } from "@/lib/notifications";

const POLL_MS = 60_000;

/** Floating bell with unread badge, shown on public pages for signed-in members. */
export function NotificationBell({ className = "" }: { className?: string }) {
  const { isAuthenticated } = useAuth();
  const { data: unread = 0 } = trpc.notifications.unreadCount.useQuery(undefined, { enabled: isAuthenticated, refetchInterval: POLL_MS, refetchOnWindowFocus: true });
  if (!isAuthenticated) return null;
  return (
    <Link href="/notifications" aria-label={unread > 0 ? `${unread} unread notifications` : "Notifications"} className={`relative flex h-10 w-10 items-center justify-center rounded-full border border-black/[0.06] bg-white/95 text-[#172019] shadow-[0_6px_18px_rgba(41,58,42,0.14)] backdrop-blur ${className}`}>
      <Bell size={18} />
      {unread > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{unread > 99 ? "99+" : unread}</span>}
    </Link>
  );
}

/** Opens a link from a notification: in-app routes navigate, external links open a new tab. */
function useOpenLink() {
  const [, navigate] = useLocation();
  return (link?: string | null) => {
    if (!link) return;
    if (isInternalLink(link)) navigate(link);
    else window.open(link, "_blank", "noopener,noreferrer");
  };
}

/** Modal for the latest unread notification that the admin marked as a pop-up. */
export function NotificationPopup() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const openLink = useOpenLink();
  const { data: popup } = trpc.notifications.popup.useQuery(undefined, { enabled: isAuthenticated, refetchInterval: POLL_MS, refetchOnWindowFocus: true });
  const markRead = trpc.notifications.markRead.useMutation({
    onSuccess: () => {
      utils.notifications.popup.invalidate();
      utils.notifications.unreadCount.invalidate();
      utils.notifications.list.invalidate();
    },
  });
  if (!isAuthenticated || !popup) return null;
  const meta = notificationMeta(popup.type);
  const Icon = meta.icon;
  const dismiss = () => markRead.mutate({ id: popup.id });
  return (
    <AnimatePresence>
      <motion.div key={popup.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 px-5" onClick={dismiss}>
        <motion.div initial={{ scale: 0.94, y: 12 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="notification-popup-title">
          <div className="flex items-start justify-between">
            <div className={`rounded-2xl p-3 ${meta.chip}`}><Icon size={22} /></div>
            <button onClick={dismiss} aria-label="Close" className="rounded-full p-1.5 text-[#8a938c] hover:bg-[#f1f4ee]"><X size={18} /></button>
          </div>
          <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.18em] text-[#91a72b]">{meta.label}</p>
          <h2 id="notification-popup-title" className="mt-1 text-xl font-bold text-[#172019]">{popup.title}</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#5d675f]">{popup.message}</p>
          <div className="mt-6 flex gap-2">
            {popup.link && <button onClick={() => { dismiss(); openLink(popup.link); }} className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-[#b8d435] py-3 text-sm font-bold text-[#172019]">View <ArrowRight size={15} /></button>}
            <button onClick={dismiss} className={`rounded-2xl bg-[#f4f6ef] py-3 text-sm font-bold text-[#3d4a40] ${popup.link ? "px-5" : "flex-1"}`}>{popup.link ? "Later" : "Got it"}</button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

const DISMISSED_KEY = "mr-dismissed-banner";

/** Thin site-wide banner for a sent "everyone" notification with the banner option. */
export function SiteBanner() {
  const openLink = useOpenLink();
  const { data: banner } = trpc.notifications.siteBanner.useQuery(undefined, { refetchInterval: POLL_MS * 5 });
  const [dismissed, setDismissed] = useState<string | null>(() => (typeof window === "undefined" ? null : window.localStorage.getItem(DISMISSED_KEY)));
  useEffect(() => {
    if (dismissed) window.localStorage.setItem(DISMISSED_KEY, dismissed);
  }, [dismissed]);
  if (!banner || dismissed === String(banner.id)) return null;
  const meta = notificationMeta(banner.type);
  const Icon = meta.icon;
  return (
    <div className="relative z-[55] flex items-center gap-3 bg-[#18221b] px-4 py-2.5 text-white">
      <Icon size={16} className="shrink-0 text-[#b8d435]" />
      <button onClick={() => openLink(banner.link)} disabled={!banner.link} className="min-w-0 flex-1 text-left text-xs disabled:cursor-default">
        <span className="font-bold">{banner.title}</span>
        <span className="text-white/70"> · {banner.message}</span>
        {banner.link && <span className="ml-1 font-bold text-[#b8d435]">View</span>}
      </button>
      <button onClick={() => setDismissed(String(banner.id))} aria-label="Dismiss banner" className="shrink-0 rounded-full p-1 text-white/60 hover:text-white"><X size={15} /></button>
    </div>
  );
}
