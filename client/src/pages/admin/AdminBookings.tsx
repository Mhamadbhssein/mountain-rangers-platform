import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CalendarCheck,
  Search,
  MoreVertical,
  XCircle,
  CheckCircle,
  Clock,
  Eye,
  Filter,
  Users,
  MapPin,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

type BookingStatus = "confirmed" | "pending" | "completed" | "cancelled";

const statusConfig: Record<BookingStatus, { label: string; color: string; bg: string }> = {
  confirmed: { label: "Confirmed", color: "text-lime-400", bg: "bg-lime-500/15" },
  pending: { label: "Pending", color: "text-yellow-400", bg: "bg-yellow-500/15" },
  completed: { label: "Completed", color: "text-blue-400", bg: "bg-blue-500/15" },
  cancelled: { label: "Cancelled", color: "text-red-400", bg: "bg-red-500/15" },
};

export default function AdminBookings() {
  const utils = trpc.useUtils();
  const { data: bookings, isLoading } = trpc.admin.allBookings.useQuery();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [seatMapTripId, setSeatMapTripId] = useState<number | null>(null);
  const [seatMapTripTitle, setSeatMapTripTitle] = useState("");

  const { data: seatMapData } = trpc.admin.bookingsForTrip.useQuery(
    { tripId: seatMapTripId! },
    { enabled: seatMapTripId !== null }
  );

  const cancelMutation = trpc.admin.cancelBooking.useMutation({
    onSuccess: () => {
      utils.admin.allBookings.invalidate();
      toast.success("Booking cancelled.");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateStatusMutation = trpc.admin.updateBookingStatus.useMutation({
    onSuccess: () => {
      utils.admin.allBookings.invalidate();
      toast.success("Booking status updated.");
    },
    onError: (e) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    if (!bookings) return [];
    return bookings.filter((item) => {
      const matchesSearch =
        !search ||
        item.user.name?.toLowerCase().includes(search.toLowerCase()) ||
        item.booking.referenceCode.toLowerCase().includes(search.toLowerCase()) ||
        item.trip.title.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || item.booking.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [bookings, search, statusFilter]);

  const stats = useMemo(() => {
    if (!bookings) return { confirmed: 0, pending: 0, completed: 0, cancelled: 0 };
    return bookings.reduce(
      (acc, item) => {
        acc[item.booking.status as BookingStatus] =
          (acc[item.booking.status as BookingStatus] ?? 0) + 1;
        return acc;
      },
      { confirmed: 0, pending: 0, completed: 0, cancelled: 0 } as Record<BookingStatus, number>
    );
  }, [bookings]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Booking Management</h1>
          <p className="text-gray-400 text-sm mt-1">
            {bookings?.length ?? 0} total bookings
          </p>
        </div>

        {/* Status summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(Object.entries(statusConfig) as [BookingStatus, typeof statusConfig[BookingStatus]][]).map(([status, cfg]) => (
            <button
              key={status}
              onClick={() => setStatusFilter(statusFilter === status ? "all" : status)}
              className={`rounded-xl border p-3 text-left transition-all ${
                statusFilter === status
                  ? `${cfg.bg} border-current`
                  : "border-[#1a2a1a] bg-[#0d150d] hover:bg-white/5"
              }`}
            >
              <p className={`text-xl font-bold ${cfg.color}`}>{stats[status]}</p>
              <p className="text-xs text-gray-400 mt-0.5">{cfg.label}</p>
            </button>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, reference, or trip..."
              className="pl-9 bg-white/5 border-[#1a2a1a] text-white placeholder:text-gray-600"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 bg-white/5 border-[#1a2a1a] text-white">
              <Filter className="w-3 h-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#0d150d] border-[#1a2a1a] text-white">
              <SelectItem value="all">All Status</SelectItem>
              {Object.entries(statusConfig).map(([s, cfg]) => (
                <SelectItem key={s} value={s}>
                  {cfg.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Bookings List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <CalendarCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No bookings found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((item) => {
              const cfg = statusConfig[item.booking.status as BookingStatus] ?? statusConfig.confirmed;
              return (
                <div
                  key={item.booking.id}
                  className="rounded-xl border border-[#1a2a1a] bg-[#0d150d] p-4 flex items-center gap-4"
                >
                  {/* Reference */}
                  <div className="shrink-0 hidden sm:block">
                    <p className="text-xs text-gray-500 font-mono">{item.booking.referenceCode}</p>
                  </div>

                  {/* User & Trip */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {item.user.name ?? "Unknown User"}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-gray-400 text-xs truncate">{item.trip.title}</span>
                      <span className="text-gray-600 text-xs">·</span>
                      <span className="text-gray-400 text-xs">{item.booking.passengers} pax</span>
                      <span className="text-gray-600 text-xs">·</span>
                      <span className="text-gray-400 text-xs">
                        Seats: {(item.booking.seats as number[]).join(", ")}
                      </span>
                    </div>
                  </div>

                  {/* Price & Date */}
                  <div className="shrink-0 text-right hidden md:block">
                    <p className="text-lime-400 text-sm font-semibold">
                      ${parseFloat(String(item.booking.totalPrice)).toFixed(0)}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {format(new Date(item.booking.bookedAt), "MMM d, yyyy")}
                    </p>
                  </div>

                  {/* Status */}
                  <span
                    className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.color}`}
                  >
                    {cfg.label}
                  </span>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-gray-400 hover:text-white hover:bg-white/10"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="bg-[#0d150d] border-[#1a2a1a] text-gray-300"
                    >
                      <DropdownMenuItem
                        onClick={() => {
                          setSeatMapTripId(item.trip.id);
                          setSeatMapTripTitle(item.trip.title);
                        }}
                        className="cursor-pointer hover:bg-white/5 hover:text-white"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Seat Map
                      </DropdownMenuItem>
                      {item.booking.status !== "completed" && item.booking.status !== "cancelled" && (
                        <DropdownMenuItem
                          onClick={() =>
                            updateStatusMutation.mutate({
                              bookingId: item.booking.id,
                              status: "completed",
                            })
                          }
                          className="cursor-pointer hover:bg-white/5 hover:text-white"
                        >
                          <CheckCircle className="w-4 h-4 mr-2 text-blue-400" />
                          Mark Completed
                        </DropdownMenuItem>
                      )}
                      {item.booking.status === "confirmed" && (
                        <DropdownMenuItem
                          onClick={() =>
                            updateStatusMutation.mutate({
                              bookingId: item.booking.id,
                              status: "pending",
                            })
                          }
                          className="cursor-pointer hover:bg-white/5 hover:text-white"
                        >
                          <Clock className="w-4 h-4 mr-2 text-yellow-400" />
                          Set Pending
                        </DropdownMenuItem>
                      )}
                      {item.booking.status !== "cancelled" && (
                        <DropdownMenuItem
                          onClick={() => cancelMutation.mutate({ bookingId: item.booking.id })}
                          className="cursor-pointer text-red-400 hover:bg-red-500/10 hover:text-red-300"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Cancel Booking
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Seat Map Dialog */}
      <Dialog open={seatMapTripId !== null} onOpenChange={() => setSeatMapTripId(null)}>
        <DialogContent className="bg-[#0d150d] border-[#1a2a1a] text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-lime-400" />
              Seat Map — {seatMapTripTitle}
            </DialogTitle>
          </DialogHeader>

          {seatMapData ? (
            <div className="space-y-4">
              {/* Seat grid */}
              <div className="bg-black/30 rounded-xl p-4">
                <div className="text-center text-xs text-gray-500 mb-3 pb-2 border-b border-[#1a2a1a]">
                  🚌 DRIVER
                </div>
                <div className="grid gap-1.5" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
                  {Array.from({ length: 24 }, (_, i) => i + 1).map((seat) => {
                    const isBooked = seatMapData.bookedSeats.includes(seat);
                    const booking = seatMapData.bookings.find((b) =>
                      (b.booking.seats as number[]).includes(seat)
                    );
                    const col = ((seat - 1) % 4) + 1;
                    const isAisle = col === 2; // gap after col 2

                    return (
                      <div
                        key={seat}
                        className={`relative group ${isAisle ? "mr-3" : ""}`}
                        title={
                          isBooked && booking
                            ? `${booking.user.name ?? "Unknown"} — Ref: ${booking.booking.referenceCode}`
                            : `Seat ${seat} — Available`
                        }
                      >
                        <div
                          className={`w-full aspect-square rounded-md flex items-center justify-center text-xs font-semibold cursor-default transition-all ${
                            isBooked
                              ? "bg-red-500/30 text-red-300 border border-red-500/40"
                              : "bg-lime-500/15 text-lime-400 border border-lime-500/20"
                          }`}
                        >
                          {seat}
                        </div>
                        {isBooked && booking && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-[#0d150d] border border-[#1a2a1a] rounded-lg px-2 py-1 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                            {booking.user.name ?? "Unknown"}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-lime-500/15 border border-lime-500/20 inline-block" />
                  Available
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-red-500/30 border border-red-500/40 inline-block" />
                  Booked ({seatMapData.bookedSeats.length}/{24})
                </span>
              </div>

              {/* Passenger list */}
              {seatMapData.bookings.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                    Passengers
                  </h3>
                  {seatMapData.bookings
                    .filter((b) => b.booking.status !== "cancelled")
                    .map((b) => (
                      <div
                        key={b.booking.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-white/3"
                      >
                        <div>
                          <p className="text-white text-xs font-medium">
                            {b.user.name ?? "Unknown"}
                          </p>
                          <p className="text-gray-500 text-xs">
                            Seats: {(b.booking.seats as number[]).join(", ")} · {b.booking.referenceCode}
                          </p>
                        </div>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            statusConfig[b.booking.status as BookingStatus]?.bg ?? ""
                          } ${statusConfig[b.booking.status as BookingStatus]?.color ?? ""}`}
                        >
                          {statusConfig[b.booking.status as BookingStatus]?.label ?? b.booking.status}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-lime-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
