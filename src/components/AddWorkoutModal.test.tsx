import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AddWorkoutModal } from './AddWorkoutModal';
import { User } from '../types';

const mockCurrentUser: User = {
  id: 'u1',
  name: 'Filip',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  pin: '1234',
  currentStreak: 4,
  allTimeWorkouts: 42,
  allTimeMinutes: 2100,
  longestStreak: 8,
};

const mockUsers: User[] = [
  mockCurrentUser,
  {
    id: 'u2',
    name: 'Tomek',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    pin: '1111',
    currentStreak: 1,
    allTimeWorkouts: 19,
    allTimeMinutes: 980,
    longestStreak: 2,
  },
  {
    id: 'u3',
    name: 'Marek',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    pin: '2222',
    currentStreak: 5,
    allTimeWorkouts: 58,
    allTimeMinutes: 3740,
    longestStreak: 8,
  },
];

describe('AddWorkoutModal Component', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <AddWorkoutModal
        currentUser={mockCurrentUser}
        users={mockUsers}
        isOpen={false}
        onClose={vi.fn()}
        onSaveWorkout={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders viewfinder with smile header and dual-snap button when isOpen is true', () => {
    render(
      <AddWorkoutModal
        currentUser={mockCurrentUser}
        users={mockUsers}
        isOpen={true}
        onClose={vi.fn()}
        onSaveWorkout={vi.fn()}
      />
    );

    expect(screen.getByText('UŚMIECHNIJ SIĘ')).toBeInTheDocument();
    expect(screen.getByText(/1 KLIK = ZDJĘCIE Z OBU STRON/)).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <AddWorkoutModal
        currentUser={mockCurrentUser}
        users={mockUsers}
        isOpen={true}
        onClose={handleClose}
        onSaveWorkout={vi.fn()}
      />
    );

    const closeButtons = screen.getAllByRole('button');
    fireEvent.click(closeButtons[0]); // top close button
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
