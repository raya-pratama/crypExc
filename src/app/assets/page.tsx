'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function AssetsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [prices, setPrices] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const fetchAssetsData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*, user_assets(*)')
        .eq('id', session.user.id)
        .single();

      if (profileData) {
        setProfile(profileData);

        // Hanya ambil koin yang jumlahnya > 0
        const activeAssets = profileData.user_assets.filter((a: any) => Number(a.amount) > 0);
        const symbols = activeAssets.map((a: any) => a.symbol).join(',');

        if (symbols) {
          const res = await fetch(`https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${symbols}&tsyms=USD`);
          const priceData = await res.json();
          setPrices(priceData.RAW);
        }
      }
    } catch (err) {
      console.error("Error fetching assets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchAssetsData();
    const interval = setInterval(fetchAssetsData, 15000); // Update harga tiap 15 detik
    return () => clearInterval(interval);
  }, []);

  const calculateTotalValue = () => {
    if (!profile?.user_assets || !prices) return 0;
    return profile.user_assets.reduce((acc: number, asset: any) => {
      const currentPrice = prices[asset.symbol]?.USD?.PRICE || 0;
      return acc + (Number(asset.amount) * currentPrice);
    }, 0);
  };

  const totalPortfolio = calculateTotalValue();

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-[#0b0e11] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0b0e11] text-white p-4 md:p-10 lg:p-16">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER & PORTFOLIO SUMMARY */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic bg-gradient-to-br from-white to-slate-600 bg-clip-text text-transparent">
              Assets
            </h1>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">Live Portfolio Tracking</p>
            </div>
          </div>

          <div className="w-full md:w-auto bg-[#1e2329] border border-slate-800 p-6 md:p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-3xl"></div>
            <p className="text-[10px] text-slate-500 font-black uppercase mb-2 tracking-widest">Estimated Balance</p>
            <h2 className="text-3xl md:text-4xl font-mono font-black text-blue-500">
              ${totalPortfolio.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h2>
          </div>
        </div>

        {/* ASSETS LIST */}
        <div className="bg-[#1e2329] border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            {/* TABLE - Visible on Desktop (md+) */}
            <table className="hidden md:table w-full text-left">
              <thead className="bg-[#161a1e] text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">
                <tr>
                  <th className="px-10 py-6">Asset</th>
                  <th className="px-6 py-6 text-center">Amount Owned</th>
                  <th className="px-6 py-6 text-center">Avg. Buy / Current</th>
                  <th className="px-10 py-6 text-right">Profit / Loss</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {profile?.user_assets?.filter((a: any) => Number(a.amount) > 0).map((asset: any) => {
                  const currentPrice = prices?.[asset.symbol]?.USD?.PRICE || 0;
                  const avgPrice = Number(asset.avg_buy_price) || 0;
                  const amount = Number(asset.amount) || 0;
                  const profitUSD = (currentPrice - avgPrice) * amount;
                  const profitPercent = avgPrice > 0 ? ((currentPrice - avgPrice) / avgPrice) * 100 : 0;
                  const isPositive = profitUSD >= 0;

                  return (
                    <tr key={asset.id} className="hover:bg-[#252a30]/50 transition-colors group">
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-[#0b0e11] rounded-2xl flex items-center justify-center font-black text-blue-500 border border-slate-800 group-hover:border-blue-500 transition-all">
                            {asset.symbol}
                          </div>
                          <span className="font-black text-lg uppercase tracking-tight">{asset.symbol}</span>
                        </div>
                      </td>
                      <td className="px-6 py-8 text-center">
                        <p className="font-mono font-black text-sm">{amount.toFixed(6)}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">≈ ${(amount * currentPrice).toLocaleString()}</p>
                      </td>
                      <td className="px-6 py-8 text-center space-y-1">
                        <p className="text-[10px] text-slate-500 font-bold uppercase italic">Avg: ${avgPrice.toLocaleString()}</p>
                        <p className="font-mono text-sm font-black text-white">${currentPrice.toLocaleString()}</p>
                      </td>
                      <td className="px-10 py-8 text-right">
                        <div className={`font-mono font-black text-lg ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                          {isPositive ? '+' : ''}${Math.abs(profitUSD).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <div className={`text-[10px] font-black uppercase mt-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                           {isPositive ? '▲' : '▼'} {Math.abs(profitPercent).toFixed(2)}%
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* CARDS - Visible on Mobile (block md:hidden) */}
            <div className="md:hidden divide-y divide-slate-800/50">
              {profile?.user_assets?.filter((a: any) => Number(a.amount) > 0).map((asset: any) => {
                const currentPrice = prices?.[asset.symbol]?.USD?.PRICE || 0;
                const avgPrice = Number(asset.avg_buy_price) || 0;
                const amount = Number(asset.amount) || 0;
                const profitUSD = (currentPrice - avgPrice) * amount;
                const profitPercent = avgPrice > 0 ? ((currentPrice - avgPrice) / avgPrice) * 100 : 0;
                const isPositive = profitUSD >= 0;

                return (
                  <div key={asset.id} className="p-6 space-y-5">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#0b0e11] rounded-xl flex items-center justify-center font-black text-[10px] text-blue-500 border border-slate-800">
                          {asset.symbol}
                        </div>
                        <span className="font-black text-base uppercase">{asset.symbol}</span>
                      </div>
                      <div className="text-right">
                         <div className={`text-xs font-black px-3 py-1 rounded-full ${isPositive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                            {isPositive ? '▲' : '▼'} {Math.abs(profitPercent).toFixed(2)}%
                         </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[#0b0e11]/40 p-4 rounded-2xl border border-slate-800/50">
                        <p className="text-[8px] text-slate-500 font-black uppercase mb-1">Holding</p>
                        <p className="font-mono text-xs font-bold">{amount.toFixed(6)}</p>
                        <p className="text-[9px] text-slate-600 font-bold mt-1">≈ ${(amount * currentPrice).toLocaleString()}</p>
                      </div>
                      <div className="bg-[#0b0e11]/40 p-4 rounded-2xl border border-slate-800/50">
                        <p className="text-[8px] text-slate-500 font-black uppercase mb-1">P/L (USD)</p>
                        <p className={`font-mono text-xs font-black ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                          {isPositive ? '+' : '-'}${Math.abs(profitUSD).toLocaleString()}
                        </p>
                        <p className="text-[9px] text-slate-600 font-bold mt-1">Avg: ${avgPrice.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* EMPTY STATE */}
            {(!profile?.user_assets || profile.user_assets.filter((a: any) => Number(a.amount) > 0).length === 0) && (
              <div className="py-32 text-center px-10">
                <p className="text-slate-600 font-black uppercase text-xs tracking-[0.3em] italic">No active assets found</p>
                <Link href="/marketList" className="mt-6 inline-block bg-blue-600 px-10 py-4 rounded-2xl font-black text-[10px] uppercase hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/20">
                  Buy Some Crypto
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* BACK BUTTON */}
        <div className="mt-12 text-center">
          {/* <Link href="/" className="text-[10px] font-black text-slate-600 hover:text-white uppercase tracking-[0.4em] transition-colors">
            &larr; Return to market overview
          </Link> */}
        </div>

      </div>
    </main>
  );
}