import React from 'react';
import { Flame } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  currentUser: User;
  thisWeekCount: number;
  onOpenSwitchUser: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  thisWeekCount,
  onOpenSwitchUser,
}) => {
  const goal = 3;
  const isGoalMet = thisWeekCount >= goal;
  const isEndangered = !isGoalMet && currentUser.currentStreak > 0;

  return (
    <header className="fixed top-0 inset-x-0 z-40 pointer-events-none px-4 pt-3 pb-6 bg-gradient-to-b from-black/85 via-black/35 to-transparent">
      <div className="max-w-md mx-auto flex items-center justify-between pointer-events-auto">
        {/* 1. W lewym górnym rogu: logo apki */}
        <div className="flex items-center gap-1.5">
          <span className="font-black text-xl tracking-tighter text-white drop-shadow-md select-none">
            better<span className="text-[#6ea900]">me</span>
          </span>
        </div>

        {/* 2. Na samej górze wycentrowane: licznik Twojej serii x/3 + wskaźnik zagrożenia */}
        <div
          className={`flex items-center gap-1.5 backdrop-blur-md px-3 py-1 rounded-full border shadow-lg transition-all ${
            isGoalMet
              ? 'bg-black/60 border-[#6ea900]/40 shadow-black/50'
              : isEndangered
              ? 'bg-[#a10b2b]/35 border-[#a10b2b] shadow-[#a10b2b]/30'
              : 'bg-black/60 border-white/15 shadow-black/50'
          }`}
        >
          <Flame
            size={14}
            className={`${
              isGoalMet
                ? 'fill-[#6ea900] text-[#6ea900]'
                : isEndangered
                ? 'fill-[#a10b2b] text-[#ff4d6d] animate-pulse'
                : 'fill-[#a10b2b] text-[#a10b2b]'
            }`}
          />
          <span className="text-xs font-black tracking-wide text-white">
            {thisWeekCount}
            <span className="text-zinc-400 font-bold">/{goal}</span>
          </span>
          {isGoalMet ? (
            <span className="text-[10px] bg-[#6ea900] text-black font-black px-1.5 py-0.2 rounded-full ml-0.5">
              CEL
            </span>
          ) : isEndangered ? (
            <span className="text-[9px] bg-[#a10b2b] text-white font-extrabold px-1.5 py-0.2 rounded-full ml-0.5 animate-pulse">
              ZAGROŻONA
            </span>
          ) : null}
        </div>

        {/* 3. W prawym górnym rogu: awatar konta */}
        <button
          onClick={onOpenSwitchUser}
          title="Kliknij, aby przełączyć profil"
          className="relative group active:scale-90 transition-transform"
        >
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-9 h-9 rounded-full object-cover border-2 border-white/20 group-hover:border-[#6ea900] shadow-md transition-colors"
          />
          <div className="absolute -bottom-1 -right-1 bg-[#a10b2b] text-white text-[9px] font-black px-1 rounded-full border border-black flex items-center gap-0.2">
            {currentUser.currentStreak}w
          </div>
        </button>
      </div>
    </header>
  );
};
