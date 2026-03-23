'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(`❌ ${error.message}`);
    } else {
      // Jika login sukses, arahkan ke dashboard
      router.push('/'); 
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gray-900 flex items-center justify-center p-6 text-white">
      <div className="w-full max-w-md bg-gray-800 border border-gray-700 p-8 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-extrabold text-blue-500 mb-2">Welcome Back</h1>
        <p className="text-gray-400 mb-8">Masuk untuk mengelola aset crypto kamu.</p>
        
        <form onSubmit={handleLogin} className="grid gap-4">
          <input 
            type="email" 
            placeholder="Email Address"
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 outline-none"
          />
          <input 
            type="password" 
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 outline-none"
          />
          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 p-3 rounded-lg font-bold transition disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Login'}
          </button>
        </form>

        {errorMsg && <p className="mt-4 p-3 bg-red-500/10 text-red-400 text-sm rounded-lg text-center border border-red-500/20">{errorMsg}</p>}

        <p className="mt-6 text-center text-sm text-gray-500">
          Belum punya akun? <Link href="/register" className="text-blue-400 hover:underline">Daftar sekarang</Link>.
        </p>
      </div>
    </main>
  );
}