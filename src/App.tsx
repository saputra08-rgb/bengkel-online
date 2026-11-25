import React, { useCallback, useEffect, useState } from 'react';
import {
  BarChart3,
  CalendarCheck,
  Car,
  CreditCard,
  LayoutDashboard,
  LogOut,
  RotateCcw,
  ShieldCheck,
  Users,
  Wrench,
  UserCog,
} from 'lucide-react';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthScreen } from './components/AuthScreen';
import { AutoraLogo } from './components/AutoraLogo';
import { CustomerPortal } from './components/CustomerPortal';
import {
  CustomersView,
  MechanicsView,
  ReportsView,
  UsersView,
  VehiclesView,
} from './components/MasterTables';
import { Modal } from './components/Modal';
import { ServiceManager } from './components/ServiceManager';
import { RoleTag } from './components/StatusLabel';
import { canAccessView, ROLE_CONFIG, VIEW_TITLES } from './config/roles';
import { UserAccount, ViewId, WorkshopDB } from './types';
import {
  buildSeedData,
  loadStoredDB,
  makeSalt,
  passwordDigest,
  persistDB,
  safeSession,
  SESSION_KEY,
  today,
  uid,
} from './utils/storage';

function navIcon(viewId: ViewId) {
  const cls = 'w-4 h-4 shrink-0';
  switch (viewId) {
    case 'dashboard':
      return <LayoutDashboard className={cls} />;
    case 'portal':
      return <CalendarCheck className={cls} />;
    case 'tagihan':
      return <CreditCard className={cls} />;
    case 'servis':
      return <Wrench className={cls} />;
    case 'pelanggan':
      return <Users className={cls} />;
    case 'kendaraan':
      return <Car className={cls} />;
    case 'mekanik':
      return <UserCog className={cls} />;
    case 'laporan':
      return <BarChart3 className={cls} />;
    case 'pengguna':
      return <ShieldCheck className={cls} />;
  }
}

