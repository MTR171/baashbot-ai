import React, { useEffect, useRef } from 'react';
import { Download, Share2, RotateCcw, Trophy } from 'lucide-react';
import { GAMES_META } from '../lib/api';

export default function CertificateModal({ victim, offense, annoyance, gameId, stats, onReset }) {
  const canvasRef = useRef(null);
  const game = GAMES_META.find((g) => g.id === gameId) || GAMES_META[0];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = 720;
    const H = 480;
    canvas.width = W;
    canvas.height = H;

    // Dark luxury certificate bg
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#090d16');
    grad.addColorStop(0.5, '#131b31');
    grad.addColorStop(1, '#1f1028');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Double neon border
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 6;
    ctx.strokeRect(18, 18, W - 36, H - 36);
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, W - 60, H - 60);

    // Header
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🎋 BAASHBOT AI — OFFICIAL MUKTIPOTRO 🎋', W / 2, 82);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 38px sans-serif';
    ctx.fillText('শাস্তি মুক্তির সার্টিফিকেট', W / 2, 136);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '18px sans-serif';
    ctx.fillText('এই মর্মে প্রত্যয়ন করা যাচ্ছে যে, কুখ্যাত অপরাধী', W / 2, 185);

    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText(victim || 'অপরাধী', W / 2, 235);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '18px sans-serif';
    ctx.fillText(`অপরাধ: "${(offense || 'বিরক্ত করা').slice(0, 42)}"`, W / 2, 278);
    ctx.fillText(`খেলা: ${game.emoji} ${game.nameBn} • বিরক্তি লেভেল: ${annoyance}/10`, W / 2, 312);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(
      `সময়: ${stats.elapsed}s  |  ফেইল: ${stats.fails}  |  সর্বোচ্চ টিয়ার: ${stats.tier}/4`,
      W / 2,
      362
    );

    ctx.fillStyle = '#f43f5e';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('সফলভাবে বাঁশ হজম করে মুক্তি লাভ করেছেন! ✅', W / 2, 412);

    ctx.fillStyle = '#64748b';
    ctx.font = '13px sans-serif';
    ctx.fillText(`Verified by BaashBot AI • ${new Date().toLocaleDateString()}`, W / 2, 444);
  }, [victim, offense, annoyance, game, stats]);

  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `baashbot-muktipotro-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const sharePng = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      const file = new File([blob], 'baashbot-muktipotro.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'BaashBot AI মুক্তিপত্র 🏆',
          text: `${victim || 'আমি'} সফলভাবে BaashBot AI-এর লেভেল ${annoyance}/10 শাস্তি জিতে মুক্তি পেয়েছি! 🎋`,
          files: [file],
        });
        return;
      }
    } catch (_) {}
    downloadPng();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl bg-[#0f172a] border border-emerald-400/40 p-5 space-y-4 shadow-[0_0_50px_rgba(16,185,129,0.25)]">
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-bold">
            <Trophy className="w-3.5 h-3.5" /> শাস্তি সম্পন্ন! মুক্তি মিলেছে!
          </div>
          <h2 className="text-xl font-extrabold text-white">অভিনন্দন {victim || 'চ্যাম্পিয়ন'}! 🎉</h2>
        </div>

        <canvas ref={canvasRef} className="w-full rounded-2xl border border-slate-700" />

        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={sharePng}
            className="py-3 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-1.5 active:scale-95 transition"
          >
            <Share2 className="w-4 h-4" /> শেয়ার করো
          </button>
          <button
            onClick={downloadPng}
            className="py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white font-bold text-sm flex items-center justify-center gap-1.5 active:scale-95 transition"
          >
            <Download className="w-4 h-4" /> সেভ PNG
          </button>
        </div>

        <button
          onClick={onReset}
          className="w-full py-2.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" /> নতুন আরেকজনকে বাঁশ দাও!
        </button>
      </div>
    </div>
  );
}
