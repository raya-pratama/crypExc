'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

// Daftar 10 Koin Sakti
const COIN_LIST = [
  { sym: 'BTC', name: 'Bitcoin', slug: 'bitcoin' },
  { sym: 'ETH', name: 'Ethereum', slug: 'ethereum' },
  { sym: 'SOL', name: 'Solana', slug: 'solana' },
  { sym: 'DOGE', name: 'Dogecoin', slug: 'dogecoin' },
  { sym: 'ADA', name: 'Cardano', slug: 'cardano' },
  { sym: 'DOT', name: 'Polkadot', slug: 'polkadot' },
  { sym: 'MATIC', name: 'Polygon', slug: 'polygon' },
  { sym: 'XRP', name: 'Ripple', slug: 'ripple' },
  { sym: 'LTC', name: 'Litecoin', slug: 'litecoin' },
  { sym: 'LINK', name: 'Chainlink', slug: 'chainlink' },
];

export default function MarketListPage() {
  const [prices, setPrices] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [amountInputs, setAmountInputs] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      // 1. Ambil Data 10 Koin sekaligus
      const symbols = COIN_LIST.map(c => c.sym).join(',');
      const res = await fetch(`https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${symbols}&tsyms=USD`);
      const data = await res.json();
      if (data.RAW) setPrices(data.RAW);

      // 2. Ambil Profile & Assets User
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: p } = await supabase
          .from('profiles')
          .select('*, user_assets(*)')
          .eq('id', session.user.id)
          .single();
        if (p) setProfile(p);
      }
    } catch (err) {
      console.error("Fetch Market Error:", err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleInputChange = (sym: string, value: string) => {
    setAmountInputs(prev => ({ ...prev, [sym]: value }));
  };

  const handleQuickBuy = async (sym: string, price: number) => {
    const amountUSD = parseFloat(amountInputs[sym]);
    if (!profile) return alert("Silahkan login dulu!");
    if (!amountUSD || amountUSD <= 0) return alert("Masukkan jumlah USD!");
    if (profile.balance_usd < amountUSD) return alert("Saldo USD tidak cukup!");

    setLoading(sym);
    const cryptoAmount = amountUSD / price;
    const newBalance = profile.balance_usd - amountUSD;

    // Update DB
    const { error: pErr } = await supabase.from('profiles').update({ balance_usd: newBalance }).eq('id', profile.id);
    
    const currentAsset = profile.user_assets?.find((a: any) => a.symbol === sym);
    const { error: aErr } = await supabase.from('user_assets').upsert({
      user_id: profile.id,
      symbol: sym,
      amount: (currentAsset?.amount || 0) + cryptoAmount
    }, { onConflict: 'user_id,symbol' });

    if (!pErr && !aErr) {
      alert(`Berhasil beli ${cryptoAmount.toFixed(6)} ${sym}!`);
      setAmountInputs(prev => ({ ...prev, [sym]: '' }));
      fetchData();
    } else {
      alert("Terjadi kesalahan transaksi.");
    }
    setLoading(null);
  };

  return (
    <main className="min-h-screen bg-[#0b0e11] text-white p-4 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header & Stats Ringkas */}
        <div className="flex justify-between items-end border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tighter">MARKET LIST</h1>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Real-time Crypto Prices</p>
          </div>
          <div className="text-right bg-[#1e2329] p-3 rounded-xl border border-slate-800">
            <p className="text-[10px] text-slate-500 font-bold uppercase">Your Balance</p>
            <p className="text-xl font-mono font-black text-green-500">
              ${profile?.balance_usd?.toLocaleString() || '0.00'}
            </p>
          </div>
        </div>

        {/* Desktop Table Header */}
        <div className="hidden md:grid grid-cols-5 px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
          <div className="col-span-2">Asset Name</div>
          <div>Price (USDT)</div>
          <div>24h Change</div>
          <div className="text-right">Quick Trade</div>
        </div>

        {/* Coin List Items */}
        <div className="space-y-3">
          {COIN_LIST.map((coin) => {
            const data = prices?.[coin.sym]?.USD;
            if (!data) return null;

            const isPositive = data.CHANGEPCT24HOUR >= 0;

            return (
              <div key={coin.sym} className="bg-[#1e2329] border border-slate-800 hover:border-slate-600 rounded-2xl p-4 md:p-6 transition-all group shadow-lg">
                <div className="grid grid-cols-1 md:grid-cols-5 items-center gap-4">
                  
                  {/* Name & Icon */}
                  <Link href={`/market/${coin.slug}`} className="col-span-2 flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-900 rounded-full flex items-center justify-center font-black text-white shadow-lg group-hover:scale-110 transition-transform">
                      {coin.sym.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-black text-lg group-hover:text-blue-400 transition-colors uppercase">{coin.name}</h3>
                      <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-bold">{coin.sym}/USDT</span>
                    </div>
                  </Link>

                  {/* Price */}
                  <div className="flex flex-col">
                    <span className="md:hidden text-[10px] text-slate-500 font-bold uppercase">Price</span>
                    <span className="font-mono font-black text-lg">${data.PRICE.toLocaleString()}</span>
                  </div>

                  {/* 24h Change */}
                  <div className="flex flex-col">
                    <span className="md:hidden text-[10px] text-slate-500 font-bold uppercase">Change</span>
                    <span className={`font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                      {isPositive ? '▲' : '▼'} {Math.abs(data.CHANGEPCT24HOUR).toFixed(2)}%
                    </span>
                  </div>

                  {/* Quick Trade Input & Button */}
                  <div className="flex items-center gap-2 md:justify-end border-t md:border-none border-slate-800 pt-4 md:pt-0">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500">$</span>
                      <input 
                        type="number" 
                        value={amountInputs[coin.sym] || ''}
                        onChange={(e) => handleInputChange(coin.sym, e.target.value)}
                        placeholder="0.00"
                        className="bg-[#0b0e11] border border-slate-700 w-28 pl-6 pr-3 py-2.5 rounded-xl text-xs font-mono outline-none focus:border-blue-500 transition-all"
                      />
                    </div>
                    <button 
                      onClick={() => handleQuickBuy(coin.sym, data.PRICE)}
                      disabled={loading === coin.sym}
                      className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white px-6 py-2.5 rounded-xl text-xs font-black transition-all active:scale-95 shadow-lg shadow-blue-900/20"
                    >
                      {loading === coin.sym ? '...' : 'BUY'}
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

      </div>
    </main>
  );
}