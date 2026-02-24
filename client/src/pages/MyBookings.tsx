/* ============================================================
 * MyBookings — Booking history with status cards
 * Design: Alpine Glass / Lime-green brand
 * Glass cards with status indicators, QR ticket preview,
 * expandable details, and 24-hour cancel policy
 * ============================================================ */

import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarCheck,
  QrCode,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ChevronDown,
  MapPin,
  Users,
  CreditCard,
  Phone,
  PersonStanding,
  Ban,
  MessageCircle,
} from "lucide-react";
import { LOGOS } from "@/lib/data";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: any; label: string }> = {
  confirmed: {
    color: "text-lime",
    bg: "bg-lime/10",
    icon: CheckCircle2,
    label: "Confirmed",
  },
  pending: {
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
    icon: AlertCircle,
    label: "Pending",
  },
  completed: {
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    icon: CheckCircle2,
    label: "Completed",
  },
  cancelled: {
    color: "text-red-400",
    bg: "bg-red-400/10",
    icon: XCircle,
    label: "Cancelled",
  },
};

const TABS = ["Upcoming", "Past"];

export default function MyBookings() {
  const [activeTab, setActiveTab] = useState("Upcoming");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showTicketId, setShowTicketId] = useState<number | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const { isAuthenticated, loading: authLoading } = useAuth();

  const utils = trpc.useUtils();

  const { data: myBookings, isLoading } = trpc.bookings.myBookings.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const cancelMutation = trpc.bookings.cancel.useMutation({
    onSuccess: () => {
      toast.success("Booking cancelled successfully");
      setCancellingId(null);
      utils.bookings.myBookings.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to cancel booking");
      setCancellingId(null);
    },
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
        <CalendarCheck size={48} className="text-muted-foreground/30 mb-4" />
        <p className="text-foreground font-serif text-xl mb-2">Sign in to view bookings</p>
        <p className="text-muted-foreground text-sm mb-6 text-center">
          Log in to see your upcoming trips and booking history
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

  const allBookings = myBookings ?? [];
  const upcoming = allBookings.filter(
    (b) => b.booking.status === "confirmed" || b.booking.status === "pending"
  );
  const past = allBookings.filter(
    (b) => b.booking.status === "completed" || b.booking.status === "cancelled"
  );
  const displayBookings = activeTab === "Upcoming" ? upcoming : past;

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatShortDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  /** Returns true if the trip is more than 24 hours away (cancellation allowed) */
  const canCancel = (tripDate: Date | string) => {
    const tripTime = new Date(tripDate).getTime();
    const now = Date.now();
    const hoursUntilTrip = (tripTime - now) / (1000 * 60 * 60);
    return hoursUntilTrip > 24;
  };

  const handleCancel = (bookingId: number, tripDate: Date | string) => {
    if (!canCancel(tripDate)) {
      toast.error("Cancellations are not allowed within 24 hours of the trip departure.");
      return;
    }
    setCancellingId(bookingId);
    cancelMutation.mutate({ bookingId });
  };

  return (
    <div className="min-h-screen px-5 pt-12 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif text-foreground">My Bookings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {upcoming.length} upcoming trip{upcoming.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="w-10 h-10 rounded-full glass flex items-center justify-center">
          <CalendarCheck size={20} className="text-lime" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 glass rounded-xl mb-6">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab
                ? "bg-lime text-black"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Booking cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={32} className="text-lime animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {displayBookings.map((row, i) => {
            const { booking, trip } = row;
            const status = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.confirmed;
            const StatusIcon = status.icon;
            const seats: number[] = Array.isArray(booking.seats) ? booking.seats : [];
            const isExpanded = expandedId === booking.id;
            const isShowingTicket = showTicketId === booking.id;
            const cancellable = canCancel(trip.date);
            const isCancelling = cancellingId === booking.id;

            return (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.08 }}
                className="glass rounded-2xl overflow-hidden"
              >
                {/* Trip image header */}
                <div className="h-20 relative">
                  <img
                    src={trip.imageUrl ?? ""}
                    alt={trip.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
                    <p className="text-white font-semibold text-sm">{trip.title}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${status.bg} ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                </div>

                {/* Summary row */}
                <div className="px-4 pt-3 pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock size={13} />
                      <span className="text-xs">{formatShortDate(trip.date)}</span>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">{booking.referenceCode}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <p className="text-xs text-muted-foreground">
                      {booking.passengers} passenger{booking.passengers > 1 ? "s" : ""} · Seats {seats.join(", ")}
                    </p>
                    <p className="text-lime font-bold text-sm">${booking.totalPrice}</p>
                  </div>
                </div>

                {/* Action buttons */}
                {(booking.status === "confirmed" || booking.status === "pending") && (
                  <div className="px-4 pb-3 flex gap-2">
                    {/* Expand/collapse details */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : booking.id)}
                      className="flex-1 glass rounded-xl py-2.5 flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <span>Booking Details</span>
                      <ChevronDown
                        size={13}
                        className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      />
                    </button>

                    {/* QR Ticket */}
                    <button
                      onClick={() => setShowTicketId(isShowingTicket ? null : booking.id)}
                      className="flex-1 glass-lime rounded-xl py-2.5 flex items-center justify-center gap-1.5 text-lime text-xs font-medium"
                    >
                      <QrCode size={13} />
                      {isShowingTicket ? "Hide QR" : "QR Ticket"}
                    </button>
                  </div>
                )}

                {/* Expandable Booking Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="mx-4 mb-4 glass rounded-xl p-4 space-y-3 border border-white/10">
                        <h3 className="text-sm font-semibold text-foreground mb-2">Booking Details</h3>

                        {/* Detail rows */}
                        {[
                          { icon: CalendarCheck, label: "Trip Date", value: formatDate(trip.date) },
                          { icon: Clock, label: "Departure", value: trip.time },
                          { icon: MapPin, label: "Meeting Point", value: trip.meetingPoint ?? "TBA" },
                          { icon: Users, label: "Passengers", value: `${booking.passengers} person${booking.passengers > 1 ? "s" : ""}` },
                          { icon: PersonStanding, label: "Seats", value: seats.length > 0 ? seats.join(", ") : "Not assigned" },
                          { icon: CreditCard, label: "Payment", value: booking.paymentMethod === "cash" ? "Cash on Bus" : "Whish Money" },
                          ...(booking.phone ? [{ icon: Phone, label: "Phone", value: booking.phone }] : []),
                          ...(booking.hikingSticks && booking.hikingSticks > 0 ? [{ icon: PersonStanding, label: "Hiking Sticks", value: `${booking.hikingSticks} (+$${booking.hikingSticks})` }] : []),
                        ].map((item) => (
                          <div key={item.label} className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <item.icon size={13} className="text-lime" />
                              <span className="text-xs">{item.label}</span>
                            </div>
                            <span className="text-xs text-foreground font-medium text-right max-w-[55%]">{item.value}</span>
                          </div>
                        ))}

                        <div className="h-px bg-white/10" />
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-foreground">Total Paid</span>
                          <span className="text-lime font-bold">${booking.totalPrice}</span>
                        </div>

                        {/* WhatsApp reminder */}
                        <button
                          onClick={() => {
                            const msg = encodeURIComponent(
                              `🏔️ Mountain Rangers Booking\nRef: ${booking.referenceCode}\nTrip: ${trip.title}\nDate: ${formatDate(trip.date)}\nSeats: ${seats.join(", ")}\nTotal: $${booking.totalPrice}`
                            );
                            window.open(`https://wa.me/96176828401?text=${msg}`, "_blank");
                          }}
                          className="w-full flex items-center justify-center gap-2 bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] rounded-xl py-2.5 text-xs font-medium transition-colors"
                        >
                          <MessageCircle size={13} />
                          Send Details via WhatsApp
                        </button>

                        {/* Cancel button */}
                        {booking.status === "confirmed" && (
                          <div>
                            {cancellable ? (
                              <button
                                onClick={() => handleCancel(booking.id, trip.date)}
                                disabled={isCancelling}
                                className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl py-2.5 text-xs font-medium transition-colors disabled:opacity-50"
                              >
                                {isCancelling ? (
                                  <Loader2 size={13} className="animate-spin" />
                                ) : (
                                  <Ban size={13} />
                                )}
                                {isCancelling ? "Cancelling..." : "Cancel Booking"}
                              </button>
                            ) : (
                              <div className="flex items-center gap-2 bg-orange-500/10 rounded-xl px-3 py-2.5">
                                <AlertCircle size={13} className="text-orange-400 shrink-0" />
                                <p className="text-xs text-orange-400">
                                  Cancellation not available within 24 hours of departure.
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* QR Ticket */}
                <AnimatePresence>
                  {isShowingTicket && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="mx-4 mb-4 bg-white rounded-xl p-4 text-center">
                        <img
                          src={LOGOS.iconDark}
                          alt="Mountain Rangers"
                          className="h-16 mx-auto mb-2"
                        />
                        <div className="w-32 h-32 mx-auto bg-black/10 rounded-lg flex items-center justify-center mb-2">
                          <QrCode size={80} className="text-black/80" />
                        </div>
                        <p className="text-black font-mono font-bold text-sm">{booking.referenceCode}</p>
                        <p className="text-black/50 text-xs mt-1">Show this at check-in</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}

          {displayBookings.length === 0 && (
            <div className="text-center py-16">
              <CalendarCheck size={48} className="text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No {activeTab.toLowerCase()} bookings</p>
              <p className="text-muted-foreground/60 text-sm mt-1">
                Your booking history will appear here
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
