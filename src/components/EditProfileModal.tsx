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
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#152b36] border border-[#0d2b52] rounded-3xl max-w-sm w-full p-6 space-y-6 shadow-2xl relative"
      >
        {/* Zamknij (X) - duży i wygodny dla palca */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-11 h-11 rounded-2xl bg-[#1b3644] border border-[#0d2b52] text-zinc-300 hover:text-white flex items-center justify-center transition-colors active:scale-95"
        >
          <X size={20} />
        </button>

        {/* Nagłówek */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#6ea900]/20 text-[#6ea900] flex items-center justify-center border border-[#6ea900]/30 shrink-0">
            <Sparkles size={22} />
          </div>
          <div>
            <h3 className="font-black text-xl text-white">Edytuj profil</h3>
            <p className="text-xs text-zinc-300">Zmień ksywkę, zdjęcie i kod PIN</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Wybór / Upload Zdjęcia - wycentrowany duży awatar */}
          <div className="flex flex-col items-center gap-3 py-1">
            <div
              className="relative group cursor-pointer active:scale-95 transition-transform"
              onClick={() => fileInputRef.current?.click()}
            >
              <img
                src={avatar}
                alt="Podgląd awatara"
                className="w-24 h-24 rounded-full object-cover border-4 border-[#6ea900] shadow-2xl"
              />
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                <Camera size={26} />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#6ea900] text-black flex items-center justify-center shadow-lg border-2 border-black">
                <Camera size={16} strokeWidth={2.5} />
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
              className="w-full py-3 px-4 rounded-2xl bg-[#10222b] border border-[#0d2b52] hover:border-[#6ea900] text-sm font-bold text-[#9be819] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md"
            >
              <Camera size={18} />
              <span>Wgraj własne selfie / zdjęcie 📸</span>
            </button>
          </div>

          {/* Imię / Ksywka */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
              Twoja ksywka / Imię
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                required
                maxLength={24}
                onChange={(e) => setName(e.target.value)}
                placeholder="np. Filip"
                className="w-full bg-[#10222b] border border-[#0d2b52] rounded-2xl pl-11 pr-4 py-3.5 text-base text-white focus:outline-none focus:border-[#6ea900]"
              />
              <UserIcon size={20} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            </div>
          </div>

          {/* 4-cyfrowy PIN */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
              Twój 4-cyfrowy PIN
            </label>
            <div className="relative">
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="1234"
                className="w-full bg-[#10222b] border border-[#0d2b52] rounded-2xl pl-11 pr-4 py-3.5 text-base text-white font-mono tracking-widest focus:outline-none focus:border-[#6ea900]"
              />
              <Lock size={20} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            </div>
            <p className="text-xs text-zinc-400 mt-1.5">
              PIN chroni profil przed przypadkowym przełączeniem przez innych.
            </p>
          </div>

          {/* Przyciski Akcji */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl bg-[#1b3644] text-zinc-300 hover:text-white font-bold text-sm border border-[#0d2b52] active:scale-95 transition-all"
            >
              Anuluj
            </button>
            <button
              type="submit"
              className="flex-1 py-4 rounded-2xl bg-[#6ea900] text-black font-black text-sm hover:bg-[#84ca00] transition-colors shadow-lg shadow-[#6ea900]/25 flex items-center justify-center gap-2 active:scale-95"
            >
              <Check size={18} strokeWidth={3} />
              Zapisz profil
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
