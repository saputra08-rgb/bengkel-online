import React from 'react';
import { CheckCircle2, Clock, Wrench, XCircle, AlertCircle } from 'lucide-react';
import { Role, ServiceStatus } from '../types';

export const ServiceStatusTag: React.FC<{ status: ServiceStatus }> = ({ status }) => {
  const map: Record<
    ServiceStatus,
    { bg: string; text: string; border: string; icon: React.ReactNode }
  > = {
    Menunggu: {
      bg: 'bg-[#fff4d9]',
      text: 'text-[#8a6116]',
      border: 'border-[#efd9a0]',
      icon: <Clock className="w-3 h-3 shrink-0" />,
    },
    Dikerjakan: {
      bg: 'bg-[#e8f0fe]',
      text: 'text-[#28508e]',
      border: 'border-[#c4d8fb]',
      icon: <Wrench className="w-3 h-3 shrink-0" />,
    },
    Selesai: {
      bg: 'bg-[#e1f5ea]',
      text: 'text-[#216944]',
      border: 'border-[#b7e2ca]',
      icon: <CheckCircle2 className="w-3 h-3 shrink-0" />,
    },
    Dibatalkan: {
      bg: 'bg-[#fbe7e4]',
      text: 'text-[#9b302a]',
      border: 'border-[#f0c5be]',
      icon: <XCircle className="w-3 h-3 shrink-0" />,
    },
  };

  const cfg = map[status] ?? map.Menunggu;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold border whitespace-nowrap ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      {cfg.icon}
      <span>{status}</span>
    </span>
  );
};

export const PayStatusTag: React.FC<{ status: 'Lunas' | 'Sebagian' | 'Belum lunas' | 'Dibatalkan' }> = ({
  status,
}) => {
  const map = {
    Lunas: 'bg-[#e1f5ea] text-[#216944] border-[#b7e2ca]',
    Sebagian: 'bg-[#fff4d9] text-[#8a6116] border-[#efd9a0]',
    'Belum lunas': 'bg-[#f4ece2] text-[#6d5947] border-[#e2d4c2]',
    Dibatalkan: 'bg-[#fbe7e4] text-[#9b302a] border-[#f0c5be]',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border whitespace-nowrap ${map[status]}`}
    >
      {status === 'Lunas' ? (
        <CheckCircle2 className="w-3 h-3 shrink-0" />
      ) : status === 'Dibatalkan' ? (
        <XCircle className="w-3 h-3 shrink-0" />
      ) : (
        <AlertCircle className="w-3 h-3 shrink-0" />
      )}
      <span>{status}</span>
    </span>
  );
};

export const RoleTag: React.FC<{ role: Role }> = ({ role }) => {
  const map: Record<Role, { label: string; classes: string }> = {
    admin: {
      label: 'Admin',
      classes: 'bg-[#efb84f] text-[#28231f] border-[#d8a034]',
    },
    operator: {
      label: 'Operator',
      classes: 'bg-[#dbeafe] text-[#1e3a8a] border-[#bfdbfe]',
    },
    user: {
      label: 'User Biasa',
      classes: 'bg-[#dcfce7] text-[#14532d] border-[#bbf7d0]',
    },
  };
  const cfg = map[role];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap ${cfg.classes}`}
    >
      {cfg.label}
    </span>
  );
};
