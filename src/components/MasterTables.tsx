import React, { useState } from 'react';
import { Download, Plus, Search } from 'lucide-react';
import {
  Kendaraan,
  Mekanik,
  Pelanggan,
  Role,
  UserAccount,
  WorkshopDB,
} from '../types';
import {
  csvCell,
  getPayStatus,
  makeSalt,
  passwordDigest,
  rupiah,
  servicePaid,
  serviceTotal,
  today,
  uid,
} from '../utils/storage';
import { Modal } from './Modal';
import { PayStatusTag, RoleTag, ServiceStatusTag } from './StatusLabel';

interface MasterProps {
  db: WorkshopDB;
  currentUser: UserAccount;
  onUpdateDB: (updater: (prev: WorkshopDB) => WorkshopDB) => void;
  onToast: (msg: string) => void;
  onOpenService?: (serviceId: string) => void;
}

/* ==================== PELANGGAN VIEW ==================== */
export const CustomersView: React.FC<MasterProps> = ({
  db,
  currentUser,
  onUpdateDB,
  onToast,
}) => {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Pelanggan | null>(null);
  const [nama, setNama] = useState('');
  const [telepon, setTelepon] = useState('');
  const [alamat, setAlamat] = useState('');

  // Quick add vehicle for customer
  const [unitFor, setUnitFor] = useState<Pelanggan | null>(null);
  const [plat, setPlat] = useState('');
  const [merek, setMerek] = useState('');
  const [model, setModel] = useState('');
  const [tahun, setTahun] = useState('2022');

  const [deleteTarget, setDeleteTarget] = useState<Pelanggan | null>(null);

  const isAdmin = currentUser.role === 'admin';
  const filtered = db.pelanggan.filter((p) =>
    `${p.nama} ${p.telepon} ${p.alamat}`.toLowerCase().includes(search.toLowerCase())
  );

  const openForm = (p: Pelanggan | null) => {
    setEditing(p);
    setNama(p?.nama || '');
    setTelepon(p?.telepon || '');
    setAlamat(p?.alamat || '');
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      onToast('Nama pelanggan wajib diisi.');
      return;
    }
    onUpdateDB((prev) => ({
      ...prev,
      pelanggan: editing
        ? prev.pelanggan.map((p) =>
            p.id === editing.id
              ? { ...p, nama: nama.trim(), telepon: telepon.trim() || '-', alamat: alamat.trim() || '-' }
              : p
          )
        : [
            ...prev.pelanggan,
            {
              id: 'p_' + uid(),
              nama: nama.trim(),
              telepon: telepon.trim() || '-',
              alamat: alamat.trim() || '-',
            },
          ],
    }));
    setModalOpen(false);
    onToast(editing ? 'Data pelanggan diperbarui.' : 'Pelanggan baru ditambahkan.');
  };

  const openQuickUnit = (p: Pelanggan) => {
    setUnitFor(p);
    setPlat('');
    setMerek('');
    setModel('');
    setTahun('2022');
  };

  const handleSaveQuickUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitFor) return;
    const cleanPlat = plat.trim().toUpperCase().replace(/\s+/g, ' ');
    if (!cleanPlat || !merek.trim() || !model.trim()) {
      onToast('Plat nomor, merek, dan model wajib diisi.');
      return;
    }
    if (db.kendaraan.some((k) => k.plat === cleanPlat)) {
      onToast('Plat nomor sudah terdaftar.');
      return;
    }
    onUpdateDB((prev) => ({
      ...prev,
      kendaraan: [
        ...prev.kendaraan,
        {
          id: 'k_' + uid(),
          pelangganId: unitFor.id,
          plat: cleanPlat,
          merek: merek.trim(),
          model: model.trim(),
          tahun: tahun ? Number(tahun) : null,
        },
      ],
    }));
    setUnitFor(null);
    onToast(`Unit ${cleanPlat} ditambahkan untuk ${unitFor.nama}.`);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const hasVehicles = db.kendaraan.some((k) => k.pelangganId === deleteTarget.id);
    if (hasVehicles) {
      onToast('Pelanggan masih memiliki unit kendaraan terdaftar.');
      setDeleteTarget(null);
      return;
    }
    onUpdateDB((prev) => ({
      ...prev,
      pelanggan: prev.pelanggan.filter((p) => p.id !== deleteTarget.id),
    }));
    setDeleteTarget(null);
    onToast('Data pelanggan dihapus.');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[#211f1c]">Data Pelanggan</h2>
          <p className="text-xs text-[#777168]">
            Kelola identitas pelanggan dan unit kendaraan mereka.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative sm:w-60">
            <Search className="w-4 h-4 text-[#777168] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama / telepon / alamat..."
              className="w-full min-h-[40px] pl-9 pr-3 py-2 text-xs bg-white border border-[#e9e0d4] rounded-xl"
            />
          </div>
          <button
            type="button"
            onClick={() => openForm(null)}
            className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-xl bg-[#9a6b42] hover:bg-[#855b36] text-white text-xs font-bold whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Pelanggan</span>
          </button>
        </div>
      </div>

      <div className="bg-[#fffdfa] border border-[#e9e0d4] rounded-2xl p-4 sm:p-5">
        <div className="overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-[#777168]">
              Belum ada data pelanggan yang cocok.
            </div>
          ) : (
            <table className="w-full text-left border-collapse whitespace-nowrap text-[13px]">
              <thead>
                <tr className="border-b border-[#e9e0d4] text-[11px] uppercase tracking-wider text-[#777168]">
                  <th className="py-2.5 px-3 font-bold">Nama Pelanggan</th>
                  <th className="py-2.5 px-3 font-bold">Telepon</th>
                  <th className="py-2.5 px-3 font-bold">Alamat</th>
                  <th className="py-2.5 px-3 font-bold">Akun</th>
                  <th className="py-2.5 px-3 font-bold text-right">Unit</th>
                  <th className="py-2.5 px-3 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0eae2]">
                {filtered.map((p) => {
                  const linkedUser = db.users.find((u) => u.pelangganId === p.id);
                  const unitCount = db.kendaraan.filter((k) => k.pelangganId === p.id).length;
                  return (
                    <tr key={p.id} className="hover:bg-[#fcf9f4]">
                      <td className="py-3 px-3 font-bold text-[#211f1c]">{p.nama}</td>
                      <td className="py-3 px-3 font-mono text-xs tabular-nums">{p.telepon || '—'}</td>
                      <td className="py-3 px-3 text-[#777168] max-w-[240px] truncate">
                        {p.alamat || '—'}
                      </td>
                      <td className="py-3 px-3">
                        {linkedUser ? (
                          <span className="inline-flex px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#e1f5ea] text-[#216944] border border-[#b7e2ca]">
                            @{linkedUser.username}
                          </span>
                        ) : (
                          <span className="text-xs text-[#777168]">Offline</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold tabular-nums">
                        {unitCount}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openForm(p)}
                            className="min-h-[32px] px-2.5 py-1 rounded-lg bg-[#eee5d9] hover:bg-[#e2d6c5] text-[#342b23] text-xs font-bold"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => openQuickUnit(p)}
                            className="min-h-[32px] px-2.5 py-1 rounded-lg bg-[#eee5d9] hover:bg-[#e2d6c5] text-[#342b23] text-xs font-bold"
                          >
                            + Unit
                          </button>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(p)}
                              className="min-h-[32px] px-2.5 py-1 rounded-lg bg-[#fbe7e4] hover:bg-[#f6d5d0] text-[#9b302a] text-xs font-bold"
                            >
                              Hapus
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal
        open={modalOpen}
        title={editing ? 'Edit Pelanggan' : 'Tambah Pelanggan'}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#62594f] mb-1">Nama Lengkap</label>
              <input
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                required
                className="w-full px-3 py-2.5 text-sm bg-white border border-[#ded5c9] rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#62594f] mb-1">Telepon</label>
              <input
                value={telepon}
                onChange={(e) => setTelepon(e.target.value)}
                placeholder="0812-..."
                className="w-full px-3 py-2.5 text-sm bg-white border border-[#ded5c9] rounded-xl"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#62594f] mb-1">Alamat</label>
              <textarea
                rows={2}
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-white border border-[#ded5c9] rounded-xl"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-[#eee5d9] text-[#342b23] text-xs font-bold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="min-h-[40px] px-4 py-2 rounded-xl bg-[#9a6b42] text-white text-xs font-bold"
            >
              Simpan
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!unitFor}
        title={`Tambah Unit Kendaraan · ${unitFor?.nama || ''}`}
        onClose={() => setUnitFor(null)}
      >
        <form onSubmit={handleSaveQuickUnit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#62594f] mb-1">Plat Nomor</label>
              <input
                value={plat}
                onChange={(e) => setPlat(e.target.value)}
                required
                placeholder="BL 1234 AB"
                className="w-full px-3 py-2.5 text-sm bg-white border border-[#ded5c9] rounded-xl font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#62594f] mb-1">Merek</label>
              <input
                value={merek}
                onChange={(e) => setMerek(e.target.value)}
                required
                placeholder="Honda / Toyota"
                className="w-full px-3 py-2.5 text-sm bg-white border border-[#ded5c9] rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#62594f] mb-1">Model</label>
              <input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                required
                placeholder="Vario 125 / Avanza"
                className="w-full px-3 py-2.5 text-sm bg-white border border-[#ded5c9] rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#62594f] mb-1">Tahun</label>
              <input
                type="number"
                value={tahun}
                onChange={(e) => setTahun(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-white border border-[#ded5c9] rounded-xl tabular-nums"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setUnitFor(null)}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-[#eee5d9] text-[#342b23] text-xs font-bold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="min-h-[40px] px-4 py-2 rounded-xl bg-[#9a6b42] text-white text-xs font-bold"
            >
              Simpan Unit
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!deleteTarget}
        title="Hapus Pelanggan"
        onClose={() => setDeleteTarget(null)}
        maxWidth="max-w-md"
      >
        <p className="text-sm text-[#62594f] mb-5">
          Hapus data pelanggan <b>{deleteTarget?.nama}</b>? Pelanggan yang masih memiliki kendaraan
          tidak dapat dihapus.
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setDeleteTarget(null)}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-[#eee5d9] text-[#342b23] text-xs font-bold"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={confirmDelete}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-[#b84b42] text-white text-xs font-bold"
          >
            Hapus
          </button>
        </div>
      </Modal>
    </div>
  );
};

/* ==================== KENDARAAN VIEW ==================== */
export const VehiclesView: React.FC<MasterProps> = ({
  db,
  onUpdateDB,
  onToast,
  onOpenService,
}) => {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Kendaraan | null>(null);
  const [historyVehicle, setHistoryVehicle] = useState<Kendaraan | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Kendaraan | null>(null);

  const [pelangganId, setPelangganId] = useState('');
  const [plat, setPlat] = useState('');
  const [merek, setMerek] = useState('');
  const [model, setModel] = useState('');
  const [tahun, setTahun] = useState('2022');

  const getCustomerName = (pid: string) =>
    db.pelanggan.find((p) => p.id === pid)?.nama || '—';

  const filtered = db.kendaraan.filter((k) =>
    `${k.plat} ${k.merek} ${k.model} ${getCustomerName(k.pelangganId)}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const openForm = (k: Kendaraan | null) => {
    if (db.pelanggan.length === 0) {
      onToast('Tambahkan data pelanggan terlebih dahulu.');
      return;
    }
    setEditing(k);
    setPelangganId(k?.pelangganId || db.pelanggan[0].id);
    setPlat(k?.plat || '');
    setMerek(k?.merek || '');
    setModel(k?.model || '');
    setTahun(String(k?.tahun || 2022));
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPlat = plat.trim().toUpperCase().replace(/\s+/g, ' ');
    if (!cleanPlat || !merek.trim() || !model.trim()) {
      onToast('Lengkapi plat nomor, merek, dan model.');
      return;
    }
    if (db.kendaraan.some((k) => k.plat === cleanPlat && k.id !== editing?.id)) {
      onToast('Plat nomor sudah terdaftar.');
      return;
    }
    onUpdateDB((prev) => ({
      ...prev,
      kendaraan: editing
        ? prev.kendaraan.map((k) =>
            k.id === editing.id
              ? {
                  ...k,
                  pelangganId,
                  plat: cleanPlat,
                  merek: merek.trim(),
                  model: model.trim(),
                  tahun: tahun ? Number(tahun) : null,
                }
              : k
          )
        : [
            ...prev.kendaraan,
            {
              id: 'k_' + uid(),
              pelangganId,
              plat: cleanPlat,
              merek: merek.trim(),
              model: model.trim(),
              tahun: tahun ? Number(tahun) : null,
            },
          ],
    }));
    setModalOpen(false);
    onToast(editing ? 'Kendaraan diperbarui.' : 'Kendaraan ditambahkan.');
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const hasServices = db.servis.some((s) => s.kendaraanId === deleteTarget.id);
    if (hasServices) {
      onToast('Kendaraan masih memiliki riwayat servis.');
      setDeleteTarget(null);
      return;
    }
    onUpdateDB((prev) => ({
      ...prev,
      kendaraan: prev.kendaraan.filter((k) => k.id !== deleteTarget.id),
    }));
    setDeleteTarget(null);
    onToast('Kendaraan dihapus.');
  };

  const historyList = historyVehicle
    ? db.servis
        .filter((s) => s.kendaraanId === historyVehicle.id)
        .sort((a, b) => b.tanggal.localeCompare(a.tanggal))
    : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[#211f1c]">Data Kendaraan</h2>
          <p className="text-xs text-[#777168]">
            Plat nomor, identitas kendaraan, dan pemilik.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative sm:w-60">
            <Search className="w-4 h-4 text-[#777168] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari plat / merek / pemilik..."
              className="w-full min-h-[40px] pl-9 pr-3 py-2 text-xs bg-white border border-[#e9e0d4] rounded-xl"
            />
          </div>
          <button
            type="button"
            onClick={() => openForm(null)}
            className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-xl bg-[#9a6b42] hover:bg-[#855b36] text-white text-xs font-bold whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kendaraan</span>
          </button>
        </div>
      </div>

      <div className="bg-[#fffdfa] border border-[#e9e0d4] rounded-2xl p-4 sm:p-5">
        <div className="overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-[#777168]">
              Tidak ada kendaraan yang cocok.
            </div>
          ) : (
            <table className="w-full text-left border-collapse whitespace-nowrap text-[13px]">
              <thead>
                <tr className="border-b border-[#e9e0d4] text-[11px] uppercase tracking-wider text-[#777168]">
                  <th className="py-2.5 px-3 font-bold">Plat Nomor</th>
                  <th className="py-2.5 px-3 font-bold">Kendaraan</th>
                  <th className="py-2.5 px-3 font-bold">Tahun</th>
                  <th className="py-2.5 px-3 font-bold">Pemilik</th>
                  <th className="py-2.5 px-3 font-bold">Riwayat</th>
                  <th className="py-2.5 px-3 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0eae2]">
                {filtered.map((k) => (
                  <tr key={k.id} className="hover:bg-[#fcf9f4]">
                    <td className="py-3 px-3 font-mono font-bold text-[#211f1c]">{k.plat}</td>
                    <td className="py-3 px-3">
                      {k.merek} {k.model}
                    </td>
                    <td className="py-3 px-3 font-mono tabular-nums">{k.tahun || '—'}</td>
                    <td className="py-3 px-3 text-[#777168]">{getCustomerName(k.pelangganId)}</td>
                    <td className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => setHistoryVehicle(k)}
                        className="text-xs font-bold text-[#875a32] hover:underline"
                      >
                        Lihat Riwayat
                      </button>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openForm(k)}
                          className="min-h-[32px] px-2.5 py-1 rounded-lg bg-[#eee5d9] hover:bg-[#e2d6c5] text-[#342b23] text-xs font-bold"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(k)}
                          className="min-h-[32px] px-2.5 py-1 rounded-lg bg-[#fbe7e4] hover:bg-[#f6d5d0] text-[#9b302a] text-xs font-bold"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal
        open={modalOpen}
        title={editing ? 'Edit Kendaraan' : 'Tambah Kendaraan'}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#62594f] mb-1">Pemilik</label>
              <select
                value={pelangganId}
                onChange={(e) => setPelangganId(e.target.value)}
                required
                className="w-full px-3 py-2.5 text-sm bg-white border border-[#ded5c9] rounded-xl"
              >
                {db.pelanggan.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nama} ({p.telepon})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#62594f] mb-1">Plat Nomor</label>
              <input
                value={plat}
                onChange={(e) => setPlat(e.target.value)}
                required
                className="w-full px-3 py-2.5 text-sm bg-white border border-[#ded5c9] rounded-xl font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#62594f] mb-1">Tahun</label>
              <input
                type="number"
                value={tahun}
                onChange={(e) => setTahun(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-white border border-[#ded5c9] rounded-xl tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#62594f] mb-1">Merek</label>
              <input
                value={merek}
                onChange={(e) => setMerek(e.target.value)}
                required
                className="w-full px-3 py-2.5 text-sm bg-white border border-[#ded5c9] rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#62594f] mb-1">Model</label>
              <input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                required
                className="w-full px-3 py-2.5 text-sm bg-white border border-[#ded5c9] rounded-xl"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-[#eee5d9] text-[#342b23] text-xs font-bold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="min-h-[40px] px-4 py-2 rounded-xl bg-[#9a6b42] text-white text-xs font-bold"
            >
              Simpan
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!historyVehicle}
        title={`Riwayat Servis · ${historyVehicle?.plat || ''}`}
        onClose={() => setHistoryVehicle(null)}
      >
        {historyList.length === 0 ? (
          <div className="py-8 text-center text-sm text-[#777168]">
            Belum ada riwayat servis untuk kendaraan ini.
          </div>
        ) : (
          <div className="divide-y divide-[#f0eae2]">
            {historyList.map((s) => (
              <div key={s.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-[#777168]">{s.tanggal}</span>
                    <b className="text-sm">{s.jenis}</b>
                    <ServiceStatusTag status={s.status} />
                  </div>
                  <div className="text-xs text-[#777168] mt-1">{s.keluhan}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono font-bold text-sm tabular-nums">
                    {rupiah(serviceTotal(s))}
                  </div>
                  {onOpenService && (
                    <button
                      type="button"
                      onClick={() => {
                        setHistoryVehicle(null);
                        onOpenService(s.id);
                      }}
                      className="text-xs font-bold text-[#875a32] hover:underline mt-0.5"
                    >
                      Buka Detail →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <Modal
        open={!!deleteTarget}
        title="Hapus Kendaraan"
        onClose={() => setDeleteTarget(null)}
        maxWidth="max-w-md"
      >
        <p className="text-sm text-[#62594f] mb-5">
          Hapus unit <b className="font-mono">{deleteTarget?.plat}</b>? Unit dengan riwayat servis
          tidak dapat dihapus.
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setDeleteTarget(null)}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-[#eee5d9] text-[#342b23] text-xs font-bold"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={confirmDelete}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-[#b84b42] text-white text-xs font-bold"
          >
            Hapus
          </button>
        </div>
      </Modal>
    </div>
  );
};

/* ==================== MEKANIK VIEW ==================== */
export const MechanicsView: React.FC<MasterProps> = ({ db, onUpdateDB, onToast }) => {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Mekanik | null>(null);
  const [nama, setNama] = useState('');
  const [telepon, setTelepon] = useState('');
  const [keahlian, setKeahlian] = useState('');

  const filtered = db.mekanik.filter((m) =>
    `${m.nama} ${m.keahlian}`.toLowerCase().includes(search.toLowerCase())
  );

  const openForm = (m: Mekanik | null) => {
    setEditing(m);
    setNama(m?.nama || '');
    setTelepon(m?.telepon || '');
    setKeahlian(m?.keahlian || '');
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      onToast('Nama mekanik wajib diisi.');
      return;
    }
    onUpdateDB((prev) => ({
      ...prev,
      mekanik: editing
        ? prev.mekanik.map((m) =>
            m.id === editing.id
              ? {
                  ...m,
                  nama: nama.trim(),
                  telepon: telepon.trim() || '-',
                  keahlian: keahlian.trim() || 'Umum',
                }
              : m
          )
        : [
            ...prev.mekanik,
            {
              id: 'm_' + uid(),
              nama: nama.trim(),
              telepon: telepon.trim() || '-',
              keahlian: keahlian.trim() || 'Umum',
              aktif: true,
            },
          ],
    }));
    setModalOpen(false);
    onToast(editing ? 'Data mekanik diperbarui.' : 'Mekanik baru ditambahkan.');
  };

  const toggleOrDelete = (m: Mekanik) => {
    if (m.aktif) {
      onUpdateDB((prev) => ({
        ...prev,
        mekanik: prev.mekanik.map((x) => (x.id === m.id ? { ...x, aktif: false } : x)),
      }));
      onToast(`Mekanik ${m.nama} dinonaktifkan.`);
    } else {
      const assigned = db.servis.some((s) => s.mekanikId === m.id);
      if (assigned) {
        onUpdateDB((prev) => ({
          ...prev,
          mekanik: prev.mekanik.map((x) => (x.id === m.id ? { ...x, aktif: true } : x)),
        }));
        onToast(`Mekanik ${m.nama} diaktifkan kembali.`);
      } else {
        onUpdateDB((prev) => ({
          ...prev,
          mekanik: prev.mekanik.filter((x) => x.id !== m.id),
        }));
        onToast(`Mekanik ${m.nama} dihapus.`);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[#211f1c]">Tim Mekanik</h2>
          <p className="text-xs text-[#777168]">
            Kelola data mekanik yang menangani servis bengkel.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative sm:w-60">
            <Search className="w-4 h-4 text-[#777168] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama / keahlian..."
              className="w-full min-h-[40px] pl-9 pr-3 py-2 text-xs bg-white border border-[#e9e0d4] rounded-xl"
            />
          </div>
          <button
            type="button"
            onClick={() => openForm(null)}
            className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-xl bg-[#9a6b42] hover:bg-[#855b36] text-white text-xs font-bold whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Mekanik</span>
          </button>
        </div>
      </div>

      <div className="bg-[#fffdfa] border border-[#e9e0d4] rounded-2xl p-4 sm:p-5">
        <div className="overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-[#777168]">
              Tidak ada mekanik yang cocok.
            </div>
          ) : (
            <table className="w-full text-left border-collapse whitespace-nowrap text-[13px]">
              <thead>
                <tr className="border-b border-[#e9e0d4] text-[11px] uppercase tracking-wider text-[#777168]">
                  <th className="py-2.5 px-3 font-bold">Nama Mekanik</th>
                  <th className="py-2.5 px-3 font-bold">Telepon</th>
                  <th className="py-2.5 px-3 font-bold">Keahlian</th>
                  <th className="py-2.5 px-3 font-bold">Status</th>
                  <th className="py-2.5 px-3 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0eae2]">
                {filtered.map((m) => (
                  <tr key={m.id} className="hover:bg-[#fcf9f4]">
                    <td className="py-3 px-3 font-bold text-[#211f1c]">{m.nama}</td>
                    <td className="py-3 px-3 font-mono text-xs tabular-nums">{m.telepon || '—'}</td>
                    <td className="py-3 px-3 text-[#777168]">{m.keahlian || '—'}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${
                          m.aktif
                            ? 'bg-[#e1f5ea] text-[#216944] border-[#b7e2ca]'
                            : 'bg-[#fff4d9] text-[#8a6116] border-[#efd9a0]'
                        }`}
                      >
                        {m.aktif ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openForm(m)}
                          className="min-h-[32px] px-2.5 py-1 rounded-lg bg-[#eee5d9] hover:bg-[#e2d6c5] text-[#342b23] text-xs font-bold"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleOrDelete(m)}
                          className="min-h-[32px] px-2.5 py-1 rounded-lg bg-[#fbe7e4] hover:bg-[#f6d5d0] text-[#9b302a] text-xs font-bold"
                        >
                          {m.aktif ? 'Nonaktifkan' : 'Aktifkan / Hapus'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal
        open={modalOpen}
        title={editing ? 'Edit Mekanik' : 'Tambah Mekanik'}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#62594f] mb-1">Nama Lengkap</label>
              <input
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                required
                className="w-full px-3 py-2.5 text-sm bg-white border border-[#ded5c9] rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#62594f] mb-1">Telepon</label>
              <input
                value={telepon}
                onChange={(e) => setTelepon(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-white border border-[#ded5c9] rounded-xl"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#62594f] mb-1">Keahlian</label>
              <input
                value={keahlian}
                onChange={(e) => setKeahlian(e.target.value)}
                placeholder="Contoh: Mesin & Tune Up"
                className="w-full px-3 py-2.5 text-sm bg-white border border-[#ded5c9] rounded-xl"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-[#eee5d9] text-[#342b23] text-xs font-bold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="min-h-[40px] px-4 py-2 rounded-xl bg-[#9a6b42] text-white text-xs font-bold"
            >
              Simpan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

/* ==================== LAPORAN KEUANGAN VIEW ==================== */
export const ReportsView: React.FC<{ db: WorkshopDB; onToast: (msg: string) => void }> = ({
  db,
  onToast,
}) => {
  const validServices = db.servis.filter((s) => s.status !== 'Dibatalkan');
  const rev = validServices.reduce((acc, s) => acc + servicePaid(s), 0);
  const billed = validServices.reduce((acc, s) => acc + serviceTotal(s), 0);
  const outstanding = Math.max(0, billed - rev);

  const getVehicle = (id: string) => db.kendaraan.find((k) => k.id === id);
  const getCustomerName = (pid?: string) =>
    db.pelanggan.find((p) => p.id === pid)?.nama || '—';

  const handleExportCSV = () => {
    const headers = [
      'Tanggal',
      'Plat Nomor',
      'Pelanggan',
      'Jenis Servis',
      'Status Servis',
      'Status Pembayaran',
      'Total Tagihan',
      'Dibayar',
      'Sisa Tagihan',
    ];
    const rows = db.servis.map((s) => {
      const v = getVehicle(s.kendaraanId);
      const tot = serviceTotal(s);
      const pd = servicePaid(s);
      const sisa = s.status === 'Dibatalkan' ? 0 : Math.max(0, tot - pd);
      return [
        s.tanggal,
        v?.plat || '-',
        getCustomerName(v?.pelangganId),
        s.jenis,
        s.status,
        getPayStatus(s),
        tot,
        pd,
        sisa,
      ]
        .map(csvCell)
        .join(',');
    });

    const csvContent = '\uFEFF' + [headers.map(csvCell).join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `autora-laporan-${today()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onToast('Laporan CSV berhasil diunduh.');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[#211f1c]">Laporan Keuangan & Operasional</h2>
          <p className="text-xs text-[#777168]">
            Rekap pendapatan bengkel dan status tagihan seluruh transaksi.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportCSV}
          className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-4 py-2 rounded-xl bg-[#9a6b42] hover:bg-[#855b36] text-white text-xs font-bold whitespace-nowrap"
        >
          <Download className="w-4 h-4" />
          <span>Ekspor CSV</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-[#fffdfa] border border-[#e9e0d4] rounded-2xl p-4">
          <div className="text-xs font-bold text-[#777168]">Total Tagihan</div>
          <div className="text-xl font-mono font-extrabold text-[#211f1c] mt-2 tabular-nums">
            {rupiah(billed)}
          </div>
        </div>
        <div className="bg-[#fffdfa] border border-[#e9e0d4] rounded-2xl p-4">
          <div className="text-xs font-bold text-[#777168]">Pembayaran Masuk</div>
          <div className="text-xl font-mono font-extrabold text-[#216944] mt-2 tabular-nums">
            {rupiah(rev)}
          </div>
        </div>
        <div className="bg-[#fffdfa] border border-[#e9e0d4] rounded-2xl p-4">
          <div className="text-xs font-bold text-[#777168]">Sisa Piutang</div>
          <div className="text-xl font-mono font-extrabold text-[#9b302a] mt-2 tabular-nums">
            {rupiah(outstanding)}
          </div>
        </div>
      </div>

      <div className="bg-[#fffdfa] border border-[#e9e0d4] rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-[#211f1c]">Rekap Servis & Pembayaran</h3>
          <span className="text-xs text-[#777168] tabular-nums">{db.servis.length} catatan</span>
        </div>

        <div className="overflow-x-auto">
          {db.servis.length === 0 ? (
            <div className="py-10 text-center text-sm text-[#777168]">Belum ada catatan servis.</div>
          ) : (
            <table className="w-full text-left border-collapse whitespace-nowrap text-[13px]">
              <thead>
                <tr className="border-b border-[#e9e0d4] text-[11px] uppercase tracking-wider text-[#777168]">
                  <th className="py-2.5 px-3 font-bold">Tanggal</th>
                  <th className="py-2.5 px-3 font-bold">Plat</th>
                  <th className="py-2.5 px-3 font-bold">Pelanggan</th>
                  <th className="py-2.5 px-3 font-bold">Jenis</th>
                  <th className="py-2.5 px-3 font-bold">Status</th>
                  <th className="py-2.5 px-3 font-bold">Bayar</th>
                  <th className="py-2.5 px-3 font-bold text-right">Tagihan</th>
                  <th className="py-2.5 px-3 font-bold text-right">Dibayar</th>
                  <th className="py-2.5 px-3 font-bold text-right">Sisa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0eae2]">
                {db.servis.map((s) => {
                  const v = getVehicle(s.kendaraanId);
                  const tot = serviceTotal(s);
                  const pd = servicePaid(s);
                  const sisa = s.status === 'Dibatalkan' ? 0 : Math.max(0, tot - pd);
                  return (
                    <tr key={s.id} className="hover:bg-[#fcf9f4]">
                      <td className="py-3 px-3 font-mono text-xs tabular-nums">{s.tanggal}</td>
                      <td className="py-3 px-3 font-mono font-bold">{v?.plat || '—'}</td>
                      <td className="py-3 px-3">{getCustomerName(v?.pelangganId)}</td>
                      <td className="py-3 px-3">{s.jenis}</td>
                      <td className="py-3 px-3">
                        <ServiceStatusTag status={s.status} />
                      </td>
                      <td className="py-3 px-3">
                        <PayStatusTag status={getPayStatus(s)} />
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums">{rupiah(tot)}</td>
                      <td className="py-3 px-3 text-right font-mono text-[#216944] tabular-nums">
                        {rupiah(pd)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-[#9b302a] tabular-nums">
                        {rupiah(sisa)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <p className="text-[11px] text-[#777168]">
        Catatan: Pendapatan adalah nominal yang sudah dibayarkan oleh pelanggan, tidak termasuk
        tagihan yang belum lunas atau dibatalkan.
      </p>
    </div>
  );
};

/* ==================== MANAJEMEN USER (RBAC) VIEW ==================== */
export const UsersView: React.FC<MasterProps> = ({
  db,
  currentUser,
  onUpdateDB,
  onToast,
}) => {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<UserAccount | null>(null);
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<Role>('user');
  const [nama, setNama] = useState('');
  const [password, setPassword] = useState('');

  const getCustomerName = (pid: string | null) =>
    pid ? db.pelanggan.find((p) => p.id === pid)?.nama || '—' : '—';

  const filtered = db.users.filter((u) =>
    `${u.username} ${u.nama} ${u.role}`.toLowerCase().includes(search.toLowerCase())
  );

  const openForm = (u: UserAccount | null) => {
    setEditing(u);
    setUsername(u?.username || '');
    setRole(u?.role || 'user');
    setNama(u?.nama || '');
    setPassword('');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const uname = username.trim().toLowerCase();
    const targetRole = editing?.id === currentUser.id ? 'admin' : role;

    if (!editing && !/^[a-z0-9_.-]{3,20}$/.test(uname)) {
      onToast('Username harus 3–20 karakter (huruf kecil, angka, titik, underscore).');
      return;
    }
    if (!editing && db.users.some((u) => u.username.toLowerCase() === uname)) {
      onToast('Username sudah terdaftar.');
      return;
    }
    if (!editing && password.length < 6) {
      onToast('Password minimal 6 karakter.');
      return;
    }
    if (editing && password && password.length < 6) {
      onToast('Password baru minimal 6 karakter.');
      return;
    }

    let nextSalt = editing?.salt || '';
    let nextHash = editing?.hash || '';
    if (!editing || password) {
      nextSalt = makeSalt();
      nextHash = await passwordDigest(password, nextSalt);
    }

    onUpdateDB((prev) => {
      if (editing) {
        let nextPelanggan = prev.pelanggan;
        let linkedPid = editing.pelangganId;
        if (targetRole === 'user' && !linkedPid) {
          linkedPid = 'p_' + uid();
          nextPelanggan = [
            ...prev.pelanggan,
            { id: linkedPid, nama: nama.trim(), telepon: '-', alamat: '-' },
          ];
        }
        return {
          ...prev,
          pelanggan: nextPelanggan,
          users: prev.users.map((u) =>
            u.id === editing.id
              ? {
                  ...u,
                  nama: nama.trim(),
                  role: targetRole,
                  pelangganId: linkedPid,
                  salt: nextSalt,
                  hash: nextHash,
                }
              : u
          ),
        };
      }

      let newPid: string | null = null;
      let nextPelanggan = prev.pelanggan;
      if (targetRole === 'user') {
        newPid = 'p_' + uid();
        nextPelanggan = [
          ...prev.pelanggan,
          { id: newPid, nama: nama.trim(), telepon: '-', alamat: '-' },
        ];
      }

      const newUser: UserAccount = {
        id: 'u_' + uid(),
        username: uname,
        nama: nama.trim(),
        role: targetRole,
        pelangganId: newPid,
        salt: nextSalt,
        hash: nextHash,
        aktif: true,
        createdAt: today(),
      };
      return {
        ...prev,
        pelanggan: nextPelanggan,
        users: [...prev.users, newUser],
      };
    });

    setModalOpen(false);
    onToast(editing ? 'Akun pengguna diperbarui.' : `Akun @${uname} berhasil dibuat.`);
  };

  const toggleActive = (u: UserAccount) => {
    if (u.id === currentUser.id) return;
    onUpdateDB((prev) => ({
      ...prev,
      users: prev.users.map((x) => (x.id === u.id ? { ...x, aktif: !x.aktif } : x)),
    }));
    onToast(`Akun @${u.username} ${u.aktif ? 'dinonaktifkan' : 'diaktifkan'}.`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[#211f1c]">
            Manajemen Akun & Hak Akses (RBAC)
          </h2>
          <p className="text-xs text-[#777168]">
            Buat & kelola akun berbeda untuk setiap Admin, Operator, dan User Biasa.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative sm:w-60">
            <Search className="w-4 h-4 text-[#777168] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari username / nama / peran..."
              className="w-full min-h-[40px] pl-9 pr-3 py-2 text-xs bg-white border border-[#e9e0d4] rounded-xl"
            />
          </div>
          <button
            type="button"
            onClick={() => openForm(null)}
            className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-xl bg-[#9a6b42] hover:bg-[#855b36] text-white text-xs font-bold whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Akun Baru</span>
          </button>
        </div>
      </div>

      <div className="bg-[#fffdfa] border border-[#e9e0d4] rounded-2xl p-4 sm:p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap text-[13px]">
            <thead>
              <tr className="border-b border-[#e9e0d4] text-[11px] uppercase tracking-wider text-[#777168]">
                <th className="py-2.5 px-3 font-bold">Username</th>
                <th className="py-2.5 px-3 font-bold">Nama Lengkap</th>
                <th className="py-2.5 px-3 font-bold">Role</th>
                <th className="py-2.5 px-3 font-bold">Pelanggan Terkait</th>
                <th className="py-2.5 px-3 font-bold">Status</th>
                <th className="py-2.5 px-3 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0eae2]">
              {filtered.map((u) => {
                const isSelf = u.id === currentUser.id;
                return (
                  <tr key={u.id} className="hover:bg-[#fcf9f4]">
                    <td className="py-3 px-3 font-mono font-bold text-[#211f1c]">@{u.username}</td>
                    <td className="py-3 px-3 font-medium">{u.nama}</td>
                    <td className="py-3 px-3">
                      <RoleTag role={u.role} />
                    </td>
                    <td className="py-3 px-3 text-[#777168]">{getCustomerName(u.pelangganId)}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${
                          u.aktif
                            ? 'bg-[#e1f5ea] text-[#216944] border-[#b7e2ca]'
                            : 'bg-[#fbe7e4] text-[#9b302a] border-[#f0c5be]'
                        }`}
                      >
                        {u.aktif ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openForm(u)}
                          className="min-h-[32px] px-2.5 py-1 rounded-lg bg-[#eee5d9] hover:bg-[#e2d6c5] text-[#342b23] text-xs font-bold"
                        >
                          Edit / Pass
                        </button>
                        {isSelf ? (
                          <span className="text-[11px] text-[#777168] px-2">(Anda)</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => toggleActive(u)}
                            className="min-h-[32px] px-2.5 py-1 rounded-lg bg-[#fbe7e4] hover:bg-[#f6d5d0] text-[#9b302a] text-xs font-bold"
                          >
                            {u.aktif ? 'Nonaktifkan' : 'Aktifkan'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={modalOpen}
        title={editing ? `Edit Akun @${editing.username}` : 'Buat Akun Baru'}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#62594f] mb-1">Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                readOnly={!!editing}
                required={!editing}
                placeholder="Username unik"
                className={`w-full px-3 py-2.5 text-sm border border-[#ded5c9] rounded-xl font-mono ${
                  editing ? 'bg-[#f5f0e8] text-[#777168]' : 'bg-white'
                }`}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#62594f] mb-1">Peran (Role)</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                disabled={editing?.id === currentUser.id}
                className="w-full px-3 py-2.5 text-sm bg-white border border-[#ded5c9] rounded-xl"
              >
                <option value="user">User Biasa (Pelanggan)</option>
                <option value="operator">Operator Bengkel</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#62594f] mb-1">Nama Lengkap</label>
              <input
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                required
                placeholder="Nama lengkap"
                className="w-full px-3 py-2.5 text-sm bg-white border border-[#ded5c9] rounded-xl"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#62594f] mb-1">
                {editing ? 'Password Baru (opsional)' : 'Password'}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={!editing}
                placeholder="Minimal 6 karakter"
                className="w-full px-3 py-2.5 text-sm bg-white border border-[#ded5c9] rounded-xl"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-[#eee5d9] text-[#342b23] text-xs font-bold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="min-h-[40px] px-4 py-2 rounded-xl bg-[#9a6b42] text-white text-xs font-bold"
            >
              Simpan Akun
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
