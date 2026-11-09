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

// Default clean placeholder avatar if user hasn't snapped or uploaded a photo yet
const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80';

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
  const [newAvatar, setNewAvatar] = useState<string>(DEFAULT_AVATAR);
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
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#152b36] border border-[#0d2b52] rounded-3xl max-w-sm w-full p-6 space-y-5 shadow-2xl relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-11 h-11 rounded-2xl bg-[#1b3644] border border-[#0d2b52] text-zinc-300 hover:text-white flex items-center justify-center transition-colors active:scale-95"
        >
          <X size={20} />
        </button>

        {/* 1. FORMULARZ TWORZENIA NOWEGO PROFILU */}
        {isCreating ? (
          <form onSubmit={handleCreateSubmit} className="space-y-5 pt-1">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="flex items-center gap-2 text-sm text-[#6ea900] font-bold hover:underline py-1"
            >
              <ArrowLeft size={16} />
              Wróć do listy profili
            </button>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#6ea900]/20 text-[#6ea900] flex items-center justify-center border border-[#6ea900]/30 shrink-0">
                <Sparkles size={22} />
              </div>
              <div>
                <h3 className="font-black text-xl text-white">Stwórz swój profil</h3>
                <p className="text-xs text-zinc-300">
                  Podaj imię, PIN i zrób selfie, by dołączyć do BeMe
                </p>
              </div>
            </div>

            {/* Wybór zdjęcia - tylko aparat / selfie / plik */}
            <div className="flex flex-col items-center gap-3 pt-1">
              <div
                className="relative group cursor-pointer active:scale-95 transition-transform"
                onClick={() => newFileInputRef.current?.click()}
              >
                <img
                  src={newAvatar}
                  alt="Awatar"
                  className="w-24 h-24 rounded-full object-cover border-4 border-[#6ea900] shadow-xl"
                />
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#6ea900] text-black flex items-center justify-center border-2 border-black shadow">
                  <Camera size={16} strokeWidth={2.5} />
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
                className="w-full py-3 px-4 rounded-2xl bg-[#10222b] border border-[#0d2b52] hover:border-[#6ea900] text-sm font-bold text-[#9be819] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md"
              >
                <Camera size={18} />
                <span>Wgraj własne selfie / zdjęcie 📸</span>
              </button>
            </div>

            {/* Imię */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                Twoje imię / ksywka
              </label>
              <input
                type="text"
                required
                maxLength={20}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="np. Tomek, Marek, Filip"
                className="w-full bg-[#10222b] border border-[#0d2b52] rounded-2xl px-4 py-3.5 text-base text-white focus:outline-none focus:border-[#6ea900]"
              />
            </div>

            {/* PIN */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                Ustaw 4-cyfrowy PIN
              </label>
              <input
                type="password"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="1234"
                className="w-full bg-[#10222b] border border-[#0d2b52] rounded-2xl px-4 py-3.5 text-base text-center font-mono tracking-widest text-white focus:outline-none focus:border-[#6ea900]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-2xl bg-[#6ea900] text-black font-black text-base hover:bg-[#84ca00] transition-all shadow-lg shadow-[#6ea900]/25 flex items-center justify-center gap-2 active:scale-95"
            >
              <Check size={18} strokeWidth={3} />
              Dołącz do ekipy BeMe 🔥
            </button>
          </form>
        ) : !selectedUser ? (
          /* 2. SIATKA PROFILI + PRZYCISK NOWEGO PROFILU */
          <>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-11 h-11 rounded-2xl bg-[#6ea900]/20 text-[#6ea900] flex items-center justify-center border border-[#6ea900]/30 shrink-0">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h3 className="font-black text-xl text-white">Wybierz profil</h3>
                  <p className="text-xs text-zinc-300">
                    Wybierz swoje konto i wpisz kod PIN
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 max-h-[340px] overflow-y-auto pr-1">
              {users.map((u) => {
                const isCurrent = u.id === currentUserId;
                return (
                  <button
                    key={u.id}
                    onClick={() => handlePickUser(u)}
                    className={`p-4 rounded-2xl border flex flex-col items-center gap-3 text-center transition-all active:scale-95 ${
                      isCurrent
                        ? 'bg-[#6ea900]/15 border-[#6ea900] shadow-md shadow-[#6ea900]/15'
                        : 'bg-[#10222b] border-[#0d2b52] hover:border-zinc-400'
                    }`}
                  >
                    <img
                      src={u.avatar}
                      alt={u.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-[#0d2b52]"
                    />
                    <div>
                      <div className="font-black text-base text-white">{u.name}</div>
                      <div className="text-xs text-zinc-400 mt-0.5">
                        {isCurrent ? 'Aktywny' : 'Dotknij, by wejść'}
                      </div>
                    </div>
                  </button>
                );
              })}

              {/* Karta: Dodaj nowy profil */}
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className="p-4 min-h-[140px] rounded-2xl border-2 border-dashed border-[#6ea900]/60 hover:border-[#6ea900] bg-[#10222b]/60 flex flex-col items-center justify-center gap-2 text-center transition-all hover:bg-[#6ea900]/10 group active:scale-95"
              >
                <div className="w-14 h-14 rounded-full bg-[#6ea900]/20 text-[#6ea900] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UserPlus size={26} />
                </div>
                <div>
                  <div className="font-black text-sm text-white">+ Nowy profil</div>
                  <div className="text-xs text-[#6ea900]">Dołącz do grupy</div>
                </div>
              </button>
            </div>
          </>
        ) : (
          /* 3. WPISZ 4-CYFROWY PIN */
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="flex items-center gap-3.5 p-3.5 bg-[#10222b] rounded-2xl border border-[#0d2b52]">
              <img
                src={selectedUser.avatar}
                alt={selectedUser.name}
                className="w-14 h-14 rounded-full object-cover border-2 border-[#0d2b52]"
              />
              <div className="flex-1">
                <div className="font-black text-base text-white">{selectedUser.name}</div>
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="text-xs font-bold text-[#6ea900] hover:underline mt-0.5 inline-block"
                >
                  ← Zmień osobę
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
                  className="w-full bg-[#10222b] border border-[#0d2b52] rounded-2xl px-4 py-3.5 text-center tracking-widest text-2xl text-white font-mono focus:outline-none focus:border-[#6ea900]"
                />
                <Lock
                  size={20}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
                />
              </div>
              {error && <p className="text-xs text-[#ff4d6d] font-bold mt-2">{error}</p>}
              <p className="text-xs text-zinc-400 mt-2">
                Wpisz PIN profilu (domyślnie: {selectedUser.pin || '1234'}).
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-2xl bg-[#6ea900] text-black font-black text-base hover:bg-[#84ca00] transition-colors shadow-lg shadow-[#6ea900]/25 active:scale-95"
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
