import { Prediction } from "@/types";

export default function PredictionCard({ prediction, currentPrice }: { prediction: Prediction; currentPrice: number }) {
  const colorMap = {
    BULLISH: "text-green-400",
    BEARISH: "text-red-400",
    NEUTRAL: "text-yellow-400",
  };

  const priceDiff = ((prediction.targetPrice - currentPrice) / currentPrice * 100).toFixed(2);

  return (
    <div className="bg-gray-900 border border-violet-800 rounded-xl p-5">
      <h3 className="text-violet-400 font-semibold mb-3">🧠 Prédiction IA</h3>

      <div className={`text-2xl font-bold mb-1 ${colorMap[prediction.direction]}`}>
        {prediction.direction}
      </div>

      <div className="text-gray-300 mb-1">
        Prix cible : <span className="text-white font-bold">${prediction.targetPrice.toLocaleString()}</span>
        <span className={`ml-2 text-sm ${parseFloat(priceDiff) >= 0 ? "text-green-400" : "text-red-400"}`}>
          ({priceDiff}%)
        </span>
      </div>

      <div className="mb-4">
        <div className="text-gray-400 text-sm mb-1">Confiance : {prediction.confidence}%</div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="bg-violet-500 h-2 rounded-full transition-all"
            style={{ width: `${prediction.confidence}%` }}
          />
        </div>
      </div>

      <div className="text-xs text-gray-500">⏱ Horizon : {prediction.timeframe}</div>

      <div className="mt-3 space-y-1">
        {prediction.reasoning.map((r: string, i: number) => (
          <div key={i} className="text-xs text-gray-400">• {r}</div>
        ))}
      </div>
    </div>
  );
}