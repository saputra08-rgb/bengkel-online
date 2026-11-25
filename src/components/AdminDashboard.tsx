import React from 'react';
import { Calendar, Car, CheckCircle2, Users, Wallet, Wrench, ArrowRight } from 'lucide-react';
import { ViewId, WorkshopDB } from '../types';
import { getPayStatus, rupiah, servicePaid, serviceTotal, today } from '../utils/storage';
import { RevenueChart } from './RevenueChart';
import { ServiceStatusTag } from './StatusLabel';

interface AdminDashboardProps {
  db: WorkshopDB;
  onNavigate: (view: ViewId) => void;
  onOpenService: (serviceId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  db,
  onNavigate,
  onOpenService,
}) => {
  const activeServices = db.servis.filter((s) => s.status !== 'Dibatalkan');
  const revenue = activeServices.reduce((acc, s) => acc + servicePaid(s), 0);
  const todayStr = today();
  const todayCount = activeServices.filter((s) => s.tanggal === todayStr).length;

  const stats = [
    {
      label: 'Total Pelanggan',
      value: String(db.pelanggan.length),
      hint: 'Pemilik terdaftar',
      icon: <Users className="w-5 h-5 text-[#9a6b42]" />,
      mono: false,
    },
    {
      label: 'Total Kendaraan',
      value: String(db.kendaraan.length),
      hint: 'Unit terdaftar',
      icon: <Car className="w-5 h-5 text-[#9a6b42]" />,
      mono: false,
    },
    {
      label: 'Servis Hari Ini',
      value: String(todayCount),
      hint: 'Pekerjaan masuk',
      icon: <Calendar className="w-5 h-5 text-[#9a6b42]" />,
      mono: false,
    },
    {
      label: 'Dikerjakan',
      value: String(activeServices.filter((s) => s.status === 'Dikerjakan').length),
      hint: 'Sedang diproses',
      icon: <Wrench className="w-5 h-5 text-[#28508e]" />,
      mono: false,
    },
    {
      label: 'Servis Selesai',
      value: String(activeServices.filter((s) => s.status === 'Selesai').length),
      hint: 'Selesai dikerjakan',
      icon: <CheckCircle2 className="w-5 h-5 text-[#216944]" />,
      mono: false,
    },
    {
      label: 'Pendapatan Masuk',
      value: rupiah(revenue),
      hint: 'Pembayaran diterima',
      icon: <Wallet className="w-5 h-5 text-[#216944]" />,
      mono: true,
    },
  ];

  const statusCounts: Array<'Menunggu' | 'Dikerjakan' | 'Selesai'> = [
    'Menunggu',
    'Dikerjakan',
    'Selesai',
  ];

  const recentServices = [...db.servis]
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal))
    .slice(0, 6);

  const getVehicle = (id: string) => db.kendaraan.find((k) => k.id === id);
  const getCustomerName = (pid?: string) =>
    db.pelanggan.find((p) => p.id === pid)?.nama || '—';
  const getMechanicName = (mid: string | null) =>
    db.mekanik.find((m) => m.id === mid)?.nama || 'Belum ditugaskan';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {stats.map((st) => (
          <div
            key={st.label}
            className="bg-[#fffdfa] border border-[#e9e0d4] rounded-2xl p-4 sm:p-5 relative overflow-hidden"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="text-xs font-bold text-[#777168]">{st.label}</div>
              <div className="w-9 h-9 rounded-xl bg-[#f4eadc] flex items-center justify-center shrink-0">
                {st.icon}
              </div>
            </div>
            <div
              className={`mt-2 font-extrabold tracking-tight text-[#211f1c] tabular-nums ${
                st.mono ? 'text-lg sm:text-xl font-mono' : 'text-2xl sm:text-3xl'
              }`}
            >
              {st.value}
            </div>
            <div className="text-[11px] text-[#777168] mt-1">{st.hint}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 bg-[#fffdfa] border border-[#e9e0d4] rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
            <h2 className="text-base font-bold text-[#211f1c]">Pendapatan Bulanan</h2>
            <span className="text-xs text-[#777168]">Berdasarkan pembayaran masuk 6 bulan terakhir</span>
          </div>
          <RevenueChart servis={db.servis} />
        </div>

        <div className="lg:col-span-5 bg-[#fffdfa] border border-[#e9e0d4] rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-[#211f1c] mb-3">Ringkasan Operasional</h2>
            <div className="divide-y divide-[#e9e0d4]">
              {statusCounts.map((st) => (
                <div key={st} className="flex items-center justify-between py-3">
                  <ServiceStatusTag status={st} />
                  <span className="text-sm font-bold text-[#211f1c] tabular-nums">
                    {activeServices.filter((s) => s.status === st).length} servis
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 mt-4 pt-3 border-t border-[#e9e0d4]">
            <div className="p-3 rounded-xl bg-[#f5eee5]">
              <div className="text-lg font-extrabold text-[#211f1c] tabular-nums">
                {activeServices.filter((s) => getPayStatus(s) !== 'Lunas').length}
              </div>
              <div className="text-[11px] text-[#777168]">Belum lunas</div>
            </div>
            <div className="p-3 rounded-xl bg-[#f5eee5]">
              <div className="text-lg font-extrabold text-[#211f1c] tabular-nums">
                {db.mekanik.filter((m) => m.aktif).length}
              </div>
              <div className="text-[11px] text-[#777168]">Mekanik aktif</div>
            </div>
            <div className="p-3 rounded-xl bg-[#f5eee5]">
              <div className="text-lg font-extrabold text-[#211f1c] tabular-nums">
                {db.users.length}
              </div>
              <div className="text-[11px] text-[#777168]">Total akun</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#fffdfa] border border-[#e9e0d4] rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <h2 className="text-base font-bold text-[#211f1c]">Servis Terbaru</h2>
          <button
            type="button"
            onClick={() => onNavigate('servis')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#9a6b42] hover:bg-[#855b36] text-white text-xs font-bold transition-colors whitespace-nowrap"
          >
            <span>Kelola Semua Servis</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          {recentServices.length === 0 ? (
            <div className="py-10 text-center text-sm text-[#777168]">
              Belum ada data servis yang tercatat.
            </div>
          ) : (
            <table className="w-full text-left border-collapse whitespace-nowrap text-[13px]">
              <thead>
                <tr className="border-b border-[#e9e0d4] text-[11px] uppercase tracking-wider text-[#777168]">
                  <th className="py-2.5 px-3 font-bold">Kendaraan</th>
                  <th className="py-2.5 px-3 font-bold">Pelanggan</th>
                  <th className="py-2.5 px-3 font-bold">Jenis</th>
                  <th className="py-2.5 px-3 font-bold">Mekanik</th>
                  <th className="py-2.5 px-3 font-bold">Status</th>
                  <th className="py-2.5 px-3 font-bold text-right">Total</th>
                  <th className="py-2.5 px-3 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0eae2]">
                {recentServices.map((s) => {
                  const v = getVehicle(s.kendaraanId);
                  return (
                    <tr key={s.id} className="hover:bg-[#fcf9f4] transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-[#211f1c]">{v?.plat || '—'}</div>
                        <div className="text-xs text-[#777168]">
                          {v?.merek} {v?.model}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-[#211f1c]">{getCustomerName(v?.pelangganId)}</td>
                      <td className="py-3 px-3 text-[#211f1c]">{s.jenis}</td>
                      <td className="py-3 px-3 text-[#777168]">{getMechanicName(s.mekanikId)}</td>
                      <td className="py-3 px-3">
                        <ServiceStatusTag status={s.status} />
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold tabular-nums">
                        {rupiah(serviceTotal(s))}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => onOpenService(s.id)}
                          className="text-xs font-bold text-[#875a32] hover:underline"
                        >
                          Kelola →
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
    </div>
  );
};
