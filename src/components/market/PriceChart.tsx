"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function PriceChart({ data }: { data: any[] }) {
  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 h-[280px]">
      <h3 className="text-violet-400 mb-3 text-sm font-semibold">📈 Historique 30 jours</h3>
      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={data}>
          <XAxis dataKey="date" stroke="#555" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
          <YAxis stroke="#555" tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
          <Tooltip contentStyle={{ background: "#111", border: "1px solid #7c3aed", borderRadius: "8px" }} />
          <Line type="monotone" dataKey="price" stroke="#8b5cf6" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}