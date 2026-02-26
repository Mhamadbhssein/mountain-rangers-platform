/* ============================================================
 * Booking — 3-step booking flow
 * Step 1: Passengers + Phone + Hiking Sticks
 * Step 2: Seat Selection (27-seat bus layout)
 * Step 3: Confirm + Payment
 * Design: Alpine Glass / Lime-green brand
 * ============================================================ */

import React, { useState, useMemo, useEffect } from "react";
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
import { useAuth } from "@/_core/hooks/useAuth";

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
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [passengers, setPassengers] = useState(1);
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+961"); // Lebanon by default
  // Per-passenger details: index 0 = lead booker
  const [passengerDetails, setPassengerDetails] = useState<{ name: string; phone: string }[]>([{ name: "", phone: "" }]);
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

  useEffect(() => {
    if (user && user.name && user.phone) {
      setPassengerDetails((prev) => [
        { name: user.name || "", phone: user.phone || "" },
        ...prev.slice(1),
      ]);
      setPhone(user.phone || "");
    }
  }, [user]);

  const createBooking = trpc.bookings.create.useMutation({
    onSuccess: (data) => {
      setBookingRef(data.referenceCode);
      if ("whatsappLink" in data && data.whatsappLink) {
        setWhatsappLink(data.whatsappLink);
      }
      setConfirmed(true);
      setStep(3);
    },
    onError: (error) => {
      toast.error(error.message || "Booking failed. Please try again.");
    },
  });

  if (isLoading || !trip) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-lime" size={32} />
      </div>
    );
  }

  const priceNum = Number(trip.price);
  const hikingSticksTotal = hikingSticks * 1;
  const totalPrice = priceNum * passengers + hikingSticksTotal;

  const toggleSeat = (seatNum: number) => {
    setSelectedSeats((prev) =>
      prev.includes(seatNum) ? prev.filter((s) => s !== seatNum) : [...prev, seatNum]
    );
  };

  const isStep1Valid = () => {
    if (!phone.trim()) return false;
    if (passengers > 1) {
      return passengerDetails.every((p) => p.name.trim() && p.phone.trim());
    }
    return true;
  };

  const isStep2Valid = () => selectedSeats.length === passengers;

  const handleSubmitBooking = async () => {
    if (!isStep2Valid()) {
      toast.error("Please select all required seats");
      return;
    }

    try {
      await createBooking.mutateAsync({
        tripId,
        passengers,
        seats: selectedSeats.sort((a, b) => a - b),
        totalPrice,
        paymentMethod: payment === "cash" ? "Cash on Bus" : "Whish Money",
        phone,
        hikingSticks,
        passengerDetails: passengers > 1 ? passengerDetails : undefined,
      });
    } catch (error) {
      console.error("Booking error:", error);
    }
  };

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
                    setPassengerDetails((prev) => prev.slice(0, n));
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
                  onClick={() => {
                    const n = Math.min(trip.availableSeats, passengers + 1);
                    setPassengers(n);
                    setPassengerDetails((prev) => [
                      ...prev,
                      ...Array(n - prev.length)
                        .fill(null)
                        .map(() => ({ name: "", phone: "" })),
                    ]);
                  }}
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
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-24 bg-white/5 border border-white/10 text-foreground focus:border-lime/50 rounded-xl px-3 py-2 text-sm"
                >
                  <option value="+961">LB +961</option>
                  <option value="+1">US +1</option>
                  <option value="+44">UK +44</option>
                  <option value="+33">FR +33</option>
                  <option value="+49">DE +49</option>
                  <option value="+39">IT +39</option>
                  <option value="+34">ES +34</option>
                  <option value="+31">NL +31</option>
                  <option value="+41">CH +41</option>
                  <option value="+43">AT +43</option>
                  <option value="+45">DK +45</option>
                  <option value="+46">SE +46</option>
                  <option value="+47">NO +47</option>
                  <option value="+358">FI +358</option>
                  <option value="+30">GR +30</option>
                  <option value="+90">TR +90</option>
                  <option value="+20">EG +20</option>
                  <option value="+212">MA +212</option>
                  <option value="+216">TN +216</option>
                </select>
                <Input
                  type="tel"
                  placeholder="XX XXX XXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="flex-1 bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground focus:border-lime/50 rounded-xl"
                />
              </div>
            </div>

            {/* Passenger Details — shown only if more than 1 passenger */}
            {passengers > 1 && (
              <div className="glass rounded-2xl p-5">
                <h3 className="text-base font-medium text-foreground mb-4 flex items-center gap-2">
                  <PersonStanding size={16} className="text-lime" />
                  Passenger Details
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Passenger 1 is you. Please add details for additional passengers.
                </p>
                <div className="space-y-3">
                  {passengerDetails.map((detail, idx) => (
                    <div key={idx} className="space-y-2">
                      <label className="text-xs font-medium text-foreground">
                        Passenger {idx + 1}
                        {idx === 0 && <span className="text-lime text-xs ml-1">(You)</span>}
                      </label>
                      {idx === 0 ? (
                        <>
                          <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-foreground">
                            {detail.name}
                          </div>
                          <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-foreground">
                            {detail.phone}
                          </div>
                        </>
                      ) : (
                        <>
                          <Input
                            type="text"
                            placeholder="Full Name"
                            value={detail.name}
                            onChange={(e) => {
                              const updated = [...passengerDetails];
                              updated[idx].name = e.target.value;
                              setPassengerDetails(updated);
                            }}
                            className="bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground focus:border-lime/50 rounded-xl text-sm"
                          />
                          <div className="flex gap-2">
                            <select
                              value={countryCode}
                              onChange={(e) => setCountryCode(e.target.value)}
                              className="w-20 bg-white/5 border border-white/10 text-foreground focus:border-lime/50 rounded-xl px-2 py-2 text-xs"
                            >
                              <option value="+961">LB</option>
                              <option value="+1">US</option>
                              <option value="+44">UK</option>
                              <option value="+33">FR</option>
                              <option value="+49">DE</option>
                              <option value="+39">IT</option>
                              <option value="+34">ES</option>
                              <option value="+31">NL</option>
                              <option value="+41">CH</option>
                              <option value="+43">AT</option>
                              <option value="+45">DK</option>
                              <option value="+46">SE</option>
                              <option value="+47">NO</option>
                              <option value="+358">FI</option>
                              <option value="+30">GR</option>
                              <option value="+90">TR</option>
                              <option value="+20">EG</option>
                              <option value="+212">MA</option>
                              <option value="+216">TN</option>
                            </select>
                            <Input
                              type="tel"
                              placeholder="XX XXX XXX"
                              value={detail.phone}
                              onChange={(e) => {
                                const updated = [...passengerDetails];
                                updated[idx].phone = e.target.value;
                                setPassengerDetails(updated);
                              }}
                              className="flex-1 bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground focus:border-lime/50 rounded-xl text-sm"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

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

            {/* Next button */}
            <Button
              onClick={() => {
                if (!isStep1Valid()) {
                  toast.error("Please fill in all required fields");
                  return;
                }
                setStep(2);
              }}
              className="w-full bg-lime hover:bg-lime-light text-black font-semibold py-3 rounded-xl"
            >
              Continue to Seats <ChevronRight size={18} className="ml-2" />
            </Button>
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
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-[#7B6FBE]/30 border border-[#7B6FBE]/40" />
                <span className="text-xs text-muted-foreground">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-[#7B6FBE] shadow-lg shadow-purple-500/30" />
                <span className="text-xs text-muted-foreground">Selected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-white/5" />
                <span className="text-xs text-muted-foreground">Booked</span>
              </div>
            </div>

            {/* Bus layout */}
            <div className="glass rounded-2xl p-5 space-y-4">
              {/* Driver + Guide seats */}
              <div className="flex items-center justify-center gap-3">
                <div className="w-16 h-12 rounded-lg bg-white/10 flex items-center justify-center text-xs text-muted-foreground">
                  Driver
                </div>
                <div className="flex gap-2">
                  <div className="w-10 h-10 rounded bg-white/5 flex items-center justify-center text-xs text-muted-foreground">
                    G
                  </div>
                  <div className="w-10 h-10 rounded bg-white/5 flex items-center justify-center text-xs text-muted-foreground">
                    G
                  </div>
                </div>
              </div>

              {/* Passenger seats */}
              <div className="space-y-2">
                {/* Row 1 */}
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3].map((s) => (
                    <SeatButton key={s} seatNum={s} />
                  ))}
                  <span className="text-xs text-muted-foreground ml-2">DOOR</span>
                </div>

                {/* Rows 2-8 */}
                {[2, 3, 4, 5, 6, 7, 8].map((row) => (
                  <div key={row} className="flex items-center justify-center gap-2">
                    {[4, 8, 12, 16, 20, 24].map((base) => {
                      const seatNum = base + (row - 2);
                      return seatNum <= 27 ? <SeatButton key={seatNum} seatNum={seatNum} /> : null;
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Next button */}
            <Button
              onClick={() => setStep(3)}
              disabled={!isStep2Valid()}
              className="w-full bg-lime hover:bg-lime-light text-black font-semibold py-3 rounded-xl disabled:opacity-50"
            >
              Continue to Confirm <ChevronRight size={18} className="ml-2" />
            </Button>
          </motion.div>
        )}

        {/* ── Step 3: Confirm + Payment ── */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="px-5 space-y-5"
          >
            {confirmed ? (
              <>
                {/* Success screen */}
                <div className="glass rounded-2xl p-6 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-lime/20 flex items-center justify-center mx-auto">
                    <Check size={32} className="text-lime" />
                  </div>
                  <h2 className="text-2xl font-serif text-foreground">Booking Confirmed!</h2>
                  <p className="text-sm text-muted-foreground">
                    Your booking reference is <span className="font-bold text-lime">{bookingRef}</span>
                  </p>
                </div>

                {/* Booking summary */}
                <div className="glass rounded-2xl p-5 space-y-3">
                  <h3 className="text-base font-medium text-foreground">Booking Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Trip</span>
                      <span className="text-foreground font-medium">{trip.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Passengers</span>
                      <span className="text-foreground font-medium">{passengers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Seats</span>
                      <span className="text-foreground font-medium">{selectedSeats.sort((a, b) => a - b).join(", ")}</span>
                    </div>
                    {hikingSticks > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Hiking Sticks</span>
                        <span className="text-foreground font-medium">{hikingSticks}</span>
                      </div>
                    )}
                    <div className="h-px bg-white/10 my-2" />
                    <div className="flex justify-between">
                      <span className="text-foreground font-medium">Total</span>
                      <span className="text-lime font-bold">${totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Payment method display */}
                {payment === "cash" ? (
                  <div className="glass rounded-2xl p-5 border border-amber-500/20 space-y-3">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center">
                        <Banknote size={16} className="text-amber-400" />
                      </div>
                      <h3 className="text-base font-semibold text-foreground">Cash Payment Reminder</h3>
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p className="flex gap-2">
                        <span className="text-amber-400 font-bold">1.</span>
                        <span>Bring exactly <span className="font-bold text-foreground">${totalPrice.toFixed(2)}</span> in cash</span>
                      </p>
                      <p className="flex gap-2">
                        <span className="text-amber-400 font-bold">2.</span>
                        <span>Pay the organiser at the meeting point before boarding</span>
                      </p>
                      <p className="flex gap-2">
                        <span className="text-amber-400 font-bold">3.</span>
                        <span>No change is guaranteed</span>
                      </p>
                      <p className="flex gap-2">
                        <span className="text-amber-400 font-bold">4.</span>
                        <span>Your seat is reserved only after payment</span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="glass rounded-2xl p-5 border border-purple-500/20 space-y-3">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full bg-purple-500/15 flex items-center justify-center">
                        <MessageCircle size={16} className="text-purple-400" />
                      </div>
                      <h3 className="text-base font-semibold text-foreground">How to Pay via Whish Money</h3>
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p className="flex gap-2">
                        <span className="text-purple-400 font-bold">1.</span>
                        <span>Open your Whish Money app</span>
                      </p>
                      <p className="flex gap-2">
                        <span className="text-purple-400 font-bold">2.</span>
                        <span>Tap <span className="font-bold text-foreground">Send Money</span></span>
                      </p>
                      <p className="flex gap-2">
                        <span className="text-purple-400 font-bold">3.</span>
                        <span>Select <span className="font-bold text-foreground">Whish to Whish</span></span>
                      </p>
                      <p className="flex gap-2">
                        <span className="text-purple-400 font-bold">4.</span>
                        <span>Enter the number and amount</span>
                      </p>
                      <p className="flex gap-2">
                        <span className="text-purple-400 font-bold">5.</span>
                        <span>Add notes: <span className="font-bold text-foreground">Your Name + {bookingRef}</span></span>
                      </p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 mt-3 border border-purple-500/20">
                      <p className="text-xs text-muted-foreground mb-2">Mountain Rangers Phone Number</p>
                      <div className="flex items-center justify-between">
                        <span className="text-base font-bold text-foreground">+961 76 828 401</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText("+96176828401");
                            toast.success("Phone number copied!");
                          }}
                          className="text-xs bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 px-3 py-1 rounded transition"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* WhatsApp confirmation button */}
                <Button
                  onClick={() => {
                    if (whatsappLink) {
                      window.open(whatsappLink, "_blank");
                    } else {
                      toast.info("Opening WhatsApp...");
                      window.open("https://wa.me/96176828401", "_blank");
                    }
                  }}
                  className="w-full bg-[#25D366] hover:bg-[#20ba58] text-white font-semibold py-3 rounded-xl"
                >
                  <MessageCircle size={18} className="mr-2" />
                  Confirm Reservation via WhatsApp
                </Button>

                {/* View bookings link */}
                <Button
                  onClick={() => navigate("/bookings")}
                  variant="outline"
                  className="w-full py-3 rounded-xl"
                >
                  View My Bookings
                </Button>
              </>
            ) : (
              <>
                {/* Payment method selection */}
                <div className="glass rounded-2xl p-5">
                  <h3 className="text-base font-medium text-foreground mb-4">Select Payment Method</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => setPayment("cash")}
                      className={`w-full p-4 rounded-xl border-2 transition flex items-center gap-3 ${
                        payment === "cash"
                          ? "border-lime bg-lime/10"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      }`}
                    >
                      <Banknote size={20} className={payment === "cash" ? "text-lime" : "text-muted-foreground"} />
                      <div className="text-left">
                        <p className="text-sm font-medium text-foreground">Cash on Bus</p>
                        <p className="text-xs text-muted-foreground">Pay at meeting point</p>
                      </div>
                      {payment === "cash" && <Check size={18} className="ml-auto text-lime" />}
                    </button>

                    <button
                      onClick={() => setPayment("whish")}
                      className={`w-full p-4 rounded-xl border-2 transition flex items-center gap-3 ${
                        payment === "whish"
                          ? "border-lime bg-lime/10"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      }`}
                    >
                      <CreditCard size={20} className={payment === "whish" ? "text-lime" : "text-muted-foreground"} />
                      <div className="text-left">
                        <p className="text-sm font-medium text-foreground">Whish Money</p>
                        <p className="text-xs text-muted-foreground">Transfer before trip</p>
                      </div>
                      {payment === "whish" && <Check size={18} className="ml-auto text-lime" />}
                    </button>
                  </div>
                </div>

                {/* Booking summary */}
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

                {/* Confirm button */}
                <Button
                  onClick={handleSubmitBooking}
                  disabled={createBooking.isPending}
                  className="w-full bg-lime hover:bg-lime-light text-black font-semibold py-3 rounded-xl disabled:opacity-50"
                >
                  {createBooking.isPending ? (
                    <>
                      <Loader2 size={18} className="mr-2 animate-spin" />
                      Confirming...
                    </>
                  ) : (
                    <>
                      <Check size={18} className="mr-2" />
                      Confirm Booking
                    </>
                  )}
                </Button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
