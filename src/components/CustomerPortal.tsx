import React, { useState } from 'react';
import { CalendarPlus, Car, CheckCircle2, Clock, CreditCard, Plus, Printer, Receipt } from 'lucide-react';
import { Kendaraan, Servis, UserAccount, WorkshopDB } from '../types';
import { getPayStatus, rupiah, servicePaid, serviceTotal, today, uid } from '../utils/storage';
import { Modal } from './Modal';
import { PayStatusTag, ServiceStatusTag } from './StatusLabel';

interface CustomerPortalProps {
  db: WorkshopDB;
  currentUser: UserAccount;
  mode: 'portal' | 'tagihan';
  onUpdateDB: (updater: (prev: WorkshopDB) => WorkshopDB) => void;
  onToast: (msg: string) => void;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({
  db,
  currentUser,
  mode,
  onUpdateDB,
  onToast,
}) => {
  const [vehicleModal, setVehicleModal] = useState<{ open: boolean; editing: Kendaraan | null }>({
    open: false,
    editing: null,
  });
  const [bookingModal, setBookingModal] = useState<{ open: boolean; preselectVehicleId: string }>({
    open: false,
    preselectVehicleId: '',
  });
  const [detailServiceId, setDetailServiceId] = useState<string | null>(null);
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);

  // Vehicle form state
  const [plat, setPlat] = useState('');
  const [merek, setMerek] = useState('');
  const [model, setModel] = useState('');
  const [tahun, setTahun] = useState('2022');

  // Booking form state
  const [bookVehicleId, setBookVehicleId] = useState('');
  const [bookDate, setBookDate] = useState(today());
  const [bookJenis, setBookJenis] = useState('Servis Berkala');
  const [bookKeluhan, setBookKeluhan] = useState('');

