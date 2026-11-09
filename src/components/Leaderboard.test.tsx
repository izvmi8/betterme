import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Leaderboard } from './Leaderboard';
import { User, Workout } from '../types';
import { store } from '../services/store';

const mockUsers: User[] = [
  {
    id: 'u1',
    name: 'Filip',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    pin: '1234',
    currentStreak: 5,
    allTimeWorkouts: 45,
    allTimeMinutes: 2250,
    longestStreak: 9,
  },
  {
    id: 'u2',
    name: 'Marek',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    pin: '0000',
    currentStreak: 2,
    allTimeWorkouts: 20,
    allTimeMinutes: 1000,
    longestStreak: 4,
  },
  {
    id: 'u3',
    name: 'Wiktor',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    pin: '1111',
    currentStreak: 0,
    allTimeWorkouts: 12,
    allTimeMinutes: 600,
    longestStreak: 3,
  },
];

// Filip has 3 workouts (goal met), Marek has 1 (slacker), Wiktor has 0 (slacker)
const mockThisWeekWorkouts: Workout[] = [
  {
    id: 'w1',
    userId: 'u1',
    userName: 'Filip',
    userAvatar: '',
    sportType: 'gym',
    sportTitle: 'Siłownia',
    durationMinutes: 0,
    photoUrl: 'photo1',
    createdAt: new Date().toISOString(),
    reactions: [],
    comments: [],
  },
  {
    id: 'w2',
    userId: 'u1',
    userName: 'Filip',
    userAvatar: '',
    sportType: 'running',
    sportTitle: 'Bieg',
    durationMinutes: 0,
    photoUrl: 'photo2',
    createdAt: new Date().toISOString(),
    reactions: [],
    comments: [],
  },
  {
    id: 'w3',
    userId: 'u1',
    userName: 'Filip',
    userAvatar: '',
    sportType: 'cycling',
    sportTitle: 'Rower',
    durationMinutes: 0,
    photoUrl: 'photo3',
    createdAt: new Date().toISOString(),
    reactions: [],
    comments: [],
  },
  {
    id: 'w4',
    userId: 'u2',
    userName: 'Marek',
    userAvatar: '',
    sportType: 'gym',
    sportTitle: 'Siłownia',
    durationMinutes: 0,
    photoUrl: 'photo4',
    createdAt: new Date().toISOString(),
    reactions: [],
    comments: [],
  },
];

describe('Leaderboard Component - Accountability & Gamification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders rankings and handles tab switching', () => {
    render(
      <Leaderboard
        users={mockUsers}
        thisWeekWorkouts={mockThisWeekWorkouts}
        currentUser={mockUsers[0]}
        onSelectUser={vi.fn()}
      />
    );

    // Initial weekly tab
    expect(screen.getByText('Aktualna klasyfikacja')).toBeInTheDocument();
    expect(screen.getByText('Reset w niedzielę o 23:59:')).toBeInTheDocument();

    // Switch to alltime tab
    const allTimeTabBtn = screen.getByText('Wszechczasów');
    fireEvent.click(allTimeTabBtn);

    expect(screen.getByText('Historia Grupy')).toBeInTheDocument();
  });

  it('Feature 1: displays Wall of Shame and allows nudging slackers with feedback', () => {
    const nudgeSpy = vi.spyOn(store, 'nudgeUser');

    render(
      <Leaderboard
        users={mockUsers}
        thisWeekWorkouts={mockThisWeekWorkouts}
        currentUser={mockUsers[0]} // Filip is viewer
        onSelectUser={vi.fn()}
      />
    );

    // Tablica Wstydu header
    expect(screen.getByText('Tablica Wstydu (Brak normy 3/3)')).toBeInTheDocument();

    // Marek (1/3) and Wiktor (0/3) are in shame list
    const nudgeButtons = screen.getAllByText('📢 Pogań');
    expect(nudgeButtons.length).toBe(2);

    // Click nudge on first slacker
    fireEvent.click(nudgeButtons[0]);

    expect(nudgeSpy).toHaveBeenCalled();
    expect(screen.getByText(/Kopnięto!/)).toBeInTheDocument();
    expect(navigator.vibrate).toHaveBeenCalled();
  });

  it('Feature 2: opens Karta Hańby Tygodnia and copies formatted text to clipboard', () => {
    render(
      <Leaderboard
        users={mockUsers}
        thisWeekWorkouts={mockThisWeekWorkouts}
        currentUser={mockUsers[0]}
        onSelectUser={vi.fn()}
      />
    );

    const openShameCardBtn = screen.getByText(/Karta Hańby Tygodnia/);
    fireEvent.click(openShameCardBtn);

    expect(screen.getByText('Meldunek Hańby Tygodnia 📜')).toBeInTheDocument();
    expect(screen.getByText(/Kara regulaminowa:/)).toBeInTheDocument();

    // Click copy button
    const copyBtn = screen.getByText(/Kopiuj meldunek na Messengera/);
    fireEvent.click(copyBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalled();
    const copiedText = (navigator.clipboard.writeText as any).mock.calls[0][0];
    expect(copiedText).toContain('MELDUNEK HAŃBY BeMe');
    expect(copiedText).toContain('DZIAD TYGODNIA');
    expect(copiedText).toContain('KARA');

    expect(screen.getByText(/Skopiowano do schowka!/)).toBeInTheDocument();
  });

  it('Feature 9: Spotify Wrapped stories cycle through slides properly', () => {
    render(
      <Leaderboard
        users={mockUsers}
        thisWeekWorkouts={mockThisWeekWorkouts}
        currentUser={mockUsers[0]}
        onSelectUser={vi.fn()}
      />
    );

    // Open Wrapped modal
    const wrappedBanner = screen.getByText('Miesięczne Podsumowanie Ekipy');
    fireEvent.click(wrappedBanner);

    // Slide 0: Dzik Miesiąca
    expect(screen.getByText(/DZIK MIESIĄCA/)).toBeInTheDocument();

    // Next slide -> Slide 1: Król Kanapy
    const nextBtn1 = screen.getByText('Dalej ➔');
    fireEvent.click(nextBtn1);
    expect(screen.getByText(/KRÓL KANAPY/)).toBeInTheDocument();

    // Next slide -> Slide 2: Wynik Ekipy
    const nextBtn2 = screen.getByText('Dalej ➔');
    fireEvent.click(nextBtn2);
    expect(screen.getByText(/WSPÓLNY WYNIK/)).toBeInTheDocument();

    // Final button: closes modal
    const finishBtn = screen.getByText('Idź na trening! 🏋️');
    fireEvent.click(finishBtn);
    expect(screen.queryByText(/WSPÓLNY WYNIK/)).not.toBeInTheDocument();
  });
});