export default function App() {
  const [db, setDb] = useState<WorkshopDB | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ViewId>('dashboard');
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
  }, []);

  useEffect(() => {
    if (!toastMsg) return;
    const timer = window.setTimeout(() => setToastMsg(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toastMsg]);

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      let initialDB = loadStoredDB();
      if (!initialDB) {
        initialDB = await buildSeedData();
        persistDB(initialDB);
      }
      if (cancelled) return;
      setDb(initialDB);

      try {
        const rawSession = safeSession.getItem(SESSION_KEY);
        if (rawSession) {
          const parsed = JSON.parse(rawSession) as { id?: string };
          const found = initialDB.users.find((u) => u.id === parsed.id && u.aktif);
          if (found) {
            setCurrentUserId(found.id);
            setActiveView(ROLE_CONFIG[found.role].defaultView);
          }
        }
      } catch {
        // Ignore malformed session
      }
    }
    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const updateDB = useCallback((updater: (prev: WorkshopDB) => WorkshopDB) => {
    setDb((prev) => {
      if (!prev) return prev;
      const next = updater(prev);
      persistDB(next);
      return next;
    });
  }, []);

  const currentUser =
    db && currentUserId ? db.users.find((u) => u.id === currentUserId) || null : null;

  const handleLogin = async (username: string, password: string): Promise<string | null> => {
    if (!db) return 'Sistem sedang memuat data.';
    const user = db.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
    if (!user) return 'Username tidak ditemukan.';
    if (!user.aktif) return 'Akun ini sedang dinonaktifkan oleh Administrator.';
    const digest = await passwordDigest(password, user.salt);
    if (digest !== user.hash) return 'Password yang dimasukkan salah.';

    safeSession.setItem(SESSION_KEY, JSON.stringify({ id: user.id }));
    setCurrentUserId(user.id);
    setActiveView(ROLE_CONFIG[user.role].defaultView);
    setSelectedServiceId(null);
    showToast(`Berhasil masuk sebagai ${user.nama} (${ROLE_CONFIG[user.role].label})`);
    return null;
  };

  const handleRegister = async (payload: {
    nama: string;
    telepon: string;
    username: string;
    password: string;
  }): Promise<string | null> => {
    if (!db) return 'Sistem sedang memuat data.';
    if (db.users.some((u) => u.username.toLowerCase() === payload.username.toLowerCase())) {
      return 'Username sudah digunakan.';
    }

    const pid = 'p_' + uid();
    const salt = makeSalt();
    const hash = await passwordDigest(payload.password, salt);
    const newUser: UserAccount = {
      id: 'u_' + uid(),
      username: payload.username,
      nama: payload.nama,
      role: 'user',
      pelangganId: pid,
      salt,
      hash,
      aktif: true,
      createdAt: today(),
    };

    updateDB((prev) => ({
      ...prev,
      pelanggan: [
        ...prev.pelanggan,
        { id: pid, nama: payload.nama, telepon: payload.telepon, alamat: 'Terdaftar mandiri' },
      ],
      users: [...prev.users, newUser],
    }));

    safeSession.setItem(SESSION_KEY, JSON.stringify({ id: newUser.id }));
    setCurrentUserId(newUser.id);
    setActiveView('portal');
    showToast(`Akun berhasil dibuat! Selamat datang, ${payload.nama}`);
    return null;
  };

  const handleLogout = () => {
    safeSession.removeItem(SESSION_KEY);
    setCurrentUserId(null);
    setSelectedServiceId(null);
    showToast('Anda telah keluar dari sistem.');
  };

  const handleResetDemo = async () => {
    const fresh = await buildSeedData();
    persistDB(fresh);
    setDb(fresh);
    const adminUser = fresh.users.find((u) => u.role === 'admin');
    if (adminUser) {
      safeSession.setItem(SESSION_KEY, JSON.stringify({ id: adminUser.id }));
      setCurrentUserId(adminUser.id);
      setActiveView(ROLE_CONFIG[adminUser.role].defaultView);
    }
    setSelectedServiceId(null);
    setResetConfirmOpen(false);
    showToast('Data demo berhasil direset ke kondisi awal.');
  };

  const navigate = (viewId: ViewId) => {
    if (!currentUser) return;
    const next = canAccessView(currentUser.role, viewId)
      ? viewId
      : ROLE_CONFIG[currentUser.role].defaultView;
    setActiveView(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!db) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f1e9] text-[#62594f] text-sm font-semibold">
        Memuat AUTORA Workshop System...
      </div>
    );
  }

  if (!currentUser) {
    return (
      <>
        <AuthScreen onLogin={handleLogin} onRegister={handleRegister} />
        {toastMsg && (
          <div className="fixed bottom-5 right-5 z-50 bg-[#28231f] text-white px-4 py-3 rounded-xl shadow-lg text-xs font-semibold">
            {toastMsg}
          </div>
        )}
      </>
    );
  }

  const roleCfg = ROLE_CONFIG[currentUser.role];
  const resolvedView = canAccessView(currentUser.role, activeView)
    ? activeView
    : roleCfg.defaultView;

  return (
    <div className="min-h-screen bg-[#f6f1e9] text-[#211f1c] flex flex-col lg:flex-row">
      {/* Mobile Compact Top Header (<= 54px) */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 h-[54px] bg-[#28231f] text-white px-3.5 flex items-center justify-between gap-2 border-b border-[#3f362e] no-print">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#efb84f] flex items-center justify-center shrink-0">
            <AutoraLogo size={18} inverted />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold leading-tight truncate">
              {VIEW_TITLES[resolvedView]}
            </div>
            <div className="text-[11px] text-[#d6c9bb] truncate">
              {currentUser.nama} · {roleCfg.label}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {currentUser.role === 'admin' && (
            <button
              type="button"
              onClick={() => setResetConfirmOpen(true)}
              title="Reset Data Demo"
              aria-label="Reset Data Demo"
              className="h-8 w-8 rounded-lg bg-[#3d342c] hover:bg-[#4e4339] text-white flex items-center justify-center"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="h-8 px-2.5 rounded-lg bg-[#6f2822] hover:bg-[#843029] text-[#ffd7d3] text-xs font-bold inline-flex items-center gap-1 whitespace-nowrap"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar</span>
          </button>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-[256px] lg:shrink-0 lg:sticky lg:top-0 lg:h-screen bg-[#28231f] text-white p-5 flex-col gap-5 no-print">
        <div className="flex items-center gap-3 px-1">
          <div className="w-10 h-10 rounded-xl bg-[#efb84f] flex items-center justify-center shrink-0">
            <AutoraLogo size={24} inverted />
          </div>
          <div>
            <div className="text-lg font-extrabold tracking-[0.05em] leading-none">AUTORA</div>
            <div className="text-[10px] tracking-[0.12em] text-[#c7bdb2] mt-1 font-semibold">
              WORKSHOP SYSTEM
            </div>
          </div>
        </div>

        <div className="bg-[#352e27] border border-[#483e35] rounded-2xl p-3.5">
          <div className="text-xs font-bold text-white truncate">{currentUser.nama}</div>
          <div className="text-[11px] text-[#c7bdb2] font-mono mt-0.5 truncate">
            @{currentUser.username}
          </div>
          <div className="mt-2">
            <RoleTag role={currentUser.role} />
          </div>
        </div>

        <nav className="flex flex-col gap-1 overflow-y-auto" aria-label="Navigasi Utama">
          {roleCfg.menus.map((m) => {
            const active = resolvedView === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => navigate(m.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 text-[13px] transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[#463b31] text-[#efb84f] font-bold'
                    : 'text-[#d8d0c8] hover:bg-[#3a3129] hover:text-white font-medium'
                }`}
              >
                {navIcon(m.id)}
                <span className="truncate">{m.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto p-3.5 rounded-2xl bg-[#352e27] border border-[#483e35] text-xs text-[#d6c9bb] space-y-1.5">
          <div className="font-bold text-white">Hak Akses {roleCfg.label}</div>
          <ul className="space-y-1 text-[11px] text-[#c7bdb2]">
            {roleCfg.permissions.map((perm) => (
              <li key={perm}>• {perm}</li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 pt-[68px] pb-[76px] lg:pt-7 lg:pb-12 px-3.5 sm:px-6 lg:px-9 max-w-[1380px] w-full mx-auto">
        {/* Desktop Top Header */}
        <header className="hidden lg:flex items-center justify-between gap-6 mb-5 no-print">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#9a6b42]">
              {roleCfg.eyebrow}
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#211f1c] mt-0.5">
              {VIEW_TITLES[resolvedView]}
            </h1>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {currentUser.role === 'admin' && (
              <button
                type="button"
                onClick={() => setResetConfirmOpen(true)}
                className="inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-2 rounded-xl bg-[#eee5d9] hover:bg-[#e2d6c5] text-[#342b23] text-xs font-bold transition-colors whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Demo</span>
              </button>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#fffdfa] border border-[#e9e0d4] text-xs">
              <span className="font-semibold text-[#211f1c]">{currentUser.nama}</span>
              <span className="text-[#777168] font-mono">@{currentUser.username}</span>
              <RoleTag role={currentUser.role} />
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-2 rounded-xl bg-[#fbe7e4] hover:bg-[#f6d5d0] text-[#9b302a] text-xs font-bold transition-colors whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </header>

        {/* Contextual Role Banner */}
        <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-[#fff4d9] border border-[#f1d99d] text-[#76551e] text-xs font-medium no-print">
          {roleCfg.notice}
        </div>

        {/* Active View */}
        {resolvedView === 'dashboard' && currentUser.role === 'admin' && (
          <AdminDashboard
            db={db}
            onNavigate={navigate}
            onOpenService={(sid) => {
              setSelectedServiceId(sid);
              navigate('servis');
            }}
          />
        )}

        {(resolvedView === 'portal' || resolvedView === 'tagihan') &&
          currentUser.role === 'user' && (
            <CustomerPortal
              db={db}
              currentUser={currentUser}
              mode={resolvedView}
              onUpdateDB={updateDB}
              onToast={showToast}
            />
          )}

        {resolvedView === 'servis' &&
          (currentUser.role === 'admin' || currentUser.role === 'operator') && (
            <ServiceManager
              db={db}
              role={currentUser.role}
              selectedServiceId={selectedServiceId}
              onSelectServiceId={setSelectedServiceId}
              onUpdateDB={updateDB}
              onToast={showToast}
            />
          )}

        {resolvedView === 'pelanggan' &&
          (currentUser.role === 'admin' || currentUser.role === 'operator') && (
            <CustomersView
              db={db}
              currentUser={currentUser}
              onUpdateDB={updateDB}
              onToast={showToast}
            />
          )}

        {resolvedView === 'kendaraan' && currentUser.role === 'admin' && (
          <VehiclesView
            db={db}
            currentUser={currentUser}
            onUpdateDB={updateDB}
            onToast={showToast}
            onOpenService={(sid) => {
              setSelectedServiceId(sid);
              navigate('servis');
            }}
          />
        )}

        {resolvedView === 'mekanik' && currentUser.role === 'admin' && (
          <MechanicsView
            db={db}
            currentUser={currentUser}
            onUpdateDB={updateDB}
            onToast={showToast}
          />
        )}

        {resolvedView === 'laporan' && currentUser.role === 'admin' && (
          <ReportsView db={db} onToast={showToast} />
        )}

        {resolvedView === 'pengguna' && currentUser.role === 'admin' && (
          <UsersView
            db={db}
            currentUser={currentUser}
            onUpdateDB={updateDB}
            onToast={showToast}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation (compact <= 60px) */}
      <nav
        aria-label="Navigasi Bawah Mobile"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 h-[60px] bg-[#28231f] border-t border-[#3f362e] px-1.5 flex items-center justify-around gap-0.5 overflow-x-auto no-print"
      >
        {roleCfg.menus.map((m) => {
          const active = resolvedView === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => navigate(m.id)}
              className={`flex-1 min-w-[48px] h-11 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 text-[10px] transition-colors ${
                active
                  ? 'bg-[#463b31] text-[#efb84f] font-bold'
                  : 'text-[#c7bdb2] font-medium'
              }`}
            >
              {navIcon(m.id)}
              <span className="truncate max-w-full leading-none">{m.shortLabel}</span>
            </button>
          );
        })}
      </nav>

      {/* Modal Konfirmasi Reset Demo */}
      <Modal
        open={resetConfirmOpen}
        title="Reset Data Demo"
        onClose={() => setResetConfirmOpen(false)}
        maxWidth="max-w-md"
      >
        <p className="text-sm text-[#62594f] mb-5">
          Kembalikan seluruh data pelanggan, kendaraan, antrean servis, pembayaran, dan akun ke
          data demo awal? Perubahan yang sudah disimpan akan terhapus.
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setResetConfirmOpen(false)}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-[#eee5d9] text-[#342b23] text-xs font-bold"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleResetDemo}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-[#b84b42] hover:bg-[#9b302a] text-white text-xs font-bold"
          >
            Ya, Reset Data
          </button>
        </div>
      </Modal>

      {/* Toast Notification */}
      {toastMsg && (
        <div
          role="status"
          className="fixed bottom-[72px] lg:bottom-5 left-1/2 -translate-x-1/2 lg:left-auto lg:right-5 lg:translate-x-0 z-50 bg-[#28231f] text-white px-4 py-3 rounded-xl shadow-xl text-xs font-semibold max-w-[90vw] text-center no-print"
        >
          {toastMsg}
        </div>
      )}
    </div>
  );
}
