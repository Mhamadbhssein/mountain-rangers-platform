/* ============================================================
 * Booking — 3-step booking flow
 * Step 1: Passengers + Phone + Hiking Sticks
 * Step 2: Seat Selection (27-seat bus layout)
 * Step 3: Confirm + Payment
 * Design: Alpine Glass / Lime-green brand
 * ============================================================ */

import React, { useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Minus,
  Plus,
  Check,
  X,
  CreditCard,
  Banknote,
  MessageCircle,
  ChevronRight,
  Loader2,
  Phone,
  PersonStanding,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

type PaymentMethod = "cash" | "whish";

/* ============================================================
 * Bus seat layout matching the reference image:
 * Row 0: [Driver (wide)] [G] [G]
 * Row 1: [1] [2] [3]  + DOOR label on right
 * Rows 2-8: [4-7] [8-11] [12-15] [16-19] [20-23] [24-27]
 * Total: 27 passenger seats + 2 guide seats (G)
 * ============================================================ */

export default function Booking() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [passengers, setPassengers] = useState(1);
  const [phone, setPhone] = useState("");
  const [hikingSticks, setHikingSticks] = useState(0);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [payment, setPayment] = useState<PaymentMethod>("cash");
  const [confirmed, setConfirmed] = useState(false);
  const [bookingRef, setBookingRef] = useState("");
  const [whatsappLink, setWhatsappLink] = useState("");

  const tripId = Number(id);
  const { data: trip, isLoading } = trpc.trips.getById.useQuery(
    { id: tripId },
    { enabled: !isNaN(tripId) }
  );

  const { data: bookedSeatsData } = trpc.trips.getBookedSeats.useQuery(
    { tripId },
    { enabled: !isNaN(tripId) }
  );

  const bookedSeats = useMemo(() => bookedSeatsData ?? [], [bookedSeatsData]);

  const createBooking = trpc.bookings.create.useMutation({
    onSuccess: (data) => {
      setBookingRef(data.referenceCode);
      if ("whatsappLink" in data && data.whatsappLink) {
        setWhatsappLink(data.whatsappLink as string);
      }
      setConfirmed(true);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to create booking");
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="text-lime animate-spin" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Trip not found</p>
      </div>
    );
  }

  const toggleSeat = (seatNum: number) => {
    if (bookedSeats.includes(seatNum)) return;
    if (selectedSeats.includes(seatNum)) {
      setSelectedSeats(selectedSeats.filter((s) => s !== seatNum));
    } else if (selectedSeats.length < passengers) {
      setSelectedSeats([...selectedSeats, seatNum]);
    } else {
      toast.info(`You can only select ${passengers} seat(s)`);
    }
  };

  const priceNum = Number(trip.price);
  const hikingSticksTotal = hikingSticks * 1;
  const totalPrice = priceNum * passengers + hikingSticksTotal;

  const handleConfirm = () => {
    if (!phone.trim() || phone.trim().length < 7) {
      toast.error("Please enter a valid phone number");
      setStep(1);
      return;
    }
    createBooking.mutate({
      tripId: trip.id,
      passengers,
      seats: selectedSeats,
      totalPrice,
      paymentMethod: payment,
      phone: phone.trim(),
      hikingSticks,
    });
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  // ── Confirmation success screen ──────────────────────────────
  if (confirmed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5 pb-10">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="w-20 h-20 rounded-full bg-lime flex items-center justify-center mb-6"
        >
          <Check size={40} className="text-black" />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-serif text-foreground text-center"
        >
          Booking Confirmed!
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-muted-foreground text-center mt-2 mb-6"
        >
          Your adventure awaits. Check WhatsApp for confirmation.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass rounded-2xl p-5 w-full max-w-sm space-y-3"
        >
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Reference Code</p>
            <p className="text-xl font-mono font-bold text-lime mt-1">
              {bookingRef}
            </p>
          </div>
          <div className="h-px bg-white/10" />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Trip</span>
            <span className="text-foreground text-right max-w-[60%]">{trip.title}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Date</span>
            <span className="text-foreground">{formatDate(trip.date)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Passengers</span>
            <span className="text-foreground">{passengers}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Seats</span>
            <span className="text-foreground">
              {selectedSeats.sort((a, b) => a - b).join(", ")}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Phone</span>
            <span className="text-foreground">{phone}</span>
          </div>
          {hikingSticks > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Hiking Sticks</span>
              <span className="text-foreground">{hikingSticks} (+${hikingSticksTotal})</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Payment</span>
            <span className="text-foreground">
              {payment === "cash" ? "Cash on Bus" : "Whish Money"}
            </span>
          </div>
          <div className="h-px bg-white/10" />
          <div className="flex justify-between">
            <span className="text-muted-foreground font-medium">Total</span>
            <span className="text-lime font-bold text-lg">
              ${totalPrice.toFixed(2)}
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col gap-3 mt-6 w-full max-w-sm"
        >
          {/* Primary: Confirm via WhatsApp — big green button matching the design */}
          <button
            onClick={() => {
              if (whatsappLink) {
                window.open(whatsappLink, "_blank");
              } else {
                const msg = encodeURIComponent(
                  `🏔️ Booking Confirmed!\nRef: ${bookingRef}\nTrip: ${trip.title}\nDate: ${formatDate(trip.date)}\nSeats: ${selectedSeats.join(", ")}\nTotal: $${totalPrice.toFixed(2)}`
                );
                window.open(`https://wa.me/96176828401?text=${msg}`, "_blank");
              }
            }}
            className="w-full flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#1ebe5d] active:bg-[#17a853] text-white font-bold text-base py-4 rounded-2xl transition-all shadow-lg shadow-green-500/30"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Confirm Reservation via WhatsApp
          </button>

          {/* Secondary: View My Bookings */}
          <Button
            variant="outline"
            className="w-full border-white/20 text-muted-foreground hover:bg-white/5"
            onClick={() => navigate("/bookings")}
          >
            View My Bookings
          </Button>
        </motion.div>
      </div>
    );
  }

  // ── Seat button renderer ─────────────────────────────────────
  const SeatButton = ({ seatNum }: { seatNum: number }) => {
    const isBooked = bookedSeats.includes(seatNum);
    const isSelected = selectedSeats.includes(seatNum);
    return (
      <motion.button
        whileTap={!isBooked ? { scale: 0.88 } : {}}
        onClick={() => toggleSeat(seatNum)}
        disabled={isBooked}
        className={`
          w-14 h-14 rounded-2xl text-sm font-bold transition-all relative flex items-center justify-center
          ${
            isBooked
              ? "bg-white/5 text-white/20 cursor-not-allowed"
              : isSelected
              ? "bg-[#7B6FBE] text-white shadow-lg shadow-purple-500/30"
              : "bg-[#7B6FBE]/30 text-white/70 hover:bg-[#7B6FBE]/50 border border-[#7B6FBE]/40"
          }
        `}
        style={{ borderRadius: "18px" }}
      >
        {seatNum}
        {isBooked && (
          <X size={8} className="absolute top-1 right-1 text-white/20" />
        )}
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-4 h-4 bg-lime rounded-full flex items-center justify-center border border-black/20"
          >
            <Check size={9} className="text-black" />
          </motion.div>
        )}
      </motion.button>
    );
  };

  return (
    <div className="min-h-screen pb-28">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-4">
        <button
          onClick={() => (step > 1 ? setStep(step - 1) : navigate(`/trip/${id}`))}
          className="glass rounded-full p-2.5"
        >
          <ArrowLeft size={20} className="text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-serif text-foreground">Book Trip</h1>
          <p className="text-xs text-muted-foreground">{trip.title}</p>
        </div>
      </div>

      {/* Progress steps */}
      <div className="px-5 mb-6">
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`h-1.5 rounded-full flex-1 transition-all duration-500 ${
                  s <= step ? "bg-lime" : "bg-white/10"
                }`}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          <span className={`text-[10px] ${step >= 1 ? "text-lime" : "text-muted-foreground"}`}>
            Details
          </span>
          <span className={`text-[10px] ${step >= 2 ? "text-lime" : "text-muted-foreground"}`}>
            Seats
          </span>
          <span className={`text-[10px] ${step >= 3 ? "text-lime" : "text-muted-foreground"}`}>
            Confirm
          </span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ── Step 1: Passengers + Phone + Hiking Sticks ── */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="px-5 space-y-5"
          >
            {/* Passengers */}
            <div className="glass rounded-2xl p-5">
              <h2 className="text-lg font-serif text-foreground mb-1">
                How many passengers?
              </h2>
              <p className="text-sm text-muted-foreground mb-5">
                Select the number of people joining this trip
              </p>
              <div className="flex items-center justify-center gap-6">
                <button
                  onClick={() => {
                    const n = Math.max(1, passengers - 1);
                    setPassengers(n);
                    if (hikingSticks > n) setHikingSticks(n);
                  }}
                  className="w-12 h-12 rounded-full glass flex items-center justify-center text-foreground"
                >
                  <Minus size={20} />
                </button>
                <div className="text-center">
                  <span className="text-5xl font-bold text-lime">{passengers}</span>
                  <p className="text-xs text-muted-foreground mt-1">
                    {passengers === 1 ? "person" : "people"}
                  </p>
                </div>
                <button
                  onClick={() => setPassengers(Math.min(trip.availableSeats, passengers + 1))}
                  className="w-12 h-12 rounded-full glass flex items-center justify-center text-foreground"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>

            {/* Phone number — required */}
            <div className="glass rounded-2xl p-5">
              <h3 className="text-base font-medium text-foreground mb-1 flex items-center gap-2">
                <Phone size={16} className="text-lime" />
                Contact Phone Number
                <span className="text-red-400 text-xs ml-1">*required</span>
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                We'll send your booking confirmation via WhatsApp
              </p>
              <Input
                type="tel"
                placeholder="+961 XX XXX XXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground focus:border-lime/50 rounded-xl"
              />
            </div>

            {/* Hiking Sticks add-on */}
            <div className="glass rounded-2xl p-5">
              <h3 className="text-base font-medium text-foreground mb-1 flex items-center gap-2">
                <PersonStanding size={16} className="text-lime" />
                Hiking Sticks
                <span className="text-lime text-xs ml-1">+$1 each</span>
              </h3>
              <p className="text-xs text-muted-foreground mb-5">
                Rent hiking sticks for better trail stability
              </p>
              <div className="flex items-center justify-center gap-6">
                <button
                  onClick={() => setHikingSticks(Math.max(0, hikingSticks - 1))}
                  className="w-12 h-12 rounded-full glass flex items-center justify-center text-foreground"
                >
                  <Minus size={20} />
                </button>
                <div className="text-center">
                  <span className="text-5xl font-bold text-lime">{hikingSticks}</span>
                  <p className="text-xs text-muted-foreground mt-1">
                    {hikingSticks === 0 ? "none" : hikingSticks === 1 ? "stick" : "sticks"}
                  </p>
                </div>
                <button
                  onClick={() => setHikingSticks(Math.min(passengers, hikingSticks + 1))}
                  className="w-12 h-12 rounded-full glass flex items-center justify-center text-foreground"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>

            {/* Price summary */}
            <div className="glass rounded-2xl p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">
                  ${priceNum} × {passengers} {passengers === 1 ? "person" : "people"}
                </span>
                <span className="text-foreground font-medium">${priceNum * passengers}</span>
              </div>
              {hikingSticks > 0 && (
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">
                    $1 × {hikingSticks} hiking {hikingSticks === 1 ? "stick" : "sticks"}
                  </span>
                  <span className="text-foreground font-medium">${hikingSticksTotal}</span>
                </div>
              )}
              <div className="h-px bg-white/10 my-2" />
              <div className="flex justify-between">
                <span className="text-foreground font-medium">Total</span>
                <span className="text-lime font-bold text-lg">${totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Step 2: Seat Selection ── */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="px-5 space-y-5"
          >
            <div>
              <h2 className="text-lg font-serif text-foreground mb-1">
                Choose Your Seats
              </h2>
              <p className="text-sm text-muted-foreground">
                Select {passengers} seat{passengers > 1 ? "s" : ""} ({selectedSeats.length}/{passengers} selected)
              </p>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 justify-center">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-lg bg-[#7B6FBE]/30 border border-[#7B6FBE]/40" />
                <span className="text-[10px] text-muted-foreground">Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-lg bg-[#7B6FBE]" />
                <span className="text-[10px] text-muted-foreground">Selected</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-lg bg-white/5" />
                <span className="text-[10px] text-muted-foreground">Taken</span>
              </div>
            </div>

            {/* Bus layout — matching reference image */}
            <div className="glass rounded-2xl p-5">
              {/* Row 0: Driver + 2 Guide seats */}
              <div className="flex items-center justify-center gap-3 mb-4 pb-4 border-b border-white/10">
                {/* Driver — wide button */}
                <div
                  className="h-14 flex items-center justify-center bg-[#7B6FBE]/40 text-white/70 font-bold text-sm"
                  style={{ borderRadius: "18px", width: "120px" }}
                >
                  Driver
                </div>
                {/* 2 Guide seats */}
                <div
                  className="w-14 h-14 flex items-center justify-center bg-[#7B6FBE]/40 text-white/70 font-bold text-sm"
                  style={{ borderRadius: "18px" }}
                >
                  G
                </div>
                <div
                  className="w-14 h-14 flex items-center justify-center bg-[#7B6FBE]/40 text-white/70 font-bold text-sm"
                  style={{ borderRadius: "18px" }}
                >
                  G
                </div>
              </div>

              {/* Row 1: Seats 1-3 + DOOR label */}
              <div className="flex items-center justify-center gap-3 mb-3">
                <SeatButton seatNum={1} />
                <SeatButton seatNum={2} />
                <SeatButton seatNum={3} />
                {/* Door indicator */}
                <div className="flex items-center justify-center w-8">
                  <span
                    className="text-[9px] font-bold text-white/40 tracking-widest"
                    style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
                  >
                    DOOR
                  </span>
                </div>
              </div>

              {/* Rows 2-8: 4 seats per row (4-7, 8-11, 12-15, 16-19, 20-23, 24-27) */}
              {[
                [4, 5, 6, 7],
                [8, 9, 10, 11],
                [12, 13, 14, 15],
                [16, 17, 18, 19],
                [20, 21, 22, 23],
                [24, 25, 26, 27],
              ].map((rowSeats) => (
                <div key={rowSeats[0]} className="flex items-center justify-center gap-3 mb-3">
                  {rowSeats.map((seatNum) => (
                    <SeatButton key={seatNum} seatNum={seatNum} />
                  ))}
                </div>
              ))}
            </div>

            {/* Selected seats summary */}
            {selectedSeats.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-xl p-3 flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-lime/20 flex items-center justify-center">
                  <Check size={14} className="text-lime" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Selected seats</p>
                  <p className="text-sm font-medium text-foreground">
                    {selectedSeats.sort((a, b) => a - b).join(", ")}
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ── Step 3: Confirmation ── */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="px-5 space-y-5"
          >
            <h2 className="text-lg font-serif text-foreground">
              Confirm Your Booking
            </h2>

            {/* Trip summary */}
            <div className="glass rounded-2xl overflow-hidden">
              <div className="h-24 relative">
                <img
                  src={trip.imageUrl ?? ""}
                  alt={trip.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-3 left-4">
                  <p className="text-white font-semibold text-sm">{trip.title}</p>
                  <p className="text-white/60 text-xs">{formatDate(trip.date)} at {trip.time}</p>
                </div>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Passengers</span>
                  <span className="text-foreground">{passengers}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Seats</span>
                  <span className="text-foreground">
                    {selectedSeats.sort((a, b) => a - b).join(", ")}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="text-foreground">{phone}</span>
                </div>
                {hikingSticks > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Hiking Sticks</span>
                    <span className="text-lime">{hikingSticks} (+${hikingSticksTotal})</span>
                  </div>
                )}
                {trip.meetingPoint && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Meeting Point</span>
                    <span className="text-foreground text-right text-xs max-w-[55%]">
                      {trip.meetingPoint}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Payment method */}
            <div>
              <h3 className="text-sm font-medium text-foreground mb-3">Payment Method</h3>
              <div className="space-y-2">
                {(["cash", "whish"] as PaymentMethod[]).map((method) => (
                  <button
                    key={method}
                    onClick={() => setPayment(method)}
                    className={`w-full glass rounded-xl p-4 flex items-center gap-3 transition-all ${
                      payment === method ? "border-lime/40 bg-lime/5" : ""
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        payment === method ? "bg-lime/20" : "bg-white/5"
                      }`}
                    >
                      {method === "cash" ? (
                        <Banknote size={20} className={payment === method ? "text-lime" : "text-muted-foreground"} />
                      ) : (
                        <CreditCard size={20} className={payment === method ? "text-lime" : "text-muted-foreground"} />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-foreground">
                        {method === "cash" ? "Cash on Bus" : "Whish Money"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {method === "cash" ? "Pay when you board" : "Pay online instantly"}
                      </p>
                    </div>
                    {payment === method && (
                      <div className="w-5 h-5 rounded-full bg-lime flex items-center justify-center">
                        <Check size={12} className="text-black" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="glass rounded-2xl p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">
                  ${priceNum} × {passengers} {passengers === 1 ? "person" : "people"}
                </span>
                <span className="text-foreground">${priceNum * passengers}</span>
              </div>
              {hikingSticks > 0 && (
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">
                    Hiking sticks × {hikingSticks}
                  </span>
                  <span className="text-foreground">${hikingSticksTotal}</span>
                </div>
              )}
              <div className="h-px bg-white/10 my-2" />
              <div className="flex justify-between">
                <span className="text-foreground font-medium">Total</span>
                <span className="text-lime font-bold text-xl">${totalPrice.toFixed(2)}</span>
              </div>
            </div>

            {/* ── Conditional payment instructions ── */}
            {payment === "cash" && (
              <motion.div
                key="cash-reminder"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl overflow-hidden border border-yellow-400/25"
              >
                {/* Header */}
                <div className="flex items-center gap-2.5 bg-yellow-400/15 px-4 py-3">
                  <Banknote size={18} className="text-yellow-400 shrink-0" />
                  <p className="text-sm font-semibold text-yellow-300">Cash Payment Reminder</p>
                </div>
                {/* Body */}
                <div className="bg-yellow-400/5 px-4 py-3 space-y-2">
                  {[
                    "Bring the exact amount in cash on the day of the trip.",
                    "Payment is collected by the guide when you board the bus.",
                    "No change is guaranteed — please prepare the exact fare.",
                    "Your seat is reserved; payment confirms your spot.",
                  ].map((note, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="mt-0.5 w-4 h-4 rounded-full bg-yellow-400/20 flex items-center justify-center shrink-0">
                        <span className="text-[9px] font-bold text-yellow-400">{idx + 1}</span>
                      </span>
                      <p className="text-xs text-yellow-200/80 leading-relaxed">{note}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {payment === "whish" && (
              <motion.div
                key="whish-guide"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl overflow-hidden border border-[#8B5CF6]/30"
              >
                {/* Header */}
                <div className="flex items-center gap-2.5 bg-[#8B5CF6]/15 px-4 py-3">
                  <CreditCard size={18} className="text-[#A78BFA] shrink-0" />
                  <p className="text-sm font-semibold text-[#C4B5FD]">How to Pay via Whish Money</p>
                </div>
                {/* Body */}
                <div className="bg-[#8B5CF6]/5 px-4 py-3 space-y-3">
                  {/* Steps */}
                  {[
                    { step: "1", text: "Open the Whish Money app on your phone." },
                    { step: "2", text: "Tap \"Send Money\" and choose Whish to Whish." },
                    { step: "3", text: "Enter Mountain Rangers' number:" },
                    { step: "4", text: `In the Notes / Reference field write: your name + booking reference (e.g. \"John Doe ${bookingRef || "MR-XXXXXX"}\").` },
                    { step: "5", text: `Enter the amount: $${totalPrice.toFixed(2)} and confirm the transfer.` },
                  ].map(({ step, text }) => (
                    <div key={step} className="flex items-start gap-2.5">
                      <span className="mt-0.5 w-5 h-5 rounded-full bg-[#8B5CF6]/30 flex items-center justify-center shrink-0">
                        <span className="text-[9px] font-bold text-[#C4B5FD]">{step}</span>
                      </span>
                      <p className="text-xs text-[#DDD6FE]/80 leading-relaxed">{text}</p>
                    </div>
                  ))}

                  {/* Phone number highlight */}
                  <div className="flex items-center justify-between bg-[#8B5CF6]/20 rounded-xl px-3 py-2.5 mt-1">
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-[#A78BFA]" />
                      <span className="text-xs text-[#C4B5FD] font-medium">Mountain Rangers</span>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText("+96176828401");
                        toast.success("Number copied!");
                      }}
                      className="text-sm font-bold text-white tracking-wide"
                    >
                      +961 76 828 401
                    </button>
                  </div>

                  {/* Notes reminder */}
                  <div className="flex items-start gap-2 bg-white/5 rounded-xl px-3 py-2.5">
                    <MessageCircle size={13} className="text-[#A78BFA] mt-0.5 shrink-0" />
                    <p className="text-xs text-[#DDD6FE]/70 leading-relaxed">
                      <strong className="text-[#C4B5FD]">Important:</strong> Always include your <strong className="text-white">full name</strong> and <strong className="text-white">booking reference</strong> in the Whish notes so we can match your payment.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* WhatsApp notice */}
            <div className="flex items-start gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
              <MessageCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-green-300">
                A booking confirmation will be sent to our team via WhatsApp. You'll be contacted at <strong>{phone}</strong>.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom action button */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-background via-background/90 to-transparent">
        <div className="max-w-lg mx-auto">
          <Button
            className="w-full bg-lime hover:bg-lime-light text-black font-semibold py-6 rounded-xl text-base"
            disabled={createBooking.isPending}
            onClick={() => {
              if (step === 1) {
                if (!phone.trim() || phone.trim().length < 7) {
                  toast.error("Please enter a valid phone number to continue");
                  return;
                }
                setStep(2);
              } else if (step === 2) {
                if (selectedSeats.length < passengers) {
                  toast.error(`Please select ${passengers} seat(s) to continue`);
                  return;
                }
                setStep(3);
              } else {
                handleConfirm();
              }
            }}
          >
            {createBooking.isPending ? (
              <Loader2 size={20} className="animate-spin" />
            ) : step === 3 ? (
              <>Confirm Booking — ${totalPrice.toFixed(2)}</>
            ) : (
              <>
                Continue <ChevronRight size={18} className="ml-1" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
