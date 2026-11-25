import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Plus,
  Printer,
  Search,
  Trash2,
  Wrench,
} from 'lucide-react';
import {
  Payment,
  Role,
  ServiceDetail,
  ServiceStatus,
  Servis,
  WorkshopDB,
} from '../types';
import {
  getPayStatus,
  rupiah,
  servicePaid,
  serviceTotal,
  today,
  uid,
} from '../utils/storage';
import { Modal } from './Modal';
import { PayStatusTag, ServiceStatusTag } from './StatusLabel';

interface ServiceManagerProps {
  db: WorkshopDB;
  role: Role;
  selectedServiceId: string | null;
  onSelectServiceId: (id: string | null) => void;
  onUpdateDB: (updater: (prev: WorkshopDB) => WorkshopDB) => void;
  onToast: (msg: string) => void;
}

export const ServiceManager: React.FC<ServiceManagerProps> = ({
  db,
  role,
  selectedServiceId,
  onSelectServiceId,
  onUpdateDB,
  onToast,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [addOpen, setAddOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Add queue form state
  const [newVehicleId, setNewVehicleId] = useState('');
  const [newMechanicId, setNewMechanicId] = useState('');
  const [newTanggal, setNewTanggal] = useState(today());
  const [newJenis, setNewJenis] = useState('Servis Berkala');
  const [newBiayaJasa, setNewBiayaJasa] = useState('50000');
  const [newKeluhan, setNewKeluhan] = useState('');

  // Manage service modal state
  const managedService = selectedServiceId
    ? db.servis.find((s) => s.id === selectedServiceId) || null
    : null;

  const [editStatus, setEditStatus] = useState<ServiceStatus>('Menunggu');
  const [editMechanicId, setEditMechanicId] = useState<string>('');
  const [editBiayaJasa, setEditBiayaJasa] = useState<string>('0');
  const [editDiagnosa, setEditDiagnosa] = useState<string>('');

  // New line item form
  const [partTipe, setPartTipe] = useState<'Sparepart' | 'Jasa Tambahan'>('Sparepart');
  const [partDesk, setPartDesk] = useState('');
  const [partJumlah, setPartJumlah] = useState('1');
  const [partHarga, setPartHarga] = useState('');

  // New payment form
  const [payJumlah, setPayJumlah] = useState('');
  const [payMetode, setPayMetode] = useState<Payment['metode']>('Tunai');

  useEffect(() => {
    if (managedService) {
      setEditStatus(managedService.status);
      setEditMechanicId(managedService.mekanikId || '');
      setEditBiayaJasa(String(managedService.biayaJasa));
      setEditDiagnosa(managedService.diagnosa || '');
      const remaining = Math.max(0, serviceTotal(managedService) - servicePaid(managedService));
      setPayJumlah(remaining > 0 ? String(remaining) : '');
    }
  }, [managedService?.id, managedService?.status, managedService?.biayaJasa, managedService?.details.length, managedService?.payments.length]);

  const getVehicle = (id: string) => db.kendaraan.find((k) => k.id === id);
  const getCustomerName = (pid?: string) =>
    db.pelanggan.find((p) => p.id === pid)?.nama || '—';
  const getMechanicName = (mid: string | null) =>
    db.mekanik.find((m) => m.id === mid)?.nama || 'Belum ditugaskan';

  const openAddModal = () => {
    if (db.kendaraan.length === 0) {
      onToast('Belum ada unit kendaraan terdaftar.');
      return;
    }
    setNewVehicleId(db.kendaraan[0].id);
    setNewMechanicId('');
    setNewTanggal(today());
    setNewJenis('Servis Berkala');
    setNewBiayaJasa('50000');
    setNewKeluhan('');
    setAddOpen(true);
  };

  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehicleId || !newKeluhan.trim()) {
      onToast('Pilih kendaraan dan isi keluhan servis.');
      return;
    }
    const created: Servis = {
      id: 's_' + uid(),
      kendaraanId: newVehicleId,
      mekanikId: newMechanicId || null,
      tanggal: newTanggal || today(),
      keluhan: newKeluhan.trim(),
      diagnosa: 'Menunggu pemeriksaan mekanik',
      jenis: newJenis,
      biayaJasa: Math.max(0, Number(newBiayaJasa) || 0),
      status: newMechanicId ? 'Dikerjakan' : 'Menunggu',
      details: [],
      payments: [],
    };
    onUpdateDB((prev) => ({
      ...prev,
      servis: [...prev.servis, created],
    }));
    setAddOpen(false);
    onToast('Antrean servis baru berhasil ditambahkan.');
  };

  const handleSaveServiceInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!managedService) return;
    onUpdateDB((prev) => ({
      ...prev,
      servis: prev.servis.map((s) =>
        s.id === managedService.id
          ? {
              ...s,
              status: editStatus,
              mekanikId: editMechanicId || null,
              biayaJasa: Math.max(0, Number(editBiayaJasa) || 0),
              diagnosa: editDiagnosa.trim(),
            }
          : s
      ),
    }));
    onToast('Progres & info servis diperbarui.');
  };

  const handleAddDetail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!managedService) return;
    const qty = Math.max(1, Number(partJumlah) || 1);
    const price = Math.max(0, Number(partHarga) || 0);
    if (!partDesk.trim() || price <= 0) {
      onToast('Isi deskripsi dan harga item dengan benar.');
      return;
    }
    const item: ServiceDetail = {
      id: 'd_' + uid(),
      tipe: partTipe,
      deskripsi: partDesk.trim(),
      jumlah: qty,
      harga: price,
    };
    onUpdateDB((prev) => ({
      ...prev,
      servis: prev.servis.map((s) =>
        s.id === managedService.id ? { ...s, details: [...(s.details || []), item] } : s
      ),
    }));
    setPartDesk('');
    setPartJumlah('1');
    setPartHarga('');
    onToast('Item biaya ditambahkan.');
  };

  const handleRemoveDetail = (detailId: string) => {
    if (!managedService) return;
    onUpdateDB((prev) => ({
      ...prev,
      servis: prev.servis.map((s) =>
        s.id === managedService.id
          ? { ...s, details: (s.details || []).filter((d) => d.id !== detailId) }
          : s
      ),
    }));
    onToast('Item biaya dihapus.');
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!managedService) return;
    const amount = Math.max(0, Number(payJumlah) || 0);
    if (amount <= 0) {
      onToast('Masukkan nominal pembayaran yang valid.');
      return;
    }
    const payment: Payment = {
      id: 'pay_' + uid(),
      tanggal: today(),
      jumlah: amount,
      metode: payMetode,
    };
    onUpdateDB((prev) => ({
      ...prev,
      servis: prev.servis.map((s) =>
        s.id === managedService.id
          ? { ...s, payments: [...(s.payments || []), payment] }
          : s
      ),
    }));
    onToast(`Pembayaran ${rupiah(amount)} (${payMetode}) dicatat.`);
  };

  const confirmDeleteService = () => {
    if (!deleteConfirmId) return;
    onUpdateDB((prev) => ({
      ...prev,
      servis: prev.servis.filter((s) => s.id !== deleteConfirmId),
    }));
    setDeleteConfirmId(null);
    onSelectServiceId(null);
    onToast('Data servis dihapus.');
  };

  const filtered = [...db.servis]
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal))
    .filter((s) => {
      if (statusFilter && s.status !== statusFilter) return false;
      const v = getVehicle(s.kendaraanId);
      const q = search.toLowerCase();
      return `${v?.plat || ''} ${getCustomerName(v?.pelangganId)} ${s.keluhan} ${s.jenis}`
        .toLowerCase()
        .includes(q);
    });

  const todayStr = today();
  const waitingCount = db.servis.filter((s) => s.status === 'Menunggu').length;
  const workingCount = db.servis.filter((s) => s.status === 'Dikerjakan').length;
  const doneTodayCount = db.servis.filter(
    (s) => s.status === 'Selesai' && s.tanggal === todayStr
  ).length;

  const managedVehicle = managedService ? getVehicle(managedService.kendaraanId) : null;
  const managedTotal = managedService ? serviceTotal(managedService) : 0;
  const managedPaid = managedService ? servicePaid(managedService) : 0;
  const managedSisa =
    managedService?.status === 'Dibatalkan' ? 0 : Math.max(0, managedTotal - managedPaid);

  return (
    <div className="space-y-4">
      {role === 'operator' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-[#fffdfa] border border-[#e9e0d4] rounded-2xl p-4">
            <div className="flex items-start justify-between">
              <span className="text-xs font-bold text-[#777168]">Antrean Menunggu</span>
              <div className="w-8 h-8 rounded-xl bg-[#fff4d9] flex items-center justify-center">
                <Clock className="w-4 h-4 text-[#8a6116]" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-[#211f1c] mt-2 tabular-nums">
              {waitingCount}
            </div>
            <div className="text-[11px] text-[#777168]">Perlu ditugaskan</div>
          </div>

          <div className="bg-[#fffdfa] border border-[#e9e0d4] rounded-2xl p-4">
            <div className="flex items-start justify-between">
              <span className="text-xs font-bold text-[#777168]">Dikerjakan</span>
              <div className="w-8 h-8 rounded-xl bg-[#e8f0fe] flex items-center justify-center">
                <Wrench className="w-4 h-4 text-[#28508e]" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-[#211f1c] mt-2 tabular-nums">
              {workingCount}
            </div>
            <div className="text-[11px] text-[#777168]">Dalam pengerjaan</div>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-[#fffdfa] border border-[#e9e0d4] rounded-2xl p-4">
            <div className="flex items-start justify-between">
              <span className="text-xs font-bold text-[#777168]">Selesai Hari Ini</span>
              <div className="w-8 h-8 rounded-xl bg-[#e1f5ea] flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-[#216944]" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-[#211f1c] mt-2 tabular-nums">
              {doneTodayCount}
            </div>
            <div className="text-[11px] text-[#777168]">Siap diambil pelanggan</div>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[#211f1c]">Antrean & Manajemen Servis</h2>
          <p className="text-xs text-[#777168]">
            Kelola antrean masuk, tugaskan mekanik, rincian biaya, dan pembayaran pelanggan.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="min-h-[40px] px-3 py-2 text-xs font-semibold bg-white border border-[#e9e0d4] rounded-xl text-[#211f1c]"
          >
            <option value="">Semua Status Antrean</option>
            <option value="Menunggu">Menunggu</option>
            <option value="Dikerjakan">Dikerjakan</option>
            <option value="Selesai">Selesai</option>
            <option value="Dibatalkan">Dibatalkan</option>
          </select>

          <div className="relative flex-1 sm:w-56">
            <Search className="w-4 h-4 text-[#777168] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari plat / keluhan / nama..."
              className="w-full min-h-[40px] pl-9 pr-3 py-2 text-xs bg-white border border-[#e9e0d4] rounded-xl"
            />
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-xl bg-[#9a6b42] hover:bg-[#855b36] text-white text-xs font-bold transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Antrean</span>
          </button>
        </div>
      </div>

      <div className="bg-[#fffdfa] border border-[#e9e0d4] rounded-2xl p-4 sm:p-5">
        <div className="overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-[#777168]">
              Tidak ada antrean servis yang sesuai dengan pencarian.
            </div>
          ) : (
            <table className="w-full text-left border-collapse whitespace-nowrap text-[13px]">
              <thead>
                <tr className="border-b border-[#e9e0d4] text-[11px] uppercase tracking-wider text-[#777168]">
                  <th className="py-2.5 px-3 font-bold">Tanggal</th>
                  <th className="py-2.5 px-3 font-bold">Kendaraan / Pemilik</th>
                  <th className="py-2.5 px-3 font-bold">Keluhan & Jenis</th>
                  <th className="py-2.5 px-3 font-bold">Mekanik</th>
                  <th className="py-2.5 px-3 font-bold">Status</th>
                  <th className="py-2.5 px-3 font-bold">Bayar</th>
                  <th className="py-2.5 px-3 font-bold text-right">Total</th>
                  <th className="py-2.5 px-3 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0eae2]">
                {filtered.map((s) => {
                  const v = getVehicle(s.kendaraanId);
                  return (
                    <tr key={s.id} className="hover:bg-[#fcf9f4]">
                      <td className="py-3 px-3 font-mono text-xs tabular-nums">{s.tanggal}</td>
                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-[#211f1c]">{v?.plat || '—'}</div>
                        <div className="text-xs text-[#777168]">
                          {getCustomerName(v?.pelangganId)}
                        </div>
                      </td>
                      <td className="py-3 px-3 max-w-[220px]">
                        <div className="font-semibold text-[#211f1c]">{s.jenis}</div>
                        <div className="text-xs text-[#777168] truncate">{s.keluhan}</div>
                      </td>
                      <td className="py-3 px-3 text-[#777168]">{getMechanicName(s.mekanikId)}</td>
                      <td className="py-3 px-3">
                        <ServiceStatusTag status={s.status} />
                      </td>
                      <td className="py-3 px-3">
                        <PayStatusTag status={getPayStatus(s)} />
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold tabular-nums">
                        {rupiah(serviceTotal(s))}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => onSelectServiceId(s.id)}
                          className="min-h-[34px] px-3 py-1 rounded-lg bg-[#9a6b42] hover:bg-[#855b36] text-white text-xs font-bold"
                        >
                          Kelola
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Tambah Antrean */}
      <Modal
        open={addOpen}
        title="Tambah Antrean Servis"
        onClose={() => setAddOpen(false)}
      >
        <form onSubmit={handleCreateService} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#62594f] mb-1">Kendaraan</label>
              <select
                value={newVehicleId}
                onChange={(e) => setNewVehicleId(e.target.value)}
                required
                className="w-full px-3 py-2.5 text-sm bg-white border border-[#ded5c9] rounded-xl"
              >
                {db.kendaraan.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.plat} — {k.merek} {k.model} ({getCustomerName(k.pelangganId)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#62594f] mb-1">Tanggal Masuk</label>
              <input
                type="date"
                value={newTanggal}
                onChange={(e) => setNewTanggal(e.target.value)}
                required
                className="w-full px-3 py-2.5 text-sm bg-white border border-[#ded5c9] rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#62594f] mb-1">Jenis Layanan</label>
              <select
                value={newJenis}
                onChange={(e) => setNewJenis(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-white border border-[#ded5c9] rounded-xl"
              >
                <option value="Servis Berkala">Servis Berkala</option>
                <option value="Tune Up">Tune Up</option>
                <option value="Perbaikan Rem">Perbaikan Rem</option>
                <option value="Kelistrikan">Kelistrikan</option>
                <option value="Servis Umum">Servis Umum</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#62594f] mb-1">
                Tugaskan Mekanik
              </label>
              <select
                value={newMechanicId}
                onChange={(e) => setNewMechanicId(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-white border border-[#ded5c9] rounded-xl"
              >
                <option value="">— Pilih nanti —</option>
                {db.mekanik
                  .filter((m) => m.aktif)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nama} ({m.keahlian})
                    </option>
                  ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#62594f] mb-1">
                Estimasi Biaya Jasa (Rp)
              </label>
              <input
                type="number"
                min={0}
                value={newBiayaJasa}
                onChange={(e) => setNewBiayaJasa(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-white border border-[#ded5c9] rounded-xl font-mono tabular-nums"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#62594f] mb-1">Keluhan</label>
              <textarea
                rows={3}
                value={newKeluhan}
                onChange={(e) => setNewKeluhan(e.target.value)}
                required
                placeholder="Catatan keluhan kendaraan..."
                className="w-full px-3 py-2.5 text-sm bg-white border border-[#ded5c9] rounded-xl"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setAddOpen(false)}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-[#eee5d9] text-[#342b23] text-xs font-bold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="min-h-[40px] px-4 py-2 rounded-xl bg-[#9a6b42] hover:bg-[#855b36] text-white text-xs font-bold"
            >
              Simpan Antrean
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Kelola Detail Servis, Rincian Sparepart & Pembayaran */}
      <Modal
        open={!!managedService}
        title={`Kelola Servis · ${managedVehicle?.plat || ''}`}
        onClose={() => onSelectServiceId(null)}
        maxWidth="max-w-3xl"
        printable
      >
        {managedService && (
          <div className="space-y-5">
            {/* Ringkasan Header & Nota Printable */}
            <div className="p-4 rounded-2xl bg-[#faf6ef] border border-[#e9e0d4] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-extrabold text-sm bg-[#28231f] text-[#efb84f] px-2.5 py-0.5 rounded-md">
                    {managedVehicle?.plat || '—'}
                  </span>
                  <span className="font-bold text-sm text-[#211f1c]">
                    {managedVehicle?.merek} {managedVehicle?.model}
                  </span>
                  <ServiceStatusTag status={managedService.status} />
                  <PayStatusTag status={getPayStatus(managedService)} />
                </div>
                <div className="text-xs text-[#777168] mt-1.5">
                  Pemilik: <b>{getCustomerName(managedVehicle?.pelangganId)}</b> · Tanggal:{' '}
                  <span className="font-mono">{managedService.tanggal}</span> · {managedService.jenis}
                </div>
                <div className="text-xs text-[#211f1c] mt-1">
                  <b>Keluhan:</b> {managedService.keluhan}
                </div>
              </div>
              <div className="text-left sm:text-right shrink-0">
                <div className="text-xs text-[#777168]">Total Tagihan</div>
                <div className="text-xl font-mono font-extrabold text-[#211f1c] tabular-nums">
                  {rupiah(managedTotal)}
                </div>
                <div className="text-xs font-mono text-[#9b302a] font-semibold tabular-nums">
                  Sisa: {rupiah(managedSisa)}
                </div>
              </div>
            </div>

            {/* Form Update Progres & Diagnosa */}
            <form
              onSubmit={handleSaveServiceInfo}
              className="p-4 rounded-2xl border border-[#e9e0d4] bg-white space-y-3 no-print"
            >
              <div className="text-xs font-bold uppercase tracking-wider text-[#9a6b42]">
                1. Progres, Mekanik & Biaya Jasa
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#62594f] mb-1">
                    Status Antrean
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as ServiceStatus)}
                    className="w-full px-3 py-2 text-sm bg-white border border-[#ded5c9] rounded-xl"
                  >
                    <option value="Menunggu">Menunggu</option>
                    <option value="Dikerjakan">Dikerjakan</option>
                    <option value="Selesai">Selesai</option>
                    <option value="Dibatalkan">Dibatalkan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#62594f] mb-1">Mekanik</label>
                  <select
                    value={editMechanicId}
                    onChange={(e) => setEditMechanicId(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-[#ded5c9] rounded-xl"
                  >
                    <option value="">Belum ditugaskan</option>
                    {db.mekanik.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nama} {!m.aktif ? '(Nonaktif)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#62594f] mb-1">
                    Biaya Jasa (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editBiayaJasa}
                    onChange={(e) => setEditBiayaJasa(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-[#ded5c9] rounded-xl font-mono tabular-nums"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#62594f] mb-1">
                  Diagnosa / Catatan Mekanik
                </label>
                <textarea
                  rows={2}
                  value={editDiagnosa}
                  onChange={(e) => setEditDiagnosa(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-[#ded5c9] rounded-xl"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="min-h-[38px] px-4 py-1.5 rounded-xl bg-[#28231f] hover:bg-[#3f3730] text-white text-xs font-bold"
                >
                  Simpan Perubahan Servis
                </button>
              </div>
            </form>

            {/* Rincian Sparepart & Jasa Tambahan */}
            <div className="p-4 rounded-2xl border border-[#e9e0d4] bg-white space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-[#9a6b42]">
                2. Rincian Biaya Sparepart & Jasa Tambahan
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[13px]">
                  <thead>
                    <tr className="border-b border-[#e9e0d4] text-[11px] uppercase tracking-wider text-[#777168]">
                      <th className="py-2 px-2">Tipe</th>
                      <th className="py-2 px-2">Deskripsi</th>
                      <th className="py-2 px-2 text-right">Qty</th>
                      <th className="py-2 px-2 text-right">Harga</th>
                      <th className="py-2 px-2 text-right">Subtotal</th>
                      <th className="py-2 px-2 text-right no-print">Hapus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0eae2]">
                    <tr>
                      <td className="py-2 px-2 text-[#777168]">Jasa Pokok</td>
                      <td className="py-2 px-2 font-medium">{managedService.jenis}</td>
                      <td className="py-2 px-2 text-right font-mono tabular-nums">1</td>
                      <td className="py-2 px-2 text-right font-mono tabular-nums">
                        {rupiah(managedService.biayaJasa)}
                      </td>
                      <td className="py-2 px-2 text-right font-mono font-bold tabular-nums">
                        {rupiah(managedService.biayaJasa)}
                      </td>
                      <td className="py-2 px-2 no-print" />
                    </tr>
                    {(managedService.details || []).map((d) => (
                      <tr key={d.id}>
                        <td className="py-2 px-2 text-xs text-[#777168]">{d.tipe}</td>
                        <td className="py-2 px-2 font-medium">{d.deskripsi}</td>
                        <td className="py-2 px-2 text-right font-mono tabular-nums">{d.jumlah}</td>
                        <td className="py-2 px-2 text-right font-mono tabular-nums">
                          {rupiah(d.harga)}
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-bold tabular-nums">
                          {rupiah(d.jumlah * d.harga)}
                        </td>
                        <td className="py-2 px-2 text-right no-print">
                          <button
                            type="button"
                            onClick={() => handleRemoveDetail(d.id)}
                            className="p-1.5 rounded-lg text-[#9b302a] hover:bg-[#fbe7e4]"
                            aria-label="Hapus item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <form
                onSubmit={handleAddDetail}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-2 border-t border-[#f0eae2] no-print"
              >
                <select
                  value={partTipe}
                  onChange={(e) =>
                    setPartTipe(e.target.value as 'Sparepart' | 'Jasa Tambahan')
                  }
                  className="sm:col-span-3 px-2.5 py-2 text-xs bg-white border border-[#ded5c9] rounded-lg"
                >
                  <option value="Sparepart">Sparepart</option>
                  <option value="Jasa Tambahan">Jasa Tambahan</option>
                </select>
                <input
                  value={partDesk}
                  onChange={(e) => setPartDesk(e.target.value)}
                  placeholder="Nama sparepart / jasa..."
                  className="sm:col-span-4 px-2.5 py-2 text-xs bg-white border border-[#ded5c9] rounded-lg"
                />
                <input
                  type="number"
                  min={1}
                  value={partJumlah}
                  onChange={(e) => setPartJumlah(e.target.value)}
                  placeholder="Qty"
                  className="sm:col-span-1 px-2 py-2 text-xs bg-white border border-[#ded5c9] rounded-lg font-mono tabular-nums"
                />
                <input
                  type="number"
                  min={0}
                  value={partHarga}
                  onChange={(e) => setPartHarga(e.target.value)}
                  placeholder="Harga (Rp)"
                  className="sm:col-span-2 px-2.5 py-2 text-xs bg-white border border-[#ded5c9] rounded-lg font-mono tabular-nums"
                />
                <button
                  type="submit"
                  className="sm:col-span-2 min-h-[36px] px-3 py-1.5 rounded-lg bg-[#eee5d9] hover:bg-[#e2d6c5] text-[#342b23] text-xs font-bold"
                >
                  + Tambah
                </button>
              </form>
            </div>

            {/* Pembayaran */}
            <div className="p-4 rounded-2xl border border-[#e9e0d4] bg-white space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase tracking-wider text-[#9a6b42]">
                  3. Riwayat & Input Pembayaran
                </div>
                <div className="text-xs font-mono font-bold text-[#216944] tabular-nums">
                  Terbayar: {rupiah(managedPaid)} / {rupiah(managedTotal)}
                </div>
              </div>

              {(managedService.payments || []).length > 0 && (
                <div className="divide-y divide-[#f0eae2] text-xs">
                  {managedService.payments.map((p) => (
                    <div key={p.id} className="py-2 flex items-center justify-between">
                      <span>
                        <span className="font-mono text-[#777168]">{p.tanggal}</span> ·{' '}
                        <b>{p.metode}</b>
                      </span>
                      <span className="font-mono font-bold text-[#216944] tabular-nums">
                        +{rupiah(p.jumlah)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {managedService.status !== 'Dibatalkan' && managedSisa > 0 && (
                <form
                  onSubmit={handleRecordPayment}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-2 border-t border-[#f0eae2] no-print"
                >
                  <input
                    type="number"
                    min={1}
                    value={payJumlah}
                    onChange={(e) => setPayJumlah(e.target.value)}
                    placeholder="Nominal bayar (Rp)"
                    className="sm:col-span-5 px-3 py-2 text-xs bg-white border border-[#ded5c9] rounded-lg font-mono tabular-nums"
                  />
                  <select
                    value={payMetode}
                    onChange={(e) => setPayMetode(e.target.value as Payment['metode'])}
                    className="sm:col-span-4 px-3 py-2 text-xs bg-white border border-[#ded5c9] rounded-lg"
                  >
                    <option value="Tunai">Tunai</option>
                    <option value="Transfer">Transfer Bank</option>
                    <option value="QRIS">QRIS</option>
                    <option value="Debit">Kartu Debit</option>
                  </select>
                  <button
                    type="submit"
                    className="sm:col-span-3 min-h-[36px] px-3 py-1.5 rounded-lg bg-[#2f805b] hover:bg-[#256a4b] text-white text-xs font-bold"
                  >
                    Catat Bayar
                  </button>
                </form>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 pt-1 no-print flex-wrap">
              <div>
                {role === 'admin' && (
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(managedService.id)}
                    className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#fbe7e4] hover:bg-[#f6d5d0] text-[#9b302a] text-xs font-bold"
                  >
                    Hapus Servis
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 rounded-xl bg-[#eee5d9] hover:bg-[#e2d6c5] text-[#342b23] text-xs font-bold"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Nota</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectServiceId(null)}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-[#9a6b42] hover:bg-[#855b36] text-white text-xs font-bold"
                >
                  Selesai
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Konfirmasi Hapus Servis */}
      <Modal
        open={!!deleteConfirmId}
        title="Hapus Data Servis"
        onClose={() => setDeleteConfirmId(null)}
        maxWidth="max-w-md"
      >
        <p className="text-sm text-[#62594f] mb-5">
          Hapus permanen data transaksi servis ini beserta seluruh rincian biaya dan pembayarannya?
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setDeleteConfirmId(null)}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-[#eee5d9] text-[#342b23] text-xs font-bold"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={confirmDeleteService}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-[#b84b42] hover:bg-[#9b302a] text-white text-xs font-bold"
          >
            Hapus Permanen
          </button>
        </div>
      </Modal>
    </div>
  );
};
