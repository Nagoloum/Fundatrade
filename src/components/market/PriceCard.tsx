export default function PriceCard({ data, asset }: any) {
  const isPositive = data.change24h >= 0;
  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
      <h2 className="text-gray-400 text-sm mb-1">{data.name}</h2>
      <div className="text-4xl font-bold text-white">${data.price?.toLocaleString()}</div>
      <div className={`text-sm mt-1 ${isPositive ? "text-green-400" : "text-red-400"}`}>
        {isPositive ? "▲" : "▼"} {Math.abs(data.change24h)?.toFixed(2)}% (24h)
      </div>
      {data.high24h && (
        <div className="flex gap-4 mt-3 text-xs text-gray-500">
          <span>H: ${data.high24h?.toLocaleString()}</span>
          <span>L: ${data.low24h?.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}