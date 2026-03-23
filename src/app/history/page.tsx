'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function HistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const fetchHistory = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // 1. Ambil SEMUA data untuk proses cleanup (sisakan 10 saja)
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        // 2. LOGIKA CLEANUP: Jika lebih dari 10, hapus sisanya dari database
        if (data.length > 10) {
          const keepData = data.slice(0, 10);
          const deleteIds = data.slice(10).map(d => d.id);

          await supabase.from('transactions').delete().in('id', deleteIds);
          setHistory(keepData);
        } else {
          setHistory(data);
        }
      }
    } catch (err) {
      console.error("Error history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchHistory();
  }, []);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-[#0b0e11] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">Loading History...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0b0e11] text-white p-4 md:p-10 lg:p-16">
      <div className="max-w-5xl mx-auto">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic bg-gradient-to-r from-white to-slate-500 bg-clip-text text-transparent">
              Order History
            </h1>
            <p className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-[0.4em]">
              Showing last 10 activities
            </p>
          </div>
          {/* <Link href="/" className="group flex items-center gap-2 bg-[#1e2329] border border-slate-800 px-6 py-3 rounded-2xl text-[10px] font-black hover:border-blue-500 transition-all uppercase tracking-widest">
            <span className="group-hover:-translate-x-1 transition-transform">&larr;</span> Back to Market
          </Link> */}
        </div>

        {history.length === 0 ? (
          <div className="py-24 text-center bg-[#1e2329]/50 rounded-[2.5rem] border border-dashed border-slate-800 backdrop-blur-sm">
            <div className="text-slate-600 font-black uppercase text-xs tracking-widest italic">Zero transactions detected</div>
            <Link href="/marketList" className="mt-4 inline-block text-blue-500 text-[10px] font-black uppercase hover:underline">Start Trading Now &rarr;</Link>
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* DESKTOP TABLE HEADER (Hidden on Mobile) */}
            <div className="hidden md:grid grid-cols-5 px-10 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800/50">
              <div>Time & Asset</div>
              <div className="text-center">Type</div>
              <div className="text-center">Execution Price</div>
              <div className="text-center">Amount</div>
              <div className="text-right">Total USD</div>
            </div>

            {/* TRANSACTION LIST */}
            <div className="space-y-4">
              {history.map((tx) => {
                const isBuy = tx.type === 'BUY';
                
                // MAPPING DATA SESUAI KODE AWALMU
                const coinAmount = Number(tx.amount_coin) || 0;
                const priceAt = Number(tx.price_at) || 0;
                const usdAmount = Number(tx.amount_usd) || 0;

                return (
                  <div key={tx.id} className="relative group bg-[#1e2329] border border-slate-800 rounded-[1.5rem] p-6 md:px-10 md:py-7 hover:border-blue-500/50 transition-all shadow-xl overflow-hidden">
                    {/* Background Glow Effect */}
                    <div className={`absolute top-0 left-0 w-1 h-full ${isBuy ? 'bg-green-500' : 'bg-red-500'}`} />
                    
                    {/* DESKTOP VIEW */}
                    <div className="hidden md:grid grid-cols-5 items-center gap-4 relative">
                      <div className="space-y-1">
                        <p className="font-black text-sm uppercase tracking-tight">{tx.symbol}</p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {new Date(tx.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="text-center">
                        <span className={`text-[9px] font-black px-3 py-1 rounded-full border ${isBuy ? 'border-green-500/30 text-green-500 bg-green-500/5' : 'border-red-500/30 text-red-500 bg-red-500/5'}`}>
                          {tx.type}
                        </span>
                      </div>
                      <div className="text-center font-mono text-xs font-bold text-slate-400">
                        ${priceAt.toLocaleString()}
                      </div>
                      <div className="text-center font-mono text-sm font-black italic">
                        {coinAmount.toFixed(6)} <span className="text-[10px] text-slate-600">{tx.symbol}</span>
                      </div>
                      <div className="text-right font-mono text-lg font-black text-blue-400">
                        ${usdAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    {/* MOBILE VIEW (Card Layout) */}
                    <div className="md:hidden flex flex-col gap-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs border ${isBuy ? 'border-green-500/20 text-green-500 bg-green-500/5' : 'border-red-500/20 text-red-500 bg-red-500/5'}`}>
                            {tx.symbol.slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-black text-sm uppercase">{tx.symbol}</p>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">
                              {new Date(tx.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span className={`text-[9px] font-black px-3 py-1 rounded-lg ${isBuy ? 'bg-green-500 text-white shadow-lg shadow-green-900/20' : 'bg-red-500 text-white shadow-lg shadow-red-900/20'}`}>
                          {tx.type}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 bg-[#0b0e11]/50 p-4 rounded-2xl border border-slate-800/50">
                        <div className="space-y-1">
                          <p className="text-[8px] text-slate-500 font-black uppercase">Quantity</p>
                          <p className="font-mono text-xs font-bold">{coinAmount.toFixed(6)}</p>
                        </div>
                        <div className="space-y-1 text-right">
                          <p className="text-[8px] text-slate-500 font-black uppercase">Exec. Price</p>
                          <p className="font-mono text-xs font-bold">${priceAt.toLocaleString()}</p>
                        </div>
                        <div className="col-span-2 pt-3 border-t border-slate-800/50 flex justify-between items-end">
                          <p className="text-[10px] text-slate-500 font-black uppercase">Total Value</p>
                          <p className="font-mono text-lg font-black text-blue-400 leading-none">
                            ${usdAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* FOOTER INFO */}
        <div className="mt-12 text-center space-y-2">
           <div className="inline-block px-4 py-1 bg-blue-500/5 border border-blue-500/10 rounded-full">
              <p className="text-[9px] text-blue-500/70 font-black uppercase tracking-[0.2em]">
                Database auto-cleanup enabled: Keeping only top 10 rows
              </p>
           </div>
        </div>

      </div>
    </main>
  );
}