export default function MacroPanel({ data }: any) {
  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
      <h3 className="text-violet-400 font-semibold mb-3">🌐 Macro Économie</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Taux Fed</span>
          <span className="text-white font-bold">{data.fedRate}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">CPI (Inflation)</span>
          <span className="text-white font-bold">{data.inflation}</span>
        </div>
      </div>
    </div>
  );
}