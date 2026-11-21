let audioCtx = null;

export function unlockAudio() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    // Silent tick to unlock iOS Safari audio hardware
    const buffer = audioCtx.createBuffer(1, 1, 22050);
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    source.start(0);
  } catch (_) {}
}

export function playSfx(type = 'pop', muted = false) {
  if (muted) return;
  try {
    unlockAudio();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'pop') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(860, now + 0.09);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'boing') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.exponentialRampToValueAtTime(620, now + 0.14);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.19);
    } else if (type === 'hit') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(55, now + 0.22);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'tier') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.setValueAtTime(420, now + 0.08);
      osc.frequency.setValueAtTime(560, now + 0.16);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      osc.start(now);
      osc.stop(now + 0.34);
    } else if (type === 'win') {
      [523, 659, 784, 1046].forEach((freq, idx) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = 'triangle';
        o.connect(g);
        g.connect(audioCtx.destination);
        o.frequency.setValueAtTime(freq, now + idx * 0.09);
        g.gain.setValueAtTime(0.15, now + idx * 0.09);
        g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.28);
        o.start(now + idx * 0.09);
        o.stop(now + idx * 0.09 + 0.3);
      });
    }
  } catch (_) {}
}

function pickBestVoice(voices, lang) {
  if (lang === 'en') {
    return (
      voices.find((v) => v.lang.toLowerCase() === 'en-us' && v.localService) ||
      voices.find((v) => v.lang.toLowerCase().startsWith('en') && v.localService) ||
      voices.find((v) => v.lang.toLowerCase().startsWith('en')) ||
      null
    );
  }
  // For Bangla: try bn-BD → bn → hi-IN (Hindi often sounds less robotic for
  // Bengali text than a fully synthetic fallback) → first local voice → null
  return (
    voices.find((v) => v.lang.toLowerCase() === 'bn-bd') ||
    voices.find((v) => v.lang.toLowerCase() === 'bn-in') ||
    voices.find((v) => v.lang.toLowerCase().startsWith('bn')) ||
    voices.find((v) => v.lang.toLowerCase().startsWith('hi') && v.localService) ||
    null
  );
}

function doSpeak(text, lang, onStart, onEnd) {
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang === 'en' ? 'en-US' : 'bn-BD';

    if (lang === 'bn') {
      // Slower rate sounds more natural for Bangla on synthetic voices
      utter.rate = 0.92;
      utter.pitch = 1.0;
    } else {
      utter.rate = 1.05;
      utter.pitch = 1.0;
    }

    const voices = window.speechSynthesis.getVoices();
    const best = pickBestVoice(voices, lang);
    if (best) utter.voice = best;

    utter.onstart = () => onStart && onStart();
    utter.onend = () => onEnd && onEnd();
    utter.onerror = () => onEnd && onEnd();
    window.speechSynthesis.speak(utter);
  } catch (_) {
    if (onEnd) onEnd();
  }
}

export function speakText(text, lang = 'bn', muted = false, onStart, onEnd) {
  if (muted || !text || typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onEnd) onEnd();
    return;
  }
  // iOS Safari loads voices asynchronously — wait for them if not ready yet
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    doSpeak(text, lang, onStart, onEnd);
  } else {
    // onvoiceschanged fires once voices are loaded (iOS, some Android browsers)
    const handler = () => {
      window.speechSynthesis.removeEventListener('voiceschanged', handler);
      doSpeak(text, lang, onStart, onEnd);
    };
    window.speechSynthesis.addEventListener('voiceschanged', handler);
    // Safety fallback: if voices never load in 1.5s, speak anyway
    setTimeout(() => {
      window.speechSynthesis.removeEventListener('voiceschanged', handler);
      doSpeak(text, lang, onStart, onEnd);
    }, 1500);
  }
}

export function isSpeechRecognitionSupported() {
  if (typeof window === 'undefined') return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}
