import React, { useState, useEffect, useRef } from 'react';
import { store } from './services/store';
import { User, Workout, PushNotification } from './types';
import { Header } from './components/Header';
import { Feed } from './components/Feed';
import { Leaderboard } from './components/Leaderboard';
import { ProfileView } from './components/ProfileView';
import { AddWorkoutModal } from './components/AddWorkoutModal';
import { NotificationToast } from './components/NotificationToast';
import { LoginModal } from './components/LoginModal';
import { Plus } from 'lucide-react';

export type ScreenTab = 'autor' | 'tablica' | 'ranking' | 'moj_profil';

const SCREEN_INDEXES: Record<ScreenTab, number> = {
  autor: 0,
  tablica: 1,
  ranking: 2,
  moj_profil: 3,
};

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User>(store.getCurrentUser());
  const [users, setUsers] = useState<User[]>(store.getUsers());
  const [workouts, setWorkouts] = useState<Workout[]>(store.getWorkouts());
  const [thisWeekWorkouts, setThisWeekWorkouts] = useState<Workout[]>(store.getThisWeekWorkouts());
  
  // Track active horizontal screen (Default: tablica)
  const [activeScreen, setActiveScreen] = useState<ScreenTab>('tablica');
  
  // Track currently visible author dynamically from the feed
  const [visibleAuthorId, setVisibleAuthorId] = useState<string>(
    workouts[0]?.userId || currentUser.id
  );

  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [pushNotification, setPushNotification] = useState<PushNotification | null>(null);
  const [openChildModals, setOpenChildModals] = useState<Set<string>>(new Set());

  const handleChildModalToggle = (key: string, isOpen: boolean) => {
    setOpenChildModals((prev) => {
      const next = new Set(prev);
      if (isOpen) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const isAnyModalOpen = isAddModalOpen || isLoginModalOpen || openChildModals.size > 0;

  // Gesture tracking refs
  const touchStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Sync state with store updates
  useEffect(() => {
    const unsubscribeStore = store.subscribe(() => {
      setCurrentUser(store.getCurrentUser());
      setUsers(store.getUsers());
      setWorkouts(store.getWorkouts());
      setThisWeekWorkouts(store.getThisWeekWorkouts());
    });

    const unsubscribeNotifications = store.subscribeNotifications((notif) => {
      setPushNotification(notif);
    });

    return () => {
      unsubscribeStore();
      unsubscribeNotifications();
    };
  }, []);

  const handleToggleReaction = (workoutId: string, emoji: string) => {
    store.toggleReaction(workoutId, emoji);
  };

  const handleAddComment = (workoutId: string, text: string) => {
    store.addComment(workoutId, text);
  };

  const handleAddAudioComment = (workoutId: string, audioUrl: string, duration: number) => {
    store.addAudioComment(workoutId, audioUrl, duration);
  };

  const handleSaveWorkout = (workoutData: any) => {
    store.addWorkout(workoutData);
    setActiveScreen('tablica');
  };

  const handleSelectUser = (userId: string) => {
    setVisibleAuthorId(userId);
    setActiveScreen('autor');
  };

  const handleSwitchUser = (userId: string) => {
    store.setCurrentUser(userId);
  };

  const handleCreateUser = (name: string, pin: string, avatar: string) => {
    const newUser = store.createUser(name, pin, avatar);
    setVisibleAuthorId(newUser.id);
  };

  const handleUpdateUser = (data: { name: string; pin: string; avatar: string }) => {
    store.updateUser(currentUser.id, data);
  };

  // Tactile swipe navigation
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (isAnyModalOpen) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    touchStartRef.current = { x: clientX, y: clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
    if (isAnyModalOpen) return;
    const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
    const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : e.clientY;
    
    const diffX = clientX - touchStartRef.current.x;
    const diffY = clientY - touchStartRef.current.y;

    if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY) * 1.2) {
      if (diffX < 0) {
        // Dragged Left -> go right on the track: autor -> tablica -> ranking -> moj_profil
        if (activeScreen === 'autor') setActiveScreen('tablica');
        else if (activeScreen === 'tablica') setActiveScreen('ranking');
        else if (activeScreen === 'ranking') setActiveScreen('moj_profil');
      } else {
        // Dragged Right -> go left on the track: moj_profil -> ranking -> tablica -> autor
        if (activeScreen === 'moj_profil') setActiveScreen('ranking');
        else if (activeScreen === 'ranking') setActiveScreen('tablica');
        else if (activeScreen === 'tablica') setActiveScreen('autor');
      }
    }
  };

  // Keyboard navigation for testing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAnyModalOpen) return;
      if (e.key === 'ArrowRight') {
        if (activeScreen === 'autor') setActiveScreen('tablica');
        else if (activeScreen === 'tablica') setActiveScreen('ranking');
        else if (activeScreen === 'ranking') setActiveScreen('moj_profil');
      } else if (e.key === 'ArrowLeft') {
        if (activeScreen === 'moj_profil') setActiveScreen('ranking');
        else if (activeScreen === 'ranking') setActiveScreen('tablica');
        else if (activeScreen === 'tablica') setActiveScreen('autor');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeScreen, isAnyModalOpen]);

  // Dynamically resolve author user from current photo
  const authorUser = users.find((u) => u.id === visibleAuthorId) || users[0];
  const thisWeekCountForCurrent = thisWeekWorkouts.filter(
    (w) => w.userId === currentUser.id
  ).length;

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="h-[100dvh] w-full overflow-hidden bg-black text-white relative select-none"
    >
      {/* Native Push Notification Toast Banner */}
      <NotificationToast
        notification={pushNotification}
        onClose={() => setPushNotification(null)}
      />

      {/* Floating Minimal Header: Logo lewo, licznik x/3 środek, awatar prawo */}
      <Header
        currentUser={currentUser}
        thisWeekCount={thisWeekCountForCurrent}
        onOpenSwitchUser={() => setIsLoginModalOpen(true)}
      />

      {/* Smooth Animated Horizontal Carousel Track */}
      <main
        className="flex w-[400vw] h-full transition-transform duration-300 ease-out will-change-transform"
        style={{
          transform: `translateX(-${SCREEN_INDEXES[activeScreen] * 100}vw)`,
        }}
      >
        {/* Screen 0: Profil Autora Zdjęcia */}
        <div className="w-[100vw] h-full shrink-0 overflow-y-auto pt-16 pb-20 bg-[#1b3644]">
          <ProfileView
            user={authorUser}
            workouts={workouts}
            isCurrentLoggedUser={authorUser.id === currentUser.id}
            onBackToMe={() => setActiveScreen('tablica')}
            onOpenSwitchUser={() => setIsLoginModalOpen(true)}
            onModalToggle={(open) => handleChildModalToggle('profile-author', open)}
            onUpdateUser={handleUpdateUser}
          />
        </div>

        {/* Screen 1: Główna Tablica (Feed) */}
        <div className="w-[100vw] h-full shrink-0 relative bg-black overflow-hidden">
          <Feed
            workouts={workouts}
            currentUser={currentUser}
            onToggleReaction={handleToggleReaction}
            onAddComment={handleAddComment}
            onAddAudioComment={handleAddAudioComment}
            onSelectUser={handleSelectUser}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onVisibleAuthorChange={(id) => setVisibleAuthorId(id)}
            onModalToggle={(open) => handleChildModalToggle('feed-comments', open)}
          />
        </div>

        {/* Screen 2: Ranking */}
        <div className="w-[100vw] h-full shrink-0 overflow-y-auto pt-16 pb-20 bg-[#1b3644]">
          <Leaderboard
            users={users}
            thisWeekWorkouts={thisWeekWorkouts}
            currentUser={currentUser}
            onSelectUser={handleSelectUser}
            onModalToggle={(open) => handleChildModalToggle('leaderboard', open)}
          />
        </div>

        {/* Screen 3: Mój Profil */}
        <div className="w-[100vw] h-full shrink-0 overflow-y-auto pt-16 pb-20 bg-[#1b3644]">
          <ProfileView
            user={currentUser}
            workouts={workouts}
            isCurrentLoggedUser={true}
            onOpenSwitchUser={() => setIsLoginModalOpen(true)}
            onModalToggle={(open) => handleChildModalToggle('profile-current', open)}
            onUpdateUser={handleUpdateUser}
          />
        </div>
      </main>

      {/* Plusik dodania foty: powiększony, solidny płaski kolor pod kciuk */}
      <button
        onClick={() => setIsAddModalOpen(true)}
        title="Dodaj trening"
        className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-30 w-16 h-16 rounded-full bg-[#6ea900] text-black flex items-center justify-center shadow-2xl shadow-[#6ea900]/40 active:scale-90 transition-all border-2 border-black ${
          isAnyModalOpen ? 'opacity-0 pointer-events-none scale-75' : 'opacity-100 scale-100'
        }`}
      >
        <Plus size={32} strokeWidth={3.5} />
      </button>

      {/* Add Workout Modal */}
      <AddWorkoutModal
        currentUser={currentUser}
        users={users}
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSaveWorkout={handleSaveWorkout}
      />

      {/* Profile Switcher / Login Modal */}
      <LoginModal
        users={users}
        currentUserId={currentUser.id}
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSelectUser={handleSwitchUser}
        onCreateUser={handleCreateUser}
      />
    </div>
  );
};

export default App;
