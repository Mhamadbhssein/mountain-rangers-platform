/* ============================================================
 * MyBookings — Booking history with status cards
 * Design: Alpine Glass / Lime-green brand
 * Glass cards with status indicators, QR ticket preview
 * ============================================================ */

import { motion } from "framer-motion";
import {
  CalendarCheck,
  QrCode,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  Ticket,
} from "lucide-react";
import { BOOKINGS, LOGOS } from "@/lib/data";
import { useState } from "react";
import { toast } from "sonner";

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
  const [showTicket, setShowTicket] = useState<string | null>(null);

  const upcoming = BOOKINGS.filter(
    (b) => b.status === "confirmed" || b.status === "pending"
  );
  const past = BOOKINGS.filter(
    (b) => b.status === "completed" || b.status === "cancelled"
  );
  const bookings = activeTab === "Upcoming" ? upcoming : past;

  return (
    <div className="min-h-screen px-5 pt-12 pb-4">
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
      <div className="space-y-4">
        {bookings.map((booking, i) => {
          const status = STATUS_CONFIG[booking.status];
          const StatusIcon = status.icon;

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
                  src={booking.tripImage}
                  alt={booking.tripTitle}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
                  <p className="text-white font-semibold text-sm">
                    {booking.tripTitle}
                  </p>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${status.bg} ${status.color}`}
                  >
                    {status.label}
                  </span>
                </div>
              </div>

              {/* Booking details */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock size={14} />
                    <span className="text-xs">
                      {booking.date} at {booking.time}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    {booking.referenceCode}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs">
                      {booking.passengers} passenger{booking.passengers > 1 ? "s" : ""} · Seats{" "}
                      {booking.seats.join(", ")}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {booking.paymentMethod}
                    </p>
                  </div>
                  <p className="text-lime font-bold">${booking.totalPrice}</p>
                </div>

                {/* Actions */}
                {booking.status === "confirmed" && (
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setShowTicket(showTicket === booking.id ? null : booking.id)}
                      className="flex-1 glass-lime rounded-xl py-2.5 flex items-center justify-center gap-2 text-lime text-xs font-medium"
                    >
                      <QrCode size={14} />
                      {showTicket === booking.id ? "Hide Ticket" : "View Ticket"}
                    </button>
                    <button
                      onClick={() => toast.success("Reminder sent via WhatsApp!")}
                      className="flex-1 glass rounded-xl py-2.5 flex items-center justify-center gap-2 text-muted-foreground text-xs font-medium hover:text-foreground"
                    >
                      <Ticket size={14} />
                      WhatsApp
                    </button>
                  </div>
                )}

                {/* QR Ticket */}
                {showTicket === booking.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="pt-3 border-t border-white/10"
                  >
                    <div className="bg-white rounded-xl p-4 text-center">
                      <img
                        src={LOGOS.iconDark}
                        alt="Mountain Rangers"
                        className="h-16 mx-auto mb-2"
                      />
                      <div className="w-32 h-32 mx-auto bg-black/10 rounded-lg flex items-center justify-center mb-2">
                        <QrCode size={80} className="text-black/80" />
                      </div>
                      <p className="text-black font-mono font-bold text-sm">
                        {booking.referenceCode}
                      </p>
                      <p className="text-black/50 text-xs mt-1">
                        Show this at check-in
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}

        {bookings.length === 0 && (
          <div className="text-center py-16">
            <CalendarCheck
              size={48}
              className="text-muted-foreground/30 mx-auto mb-4"
            />
            <p className="text-muted-foreground">No {activeTab.toLowerCase()} bookings</p>
            <p className="text-muted-foreground/60 text-sm mt-1">
              Your booking history will appear here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
