'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { usePathname, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import './globals.css';
import { AlertProvider } from '@/context/AlertContext'; // Import provider baru
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [authReady, setAuthReady] = useState(false); 
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      
      const isAuthPage = pathname === '/login' || pathname === '/register';
      
      // TETAP WAJIB LOGIN: Jika tidak ada session, lempar ke login
      if (!session && !isAuthPage) {
        router.replace('/login');
      } 
      
      setAuthReady(true);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session && pathname !== '/login' && pathname !== '/register') {
        router.replace('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname, router]);

  // Loading Screen biar gak "Flash"
  if (!authReady) {
    return (
      <html lang="en">
        <body 
        // 
        className="bg-[#0b0e11] text-white min-h-screen antialiased flex flex-col overflow-x-hidden"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Syncing Rypto...</p>
          </div>
        </body>
      </html>
    );
  }

  const isAuthPage = pathname === '/login' || pathname === '/register';
  const showNavbar = session && !isAuthPage;

  return (
    <html lang="en">
      <body className="bg-[#0b0e11] text-white min-h-screen antialiased flex flex-col overflow-x-hidden">
        <AlertProvider>
        {/* NAVBAR: Muncul di atas (Desktop) atau bawah (Mobile) sesuai kode Navbar.tsx */}
        {showNavbar && <Navbar />}

        {/* MAIN CONTENT: 
            - pb-32: Hanya di mobile agar tidak tertutup Navbar Magic
            - md:pb-0: Di desktop tidak butuh padding bawah karena Navbar di atas
        */}
        <main className={`flex-grow w-full ${showNavbar ? 'pb-32 md:pb-0' : 'pb-0'}`}>
          {children}
        </main>

        {/* FOOTER: Optional, hanya muncul di desktop biar gak menumpuk di HP */}
        {showNavbar && (
          <footer className="hidden md:block py-6 border-t border-slate-800 bg-[#0b0e11] text-center">
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
              © 2026 RYPTO TRADING PLATFORM
            </p>
          </footer>
        )}
        </AlertProvider>
      </body>
    </html>
  );
}