  const pelangganId = currentUser.pelangganId || '';
  const myVehicles = db.kendaraan.filter((k) => k.pelangganId === pelangganId);
  const myVehicleIds = new Set(myVehicles.map((v) => v.id));
  const myServices = [...db.servis]
    .filter((s) => myVehicleIds.has(s.kendaraanId))
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal));

  const getVehicle = (id: string) => db.kendaraan.find((k) => k.id === id);
  const getCustomerName = (pid?: string) =>
    db.pelanggan.find((p) => p.id === pid)?.nama || currentUser.nama;
  const getMechanicName = (mid: string | null) =>
    db.mekanik.find((m) => m.id === mid)?.nama || 'Belum ditugaskan';

  const openVehicleForm = (v: Kendaraan | null = null) => {
    setPlat(v?.plat || '');
    setMerek(v?.merek || '');
    setModel(v?.model || '');
    setTahun(String(v?.tahun || 2022));
    setVehicleModal({ open: true, editing: v });
  };

  const handleSaveVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPlat = plat.trim().toUpperCase().replace(/\s+/g, ' ');
    if (!cleanPlat || !merek.trim() || !model.trim()) {
      onToast('Lengkapi plat nomor, merek, dan model kendaraan.');
      return;
    }
    const editingId = vehicleModal.editing?.id;
    if (db.kendaraan.some((k) => k.plat === cleanPlat && k.id !== editingId)) {
      onToast('Nomor plat sudah terdaftar di sistem.');
      return;
    }

    onUpdateDB((prev) => {
      let targetPid = currentUser.pelangganId;
      let nextPelanggan = prev.pelanggan;
      let nextUsers = prev.users;

      if (!targetPid || !prev.pelanggan.some((p) => p.id === targetPid)) {
        targetPid = 'p_' + uid();
        nextPelanggan = [
          ...prev.pelanggan,
          { id: targetPid, nama: currentUser.nama, telepon: '-', alamat: '-' },
        ];
        nextUsers = prev.users.map((u) =>
          u.id === currentUser.id ? { ...u, pelangganId: targetPid! } : u
        );
      }

      const nextKendaraan = editingId
        ? prev.kendaraan.map((k) =>
            k.id === editingId
              ? {
                  ...k,
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
              pelangganId: targetPid,
              plat: cleanPlat,
              merek: merek.trim(),
              model: model.trim(),
              tahun: tahun ? Number(tahun) : null,
            },
          ];

      return {
        ...prev,
        pelanggan: nextPelanggan,
        users: nextUsers,
        kendaraan: nextKendaraan,
      };
    });

    setVehicleModal({ open: false, editing: null });
    onToast('Kendaraan Anda berhasil disimpan.');
  };

  const openBookingForm = (preselectId = '') => {
    if (myVehicles.length === 0) {
      onToast('Tambahkan kendaraan terlebih dahulu sebelum booking.');
      openVehicleForm(null);
      return;
    }
    setBookVehicleId(preselectId || myVehicles[0].id);
    setBookDate(today());
    setBookJenis('Servis Berkala');
    setBookKeluhan('');
    setBookingModal({ open: true, preselectVehicleId: preselectId });
  };

  const handleSaveBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookVehicleId || !bookKeluhan.trim()) {
      onToast('Pilih kendaraan dan tuliskan keluhan Anda.');
      return;
    }
    const newSrv: Servis = {
      id: 's_' + uid(),
      kendaraanId: bookVehicleId,
      mekanikId: null,
      tanggal: bookDate || today(),
      keluhan: bookKeluhan.trim(),
      diagnosa: 'Booking online pelanggan — menunggu pemeriksaan mekanik',
      jenis: bookJenis,
      biayaJasa: 50000,
      status: 'Menunggu',
      details: [],
      payments: [],
    };
    onUpdateDB((prev) => ({
      ...prev,
      servis: [...prev.servis, newSrv],
    }));
    setBookingModal({ open: false, preselectVehicleId: '' });
    onToast('Booking servis berhasil dikirim!');
  };

  const confirmCancelBooking = () => {
    if (!cancelConfirmId) return;
    onUpdateDB((prev) => ({
      ...prev,
      servis: prev.servis.map((s) =>
        s.id === cancelConfirmId && s.status === 'Menunggu'
          ? { ...s, status: 'Dibatalkan' }
          : s
      ),
    }));
    setCancelConfirmId(null);
    onToast('Booking servis telah dibatalkan.');
  };

  const detailService = detailServiceId
    ? db.servis.find((s) => s.id === detailServiceId) || null
    : null;
  const detailVehicle = detailService ? getVehicle(detailService.kendaraanId) : null;

  const activeCount = myServices.filter(
    (s) => s.status === 'Menunggu' || s.status === 'Dikerjakan'
  ).length;
  const doneCount = myServices.filter((s) => s.status === 'Selesai').length;

  const myBills = myServices.filter((s) => s.status !== 'Dibatalkan');
  const totalBilled = myBills.reduce((acc, s) => acc + serviceTotal(s), 0);
  const totalPaid = myBills.reduce((acc, s) => acc + servicePaid(s), 0);
  const totalUnpaid = Math.max(0, totalBilled - totalPaid);

  return (
    <div className="space-y-4">
      {mode === 'portal' ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-[#fffdfa] border border-[#e9e0d4] rounded-2xl p-4">
              <div className="flex items-start justify-between">
                <span className="text-xs font-bold text-[#777168]">Kendaraan Saya</span>
                <div className="w-8 h-8 rounded-xl bg-[#f4eadc] flex items-center justify-center">
                  <Car className="w-4 h-4 text-[#9a6b42]" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-[#211f1c] mt-2 tabular-nums">
                {myVehicles.length}
              </div>
              <div className="text-[11px] text-[#777168] mt-0.5">Terdaftar atas nama Anda</div>
            </div>

            <div className="bg-[#fffdfa] border border-[#e9e0d4] rounded-2xl p-4">
              <div className="flex items-start justify-between">
                <span className="text-xs font-bold text-[#777168]">Dalam Antrean</span>
                <div className="w-8 h-8 rounded-xl bg-[#f4eadc] flex items-center justify-center">
                  <Clock className="w-4 h-4 text-[#8a6116]" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-[#211f1c] mt-2 tabular-nums">
                {activeCount}
              </div>
              <div className="text-[11px] text-[#777168] mt-0.5">Menunggu / dikerjakan</div>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-[#fffdfa] border border-[#e9e0d4] rounded-2xl p-4">
              <div className="flex items-start justify-between">
                <span className="text-xs font-bold text-[#777168]">Servis Selesai</span>
                <div className="w-8 h-8 rounded-xl bg-[#f4eadc] flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-[#216944]" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-[#211f1c] mt-2 tabular-nums">
                {doneCount}
              </div>
              <div className="text-[11px] text-[#777168] mt-0.5">Riwayat selesai</div>
            </div>
          </div>

          <div className="bg-[#fffdfa] border border-[#e9e0d4] rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[#211f1c]">
                  Booking Servis & Pantau Progres
                </h2>
                <p className="text-xs text-[#777168] mt-0.5">
                  Ajukan booking servis baru dan pantau status pengerjaan kendaraan Anda secara langsung.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => openVehicleForm(null)}
                  className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-xl bg-[#eee5d9] hover:bg-[#e2d6c5] text-[#342b23] text-xs font-bold transition-colors whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Kendaraan</span>
                </button>
                <button
                  type="button"
                  onClick={() => openBookingForm()}
                  className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-xl bg-[#9a6b42] hover:bg-[#855b36] text-white text-xs font-bold transition-colors whitespace-nowrap"
                >
                  <CalendarPlus className="w-3.5 h-3.5" />
                  <span>Booking Servis Baru</span>
                </button>
              </div>
            </div>

            {myVehicles.length === 0 ? (
              <div className="py-8 px-4 text-center rounded-2xl bg-[#f7f1e7] border border-dashed border-[#d8cbb9] text-sm text-[#777168]">
                Anda belum mendaftarkan kendaraan. Klik <b>Tambah Kendaraan</b> untuk mulai booking servis.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {myVehicles.map((v) => {
                  const srvCount = myServices.filter((s) => s.kendaraanId === v.id).length;
                  return (
                    <div
                      key={v.id}
                      className="bg-[#faf6ef] border border-[#e9e0d4] rounded-2xl p-4 flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-extrabold text-sm tracking-wider bg-[#28231f] text-[#efb84f] px-2.5 py-1 rounded-lg">
                            {v.plat}
                          </span>
                          <span className="text-xs text-[#777168] tabular-nums">
                            {srvCount}x servis
                          </span>
                        </div>
                        <div className="font-bold text-base text-[#211f1c] mt-2.5">
                          {v.merek} {v.model}
                        </div>
                        <div className="text-xs text-[#777168] mt-0.5 tabular-nums">
                          Tahun: {v.tahun || '—'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => openBookingForm(v.id)}
                          className="flex-1 min-h-[38px] px-3 py-1.5 rounded-lg bg-[#9a6b42] hover:bg-[#855b36] text-white text-xs font-bold transition-colors whitespace-nowrap"
                        >
                          Booking Servis
                        </button>
                        <button
                          type="button"
                          onClick={() => openVehicleForm(v)}
                          className="min-h-[38px] px-3 py-1.5 rounded-lg bg-[#eee5d9] hover:bg-[#e2d6c5] text-[#342b23] text-xs font-bold transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="overflow-x-auto pt-2">
              {myServices.length === 0 ? (
                <div className="py-10 text-center text-sm text-[#777168]">
                  Belum ada riwayat booking servis untuk kendaraan Anda.
                </div>
              ) : (
                <table className="w-full text-left border-collapse whitespace-nowrap text-[13px]">
                  <thead>
                    <tr className="border-b border-[#e9e0d4] text-[11px] uppercase tracking-wider text-[#777168]">
                      <th className="py-2.5 px-3 font-bold">Tanggal</th>
                      <th className="py-2.5 px-3 font-bold">Kendaraan</th>
                      <th className="py-2.5 px-3 font-bold">Layanan & Keluhan</th>
                      <th className="py-2.5 px-3 font-bold">Mekanik</th>
                      <th className="py-2.5 px-3 font-bold">Progres</th>
                      <th className="py-2.5 px-3 font-bold text-right">Tagihan</th>
                      <th className="py-2.5 px-3 font-bold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0eae2]">
                    {myServices.map((s) => {
                      const v = getVehicle(s.kendaraanId);
                      const canCancel = s.status === 'Menunggu' && servicePaid(s) === 0;
                      return (
                        <tr key={s.id} className="hover:bg-[#fcf9f4]">
                          <td className="py-3 px-3 font-mono text-xs tabular-nums">{s.tanggal}</td>
                          <td className="py-3 px-3">
                            <div className="font-mono font-bold text-[#211f1c]">{v?.plat || '—'}</div>
                            <div className="text-xs text-[#777168]">
                              {v?.merek} {v?.model}
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
                          <td className="py-3 px-3 text-right">
                            <div className="font-mono font-bold tabular-nums">
                              {rupiah(serviceTotal(s))}
                            </div>
                            <div className="mt-1 flex justify-end">
                              <PayStatusTag status={getPayStatus(s)} />
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setDetailServiceId(s.id)}
                                className="min-h-[34px] px-2.5 py-1 rounded-lg bg-[#eee5d9] hover:bg-[#e2d6c5] text-[#342b23] text-xs font-bold"
                              >
                                Pantau & Nota
                              </button>
                              {canCancel && (
                                <button
                                  type="button"
                                  onClick={() => setCancelConfirmId(s.id)}
                                  className="min-h-[34px] px-2.5 py-1 rounded-lg bg-[#fbe7e4] hover:bg-[#f6d5d0] text-[#9b302a] text-xs font-bold"
                                >
                                  Batalkan
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
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-[#fffdfa] border border-[#e9e0d4] rounded-2xl p-4">
              <div className="flex items-start justify-between">
                <span className="text-xs font-bold text-[#777168]">Total Biaya</span>
                <div className="w-8 h-8 rounded-xl bg-[#f4eadc] flex items-center justify-center">
                  <Receipt className="w-4 h-4 text-[#9a6b42]" />
                </div>
              </div>
              <div className="text-lg sm:text-xl font-mono font-extrabold text-[#211f1c] mt-2 tabular-nums">
                {rupiah(totalBilled)}
              </div>
              <div className="text-[11px] text-[#777168] mt-0.5">Akumulasi servis</div>
            </div>

            <div className="bg-[#fffdfa] border border-[#e9e0d4] rounded-2xl p-4">
              <div className="flex items-start justify-between">
                <span className="text-xs font-bold text-[#777168]">Sudah Dibayar</span>
                <div className="w-8 h-8 rounded-xl bg-[#e1f5ea] flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-[#216944]" />
                </div>
              </div>
              <div className="text-lg sm:text-xl font-mono font-extrabold text-[#216944] mt-2 tabular-nums">
                {rupiah(totalPaid)}
              </div>
              <div className="text-[11px] text-[#777168] mt-0.5">Terverifikasi kasir</div>
            </div>

            <div className="bg-[#fffdfa] border border-[#e9e0d4] rounded-2xl p-4">
              <div className="flex items-start justify-between">
                <span className="text-xs font-bold text-[#777168]">Sisa Tagihan</span>
                <div className="w-8 h-8 rounded-xl bg-[#f4eadc] flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-[#9a6b42]" />
                </div>
              </div>
              <div
                className={`text-lg sm:text-xl font-mono font-extrabold mt-2 tabular-nums ${
                  totalUnpaid > 0 ? 'text-[#9b302a]' : 'text-[#211f1c]'
                }`}
              >
                {rupiah(totalUnpaid)}
              </div>
              <div className="text-[11px] text-[#777168] mt-0.5">
                {totalUnpaid > 0 ? 'Silakan bayar di kasir bengkel' : 'Semua tagihan lunas'}
              </div>
            </div>
          </div>

          <div className="bg-[#fffdfa] border border-[#e9e0d4] rounded-2xl p-4 sm:p-5">
            <div className="mb-4">
              <h2 className="text-base font-bold text-[#211f1c]">
                Daftar Tagihan & Rincian Biaya Servis
              </h2>
              <p className="text-xs text-[#777168] mt-0.5">
                Cek rincian biaya jasa, sparepart, status pembayaran, serta cetak bukti nota servis Anda.
              </p>
            </div>

            <div className="overflow-x-auto">
              {myBills.length === 0 ? (
                <div className="py-10 text-center text-sm text-[#777168]">
                  Belum ada data tagihan servis untuk akun Anda.
                </div>
              ) : (
                <table className="w-full text-left border-collapse whitespace-nowrap text-[13px]">
                  <thead>
                    <tr className="border-b border-[#e9e0d4] text-[11px] uppercase tracking-wider text-[#777168]">
                      <th className="py-2.5 px-3 font-bold">Tanggal</th>
                      <th className="py-2.5 px-3 font-bold">Kendaraan & Servis</th>
                      <th className="py-2.5 px-3 font-bold">Status</th>
                      <th className="py-2.5 px-3 font-bold text-right">Total</th>
                      <th className="py-2.5 px-3 font-bold text-right">Dibayar</th>
                      <th className="py-2.5 px-3 font-bold text-right">Sisa</th>
                      <th className="py-2.5 px-3 font-bold">Pembayaran</th>
                      <th className="py-2.5 px-3 font-bold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0eae2]">
                    {myBills.map((s) => {
                      const v = getVehicle(s.kendaraanId);
                      const sisa = Math.max(0, serviceTotal(s) - servicePaid(s));
                      return (
                        <tr key={s.id} className="hover:bg-[#fcf9f4]">
                          <td className="py-3 px-3 font-mono text-xs tabular-nums">{s.tanggal}</td>
                          <td className="py-3 px-3">
                            <div className="font-mono font-bold text-[#211f1c]">{v?.plat || '—'}</div>
                            <div className="text-xs text-[#777168]">{s.jenis}</div>
                          </td>
                          <td className="py-3 px-3">
                            <ServiceStatusTag status={s.status} />
                          </td>
                          <td className="py-3 px-3 text-right font-mono tabular-nums">
                            {rupiah(serviceTotal(s))}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-[#216944] tabular-nums">
                            {rupiah(servicePaid(s))}
                          </td>
                          <td
                            className={`py-3 px-3 text-right font-mono font-bold tabular-nums ${
                              sisa > 0 ? 'text-[#9b302a]' : 'text-[#777168]'
                            }`}
                          >
                            {rupiah(sisa)}
                          </td>
                          <td className="py-3 px-3">
                            <PayStatusTag status={getPayStatus(s)} />
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => setDetailServiceId(s.id)}
                              className="min-h-[34px] px-3 py-1 rounded-lg bg-[#9a6b42] hover:bg-[#855b36] text-white text-xs font-bold"
                            >
                              Nota
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
        </>
      )}

      {/* Modal Tambah / Edit Kendaraan */}
      <Modal
        open={vehicleModal.open}
        title={vehicleModal.editing ? 'Edit Kendaraan Saya' : 'Tambah Kendaraan Saya'}
        onClose={() => setVehicleModal({ open: false, editing: null })}
      >
        <form onSubmit={handleSaveVehicle} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#62594f] mb-1">Plat Nomor</label>
              <input
                value={plat}
                onChange={(e) => setPlat(e.target.value)}
                required
                placeholder="Contoh: BL 4567 XY"
                className="w-full px-3 py-2.5 text-sm bg-white border border-[#ded5c9] rounded-xl font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#62594f] mb-1">Merek</label>
              <input
                value={merek}
                onChange={(e) => setMerek(e.target.value)}
                required
                placeholder="Contoh: Honda / Toyota"
                className="w-full px-3 py-2.5 text-sm bg-white border border-[#ded5c9] rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#62594f] mb-1">Model / Tipe</label>
              <input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                required
                placeholder="Contoh: Beat / Avanza"
                className="w-full px-3 py-2.5 text-sm bg-white border border-[#ded5c9] rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#62594f] mb-1">Tahun</label>
              <input
                type="number"
                min={1970}
                max={new Date().getFullYear() + 1}
                value={tahun}
                onChange={(e) => setTahun(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-white border border-[#ded5c9] rounded-xl tabular-nums"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setVehicleModal({ open: false, editing: null })}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-[#eee5d9] text-[#342b23] text-xs font-bold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="min-h-[40px] px-4 py-2 rounded-xl bg-[#9a6b42] hover:bg-[#855b36] text-white text-xs font-bold"
            >
              Simpan Kendaraan
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Booking Servis Online */}
      <Modal
        open={bookingModal.open}
        title="Booking Servis Online"
        onClose={() => setBookingModal({ open: false, preselectVehicleId: '' })}
      >
        <form onSubmit={handleSaveBooking} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#62594f] mb-1">
                Pilih Kendaraan Anda
              </label>
              <select
                value={bookVehicleId}
                onChange={(e) => setBookVehicleId(e.target.value)}
                required
                className="w-full px-3 py-2.5 text-sm bg-white border border-[#ded5c9] rounded-xl"
              >
                {myVehicles.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.plat} — {k.merek} {k.model}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#62594f] mb-1">
                Tanggal Rencana Servis
              </label>
              <input
                type="date"
                min={today()}
                value={bookDate}
                onChange={(e) => setBookDate(e.target.value)}
                required
                className="w-full px-3 py-2.5 text-sm bg-white border border-[#ded5c9] rounded-xl"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#62594f] mb-1">
                Jenis Layanan Servis
              </label>
              <select
                value={bookJenis}
                onChange={(e) => setBookJenis(e.target.value)}
                required
                className="w-full px-3 py-2.5 text-sm bg-white border border-[#ded5c9] rounded-xl"
              >
                <option value="Servis Berkala">Servis Berkala & Ganti Oli</option>
                <option value="Tune Up">Tune Up Mesin</option>
                <option value="Perbaikan Rem">Perbaikan Rem & Kaki-kaki</option>
                <option value="Kelistrikan">Pemeriksaan Kelistrikan / Aki</option>
                <option value="Servis Umum">Keluhan Umum / Pemeriksaan</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#62594f] mb-1">
                Keluhan Kendaraan
              </label>
              <textarea
                rows={3}
                value={bookKeluhan}
                onChange={(e) => setBookKeluhan(e.target.value)}
                required
                placeholder="Tuliskan keluhan pada kendaraan Anda..."
                className="w-full px-3 py-2.5 text-sm bg-white border border-[#ded5c9] rounded-xl"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setBookingModal({ open: false, preselectVehicleId: '' })}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-[#eee5d9] text-[#342b23] text-xs font-bold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="min-h-[40px] px-4 py-2 rounded-xl bg-[#9a6b42] hover:bg-[#855b36] text-white text-xs font-bold"
            >
              Kirim Booking Servis
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Pantau Progres & Cetak Nota */}
      <Modal
        open={!!detailService}
        title={`Pantau Progres & Nota · ${detailVehicle?.plat || ''}`}
        onClose={() => setDetailServiceId(null)}
        printable
      >
        {detailService && (
          <div className="space-y-4">
            {detailService.status !== 'Dibatalkan' ? (
              <div className="grid grid-cols-3 gap-2 text-xs font-bold no-print">
                <div className="py-2 px-2.5 rounded-xl text-center bg-[#e1f5ea] text-[#216944] border border-[#b7e2ca]">
                  1. Antrean
                </div>
                <div
                  className={`py-2 px-2.5 rounded-xl text-center border ${
                    detailService.status === 'Dikerjakan'
                      ? 'bg-[#fff4d9] text-[#8a6116] border-[#efd9a0]'
                      : detailService.status === 'Selesai'
                      ? 'bg-[#e1f5ea] text-[#216944] border-[#b7e2ca]'
                      : 'bg-[#f2ece3] text-[#777168] border-transparent'
                  }`}
                >
                  2. Dikerjakan
                </div>
                <div
                  className={`py-2 px-2.5 rounded-xl text-center border ${
                    detailService.status === 'Selesai'
                      ? 'bg-[#e1f5ea] text-[#216944] border-[#b7e2ca]'
                      : 'bg-[#f2ece3] text-[#777168] border-transparent'
                  }`}
                >
                  3. Selesai
                </div>
              </div>
            ) : (
              <div>
                <ServiceStatusTag status="Dibatalkan" />
              </div>
            )}

            <div className="border border-dashed border-[#c8b8a4] rounded-2xl p-4 bg-white space-y-3">
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#e9e0d4]">
                <div>
                  <div className="text-base font-extrabold text-[#211f1c]">BENGKEL AUTORA</div>
                  <div className="text-xs text-[#777168] font-mono tabular-nums">
                    #{detailService.id.toUpperCase()} · {detailService.tanggal}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <ServiceStatusTag status={detailService.status} />
                  <PayStatusTag status={getPayStatus(detailService)} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[13px]">
                <div>
                  <span className="text-[#777168]">Pelanggan:</span>{' '}
                  <b>{getCustomerName(detailVehicle?.pelangganId)}</b>
                </div>
                <div>
                  <span className="text-[#777168]">Kendaraan:</span>{' '}
                  <b className="font-mono">{detailVehicle?.plat || '—'}</b>
                </div>
                <div>
                  <span className="text-[#777168]">Servis:</span> <b>{detailService.jenis}</b>
                </div>
                <div>
                  <span className="text-[#777168]">Mekanik:</span>{' '}
                  <b>{getMechanicName(detailService.mekanikId)}</b>
                </div>
              </div>

              <div className="text-[13px] space-y-1">
                <p>
                  <b>Keluhan:</b> {detailService.keluhan}
                </p>
                <p>
                  <b>Diagnosa:</b> {detailService.diagnosa || 'Belum ada'}
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[13px]">
                  <thead>
                    <tr className="border-b border-[#e9e0d4] text-[11px] uppercase tracking-wider text-[#777168]">
                      <th className="py-2 px-2">Item</th>
                      <th className="py-2 px-2 text-right">Qty</th>
                      <th className="py-2 px-2 text-right">Harga</th>
                      <th className="py-2 px-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0eae2]">
                    <tr>
                      <td className="py-2 px-2">Biaya Jasa ({detailService.jenis})</td>
                      <td className="py-2 px-2 text-right font-mono tabular-nums">1</td>
                      <td className="py-2 px-2 text-right font-mono tabular-nums">
                        {rupiah(detailService.biayaJasa)}
                      </td>
                      <td className="py-2 px-2 text-right font-mono font-semibold tabular-nums">
                        {rupiah(detailService.biayaJasa)}
                      </td>
                    </tr>
                    {(detailService.details || []).map((d) => (
                      <tr key={d.id}>
                        <td className="py-2 px-2">
                          [{d.tipe}] {d.deskripsi}
                        </td>
                        <td className="py-2 px-2 text-right font-mono tabular-nums">{d.jumlah}</td>
                        <td className="py-2 px-2 text-right font-mono tabular-nums">
                          {rupiah(d.harga)}
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-semibold tabular-nums">
                          {rupiah(d.jumlah * d.harga)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-[#e9e0d4] pt-3 space-y-1 text-[13px]">
                <div className="flex justify-between">
                  <span>Total Tagihan:</span>
                  <b className="font-mono tabular-nums">{rupiah(serviceTotal(detailService))}</b>
                </div>
                <div className="flex justify-between">
                  <span>Dibayar:</span>
                  <b className="font-mono text-[#216944] tabular-nums">
                    {rupiah(servicePaid(detailService))}
                  </b>
                </div>
                <div className="flex justify-between">
                  <span>Sisa Tagihan:</span>
                  <b className="font-mono text-[#9b302a] tabular-nums">
                    {rupiah(
                      detailService.status === 'Dibatalkan'
                        ? 0
                        : Math.max(0, serviceTotal(detailService) - servicePaid(detailService))
                    )}
                  </b>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1 no-print">
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
                onClick={() => setDetailServiceId(null)}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-[#9a6b42] hover:bg-[#855b36] text-white text-xs font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Konfirmasi Batalkan Booking */}
      <Modal
        open={!!cancelConfirmId}
        title="Konfirmasi Pembatalan"
        onClose={() => setCancelConfirmId(null)}
        maxWidth="max-w-md"
      >
        <p className="text-sm text-[#62594f] mb-5">
          Apakah Anda yakin ingin membatalkan pengajuan booking servis ini? Tindakan ini tidak dapat
          dikembalikan.
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setCancelConfirmId(null)}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-[#eee5d9] text-[#342b23] text-xs font-bold"
          >
            Kembali
          </button>
          <button
            type="button"
            onClick={confirmCancelBooking}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-[#b84b42] hover:bg-[#9b302a] text-white text-xs font-bold"
          >
            Ya, Batalkan Booking
          </button>
        </div>
      </Modal>
    </div>
  );
};
