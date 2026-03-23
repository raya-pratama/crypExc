'use client'; // Harus client component untuk ambil input user

import { useState } from 'react';
import { supabase } from '@/lib/supabase'; // Import client supabase kamu
import Link from 'next/link';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // 1. Panggil Supabase Auth untuk mendaftarkan user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      // Nanti di Database Trigger, kita akan gunakan data ini untuk buat profile
      options: {
        data: {
          full_name: email.split('@')[0], // Contoh nama dari email
        }
      }
    });

    if (error) {
      setMessage(`❌ Error: ${error.message}`);
    } else {
      setMessage('✅ Berhasil daftar! Silakan Loginn!');
      // Nantinya, begitu user konfirmasi email, baris saldo di tabel profiles akan otomatis dibuat.
    }
    
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gray-900 flex items-center justify-center p-6 text-white">
      <div className="w-full max-w-md bg-gray-800 border border-gray-700 p-8 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-extrabold text-blue-500 mb-2">Crypto Exchange</h1>
        <p className="text-gray-400 mb-8">Buat akun untuk mulai trading simulasi.</p>
        
        <form onSubmit={handleRegister} className="grid gap-4">
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-widest">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              required
              className="w-full mt-1 p-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-widest">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full mt-1 p-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 p-3 rounded-lg font-bold text-white transition disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Register Account'}
          </button>
        </form>

        {message && <p className="mt-4 p-3 bg-gray-700 text-sm rounded-lg text-center">{message}</p>}

        <p className="mt-6 text-center text-sm text-gray-500">
          Sudah punya akun? <Link href="/login" className="text-blue-400 hover:underline">Login di sini</Link>.
        </p>
      </div>
    </main>
  );
}