'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function CryptoMarket() {
  const { id } = useParams();
  const [prices, setPrices] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  const fetchData = async () => {
    try {
      const symbols = "BTC,ETH,SOL,DOGE,ADA";
      const res = await fetch(`https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${symbols}&tsyms=USD`, { cache: 'no-store' });
      const data = await res.json();
      
      if (data.RAW) setPrices(data.RAW);

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*, user_assets(*)')
          .eq('id', session.user.id)
          .single();
        if (profileData) setProfile(profileData);
      }
    } catch (err) { 
      console.error("Fetch Error:", err); 
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [id]);

  return (
    <main className="min-h-screen bg-[#0b0e11] text-white p-4 md:p-10">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* SECTION 1: 3 KOIN REKOMENDASI (TOP) */}
        <div>
          <h2 className="text-[10px] font-black mb-4 text-slate-500 uppercase tracking-[0.3em]">Market Recommendation</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['BTC', 'ETH', 'SOL'].map((sym) => {
              const data = prices?.[sym]?.USD;
              if (!data) return null;
              const isPositive = data.CHANGEPCT24HOUR >= 0;

              return (
                <Link href={`/market/${sym === 'BTC' ? 'bitcoin' : sym === 'ETH' ? 'ethereum' : 'solana'}`} key={sym} 
                      className="bg-[#1e2329] p-6 rounded-2xl border border-slate-800 hover:border-blue-500 transition-all group relative overflow-hidden">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-black text-xl group-hover:text-blue-400 transition-colors">{sym}/USDT</span>
                    <span className={`text-[10px] font-black px-2 py-1 rounded-md ${isPositive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                      {isPositive ? '▲' : '▼'} {Math.abs(data.CHANGEPCT24HOUR).toFixed(2)}%
                    </span>
                  </div>
                  <div className="text-3xl font-mono font-black tracking-tighter">${data.PRICE.toLocaleString()}</div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: GRID UTAMA (MARKET LIST & WALLET) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* WALLET STATUS (DI ATAS PADA MOBILE, DI KANAN PADA DESKTOP) */}
          {/* order-first membuat ini muncul paling atas di HP, lg:order-last memindahkannya ke kanan di PC */}
          <aside className="order-first lg:order-last lg:col-span-1  top-8">
            <div className="bg-[#1e2329] border border-slate-800 p-6 rounded-3xl shadow-2xl">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Wallet Status</h2>
              </div>
              
              <Link href="/topup">
                <div className="relative overflow-hidden p-6 bg-gradient-to-br from-[#161a1e] to-[#0b0e11] rounded-2xl border border-slate-800 hover:border-blue-500/50 transition-all group active:scale-95 shadow-inner">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-[40px] rounded-full group-hover:bg-blue-600/10 transition-colors"></div>
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest group-hover:text-blue-400 transition-colors">Available Balance</p>
                      <span className="text-[9px] bg-blue-600 text-white px-2 py-1 rounded font-black uppercase tracking-tighter shadow-lg shadow-blue-900/40 transition-transform group-hover:scale-110">Topup</span>
                    </div>
                    <h2 className="text-3xl font-mono font-black text-white leading-none break-all">
                      ${profile?.balance_usd?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                    </h2>
                    <p className="mt-6 text-[9px] text-slate-600 font-bold uppercase tracking-widest group-hover:text-slate-400 transition-colors">Click to add funds &rarr;</p>
                  </div>
                </div>
              </Link>

              <div className="mt-6 px-2">
                <p className="text-[9px] text-slate-500 font-medium italic leading-relaxed">*Instant deposit active. Secured with 256-bit encryption.</p>
              </div>
            </div>
          </aside>

          {/* MARKET LIST (DI KIRI PADA DESKTOP, DI BAWAH WALLET PADA MOBILE) */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Trending Coin</h2>
            
            <div className="space-y-3">
              {prices && Object.keys(prices).map((sym) => {
                const data = prices[sym].USD;
                const coinNames: any = { BTC: 'Bitcoin', ETH: 'Ethereum', SOL: 'Solana', DOGE: 'Dogecoin', ADA: 'Cardano' };
                const slugs: any = { BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana', DOGE: 'dogecoin', ADA: 'cardano' };

                return (
                  <Link href={`/market/${slugs[sym]}`} key={sym} 
                        className="bg-[#1e2329] border border-slate-800 p-5 rounded-2xl flex items-center justify-between hover:bg-[#252a30] transition-all group border-l-2 border-l-transparent hover:border-l-blue-500 shadow-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#0b0e11] rounded-2xl flex items-center justify-center font-black text-blue-500 border border-slate-800 group-hover:border-blue-500/30 transition-all">
                        {sym}
                      </div>
                      <div>
                        <p className="font-black text-lg tracking-tighter uppercase">{coinNames[sym]}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase">{slugs[sym]}/USDT</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-mono font-black text-lg tracking-tighter">${data.PRICE.toLocaleString()}</p>
                      <p className={`text-[10px] font-black ${data.CHANGEPCT24HOUR >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {data.CHANGEPCT24HOUR >= 0 ? '▲' : '▼'} {Math.abs(data.CHANGEPCT24HOUR).toFixed(2)}%
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}