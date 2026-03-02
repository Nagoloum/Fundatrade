export default function FundamentalCard({ data }: any) {
  const fmt = (n: number) => n >= 1e9 ? `$${(n / 1e9).toFixed(1)}B` : `$${(n / 1e6).toFixed(1)}M`;
  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
      <h3 className="text-violet-400 font-semibold mb-3">📊 Fondamentaux</h3>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div><div className="text-gray-500 text-xs">Market Cap</div><div className="text-white font-bold">{fmt(data.marketCap)}</div></div>
        <div><div className="text-gray-500 text-xs">Volume 24h</div><div className="text-white font-bold">{fmt(data.volume24h)}</div></div>
        <div><div className="text-gray-500 text-xs">Supply en circulation</div><div className="text-white font-bold">{(data.circulatingSupply / 1e6).toFixed(2)}M</div></div>
        <div><div className="text-gray-500 text-xs">FDV</div><div className="text-white font-bold">{data.fullyDilutedValuation ? fmt(data.fullyDilutedValuation) : "—"}</div></div>
      </div>
    </div>
  );
}