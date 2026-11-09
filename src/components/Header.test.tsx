import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from './Header';
import { User } from '../types';

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

describe('Header Component', () => {
  it('renders BeMe logo and current streak badge', () => {
    render(
      <Header currentUser={mockUser} thisWeekCount={1} onOpenSwitchUser={vi.fn()} />
    );

    expect(screen.getByText('Be')).toBeInTheDocument();
    expect(screen.getByText('Me')).toBeInTheDocument();
    expect(screen.getByText('4w')).toBeInTheDocument();
  });

  it('Feature 3: displays ZAGROŻONA badge when goal is not met and streak > 0', () => {
    render(
      <Header currentUser={mockUser} thisWeekCount={1} onOpenSwitchUser={vi.fn()} />
    );

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('/3')).toBeInTheDocument();
    expect(screen.getByText('ZAGROŻONA')).toBeInTheDocument();
    expect(screen.queryByText('CEL')).not.toBeInTheDocument();
  });

  it('displays CEL badge when weekly goal of 3 workouts is achieved', () => {
    render(
      <Header currentUser={mockUser} thisWeekCount={3} onOpenSwitchUser={vi.fn()} />
    );

    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('CEL')).toBeInTheDocument();
    expect(screen.queryByText('ZAGROŻONA')).not.toBeInTheDocument();
  });

  it('opens profile switcher when clicking user avatar', () => {
    const handleOpenSwitch = vi.fn();
    render(
      <Header currentUser={mockUser} thisWeekCount={2} onOpenSwitchUser={handleOpenSwitch} />
    );

    const avatarButton = screen.getByTitle('Kliknij, aby przełączyć profil');
    fireEvent.click(avatarButton);
    expect(handleOpenSwitch).toHaveBeenCalledTimes(1);
  });
});
