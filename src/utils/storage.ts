import { Servis, UserAccount, WorkshopDB } from '../types';

export const DB_KEY = 'autora_workshop_db_v3';
export const SESSION_KEY = 'autora_active_session_v3';

interface SafeStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function createSafeStorage(type: 'localStorage' | 'sessionStorage'): SafeStorage {
  const mem = new Map<string, string>();
  return {
    getItem(k: string) {
      try {
        const s = window[type];
        if (s) return s.getItem(k);
      } catch {
        // Fallback to in-memory map if storage is restricted
      }
      return mem.has(k) ? mem.get(k)! : null;
    },
    setItem(k: string, v: string) {
      try {
        const s = window[type];
        if (s) {
          s.setItem(k, String(v));
          return;
        }
      } catch {
        // Fallback to in-memory map
      }
      mem.set(k, String(v));
    },
    removeItem(k: string) {
      try {
        const s = window[type];
        if (s) {
          s.removeItem(k);
          return;
        }
      } catch {
        // Fallback to in-memory map
      }
      mem.delete(k);
    },
  };
}

export const safeLocal = createSafeStorage('localStorage');
export const safeSession = createSafeStorage('sessionStorage');

export function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
}

export function rupiah(n: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);
}

export function csvCell(v: unknown): string {
  let s = String(v ?? '');
  if (/^[=+\-@\t\r]/.test(s)) {
    s = `'${s}`;
  }
  return `"${s.replace(/"/g, '""')}"`;
}

function bytesToHex(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function makeSalt(): string {
  const bytes = new Uint8Array(12);
  try {
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(bytes);
      return bytesToHex(bytes);
    }
  } catch {
    // Fallback below
  }
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  return bytesToHex(bytes);
}

export async function passwordDigest(password: string, salt: string): Promise<string> {
  try {
    const subtle = window.crypto && window.crypto.subtle;
    if (subtle) {
      const enc = new TextEncoder();
      const key = await subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
      const saltMatches = salt.match(/../g) ?? [];
      const saltBytes = Uint8Array.from(saltMatches, (x) => parseInt(x, 16));
      const bits = await subtle.deriveBits(
        { name: 'PBKDF2', salt: saltBytes, iterations: 50000, hash: 'SHA-256' },
        key,
        256
      );
      return 'pbkdf2:' + bytesToHex(bits);
    }
  } catch {
    // Fallback when subtle crypto is unavailable
  }

  let h1 = 2166136261;
  let h2 = 2246822519;
  const input = `${salt}|${password}`;
  for (let r = 0; r < 3000; r++) {
    for (let i = 0; i < input.length; i++) {
      const c = input.charCodeAt(i) + r;
      h1 = Math.imul(h1 ^ c, 16777619);
      h2 = Math.imul(h2 ^ c, 2246822519);
    }
  }
  return 'local:' + [h1, h2].map((v) => (v >>> 0).toString(16).padStart(8, '0')).join('');
}

export function serviceTotal(s: Servis): number {
  return (Number(s.biayaJasa) || 0) + (s.details || []).reduce((acc, d) => acc + d.jumlah * d.harga, 0);
}

export function servicePaid(s: Servis): number {
  return (s.payments || []).reduce((acc, p) => acc + p.jumlah, 0);
}

export function getPayStatus(s: Servis): 'Lunas' | 'Sebagian' | 'Belum lunas' | 'Dibatalkan' {
  if (s.status === 'Dibatalkan') return 'Dibatalkan';
  const p = servicePaid(s);
  if (p <= 0) return 'Belum lunas';
  if (p >= serviceTotal(s)) return 'Lunas';
  return 'Sebagian';
}

