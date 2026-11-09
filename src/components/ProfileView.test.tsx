import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProfileView } from './ProfileView';
import { User, Workout } from '../types';

const mockUser: User = {
  id: 'u1',
  name: 'Filip',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  pin: '1234',
  currentStreak: 4,
  allTimeWorkouts: 42,
  allTimeMinutes: 2100,
  longestStreak: 8,
};

const mockWorkouts: Workout[] = [
  {
    id: 'w1',
    userId: 'u1',
    userName: 'Filip',
    userAvatar: mockUser.avatar,
    sportType: 'gym',
    sportTitle: 'Siłownia • Push Day',
    durationMinutes: 60,
    photoUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400',
    selfieUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    notes: 'Klatka zrobiona',
    createdAt: new Date().toISOString(),
    reactions: [],
    comments: [],
  },
];

describe('ProfileView Component', () => {
  it('renders user name, streak, stats and archive', () => {
    render(
      <ProfileView
        user={mockUser}
        workouts={mockWorkouts}
        isCurrentLoggedUser={true}
      />
    );

    expect(screen.getByText('Filip')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getAllByText('4w').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('8w')).toBeInTheDocument();
    expect(screen.getByText('Archiwum BeMe (1)')).toBeInTheDocument();
    expect(screen.getByText('Siłownia • Push Day')).toBeInTheDocument();
  });

  it('opens edit profile modal when clicking "Edytuj profil"', () => {
    render(
      <ProfileView
        user={mockUser}
        workouts={mockWorkouts}
        isCurrentLoggedUser={true}
      />
    );

    const editBtn = screen.getByText('Edytuj profil');
    fireEvent.click(editBtn);

    // Modal should now be open
    expect(screen.getByPlaceholderText('np. Filip')).toBeInTheDocument();
  });
});
