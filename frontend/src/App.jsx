import React, { useEffect, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  MessageCircle,
  Dices,
  Gamepad2,
  Sparkles,
  Wifi,
} from 'lucide-react';
import Mascot from './components/Mascot';
import InstallBanner from './components/InstallBanner';
import RouletteView from './components/RouletteView';
import GameArena from './components/GameArena';
import CertificateModal from './components/CertificateModal';
import { sendChatToBackend, checkBackendHealth, GAMES_META } from './lib/api';
import { unlockAudio, playSfx, speakText, isSpeechRecognitionSupported } from './lib/audio';

const QUICK_CHIPS = [
  'আমার বন্ধু রিপ্লাই দেয় না, লেভেল ৮!',
  'ট্রিট দেয় নাই! চরম বাঁশ দাও!',
  '২ ঘণ্টা লেট করে আসছে, লেভেল ৯!',
  'র‍্যান্ডম শাস্তি গেম শুরু করো!',
];

export default function App() {
  const [tab, setTab] = useState('chat'); // chat | roulette | arena
  const [language, setLanguage] = useState('bn');
  const [muted, setMuted] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking');

  // Punishment state
  const [victim, setVictim] = useState('');
  const [offense, setOffense] = useState('');
  const [annoyance, setAnnoyance] = useState(6);
  const [activeGame, setActiveGame] = useState('sorry_button');
  const [winStats, setWinStats] = useState(null);

  // Voice & Chat state
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: 'হ্যালো বস! আমি বাঁশ-বট AI 😈 কার ওপর মেজাজ গরম? মাইক চেপে ভয়েসে বলো অথবা নিচে লিখে দাও — একদম কড়কড়ে র‍্যান্ডম শাস্তি গেম বানায় দিচ্ছি!',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [botState, setBotState] = useState('idle'); // idle | listening | speaking
  const [mood, setMood] = useState('mischievous');
  const [readyForGame, setReadyForGame] = useState(false);

  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);
  const micSupported = isSpeechRecognitionSupported();

  // Check URL challenge params (?victim=...&game=...&locked=1) + Backend Health
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('locked') === '1') {
      setVictim(params.get('victim') || 'অপরাধী');
      setOffense(params.get('offense') || 'দুষ্টুমি');
      setAnnoyance(Math.max(1, Math.min(10, Number(params.get('level') || 7))));
      const g = params.get('game');
      setActiveGame(GAMES_META.some((x) => x.id === g) ? g : GAMES_META[0].id);
      setTab('arena');
    }

    checkBackendHealth().then((res) => setBackendStatus(res.mode));
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (overrideText) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;
    unlockAudio();
    playSfx('pop', muted);

    const nextHistory = [...messages, { role: 'user', text }];
    setMessages(nextHistory);
    setInput('');
    setLoading(true);

    const res = await sendChatToBackend({
      message: text,
      history: nextHistory,
      language,
      currentAnnoyance: annoyance,
      victim,
      offense,
    });

    setLoading(false);
    setVictim(res.victim || victim);
    setOffense(res.offense || offense);
    setAnnoyance(res.annoyance || annoyance);
    setMood(res.mood || 'mischievous');
    if (res.ready_for_game) setReadyForGame(true);

    setMessages((prev) => [...prev, { role: 'bot', text: res.reply }]);
    speakText(
      res.reply,
      language,
      muted,
      () => setBotState('speaking'),
      () => setBotState('idle')
    );
  };

  const toggleVoiceMic = () => {
    unlockAudio();
    if (!micSupported) {
      alert('তোমার ব্রাউজারে ওয়েব ভয়েস ইনপুট সাপোর্ট নাই — iPhone কীবোর্ডের নিচের মাইক 🎙️ বাটন দিয়ে বাংলায় বলে সরাসরি লিখতে পারবে!');
      return;
    }

    if (botState === 'listening') {
      recognitionRef.current?.stop();
      setBotState('idle');
      return;
    }

    try {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SR();
      rec.lang = language === 'en' ? 'en-US' : 'bn-BD';
      rec.interimResults = false;
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        playSfx('boing', muted);
        setBotState('listening');
      };
      rec.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        setBotState('idle');
        if (transcript) handleSend(transcript);
      };
      rec.onerror = () => setBotState('idle');
      rec.onend = () => setBotState((s) => (s === 'listening' ? 'idle' : s));

      recognitionRef.current = rec;
      rec.start();
    } catch (_) {
      setBotState('idle');
    }
  };

  const launchGame = (gameId) => {
    unlockAudio();
    playSfx('tier', muted);
    setActiveGame(gameId);
    setWinStats(null);
    setTab('arena');
  };

  const handleWin = (stats) => {
    playSfx('win', muted);
    setWinStats(stats);
  };

  const handleReset = () => {
    setWinStats(null);
    setReadyForGame(false);
    if (window.location.search) {
      window.history.replaceState({}, '', window.location.pathname);
    }
    setTab('roulette');
  };

  return (
    <div className="min-h-[100dvh] max-h-[100dvh] w-full flex flex-col max-w-xl mx-auto bg-[#090d16] relative overflow-hidden">
      {/* Header */}
      <header className="safe-top px-4 pb-2.5 flex items-center justify-between border-b border-slate-800/80 bg-[#090d16]/90 backdrop-blur-md z-20">
        <div className="flex items-center gap-2.5">
          <Mascot state={botState} mood={mood} size="sm" />
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
              বাঁশ-বট AI <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-rose-500/20 text-rose-300 font-bold">APP</span>
            </h1>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Wifi className={`w-3 h-3 ${backendStatus === 'gemini' ? 'text-emerald-400' : backendStatus === 'backend' ? 'text-cyan-400' : 'text-amber-400'}`} />
              <span>
                {backendStatus === 'gemini'
                  ? 'Gemini Live'
                  : backendStatus === 'backend'
                  ? 'Render Connected'
                  : 'Smart Offline Mode'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setLanguage((l) => (l === 'bn' ? 'en' : 'bn'))}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-cyan-300"
          >
            {language === 'bn' ? 'বাংলা' : 'EN'}
          </button>
          <button
            onClick={() => setMuted((m) => !m)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300"
            aria-label="Toggle Sound"
          >
            {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </header>

      {/* Cross-Platform PWA Install Banner (iPhone + Android + PC) */}
      <div className="pt-2">
        <InstallBanner />
      </div>

      {/* Main Content Tabs */}
      {tab === 'chat' && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Live Annoyance Meter */}
          <div className="px-4 pb-2">
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 px-3.5 py-2 flex items-center gap-3">
              <span className="text-xs font-bold text-rose-400 whitespace-nowrap">বিরক্তি {annoyance}/10</span>
              <input
                type="range"
                min={1}
                max={10}
                value={annoyance}
                onChange={(e) => setAnnoyance(Number(e.target.value))}
                className="flex-1 accent-rose-500"
              />
              <button
                onClick={() => setTab('roulette')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  readyForGame
                    ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white animate-pulse'
                    : 'bg-slate-800 text-cyan-300'
                }`}
              >
                রুলেট 🎰
              </button>
            </div>
          </div>

          {/* Chat Bubbles */}
          <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[84%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-gradient-to-br from-cyan-500 to-indigo-600 text-white rounded-br-sm'
                      : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-sm'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-cyan-300 animate-pulse">
                  বাঁশ-বট দুষ্টু বুদ্ধি আঁটছে... 😈
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Ready Banner */}
          {readyForGame && (
            <div className="px-4 pb-2">
              <button
                onClick={() => setTab('roulette')}
                className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 via-fuchsia-500 to-amber-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition"
              >
                <Sparkles className="w-4 h-4" /> বাঁশ রেডি! রুলেট ঘুরিয়ে শাস্তি দাও 🎰
              </button>
            </div>
          )}

          {/* Quick Chips */}
          <div className="px-4 pb-2 flex gap-1.5 overflow-x-auto no-scrollbar">
            {QUICK_CHIPS.map((c) => (
              <button
                key={c}
                onClick={() => handleSend(c)}
                className="px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-300 whitespace-nowrap hover:border-cyan-400/50 active:scale-95"
              >
                {c}
              </button>
            ))}
          </div>

          {/* Voice + Text Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="px-3 pb-3 flex items-center gap-2"
          >
            <button
              type="button"
              onClick={toggleVoiceMic}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition active:scale-90 ${
                botState === 'listening'
                  ? 'bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.7)] animate-pulse'
                  : 'bg-slate-900 border border-cyan-400/40 text-cyan-300'
              }`}
              aria-label="Voice Input"
            >
              {botState === 'listening' ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={botState === 'listening' ? 'শুনছি... কথা বলো 🎙️' : 'লিখো বা মাইকে বলো...'}
              className="flex-1 h-12 px-4 rounded-2xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-400"
            />

            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-400 to-emerald-400 text-slate-950 flex items-center justify-center shrink-0 disabled:opacity-40 active:scale-90 transition"
              aria-label="Send"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      )}

      {tab === 'roulette' && (
        <RouletteView
          victim={victim}
          setVictim={setVictim}
          offense={offense}
          setOffense={setOffense}
          annoyance={annoyance}
          setAnnoyance={setAnnoyance}
          muted={muted}
          onStartGame={launchGame}
        />
      )}

      {tab === 'arena' && (
        <GameArena
          gameId={activeGame}
          victim={victim}
          offense={offense}
          annoyance={annoyance}
          language={language}
          muted={muted}
          onWin={handleWin}
          onForgive={handleReset}
        />
      )}

      {/* Bottom Native-Style Dock */}
      <nav className="safe-bottom px-4 pt-2 border-t border-slate-800/90 bg-[#0b1120]/95 backdrop-blur-md grid grid-cols-3 gap-2">
        <button
          onClick={() => setTab('chat')}
          className={`py-2 rounded-2xl flex flex-col items-center gap-0.5 text-[11px] font-bold transition ${
            tab === 'chat' ? 'bg-cyan-500/15 text-cyan-300' : 'text-slate-400'
          }`}
        >
          <MessageCircle className="w-5 h-5" /> ভয়েস চ্যাট
        </button>
        <button
          onClick={() => setTab('roulette')}
          className={`py-2 rounded-2xl flex flex-col items-center gap-0.5 text-[11px] font-bold transition ${
            tab === 'roulette' ? 'bg-rose-500/15 text-rose-300' : 'text-slate-400'
          }`}
        >
          <Dices className="w-5 h-5" /> বাঁশ রুলেট
        </button>
        <button
          onClick={() => setTab('arena')}
          className={`py-2 rounded-2xl flex flex-col items-center gap-0.5 text-[11px] font-bold transition ${
            tab === 'arena' ? 'bg-emerald-500/15 text-emerald-300' : 'text-slate-400'
          }`}
        >
          <Gamepad2 className="w-5 h-5" /> শাস্তি অ্যারেনা
        </button>
      </nav>

      {/* Victory Certificate Modal */}
      {winStats && (
        <CertificateModal
          victim={victim}
          offense={offense}
          annoyance={annoyance}
          gameId={activeGame}
          stats={winStats}
          onReset={handleReset}
        />
      )}
    </div>
  );
}
