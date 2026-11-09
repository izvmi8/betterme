import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LoginModal } from './LoginModal';
import { User } from '../types';

const mockUsers: User[] = [
  {
    id: 'u1',
    name: 'Filip',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    pin: '1234',
    currentStreak: 4,
    allTimeWorkouts: 42,
    allTimeMinutes: 2100,
    longestStreak: 8,
  },
  {
    id: 'u2',
    name: 'Marek',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    pin: '2222',
    currentStreak: 2,
    allTimeWorkouts: 15,
    allTimeMinutes: 800,
    longestStreak: 3,
  },
];

describe('LoginModal Component', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <LoginModal
        users={mockUsers}
        currentUserId="u1"
        isOpen={false}
        onClose={vi.fn()}
        onSelectUser={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders user list and allows logging in with correct PIN', () => {
    const handleSelectUser = vi.fn();
    const handleClose = vi.fn();

    render(
      <LoginModal
        users={mockUsers}
        currentUserId="u1"
        isOpen={true}
        onClose={handleClose}
        onSelectUser={handleSelectUser}
      />
    );

    expect(screen.getByText('Wybierz profil')).toBeInTheDocument();
    expect(screen.getByText('Marek')).toBeInTheDocument();

    // Click on Marek
    fireEvent.click(screen.getByText('Marek'));

    // Should ask for PIN
    expect(screen.getByText('4-cyfrowy PIN')).toBeInTheDocument();

    // Enter correct PIN
    const pinInput = screen.getByPlaceholderText('••••');
    fireEvent.change(pinInput, { target: { value: '2222' } });

    fireEvent.click(screen.getByText('Zaloguj na tym telefonie'));

    expect(handleSelectUser).toHaveBeenCalledWith('u2');
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('displays error on incorrect PIN', () => {
    render(
      <LoginModal
        users={mockUsers}
        currentUserId="u1"
        isOpen={true}
        onClose={vi.fn()}
        onSelectUser={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('Marek'));

    const pinInput = screen.getByPlaceholderText('••••');
    fireEvent.change(pinInput, { target: { value: '9999' } });

    fireEvent.click(screen.getByText('Zaloguj na tym telefonie'));

    expect(screen.getByText(/Błędny PIN/)).toBeInTheDocument();
  });

  it('allows creating a new custom profile without preset styles', () => {
    const handleCreateUser = vi.fn();

    render(
      <LoginModal
        users={mockUsers}
        currentUserId="u1"
        isOpen={true}
        onClose={vi.fn()}
        onSelectUser={vi.fn()}
        onCreateUser={handleCreateUser}
      />
    );

    // Click "+ Nowy profil"
    fireEvent.click(screen.getByText('+ Nowy profil'));

    expect(screen.getByText('Stwórz swój profil')).toBeInTheDocument();

    // Name and PIN inputs
    const nameInput = screen.getByPlaceholderText('np. Tomek, Marek, Filip');
    fireEvent.change(nameInput, { target: { value: 'Kamil' } });

    const pinInput = screen.getByPlaceholderText('1234');
    fireEvent.change(pinInput, { target: { value: '5555' } });

    fireEvent.click(screen.getByText('Dołącz do ekipy BeMe 🔥'));

    expect(handleCreateUser).toHaveBeenCalledWith(
      'Kamil',
      '5555',
      expect.stringContaining('http')
    );
  });
});
