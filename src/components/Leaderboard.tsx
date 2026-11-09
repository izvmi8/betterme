import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, Workout } from '../types';
import { Trophy, Skull, Flame, Award, Clock, ChevronRight, X, Copy, Check, Sparkles } from 'lucide-react';
import { store } from '../services/store';

interface LeaderboardProps {
  users: User[];
  thisWeekWorkouts: Workout[];
  currentUser: User;
  onSelectUser: (userId: string) => void;
  onModalToggle?: (isOpen: boolean) => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  users,
  thisWeekWorkouts,
  currentUser,
  onSelectUser,
  onModalToggle,
}) => {
  const [activeTab, setActiveTab] = useState<'weekly' | 'alltime'>('weekly');
  const [nudgedUsers, setNudgedUsers] = useState<Record<string, boolean>>({});
  const [isShameCardOpen, setIsShameCardOpen] = useState<boolean>(false);
  const [copiedShame, setCopiedShame] = useState<boolean>(false);
  const [isWrappedOpen, setIsWrappedOpen] = useState<boolean>(false);
  const [wrappedSlide, setWrappedSlide] = useState<number>(0);

  // Notify parent modal state to lock screen carousel navigation
  useEffect(() => {
    onModalToggle?.(isShameCardOpen || isWrappedOpen);
  }, [isShameCardOpen, isWrappedOpen, onModalToggle]);

  const targetGoal = 3;

  // Calculate current week workouts per user
  const weeklyCounts: Record<string, number> = {};
  users.forEach((u) => {
    weeklyCounts[u.id] = 0;
  });
  thisWeekWorkouts.forEach((w) => {
    weeklyCounts[w.userId] = (weeklyCounts[w.userId] || 0) + 1;
    // Credit tagged gym buddies too
    if (w.taggedUserIds) {
      w.taggedUserIds.forEach((id) => {
        weeklyCounts[id] = (weeklyCounts[id] || 0) + 1;
      });
    }
  });

  // Sort weekly: most workouts first, then allTimeWorkouts
  const weeklyLeaderboard = [...users].sort((a, b) => {
    const diff = (weeklyCounts[b.id] || 0) - (weeklyCounts[a.id] || 0);
    if (diff !== 0) return diff;
    return b.allTimeWorkouts - a.allTimeWorkouts;
  });

  // Shame group: users who have < 3 workouts
  const shameUsers = weeklyLeaderboard.filter((u) => (weeklyCounts[u.id] || 0) < targetGoal);

  // Sort all-time: most total workouts first
  const allTimeLeaderboard = [...users].sort((a, b) => b.allTimeWorkouts - a.allTimeWorkouts);

  // Feature 9: Wrapped stats
  const topDzik = allTimeLeaderboard[0] || users[0];
  const lowestUser = allTimeLeaderboard[allTimeLeaderboard.length - 1] || users[users.length - 1];
  const totalTeamWorkouts = users.reduce((acc, u) => acc + u.allTimeWorkouts, 0);

  // Feature 1: Nudge action
  const handleNudge = (e: React.MouseEvent, targetUser: User) => {
    e.stopPropagation();
    store.nudgeUser(targetUser.id);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([40, 60, 40]);
      } catch {}
    }
    setNudgedUsers((prev) => ({ ...prev, [targetUser.id]: true }));
    setTimeout(() => {
      setNudgedUsers((prev) => ({ ...prev, [targetUser.id]: false }));
    }, 2500);
  };

  // Feature 2: Copy formatted report for Messenger / WhatsApp
  const handleCopyShameReport = () => {
    const leader = weeklyLeaderboard[0];
    const worst = shameUsers[shameUsers.length - 1] || shameUsers[0];

    const reportLines = [
      '🚨 MELDUNEK HAŃBY BeMe 🚨',
      '📅 Cel: min. 3 treningi do niedzieli 23:59',
      '',
      worst
        ? `💀 DZIAD TYGODNIA: ${worst.name} (${weeklyCounts[worst.id] || 0}/3 treningów)`
        : '',
      '🍕 KARA: Duża pizza / kebab dla ekipy w niedzielę!',
      '',
      '📊 AKTUALNY STAN:',
      ...weeklyLeaderboard.map((u, i) => {
        const c = weeklyCounts[u.id] || 0;
        const status = c >= 3 ? '🔥 ZALICZONE (3/3)' : c === 0 ? '💀 0/3 (HAŃBA)' : `⚠️ ${c}/3 (ZAGROŻENIE)`;
        return `${i + 1}. ${u.name}: ${status}`;
      }),
      '',
      leader
        ? `👑 DZIK TYGODNIA: ${leader.name} (${weeklyCounts[leader.id] || 0} treningów)`
        : '',
      '',
      'Ruszcie tyłki, zegar tyka! ⏰🏋️',
    ].filter(Boolean);

    navigator.clipboard.writeText(reportLines.join('\n'));
    setCopiedShame(true);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(50);
      } catch {}
    }
    setTimeout(() => setCopiedShame(false), 3000);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-6 pb-24 select-none">
      {/* Feature 9: Spotify-Wrapped style banner button */}
      <button
        onClick={() => {
          setIsWrappedOpen(true);
          setWrappedSlide(0);
        }}
        className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-[#152b36] via-[#10222b] to-[#152b36] border border-[#6ea900]/40 flex items-center justify-between shadow-xl shadow-[#0d2b52]/30 active:scale-95 transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#6ea900] to-[#0d2b52] flex items-center justify-center text-white text-lg shadow-md group-hover:rotate-6 transition-transform">
            🎧
          </div>
          <div className="text-left">
            <div className="text-xs font-black text-white flex items-center gap-1.5">
              Miesięczne Podsumowanie Ekipy
              <span className="text-[10px] bg-[#6ea900] text-black font-extrabold px-1.5 py-0.2 rounded-full">
                WRAPPED
              </span>
            </div>
            <div className="text-[11px] text-zinc-400">
              Sprawdź kto jest Dzikiem, a kto Królem Kanapy 🛋️
            </div>
          </div>
        </div>
        <ChevronRight size={18} className="text-[#6ea900]" />
      </button>

      {/* Switcher Tab */}
      <div className="flex bg-[#152b36] p-1 rounded-2xl border border-[#0d2b52] shadow-md shadow-[#0d2b52]/30">
        <button
          onClick={() => setActiveTab('weekly')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'weekly'
              ? 'bg-[#6ea900] text-black shadow-lg shadow-[#6ea900]/25'
              : 'text-zinc-300 hover:text-white'
          }`}
        >
          <Trophy size={14} />
          Ten Tydzień (Cel: 3/3)
        </button>
        <button
          onClick={() => setActiveTab('alltime')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'alltime'
              ? 'bg-[#6ea900] text-black shadow-lg shadow-[#6ea900]/25'
              : 'text-zinc-300 hover:text-white'
          }`}
        >
          <Award size={14} />
          Wszechczasów
        </button>
      </div>

      {activeTab === 'weekly' ? (
        <>
          {/* Sunday Deadline Banner */}
          <div className="bg-[#a10b2b]/15 border border-[#a10b2b]/40 rounded-2xl p-3.5 flex items-center gap-3 shadow-md shadow-[#a10b2b]/10">
            <div className="w-9 h-9 rounded-xl bg-[#a10b2b]/30 border border-[#a10b2b]/50 flex items-center justify-center text-[#ff6b87] shrink-0">
              <Clock size={18} />
            </div>
            <div className="text-xs">
              <span className="font-bold text-[#ff6b87]">Reset w niedzielę o 23:59:</span>
              <p className="text-zinc-200">
                Minimum 3 treningi, by zachować czyste konto. Ostatnie miejsce stawia pizzę 🍕!
              </p>
            </div>
          </div>

          {/* Top Rankings List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 px-1">
              Aktualna klasyfikacja
            </h3>

            {weeklyLeaderboard.map((user, index) => {
              const count = weeklyCounts[user.id] || 0;
              const isGoalMet = count >= targetGoal;
              const isCurrentUser = user.id === currentUser.id;
              const isEndangered = !isGoalMet && user.currentStreak > 0;

              return (
                <div
                  key={user.id}
                  onClick={() => onSelectUser(user.id)}
                  className={`bg-[#152b36] border rounded-2xl p-3.5 flex items-center justify-between cursor-pointer transition-all hover:border-[#6ea900]/60 ${
                    isCurrentUser
                      ? 'border-[#6ea900] bg-[#6ea900]/10 shadow-lg shadow-[#6ea900]/10'
                      : 'border-[#0d2b52]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Rank Badge */}
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs ${
                        index === 0
                          ? 'bg-[#6ea900] text-black shadow-sm shadow-[#6ea900]/40'
                          : index === 1
                          ? 'bg-zinc-300 text-black'
                          : index === 2
                          ? 'bg-amber-600 text-white'
                          : 'bg-[#1b3644] text-zinc-400 border border-[#0d2b52]'
                      }`}
                    >
                      {index + 1}
                    </div>

                    {/* Avatar */}
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover border border-[#0d2b52]"
                    />

                    {/* User info */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{user.name}</span>
                        {isCurrentUser && (
                          <span className="text-[10px] bg-[#6ea900]/20 text-[#9be819] px-1.5 py-0.2 rounded font-bold border border-[#6ea900]/30">
                            Ty
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <span className="flex items-center gap-0.5 text-[#ff6b87] font-semibold">
                          <Flame
                            size={12}
                            className={
                              isEndangered
                                ? 'fill-[#a10b2b] text-[#ff4d6d] animate-pulse'
                                : 'fill-[#a10b2b] text-[#a10b2b]'
                            }
                          />
                          {user.currentStreak}w passa
                        </span>

                        {/* Feature 3: Threat indicator */}
                        {isEndangered && (
                          <span className="text-[9px] bg-[#a10b2b]/25 text-[#ff6b87] border border-[#a10b2b]/50 px-1 py-0.2 rounded font-bold animate-pulse">
                            zagrożona!
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right side: Progress Towards 3 workouts */}
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="font-black text-lg text-white">{count}</span>
                      <span className="text-xs text-zinc-400">/ {targetGoal}</span>
                    </div>

                    <div className="w-20 bg-[#1b3644] border border-[#0d2b52] h-2.5 rounded-full overflow-hidden mt-1">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isGoalMet ? 'bg-[#6ea900]' : 'bg-[#a10b2b]'
                        }`}
                        style={{ width: `${Math.min(100, (count / targetGoal) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Wall of Shame (Tablica Wstydu) in #a10b2b Crimson Accent */}
          {shameUsers.length > 0 && (
            <div className="bg-[#a10b2b]/15 border-2 border-[#a10b2b] rounded-3xl p-4 space-y-3.5 shadow-xl shadow-[#a10b2b]/15">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#ff4d6d]">
                  <Skull size={20} />
                  <h3 className="font-black text-sm uppercase tracking-wider">
                    Tablica Wstydu (Brak normy 3/3)
                  </h3>
                </div>
                <span className="text-[10px] font-black bg-[#a10b2b] text-white px-2 py-0.5 rounded-full">
                  {shameUsers.length} os.
                </span>
              </div>

              <p className="text-xs text-zinc-300 leading-snug">
                Poniższe osoby wiszą pizzę, jeśli do niedzieli 23:59 nie dobiją do 3 treningów.
              </p>

              {/* Feature 2: Przycisk Karty Hańby Tygodnia */}
              <button
                onClick={() => setIsShameCardOpen(true)}
                className="w-full py-2.5 px-3 rounded-2xl bg-[#a10b2b] hover:bg-[#850821] text-white font-black text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-[#a10b2b]/40 border border-white/20"
              >
                📜 Karta Hańby Tygodnia (Meldunek na Messengera)
              </button>

              {/* Slacker cards with Feature 1: NUDGE BUTTON */}
              <div className="space-y-2 pt-1">
                {shameUsers.map((user) => {
                  const count = weeklyCounts[user.id] || 0;
                  const isNudged = !!nudgedUsers[user.id];
                  const isCurrentUser = user.id === currentUser.id;

                  return (
                    <div
                      key={user.id}
                      className="bg-[#10222b] border border-[#a10b2b]/50 rounded-2xl p-3 flex items-center justify-between"
                    >
                      <div
                        onClick={() => onSelectUser(user.id)}
                        className="flex items-center gap-3 cursor-pointer flex-1"
                      >
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-9 h-9 rounded-full object-cover grayscale border border-[#a10b2b]"
                        />
                        <div className="overflow-hidden">
                          <div className="font-bold text-xs text-zinc-200 flex items-center gap-1.5">
                            <span>{user.name}</span>
                            {isCurrentUser && (
                              <span className="text-[9px] bg-[#a10b2b] text-white px-1 rounded font-bold">
                                Ty
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-[#ff4d6d] font-bold">
                            {count === 0 ? '0 treningów 💀' : `${count}/3 treningi ⚠️`}
                          </div>
                        </div>
                      </div>

                      {/* Feature 1: Pogań Lenia (Nudge) Button */}
                      <div>
                        {isCurrentUser ? (
                          <span className="text-[10px] text-zinc-400 font-bold bg-[#152b36] px-2 py-1 rounded-xl border border-[#0d2b52]">
                            Rusz się! 🏃
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => handleNudge(e, user)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 active:scale-90 shadow-md ${
                              isNudged
                                ? 'bg-[#6ea900] text-black shadow-[#6ea900]/40'
                                : 'bg-[#a10b2b] hover:bg-[#850821] text-white shadow-[#a10b2b]/40 border border-white/20'
                            }`}
                          >
                            {isNudged ? (
                              <>
                                <Check size={12} strokeWidth={3} /> Kopnięto!
                              </>
                            ) : (
                              <>📢 Pogań</>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      ) : (
        /* Ranking Wszechczasów (All-Time) */
        <div className="space-y-3">
          <div className="bg-[#152b36] border border-[#0d2b52] rounded-2xl p-4 flex items-center justify-between text-xs shadow-md">
            <div>
              <span className="font-bold text-white text-sm">Historia Grupy</span>
              <p className="text-zinc-300">Wszystkie zaliczone treningi od założenia BeMe.</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#6ea900]/15 border border-[#6ea900]/40 flex items-center justify-center text-[#6ea900] font-black text-lg">
              ∞
            </div>
          </div>

          <div className="space-y-2.5">
            {allTimeLeaderboard.map((user, index) => {
              const isCurrentUser = user.id === currentUser.id;

              return (
                <div
                  key={user.id}
                  onClick={() => onSelectUser(user.id)}
                  className={`bg-[#152b36] border rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:border-[#6ea900]/60 transition-all ${
                    isCurrentUser ? 'border-[#6ea900] bg-[#6ea900]/10' : 'border-[#0d2b52]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs ${
                        index === 0
                          ? 'bg-[#6ea900] text-black'
                          : index === 1
                          ? 'bg-zinc-300 text-black'
                          : index === 2
                          ? 'bg-amber-600 text-white'
                          : 'bg-[#1b3644] text-zinc-400 border border-[#0d2b52]'
                      }`}
                    >
                      {index + 1}
                    </div>

                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-11 h-11 rounded-full object-cover border border-[#0d2b52]"
                    />

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-white">{user.name}</span>
                        {isCurrentUser && (
                          <span className="text-[10px] bg-[#6ea900]/20 text-[#9be819] px-1.5 py-0.2 rounded font-bold border border-[#6ea900]/30">
                            Ty
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-zinc-400 mt-0.5">
                        <span className="flex items-center gap-1 text-[#ff6b87]">
                          <Flame size={11} className="fill-[#a10b2b] text-[#a10b2b]" />
                          rekordowa passa: {user.longestStreak}w
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-black text-lg text-[#6ea900]">
                      {user.allTimeWorkouts}
                    </div>
                    <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
                      treningów
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Feature 2: MODAL KARTY HAŃBY TYGODNIA (Meldunek na Messengera) */}
      {isShameCardOpen &&
        createPortal(
          <div
            onClick={() => setIsShameCardOpen(false)}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-[#152b36] border-2 border-[#a10b2b] rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl relative pointer-events-auto"
            >
              <button
                onClick={() => setIsShameCardOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#1b3644] text-zinc-400 hover:text-white flex items-center justify-center border border-[#0d2b52]"
              >
                <X size={16} />
              </button>

              <div className="text-center pt-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#ff4d6d] bg-[#a10b2b]/30 px-3 py-1 rounded-full border border-[#a10b2b]/50">
                  Oficjalny Raport Karny
                </span>
                <h2 className="text-lg font-black text-white mt-2">Meldunek Hańby Tygodnia 📜</h2>
              </div>

              {/* Poster "Dziad Tygodnia" */}
              {shameUsers.length > 0 && (
                <div className="bg-[#10222b] border border-[#a10b2b] rounded-2xl p-4 text-center space-y-2 relative overflow-hidden">
                  <div className="absolute top-2 right-2 text-2xl rotate-12">💀</div>
                  <div className="relative inline-block">
                    <img
                      src={shameUsers[shameUsers.length - 1].avatar}
                      alt="Dziad tygodnia"
                      className="w-16 h-16 rounded-full mx-auto object-cover border-2 border-[#a10b2b] grayscale"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-[#a10b2b] text-white text-[9px] font-black px-1.5 py-0.2 rounded-full border border-black">
                      DZIAD
                    </div>
                  </div>
                  <div>
                    <div className="font-black text-base text-white">
                      {shameUsers[shameUsers.length - 1].name}
                    </div>
                    <div className="text-xs text-[#ff4d6d] font-bold">
                      Tylko {weeklyCounts[shameUsers[shameUsers.length - 1].id] || 0}/3 treningów!
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-300 italic bg-[#152b36] p-2 rounded-xl border border-[#0d2b52]">
                    🍕 Kara regulaminowa: W niedzielę o 23:59 zamawiasz dużą pizzę dla całej ekipy!
                  </p>
                </div>
              )}

              {/* CTA: Kopiuj na Messengera */}
              <button
                onClick={handleCopyShameReport}
                className={`w-full py-3.5 px-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all shadow-xl active:scale-95 ${
                  copiedShame
                    ? 'bg-[#6ea900] text-black shadow-[#6ea900]/40'
                    : 'bg-gradient-to-r from-[#a10b2b] to-[#6ea900] text-white shadow-[#6ea900]/30 border border-white/20'
                }`}
              >
                {copiedShame ? (
                  <>
                    <Check size={16} strokeWidth={3} /> Skopiowano do schowka! Wklej na grupę ✓
                  </>
                ) : (
                  <>
                    <Copy size={16} /> Kopiuj meldunek na Messengera 📋
                  </>
                )}
              </button>
            </div>
          </div>,
          document.body
        )}

      {/* Feature 9: MODAL SPOTIFY WRAPPED (3-SLIDE VISUAL STORY) */}
      {isWrappedOpen &&
        createPortal(
          <div
            onClick={() => setIsWrappedOpen(false)}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex items-center justify-center p-4 animate-in fade-in duration-200"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-[#10222b] border border-[#6ea900]/60 rounded-3xl max-w-sm w-full h-[520px] flex flex-col justify-between p-6 shadow-2xl relative overflow-hidden pointer-events-auto"
            >
              {/* Top Stories Progress Bars */}
              <div className="flex items-center gap-1.5 w-full">
                {[0, 1, 2].map((idx) => (
                  <div
                    key={idx}
                    className="flex-1 h-1 rounded-full bg-white/20 overflow-hidden"
                  >
                    <div
                      className={`h-full transition-all duration-300 ${
                        wrappedSlide >= idx ? 'bg-[#6ea900]' : 'bg-transparent'
                      }`}
                    />
                  </div>
                ))}
              </div>

              {/* Close Button */}
              <button
                onClick={() => setIsWrappedOpen(false)}
                className="absolute top-8 right-6 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center border border-white/20 z-10"
              >
                <X size={16} />
              </button>

              {/* SLIDE 0: DZIK MIESIĄCA 👑 */}
              {wrappedSlide === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 py-4 animate-in zoom-in-95 duration-200">
                  <div className="text-4xl animate-bounce">👑</div>
                  <div className="relative">
                    <img
                      src={topDzik.avatar}
                      alt={topDzik.name}
                      className="w-24 h-24 rounded-full object-cover border-4 border-[#6ea900] shadow-2xl shadow-[#6ea900]/50"
                    />
                    <div className="absolute -bottom-2 -right-1 bg-[#6ea900] text-black text-xs font-black px-2 py-0.5 rounded-full">
                      TOP 1
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-widest text-[#9be819]">
                      Kategoria: Siła i Konsekwencja
                    </span>
                    <h3 className="text-2xl font-black text-white mt-1">DZIK MIESIĄCA 🐗</h3>
                    <div className="text-lg font-extrabold text-[#6ea900] mt-0.5">
                      {topDzik.name}
                    </div>
                  </div>
                  <div className="bg-[#152b36] border border-[#0d2b52] rounded-2xl p-3 w-full">
                    <div className="text-2xl font-black text-white">{topDzik.allTimeWorkouts}</div>
                    <div className="text-[11px] text-zinc-400 font-bold uppercase">
                      Wszystkich zaliczonych treningów
                    </div>
                    <p className="text-xs text-zinc-300 mt-2 italic">
                      „Żelazo latało pod sufit, zero wymówek. Czysty potwór!”
                    </p>
                  </div>
                </div>
              )}

              {/* SLIDE 1: KRÓL KANAPY 💀 */}
              {wrappedSlide === 1 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 py-4 animate-in zoom-in-95 duration-200">
                  <div className="text-4xl animate-bounce">🛋️</div>
                  <div className="relative">
                    <img
                      src={lowestUser.avatar}
                      alt={lowestUser.name}
                      className="w-24 h-24 rounded-full object-cover border-4 border-[#a10b2b] shadow-2xl shadow-[#a10b2b]/50 grayscale"
                    />
                    <div className="absolute -bottom-2 -right-1 bg-[#a10b2b] text-white text-xs font-black px-2 py-0.5 rounded-full">
                      DZIAD
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-widest text-[#ff4d6d]">
                      Kategoria: Wierność Poduszkom
                    </span>
                    <h3 className="text-2xl font-black text-white mt-1">KRÓL KANAPY 💀</h3>
                    <div className="text-lg font-extrabold text-[#ff4d6d] mt-0.5">
                      {lowestUser.name}
                    </div>
                  </div>
                  <div className="bg-[#152b36] border border-[#a10b2b]/40 rounded-2xl p-3 w-full">
                    <div className="text-xl font-black text-white">Złoty Medal w Odpoczynku 🍕</div>
                    <p className="text-xs text-zinc-300 mt-1 italic">
                      „Kanapa wciągnęła bardziej niż martwy ciąg. Ekipa czeka na obiecany kebab!”
                    </p>
                  </div>
                </div>
              )}

              {/* SLIDE 2: WYNIK EKIPY 🚀 */}
              {wrappedSlide === 2 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 py-4 animate-in zoom-in-95 duration-200">
                  <div className="text-4xl animate-pulse">🚀</div>
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-widest text-[#9be819]">
                      Podsumowanie Ekipy BeMe
                    </span>
                    <h3 className="text-2xl font-black text-white mt-1">WSPÓLNY WYNIK 🔥</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-3 w-full">
                    <div className="bg-[#152b36] border border-[#0d2b52] rounded-2xl p-3">
                      <div className="text-2xl font-black text-[#6ea900]">{totalTeamWorkouts}</div>
                      <div className="text-[10px] text-zinc-400 font-bold uppercase">
                        Treningów Razem
                      </div>
                    </div>
                    <div className="bg-[#152b36] border border-[#0d2b52] rounded-2xl p-3">
                      <div className="text-2xl font-black text-[#ff6b87]">3/3</div>
                      <div className="text-[10px] text-zinc-400 font-bold uppercase">
                        Cel Tygodniowy
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#152b36] border border-[#6ea900]/40 rounded-2xl p-3 w-full">
                    <div className="text-xs font-black text-white flex items-center justify-center gap-1.5">
                      <Sparkles size={14} className="text-[#6ea900]" />
                      Ocena Ekipy: 10/10 Dzików
                    </div>
                    <p className="text-[11px] text-zinc-300 mt-1">
                      Kolejny miesiąc będzie jeszcze mocniejszy. Nie bierzemy jeńców!
                    </p>
                  </div>
                </div>
              )}

              {/* Bottom Controls */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setWrappedSlide((prev) => Math.max(0, prev - 1))}
                  disabled={wrappedSlide === 0}
                  className="px-4 py-2 rounded-xl bg-[#152b36] border border-[#0d2b52] text-xs font-bold text-zinc-300 disabled:opacity-30 active:scale-95"
                >
                  Poprzedni
                </button>

                {wrappedSlide < 2 ? (
                  <button
                    type="button"
                    onClick={() => setWrappedSlide((prev) => Math.min(2, prev + 1))}
                    className="px-6 py-2 rounded-xl bg-[#6ea900] text-black font-extrabold text-xs active:scale-95 shadow-lg shadow-[#6ea900]/30"
                  >
                    Dalej ➔
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsWrappedOpen(false)}
                    className="px-6 py-2 rounded-xl bg-[#6ea900] text-black font-extrabold text-xs active:scale-95 shadow-lg shadow-[#6ea900]/30"
                  >
                    Idź na trening! 🏋️
                  </button>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
