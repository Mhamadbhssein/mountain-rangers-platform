import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Bell, CheckCheck, ChevronRight, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { isInternalLink, notificationMeta, timeAgo } from "@/lib/notifications";

const FILTERS = ["All", "Unread"] as const;

export default function Notifications() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const utils = trpc.useUtils();
  const { data: items = [], isLoading } = trpc.notifications.list.useQuery(undefined, { enabled: isAuthenticated, refetchOnWindowFocus: true });
  const refresh = () => {
    utils.notifications.list.invalidate();
    utils.notifications.unreadCount.invalidate();
    utils.notifications.popup.invalidate();
  };
  const markRead = trpc.notifications.markRead.useMutation({ onSuccess: refresh });
  const markAllRead = trpc.notifications.markAllRead.useMutation({ onSuccess: () => { refresh(); toast.success("All notifications marked as read"); } });
  const remove = trpc.notifications.remove.useMutation({ onSuccess: refresh, onError: (e) => toast.error(e.message) });
  const clearAll = trpc.notifications.clearAll.useMutation({ onSuccess: () => { refresh(); toast.success("Notifications cleared"); } });

  const unreadCount = items.filter((n) => !n.isRead).length;
  const visible = useMemo(() => (filter === "Unread" ? items.filter((n) => !n.isRead) : items), [items, filter]);

  if (loading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="animate-spin text-[#91a72b]" /></div>;
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <Bell size={40} className="text-[#b8d435]" />
        <p className="mt-3 text-lg font-bold text-[#172019]">Sign in to see your notifications</p>
        <Button onClick={() => (window.location.href = getLoginUrl())} className="mt-5 rounded-2xl bg-[#b8d435] px-8 font-bold text-[#172019] hover:bg-[#c7e04d]">Sign In</Button>
      </div>
    );
  }

  const open = (item: (typeof items)[number]) => {
    if (!item.isRead) markRead.mutate({ id: item.id });
    if (!item.link) return;
    if (isInternalLink(item.link)) navigate(item.link);
    else window.open(item.link, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen px-5 pb-8 pt-8">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <button onClick={() => (window.history.length > 1 ? window.history.back() : navigate("/"))} aria-label="Back" className="rounded-full bg-white p-2.5 shadow-sm"><ArrowLeft size={18} className="text-[#172019]" /></button>
          {unreadCount > 0 && <button onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending} className="flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-xs font-semibold text-[#617900] shadow-sm"><CheckCheck size={14} />Mark all read</button>}
        </div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.22em] text-[#91a72b]">Inbox</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#172019]">Notifications</h1>
        <p className="mt-1 text-sm text-[#7f8981]">{unreadCount > 0 ? `${unreadCount} unread` : "You are all caught up"}</p>

        <div className="mt-5 flex gap-2">
          {FILTERS.map((f) => <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-4 py-2 text-xs font-bold ${filter === f ? "bg-[#b8d435] text-[#172019]" : "bg-white text-[#7f8981]"}`}>{f}{f === "Unread" && unreadCount > 0 ? ` (${unreadCount})` : ""}</button>)}
        </div>

        {isLoading ? (
          <div className="mt-6 flex justify-center rounded-3xl bg-white p-10"><Loader2 className="animate-spin text-[#91a72b]" /></div>
        ) : visible.length === 0 ? (
          <div className="mt-6 rounded-3xl bg-white p-10 text-center shadow-sm">
            <Bell className="mx-auto text-[#b8d435]" />
            <p className="mt-3 text-sm font-bold text-[#172019]">{filter === "Unread" ? "No unread notifications" : "No notifications yet"}</p>
            <p className="mt-1 text-xs text-[#8a938c]">Trip news, booking updates, and offers will show up here.</p>
            <Link href="/" className="mt-4 inline-block rounded-full bg-[#eaf1d0] px-4 py-2 text-xs font-bold text-[#617900]">Explore trips</Link>
          </div>
        ) : (
          <ul className="mt-5 space-y-2.5">
            {visible.map((item) => {
              const meta = notificationMeta(item.type);
              const Icon = meta.icon;
              return (
                <li key={item.id} className={`group relative rounded-3xl bg-white p-4 shadow-sm transition ${item.isRead ? "" : "ring-1 ring-[#b8d435]/60"}`}>
                  <button onClick={() => open(item)} className="flex w-full items-start gap-3 text-left">
                    <div className={`shrink-0 rounded-2xl p-2.5 ${meta.chip}`}><Icon size={17} /></div>
                    <div className="min-w-0 flex-1 pr-6">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#91a72b]">{meta.label}</span>
                        {!item.isRead && <span className="h-2 w-2 rounded-full bg-red-500" aria-label="Unread" />}
                      </div>
                      <p className={`mt-0.5 text-sm text-[#172019] ${item.isRead ? "font-semibold" : "font-bold"}`}>{item.title}</p>
                      <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-[#5d675f]">{item.message}</p>
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-[#9aa39b]"><span>{timeAgo(item.createdAt)}</span>{item.link && <span className="flex items-center font-semibold text-[#617900]">Open<ChevronRight size={12} /></span>}</div>
                    </div>
                  </button>
                  <button onClick={() => remove.mutate({ id: item.id })} aria-label="Delete notification" className="absolute right-3 top-3 rounded-full p-1.5 text-[#c2c9c0] transition hover:bg-red-50 hover:text-red-500"><Trash2 size={14} /></button>
                </li>
              );
            })}
          </ul>
        )}

        {items.length > 0 && <button onClick={() => { if (window.confirm("Delete all notifications?")) clearAll.mutate(); }} className="mt-6 w-full text-center text-xs font-medium text-[#9aa39b] hover:text-red-500">Clear all notifications</button>}
      </div>
    </div>
  );
}
