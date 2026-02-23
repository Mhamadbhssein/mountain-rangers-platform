/* ============================================================
 * Booking — 3-step booking flow
 * Step 1: Passengers | Step 2: Seat Selection | Step 3: Confirm
 * Design: Alpine Glass / Lime-green brand
 * Interactive 24-seat bus layout with visual feedback
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

type PaymentMethod = "cash" | "whish";

export default function Booking() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [passengers, setPassengers] = useState(1);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [payment, setPayment] = useState<PaymentMethod>("cash");
  const [confirmed, setConfirmed] = useState(false);
  const [bookingRef, setBookingRef] = useState("");

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

  const handleConfirm = () => {
    createBooking.mutate({
      tripId: trip.id,
      passengers,
      seats: selectedSeats,
      totalPrice: priceNum * passengers,
      paymentMethod: payment,
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

  // Confirmation success screen
  if (confirmed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5">
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
          Your adventure awaits
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
            <span className="text-foreground">{trip.title}</span>
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
            <span className="text-muted-foreground">Payment</span>
            <span className="text-foreground">
              {payment === "cash" ? "Cash on Bus" : "Whish Money"}
            </span>
          </div>
          <div className="h-px bg-white/10" />
          <div className="flex justify-between">
            <span className="text-muted-foreground font-medium">Total</span>
            <span className="text-lime font-bold text-lg">
              ${priceNum * passengers}
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex gap-3 mt-6 w-full max-w-sm"
        >
          <Button
            variant="outline"
            className="flex-1 border-lime/30 text-lime hover:bg-lime/10"
            onClick={() => {
              toast.success("Confirmation sent via WhatsApp!");
            }}
          >
            <MessageCircle size={16} className="mr-2" />
            WhatsApp
          </Button>
          <Button
            className="flex-1 bg-lime hover:bg-lime-light text-black font-semibold"
            onClick={() => navigate("/bookings")}
          >
            My Bookings
          </Button>
        </motion.div>
      </div>
    );
  }

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
            Passengers
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
        {/* Step 1: Passengers */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="px-5 space-y-6"
          >
            <div className="glass rounded-2xl p-5">
              <h2 className="text-lg font-serif text-foreground mb-1">
                How many passengers?
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Select the number of people joining this trip
              </p>

              <div className="flex items-center justify-center gap-6">
                <button
                  onClick={() => setPassengers(Math.max(1, passengers - 1))}
                  className="w-12 h-12 rounded-full glass flex items-center justify-center text-foreground"
                >
                  <Minus size={20} />
                </button>
                <div className="text-center">
                  <span className="text-5xl font-bold text-lime">
                    {passengers}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    {passengers === 1 ? "person" : "people"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    const maxSeats = trip.availableSeats;
                    setPassengers(Math.min(maxSeats, passengers + 1));
                  }}
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
                  ${priceNum} x {passengers} {passengers === 1 ? "person" : "people"}
                </span>
                <span className="text-foreground font-medium">
                  ${priceNum * passengers}
                </span>
              </div>
              <div className="h-px bg-white/10 my-2" />
              <div className="flex justify-between">
                <span className="text-foreground font-medium">Total</span>
                <span className="text-lime font-bold text-lg">
                  ${priceNum * passengers}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Seat Selection */}
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
                Select {passengers} seat{passengers > 1 ? "s" : ""} on the bus ({selectedSeats.length}/{passengers} selected)
              </p>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 justify-center">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-white/8 border border-white/10" />
                <span className="text-[10px] text-muted-foreground">Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-lime" />
                <span className="text-[10px] text-muted-foreground">Selected</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-white/5" />
                <span className="text-[10px] text-muted-foreground">Taken</span>
              </div>
            </div>

            {/* Bus layout */}
            <div className="glass rounded-2xl p-5">
              {/* Driver area */}
              <div className="flex items-center justify-center mb-4 pb-3 border-b border-white/10">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                  <span className="text-[10px] text-muted-foreground">Driver</span>
                </div>
              </div>

              {/* Seat grid: 6 rows, 2 seats | aisle | 2 seats */}
              <div className="space-y-2">
                {Array.from({ length: 6 }, (_, row) => {
                  const rowSeats = [
                    row * 4 + 1,
                    row * 4 + 2,
                    row * 4 + 3,
                    row * 4 + 4,
                  ];
                  return (
                    <div key={row} className="flex items-center justify-center gap-2">
                      {rowSeats.map((seatNum, colIdx) => {
                        const isBooked = bookedSeats.includes(seatNum);
                        const isSelected = selectedSeats.includes(seatNum);
                        return (
                          <React.Fragment key={seatNum}>
                            {colIdx === 2 && (
                              <div key={`aisle-${row}`} className="w-8" />
                            )}
                            <motion.button
                              whileTap={!isBooked ? { scale: 0.9 } : {}}
                              onClick={() => toggleSeat(seatNum)}
                              disabled={isBooked}
                              className={`
                                w-12 h-12 rounded-lg text-xs font-semibold transition-all relative
                                ${
                                  isBooked
                                    ? "bg-white/5 text-white/20 cursor-not-allowed"
                                    : isSelected
                                    ? "bg-lime text-black shadow-lg shadow-lime/20"
                                    : "bg-white/8 text-white/60 hover:bg-white/12 border border-white/10"
                                }
                              `}
                            >
                              {seatNum}
                              {isBooked && (
                                <X size={8} className="absolute top-0.5 right-0.5 text-white/20" />
                              )}
                              {isSelected && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-lime rounded-full flex items-center justify-center border border-black/20"
                                >
                                  <Check size={8} className="text-black" />
                                </motion.div>
                              )}
                            </motion.button>
                          </React.Fragment>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Confirmation */}
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
                  <span className="text-muted-foreground">Meeting Point</span>
                  <span className="text-foreground text-right text-xs">
                    {trip.meetingPoint}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment method */}
            <div>
              <h3 className="text-sm font-medium text-foreground mb-3">
                Payment Method
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => setPayment("cash")}
                  className={`w-full glass rounded-xl p-4 flex items-center gap-3 transition-all ${
                    payment === "cash" ? "border-lime/40 bg-lime/5" : ""
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    payment === "cash" ? "bg-lime/20" : "bg-white/5"
                  }`}>
                    <Banknote size={20} className={payment === "cash" ? "text-lime" : "text-muted-foreground"} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-foreground">Cash on Bus</p>
                    <p className="text-xs text-muted-foreground">Pay when you board</p>
                  </div>
                  {payment === "cash" && (
                    <div className="w-5 h-5 rounded-full bg-lime flex items-center justify-center">
                      <Check size={12} className="text-black" />
                    </div>
                  )}
                </button>

                <button
                  onClick={() => setPayment("whish")}
                  className={`w-full glass rounded-xl p-4 flex items-center gap-3 transition-all ${
                    payment === "whish" ? "border-lime/40 bg-lime/5" : ""
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    payment === "whish" ? "bg-lime/20" : "bg-white/5"
                  }`}>
                    <CreditCard size={20} className={payment === "whish" ? "text-lime" : "text-muted-foreground"} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-foreground">Whish Money</p>
                    <p className="text-xs text-muted-foreground">Pay online instantly</p>
                  </div>
                  {payment === "whish" && (
                    <div className="w-5 h-5 rounded-full bg-lime flex items-center justify-center">
                      <Check size={12} className="text-black" />
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Total */}
            <div className="glass rounded-2xl p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">
                  ${priceNum} x {passengers}
                </span>
                <span className="text-foreground">${priceNum * passengers}</span>
              </div>
              <div className="h-px bg-white/10 my-2" />
              <div className="flex justify-between">
                <span className="text-foreground font-medium">Total</span>
                <span className="text-lime font-bold text-xl">
                  ${priceNum * passengers}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom action button */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
        <div className="max-w-lg mx-auto">
          <Button
            className="w-full bg-lime hover:bg-lime-light text-black font-semibold py-6 rounded-xl text-base"
            disabled={createBooking.isPending}
            onClick={() => {
              if (step === 1) {
                setStep(2);
              } else if (step === 2) {
                if (selectedSeats.length < passengers) {
                  toast.error(`Please select ${passengers} seat(s)`);
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
              <>Confirm Booking — ${priceNum * passengers}</>
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
