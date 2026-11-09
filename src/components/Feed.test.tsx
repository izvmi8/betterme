import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Feed } from './Feed';
import { Workout, User } from '../types';

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

const mockWorkouts: Workout[] = [
  {
    id: 'w_test_1',
    userId: 'u1',
    userName: 'Filip',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    sportType: 'gym',
    sportTitle: 'Siłownia • Trening siłowy',
    durationMinutes: 0,
    photoUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800',
    selfieUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    notes: 'Klata i triceps zrobione',
    createdAt: new Date().toISOString(),
    reactions: [{ emoji: '🔥', userIds: ['u1'] }],
    comments: [
      {
        id: 'c1',
        userId: 'u2',
        userName: 'Marek',
        userAvatar: '',
        text: 'Dobra robota!',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'c2',
        userId: 'u3',
        userName: 'Wiktor',
        userAvatar: '',
        audioUrl: 'data:audio/webm;base64,mockaudio',
        audioDuration: 4,
        createdAt: new Date().toISOString(),
      },
    ],
    taggedUserIds: ['u2'],
    taggedUserNames: ['Marek'],
  },
];

describe('Feed Component - Fullscreen Snap & Interactivity', () => {
  it('renders empty feed state when workouts list is empty', () => {
    const handleOpenAdd = vi.fn();
    render(
      <Feed
        workouts={[]}
        currentUser={mockCurrentUser}
        onToggleReaction={vi.fn()}
        onAddComment={vi.fn()}
        onAddAudioComment={vi.fn()}
        onSelectUser={vi.fn()}
        onOpenAddModal={handleOpenAdd}
        onVisibleAuthorChange={vi.fn()}
      />
    );

    expect(screen.getByText('Pusto na tablicy')).toBeInTheDocument();
    const addBtn = screen.getByText('Dodaj trening');
    fireEvent.click(addBtn);
    expect(handleOpenAdd).toHaveBeenCalledTimes(1);
  });

  it('Feature 5: renders workout post with tagged gym buddy', () => {
    const handleSelectUser = vi.fn();
    render(
      <Feed
        workouts={mockWorkouts}
        currentUser={mockCurrentUser}
        onToggleReaction={vi.fn()}
        onAddComment={vi.fn()}
        onAddAudioComment={vi.fn()}
        onSelectUser={handleSelectUser}
        onOpenAddModal={vi.fn()}
        onVisibleAuthorChange={vi.fn()}
      />
    );

    expect(screen.getByText('@Filip')).toBeInTheDocument();
    expect(screen.getByText('Siłownia • Trening siłowy')).toBeInTheDocument();
    expect(screen.getByText('Klata i triceps zrobione')).toBeInTheDocument();

    // Tagged buddy rendering
    expect(screen.getByText('z')).toBeInTheDocument();
    const taggedBuddy = screen.getByText('@Marek');
    expect(taggedBuddy).toBeInTheDocument();

    fireEvent.click(taggedBuddy);
    expect(handleSelectUser).toHaveBeenCalledWith('u2');
  });

  it('Feature 6: opens comments drawer with text comments and audio voice notes', () => {
    const handleAddComment = vi.fn();
    render(
      <Feed
        workouts={mockWorkouts}
        currentUser={mockCurrentUser}
        onToggleReaction={vi.fn()}
        onAddComment={handleAddComment}
        onAddAudioComment={vi.fn()}
        onSelectUser={vi.fn()}
        onOpenAddModal={vi.fn()}
        onVisibleAuthorChange={vi.fn()}
      />
    );

    // Open comments drawer
    const commentsBtn = screen.getByText('2');
    fireEvent.click(commentsBtn);

    expect(screen.getByText('Komentarze (2)')).toBeInTheDocument();
    expect(screen.getByText('Dobra robota!')).toBeInTheDocument();

    // Voice note comment verification
    expect(screen.getByText(/0:04/)).toBeInTheDocument();

    // Send new text comment
    const input = screen.getByPlaceholderText('Napisz lub nagraj komentarz...');
    fireEvent.change(input, { target: { value: 'Mój nowy komentarz' } });

    fireEvent.submit(input.closest('form')!);

    expect(handleAddComment).toHaveBeenCalledWith('w_test_1', 'Mój nowy komentarz');
  });

  it('swaps main and corner photos on single tap and uses 3:4 aspect ratio', async () => {
    vi.useFakeTimers();

    render(
      <Feed
        workouts={mockWorkouts}
        currentUser={mockCurrentUser}
        onToggleReaction={vi.fn()}
        onAddComment={vi.fn()}
        onAddAudioComment={vi.fn()}
        onSelectUser={vi.fn()}
        onOpenAddModal={vi.fn()}
        onVisibleAuthorChange={vi.fn()}
      />
    );

    // Initial state: main image is photoUrl
    const card = screen.getByAltText('Siłownia • Trening siłowy');
    expect(card).toHaveAttribute('src', mockWorkouts[0].photoUrl);

    // Verify 3:4 aspect ratio container
    const aspectContainer = card.closest('.aspect-\\[3\\/4\\]');
    expect(aspectContainer).toBeInTheDocument();

    // Single tap on the screen/card
    const slide = screen.getByText('@Filip').closest('[data-workout-id]')!;
    fireEvent.click(slide);

    // Fast-forward past the 260ms single-tap timer wrapped in act
    act(() => {
      vi.advanceTimersByTime(350);
    });

    // Main image is now swapped to selfieUrl!
    expect(card).toHaveAttribute('src', mockWorkouts[0].selfieUrl);

    vi.useRealTimers();
  });
});
