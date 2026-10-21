import { useEffect, useMemo, useState } from "react";
import { Bell, Eye, Megaphone, Pencil, Send, Save, Trash2, Users, X } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { NOTIFICATION_TYPE_META, NOTIFICATION_TYPE_OPTIONS, notificationMeta, type NotificationTypeOption } from "@/lib/notifications";

type Audience = "all" | "booked" | "members" | "admins" | "trip" | "user";

const AUDIENCES: { value: Audience; label: string; hint: string }[] = [
  { value: "all", label: "Everyone", hint: "All registered members" },
  { value: "booked", label: "Members with bookings", hint: "Anyone with an active booking" },
  { value: "trip", label: "Passengers of a trip", hint: "Members booked on one trip" },
  { value: "user", label: "One member", hint: "Send to a single person" },
  { value: "members", label: "Trails Premium", hint: "Active trail subscribers" },
  { value: "admins", label: "Admins only", hint: "Your team (useful for testing)" },
];

const QUICK_LINKS = [
  { label: "No link", value: "" },
  { label: "Explore trips", value: "/" },
  { label: "Schedule", value: "/schedule" },
  { label: "Trails", value: "/trails" },
  { label: "Community", value: "/community" },
  { label: "My bookings", value: "/bookings" },
  { label: "Loyalty card", value: "/loyalty" },
  { label: "Private trips", value: "/private-trips" },
];

const TEMPLATES: { label: string; type: NotificationTypeOption; title: string; message: string; link: string }[] = [
  { label: "New trip", type: "trip", title: "New trip just added", message: "A new hike is now open for booking. Seats are limited, so reserve yours early.", link: "/" },
  { label: "Departure reminder", type: "reminder", title: "Trip reminder", message: "Your trip is coming up. Please arrive 30 minutes before departure and bring water, snacks, and good hiking shoes.", link: "/bookings" },
  { label: "Weather alert", type: "alert", title: "Weather update", message: "Due to the weather forecast, please check your booking for any schedule changes.", link: "/bookings" },
  { label: "Special offer", type: "offer", title: "Special offer for members", message: "Book this week and get a discount on selected trips. Contact us on WhatsApp for details.", link: "/" },
];

const emptyForm = {
  id: null as number | null,
  type: "announcement" as NotificationTypeOption,
  title: "",
  message: "",
  link: "",
  audience: "all" as Audience,
  targetTripId: null as number | null,
  targetUserId: null as number | null,
  showPopup: false,
  showBanner: false,
  bannerDays: 3,
};

