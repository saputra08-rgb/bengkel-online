import { Role, ViewId } from '../types';

export interface MenuEntry {
  id: ViewId;
  label: string;
  shortLabel: string;
}

export interface RoleDefinition {
  label: string;
  eyebrow: string;
  defaultView: ViewId;
  menus: MenuEntry[];
  notice: string;
  permissions: string[];
}

export const ROLE_CONFIG: Record<Role, RoleDefinition> = {
  admin: {
    label: 'Admin',
    eyebrow: 'Panel Administrator',
    defaultView: 'dashboard',
    menus: [
      { id: 'dashboard', label: 'Dashboard', shortLabel: 'Beranda' },
      { id: 'servis', label: 'Antrean & Servis', shortLabel: 'Antrean' },
      { id: 'pelanggan', label: 'Pelanggan', shortLabel: 'Pelanggan' },
      { id: 'kendaraan', label: 'Kendaraan', shortLabel: 'Kendaraan' },
      { id: 'mekanik', label: 'Mekanik', shortLabel: 'Mekanik' },
      { id: 'laporan', label: 'Laporan Keuangan', shortLabel: 'Laporan' },
      { id: 'pengguna', label: 'Manajemen User', shortLabel: 'Akun' },
    ],
    notice: 'Mode Administrator aktif — akses penuh ke seluruh modul operasional, keuangan, dan akun.',
    permissions: [
      'Akses penuh seluruh modul',
      'Hapus data & reset sistem',
      'Laporan keuangan & ekspor CSV',
      'Kelola akun Admin, Operator & User',
    ],
  },
  operator: {
    label: 'Operator',
    eyebrow: 'Front-Desk Operator',
    defaultView: 'servis',
    menus: [
      { id: 'servis', label: 'Antrean & Servis', shortLabel: 'Antrean' },
      { id: 'pelanggan', label: 'Pelanggan', shortLabel: 'Pelanggan' },
    ],
    notice: 'Mode Operator aktif — kelola antrean servis masuk, penugasan mekanik, rincian biaya, pembayaran, dan pelanggan.',
    permissions: [
      'Kelola antrean servis bengkel',
      'Input rincian biaya & pembayaran',
      'Kelola data & unit pelanggan',
    ],
  },
  user: {
    label: 'User Biasa',
    eyebrow: 'Portal Pelanggan AUTORA',
    defaultView: 'portal',
    menus: [
      { id: 'portal', label: 'Booking & Pantau', shortLabel: 'Booking' },
      { id: 'tagihan', label: 'Tagihan Saya', shortLabel: 'Tagihan' },
    ],
    notice: 'Portal Pelanggan — ajukan booking servis kendaraan Anda, pantau progres pengerjaan, dan cetak nota tagihan.',
    permissions: [
      'Booking jadwal servis online',
      'Pantau status pengerjaan unit',
      'Lihat & cetak nota tagihan',
    ],
  },
};

export const VIEW_TITLES: Record<ViewId, string> = {
  dashboard: 'Dashboard Admin',
  portal: 'Booking & Pantau',
  tagihan: 'Tagihan Saya',
  pelanggan: 'Data Pelanggan',
  kendaraan: 'Data Kendaraan',
  mekanik: 'Tim Mekanik',
  servis: 'Antrean & Servis',
  laporan: 'Laporan Keuangan',
  pengguna: 'Manajemen User',
};

export function canAccessView(role: Role, viewId: ViewId): boolean {
  return ROLE_CONFIG[role].menus.some((m) => m.id === viewId);
}
