import React, { useEffect, useRef, useState } from 'react';
import { Flame, ShieldAlert, ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import { GAMES_META, fetchRoast } from '../lib/api';
import { playSfx, speakText } from '../lib/audio';

const TIER_INFO = {
  1: { label: 'টিয়ার ১: ওয়ার্ম-আপ বাঁশ 🎋', color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' },
  2: { label: 'টিয়ার ২: গরম বাঁশ 🔥', color: 'text-amber-400 border-amber-500/40 bg-amber-500/10' },
  3: { label: 'টিয়ার ৩: মেগা বাঁশ ⚡', color: 'text-orange-400 border-orange-500/40 bg-orange-500/10' },
  4: { label: 'টিয়ার ৪: আল্ট্রা প্রো ম্যাক্স বাঁশ 💀', color: 'text-rose-400 border-rose-500/50 bg-rose-500/15' },
};

/* =========================================
   MINI-GAME 1: Runaway "I am Sorry" Button
========================================= */
function SorryButtonGame({ annoyance, tier, muted, onFail, onWin }) {
  const target = 6 + Math.floor(annoyance * 0.9);
  const [hits, setHits] = useState(0);
  const [pos, setPos] = useState({ x: 50, y: 50 });

  const moveRandom = () => {
    setPos({
      x: 16 + Math.random() * 68,
      y: 18 + Math.random() * 64,
    });
  };

  useEffect(() => {
    const intervalMs = Math.max(450, 1750 - tier * 320);
    const id = setInterval(moveRandom, intervalMs);
    return () => clearInterval(id);
  }, [tier]);

  const handleCatch = (e) => {
    e.stopPropagation();
    playSfx('pop', muted);
    const next = hits + 1;
    setHits(next);
    if (next >= target) {
      onWin();
    } else {
      moveRandom();
    }
  };

  const handleMiss = () => {
    playSfx('hit', muted);
    onFail();
    moveRandom();
  };

  const scale = Math.max(0.68, 1.05 - tier * 0.1);

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex justify-between items-center text-xs px-1">
        <span className="text-slate-300">সরি ধরা হয়েছে: <strong className="text-emerald-400">{hits}/{target}</strong></span>
        <span className="text-slate-400">মিস করলে হার্ড হবে!</span>
      </div>
      <div
        onPointerDown={handleMiss}
        className="relative flex-1 min-h-[300px] rounded-3xl bg-slate-950/90 border border-slate-800 overflow-hidden game-canvas-lock"
      >
        <p className="absolute top-3 inset-x-0 text-center text-[11px] text-slate-500 pointer-events-none">
          পলাতক বাটনটাকে ধরে {target} বার ক্ষমা চাও!
        </p>
        <button
          type="button"
          onPointerDown={handleCatch}
          style={{
            left: `${pos.x}%`,
            top: `${pos.y}%`,
            transform: `translate(-50%, -50%) scale(${scale})`,
            transition: `left ${Math.max(90, 260 - tier * 40)}ms ease-out, top ${Math.max(90, 260 - tier * 40)}ms ease-out`,
          }}
          className="absolute px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-extrabold text-sm shadow-[0_0_20px_rgba(244,63,94,0.6)] whitespace-nowrap active:scale-90"
        >
          আমি সরি 🥺
        </button>
      </div>
    </div>
  );
}

/* =========================================
   MINI-GAME 2: Dodge the Baash & Chappal (Canvas)
========================================= */
function DodgeBaashGame({ annoyance, tier, muted, onFail, onWin }) {
  const surviveGoal = 14 + annoyance;
  const canvasRef = useRef(null);
  const playerXRef = useRef(160);
  const moveDirRef = useRef(0);
  const tierRef = useRef(tier);
  tierRef.current = tier;

  const [survived, setSurvived] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = 340;
    const H = 360;
    canvas.width = W;
    canvas.height = H;
    playerXRef.current = W / 2;

    let obstacles = [];
    let frame = 0;
    let startTime = performance.now();
    let rafId = 0;
    let finished = false;

    const onKeyDown = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') moveDirRef.current = -1;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') moveDirRef.current = 1;
    };
    const onKeyUp = (e) => {
      if (['ArrowLeft', 'ArrowRight', 'a', 'd', 'A', 'D'].includes(e.key)) moveDirRef.current = 0;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    const loop = (now) => {
      if (finished) return;
      frame++;
      const elapsed = (now - startTime) / 1000;
      setSurvived(Math.min(surviveGoal, Math.floor(elapsed)));

      if (elapsed >= surviveGoal) {
        finished = true;
        onWin();
        return;
      }

      const curTier = tierRef.current;
      playerXRef.current = Math.max(24, Math.min(W - 24, playerXRef.current + moveDirRef.current * 6.2));

      const spawnRate = Math.max(12, 34 - curTier * 6);
      if (frame % spawnRate === 0) {
        const items = ['🎋', '🩴', '🍅', '💣'];
        obstacles.push({
          x: 20 + Math.random() * (W - 40),
          y: -24,
          speed: 2.6 + curTier * 1.15 + Math.random() * 1.6,
          icon: items[Math.floor(Math.random() * items.length)],
        });
      }

      // Draw background
      ctx.fillStyle = '#070b14';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(56,189,248,0.08)';
      for (let gx = 0; gx < W; gx += 34) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
      }

      // Draw player
      const py = H - 36;
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('😰', playerXRef.current, py);

      // Update & draw obstacles
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const ob = obstacles[i];
        ob.y += ob.speed;
        ctx.font = '26px sans-serif';
        ctx.fillText(ob.icon, ob.x, ob.y);

        const dist = Math.hypot(ob.x - playerXRef.current, ob.y - py);
        if (dist < 25) {
          playSfx('hit', muted);
          onFail();
          obstacles = [];
          startTime = performance.now(); // Reset survive timer on hit!
          setSurvived(0);
          break;
        }
        if (ob.y > H + 30) obstacles.splice(i, 1);
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => {
      finished = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [annoyance, muted]);

  const handlePointer = (e) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 340;
    playerXRef.current = Math.max(24, Math.min(316, x));
  };

  return (
    <div className="flex flex-col items-center gap-2.5">
      <div className="w-full flex justify-between text-xs px-1">
        <span>বাঁচার সময়: <strong className="text-cyan-400">{survived}s / {surviveGoal}s</strong></span>
        <span className="text-rose-400">গায়ে লাগলে ০ থেকে শুরু!</span>
      </div>
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointer}
        onPointerMove={(e) => { if (e.buttons > 0 || e.pointerType === 'touch') handlePointer(e); }}
        className="w-full max-w-[340px] aspect-[340/360] rounded-3xl border border-cyan-500/30 game-canvas-lock"
      />
      <div className="grid grid-cols-2 gap-3 w-full max-w-[340px]">
        <button
          type="button"
          onPointerDown={() => { moveDirRef.current = -1; }}
          onPointerUp={() => { moveDirRef.current = 0; }}
          onPointerLeave={() => { moveDirRef.current = 0; }}
          className="py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white font-bold flex items-center justify-center gap-1 active:bg-cyan-500 active:text-slate-950 game-canvas-lock"
        >
          <ArrowLeft className="w-5 h-5" /> বামে
        </button>
        <button
          type="button"
          onPointerDown={() => { moveDirRef.current = 1; }}
          onPointerUp={() => { moveDirRef.current = 0; }}
          onPointerLeave={() => { moveDirRef.current = 0; }}
          className="py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white font-bold flex items-center justify-center gap-1 active:bg-cyan-500 active:text-slate-950 game-canvas-lock"
        >
          ডানে <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

