'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useAlert } from '@/context/AlertContext';

export default function CoinDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [coinData, setCoinData] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [amountInput, setAmountInput] = useState<string>(''); 
  const [type, setType] = useState<'BUY' | 'SELL'>('BUY');
  const [loading, setLoading] = useState<string | null>(null);
  const { showAlert } = useAlert();
  
  // const currentSymbol = (id as string) === 'bitcoin' ? 'BTC' : 
  //                       (id as string) === 'ethereum' ? 'ETH' : 
  //                       (id as string) === 'solana' ? 'SOL' :
  //                       (id as string) === 'dogecoin' ? 'DOGE' :
  //                       (id as string) === 'cardano' ? 'ADA' :
  //                       (id as string) === 'polkadot' ? 'DOT' :
  //                       (id as string) === 'polygon' ? 'MATIC' :
  //                       (id as string) === 'ripple' ? 'XRP' :
  //                       (id as string) === 'litecoin' ? 'LTC' :
  //                       (id as string) === 'chainlink' ? 'LINK' : '';
  //                       (id as string)?.toUpperCase();
  // Mapping Simbol yang Benar
  const getSymbol = (coinId: string) => {
    const map: { [key: string]: string } = {
      'bitcoin': 'BTC',
      'ethereum': 'ETH',
      'solana': 'SOL',
      'dogecoin': 'DOGE',
      'cardano': 'ADA',
      'ripple': 'XRP',
      'polkadot': 'DOT',
      'polygon': 'MATIC',
      'litecoin': 'LTC',
      'chainlink': 'LINK',
    };
    return map[coinId.toLowerCase()] || coinId.toUpperCase();
  };

  const currentSymbol = id ? getSymbol(id as string) : '';

  const fetchData = async () => {
    if (!currentSymbol) return;
    try {
      const res = await fetch(`https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${currentSymbol}&tsyms=USD`);
      const data = await res.json();
      if (data.RAW && data.RAW[currentSymbol]) {
        setCoinData(data.RAW[currentSymbol].USD);
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        const { data: p } = await supabase.from('profiles').select('*, user_assets(*)').eq('id', session.user.id).single();
        if (p) setProfile(p);
      }
    } catch (err) {
      console.error("Gagal load data:", err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000); 
    return () => clearInterval(interval);
  }, [id, currentSymbol]);

  // Widget TradingView (Optimasi Responsif)
  useEffect(() => {
    if (!id) return;
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if ((window as any).TradingView) {
        new (window as any).TradingView.widget({
          "autosize": true,
          "symbol": `BINANCE:${currentSymbol}USDT`,
          "interval": "15",
          "theme": "dark",
          "style": "1",
          "locale": "id",
          "hide_top_toolbar": true,
          "container_id": "tradingview_chart"
        });
      }
    };
    document.head.appendChild(script);
  }, [id, currentSymbol]);

  const myCoinAmount = profile?.user_assets?.find((a: any) => a.symbol === currentSymbol)?.amount || 0;
  const currentPrice = coinData?.PRICE || 0; 
  const change24h = coinData?.CHANGEPCT24HOUR || 0;
  const isPositive = change24h >= 0;
  const numericAmount = parseFloat(amountInput) || 0;
  const estimatedCostUSD = type === 'BUY' ? numericAmount : numericAmount * currentPrice;
  const estimatedCoinGet = type === 'BUY' ? (numericAmount / currentPrice) : numericAmount;

  const handleExecuteTransaction = async (type: 'BUY' | 'SELL', sym: string, currentPrice: number, inputAmount: number) => {
  // 1. Validasi Login
  if (!profile || !user) return alert("Silahkan login terlebih dahulu");
  if (inputAmount <= 0) return alert("Masukkan nominal yang valid!");

  setLoading(sym);

  try {
    const currentAsset = profile.user_assets?.find((a: any) => a.symbol === sym);
    const oldAmount = currentAsset?.amount || 0;
    const oldAvgPrice = currentAsset?.avg_buy_price || 0;

    let newBalanceUSD = profile.balance_usd;
    let newTotalAmount = oldAmount;
    let newAvgPrice = oldAvgPrice;
    let amountCoinTransacted = 0;
    let amountUSDTransacted = 0;

    if (type === 'BUY') {
      // --- LOGIKA BELI ---
      amountUSDTransacted = inputAmount;
      amountCoinTransacted = amountUSDTransacted / currentPrice;

      if (newBalanceUSD < amountUSDTransacted) throw new Error("Saldo USD tidak cukup!");

      newBalanceUSD -= amountUSDTransacted;
      newTotalAmount = oldAmount + amountCoinTransacted;
      
      // Update harga rata-rata beli (Weighted Average)
      newAvgPrice = ((oldAmount * oldAvgPrice) + amountUSDTransacted) / newTotalAmount;

    } else {
      // --- LOGIKA JUAL ---
      amountCoinTransacted = inputAmount;
      amountUSDTransacted = amountCoinTransacted * currentPrice;

      if (oldAmount < amountCoinTransacted) throw new Error(`Saldo ${sym} tidak cukup untuk dijual!`);

      newBalanceUSD += amountUSDTransacted;
      newTotalAmount = oldAmount - amountCoinTransacted;
      
    }

    // --- EKSEKUSI DATABASE ---

    // A. Update Saldo USD
    const { error: pErr } = await supabase
      .from('profiles')
      .update({ balance_usd: newBalanceUSD })
      .eq('id', user.id);
    if (pErr) throw pErr;

    // B. Update Aset (Upsert)
    const { error: aErr } = await supabase
      .from('user_assets')
      .upsert({ 
        user_id: user.id, 
        symbol: sym, 
        amount: newTotalAmount,
        avg_buy_price: newAvgPrice 
      }, { onConflict: 'user_id,symbol' });
    if (aErr) throw aErr;

    // C. Catat ke History Transaksi
    const { error: tErr } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        symbol: sym,
        type: type, // Akan masuk sebagai 'BUY' atau 'SELL'
        amount_coin: amountCoinTransacted,
        amount_usd: amountUSDTransacted,
        price_at: currentPrice
      });
    if (tErr) throw tErr;

    // 4. Finalisasi
    showAlert(`Berhasil ${type === 'BUY' ? 'Membeli' : 'Menjual'} ${sym}!`, 'success');
    
    // Reset input (sesuaikan dengan state koin di market list)
    if (typeof setAmountInput === 'function') setAmountInput(''); 
    fetchData(); 

  } catch (err: any) {
    console.error("Transaction Error:", err);
    showAlert("Gagal: " + err.message, 'error');
  } finally {
    setLoading(null);
  }
};

  return (
    <main className="min-h-screen bg-[#0b0e11] text-white p-2 md:p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        <Link href="/" className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-blue-500 transition mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Market List
        </Link>

        {/* MAIN LAYOUT: Stack di mobile, Grid di desktop */}
        <div className="flex flex-col lg:grid lg:grid-cols-4 gap-4">
          
          {/* LEFT COLUMN (Header & Chart) */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* RESPONSIVE HEADER */}
            <div className="bg-[#1e2329] p-4 md:p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 overflow-hidden">
              <div className="flex items-center justify-between md:justify-start gap-6">
                <h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase italic text-blue-500">{id}/USDT</h1>
                
                {/* Harga Mobile: Di sebelah kanan koin / Harga Desktop: Di sebelah kiri */}
                <div className="flex flex-col items-end md:items-start">
                  <span className={`text-xl md:text-2xl font-mono font-black ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                    ${currentPrice.toLocaleString()}
                  </span>
                  <span className={`text-[10px] md:text-sm font-black px-2 py-0.5 rounded bg-black/20 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {isPositive ? '▲' : '▼'} {Math.abs(change24h).toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Stats: Hidden di mobile sangat kecil, atau scrollable */}
              <div className="flex justify-between md:gap-8 overflow-x-auto pb-2 md:pb-0 text-[9px] md:text-[11px] text-slate-500 uppercase font-black tracking-wider border-t border-slate-800 pt-3 md:border-none md:pt-0">
                <div className="flex-shrink-0"><p>24h High</p><p className="text-white font-mono">${coinData?.HIGH24HOUR?.toLocaleString()}</p></div>
                <div className="flex-shrink-0 text-center"><p>24h Low</p><p className="text-white font-mono">${coinData?.LOW24HOUR?.toLocaleString()}</p></div>
                <div className="flex-shrink-0 text-right"><p>24h Vol</p><p className="text-white font-mono">${(coinData?.VOLUME24HOURTO / 1000000).toFixed(2)}M</p></div>
              </div>
            </div>

            {/* CHART: Tinggi fleksibel sesuai layar */}
            <div className="bg-[#1e2329] h-[400px] md:h-[550px] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl" id="tradingview_chart"></div>
          </div>

          {/* RIGHT COLUMN (Order Book / Trade) */}
          <div className="space-y-4">
            <div className="bg-[#1e2329] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl sticky top-4">
              <div className="flex text-center">
                <button onClick={() => { setType('BUY'); setAmountInput(''); }} className={`flex-1 p-4 font-black text-[10px] tracking-[0.2em] transition-all ${type === 'BUY' ? 'bg-[#2b3139] text-green-500 border-b-2 border-green-500' : 'bg-[#161a1e] text-slate-500'}`}>
                  BELI
                </button>
                <button onClick={() => { setType('SELL'); setAmountInput(''); }} className={`flex-1 p-4 font-black text-[10px] tracking-[0.2em] transition-all ${type === 'SELL' ? 'bg-[#2b3139] text-red-500 border-b-2 border-red-500' : 'bg-[#161a1e] text-slate-500'}`}>
                  JUAL
                </button>
              </div>

              <div className="p-5 flex flex-col gap-5">
                {/* Info Saldo */}
                <div className="space-y-1">
                  <div className="flex justify-between items-end">
                    <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Available Balance</span>
                    <button 
                      onClick={() => setAmountInput(type === 'BUY' ? profile?.balance_usd?.toString() : myCoinAmount.toString())}
                      className="text-[9px] font-black text-blue-500 hover:text-blue-400"
                    >
                      MAX
                    </button>
                  </div>
                  <p className="text-sm text-white font-mono font-black bg-[#0b0e11] p-3 rounded-xl border border-slate-800">
                    {type === 'BUY' ? `$${profile?.balance_usd?.toLocaleString() || '0'}` : `${myCoinAmount.toFixed(6)} ${currentSymbol}`}
                  </p>
                </div>

                {/* Input Amount */}
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 font-black uppercase tracking-widest ml-1">
                    Amount to {type === 'BUY' ? 'Spend (USD)' : `Sell (${currentSymbol})`}
                  </label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={amountInput} 
                      placeholder="0.00"
                      onChange={(e) => setAmountInput(e.target.value)}
                      className="w-full bg-[#0b0e11] border border-slate-700 focus:border-blue-500 p-4 rounded-xl text-sm font-mono outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Estimasi */}
                {numericAmount > 0 && (
                  <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl flex justify-between items-center">
                    <span className="text-[9px] text-blue-500 font-black uppercase">You Receive</span>
                    <span className="font-black text-xs font-mono text-white">
                      {type === 'BUY' ? `${estimatedCoinGet.toFixed(6)} ${currentSymbol}` : `$${estimatedCostUSD.toFixed(2)}`}
                    </span>
                  </div>
                )}

                <button 
                  onClick={() => handleExecuteTransaction(type, currentSymbol, currentPrice, numericAmount)}
                  disabled={!!loading || numericAmount <= 0}
                  className={`w-full py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 disabled:opacity-50 ${
                    type === 'BUY' ? 'bg-green-600 shadow-lg shadow-green-900/20' : 'bg-red-600 shadow-lg shadow-red-900/20'
                  }`}
                >
                  {loading ? 'Processing...' : `${type} ${currentSymbol}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}