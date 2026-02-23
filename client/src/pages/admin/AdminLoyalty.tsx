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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Award,
  Search,
  CreditCard,
  CheckCircle,
  Clock,
  Plus,
  Minus,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function AdminLoyalty() {
  const utils = trpc.useUtils();
  const { data: profiles, isLoading } = trpc.admin.allLoyalty.useQuery();
  const [search, setSearch] = useState("");
  const [adjustDialog, setAdjustDialog] = useState<{
    userId: number;
    name: string;
    currentPoints: number;
  } | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");

  const approveNfcMutation = trpc.admin.approveNfcCard.useMutation({
    onSuccess: () => {
      utils.admin.allLoyalty.invalidate();
      toast.success("NFC card approved!");
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const adjustPointsMutation = trpc.admin.adjustPoints.useMutation({
    onSuccess: () => {
      utils.admin.allLoyalty.invalidate();
      setAdjustDialog(null);
      setAdjustAmount("");
      toast.success("Points adjusted successfully.");
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    if (!profiles) return [];
    if (!search) return profiles;
    return profiles.filter(
      (p) =>
        p.user.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.user.email?.toLowerCase().includes(search.toLowerCase())
    );
  }, [profiles, search]);

  // nfcCardRequested = true means pending (not yet approved/issued)
  const nfcPending = profiles?.filter((p) => p.loyalty.nfcCardRequested) ?? [];

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Explorer": return "text-amber-600 bg-amber-600/15";
      case "Trail Blazer": return "text-gray-300 bg-gray-400/15";
      case "Summit Seeker": return "text-yellow-400 bg-yellow-400/15";
      case "Mountain Legend": return "text-cyan-300 bg-cyan-400/15";
      default: return "text-gray-400 bg-gray-500/15";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Loyalty & NFC Management</h1>
          <p className="text-gray-400 text-sm mt-1">
            {profiles?.length ?? 0} loyalty profiles
          </p>
        </div>

        {/* NFC Pending Requests */}
        {nfcPending.length > 0 && (
          <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-yellow-400" />
              <h2 className="text-yellow-400 font-semibold text-sm">
                {nfcPending.length} Pending NFC Card Request{nfcPending.length > 1 ? "s" : ""}
              </h2>
            </div>
            <div className="space-y-2">
              {nfcPending.map((p) => (
                <div
                  key={p.loyalty.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-black/20"
                >
                  <div>
                    <p className="text-white text-sm font-medium">{p.user.name ?? "Unknown"}</p>
                    <p className="text-gray-400 text-xs">
                      {p.loyalty.points} pts · {p.loyalty.level} level
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => approveNfcMutation.mutate({ loyaltyId: p.loyalty.id })}
                    disabled={approveNfcMutation.isPending}
                    className="bg-lime-500 hover:bg-lime-400 text-black font-semibold text-xs h-8"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Approve (Issue Card)
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {["Explorer", "Trail Blazer", "Summit Seeker", "Mountain Legend"].map((level) => (
            <div key={level} className="rounded-xl border border-[#1a2a1a] bg-[#0d150d] p-4">
              <p className={`text-2xl font-bold ${getLevelColor(level).split(" ")[0]}`}>
                {profiles?.filter((p) => p.loyalty.level === level).length ?? 0}
              </p>
              <p className="text-xs text-gray-400 mt-0.5 truncate">{level}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="pl-9 bg-white/5 border-[#1a2a1a] text-white placeholder:text-gray-600"
          />
        </div>

        {/* Loyalty Profiles */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Award className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No loyalty profiles found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((profile) => (
              <div
                key={profile.loyalty.id}
                className="rounded-xl border border-[#1a2a1a] bg-[#0d150d] p-4 flex items-center gap-4"
              >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-lime-500/20 flex items-center justify-center shrink-0">
                  <span className="text-lime-400 text-sm font-bold">
                    {profile.user.name?.charAt(0).toUpperCase() ?? "?"}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white text-sm font-medium truncate">
                      {profile.user.name ?? "—"}
                    </p>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${getLevelColor(profile.loyalty.level)}`}
                    >
                      {profile.loyalty.level}
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs">
                    {profile.loyalty.points} pts · {profile.loyalty.tripsCompleted} trips completed
                  </p>
                </div>

                {/* NFC Status */}
                <div className="shrink-0 hidden sm:flex items-center gap-1.5">
                  {profile.loyalty.nfcCardRequested ? (
                    <span className="flex items-center gap-1 text-xs text-yellow-400 bg-yellow-500/15 px-2 py-0.5 rounded-full">
                      <Clock className="w-3 h-3" />
                      NFC Pending
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-gray-500 px-2 py-0.5 rounded-full">
                      <CreditCard className="w-3 h-3" />
                      No NFC
                    </span>
                  )}
                </div>

                {/* Adjust Points */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setAdjustDialog({
                      userId: profile.loyalty.userId,
                      name: profile.user.name ?? "Unknown",
                      currentPoints: profile.loyalty.points,
                    })
                  }
                  className="shrink-0 border-[#1a2a1a] text-gray-400 hover:bg-white/5 hover:text-white text-xs h-8"
                >
                  Adjust Points
                </Button>

                {/* Approve NFC if pending */}
                {profile.loyalty.nfcCardRequested && (
                  <Button
                    size="sm"
                    onClick={() =>
                      approveNfcMutation.mutate({ loyaltyId: profile.loyalty.id })
                    }
                    disabled={approveNfcMutation.isPending}
                    className="shrink-0 bg-lime-500 hover:bg-lime-400 text-black font-semibold text-xs h-8"
                  >
                    Approve NFC
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Adjust Points Dialog */}
      <Dialog
        open={adjustDialog !== null}
        onOpenChange={() => {
          setAdjustDialog(null);
          setAdjustAmount("");
        }}
      >
        <DialogContent className="bg-[#0d150d] border-[#1a2a1a] text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white">
              Adjust Points — {adjustDialog?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-gray-400 text-sm">
              Current balance:{" "}
              <span className="text-lime-400 font-semibold">
                {adjustDialog?.currentPoints} pts
              </span>
            </p>
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400 font-medium">
                Points to add (positive) or deduct (negative)
              </label>
              <Input
                type="number"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                placeholder="e.g. 50 or -20"
                className="bg-white/5 border-[#1a2a1a] text-white placeholder:text-gray-600"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setAdjustDialog(null)}
              className="border-[#1a2a1a] text-gray-400 hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!adjustDialog || !adjustAmount) return;
                adjustPointsMutation.mutate({
                  userId: adjustDialog.userId,
                  points: parseInt(adjustAmount),
                });
              }}
              disabled={adjustPointsMutation.isPending || !adjustAmount}
              className="bg-lime-500 hover:bg-lime-400 text-black font-semibold"
            >
              {parseInt(adjustAmount || "0") >= 0 ? (
                <Plus className="w-4 h-4 mr-1" />
              ) : (
                <Minus className="w-4 h-4 mr-1" />
              )}
              {adjustPointsMutation.isPending ? "Saving..." : "Apply"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
