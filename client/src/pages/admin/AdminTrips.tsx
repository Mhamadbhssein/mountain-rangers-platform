import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { useState, useRef, useCallback } from "react";
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
  Upload,
  X,
  ImagePlus,
  Map,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { MapView } from "@/components/Map";

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
  additionalImages: string[];
  description: string;
  highlights: string;
  included: string;
  meetingPoint: string;
  meetingPointLat: number | null;
  meetingPointLng: number | null;
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
  additionalImages: [],
  description: "",
  highlights: "",
  included: "",
  meetingPoint: "",
  meetingPointLat: null,
  meetingPointLng: null,
  totalSeats: "27",
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
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingAdditional, setUploadingAdditional] = useState(false);
  const mainImageInputRef = useRef<HTMLInputElement>(null);
  const additionalImageInputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

  const uploadMutation = trpc.upload.tripImage.useMutation();

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
      toast.success("Trip deleted.");
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
      additionalImages: (trip.additionalImages as string[] | null) ?? [],
      description: trip.description ?? "",
      highlights: (trip.highlights ?? []).join("\n"),
      included: (trip.included ?? []).join("\n"),
      meetingPoint: trip.meetingPoint ?? "",
      meetingPointLat: (trip.meetingPointLat as number | null) ?? null,
      meetingPointLng: (trip.meetingPointLng as number | null) ?? null,
      totalSeats: String(trip.totalSeats),
      elevation: trip.elevation ?? "",
      distance: trip.distance ?? "",
    });
    setShowForm(true);
  };

  const handleUploadMainImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMain(true);
    try {
      const base64 = await fileToBase64(file);
      const { url } = await uploadMutation.mutateAsync({
        filename: file.name,
        contentType: file.type,
        base64Data: base64,
      });
      setForm((f) => ({ ...f, imageUrl: url }));
      toast.success("Main image uploaded!");
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setUploadingMain(false);
      if (mainImageInputRef.current) mainImageInputRef.current.value = "";
    }
  };

  const handleUploadAdditionalImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploadingAdditional(true);
    try {
      const urls: string[] = [];
      for (const file of files) {
        const base64 = await fileToBase64(file);
        const { url } = await uploadMutation.mutateAsync({
          filename: file.name,
          contentType: file.type,
          base64Data: base64,
        });
        urls.push(url);
      }
      setForm((f) => ({ ...f, additionalImages: [...f.additionalImages, ...urls] }));
      toast.success(`${urls.length} image(s) uploaded!`);
    } catch {
      toast.error("Failed to upload image(s)");
    } finally {
      setUploadingAdditional(false);
      if (additionalImageInputRef.current) additionalImageInputRef.current.value = "";
    }
  };

  const removeAdditionalImage = (idx: number) => {
    setForm((f) => ({
      ...f,
      additionalImages: f.additionalImages.filter((_, i) => i !== idx),
    }));
  };

  const handleMapReady = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    // If there's already a pinned location, center on it
    if (form.meetingPointLat && form.meetingPointLng) {
      map.setCenter({ lat: form.meetingPointLat, lng: form.meetingPointLng });
      map.setZoom(14);
      markerRef.current = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat: form.meetingPointLat, lng: form.meetingPointLng },
        title: "Meeting Point",
      });
    }
    // Click to pin
    map.addListener("click", (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      // Remove old marker
      if (markerRef.current) {
        markerRef.current.map = null;
      }
      markerRef.current = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat, lng },
        title: "Meeting Point",
      });
      setForm((f) => ({ ...f, meetingPointLat: lat, meetingPointLng: lng }));
    });
  }, [form.meetingPointLat, form.meetingPointLng]);

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
      additionalImages: form.additionalImages.length > 0 ? form.additionalImages : undefined,
      description: form.description || undefined,
      highlights: form.highlights ? form.highlights.split("\n").filter(Boolean) : undefined,
      included: form.included ? form.included.split("\n").filter(Boolean) : undefined,
      meetingPoint: form.meetingPoint || undefined,
      meetingPointLat: form.meetingPointLat ?? undefined,
      meetingPointLng: form.meetingPointLng ?? undefined,
      totalSeats: parseInt(form.totalSeats) || 27,
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
                          {(trip.meetingPointLat || trip.meetingPointLng) && (
                            <span className="flex items-center gap-1 text-blue-400 text-xs">
                              <Map className="w-3 h-3" />
                              Map pinned
                            </span>
                          )}
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

            {/* Map Pin for Meeting Point */}
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs text-gray-400 font-medium">Meeting Point on Map</label>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowMapPicker(true)}
                  className="border-[#1a2a1a] text-gray-300 hover:bg-white/5 hover:text-white gap-2"
                >
                  <MapPin className="w-4 h-4 text-lime-400" />
                  {form.meetingPointLat && form.meetingPointLng
                    ? "Update Pin Location"
                    : "Pin on Map"}
                </Button>
                {form.meetingPointLat && form.meetingPointLng && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-lime-400 bg-lime-500/10 px-2 py-1 rounded-full">
                      📍 {form.meetingPointLat.toFixed(4)}, {form.meetingPointLng.toFixed(4)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, meetingPointLat: null, meetingPointLng: null }))}
                      className="text-gray-500 hover:text-red-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
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
                placeholder="27"
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

            {/* Main Image Upload */}
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs text-gray-400 font-medium">Main Photo</label>
              <div className="flex items-start gap-3">
                {form.imageUrl ? (
                  <div className="relative">
                    <img
                      src={form.imageUrl}
                      alt="Main"
                      className="w-24 h-24 rounded-lg object-cover border border-[#1a2a1a]"
                    />
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, imageUrl: "" }))}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => mainImageInputRef.current?.click()}
                    className="w-24 h-24 rounded-lg border-2 border-dashed border-[#1a2a1a] flex flex-col items-center justify-center cursor-pointer hover:border-lime-500/50 transition-colors"
                  >
                    {uploadingMain ? (
                      <div className="w-5 h-5 border-2 border-lime-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-gray-500 mb-1" />
                        <span className="text-xs text-gray-500">Upload</span>
                      </>
                    )}
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-xs text-gray-500">
                    Upload the main cover photo for this trip. Recommended: 1200×800px, JPG or PNG.
                  </p>
                  {!form.imageUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => mainImageInputRef.current?.click()}
                      disabled={uploadingMain}
                      className="mt-2 border-[#1a2a1a] text-gray-400 hover:bg-white/5 hover:text-white gap-2 text-xs"
                    >
                      <ImagePlus className="w-3.5 h-3.5" />
                      Choose File
                    </Button>
                  )}
                </div>
              </div>
              <input
                ref={mainImageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUploadMainImage}
              />
            </div>

            {/* Additional Images Upload */}
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs text-gray-400 font-medium">Additional Photos</label>
              <div className="flex flex-wrap gap-2">
                {form.additionalImages.map((url, idx) => (
                  <div key={idx} className="relative">
                    <img
                      src={url}
                      alt={`Additional ${idx + 1}`}
                      className="w-20 h-20 rounded-lg object-cover border border-[#1a2a1a]"
                    />
                    <button
                      type="button"
                      onClick={() => removeAdditionalImage(idx)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
                <div
                  onClick={() => additionalImageInputRef.current?.click()}
                  className="w-20 h-20 rounded-lg border-2 border-dashed border-[#1a2a1a] flex flex-col items-center justify-center cursor-pointer hover:border-lime-500/50 transition-colors"
                >
                  {uploadingAdditional ? (
                    <div className="w-4 h-4 border-2 border-lime-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4 text-gray-500" />
                      <span className="text-xs text-gray-500 mt-0.5">Add</span>
                    </>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Add up to 10 additional photos shown in the trip gallery.
              </p>
              <input
                ref={additionalImageInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleUploadAdditionalImage}
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
                placeholder={"Summit views\nCedar forest\nProfessional guides"}
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
                placeholder={"Transportation\nGuide\nFirst aid kit"}
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

      {/* Map Picker Dialog */}
      <Dialog open={showMapPicker} onOpenChange={setShowMapPicker}>
        <DialogContent className="bg-[#0d150d] border-[#1a2a1a] text-white max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-lime-400" />
              Pin Meeting Point on Map
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-gray-400 mb-2">
            Click anywhere on the map to set the meeting point location. The marker will appear where you click.
          </p>
          <div className="rounded-xl overflow-hidden border border-[#1a2a1a]">
            <MapView
              className="h-[400px]"
              initialCenter={
                form.meetingPointLat && form.meetingPointLng
                  ? { lat: form.meetingPointLat, lng: form.meetingPointLng }
                  : { lat: 33.8886, lng: 35.4955 } // Beirut, Lebanon
              }
              initialZoom={form.meetingPointLat ? 14 : 9}
              onMapReady={handleMapReady}
            />
          </div>
          {form.meetingPointLat && form.meetingPointLng && (
            <p className="text-xs text-lime-400 mt-2">
              📍 Pinned at: {form.meetingPointLat.toFixed(5)}, {form.meetingPointLng.toFixed(5)}
            </p>
          )}
          <DialogFooter>
            <Button
              onClick={() => setShowMapPicker(false)}
              className="bg-lime-500 hover:bg-lime-400 text-black font-semibold"
            >
              Confirm Location
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

/* Helper: convert File to base64 string */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip data URL prefix: "data:image/jpeg;base64,..."
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
