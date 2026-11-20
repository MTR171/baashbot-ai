import React, { useState } from 'react';
import { Sparkles, Share2, Play, Copy, Check } from 'lucide-react';
import { GAMES_META } from '../lib/api';
import { playSfx } from '../lib/audio';

export default function RouletteView({
  victim,
  setVictim,
  offense,
  setOffense,
  annoyance,
  setAnnoyance,
  muted,
  onStartGame,
}) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [selected, setSelected] = useState(null);
  const [copied, setCopied] = useState(false);

  const spinWheel = () => {
    if (spinning) return;
    playSfx('boing', muted);
    setSpinning(true);
    setSelected(null);

    const pickIdx = Math.floor(Math.random() * GAMES_META.length);
    const sliceDeg = 360 / GAMES_META.length;
    const extraSpins = 360 * 5;
    const targetAngle = extraSpins + (360 - (pickIdx * sliceDeg + sliceDeg / 2));
    setRotation((prev) => prev + targetAngle);

    setTimeout(() => {
      setSpinning(false);
      setSelected(GAMES_META[pickIdx]);
      playSfx('tier', muted);
    }, 2600);
  };

  const buildChallengeLink = (gameId) => {
    const url = new URL(window.location.origin);
    url.searchParams.set('victim', victim || 'অপরাধী');
    url.searchParams.set('offense', offense || 'বিরক্ত করা');
    url.searchParams.set('level', String(annoyance));
    url.searchParams.set('game', gameId);
    url.searchParams.set('locked', '1');
    return url.toString();
  };

  const handleShareLink = async () => {
    const gameId = selected ? selected.id : GAMES_META[Math.floor(Math.random() * GAMES_META.length)].id;
    const link = buildChallengeLink(gameId);
    const text = `😈 ${victim || 'বন্ধু'}, তোর জন্য বাঁশ-বট AI স্পেশাল শাস্তি (লেভেল ${annoyance}/10) বানিয়েছে! জিততে পারলে মুক্তি পাবি:\n${link}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'BaashBot AI শাস্তি চ্যালেঞ্জ!', text, url: link });
        return;
      } catch (_) {}
    }
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (_) {}
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-4">
      {/* Compact Target Config */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">দোষীর নাম</label>
            <input
              value={victim}
              onChange={(e) => setVictim(e.target.value)}
              placeholder="যেমন: রাহাত"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-400"
            />
          </div>
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">অপরাধ</label>
            <input
              value={offense}
              onChange={(e) => setOffense(e.target.value)}
              placeholder="রিপ্লাই দেয় না"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-300">বিরক্তি লেভেল (শাস্তির মাত্রা)</span>
            <span className="font-bold text-rose-400">{annoyance}/10 {annoyance >= 8 ? '🔥💀' : annoyance >= 5 ? '😤' : '😜'}</span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            value={annoyance}
            onChange={(e) => setAnnoyance(Number(e.target.value))}
            className="w-full accent-rose-500"
          />
        </div>
      </div>

      {/* Spinning Wheel */}
      <div className="flex flex-col items-center py-2">
        <div className="relative w-60 h-60 flex items-center justify-center">
          {/* Pointer */}
          <div className="absolute -top-2 z-20 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[22px] border-l-transparent border-r-transparent border-t-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]" />

          <div
            className="w-56 h-56 rounded-full border-4 border-slate-700 shadow-[0_0_40px_rgba(244,63,94,0.25)] relative overflow-hidden"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? 'transform 2.5s cubic-bezier(0.12, 0.85, 0.18, 1)' : 'none',
              background: `conic-gradient(
                #f43f5e 0deg 72deg,
                #06b6d4 72deg 144deg,
                #a855f7 144deg 216deg,
                #f59e0b 216deg 288deg,
                #10b981 288deg 360deg
              )`,
            }}
          >
            {GAMES_META.map((g, i) => {
              const angle = i * 72 + 36;
              return (
                <div
                  key={g.id}
                  className="absolute inset-0 flex justify-center pt-5 text-2xl select-none"
                  style={{ transform: `rotate(${angle}deg)` }}
                >
                  <span>{g.emoji}</span>
                </div>
              );
            })}
            <div className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-[#090d16] border-2 border-white/20 flex items-center justify-center text-lg font-extrabold text-cyan-300 shadow-inner">
              🎋
            </div>
          </div>
        </div>

        <button
          onClick={spinWheel}
          disabled={spinning}
          className="mt-4 px-7 py-3 rounded-2xl bg-gradient-to-r from-rose-500 via-fuchsia-500 to-amber-500 text-white font-bold text-base shadow-[0_0_25px_rgba(244,63,94,0.4)] active:scale-95 transition flex items-center gap-2 disabled:opacity-60"
        >
          <Sparkles className="w-5 h-5" />
          {spinning ? 'বাঁশ সিলেক্ট হচ্ছে...' : 'র‍্যান্ডম বাঁশ রুলেট ঘোরাও!'}
        </button>
      </div>

      {/* Selected Punishment Card */}
      {selected && (
        <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border border-rose-500/40 p-4 space-y-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="text-4xl">{selected.emoji}</div>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-rose-400 font-bold">লকড শাস্তি</span>
              <h3 className="text-lg font-bold text-white">{selected.nameBn}</h3>
              <p className="text-xs text-slate-300">{selected.descBn}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <button
              onClick={() => onStartGame(selected.id)}
              className="py-3 px-4 rounded-2xl bg-emerald-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition"
            >
              <Play className="w-4 h-4 fill-current" />
              এই ফোনেই খেলতে দাও!
            </button>
            <button
              onClick={handleShareLink}
              className="py-3 px-4 rounded-2xl bg-slate-800 border border-cyan-400/40 text-cyan-300 font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition"
            >
              {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              {copied ? 'লিংক কপি হয়েছে!' : 'বন্ধুকে চ্যালেঞ্জ লিংক পাঠাও'}
            </button>
          </div>
        </div>
      )}

      {/* Quick Direct Game Picker */}
      <div className="space-y-2">
        <p className="text-xs text-slate-400 px-1">অথবা যেকোনো শাস্তি সরাসরি বাছাই করো:</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {GAMES_META.map((g) => (
            <button
              key={g.id}
              onClick={() => onStartGame(g.id)}
              className="p-2.5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-cyan-400/40 text-left flex items-center gap-2 active:scale-95 transition"
            >
              <span className="text-xl">{g.emoji}</span>
              <span className="text-xs font-semibold text-slate-200 leading-tight">{g.nameBn}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
