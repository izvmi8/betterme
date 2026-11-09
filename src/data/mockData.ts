import { User, Workout } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'u1',
    name: 'Filip',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    pin: '1234',
    currentStreak: 4,
    allTimeWorkouts: 42,
    allTimeMinutes: 2520,
    longestStreak: 6,
  },
];

const now = new Date();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600 * 1000).toISOString();
const daysAgo = (d: number, h = 18) => {
  const dt = new Date(now.getTime() - d * 24 * 3600 * 1000);
  dt.setHours(h, 30, 0, 0);
  return dt.toISOString();
};

export const INITIAL_WORKOUTS: Workout[] = [
  {
    id: 'w1',
    userId: 'u1',
    userName: 'Filip',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    sportType: 'gym',
    sportTitle: 'Siłownia • Push Day',
    durationMinutes: 65,
    photoUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
    selfieUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    notes: 'Klatka + barki, rekord na ławce pobity o 2.5 kg! 🔥 Kto dzisiaj idzie?',
    createdAt: hoursAgo(2),
    reactions: [],
    comments: [],
  },
  {
    id: 'w3',
    userId: 'u1',
    userName: 'Filip',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    sportType: 'squash',
    sportTitle: 'Squash • Mecz ligowy',
    durationMinutes: 50,
    photoUrl: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&q=80',
    selfieUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    notes: 'Tętno 175 średnie, płuca wyplute ale 3:1 wygrane 🎾',
    createdAt: daysAgo(1, 19),
    reactions: [],
    comments: [],
  },
];