export async function buildSeedData(): Promise<WorkshopDB> {
  const mkUser = async (
    uidVal: string,
    username: string,
    nama: string,
    role: UserAccount['role'],
    pass: string,
    pelangganId: string | null = null
  ): Promise<UserAccount> => {
    const salt = makeSalt();
    const hash = await passwordDigest(pass, salt);
    return {
      id: uidVal,
      username,
      nama,
      role,
      pelangganId,
      salt,
      hash,
      aktif: true,
      createdAt: today(),
    };
  };

  const users = [
    await mkUser('u_admin', 'admin', 'Administrator Utama', 'admin', 'Autora123', null),
    await mkUser('u_op1', 'operator', 'Rizky Operator', 'operator', 'Operator123', null),
    await mkUser('u_user1', 'andi', 'Andi Pratama', 'user', 'User1234', 'p1'),
    await mkUser('u_user2', 'siti', 'Siti Rahma', 'user', 'User1234', 'p2'),
  ];

  const t = today();

  return {
    users,
    pelanggan: [
      { id: 'p1', nama: 'Andi Pratama', telepon: '0812-0000-0101', alamat: 'Jl. Melati No. 12, Banda Aceh' },
      { id: 'p2', nama: 'Siti Rahma', telepon: '0812-0000-0102', alamat: 'Jl. Kenanga No. 5, Banda Aceh' },
      { id: 'p3', nama: 'Budi Santoso', telepon: '0812-0000-0103', alamat: 'Jl. Mawar No. 8, Banda Aceh' },
    ],
    kendaraan: [
      { id: 'k1', pelangganId: 'p1', plat: 'BL 1234 AB', merek: 'Honda', model: 'Vario 125', tahun: 2021 },
      { id: 'k2', pelangganId: 'p2', plat: 'BL 5678 CD', merek: 'Toyota', model: 'Avanza', tahun: 2019 },
      { id: 'k3', pelangganId: 'p3', plat: 'BL 9012 EF', merek: 'Yamaha', model: 'NMAX', tahun: 2022 },
    ],
    mekanik: [
      { id: 'm1', nama: 'Doni Saputra', telepon: '0813-0000-0201', keahlian: 'Mesin & Tune Up', aktif: true },
      { id: 'm2', nama: 'Rina Amelia', telepon: '0813-0000-0202', keahlian: 'Kelistrikan & ECU', aktif: true },
      { id: 'm3', nama: 'Agus Setiawan', telepon: '0813-0000-0203', keahlian: 'Rem & Kaki-kaki', aktif: true },
    ],
    servis: [
      {
        id: 's1',
        kendaraanId: 'k1',
        mekanikId: 'm1',
        tanggal: t,
        keluhan: 'Mesin terasa kurang bertenaga saat akselerasi',
        diagnosa: 'Filter udara kotor & perlu pembersihan throttle body',
        jenis: 'Tune Up',
        biayaJasa: 75000,
        status: 'Dikerjakan',
        details: [{ id: 'd1', tipe: 'Sparepart', deskripsi: 'Filter udara OEM', jumlah: 1, harga: 45000 }],
        payments: [],
      },
      {
        id: 's2',
        kendaraanId: 'k2',
        mekanikId: 'm3',
        tanggal: t,
        keluhan: 'Rem berbunyi decit saat diinjak',
        diagnosa: 'Kampas rem depan sudah tipis',
        jenis: 'Perbaikan Rem',
        biayaJasa: 120000,
        status: 'Selesai',
        details: [{ id: 'd2', tipe: 'Sparepart', deskripsi: 'Kampas rem depan', jumlah: 1, harga: 180000 }],
        payments: [{ id: 'pay2', tanggal: t, jumlah: 300000, metode: 'Tunai' }],
      },
      {
        id: 's3',
        kendaraanId: 'k3',
        mekanikId: null,
        tanggal: t,
        keluhan: 'Servis rutin 10.000 km & ganti oli',
        diagnosa: 'Menunggu pengecekan mekanik',
        jenis: 'Servis Berkala',
        biayaJasa: 50000,
        status: 'Menunggu',
        details: [],
        payments: [],
      },
    ],
  };
}

export function loadStoredDB(): WorkshopDB | null {
  try {
    const raw = safeLocal.getItem(DB_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WorkshopDB;
    if (!parsed || !Array.isArray(parsed.users) || !Array.isArray(parsed.servis)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function persistDB(db: WorkshopDB): void {
  safeLocal.setItem(DB_KEY, JSON.stringify(db));
}
