import React, { useEffect, useRef } from 'react';
import { Servis } from '../types';

interface RevenueChartProps {
  servis: Servis[];
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ servis }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = 720;
    const height = 240;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const months: { key: string; label: string }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push({
        key,
        label: d.toLocaleDateString('id-ID', { month: 'short' }),
      });
    }

    const vals = months.map((m) =>
      servis
        .filter((s) => s.status !== 'Dibatalkan')
        .reduce(
          (acc, s) =>
            acc +
            (s.payments || [])
              .filter((p) => p.tanggal?.slice(0, 7) === m.key)
              .reduce((sum, p) => sum + p.jumlah, 0),
          0
        )
    );

    const max = Math.max(100000, ...vals);
    const left = 64;
    const bottom = 200;
    const top = 16;
    const chartW = width - left - 18;
    const chartH = bottom - top;

    ctx.strokeStyle = '#e9e0d4';
    ctx.fillStyle = '#777168';
    ctx.font = '12px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'right';

    for (let i = 0; i < 4; i++) {
      const y = top + (i * chartH) / 3;
      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(width - 10, y);
      ctx.stroke();
      const valAtTick = Math.round(((3 - i) / 3) * (max / 1000));
      const label = i === 3 ? '0' : valAtTick >= 1000 ? `${(valAtTick / 1000).toFixed(1)}jt` : `${valAtTick}rb`;
      ctx.fillText(label, left - 10, y + 4);
    }

    const slot = chartW / 6;
    const bw = Math.min(48, slot * 0.46);

    vals.forEach((v, i) => {
      const bh = (v / max) * (chartH - 8);
      const x = left + i * slot + (slot - bw) / 2;
      const y = bottom - bh;

      // Subtle track background
      ctx.fillStyle = '#f5eee5';
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(x, top + 8, bw, chartH - 8, 6);
      } else {
        ctx.rect(x, top + 8, bw, chartH - 8);
      }
      ctx.fill();

      // Guard bh > 0 before calling roundRect
      if (bh > 0) {
        ctx.fillStyle = i === vals.length - 1 ? '#9a6b42' : '#c99b6b';
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, bw, bh, Math.min(7, bh / 2));
        } else {
          ctx.rect(x, y, bw, bh);
        }
        ctx.fill();
      }

      ctx.fillStyle = '#777168';
      ctx.textAlign = 'center';
      ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(months[i].label, x + bw / 2, bottom + 22);
    });
  }, [servis]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-[220px] block"
      aria-label="Grafik pendapatan bulanan"
    />
  );
};
