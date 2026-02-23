import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Mountain,
  Users,
  DollarSign,
  MapPin,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

type Difficulty = "Easy" | "Moderate" | "Hard" | "Expert";

const difficultyColors: Record<Difficulty, string> = {
  Easy: "text-green-400 bg-green-500/15",
  Moderate: "text-yellow-400 bg-yellow-500/15",
  Hard: "text-orange-400 bg-orange-500/15",
  Expert: "text-red-400 bg-red-500/15",
};

type TripFormData = {
  title: string;
  location: string;
  date: string;
  time: string;
  duration: string;
  difficulty: Difficulty;
  price: string;
  currency: string;
  imageUrl: string;
  description: string;
  highlights: string;
  included: string;
  meetingPoint: string;
  totalSeats: string;
  elevation: string;
  distance: string;
};

const emptyForm: TripFormData = {
  title: "",
  location: "",
  date: "",
  time: "07:00 AM",
  duration: "8 hours",
  difficulty: "Moderate",
  price: "",
  currency: "USD",
  imageUrl: "",
  description: "",
  highlights: "",
  included: "",
  meetingPoint: "",
  totalSeats: "24",
  elevation: "",
  distance: "",
};

export default function AdminTrips() {
  const utils = trpc.useUtils();
  const { data: trips, isLoading } = trpc.admin.allTrips.useQuery();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<TripFormData>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const createMutation = trpc.admin.createTrip.useMutation({
    onSuccess: () => {
      utils.admin.allTrips.invalidate();
      toast.success("Trip created successfully!");
      setShowForm(false);
      setForm(emptyForm);
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.admin.updateTrip.useMutation({
    onSuccess: () => {
      utils.admin.allTrips.invalidate();
      toast.success("Trip updated successfully!");
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.admin.deleteTrip.useMutation({
    onSuccess: () => {
      utils.admin.allTrips.invalidate();
      toast.success("Trip deactivated.");
      setDeleteConfirm(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleMutation = trpc.admin.toggleTripStatus.useMutation({
    onSuccess: (_, vars) => {
      utils.admin.allTrips.invalidate();
      toast.success(vars.isActive ? "Trip activated." : "Trip deactivated.");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleEdit = (trip: NonNullable<typeof trips>[0]) => {
    setEditingId(trip.id);
    setForm({
      title: trip.title,
      location: trip.location,
      date: format(new Date(trip.date), "yyyy-MM-dd"),
      time: trip.time,
      duration: trip.duration,
      difficulty: trip.difficulty as Difficulty,
      price: String(parseFloat(String(trip.price))),
      currency: trip.currency,
      imageUrl: trip.imageUrl ?? "",
      description: trip.description ?? "",
      highlights: (trip.highlights ?? []).join("\n"),
      included: (trip.included ?? []).join("\n"),
      meetingPoint: trip.meetingPoint ?? "",
      totalSeats: String(trip.totalSeats),
      elevation: trip.elevation ?? "",
      distance: trip.distance ?? "",
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    const payload = {
      title: form.title,
      location: form.location,
      date: form.date,
      time: form.time,
      duration: form.duration,
      difficulty: form.difficulty,
      price: parseFloat(form.price),
      currency: form.currency,
      imageUrl: form.imageUrl || undefined,
      description: form.description || undefined,
      highlights: form.highlights ? form.highlights.split("\n").filter(Boolean) : undefined,
      included: form.included ? form.included.split("\n").filter(Boolean) : undefined,
      meetingPoint: form.meetingPoint || undefined,
      totalSeats: parseInt(form.totalSeats) || 24,
      elevation: form.elevation || undefined,
      distance: form.distance || undefined,
    };

    if (editingId !== null) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Trip Management</h1>
            <p className="text-gray-400 text-sm mt-1">
              {trips?.length ?? 0} trips total
            </p>
          </div>
          <Button
            onClick={() => { setEditingId(null); setForm(emptyForm); setShowForm(true); }}
            className="bg-lime-500 hover:bg-lime-400 text-black font-semibold gap-2"
          >
            <Plus className="w-4 h-4" />
            New Trip
          </Button>
        </div>

        {/* Trips Table */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : !trips || trips.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Mountain className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No trips yet. Create your first trip!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {trips.map((trip) => (
              <div
                key={trip.id}
                className={`rounded-xl border p-4 transition-all ${
                  trip.isActive
                    ? "border-[#1a2a1a] bg-[#0d150d]"
                    : "border-[#1a1a1a] bg-[#0d0d0d] opacity-60"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Trip image */}
                  {trip.imageUrl ? (
                    <img
                      src={trip.imageUrl}
                      alt={trip.title}
                      className="w-16 h-16 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-lime-500/10 flex items-center justify-center shrink-0">
                      <Mountain className="w-6 h-6 text-lime-400" />
                    </div>
                  )}

                  {/* Trip info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-white font-semibold text-sm">{trip.title}</h3>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="flex items-center gap-1 text-gray-400 text-xs">
                            <MapPin className="w-3 h-3" />
                            {trip.location}
                          </span>
                          <span className="flex items-center gap-1 text-gray-400 text-xs">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(trip.date), "MMM d, yyyy")}
                          </span>
                          <span className="flex items-center gap-1 text-gray-400 text-xs">
                            <Users className="w-3 h-3" />
                            {trip.bookedSeatsCount}/{trip.totalSeats} seats
                          </span>
                          <span className="flex items-center gap-1 text-lime-400 text-xs font-semibold">
                            <DollarSign className="w-3 h-3" />
                            {parseFloat(String(trip.price)).toFixed(0)} {trip.currency}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            difficultyColors[trip.difficulty as Difficulty] ?? ""
                          }`}
                        >
                          {trip.difficulty}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            trip.isActive
                              ? "text-lime-400 bg-lime-500/15"
                              : "text-gray-400 bg-gray-500/15"
                          }`}
                        >
                          {trip.isActive ? "Active" : "Inactive"}
                        </span>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="bg-[#0d150d] border-[#1a2a1a] text-gray-300"
                          >
                            <DropdownMenuItem
                              onClick={() => handleEdit(trip)}
                              className="cursor-pointer hover:bg-white/5 hover:text-white"
                            >
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit Trip
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                toggleMutation.mutate({ id: trip.id, isActive: !trip.isActive })
                              }
                              className="cursor-pointer hover:bg-white/5 hover:text-white"
                            >
                              {trip.isActive ? (
                                <>
                                  <ToggleLeft className="w-4 h-4 mr-2" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <ToggleRight className="w-4 h-4 mr-2 text-lime-400" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeleteConfirm(trip.id)}
                              className="cursor-pointer text-red-400 hover:bg-red-500/10 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Trip
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Fill rate bar */}
                    <div className="mt-2">
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${trip.fillRate}%`,
                            backgroundColor:
                              trip.fillRate >= 80
                                ? "#ef4444"
                                : trip.fillRate >= 50
                                ? "#f59e0b"
                                : "#84cc16",
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{trip.fillRate}% filled</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Trip Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) { setShowForm(false); setEditingId(null); setForm(emptyForm); } }}>
        <DialogContent className="bg-[#0d150d] border-[#1a2a1a] text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingId !== null ? "Edit Trip" : "Create New Trip"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-2">
            {/* Title */}
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs text-gray-400 font-medium">Trip Title *</label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Qornet el Sawda Summit"
                className="bg-white/5 border-[#1a2a1a] text-white placeholder:text-gray-600"
              />
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400 font-medium">Location *</label>
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. North Lebanon"
                className="bg-white/5 border-[#1a2a1a] text-white placeholder:text-gray-600"
              />
            </div>

            {/* Meeting Point */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400 font-medium">Meeting Point</label>
              <Input
                value={form.meetingPoint}
                onChange={(e) => setForm({ ...form, meetingPoint: e.target.value })}
                placeholder="e.g. Beirut, ABC Mall"
                className="bg-white/5 border-[#1a2a1a] text-white placeholder:text-gray-600"
              />
            </div>

            {/* Date */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400 font-medium">Date *</label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="bg-white/5 border-[#1a2a1a] text-white"
              />
            </div>

            {/* Time */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400 font-medium">Departure Time</label>
              <Input
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                placeholder="07:00 AM"
                className="bg-white/5 border-[#1a2a1a] text-white placeholder:text-gray-600"
              />
            </div>

            {/* Duration */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400 font-medium">Duration</label>
              <Input
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                placeholder="8 hours"
                className="bg-white/5 border-[#1a2a1a] text-white placeholder:text-gray-600"
              />
            </div>

            {/* Difficulty */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400 font-medium">Difficulty</label>
              <Select
                value={form.difficulty}
                onValueChange={(v) => setForm({ ...form, difficulty: v as Difficulty })}
              >
                <SelectTrigger className="bg-white/5 border-[#1a2a1a] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0d150d] border-[#1a2a1a] text-white">
                  {["Easy", "Moderate", "Hard", "Expert"].map((d) => (
                    <SelectItem key={d} value={d} className="hover:bg-white/5">
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Price */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400 font-medium">Price (USD) *</label>
              <Input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="45"
                className="bg-white/5 border-[#1a2a1a] text-white placeholder:text-gray-600"
              />
            </div>

            {/* Total Seats */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400 font-medium">Total Seats</label>
              <Input
                type="number"
                value={form.totalSeats}
                onChange={(e) => setForm({ ...form, totalSeats: e.target.value })}
                placeholder="24"
                className="bg-white/5 border-[#1a2a1a] text-white placeholder:text-gray-600"
              />
            </div>

            {/* Elevation */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400 font-medium">Elevation</label>
              <Input
                value={form.elevation}
                onChange={(e) => setForm({ ...form, elevation: e.target.value })}
                placeholder="3088m"
                className="bg-white/5 border-[#1a2a1a] text-white placeholder:text-gray-600"
              />
            </div>

            {/* Distance */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400 font-medium">Distance</label>
              <Input
                value={form.distance}
                onChange={(e) => setForm({ ...form, distance: e.target.value })}
                placeholder="12km"
                className="bg-white/5 border-[#1a2a1a] text-white placeholder:text-gray-600"
              />
            </div>

            {/* Image URL */}
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs text-gray-400 font-medium">Image URL</label>
              <Input
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="https://..."
                className="bg-white/5 border-[#1a2a1a] text-white placeholder:text-gray-600"
              />
            </div>

            {/* Description */}
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs text-gray-400 font-medium">Description</label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe the trip..."
                rows={3}
                className="bg-white/5 border-[#1a2a1a] text-white placeholder:text-gray-600 resize-none"
              />
            </div>

            {/* Highlights */}
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs text-gray-400 font-medium">
                Highlights (one per line)
              </label>
              <Textarea
                value={form.highlights}
                onChange={(e) => setForm({ ...form, highlights: e.target.value })}
                placeholder={"Summit views&#10;Cedar forest&#10;Professional guides"}
                rows={3}
                className="bg-white/5 border-[#1a2a1a] text-white placeholder:text-gray-600 resize-none"
              />
            </div>

            {/* Included */}
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs text-gray-400 font-medium">
                What's Included (one per line)
              </label>
              <Textarea
                value={form.included}
                onChange={(e) => setForm({ ...form, included: e.target.value })}
                placeholder={"Transportation&#10;Guide&#10;First aid kit"}
                rows={3}
                className="bg-white/5 border-[#1a2a1a] text-white placeholder:text-gray-600 resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }}
              className="border-[#1a2a1a] text-gray-400 hover:bg-white/5 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !form.title || !form.location || !form.date || !form.price}
              className="bg-lime-500 hover:bg-lime-400 text-black font-semibold"
            >
              {isSubmitting ? "Saving..." : editingId !== null ? "Update Trip" : "Create Trip"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="bg-[#0d150d] border-[#1a2a1a] text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Trip?</DialogTitle>
          </DialogHeader>
          <p className="text-gray-400 text-sm">
            This will deactivate the trip and hide it from users. Existing bookings will remain.
          </p>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
              className="border-[#1a2a1a] text-gray-400 hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              onClick={() => deleteConfirm !== null && deleteMutation.mutate({ id: deleteConfirm })}
              disabled={deleteMutation.isPending}
              className="bg-red-500 hover:bg-red-400 text-white"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
