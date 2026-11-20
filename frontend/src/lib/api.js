const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export const GAMES_META = [
  {
    id: 'sorry_button',
    nameBn: 'পলাতক "আমি সরি" বাটন',
    nameEn: 'Runaway Sorry Button',
    emoji: '🏃‍♂️',
    color: '#f43f5e',
    descBn: 'বাটনটা হাতের কাছ থেকে পালাবে! নির্দিষ্ট বার ক্লিক/ট্যাপ করে ক্ষমা আদায় করো।',
  },
  {
    id: 'dodge_baash',
    nameBn: 'জুতা-বাঁশ বাঁচাও',
    nameEn: 'Dodge the Baash',
    emoji: '🩴',
    color: '#06b6d4',
    descBn: 'আকাশ থেকে পড়া বাঁশ আর জুতা থেকে বাঁচার লড়াই! আঙুল দিয়ে টানো বা তীর বাটন চাপো।',
  },
  {
    id: 'apology_type',
    nameBn: 'কান ধরে ক্ষমা টাইপ',
    nameEn: 'Apology Typing',
    emoji: '⌨️',
    color: '#a855f7',
    descBn: 'একদম হুবহু ক্ষমার লাইন টাইপ করতে হবে। দেরি করলে টাইমার আর স্ক্রিন দুষ্টামি করবে!',
  },
  {
    id: 'whack_troll',
    nameBn: 'দোষী ধরো (Whack-a-Troll)',
    nameEn: 'Whack-a-Troll',
    emoji: '😈',
    color: '#f59e0b',
    descBn: 'দুষ্টু 😈 ইমোজি দেখলেই মারো! কিন্তু ভদ্র 😇 ইমোজিতে মারলে পয়েন্ট কাটবে!',
  },
  {
    id: 'balance_baash',
    nameBn: 'ব্যালেন্স শাস্তি',
    nameEn: 'Baash Balance',
    emoji: '🎋',
    color: '#10b981',
    descBn: 'দমকা বাতাসের মাঝে বাঁশটা সবুজ জোনে ধরে রাখো যতক্ষণ না টাইমার শেষ হয়!',
  },
];

function localFallbackChat({ message, history, language, currentAnnoyance, victim, offense }) {
  const lower = message.toLowerCase();
  let nextAnnoyance = currentAnnoyance;
  const numMatch = message.match(/\b(10|[1-9])\b/);
  if (numMatch) {
    nextAnnoyance = parseInt(numMatch[1], 10);
  } else if (/(অনেক|খুব|চরম|মেজাজ|রাগ|বিরক্ত|angry|very|super|বাঁশ)/.test(lower)) {
    nextAnnoyance = Math.min(10, Math.max(nextAnnoyance, 8));
  }

  let nextVictim = victim;
  if (!nextVictim) {
    if (/(বন্ধু|friend|bondhu)/.test(lower)) nextVictim = 'প্রিয় বন্ধু';
    else if (/(বোন|sister)/.test(lower)) nextVictim = 'দুষ্টু বোন';
    else if (/(ভাই|brother)/.test(lower)) nextVictim = 'ভাই ব্রাদার';
    else if (message.trim().split(/\s+/).length <= 2) nextVictim = message.trim();
  }

  const nextOffense = offense || (message.length > 6 ? message.slice(0, 60) : 'বিনা কারণে প্যারা দেওয়া');
  const ready = /(শুরু|গেম|শাস্তি|বাঁশ|বানাও|start|game|punish|ready)/.test(lower) || history.length >= 2;
  const finalVictim = nextVictim || 'অপরাধী';
  const suggested = GAMES_META[Math.floor(Math.random() * GAMES_META.length)].id;

  const reply =
    language === 'en'
      ? ready
        ? `Locked in! ${finalVictim} is getting level ${nextAnnoyance}/10 punishment. Spin the Baash Roulette now!`
        : `Oof, ${finalVictim} really pushed your buttons! From 1 to 10, how annoyed are you?`
      : ready
      ? `বস, ${finalVictim}-এর কপালে আজকে চরম বাঁশ! বিরক্তি লেভেল ${nextAnnoyance}/10 লকড। এবার রুলেট ঘোরাও!`
      : `আরে বাপরে! তা এই ${finalVictim}-এর ওপর ১ থেকে ১০-এ বিরক্তি কত? বলো, একদম ঝাঁঝালো র‍্যান্ডম গেম রেডি করছি!`;

  return {
    reply,
    victim: finalVictim,
    offense: nextOffense,
    annoyance: nextAnnoyance,
    ready_for_game: ready,
    suggested_game: suggested,
    mood: ready ? 'evil_genius' : 'mischievous',
    source: 'offline',
  };
}

export async function sendChatToBackend(payload) {
  if (!API_BASE) {
    return localFallbackChat(payload);
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9000);
    const res = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: payload.message,
        history: payload.history,
        language: payload.language,
        current_annoyance: payload.currentAnnoyance,
        victim: payload.victim,
        offense: payload.offense,
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error('API error');
    return await res.json();
  } catch (_) {
    return localFallbackChat(payload);
  }
}

export async function fetchRoast({ victim, offense, tier, gameId, fails, language }) {
  const localRoasts = {
    1: `কীরে ${victim}, এত সহজটাও পারছিস না? হাত কাঁপছে নাকি! 😂`,
    2: `টিয়ার ২ আনলক! ${victim}, এবার স্পিড বাড়লো — ঘাম ছুটবে! 🔥`,
    3: `মেগা বাঁশ (টিয়ার ৩)! এখনো শেষ করতে পারলি না?! 💀`,
    4: `আল্ট্রা প্রো ম্যাক্স বাঁশ! ${victim}, আজকে আর মুক্তি নাই! 👑🎋`,
  };
  if (!API_BASE) {
    return localRoasts[tier] || localRoasts[1];
  }
  try {
    const res = await fetch(`${API_BASE}/api/roast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ victim, offense, tier, game_id: gameId, fails, language }),
    });
    if (!res.ok) throw new Error('Roast error');
    const data = await res.json();
    return data.roast || localRoasts[tier];
  } catch (_) {
    return localRoasts[tier] || localRoasts[1];
  }
}

export async function checkBackendHealth() {
  if (!API_BASE) return { ok: false, mode: 'offline' };
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    if (!res.ok) return { ok: false, mode: 'offline' };
    const data = await res.json();
    return { ok: true, mode: data.gemini_configured ? 'gemini' : 'backend' };
  } catch (_) {
    return { ok: false, mode: 'offline' };
  }
}
