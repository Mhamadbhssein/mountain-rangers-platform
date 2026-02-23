import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import {
  Mountain,
  CalendarCheck,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { format } from "date-fns";

const statusConfig = {
  confirmed: { label: "Confirmed", color: "text-lime-400", bg: "bg-lime-500/15", icon: CheckCircle },
  pending: { label: "Pending", color: "text-yellow-400", bg: "bg-yellow-500/15", icon: AlertCircle },
  completed: { label: "Completed", color: "text-blue-400", bg: "bg-blue-500/15", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "text-red-400", bg: "bg-red-500/15", icon: XCircle },
};

export default function AdminOverview() {
  const { data: stats, isLoading: statsLoading } = trpc.admin.stats.useQuery();
  const { data: revenueByTrip, isLoading: revenueLoading } = trpc.admin.revenueByTrip.useQuery();
  const { data: recentBookings, isLoading: bookingsLoading } = trpc.admin.recentBookings.useQuery();

  const statCards = [
    {
      label: "Total Revenue",
      value: statsLoading ? "—" : `$${(stats?.totalRevenue ?? 0).toLocaleString("en-US", { minimumFractionDigits: 0 })}`,
      icon: DollarSign,
      color: "text-lime-400",
      bg: "bg-lime-500/10",
      border: "border-lime-500/20",
    },
    {
      label: "Confirmed Bookings",
      value: statsLoading ? "—" : String(stats?.confirmedBookings ?? 0),
      icon: CalendarCheck,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      label: "Active Trips",
      value: statsLoading ? "—" : String(stats?.activeTrips ?? 0),
      icon: Mountain,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      label: "Registered Users",
      value: statsLoading ? "—" : String(stats?.totalUsers ?? 0),
      icon: Users,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
    },
  ];

  const chartData = (revenueByTrip ?? []).map((r) => ({
    name: r.tripTitle.length > 18 ? r.tripTitle.slice(0, 18) + "…" : r.tripTitle,
    revenue: r.revenue,
    bookings: r.confirmedCount,
  }));

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
          <p className="text-gray-400 text-sm mt-1">
            Welcome back — here's what's happening with Mountain Rangers.
          </p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <div
              key={card.label}
              className={`rounded-xl border ${card.border} ${card.bg} p-4 flex flex-col gap-3`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400 font-medium">{card.label}</span>
                <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}>
                  <card.icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </div>
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* Revenue Chart */}
        <div className="rounded-xl border border-[#1a2a1a] bg-[#0d150d] p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-lime-400" />
            <h2 className="text-white font-semibold text-sm">Revenue by Trip</h2>
          </div>
          {revenueLoading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-lime-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-500 text-sm">
              No revenue data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#6b7280", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#6b7280", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0d150d",
                    border: "1px solid #1a2a1a",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                  formatter={(value: number, name: string) => [
                    name === "revenue" ? `$${value.toFixed(0)}` : value,
                    name === "revenue" ? "Revenue" : "Bookings",
                  ]}
                />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, index) => (
                    <Cell key={index} fill="#84cc16" fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Trip Fill Rates */}
        <div className="rounded-xl border border-[#1a2a1a] bg-[#0d150d] p-5">
          <h2 className="text-white font-semibold text-sm mb-4">Trip Fill Rates</h2>
          {revenueLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 bg-white/5 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {(revenueByTrip ?? []).map((trip) => {
                // We need fill rate from allTrips, approximate with bookings
                const fillPct = Math.min(100, Math.round((trip.confirmedCount / 24) * 100));
                return (
                  <div key={trip.tripId} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-300 truncate max-w-[60%]">{trip.tripTitle}</span>
                      <span className="text-gray-400">
                        {trip.confirmedCount} / 24 seats ({fillPct}%)
                      </span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${fillPct}%`,
                          backgroundColor:
                            fillPct >= 80 ? "#ef4444" : fillPct >= 50 ? "#f59e0b" : "#84cc16",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Bookings */}
        <div className="rounded-xl border border-[#1a2a1a] bg-[#0d150d] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-lime-400" />
            <h2 className="text-white font-semibold text-sm">Recent Bookings</h2>
          </div>
          {bookingsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : !recentBookings || recentBookings.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">No bookings yet</p>
          ) : (
            <div className="space-y-2">
              {recentBookings.map((item) => {
                const cfg = statusConfig[item.booking.status as keyof typeof statusConfig] ?? statusConfig.confirmed;
                return (
                  <div
                    key={item.booking.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/3 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-white text-xs font-medium truncate">
                        {item.user.name ?? "Unknown"}
                      </span>
                      <span className="text-gray-400 text-xs truncate">{item.trip.title}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-lime-400 text-xs font-semibold">
                        ${parseFloat(String(item.booking.totalPrice)).toFixed(0)}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.color}`}
                      >
                        {cfg.label}
                      </span>
                      <span className="text-gray-500 text-xs hidden sm:block">
                        {format(new Date(item.booking.bookedAt), "MMM d")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