/* =========================================
   MINI-GAME 3: Apology Typing
========================================= */
function ApologyTypeGame({ annoyance, tier, victim, muted, onFail, onWin }) {
  const lines = [
    `ami ${victim || 'doshi'} kaan dhore sorry bolchi`,
    'ar konodin erokom korbo na promise',
    'ajke theke ami bhalo manush hoye jabo',
    'baashbot boss amake maf kore dao',
    'treat na dile amar kopale baash ache',
  ];
  const totalRounds = annoyance >= 7 ? 3 : 2;
  const [round, setRound] = useState(0);
  const [input, setInput] = useState('');
  const [shake, setShake] = useState(false);

  const targetLine = lines[round % lines.length];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim().toLowerCase() === targetLine.toLowerCase()) {
      playSfx('pop', muted);
      if (round + 1 >= totalRounds) {
        onWin();
      } else {
        setRound((r) => r + 1);
        setInput('');
      }
    } else {
      playSfx('hit', muted);
      onFail();
      setShake(true);
      setTimeout(() => setShake(false), 350);
    }
  };

  return (
    <div className="space-y-4 py-2">
      <div className="flex justify-between text-xs px-1">
        <span>রাউন্ড: <strong className="text-purple-400">{round + 1} / {totalRounds}</strong></span>
        <span className="text-slate-400">কপি-পেস্ট চলবে না 😈</span>
      </div>
      <div
        className={`p-4 rounded-3xl bg-slate-950 border border-purple-500/40 text-center select-none ${
          tier >= 3 ? 'animate-pulse' : ''
        } ${shake ? 'border-rose-500 translate-x-1' : ''}`}
      >
        <p className="text-[11px] text-slate-400 mb-2">হুবহু নিচের লাইনটা টাইপ করো:</p>
        <p className="text-lg font-bold text-amber-300 tracking-wide break-words">{targetLine}</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          value={input}
          onPaste={(e) => { e.preventDefault(); onFail(); }}
          onChange={(e) => setInput(e.target.value)}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          placeholder="এখানে টাইপ করে সাবমিট দাও..."
          className="w-full px-4 py-3.5 rounded-2xl bg-slate-900 border border-slate-700 text-white text-base focus:outline-none focus:border-purple-400"
        />
        <button
          type="submit"
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-500 to-rose-500 text-white font-bold text-sm active:scale-95 transition"
        >
          কান ধরে ক্ষমা সাবমিট করো 🙏
        </button>
      </form>
    </div>
  );
}

