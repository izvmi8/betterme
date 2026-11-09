import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { User } from '../types';
import { X, Camera, Lock, User as UserIcon, Check, Sparkles } from 'lucide-react';

interface EditProfileModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; pin: string; avatar: string }) => void;
}

const AVATAR_PRESETS = [
  { id: 'p1', label: 'Siłownia', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80' },
  { id: 'p2', label: 'Dzik', url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=250&q=80' },
  { id: 'p3', label: 'Biegacz', url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=250&q=80' },
  { id: 'p4', label: 'Fighter', url: 'https://images.unsplash.com/photo-1549476464-37392f717541?auto=format&fit=crop&w=250&q=80' },
  { id: 'p5', label: 'Kolarz', url: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=250&q=80' },
  { id: 'p6', label: 'Klimat', url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=250&q=80' },
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  user,
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState<string>(user.name);
  const [pin, setPin] = useState<string>(user.pin || '1234');
  const [avatar, setAvatar] = useState<string>(user.avatar);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatar(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      pin: pin.trim() || '1234',
      avatar,
    });
    onClose();
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
        className="bg-[#152b36] border border-[#0d2b52] rounded-3xl max-w-sm w-full p-6 space-y-5 shadow-2xl relative"
      >
        {/* Zamknij (X) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#1b3644] border border-[#0d2b52] text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
        >
          <X size={16} />
        </button>

        {/* Nagłówek */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#6ea900]/20 text-[#6ea900] flex items-center justify-center border border-[#6ea900]/30">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="font-black text-lg text-white">Edytuj swój profil</h3>
            <p className="text-xs text-zinc-300">Zmień ksywkę, zdjęcie i kod PIN</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Wybór / Upload Zdjęcia */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <img
                src={avatar}
                alt="Podgląd awatara"
                className="w-20 h-20 rounded-full object-cover border-4 border-[#6ea900] shadow-xl"
              />
              <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                <Camera size={22} />
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#6ea900] text-black flex items-center justify-center shadow-lg border border-black">
                <Camera size={14} />
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-bold text-[#6ea900] hover:underline flex items-center gap-1"
            >
              Wgraj własne zdjęcie / selfie 📸
            </button>

            {/* Presety zdjęć */}
            <div className="w-full">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 text-center">
                lub wybierz gotowy styl:
              </span>
              <div className="flex items-center justify-center gap-2 overflow-x-auto py-1">
                {AVATAR_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setAvatar(p.url)}
                    className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-transform shrink-0 ${
                      avatar === p.url ? 'border-[#6ea900] scale-110 shadow-md shadow-[#6ea900]/40' : 'border-white/20 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={p.url} alt={p.label} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Imię / Ksywka */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
              Twoja ksywka / Imię
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                required
                maxLength={24}
                onChange={(e) => setName(e.target.value)}
                placeholder="np. Filip, Dzik, Wiktor"
                className="w-full bg-[#10222b] border border-[#0d2b52] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#6ea900]"
              />
              <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            </div>
          </div>

          {/* 4-cyfrowy PIN */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
              Twój 4-cyfrowy PIN
            </label>
            <div className="relative">
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="1234"
                className="w-full bg-[#10222b] border border-[#0d2b52] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white font-mono tracking-widest focus:outline-none focus:border-[#6ea900]"
              />
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            </div>
            <p className="text-[10px] text-zinc-400 mt-1">
              PIN chroni Twój profil przed przypadkowym przełączeniem przez kumpli.
            </p>
          </div>

          {/* Przyciski Akcji */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-[#1b3644] text-zinc-300 hover:text-white font-bold text-xs border border-[#0d2b52]"
            >
              Anuluj
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-[#6ea900] text-black font-black text-xs hover:bg-[#84ca00] transition-colors shadow-lg shadow-[#6ea900]/25 flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Check size={14} strokeWidth={3} />
              Zapisz profil
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
