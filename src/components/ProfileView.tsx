import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, Workout } from '../types';
import { Flame, Dumbbell, Award, ArrowLeft, LogOut, Calendar, X, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { EditProfileModal } from './EditProfileModal';

interface ProfileViewProps {
  user: User;
  workouts: Workout[];
  isCurrentLoggedUser: boolean;
  onBackToMe?: () => void;
  onOpenSwitchUser: () => void;
  onModalToggle?: (isOpen: boolean) => void;
  onUpdateUser?: (data: { name: string; pin: string; avatar: string }) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  workouts,
  isCurrentLoggedUser,
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

  const userWorkouts = workouts.filter(
    (w) => w.userId === user.id || w.taggedUserIds?.includes(user.id)
  );

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-6 pb-24">
      {/* Top Bar for foreign profile */}
      {!isCurrentLoggedUser && onBackToMe && (
        <button
          onClick={onBackToMe}
          className="flex items-center gap-1.5 text-xs text-[#6ea900] font-bold hover:underline mb-2"
        >
          <ArrowLeft size={14} />
          Wróć do mojego profilu
        </button>
      )}

      {/* Profile Card Header */}
      <div className="bg-[#152b36] border border-[#0d2b52] rounded-3xl p-5 text-center relative overflow-hidden shadow-xl">
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#0d2b52]/50 via-[#6ea900]/10 to-transparent" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="relative">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-20 h-20 rounded-full object-cover border-4 border-[#6ea900] shadow-xl"
            />
            <div className="absolute -bottom-1 -right-1 bg-[#a10b2b] text-white px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-0.5 shadow border border-[#0d2b52]">
              <Flame size={12} className="fill-white" />
              {user.currentStreak}w
            </div>
          </div>

          <h2 className="text-xl font-black text-white mt-3">{user.name}</h2>
          <span className="text-xs text-zinc-300">Członek ekipy BeMe</span>

          {/* Quick stats pills (Treningi, Aktualna Passa, Rekord) */}
          <div className="grid grid-cols-3 gap-2 w-full mt-5">
            <div className="bg-[#10222b] border border-[#0d2b52] rounded-2xl p-2.5">
              <div className="flex items-center justify-center text-[#6ea900] mb-1">
                <Dumbbell size={16} />
              </div>
              <div className="font-black text-base text-white">{user.allTimeWorkouts}</div>
              <div className="text-[10px] text-zinc-400 font-semibold uppercase">Treningi</div>
            </div>

            <div className="bg-[#10222b] border border-[#0d2b52] rounded-2xl p-2.5">
              <div className="flex items-center justify-center text-[#ff6b87] mb-1">
                <Flame size={16} className="fill-[#a10b2b]" />
              </div>
              <div className="font-black text-base text-white">{user.currentStreak}w</div>
              <div className="text-[10px] text-zinc-400 font-semibold uppercase">Passa</div>
            </div>

            <div className="bg-[#10222b] border border-[#0d2b52] rounded-2xl p-2.5">
              <div className="flex items-center justify-center text-amber-400 mb-1">
                <Award size={16} />
              </div>
              <div className="font-black text-base text-white">{user.longestStreak}w</div>
              <div className="text-[10px] text-zinc-400 font-semibold uppercase">Rekord</div>
            </div>
          </div>

          {/* Profile Actions */}
          {isCurrentLoggedUser && (
            <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center gap-1.5 text-xs bg-[#6ea900] text-black font-black px-3.5 py-1.5 rounded-full shadow-md shadow-[#6ea900]/20 active:scale-95 transition-transform"
              >
                <Pencil size={12} strokeWidth={3} />
                <span>Edytuj profil</span>
              </button>

              <button
                onClick={onOpenSwitchUser}
                className="flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white px-3.5 py-1.5 rounded-full bg-[#1b3644] border border-[#0d2b52] hover:border-[#6ea900] transition-colors"
              >
                <LogOut size={12} />
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
            <Calendar size={16} className="text-[#6ea900]" />
            <h3 className="font-bold text-sm text-white">Archiwum BeReal ({userWorkouts.length})</h3>
          </div>
          <span className="text-xs text-zinc-400">Kliknij zdjęcie po szczegóły</span>
        </div>

        {/* Workout Grid */}
        {userWorkouts.length === 0 ? (
          <div className="bg-[#152b36] border border-[#0d2b52] rounded-2xl p-8 text-center text-zinc-400 text-xs shadow-md">
            Brak zapisanych treningów w archiwum tego użytkownika.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
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
                  <div className="absolute top-2 left-2 w-12 h-16 rounded-lg overflow-hidden border border-[#0d2b52] shadow">
                    <img src={w.selfieUrl} alt="Selfie" className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Bottom Overlay */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#10222b] via-[#10222b]/60 to-transparent p-2.5 pt-6 text-left">
                  <div className="text-[11px] font-bold text-white truncate">{w.sportTitle}</div>
                  <div className="text-[10px] text-zinc-300">
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
            className="fixed inset-0 z-50 bg-[#10222b]/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-[#152b36] border border-[#0d2b52] rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl relative pointer-events-auto"
            >
              <button
                onClick={() => setSelectedWorkout(null)}
                className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-[#10222b]/80 border border-[#0d2b52] text-white flex items-center justify-center hover:bg-[#10222b]"
              >
                <X size={16} />
              </button>

              {/* Photo */}
              <div className="relative aspect-[4/5] bg-[#10222b]">
                <img
                  src={selectedWorkout.photoUrl}
                  alt={selectedWorkout.sportTitle}
                  className="w-full h-full object-cover"
                />
                {selectedWorkout.selfieUrl && (
                  <div className="absolute top-3 left-3 w-20 h-28 rounded-xl overflow-hidden border-2 border-[#0d2b52] shadow-2xl">
                    <img
                      src={selectedWorkout.selfieUrl}
                      alt="Selfie"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="p-4 space-y-2">
                <h4 className="font-bold text-sm text-white">{selectedWorkout.sportTitle}</h4>
                <p className="text-xs text-zinc-400">
                  Data:{' '}
                  {format(new Date(selectedWorkout.createdAt), 'd MMMM yyyy, HH:mm', {
                    locale: pl,
                  })}
                </p>
                {selectedWorkout.notes && (
                  <p className="text-xs text-zinc-200 bg-[#10222b] p-2.5 rounded-xl border border-[#0d2b52]">
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
