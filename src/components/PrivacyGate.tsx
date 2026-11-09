import React, { useState, useEffect } from 'react';
import { Lock, ShieldCheck, ArrowRight, KeyRound } from 'lucide-react';

interface PrivacyGateProps {
  children: React.ReactNode;
}

const STORAGE_KEY = 'beme_group_unlocked';
const DEFAULT_PASSCODES = ['beme2026', 'ekipa', 'beme', 'silownia'];

export const PrivacyGate: React.FC<PrivacyGateProps> = ({ children }) => {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });

  const [passcode, setPasscode] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Check URL query parameters for automatic invite link access (e.g. ?join=beme2026)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const joinToken = urlParams.get('join')?.toLowerCase().trim();

      if (joinToken && DEFAULT_PASSCODES.includes(joinToken)) {
        localStorage.setItem(STORAGE_KEY, 'true');
        setIsUnlocked(true);

        // Clean up URL query parameter without refreshing
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    } catch {
      // Ignore URL parsing errors
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = passcode.toLowerCase().trim();

    if (DEFAULT_PASSCODES.includes(clean)) {
      localStorage.setItem(STORAGE_KEY, 'true');
      setIsUnlocked(true);
      setError('');
    } else {
      setError('Nieprawidłowy kod dostępu! Zapytaj Filipa na Messengerze.');
    }
  };

  if (isUnlocked) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#10222b] text-white flex flex-col items-center justify-center p-6 select-none">
      <div className="w-full max-w-sm bg-[#152b36] border border-[#0d2b52] rounded-3xl p-6 space-y-6 shadow-2xl text-center">
        {/* App Logo */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-2xl bg-[#6ea900]/20 text-[#6ea900] flex items-center justify-center border-2 border-[#6ea900]/30 shadow-lg">
            <Lock size={32} />
          </div>
          <h1 className="font-black text-2xl tracking-tighter text-white mt-2">
            Be<span className="text-[#6ea900]">Me</span>
          </h1>
          <span className="text-[11px] font-black uppercase tracking-widest text-[#6ea900] bg-[#6ea900]/15 px-3 py-0.5 rounded-full border border-[#6ea900]/30">
            Strefa prywatna ekipy
          </span>
        </div>

        <div>
          <h2 className="font-black text-lg text-white">Wpisz kod grupy</h2>
          <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
            Ta aplikacja jest zamknięta dla osób z zewnątrz. Wpisz hasło ekipy lub wejdź przez link z Messengera.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              autoFocus
              value={passcode}
              onChange={(e) => {
                setPasscode(e.target.value);
                setError('');
              }}
              placeholder="Wpisz tajny kod..."
              className="w-full bg-[#10222b] border border-[#0d2b52] rounded-2xl pl-11 pr-4 py-3.5 text-base text-white placeholder-zinc-500 focus:outline-none focus:border-[#6ea900] text-center font-bold tracking-wide"
            />
            <KeyRound size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
          </div>

          {error && (
            <p className="text-xs text-[#ff4d6d] font-bold bg-[#a10b2b]/20 p-2.5 rounded-xl border border-[#a10b2b]/40">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full py-4 rounded-2xl bg-[#6ea900] text-black font-black text-base hover:bg-[#84ca00] active:scale-95 transition-all shadow-xl shadow-[#6ea900]/25 flex items-center justify-center gap-2"
          >
            <span>Odblokuj dostęp</span>
            <ArrowRight size={18} strokeWidth={3} />
          </button>
        </form>

        <div className="pt-2 border-t border-[#0d2b52]">
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-400">
            <ShieldCheck size={14} className="text-[#6ea900]" />
            <span>Telefon zapamięta dostęp na zawsze</span>
          </div>
        </div>
      </div>
    </div>
  );
};