export default function AdminNotifications() {
  const utils = trpc.useUtils();
  const [form, setForm] = useState(emptyForm);
  const [userSearch, setUserSearch] = useState("");
  const { data: history = [], isLoading } = trpc.admin.broadcasts.useQuery();
  const { data: trips = [] } = trpc.admin.allTrips.useQuery();
  const { data: members = [] } = trpc.admin.allUsers.useQuery();

  const target = useMemo(() => ({ audience: form.audience, targetTripId: form.targetTripId, targetUserId: form.targetUserId }), [form.audience, form.targetTripId, form.targetUserId]);
  const targetReady = (form.audience !== "trip" || !!form.targetTripId) && (form.audience !== "user" || !!form.targetUserId);
  const { data: recipientCount, isFetching: countingRecipients } = trpc.admin.previewRecipients.useQuery(target, { enabled: targetReady });

  useEffect(() => {
    if (form.audience !== "all" && form.showBanner) setForm((f) => ({ ...f, showBanner: false }));
  }, [form.audience, form.showBanner]);

  const onDone = (message: string) => {
    utils.admin.broadcasts.invalidate();
    toast.success(message);
    setForm(emptyForm);
    setUserSearch("");
  };
  const create = trpc.admin.createBroadcast.useMutation({
    onSuccess: (result) => onDone(result.sent ? `Notification sent to ${result.recipients} member${result.recipients === 1 ? "" : "s"}` : "Draft saved"),
    onError: (e) => toast.error(e.message),
  });
  const update = trpc.admin.updateBroadcast.useMutation({ onSuccess: () => onDone("Draft updated"), onError: (e) => toast.error(e.message) });
  const send = trpc.admin.sendBroadcast.useMutation({
    onSuccess: (result) => { utils.admin.broadcasts.invalidate(); toast.success(`Notification sent to ${result.recipients} member${result.recipients === 1 ? "" : "s"}`); },
    onError: (e) => toast.error(e.message),
  });
  const remove = trpc.admin.deleteBroadcast.useMutation({ onSuccess: () => { utils.admin.broadcasts.invalidate(); toast.success("Notification deleted"); }, onError: (e) => toast.error(e.message) });
  const endBanner = trpc.admin.endBroadcastBanner.useMutation({ onSuccess: () => { utils.admin.broadcasts.invalidate(); toast.success("Banner removed from the website"); } });

  const payload = (sendNow: boolean) => ({
    type: form.type,
    title: form.title.trim(),
    message: form.message.trim(),
    link: form.link.trim(),
    audience: form.audience,
    targetTripId: form.audience === "trip" ? form.targetTripId : null,
    targetUserId: form.audience === "user" ? form.targetUserId : null,
    showPopup: form.showPopup,
    showBanner: form.showBanner,
    bannerDays: form.showBanner ? form.bannerDays : undefined,
    sendNow,
  });

  const valid = form.title.trim().length > 0 && form.message.trim().length > 0 && targetReady && (!form.link.trim() || form.link.trim().startsWith("/") || /^https:\/\//i.test(form.link.trim()));
  const busy = create.isPending || update.isPending;

  const submit = (sendNow: boolean) => {
    if (!valid) return;
    if (sendNow) {
      const count = recipientCount ?? 0;
      if (count === 0) { toast.error("No members match this audience yet"); return; }
      if (!window.confirm(`Send "${form.title.trim()}" to ${count} member${count === 1 ? "" : "s"} now?`)) return;
    }
    if (form.id && !sendNow) update.mutate({ id: form.id, ...payload(false) });
    else if (form.id && sendNow) update.mutate({ id: form.id, ...payload(false) }, { onSuccess: () => send.mutate({ id: form.id! }) });
    else create.mutate(payload(sendNow));
  };

  const filteredMembers = members.filter((m: any) => !userSearch.trim() || `${m.name ?? ""} ${m.email ?? ""} ${m.phone ?? ""}`.toLowerCase().includes(userSearch.trim().toLowerCase())).slice(0, 8);
  const selectedMember = members.find((m: any) => m.id === form.targetUserId) as any;
  const meta = notificationMeta(form.type);
  const PreviewIcon = meta.icon;

  const audienceLabel = (row: any) => {
    if (row.audience === "trip") return `Trip: ${trips.find((t: any) => t.id === row.targetTripId)?.title ?? `#${row.targetTripId}`}`;
    if (row.audience === "user") return `Member: ${(members.find((m: any) => m.id === row.targetUserId) as any)?.name ?? `#${row.targetUserId}`}`;
    return AUDIENCES.find((a) => a.value === row.audience)?.label ?? row.audience;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-lime-400">Admin</p>
          <h1 className="mt-1 text-3xl font-bold text-white">Custom Notifications</h1>
          <p className="mt-1 text-sm text-gray-400">Write a message and send it to members. It appears in their notification bell, and optionally as a pop-up or a banner across the website.</p>
        </header>

        <div className="grid gap-6 xl:grid-cols-[1.25fr_1fr]">
          <section className="space-y-5 rounded-2xl border border-[#1a2a1a] bg-[#0d150d] p-5">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold text-white"><Megaphone className="h-5 w-5 text-lime-400" />{form.id ? "Edit draft" : "New notification"}</h2>
              {form.id && <button onClick={() => setForm(emptyForm)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-white"><X className="h-3.5 w-3.5" />Cancel edit</button>}
            </div>

            <div>
              <Label>Quick templates</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {TEMPLATES.map((t) => <button key={t.label} onClick={() => setForm((f) => ({ ...f, type: t.type, title: t.title, message: t.message, link: t.link }))} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-300 hover:border-lime-500/40 hover:text-white">{t.label}</button>)}
              </div>
            </div>

            <div>
              <Label>Type</Label>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {NOTIFICATION_TYPE_OPTIONS.map((type) => {
                  const m = NOTIFICATION_TYPE_META[type];
                  const Icon = m.icon;
                  return <button key={type} onClick={() => setForm((f) => ({ ...f, type }))} className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs font-medium transition ${form.type === type ? "border-lime-500 bg-lime-500/10 text-lime-300" : "border-white/10 bg-white/5 text-gray-400 hover:text-white"}`}><Icon className="h-3.5 w-3.5" />{m.label}</button>;
                })}
              </div>
            </div>

            <div>
              <Label>Title</Label>
              <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} maxLength={120} placeholder="e.g. Qadisha Valley hike this Saturday" className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-lime-500/60" />
              <Counter value={form.title.length} max={120} />
            </div>

            <div>
              <Label>Message</Label>
              <textarea value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} maxLength={1000} rows={4} placeholder="Write the details members should know..." className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-lime-500/60" />
              <Counter value={form.message.length} max={1000} />
            </div>

            <div>
              <Label>Button link (optional)</Label>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <select value={QUICK_LINKS.some((l) => l.value === form.link) ? form.link : "custom"} onChange={(e) => e.target.value !== "custom" && setForm((f) => ({ ...f, link: e.target.value }))} className="rounded-xl border border-white/10 bg-[#0a110a] px-3 py-2.5 text-sm text-white outline-none">
                  {QUICK_LINKS.map((l) => <option key={l.label} value={l.value}>{l.label}</option>)}
                  {trips.slice(0, 20).map((t: any) => <option key={`trip-${t.id}`} value={`/trip/${t.id}`}>Trip: {t.title}</option>)}
                  <option value="custom">Custom link...</option>
                </select>
                <input value={form.link} onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))} placeholder="/trails or https://..." className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-lime-500/60" />
              </div>
              {form.link.trim() && !form.link.trim().startsWith("/") && !/^https:\/\//i.test(form.link.trim()) && <p className="mt-1 text-xs text-red-400">Link must start with / or https://</p>}
            </div>

            <div>
              <Label>Send to</Label>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {AUDIENCES.map((a) => <button key={a.value} onClick={() => setForm((f) => ({ ...f, audience: a.value }))} className={`rounded-xl border px-3 py-2.5 text-left transition ${form.audience === a.value ? "border-lime-500 bg-lime-500/10" : "border-white/10 bg-white/5 hover:border-white/20"}`}><p className={`text-sm font-semibold ${form.audience === a.value ? "text-lime-300" : "text-white"}`}>{a.label}</p><p className="text-[11px] text-gray-500">{a.hint}</p></button>)}
              </div>
              {form.audience === "trip" && (
                <select value={form.targetTripId ?? ""} onChange={(e) => setForm((f) => ({ ...f, targetTripId: e.target.value ? Number(e.target.value) : null }))} className="mt-3 w-full rounded-xl border border-white/10 bg-[#0a110a] px-3 py-2.5 text-sm text-white outline-none">
                  <option value="">Choose a trip...</option>
                  {trips.map((t: any) => <option key={t.id} value={t.id}>{t.title} · {new Date(t.date).toLocaleDateString()} · {t.bookedSeatsCount ?? 0} booked</option>)}
                </select>
              )}
              {form.audience === "user" && (
                <div className="mt-3 space-y-2">
                  {selectedMember ? (
                    <div className="flex items-center justify-between rounded-xl border border-lime-500/40 bg-lime-500/10 px-3 py-2.5"><div><p className="text-sm font-semibold text-white">{selectedMember.name ?? "Member"}</p><p className="text-xs text-gray-400">{selectedMember.email ?? selectedMember.phone ?? ""}</p></div><button onClick={() => setForm((f) => ({ ...f, targetUserId: null }))} className="text-xs text-gray-400 hover:text-white">Change</button></div>
                  ) : (
                    <>
                      <input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Search by name, email, or phone" className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-lime-500/60" />
                      <div className="max-h-48 space-y-1 overflow-y-auto">
                        {filteredMembers.map((m: any) => <button key={m.id} onClick={() => setForm((f) => ({ ...f, targetUserId: m.id }))} className="w-full rounded-lg px-3 py-2 text-left hover:bg-white/5"><p className="text-sm text-white">{m.name ?? "Member"}</p><p className="text-[11px] text-gray-500">{m.email ?? m.phone ?? `#${m.id}`}</p></button>)}
                        {filteredMembers.length === 0 && <p className="px-3 py-2 text-xs text-gray-500">No matching members.</p>}
                      </div>
                    </>
                  )}
                </div>
              )}
              <p className="mt-3 flex items-center gap-1.5 text-xs text-gray-400"><Users className="h-3.5 w-3.5 text-lime-400" />{!targetReady ? "Choose who should receive it" : countingRecipients ? "Counting recipients..." : `${recipientCount ?? 0} member${recipientCount === 1 ? "" : "s"} will receive this`}</p>
            </div>

            <div className="space-y-2">
              <Label>Display options</Label>
              <Toggle checked label="Notification bell" hint="Always included. Members see it in their inbox." disabled />
              <Toggle checked={form.showPopup} onChange={(v) => setForm((f) => ({ ...f, showPopup: v }))} label="Pop-up alert" hint="Opens a pop-up the next time the member visits the website." />
              <Toggle checked={form.showBanner} onChange={(v) => setForm((f) => ({ ...f, showBanner: v }))} disabled={form.audience !== "all"} label="Website banner" hint={form.audience === "all" ? "Shows a strip at the top of every page, including for visitors." : "Available only when sending to everyone."} />
              {form.showBanner && (
                <div className="flex items-center gap-2 pl-1 text-xs text-gray-400">Show banner for
                  <select value={form.bannerDays} onChange={(e) => setForm((f) => ({ ...f, bannerDays: Number(e.target.value) }))} className="rounded-lg border border-white/10 bg-[#0a110a] px-2 py-1 text-white">{[1, 2, 3, 5, 7, 14, 30].map((d) => <option key={d} value={d}>{d} day{d === 1 ? "" : "s"}</option>)}</select>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 border-t border-white/5 pt-4 sm:flex-row">
              <Button onClick={() => submit(true)} disabled={!valid || busy || send.isPending} className="flex-1 bg-lime-500 font-semibold text-black hover:bg-lime-400"><Send className="mr-2 h-4 w-4" />{busy || send.isPending ? "Sending..." : "Send now"}</Button>
              <Button onClick={() => submit(false)} disabled={!valid || busy} variant="outline" className="flex-1 border-white/15 bg-transparent text-white hover:bg-white/5"><Save className="mr-2 h-4 w-4" />{form.id ? "Update draft" : "Save as draft"}</Button>
            </div>
          </section>

          <section className="space-y-4">
            <div className="rounded-2xl border border-[#1a2a1a] bg-[#0d150d] p-5">
              <h2 className="flex items-center gap-2 text-sm font-bold text-white"><Eye className="h-4 w-4 text-lime-400" />Member preview</h2>
              <div className="mt-4 rounded-3xl bg-[#f7f8f5] p-4">
                {form.showBanner && <div className="mb-3 flex items-center gap-2 rounded-xl bg-[#18221b] px-3 py-2 text-[11px] text-white"><PreviewIcon className="h-3.5 w-3.5 text-[#b8d435]" /><span className="truncate"><b>{form.title || "Title"}</b> · <span className="text-white/70">{form.message || "Message"}</span></span></div>}
                <div className="rounded-3xl bg-white p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className={`rounded-2xl p-2.5 ${meta.chip}`}><PreviewIcon className="h-4 w-4" /></div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2"><span className="text-[10px] font-bold uppercase tracking-wider text-[#91a72b]">{meta.label}</span><span className="h-2 w-2 rounded-full bg-red-500" /></div>
                      <p className="mt-0.5 text-sm font-bold text-[#172019]">{form.title || "Your notification title"}</p>
                      <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-[#5d675f]">{form.message || "Your message will appear here."}</p>
                      <p className="mt-2 text-[11px] text-[#9aa39b]">Just now{form.link ? <span className="ml-2 font-semibold text-[#617900]">Open</span> : null}</p>
                    </div>
                  </div>
                </div>
                {form.showPopup && <p className="mt-3 text-center text-[11px] text-[#7f8981]">Also shown as a pop-up on the member's next visit.</p>}
              </div>
            </div>

            <div className="rounded-2xl border border-[#1a2a1a] bg-[#0d150d] p-5">
              <h2 className="flex items-center gap-2 text-sm font-bold text-white"><Bell className="h-4 w-4 text-lime-400" />History</h2>
              {isLoading ? <p className="py-6 text-center text-sm text-gray-500">Loading...</p> : history.length === 0 ? <p className="py-6 text-center text-sm text-gray-500">No notifications yet.</p> : (
                <div className="mt-3 max-h-[640px] space-y-2 overflow-y-auto pr-1">
                  {history.map((row: any) => {
                    const m = notificationMeta(row.type);
                    const readRate = row.delivered > 0 ? Math.round((row.readCount / row.delivered) * 100) : 0;
                    const bannerLive = row.status === "sent" && row.showBanner && (!row.bannerExpiresAt || new Date(row.bannerExpiresAt) > new Date());
                    return (
                      <div key={row.id} className="rounded-xl border border-[#1a2a1a] p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${m.chip}`}>{m.label}</span>
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${row.status === "sent" ? "bg-lime-500/15 text-lime-300" : "bg-white/10 text-gray-300"}`}>{row.status === "sent" ? "Sent" : "Draft"}</span>
                              {row.showPopup && <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-gray-300">Pop-up</span>}
                              {bannerLive && <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] text-sky-300">Banner live</span>}
                            </div>
                            <p className="mt-1.5 truncate text-sm font-semibold text-white">{row.title}</p>
                            <p className="line-clamp-2 text-xs text-gray-500">{row.message}</p>
                            <p className="mt-1 text-[11px] text-gray-500">{audienceLabel(row)} · {row.status === "sent" && row.sentAt ? new Date(row.sentAt).toLocaleString() : `Created ${new Date(row.createdAt).toLocaleDateString()}`}</p>
                            {row.status === "sent" && <p className="mt-1 text-[11px] text-gray-400">Delivered to {row.recipientCount ?? row.delivered} · Read by {row.readCount} ({readRate}%)</p>}
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            {row.status === "draft" && (
                              <>
                                <IconButton label="Edit draft" onClick={() => setForm({ id: row.id, type: row.type, title: row.title, message: row.message, link: row.link ?? "", audience: row.audience, targetTripId: row.targetTripId, targetUserId: row.targetUserId, showPopup: row.showPopup, showBanner: row.showBanner, bannerDays: 3 })}><Pencil className="h-3.5 w-3.5" /></IconButton>
                                <IconButton label="Send draft" onClick={() => { if (window.confirm(`Send "${row.title}" now?`)) send.mutate({ id: row.id }); }}><Send className="h-3.5 w-3.5" /></IconButton>
                              </>
                            )}
                            {bannerLive && <IconButton label="Remove banner" onClick={() => endBanner.mutate({ id: row.id })}><X className="h-3.5 w-3.5" /></IconButton>}
                            <IconButton label="Delete" danger onClick={() => { if (window.confirm(row.status === "sent" ? "Delete this notification? It will also be removed from members' inboxes." : "Delete this draft?")) remove.mutate({ id: row.id }); }}><Trash2 className="h-3.5 w-3.5" /></IconButton>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{children}</p>;
}

function Counter({ value, max }: { value: number; max: number }) {
  return <p className={`mt-1 text-right text-[11px] ${value > max * 0.9 ? "text-amber-400" : "text-gray-600"}`}>{value}/{max}</p>;
}

function Toggle({ checked, onChange, label, hint, disabled }: { checked: boolean; onChange?: (value: boolean) => void; label: string; hint: string; disabled?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => onChange?.(!checked)} className={`flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-left ${disabled ? "cursor-not-allowed opacity-60" : "hover:border-white/20"}`}>
      <div><p className="text-sm font-medium text-white">{label}</p><p className="text-[11px] text-gray-500">{hint}</p></div>
      <span className={`relative h-5 w-9 shrink-0 rounded-full transition ${checked ? "bg-lime-500" : "bg-white/15"}`}><span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${checked ? "left-[18px]" : "left-0.5"}`} /></span>
    </button>
  );
}

function IconButton({ children, label, onClick, danger }: { children: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return <button onClick={onClick} aria-label={label} title={label} className={`rounded-lg p-1.5 text-gray-400 transition hover:bg-white/5 ${danger ? "hover:text-red-400" : "hover:text-white"}`}>{children}</button>;
}
