'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      // Ambil data profile dan wallet dari tabel profiles
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;
      setProfile({ ...data, email: session.user.email });
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0e11] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0b0e11] text-white p-6 md:p-12 lg:p-20 pb-32 md:pb-12">
      <div className="max-w-2xl mx-auto">
        
        {/* Header Section */}
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-4xl font-black tracking-tighter uppercase italic bg-gradient-to-r from-white to-slate-500 bg-clip-text text-transparent">
            User Profile
          </h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2">
            Account Management & Wallet
          </p>
        </div>

        {/* Profile Card */}
        <div className="relative group">
          {/* Background Glow Effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
          
          <div className="relative bg-[#1e2329] border border-slate-800 rounded-[2.5rem] p-8 md:p-12 shadow-2xl overflow-hidden">
            
              <div className="flex flex-col items-center md:items-start gap-6 mb-10">
            {/* Avatar Section
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center text-4xl shadow-2xl border-4 border-[#0b0e11]">
                👤
              </div> */}
              <div className="text-center md:text-left">
                <h2 className="text-2xl font-black tracking-tight">{profile?.username || 'Trader'}</h2>
                <p className="text-slate-400 font-mono text-sm">{profile?.email}</p>
              </div>
            </div>

            {/* Wallet Info Container */}
            <div className="grid grid-cols-1 gap-4 mb-10">
              <div className="bg-[#0b0e11]/50 border border-slate-800 p-6 rounded-3xl relative overflow-hidden group/wallet">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl group-hover/wallet:bg-blue-500/10 transition-all"></div>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2">Available Balance</p>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-mono font-black text-blue-400">
                    ${Number(profile?.balance_usd || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-slate-600 font-black text-xs mb-1.5 uppercase tracking-tighter">USD</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <Link 
                href="/topup" 
                className="w-full bg-white text-black font-black py-4 rounded-2xl text-[10px] uppercase tracking-[0.2em] hover:bg-slate-200 transition-all text-center"
              >
                Topup Balance
              </Link>
              
              <button 
                onClick={handleLogout}
                className="w-full bg-red-500/10 border border-red-500/20 text-red-500 font-black py-4 rounded-2xl text-[10px] uppercase tracking-[0.2em] hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-900/10"
              >
                Logout Account
              </button>
            </div>

          </div>
        </div>

        {/* Quick Links / Footer Info */}
        <div className="mt-8 flex justify-center gap-8">
          <Link href="/history" className="text-[9px] font-black text-slate-600 hover:text-blue-500 uppercase tracking-widest transition-all">
            View History
          </Link>
          <Link href="/assets" className="text-[9px] font-black text-slate-600 hover:text-blue-500 uppercase tracking-widest transition-all">
            My Assets
          </Link>
        </div>

      </div>
    </main>
  );
}