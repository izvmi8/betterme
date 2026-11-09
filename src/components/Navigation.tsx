import React from 'react';
import { Flame, Trophy, Plus, User } from 'lucide-react';

export type TabType = 'feed' | 'leaderboard' | 'profile';

interface NavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onOpenAddModal: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  onOpenAddModal,
}) => {
  return (
    <nav className="fixed bottom-4 inset-x-4 z-40 max-w-xs mx-auto bg-black/65 backdrop-blur-xl border border-white/15 rounded-full px-4 py-2 shadow-2xl shadow-black/80">
      <div className="flex items-center justify-between">
        {/* Feed Tab (TikTok style fire / feed) */}
        <button
          onClick={() => onTabChange('feed')}
          className={`p-2 rounded-full transition-all ${
            activeTab === 'feed'
              ? 'text-[#6ea900] scale-110 drop-shadow-[0_0_8px_rgba(110,169,0,0.5)]'
              : 'text-zinc-400 hover:text-white'
          }`}
          title="Feed Treningów"
        >
          <Flame size={22} className={activeTab === 'feed' ? 'fill-[#6ea900]' : ''} />
        </button>

        {/* Center Add Button */}
        <button
          onClick={onOpenAddModal}
          className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#a10b2b] to-[#6ea900] p-0.5 shadow-lg shadow-[#6ea900]/30 active:scale-90 transition-transform flex items-center justify-center"
          title="Dodaj trening"
        >
          <div className="w-full h-full rounded-full bg-black/70 flex items-center justify-center hover:bg-transparent transition-colors">
            <Plus size={22} className="text-white" strokeWidth={3} />
          </div>
        </button>

        {/* Leaderboard Tab */}
        <button
          onClick={() => onTabChange('leaderboard')}
          className={`p-2 rounded-full transition-all ${
            activeTab === 'leaderboard'
              ? 'text-[#6ea900] scale-110 drop-shadow-[0_0_8px_rgba(110,169,0,0.5)]'
              : 'text-zinc-400 hover:text-white'
          }`}
          title="Rankingi"
        >
          <Trophy size={22} />
        </button>

        {/* Profile Tab */}
        <button
          onClick={() => onTabChange('profile')}
          className={`p-2 rounded-full transition-all ${
            activeTab === 'profile'
              ? 'text-[#6ea900] scale-110 drop-shadow-[0_0_8px_rgba(110,169,0,0.5)]'
              : 'text-zinc-400 hover:text-white'
          }`}
          title="Mój Profil"
        >
          <User size={22} />
        </button>
      </div>
    </nav>
  );
};
