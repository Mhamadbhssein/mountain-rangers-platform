import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  Search,
  MoreVertical,
  Shield,
  ShieldOff,
  CalendarCheck,
  Award,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function AdminUsers() {
  const utils = trpc.useUtils();
  const { data: users, isLoading } = trpc.admin.allUsers.useQuery();
  const [search, setSearch] = useState("");

  const promoteAdminMutation = trpc.admin.updateUserRole.useMutation({
    onSuccess: (_data, vars) => {
      utils.admin.allUsers.invalidate();
      toast.success(vars.role === "admin" ? "User promoted to admin." : "Admin role removed.");
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    if (!users) return [];
    if (!search) return users;
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    );
  }, [users, search]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">User Management</h1>
            <p className="text-gray-400 text-sm mt-1">{users?.length ?? 0} registered users</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-[#1a2a1a] bg-[#0d150d] p-4">
            <p className="text-2xl font-bold text-lime-400">{users?.length ?? 0}</p>
            <p className="text-xs text-gray-400 mt-0.5">Total Users</p>
          </div>
          <div className="rounded-xl border border-[#1a2a1a] bg-[#0d150d] p-4">
            <p className="text-2xl font-bold text-purple-400">
              {users?.filter((u) => u.role === "admin").length ?? 0}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Admins</p>
          </div>
          <div className="rounded-xl border border-[#1a2a1a] bg-[#0d150d] p-4">
            <p className="text-2xl font-bold text-blue-400">
              {users?.filter((u) => {
                const d = new Date(u.lastSignedIn);
                const now = new Date();
                return now.getTime() - d.getTime() < 7 * 24 * 60 * 60 * 1000;
              }).length ?? 0}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Active (7d)</p>
          </div>
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

        {/* Users Table */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No users found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((user) => (
              <div
                key={user.id}
                className="rounded-xl border border-[#1a2a1a] bg-[#0d150d] p-4 flex items-center gap-4"
              >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-lime-500/20 flex items-center justify-center shrink-0">
                  <span className="text-lime-400 text-sm font-bold">
                    {user.name?.charAt(0).toUpperCase() ?? "?"}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white text-sm font-medium truncate">{user.name ?? "—"}</p>
                    {user.role === "admin" && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-purple-500/15 text-purple-400 font-medium">
                        Admin
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-xs truncate">{user.email ?? "No email"}</p>
                </div>

                {/* Stats */}
                <div className="hidden sm:flex items-center gap-4 shrink-0">
                  <div className="flex items-center gap-1 text-gray-400 text-xs">
                    <CalendarCheck className="w-3 h-3" />
                    <span>{user.bookingCount} bookings</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-400 text-xs">
                    <Award className="w-3 h-3" />
                    <span>{user.loyaltyPoints} pts</span>
                  </div>
                </div>

                {/* Last seen */}
                <div className="hidden md:block shrink-0 text-right">
                  <p className="text-gray-500 text-xs">
                    Last seen {format(new Date(user.lastSignedIn), "MMM d")}
                  </p>
                  <p className="text-gray-600 text-xs">
                    Joined {format(new Date(user.createdAt), "MMM yyyy")}
                  </p>
                </div>

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
                    {user.role !== "admin" ? (
                      <DropdownMenuItem
                        onClick={() =>
                          promoteAdminMutation.mutate({ userId: user.id, role: "admin" })
                        }
                        className="cursor-pointer hover:bg-white/5 hover:text-white"
                      >
                        <Shield className="w-4 h-4 mr-2 text-purple-400" />
                        Promote to Admin
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onClick={() =>
                          promoteAdminMutation.mutate({ userId: user.id, role: "user" })
                        }
                        className="cursor-pointer hover:bg-white/5 hover:text-white"
                      >
                        <ShieldOff className="w-4 h-4 mr-2 text-gray-400" />
                        Remove Admin Role
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
