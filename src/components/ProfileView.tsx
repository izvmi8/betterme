import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, Workout } from '../types';
import { Dumbbell, Flame, Award, Calendar, ArrowLeft, Pencil, LogOut, X } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { EditProfileModal } from './EditProfileModal';

interface ProfileViewProps {
  user: User;
  workouts: Workout[];
  isCurrentLoggedUser?: boolean;
  onBackToMe?: () => void;
  onOpenSwitchUser?: () => void;
  onModalToggle?: (isOpen: boolean) => void;
  onUpdateUser?: (data: { name: string; pin: string; avatar: string }) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  workouts,
  isCurrentLoggedUser = false,
  onBackToMe,
  onOpenSwitchUser,
  onModalToggle,
  onUpdateUser,
}) => {
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);

  // Notify parent modal state to lock screen carousel navigation
  useEffect(() => {
    onModalToggle?.(!!selectedWorkout || isEditModalOpen);
  }, [selectedWorkout, isEditModalOpen, onModalToggle]);

  const userWorkouts = workouts.filter((w) => w.userId === user.id);

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-6 pb-24 select-none">
      {/* Return to logged user if browsing a teammate */}
      {!isCurrentLoggedUser && onBackToMe && (
        <button
          onClick={onBackToMe}
          className="flex items-center gap-2 text-sm text-[#6ea900] font-bold hover:underline py-1.5 active:scale-95"
        >
          <ArrowLeft size={16} />
          Wróć do mojego profilu
        </button>
      )}

      {/* Profile Card Header - czysty flat design */}
      <div className="bg-[#152b36] border border-[#0d2b52] rounded-3xl p-6 text-center relative overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col items-center">
          <div className="relative">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-24 h-24 rounded-full object-cover border-4 border-[#6ea900] shadow-xl"
            />
            <div className="absolute -bottom-1 -right-1 bg-[#a10b2b] text-white px-2.5 py-0.5 rounded-full text-xs font-black flex items-center gap-1 shadow-lg border border-[#0d2b52]">
              <Flame size={14} className="fill-white" />
              {user.currentStreak}w
            </div>
          </div>

          <h2 className="text-2xl font-black text-white mt-3.5">{user.name}</h2>
          <span className="text-xs text-zinc-300">Członek ekipy BeMe</span>

          {/* Quick stats pills (Treningi, Aktualna Passa, Rekord) */}
          <div className="grid grid-cols-3 gap-2.5 w-full mt-5">
            <div className="bg-[#10222b] border border-[#0d2b52] rounded-2xl p-3">
              <div className="flex items-center justify-center text-[#6ea900] mb-1">
                <Dumbbell size={18} />
              </div>
              <div className="font-black text-lg text-white">{user.allTimeWorkouts}</div>
              <div className="text-[10px] text-zinc-400 font-bold uppercase">Treningi</div>
            </div>

            <div className="bg-[#10222b] border border-[#0d2b52] rounded-2xl p-3">
              <div className="flex items-center justify-center text-[#ff6b87] mb-1">
                <Flame size={18} className="fill-[#a10b2b]" />
              </div>
              <div className="font-black text-lg text-white">{user.currentStreak}w</div>
              <div className="text-[10px] text-zinc-400 font-bold uppercase">Passa</div>
            </div>

            <div className="bg-[#10222b] border border-[#0d2b52] rounded-2xl p-3">
              <div className="flex items-center justify-center text-amber-400 mb-1">
                <Award size={18} />
              </div>
              <div className="font-black text-lg text-white">{user.longestStreak}w</div>
              <div className="text-[10px] text-zinc-400 font-bold uppercase">Rekord</div>
            </div>
          </div>

          {/* Profile Actions - powiększone dla wygody dotyku */}
          {isCurrentLoggedUser && (
            <div className="mt-5 flex items-center justify-center gap-3 w-full">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="flex-1 flex items-center justify-center gap-2 text-sm bg-[#6ea900] text-black font-black py-3 px-4 rounded-2xl shadow-lg shadow-[#6ea900]/25 active:scale-95 transition-all"
              >
                <Pencil size={15} strokeWidth={3} />
                <span>Edytuj profil</span>
              </button>

              <button
                onClick={onOpenSwitchUser}
                className="flex-1 flex items-center justify-center gap-2 text-sm text-zinc-300 hover:text-white py-3 px-4 rounded-2xl bg-[#10222b] border border-[#0d2b52] hover:border-[#6ea900] active:scale-95 transition-all"
              >
                <LogOut size={15} />
                <span>Przełącz profil</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Archive Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-[#6ea900]" />
            <h3 className="font-black text-base text-white">Archiwum BeMe ({userWorkouts.length})</h3>
          </div>
          <span className="text-xs text-zinc-400">Dotknij zdjęcie po szczegóły</span>
        </div>

        {/* Workout Grid */}
        {userWorkouts.length === 0 ? (
          <div className="bg-[#152b36] border border-[#0d2b52] rounded-2xl p-8 text-center text-zinc-400 text-sm shadow-md">
            Brak zapisanych treningów w archiwum tego użytkownika.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {userWorkouts.map((w) => (
              <div
                key={w.id}
                onClick={() => setSelectedWorkout(w)}
                className="group relative aspect-[4/5] rounded-2xl overflow-hidden bg-[#10222b] border border-[#0d2b52] cursor-pointer active:scale-95 transition-transform shadow-md"
              >
                {/* Main Action Photo */}
                <img
                  src={w.photoUrl}
                  alt={w.sportTitle}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* PiP Selfie */}
                {w.selfieUrl && (
                  <div className="absolute top-2 left-2 w-14 h-18 rounded-xl overflow-hidden border border-[#0d2b52] shadow">
                    <img src={w.selfieUrl} alt="Selfie" className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Bottom Overlay - czysty bez gradientu */}
                <div className="absolute inset-x-0 bottom-0 bg-[#10222b]/90 backdrop-blur-sm p-3 text-left border-t border-[#0d2b52]">
                  <div className="text-xs font-black text-white truncate">{w.sportTitle}</div>
                  <div className="text-[11px] text-zinc-300 mt-0.5">
                    {format(new Date(w.createdAt), 'd MMM', { locale: pl })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Workout Modal rendered via portal */}
      {selectedWorkout &&
        createPortal(
          <div
            onClick={() => setSelectedWorkout(null)}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-[#152b36] border border-[#0d2b52] rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl relative pointer-events-auto"
            >
              <button
                onClick={() => setSelectedWorkout(null)}
                className="absolute top-3 right-3 z-10 w-11 h-11 rounded-2xl bg-[#10222b]/90 border border-[#0d2b52] text-white flex items-center justify-center hover:bg-[#10222b] active:scale-95 transition-all"
              >
                <X size={20} />
              </button>

              {/* Photo */}
              <div className="relative aspect-[4/5] bg-[#10222b]">
                <img
                  src={selectedWorkout.photoUrl}
                  alt={selectedWorkout.sportTitle}
                  className="w-full h-full object-cover"
                />
                {selectedWorkout.selfieUrl && (
                  <div className="absolute top-3 left-3 w-22 h-30 rounded-2xl overflow-hidden border-2 border-[#0d2b52] shadow-2xl">
                    <img
                      src={selectedWorkout.selfieUrl}
                      alt="Selfie"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="p-5 space-y-2.5">
                <h4 className="font-black text-base text-white">{selectedWorkout.sportTitle}</h4>
                <p className="text-xs text-zinc-400">
                  Data:{' '}
                  {format(new Date(selectedWorkout.createdAt), 'd MMMM yyyy, HH:mm', {
                    locale: pl,
                  })}
                </p>
                {selectedWorkout.notes && (
                  <p className="text-sm text-zinc-200 bg-[#10222b] p-3 rounded-2xl border border-[#0d2b52] leading-snug">
                    „{selectedWorkout.notes}”
                  </p>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Modal Edycji Profilu */}
      <EditProfileModal
        user={user}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={(data) => onUpdateUser?.(data)}
      />
    </div>
  );
};
