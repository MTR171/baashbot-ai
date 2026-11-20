import React, { useEffect, useState } from 'react';
import { Download, Share, PlusSquare, X, Smartphone } from 'lucide-react';

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    setIsStandalone(standalone);

    const ua = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua);
    setIsIOS(ios);

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (isStandalone || dismissed) return null;

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setDismissed(true);
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSModal(true);
    }
  };

  if (!deferredPrompt && !isIOS) return null;

  return (
    <>
      <div className="mx-3 mb-2 px-3 py-2 rounded-2xl bg-gradient-to-r from-cyan-500/15 via-indigo-500/15 to-rose-500/15 border border-cyan-400/25 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Smartphone className="w-4 h-4 text-cyan-300 shrink-0" />
          <p className="text-xs text-slate-200 truncate">
            {isIOS ? 'iPhone হোম স্ক্রিনে অ্যাপ হিসেবে ইনস্টল করো!' : 'ফোনে/পিসিতে অ্যাপ হিসেবে ইনস্টল করো!'}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleInstall}
            className="px-2.5 py-1 rounded-xl bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1 active:scale-95 transition"
          >
            <Download className="w-3.5 h-3.5" />
            Install
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 text-slate-400 hover:text-white"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {showIOSModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[#111827] border border-slate-700 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">iPhone-এ অ্যাপ ইনস্টল গাইড 📱</h3>
              <button onClick={() => setShowIOSModal(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <ol className="space-y-3 text-sm text-slate-300">
              <li className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center shrink-0">1</span>
                <span>এই লিংকটি iPhone-এর <strong>Safari</strong> ব্রাউজারে ওপেন করো।</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center shrink-0">2</span>
                <span className="flex items-center gap-1 flex-wrap">
                  নিচের <Share className="w-4 h-4 inline text-cyan-400" /> <strong>Share</strong> বাটনে ট্যাপ করো।
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center shrink-0">3</span>
                <span className="flex items-center gap-1 flex-wrap">
                  নিচে স্ক্রল করে <PlusSquare className="w-4 h-4 inline text-emerald-400" /> <strong>Add to Home Screen</strong> সিলেক্ট করে <strong>Add</strong> দাও!
                </span>
              </li>
            </ol>
            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 font-bold text-sm"
            >
              বুঝেছি!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
