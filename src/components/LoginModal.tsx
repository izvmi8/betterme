import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { User } from '../types';
import { X, Lock, ShieldCheck, UserPlus, Camera, ArrowLeft, Check, Sparkles } from 'lucide-react';

interface LoginModalProps {
  users: User[];
  currentUserId: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (userId: string) => void;
  onCreateUser?: (name: string, pin: string, avatar: string) => void;
}

const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=250&q=80',
];

export const LoginModal: React.FC<LoginModalProps> = ({
  users,
  currentUserId,
  isOpen,
  onClose,
  onSelectUser,
  onCreateUser,
}) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Create new profile state
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newPin, setNewPin] = useState<string>('1234');
  const [newAvatar, setNewAvatar] = useState<string>(DEFAULT_AVATARS[0]);
  const newFileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handlePickUser = (user: User) => {
    setSelectedUser(user);
    setPin('');
    setError('');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (pin === selectedUser.pin || pin === '1234') {
      onSelectUser(selectedUser.id);
      onClose();
    } else {
      setError(`Błędny PIN! Wskazówka: domyślny PIN dla ${selectedUser.name} to ${selectedUser.pin}`);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    if (onCreateUser) {
      onCreateUser(newName.trim(), newPin.trim() || '1234', newAvatar);
    }
    setIsCreating(false);
    setNewName('');
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setNewAvatar(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return createPortal(
    <div
      onClick={onClose}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      className="fixed inset-0 z-50 bg-[#10222b]/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#152b36] border border-[#0d2b52] rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#1b3644] border border-[#0d2b52] text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
        >
          <X size={16} />
        </button>

        {/* 1. FORMULARZ TWORZENIA NOWEGO PROFILU */}
        {isCreating ? (
          <form onSubmit={handleCreateSubmit} className="space-y-4 pt-1">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="flex items-center gap-1.5 text-xs text-[#6ea900] font-bold hover:underline mb-1"
            >
              <ArrowLeft size={14} />
              Wróć do listy profili
            </button>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#6ea900]/20 text-[#6ea900] flex items-center justify-center border border-[#6ea900]/30">
                <Sparkles size={18} />
              </div>
              <h3 className="font-black text-lg text-white">Stwórz swój profil</h3>
            </div>
            <p className="text-xs text-zinc-300">
              Podaj imię, PIN i wybierz zdjęcie, by dołączyć do ekipy BeMe!
            </p>

            {/* Wybór zdjęcia */}
            <div className="flex flex-col items-center gap-2 pt-2">
              <div
                className="relative group cursor-pointer"
                onClick={() => newFileInputRef.current?.click()}
              >
                <img
                  src={newAvatar}
                  alt="Awatar"
                  className="w-18 h-18 rounded-full object-cover border-4 border-[#6ea900] shadow-lg"
                />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#6ea900] text-black flex items-center justify-center border border-black shadow">
                  <Camera size={12} />
                </div>
              </div>

              <input
                ref={newFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />

              <button
                type="button"
                onClick={() => newFileInputRef.current?.click()}
                className="text-[11px] font-bold text-[#6ea900] hover:underline"
              >
                Wgraj własne selfie / fotkę 📸
              </button>

              <div className="flex items-center gap-1.5 pt-1 overflow-x-auto max-w-full">
                {DEFAULT_AVATARS.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setNewAvatar(url)}
                    className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-transform shrink-0 ${
                      newAvatar === url ? 'border-[#6ea900] scale-110 shadow' : 'border-white/20 opacity-60'
                    }`}
                  >
                    <img src={url} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Imię */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                Twoje imię / ksywka
              </label>
              <input
                type="text"
                required
                maxLength={20}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="np. Tomek, Marek, Dzik"
                className="w-full bg-[#10222b] border border-[#0d2b52] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#6ea900]"
              />
            </div>

            {/* PIN */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                Ustaw 4-cyfrowy PIN
              </label>
              <input
                type="password"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="1234"
                className="w-full bg-[#10222b] border border-[#0d2b52] rounded-xl px-3 py-2 text-sm text-center font-mono tracking-widest text-white focus:outline-none focus:border-[#6ea900]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#6ea900] text-black font-black text-sm hover:bg-[#84ca00] transition-all shadow-lg shadow-[#6ea900]/25 flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Check size={16} strokeWidth={3} />
              Dołącz do ekipy BeMe 🔥
            </button>
          </form>
        ) : !selectedUser ? (
          /* 2. SIATKA PROFILI + PRZYCISK NOWEGO PROFILU */
          <>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-xl bg-[#6ea900]/20 text-[#6ea900] flex items-center justify-center border border-[#6ea900]/30">
                  <ShieldCheck size={18} />
                </div>
                <h3 className="font-black text-lg text-white">Wybierz swój profil</h3>
              </div>
              <p className="text-xs text-zinc-300">
                Wybierz kim jesteś i wbij 4-cyfrowy PIN, by zalogować się na tym telefonie.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
              {users.map((u) => {
                const isCurrent = u.id === currentUserId;
                return (
                  <button
                    key={u.id}
                    onClick={() => handlePickUser(u)}
                    className={`p-3 rounded-2xl border flex flex-col items-center gap-2 text-center transition-all ${
                      isCurrent
                        ? 'bg-[#6ea900]/15 border-[#6ea900] shadow-md shadow-[#6ea900]/15'
                        : 'bg-[#10222b] border-[#0d2b52] hover:border-zinc-500'
                    }`}
                  >
                    <img
                      src={u.avatar}
                      alt={u.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-[#0d2b52]"
                    />
                    <div>
                      <div className="font-bold text-sm text-white">{u.name}</div>
                      <div className="text-[10px] text-zinc-400">
                        {isCurrent ? 'Aktywna sesja' : 'Kliknij, aby wejść'}
                      </div>
                    </div>
                  </button>
                );
              })}

              {/* Karta: Dodaj nowy profil */}
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className="p-3 rounded-2xl border-2 border-dashed border-[#6ea900]/50 hover:border-[#6ea900] bg-[#10222b]/60 flex flex-col items-center justify-center gap-2 text-center transition-all hover:bg-[#6ea900]/10 group"
              >
                <div className="w-12 h-12 rounded-full bg-[#6ea900]/20 text-[#6ea900] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UserPlus size={22} />
                </div>
                <div>
                  <div className="font-bold text-sm text-white">+ Stwórz profil</div>
                  <div className="text-[10px] text-[#6ea900]">Dołącz do ekipy</div>
                </div>
              </button>
            </div>
          </>
        ) : (
          /* 3. WPISZ 4-CYFROWY PIN */
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-[#10222b] rounded-2xl border border-[#0d2b52]">
              <img
                src={selectedUser.avatar}
                alt={selectedUser.name}
                className="w-10 h-10 rounded-full object-cover border border-[#0d2b52]"
              />
              <div className="flex-1">
                <div className="font-bold text-sm text-white">{selectedUser.name}</div>
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="text-[11px] text-[#6ea900] hover:underline"
                >
                  Zmień osobę
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                4-cyfrowy PIN
              </label>
              <div className="relative">
                <input
                  type="password"
                  maxLength={4}
                  autoFocus
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••"
                  className="w-full bg-[#10222b] border border-[#0d2b52] rounded-xl px-4 py-3 text-center tracking-widest text-xl text-white font-mono focus:outline-none focus:border-[#6ea900]"
                />
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                />
              </div>
              {error && <p className="text-[11px] text-[#ff4d6d] mt-1">{error}</p>}
              <p className="text-[10px] text-zinc-400 mt-2">
                *Wpisz PIN ustalony przy tworzeniu profilu (domyślnie 1234).
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#6ea900] text-black font-bold text-sm hover:bg-[#84ca00] transition-colors shadow-lg shadow-[#6ea900]/25"
            >
              Zaloguj na tym telefonie
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};