/* =========================================
   MINI-GAME 4: Whack-a-Troll (3x3 Grid)
========================================= */
function WhackTrollGame({ annoyance, tier, muted, onFail, onWin }) {
  const goal = 8 + annoyance;
  const [score, setScore] = useState(0);
  const [activeCell, setActiveCell] = useState({ idx: -1, bad: true });

  useEffect(() => {
    const speed = Math.max(360, 1050 - tier * 175);
    const id = setInterval(() => {
      const idx = Math.floor(Math.random() * 9);
      const isTroll = Math.random() > (tier >= 3 ? 0.34 : 0.22);
      setActiveCell({ idx, bad: isTroll });
    }, speed);
    return () => clearInterval(id);
  }, [tier]);

  const tapCell = (i) => {
    if (i !== activeCell.idx) return;
    if (activeCell.bad) {
      playSfx('pop', muted);
      const next = score + 1;
      setScore(next);
      setActiveCell({ idx: -1, bad: true });
      if (next >= goal) onWin();
    } else {
      playSfx('hit', muted);
      setScore((s) => Math.max(0, s - 2));
      setActiveCell({ idx: -1, bad: true });
      onFail();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-xs px-1">
        <span>স্কোর: <strong className="text-amber-400">{score} / {goal}</strong></span>
        <span className="text-slate-400">😈 মারো | 😇 ছুঁলে -2</span>
      </div>
      <div className="grid grid-cols-3 gap-3 max-w-[320px] mx-auto pt-2 game-canvas-lock">
        {Array.from({ length: 9 }).map((_, i) => {
          const isUp = activeCell.idx === i;
          return (
            <button
              key={i}
              type="button"
              onPointerDown={() => tapCell(i)}
              className={`aspect-square rounded-3xl border-2 flex items-center justify-center text-4xl transition active:scale-90 ${
                isUp
                  ? activeCell.bad
                    ? 'bg-rose-500/25 border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.4)]'
                    : 'bg-cyan-500/20 border-cyan-400'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              {isUp ? (activeCell.bad ? '😈' : '😇') : '🕳️'}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* =========================================
   MINI-GAME 5: Baash Balance (Touch + Keyboard)
========================================= */
function BalanceBaashGame({ annoyance, tier, muted, onFail, onWin }) {
  const goalSec = 10 + Math.floor(annoyance * 0.8);
  const [angle, setAngle] = useState(0); // -50 to +50, safe is -22 to +22
  const [holdSec, setHoldSec] = useState(0);
  const pushRef = useRef(0);
  const angleRef = useRef(0);
  const velRef = useRef(0);
  const holdRef = useRef(0);
  const tierRef = useRef(tier);
  tierRef.current = tier;

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') pushRef.current = -1;
      if (e.key === 'ArrowRight' || e.key === 'd') pushRef.current = 1;
    };
    const onKeyUp = () => { pushRef.current = 0; };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    const id = setInterval(() => {
      const gust = (Math.random() - 0.5) * (0.9 + tierRef.current * 0.55);
      const gravity = angleRef.current * 0.032;
      velRef.current = velRef.current * 0.88 + gust + gravity + pushRef.current * 1.45;
      angleRef.current += velRef.current;

      if (Math.abs(angleRef.current) > 48) {
        playSfx('hit', muted);
        onFail();
        angleRef.current = 0;
        velRef.current = 0;
        holdRef.current = 0;
        setHoldSec(0);
      } else if (Math.abs(angleRef.current) <= 22) {
        holdRef.current += 0.05;
        setHoldSec(Number(holdRef.current.toFixed(1)));
        if (holdRef.current >= goalSec) {
          clearInterval(id);
          onWin();
        }
      }
      setAngle(angleRef.current);
    }, 50);

    return () => {
      clearInterval(id);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [goalSec, muted]);

  const inZone = Math.abs(angle) <= 22;

  return (
    <div className="space-y-4 py-2">
      <div className="flex justify-between text-xs px-1">
        <span>ব্যালেন্স সময়: <strong className="text-emerald-400">{holdSec}s / {goalSec}s</strong></span>
        <span className={inZone ? 'text-emerald-400' : 'text-rose-400'}>
          {inZone ? 'সবুজ জোনে আছে ✅' : 'পড়ে যাচ্ছে! ⚠️'}
        </span>
      </div>

      <div className="h-52 rounded-3xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-end pb-6 relative overflow-hidden">
        <div className="absolute top-3 text-[11px] text-slate-400">বাঁশ সোজা রাখো, পড়লেই আবার ০!</div>
        {/* Safe zone arc cue */}
        <div
          className={`w-3 h-36 rounded-full origin-bottom transition-colors ${
            inZone ? 'bg-gradient-to-t from-emerald-600 to-emerald-300 shadow-[0_0_20px_#10b981]' : 'bg-gradient-to-t from-rose-600 to-amber-400 shadow-[0_0_20px_#f43f5e]'
          }`}
          style={{ transform: `rotate(${angle}deg)` }}
        />
        <div className="w-16 h-3 rounded-full bg-slate-700 mt-1" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onPointerDown={() => { pushRef.current = -1; }}
          onPointerUp={() => { pushRef.current = 0; }}
          onPointerLeave={() => { pushRef.current = 0; }}
          className="py-4 rounded-2xl bg-slate-800 border border-slate-700 text-white font-bold active:bg-emerald-400 active:text-slate-950 game-canvas-lock"
        >
          ⬅️ বামে ঠেলো
        </button>
        <button
          type="button"
          onPointerDown={() => { pushRef.current = 1; }}
          onPointerUp={() => { pushRef.current = 0; }}
          onPointerLeave={() => { pushRef.current = 0; }}
          className="py-4 rounded-2xl bg-slate-800 border border-slate-700 text-white font-bold active:bg-emerald-400 active:text-slate-950 game-canvas-lock"
        >
          ডানে ঠেলো ➡️
        </button>
      </div>
    </div>
  );
}

/* =========================================
   MAIN ARENA WRAPPER (Escalation + Troll + Owner Forgive)
========================================= */
export default function GameArena({
  gameId,
  victim,
  offense,
  annoyance,
  language,
  muted,
  onWin,
  onForgive,
}) {
  const [elapsed, setElapsed] = useState(0);
  const [fails, setFails] = useState(0);
  const [tier, setTier] = useState(1);
  const [roast, setRoast] = useState(`শুরু হয়ে গেল শাস্তি! জিততে না পারলে মুক্তি নাই, ${victim || 'বন্ধু'}! 😈`);
  const [giveUpShift, setGiveUpShift] = useState({ x: 0, y: 0 });
  const [forgiveProgress, setForgiveProgress] = useState(0);
  const forgiveTimerRef = useRef(null);

  const meta = GAMES_META.find((g) => g.id === gameId) || GAMES_META[0];

  // Timer & automatic Escalation Engine
  useEffect(() => {
    const id = setInterval(() => {
      setElapsed((s) => s + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const nextTier =
      elapsed >= 45 || fails >= 6 ? 4 :
      elapsed >= 28 || fails >= 4 ? 3 :
      elapsed >= 14 || fails >= 2 ? 2 : 1;

    if (nextTier > tier) {
      setTier(nextTier);
      playSfx('tier', muted);
      fetchRoast({ victim, offense, tier: nextTier, gameId, fails, language }).then((line) => {
        setRoast(line);
        speakText(line, language, muted);
      });
    }
  }, [elapsed, fails, tier]);

  const handleFail = () => {
    setFails((f) => f + 1);
  };

  const dodgeGiveUp = () => {
    playSfx('boing', muted);
    setGiveUpShift({
      x: (Math.random() - 0.5) * 140,
      y: (Math.random() - 0.5) * 50,
    });
    setRoast('হাল ছাড়া যাবে না! বাঁশ শেষ করেই যাইতে হবে! 😂');
  };

  const startForgiveHold = () => {
    const start = Date.now();
    forgiveTimerRef.current = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - start) / 2500) * 100);
      setForgiveProgress(pct);
      if (pct >= 100) {
        clearInterval(forgiveTimerRef.current);
        onForgive();
      }
    }, 40);
  };

  const cancelForgiveHold = () => {
    clearInterval(forgiveTimerRef.current);
    setForgiveProgress(0);
  };

  const tierStyle = TIER_INFO[tier];

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-6 flex flex-col gap-3">
      {/* Top Status Bar */}
      <div className="flex items-center justify-between gap-2 rounded-2xl bg-slate-900/90 border border-slate-800 px-3.5 py-2.5">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span>{meta.emoji}</span>
            <h2 className="text-sm font-bold text-white truncate">{meta.nameBn}</h2>
          </div>
          <p className="text-[11px] text-slate-400 truncate">দোষী: {victim || 'অপরাধী'} • লেভেল {annoyance}/10</p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-sm font-mono font-bold text-cyan-300">{elapsed}s</div>
          <div className="text-[10px] text-rose-400">ফেইল: {fails}</div>
        </div>
      </div>

      {/* Escalation Tier Pill + Live Roast */}
      <div className={`rounded-2xl border px-3.5 py-2.5 space-y-1 ${tierStyle.color}`}>
        <div className="flex items-center justify-between text-xs font-extrabold">
          <span className="flex items-center gap-1">
            <Flame className="w-3.5 h-3.5" /> {tierStyle.label}
          </span>
          {tier < 4 && <span className="text-[10px] opacity-80">দেরি করলে আরও হার্ড হবে!</span>}
        </div>
        <p className="text-xs text-slate-100 font-medium">{roast}</p>
      </div>

      {/* Active Mini-Game */}
      <div className="flex-1">
        {gameId === 'sorry_button' && (
          <SorryButtonGame annoyance={annoyance} tier={tier} muted={muted} onFail={handleFail} onWin={() => onWin({ elapsed, fails, tier })} />
        )}
        {gameId === 'dodge_baash' && (
          <DodgeBaashGame annoyance={annoyance} tier={tier} muted={muted} onFail={handleFail} onWin={() => onWin({ elapsed, fails, tier })} />
        )}
        {gameId === 'apology_type' && (
          <ApologyTypeGame annoyance={annoyance} tier={tier} victim={victim} muted={muted} onFail={handleFail} onWin={() => onWin({ elapsed, fails, tier })} />
        )}
        {gameId === 'whack_troll' && (
          <WhackTrollGame annoyance={annoyance} tier={tier} muted={muted} onFail={handleFail} onWin={() => onWin({ elapsed, fails, tier })} />
        )}
        {gameId === 'balance_baash' && (
          <BalanceBaashGame annoyance={annoyance} tier={tier} muted={muted} onFail={handleFail} onWin={() => onWin({ elapsed, fails, tier })} />
        )}
      </div>

      {/* Troll Give-Up + Secret Owner Forgive */}
      <div className="pt-2 flex items-center justify-between gap-2">
        <button
          type="button"
          onPointerDown={dodgeGiveUp}
          onMouseEnter={dodgeGiveUp}
          style={{ transform: `translate(${giveUpShift.x}px, ${giveUpShift.y}px)` }}
          className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-400 transition-transform duration-150"
        >
          হাল ছেড়ে দিলাম 🏳️
        </button>

        <button
          type="button"
          onPointerDown={startForgiveHold}
          onPointerUp={cancelForgiveHold}
          onPointerLeave={cancelForgiveHold}
          className="relative overflow-hidden px-3 py-2 rounded-xl bg-slate-900/70 border border-slate-800 text-[11px] text-slate-500 select-none game-canvas-lock"
        >
          <span
            className="absolute inset-y-0 left-0 bg-emerald-500/25 transition-all"
            style={{ width: `${forgiveProgress}%` }}
          />
          <span className="relative flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" /> মালিকের ক্ষমা (২.৫ সে. চাপো)
          </span>
        </button>
      </div>
    </div>
  );
}
