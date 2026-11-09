import { describe, it, expect, beforeEach, vi } from 'vitest';
import { store } from './store';
import { INITIAL_USERS } from '../data/mockData';

describe('Store Service - Core Logic & Gamification', () => {
  beforeEach(() => {
    localStorage.clear();
    // Re-initialize store with clean localStorage
    (store as any).init();
  });

  it('initializes with default users and workouts', () => {
    const users = store.getUsers();
    expect(users.length).toBe(INITIAL_USERS.length);
    expect(users[0].name).toBe('Filip');

    const currentUser = store.getCurrentUser();
    expect(currentUser.id).toBe('u1');
    expect(currentUser.name).toBe('Filip');

    const workouts = store.getWorkouts();
    expect(workouts.length).toBeGreaterThan(0);
  });

  it('creates and switches to a new user profile', () => {
    const newUser = store.createUser('Tomek', '1111', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150');
    expect(newUser.id).toBeDefined();
    expect(newUser.name).toBe('Tomek');

    const currentUser = store.getCurrentUser();
    expect(currentUser.id).toBe(newUser.id);
    expect(currentUser.name).toBe('Tomek');
  });

  it('updates user profile name, avatar and PIN', () => {
    const updated = store.updateUser('u1', { name: 'Filip Szef', pin: '9999' });
    expect(updated.name).toBe('Filip Szef');
    expect(updated.pin).toBe('9999');

    expect(store.getUsers().find(u => u.id === 'u1')?.name).toBe('Filip Szef');
  });

  it('adds a workout and increments author workout count', () => {
    const authorBefore = store.getCurrentUser();
    const workoutsCountBefore = store.getWorkouts().length;

    const newWorkout = store.addWorkout({
      userId: authorBefore.id,
      userName: authorBefore.name,
      userAvatar: authorBefore.avatar,
      sportType: 'gym',
      sportTitle: 'Siłownia • Trening siłowy',
      durationMinutes: 0,
      photoUrl: 'data:image/jpeg;base64,mockback',
      selfieUrl: 'data:image/jpeg;base64,mockfront',
      notes: 'Mocna klata',
    });

    expect(newWorkout.id).toBeDefined();
    expect(store.getWorkouts().length).toBe(workoutsCountBefore + 1);

    const authorAfter = store.getCurrentUser();
    expect(authorAfter.allTimeWorkouts).toBe(authorBefore.allTimeWorkouts + 1);
  });

  it('Feature 5: credits both author AND tagged gym buddies on joint workout', () => {
    const author = store.getUsers().find((u) => u.id === 'u1')!;
    const buddy = store.createUser('Marek', '2222', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150');

    const authorWorkoutsBefore = author.allTimeWorkouts;
    const buddyWorkoutsBefore = buddy.allTimeWorkouts;

    store.setCurrentUser('u1');
    store.addWorkout({
      userId: 'u1',
      userName: 'Filip',
      userAvatar: author.avatar,
      sportType: 'gym',
      sportTitle: 'Wspólny trening',
      durationMinutes: 0,
      photoUrl: 'data:image/jpeg;base64,mockback',
      notes: 'Z Markiem na siłce',
      taggedUserIds: [buddy.id],
      taggedUserNames: ['Marek'],
    });

    const authorAfter = store.getUsers().find((u) => u.id === 'u1')!;
    const buddyAfter = store.getUsers().find((u) => u.id === buddy.id)!;

    expect(authorAfter.allTimeWorkouts).toBe(authorWorkoutsBefore + 1);
    expect(buddyAfter.allTimeWorkouts).toBe(buddyWorkoutsBefore + 1);
  });

  it('toggles reaction on workout correctly', () => {
    const firstWorkout = store.getWorkouts()[0];
    const initialFlameCount =
      firstWorkout.reactions.find((r) => r.emoji === '🔥')?.userIds.length || 0;

    // Toggle ON
    store.toggleReaction(firstWorkout.id, '🔥');
    const updatedWorkout1 = store.getWorkouts().find((w) => w.id === firstWorkout.id)!;
    const flameCountAfter1 =
      updatedWorkout1.reactions.find((r) => r.emoji === '🔥')?.userIds.length || 0;
    expect(flameCountAfter1).toBe(initialFlameCount + 1);

    // Toggle OFF
    store.toggleReaction(firstWorkout.id, '🔥');
    const updatedWorkout2 = store.getWorkouts().find((w) => w.id === firstWorkout.id)!;
    const flameCountAfter2 =
      updatedWorkout2.reactions.find((r) => r.emoji === '🔥')?.userIds.length || 0;
    expect(flameCountAfter2).toBe(initialFlameCount);
  });

  it('adds text comment to workout', () => {
    const firstWorkout = store.getWorkouts()[0];
    const commentsCountBefore = firstWorkout.comments?.length || 0;

    store.addComment(firstWorkout.id, 'Świetna forma dziku!');

    const updatedWorkout = store.getWorkouts().find((w) => w.id === firstWorkout.id)!;
    expect(updatedWorkout.comments.length).toBe(commentsCountBefore + 1);
    expect(updatedWorkout.comments[updatedWorkout.comments.length - 1].text).toBe(
      'Świetna forma dziku!'
    );
  });

  it('Feature 6: adds audio voice note comment to workout', () => {
    const firstWorkout = store.getWorkouts()[0];
    const commentsCountBefore = firstWorkout.comments?.length || 0;

    store.addAudioComment(firstWorkout.id, 'data:audio/webm;base64,mockaudio', 5);

    const updatedWorkout = store.getWorkouts().find((w) => w.id === firstWorkout.id)!;
    expect(updatedWorkout.comments.length).toBe(commentsCountBefore + 1);
    const audioComment = updatedWorkout.comments[updatedWorkout.comments.length - 1];
    expect(audioComment.audioUrl).toBe('data:audio/webm;base64,mockaudio');
    expect(audioComment.audioDuration).toBe(5);
  });

  it('Feature 1: nudgeUser triggers push notification targeting slacker with pizza penalty', () => {
    const pushListener = vi.fn();
    const unsubscribe = store.subscribeNotifications(pushListener);

    const tomek = store.createUser('Tomek', '1111', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150');
    store.setCurrentUser('u1'); // Filip
    store.nudgeUser(tomek.id); // Tomek

    expect(pushListener).toHaveBeenCalledTimes(1);
    const notification = pushListener.mock.calls[0][0];
    expect(notification.title).toContain('Filip kopnął Tomek w tyłek');
    expect(notification.body).toContain('stawiasz pizzę');

    unsubscribe();
  });
});
