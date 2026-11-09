import React, { useState } from 'react';
import { User } from '../types';
import { X, Lock, ShieldCheck } from 'lucide-react';

interface LoginModalProps {
  users: User[];
  currentUserId: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (userId: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  users,
  currentUserId,
  isOpen,
  onClose,
  onSelectUser,
}) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string>('');

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

  return (
    <div className="fixed inset-0 z-50 bg-[#10222b]/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#152b36] border border-[#0d2b52] rounded-3xl max-w-sm w-full p-5 space-y-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#1b3644] border border-[#0d2b52] text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
        >
          <X size={16} />
        </button>

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

        {!selectedUser ? (
          /* Grid of users */
          <div className="grid grid-cols-2 gap-2.5">
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
          </div>
        ) : (
          /* Enter PIN */
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
                *Domyślny PIN dla każdego profilu to np. 1234, 1111, 2222, 3333.
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#6ea900] text-black font-bold text-sm hover:bg-[#84ca00] transition-colors shadow-lg shadow-[#6ea900]/25"
            >
              Zaloguj i zapamiętaj na tym telefonie
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
