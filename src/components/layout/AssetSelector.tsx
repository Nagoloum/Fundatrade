import { Asset } from "@/types";

const ASSETS: Asset[] = ["BTC", "ETH", "SOL", "XAUUSD"];

export default function AssetSelector({ selected, onSelect }: { selected: Asset; onSelect: (a: Asset) => void }) {
  return (
    <div className="flex gap-3">
      {ASSETS.map((a) => (
        <button
          key={a}
          onClick={() => onSelect(a)}
          className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
            selected === a
              ? "bg-violet-600 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          {a}
        </button>
      ))}
    </div>
  );
}