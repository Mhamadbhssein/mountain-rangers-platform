import { AlertTriangle, Bell, CalendarCheck, Clock, Gift, Megaphone, Mountain, Users, type LucideIcon } from "lucide-react";

export const NOTIFICATION_TYPE_OPTIONS = ["announcement", "trip", "offer", "reminder", "alert", "booking", "community", "reward"] as const;
export type NotificationTypeOption = (typeof NOTIFICATION_TYPE_OPTIONS)[number];

export const NOTIFICATION_TYPE_META: Record<NotificationTypeOption, { label: string; icon: LucideIcon; chip: string; dot: string }> = {
  announcement: { label: "Announcement", icon: Megaphone, chip: "bg-[#eaf1d0] text-[#617900]", dot: "#8fb31c" },
  trip: { label: "New Trip", icon: Mountain, chip: "bg-emerald-100 text-emerald-700", dot: "#2f9e44" },
  offer: { label: "Special Offer", icon: Gift, chip: "bg-fuchsia-100 text-fuchsia-700", dot: "#c026d3" },
  reminder: { label: "Reminder", icon: Clock, chip: "bg-sky-100 text-sky-700", dot: "#0284c7" },
  alert: { label: "Important Alert", icon: AlertTriangle, chip: "bg-red-100 text-red-700", dot: "#dc2626" },
  booking: { label: "Booking", icon: CalendarCheck, chip: "bg-amber-100 text-amber-700", dot: "#d97706" },
  community: { label: "Community", icon: Users, chip: "bg-violet-100 text-violet-700", dot: "#7c3aed" },
  reward: { label: "Reward", icon: Gift, chip: "bg-yellow-100 text-yellow-700", dot: "#ca8a04" },
};

export function notificationMeta(type: string | null | undefined) {
  return NOTIFICATION_TYPE_META[(type as NotificationTypeOption) ?? "announcement"] ?? { label: "Notification", icon: Bell, chip: "bg-[#eaf1d0] text-[#617900]", dot: "#8fb31c" };
}

export function timeAgo(value: Date | string) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** True for in-app routes; external https links open in a new tab. */
export function isInternalLink(link: string) {
  return link.startsWith("/");
}
