'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    getSession();
    return () => authListener.subscription.unsubscribe();
  }, []);

  const navLinks = [
    { name: 'Home', href: '/', icon: '🏠' },
    { name: 'Market', href: '/marketList', icon: '📊' }, // Pastikan href sesuai (tadi /marketList)
    { name: 'History', href: '/history', icon: '📜' },
    { name: 'Assets', href: '/assets', icon: '💰' },
    { name: 'User', href: user ? '/profile' : '/login', icon: '👤' },
  ];

  const activeIndex = navLinks.findIndex(link => link.href === pathname);
  const safeActiveIndex = activeIndex === -1 ? 0 : activeIndex;
  const tabWidthPercent = 100 / navLinks.length;
  const magicLeft = (safeActiveIndex * tabWidthPercent) + (tabWidthPercent / 2);

  return (
    <>
      {/* DESKTOP NAVBAR (Tetap Sama) */}
      <nav className="hidden md:block bg-[#0b0e11]/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50 w-full">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-tighter text-blue-500 italic">RYPTO</span>
            <span className="text-[10px] font-bold bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">v0.1</span>
          </Link>
          <div className="flex items-center gap-8">
            {navLinks.slice(0, 4).map((link) => (
              <Link key={link.name} href={link.href} className={`text-[10px] font-black uppercase tracking-widest transition-all ${pathname === link.href ? 'text-blue-500' : 'text-slate-400 hover:text-white'}`}>
                {link.name}
              </Link>
            ))}
            <div className="h-4 w-[1px] bg-slate-800 mx-2" />
            {!loading && (
              <Link href={user ? "/profile" : "/login"} className="flex items-center gap-3">
                 <span className="text-lg">👤</span>
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">{user ? 'Profile' : 'Login'}</p>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* MOBILE MAGIC NAVBAR (Nempel di Bawah) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-[#0b0e11]">
        {/* Garis Border Atas tipis agar terlihat batasnya */}
        <div className="relative bg-[#1e2329] border-t border-slate-800 h-16 flex items-center justify-around pb-safe">
          
          {/* Magic Indicator (Bulatannya) */}
          <div 
            className="absolute -top-6 w-14 h-14 bg-blue-600 rounded-full border-[6px] border-[#0b0e11] transition-all duration-500 ease-out shadow-[0_10px_20px_rgba(37,99,235,0.4)] flex items-center justify-center text-xl z-20"
            style={{ 
              left: `${magicLeft}%`,
              transform: 'translateX(-50%)' 
            }}
          >
            {navLinks[safeActiveIndex].icon}
          </div>

          {navLinks.map((link, index) => (
            <Link 
              key={link.name} 
              href={link.href}
              className="relative z-10 w-full h-full flex flex-col items-center justify-center"
            >
              <span className={`text-lg transition-all duration-500 ${safeActiveIndex === index ? 'opacity-0 translate-y-4' : 'opacity-100'}`}>
                {link.icon}
              </span>
              <span className={`text-[9px] font-black uppercase tracking-tighter mt-1 transition-all duration-300 ${
                  safeActiveIndex === index ? 'opacity-0 scale-50' : 'text-slate-500 opacity-100'
                }`}>
                {link.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}