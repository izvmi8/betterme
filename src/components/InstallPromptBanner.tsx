import React, { useState, useEffect } from 'react';
import { Smartphone, X, ExternalLink, Download } from 'lucide-react';

export const InstallPromptBanner: React.FC = () => {
  const [isInAppBrowser, setIsInAppBrowser] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [showIosGuide, setShowIosGuide] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if dismissed in this session
    if (sessionStorage.getItem('beme_banner_dismissed') === 'true') {
      setIsDismissed(true);
      return;
    }

    // Detect in-app webviews (Messenger, Instagram, Facebook)
    const ua = navigator.userAgent || navigator.vendor || (window as any).opera || '';
    const inApp = /FBAN|FBAV|Instagram|Messenger|FB_IAB/i.test(ua);
    setIsInAppBrowser(inApp);

    // Detect standalone PWA mode
    const isStandaloneMode =
      (typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches) ||
      (navigator as any).standalone === true;
    setIsStandalone(Boolean(isStandaloneMode));

    // Capture Chrome/Android beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('beme_banner_dismissed', 'true');
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsStandalone(true);
      }
      setDeferredPrompt(null);
    } else {
      // Show iOS or general guide
      setShowIosGuide(true);
    }
  };

  if (isDismissed || isStandalone) {
    return null;
  }

  // 1. Alert when inside Messenger/Instagram in-app browser
  if (isInAppBrowser) {
    return (
      <div className="fixed top-14 inset-x-3 z-40 max-w-md mx-auto animate-in slide-in-from-top-2 duration-200">
        <div className="bg-[#a10b2b] text-white p-3 rounded-2xl shadow-2xl flex items-center justify-between gap-2.5 border border-white/20">
          <div className="flex items-center gap-2 min-w-0">
            <ExternalLink size={18} className="shrink-0 text-white" />
            <p className="text-xs font-bold leading-tight">
              Otwórz w Safari / Chrome (kliknij <span className="underline">⋯</span> w rogu), aby aparat i powiadomienia działały w 100%!
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="w-7 h-7 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  // 2. Install PWA Prompt Banner
  return (
    <>
      <div className="fixed top-14 inset-x-3 z-40 max-w-md mx-auto animate-in slide-in-from-top-2 duration-200">
        <div className="bg-[#152b36] text-white p-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3 border border-[#6ea900]/40">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#6ea900]/20 text-[#6ea900] flex items-center justify-center shrink-0">
              <Smartphone size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black text-white">Dodaj BeMe na pulpit</div>
              <div className="text-[10px] text-zinc-300 truncate">
                Działa na pełnym ekranie jak apka ze sklepu
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstallClick}
              className="px-3 py-1.5 rounded-xl bg-[#6ea900] text-black font-black text-xs hover:bg-[#84ca00] active:scale-95 transition-all flex items-center gap-1 shadow-md shadow-[#6ea900]/20"
            >
              <Download size={13} strokeWidth={3} />
              <span>Instaluj</span>
            </button>
            <button
              onClick={handleDismiss}
              className="w-7 h-7 rounded-full text-zinc-400 hover:text-white flex items-center justify-center"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Safari Guide Modal */}
      {showIosGuide && (
        <div
          onClick={() => setShowIosGuide(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#152b36] border border-[#0d2b52] rounded-3xl p-6 max-w-xs w-full space-y-4 text-center shadow-2xl"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#6ea900]/20 text-[#6ea900] flex items-center justify-center mx-auto">
              <Smartphone size={24} />
            </div>
            <h3 className="font-black text-base text-white">Jak dodać na pulpit iPhone?</h3>
            <div className="text-xs text-zinc-300 space-y-2 text-left bg-[#10222b] p-3 rounded-2xl border border-[#0d2b52]">
              <p>1. Dotknij przycisku <strong>Udostępnij</strong> (kwadrat ze strzałką w górę na dole Safari).</p>
              <p>2. Przewiń w dół i wybierz <strong>Do ekranu początkowego</strong>.</p>
              <p>3. Kliknij <strong>Dodaj</strong> w prawym górnym rogu.</p>
            </div>
            <button
              onClick={() => setShowIosGuide(false)}
              className="w-full py-3 rounded-xl bg-[#6ea900] text-black font-black text-xs active:scale-95"
            >
              Rozumiem 👍
            </button>
          </div>
        </div>
      )}
    </>
  );
};
