import React, { useState } from 'react';
import { ArrowRight, KeyRound, ShieldCheck } from 'lucide-react';
import { AutoraLogo } from './AutoraLogo';
import { RoleTag } from './StatusLabel';

interface AuthScreenProps {
  onLogin: (username: string, password: string) => Promise<string | null>;
  onRegister: (payload: {
    nama: string;
    telepon: string;
    username: string;
    password: string;
  }) => Promise<string | null>;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, onRegister }) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [nama, setNama] = useState('');
  const [telepon, setTelepon] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const switchTab = (next: 'login' | 'register') => {
    setTab(next);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const uname = username.trim().toLowerCase();
    if (!uname || !password) {
      setError('Username dan password wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      if (tab === 'register') {
        if (!nama.trim()) {
          setError('Nama lengkap wajib diisi.');
          return;
        }
        if (!/^[a-z0-9_.-]{3,20}$/.test(uname)) {
          setError('Username 3–20 karakter (huruf kecil, angka, titik, underscore).');
          return;
        }
        if (password.length < 6) {
          setError('Password minimal 6 karakter.');
          return;
        }
        if (password !== confirmPass) {
          setError('Konfirmasi password tidak cocok.');
          return;
        }
        const err = await onRegister({
          nama: nama.trim(),
          telepon: telepon.trim() || '-',
          username: uname,
          password,
        });
        if (err) setError(err);
      } else {
        const err = await onLogin(uname, password);
        if (err) setError(err);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const fillCreds = (u: string, p: string) => {
    setTab('login');
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  const quickLogin = async (u: string, p: string) => {
    fillCreds(u, p);
    setSubmitting(true);
    try {
      const err = await onLogin(u, p);
      if (err) setError(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[radial-gradient(circle_at_12%_14%,#ead6bb_0%,transparent_34%),radial-gradient(circle_at_88%_86%,#dfc4a2_0%,transparent_34%),#f6f1e9]">
      <div className="w-full max-w-[490px] bg-[#fffdfa] border border-[#e9e0d4] rounded-3xl p-6 sm:p-8 shadow-[0_24px_70px_rgba(77,56,32,0.12)]">
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-13 h-13 rounded-2xl bg-[#28231f] flex items-center justify-center shrink-0">
            <AutoraLogo size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-[0.06em] text-[#211f1c] leading-none">
              AUTORA
            </h1>
            <p className="text-[11px] font-bold tracking-[0.12em] text-[#777168] mt-1.5">
              WORKSHOP MANAGEMENT SYSTEM
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5 bg-[#efe7dc] p-1 rounded-xl mb-5">
          <button
            type="button"
            onClick={() => switchTab('login')}
            className={`py-2.5 px-3 rounded-lg text-[13px] font-bold transition-colors whitespace-nowrap ${
              tab === 'login'
                ? 'bg-[#fffdfa] text-[#211f1c] shadow-sm'
                : 'text-[#62594f] hover:text-[#211f1c]'
            }`}
          >
            Masuk Akun
          </button>
          <button
            type="button"
            onClick={() => switchTab('register')}
            className={`py-2.5 px-3 rounded-lg text-[13px] font-bold transition-colors whitespace-nowrap ${
              tab === 'register'
                ? 'bg-[#fffdfa] text-[#211f1c] shadow-sm'
                : 'text-[#62594f] hover:text-[#211f1c]'
            }`}
          >
            Daftar Pelanggan
          </button>
        </div>

        <h2 className="text-xl font-bold text-[#211f1c] tracking-tight">
          {tab === 'register' ? 'Daftar Akun Pelanggan Baru' : 'Masuk ke Sistem AUTORA'}
        </h2>
        <p className="text-[13px] text-[#777168] mt-1 mb-4">
          {tab === 'register'
            ? 'Buat akun pribadi untuk memesan servis, memantau progres, dan melihat tagihan.'
            : 'Akses disesuaikan berdasarkan peran akun Anda: Admin, Operator, atau User Biasa.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          {tab === 'register' && (
            <>
              <div>
                <label className="block text-xs font-bold text-[#62594f] mb-1">Nama Lengkap</label>
                <input
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Contoh: Raka Wijaya"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#ded5c9] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9a6b42]/25 focus:border-[#9a6b42]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#62594f] mb-1">
                  Nomor Telepon / WhatsApp
                </label>
                <input
                  value={telepon}
                  onChange={(e) => setTelepon(e.target.value)}
                  placeholder="Contoh: 0812-3456-7890"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#ded5c9] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9a6b42]/25 focus:border-[#9a6b42]"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-[#62594f] mb-1">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              placeholder="Masukkan username"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#ded5c9] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9a6b42]/25 focus:border-[#9a6b42]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#62594f] mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={tab === 'register' ? 'new-password' : 'current-password'}
              required
              placeholder="Masukkan password"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#ded5c9] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9a6b42]/25 focus:border-[#9a6b42]"
            />
          </div>

          {tab === 'register' && (
            <div>
              <label className="block text-xs font-bold text-[#62594f] mb-1">Ulangi Password</label>
              <input
                type="password"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                autoComplete="new-password"
                placeholder="Ulangi password"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#ded5c9] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9a6b42]/25 focus:border-[#9a6b42]"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full min-h-[44px] mt-2 px-4 py-2.5 rounded-xl bg-[#9a6b42] hover:bg-[#855b36] text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
          >
            <span>{tab === 'register' ? 'Daftar & Masuk Sekarang' : 'Masuk ke AUTORA'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {error && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-[#fbe7e4] border border-[#f0c5be] text-[#9b302a] text-xs font-semibold"
            >
              {error}
            </div>
          )}
        </form>

        {tab === 'login' && (
          <div className="mt-5 p-3.5 bg-[#f7f1e7] border border-dashed border-[#d3c2ab] rounded-2xl">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#9a6b42] mb-2.5">
              <KeyRound className="w-3.5 h-3.5" />
              <span>Akun Demo & Uji Coba</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 bg-white px-3 py-2 rounded-xl border border-[#e9e0d4] text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#211f1c]">Akun Admin</span>
                    <RoleTag role="admin" />
                  </div>
                  <div className="text-[11px] text-[#777168] font-mono mt-0.5">
                    admin / Autora123
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-[#8a6116] bg-[#fff4d9] border border-[#efd9a0] px-2 py-0.5 rounded">
                  Manual
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 bg-white px-3 py-2 rounded-xl border border-[#e9e0d4] text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#211f1c]">Akun Operator</span>
                    <RoleTag role="operator" />
                  </div>
                  <div className="text-[11px] text-[#777168] font-mono mt-0.5">
                    operator / Operator123
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-[#8a6116] bg-[#fff4d9] border border-[#efd9a0] px-2 py-0.5 rounded">
                  Manual
                </span>
              </div>

              {[
                { u: 'andi', p: 'User1234', desc: 'Pelanggan 1 · Booking & tagihan' },
                { u: 'siti', p: 'User1234', desc: 'Pelanggan 2 · Booking & tagihan' },
              ].map((acc) => (
                <div
                  key={acc.u}
                  className="flex items-center justify-between gap-2 bg-white px-3 py-2 rounded-xl border border-[#e9e0d4] text-xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#211f1c]">{acc.u}</span>
                      <RoleTag role="user" />
                    </div>
                    <div className="text-[11px] text-[#777168] truncate mt-0.5">{acc.desc}</div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => fillCreds(acc.u, acc.p)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#eee5d9] hover:bg-[#e2d6c5] text-[#342b23] text-[11px] font-bold transition-colors"
                    >
                      Isi
                    </button>
                    <button
                      type="button"
                      onClick={() => quickLogin(acc.u, acc.p)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#28231f] hover:bg-[#9a6b42] text-[#efb84f] hover:text-white text-[11px] font-bold transition-colors"
                    >
                      Masuk →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-start gap-2 text-[11px] text-[#777168] mt-4 leading-relaxed">
          <ShieldCheck className="w-4 h-4 text-[#9a6b42] shrink-0 mt-0.5" />
          <span>
            Akun Admin dan Operator menggunakan kredensial pribadi manual. Setiap sesi akun terisolasi
            sesuai hak aksesnya.
          </span>
        </div>
      </div>
    </div>
  );
};
