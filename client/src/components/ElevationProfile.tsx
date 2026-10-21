import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { elevationSeries, type RoutePoint } from "@/lib/trailMath";

/** Area chart of elevation (m) against distance (km) along a route. */
export default function ElevationProfile({ points }: { points: RoutePoint[] }) {
  const data = elevationSeries(points);
  if (data.length < 2) {
    return <div className="flex h-36 items-center justify-center rounded-2xl bg-white text-xs text-[#8a938c]">No elevation data for this route yet.</div>;
  }
  return (
    <div className="h-40 rounded-2xl bg-white p-3">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id="eleFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#b8d435" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#b8d435" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <XAxis dataKey="km" tick={{ fontSize: 10, fill: "#8a938c" }} tickFormatter={(v) => `${v} km`} minTickGap={30} />
          <YAxis dataKey="ele" tick={{ fontSize: 10, fill: "#8a938c" }} tickFormatter={(v) => `${v}`} domain={["dataMin - 20", "dataMax + 20"]} width={48} />
          <Tooltip formatter={(value: number) => [`${value} m`, "Elevation"]} labelFormatter={(label) => `${label} km`} />
          <Area type="monotone" dataKey="ele" stroke="#8fb31c" strokeWidth={2} fill="url(#eleFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
