export type Role = 'admin' | 'operator' | 'user';

export type ViewId =
  | 'dashboard'
  | 'portal'
  | 'tagihan'
  | 'servis'
  | 'pelanggan'
  | 'kendaraan'
  | 'mekanik'
  | 'laporan'
  | 'pengguna';

export type ServiceStatus = 'Menunggu' | 'Dikerjakan' | 'Selesai' | 'Dibatalkan';

export interface UserAccount {
  id: string;
  username: string;
  nama: string;
  role: Role;
  pelangganId: string | null;
  salt: string;
  hash: string;
  aktif: boolean;
  createdAt: string;
}

export interface Pelanggan {
  id: string;
  nama: string;
  telepon: string;
  alamat: string;
}

export interface Kendaraan {
  id: string;
  pelangganId: string;
  plat: string;
  merek: string;
  model: string;
  tahun: number | null;
}

export interface Mekanik {
  id: string;
  nama: string;
  telepon: string;
  keahlian: string;
  aktif: boolean;
}

export interface ServiceDetail {
  id: string;
  tipe: 'Sparepart' | 'Jasa Tambahan';
  deskripsi: string;
  jumlah: number;
  harga: number;
}

export interface Payment {
  id: string;
  tanggal: string;
  jumlah: number;
  metode: 'Tunai' | 'Transfer' | 'QRIS' | 'Debit';
}

export interface Servis {
  id: string;
  kendaraanId: string;
  mekanikId: string | null;
  tanggal: string;
  keluhan: string;
  diagnosa: string;
  jenis: string;
  biayaJasa: number;
  status: ServiceStatus;
  details: ServiceDetail[];
  payments: Payment[];
}

export interface WorkshopDB {
  users: UserAccount[];
  pelanggan: Pelanggan[];
  kendaraan: Kendaraan[];
  mekanik: Mekanik[];
  servis: Servis[];
}
