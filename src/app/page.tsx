'use client';

import { useEffect, useState } from 'react';

export default function CryptoMarket() {
  const [prices, setPrices] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchPrices = async () => {
    try {
      // Mengambil data dari CoinGecko (Jalur HTTP Standar - Aman dari blokir)
      const res = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd'
      );
      const data = await res.json();
      setPrices(data);
      setLoading(false);
    } catch (err) {
      console.error("Gagal mengambil data dari CoinGecko:", err);
    }
  };

  useEffect(() => {
    fetchPrices();
    // Auto-refresh setiap 30 detik (Polling)
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  const coins = [
    { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', color: 'text-orange-500' },
    { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', color: 'text-blue-400' },
    { id: 'solana', name: 'Solana', symbol: 'SOL', color: 'text-purple-500' },
  ];

  return (
    <main className="min-h-screen bg-[#0f172a] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">Market <span className="text-blue-500">Live</span></h1>
            <p className="text-slate-400 mt-2 text-sm font-mono">Powered by CoinGecko REST API v3</p>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20 animate-pulse">
              ● System Online
            </span>
          </div>
        </div>

        <div className="grid gap-4">
          {coins.map((coin) => (
            <div key={coin.id} className="bg-[#1e293b] border border-slate-700/50 p-6 rounded-2xl flex justify-between items-center hover:border-blue-500/50 transition-all cursor-pointer">
              <div className="flex items-center gap-4">
                <div className={`text-2xl font-bold ${coin.color}`}>{coin.symbol}</div>
                <div>
                  <div className="font-semibold text-lg">{coin.name}</div>
                  <div className="text-slate-500 text-xs uppercase tracking-widest">Global Price</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-mono font-bold">
                  {loading ? '---' : `$${prices?.[coin.id]?.usd.toLocaleString()}`}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Updated every 30s</div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Footer info untuk Portofolio */}
        <footer className="mt-12 pt-8 border-t border-slate-800 flex justify-between text-[10px] text-slate-500 uppercase tracking-widest">
          <span>Net-Eng Optimized Architecture</span>
          <span>Latency: ~200ms</span>
        </footer>
      </div>
    </main>
  );
}