import React from 'react';

export default function Mascot({ state = 'idle', mood = 'mischievous', size = 'md' }) {
  const dim = size === 'sm' ? 'w-14 h-14' : size === 'lg' ? 'w-28 h-28' : 'w-20 h-20';
  const isListening = state === 'listening';
  const isSpeaking = state === 'speaking';

  const glowColor = isListening
    ? 'from-rose-500 via-fuchsia-500 to-amber-400'
    : isSpeaking
    ? 'from-emerald-400 via-cyan-400 to-indigo-500'
    : mood === 'evil_genius'
    ? 'from-rose-500 via-purple-500 to-cyan-400'
    : 'from-cyan-400 via-indigo-500 to-rose-500';

  return (
    <div className={`relative flex items-center justify-center ${dim} select-none`}>
      {(isListening || isSpeaking) && (
        <div className={`absolute inset-0 rounded-full bg-gradient-to-tr ${glowColor} animate-pulse-ring`} />
      )}
      <div
        className={`relative w-full h-full rounded-full p-[3px] bg-gradient-to-tr ${glowColor} shadow-[0_0_28px_rgba(34,211,238,0.28)] ${
          isSpeaking ? 'scale-105 transition-transform duration-150' : 'animate-float'
        }`}
      >
        <div className="w-full h-full rounded-full bg-[#0f1629] flex flex-col items-center justify-center relative overflow-hidden">
          {/* Eyes */}
          <div className="flex items-center gap-3 mb-1.5">
            <div className="relative">
              <div className="w-3.5 h-1 bg-rose-500 rounded-full rotate-12 mb-0.5" />
              <div className={`w-3 h-3 rounded-full bg-amber-300 shadow-[0_0_8px_#fcd34d] ${isListening ? 'scale-110' : ''}`} />
            </div>
            <div className="relative">
              <div className="w-3.5 h-1 bg-rose-500 rounded-full -rotate-12 mb-0.5" />
              <div className={`w-3 h-3 rounded-full bg-amber-300 shadow-[0_0_8px_#fcd34d] ${isListening ? 'scale-110' : ''}`} />
            </div>
          </div>
          {/* Mouth / Waveform */}
          {isSpeaking || isListening ? (
            <div className="flex items-center gap-1 h-3">
              <span className="w-1 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1 h-3 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '100ms' }} />
              <span className="w-1 h-2 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
              <span className="w-1 h-3 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            </div>
          ) : (
            <div className="w-7 h-3 border-b-[3px] border-emerald-400 rounded-b-full" />
          )}
        </div>
      </div>
    </div>
  );
}
