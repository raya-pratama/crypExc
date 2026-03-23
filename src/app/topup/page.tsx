'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAlert } from '@/context/AlertContext';

export default function TopupPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { showAlert } = useAlert();

  const fetchProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      setProfile(data);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleClaim = async () => {
    if (!profile) return;
    setLoading(true);

    try {
      const giftAmount = 100000;
      const newBalance = (profile.balance_usd || 0) + giftAmount;

      const { error } = await supabase
        .from('profiles')
        .update({ balance_usd: newBalance })
        .eq('id', profile.id);

      if (error) throw error;

      showAlert("BOOM! $100,000 USD ditambahkan ke akunmu!", 'success');
      router.push('/'); // Balik ke dashboard setelah dapet duit
    } catch (err) {
      showAlert("Gagal mengambil dana gratis.", 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0b0e11] text-white flex items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-green-600/10 blur-[120px] rounded-full"></div>

      <div className="max-w-md w-full z-10">
        <div className="bg-[#1e2329] border border-slate-800 rounded-[2.5rem] p-8 text-center shadow-2xl">
          
          <div className="w-20 h-20 bg-gradient-to-tr from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-yellow-900/20">
            <span className="text-4xl">💰</span>
          </div>

          <h1 className="text-3xl font-black tracking-tighter mb-2">WHALE STARTER PACK</h1>
          <p className="text-slate-500 text-sm font-medium mb-8">
            Butuh modal buat trading? Ambil <span className="text-white font-bold">$100,000</span> secara cuma-cuma sekarang juga!
          </p>

          <div className="space-y-4">
            <button
              onClick={handleClaim}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-blue-900/30"
            >
              {loading ? 'PROCESSING...' : 'CLAIM $100,000 USD'}
            </button>

            <Link href="/" className="block text-xs text-slate-500 font-bold hover:text-white transition-colors">
              Mungkin Nanti, Saya Sudah Kaya &rarr;
            </Link>
          </div>

          <div className="mt-10 pt-6 border-t border-slate-800/50">
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest leading-loose">
              Current Balance: <span className="text-green-500">${profile?.balance_usd?.toLocaleString() || '0'}</span>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}