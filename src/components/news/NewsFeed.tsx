export default function NewsFeed({ news }: { news: any[] }) {
  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
      <h3 className="text-violet-400 font-semibold mb-3">📰 Actualités</h3>
      <div className="space-y-3">
        {news.slice(0, 4).map((item: any, i: number) => (
          <a key={i} href={item.url} target="_blank" rel="noopener noreferrer"
            className="block text-xs text-gray-400 hover:text-violet-400 transition-colors border-b border-gray-800 pb-2">
            <div className="text-gray-200 mb-1 line-clamp-2">{item.title}</div>
            <span className="text-gray-600">{item.source?.name} · {new Date(item.publishedAt).toLocaleDateString()}</span>
          </a>
        ))}
      </div>
    </div>
  );
}