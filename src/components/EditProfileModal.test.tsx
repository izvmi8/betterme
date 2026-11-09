import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EditProfileModal } from './EditProfileModal';
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

describe('EditProfileModal Component', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <EditProfileModal
        user={mockUser}
        isOpen={false}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders current profile information and saves changes', () => {
    const handleSave = vi.fn();
    const handleClose = vi.fn();

    render(
      <EditProfileModal
        user={mockUser}
        isOpen={true}
        onClose={handleClose}
        onSave={handleSave}
      />
    );

    expect(screen.getByText('Edytuj profil')).toBeInTheDocument();

    const nameInput = screen.getByPlaceholderText('np. Filip');
    expect(nameInput).toHaveValue('Filip');

    fireEvent.change(nameInput, { target: { value: 'Filip Dzik' } });

    const pinInput = screen.getByPlaceholderText('1234');
    fireEvent.change(pinInput, { target: { value: '9876' } });

    fireEvent.click(screen.getByText('Zapisz profil'));

    expect(handleSave).toHaveBeenCalledWith({
      name: 'Filip Dzik',
      pin: '9876',
      avatar: mockUser.avatar,
    });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
