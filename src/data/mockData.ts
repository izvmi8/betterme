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
  {
    id: 'u2',
    name: 'Tomek',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
    pin: '1111',
    currentStreak: 1,
    allTimeWorkouts: 19,
    allTimeMinutes: 980,
    longestStreak: 2,
  },
  {
    id: 'u3',
    name: 'Marek',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
    pin: '2222',
    currentStreak: 5,
    allTimeWorkouts: 58,
    allTimeMinutes: 3740,
    longestStreak: 8,
  },
  {
    id: 'u4',
    name: 'Wiktor',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=250&q=80',
    pin: '3333',
    currentStreak: 0,
    allTimeWorkouts: 11,
    allTimeMinutes: 490,
    longestStreak: 1,
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
    reactions: [
      { emoji: '🔥', userIds: ['u3', 'u2'] },
    ],
    comments: [
      {
        id: 'c1',
        userId: 'u3',
        userName: 'Marek',
        userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
        text: 'Dobra forma byku, ile poszło w serii?',
        createdAt: hoursAgo(1),
      },
      {
        id: 'c2',
        userId: 'u2',
        userName: 'Tomek',
        userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
        text: 'Jutro lecimy razem!',
        createdAt: hoursAgo(1),
      },
    ],
  },
  {
    id: 'w2',
    userId: 'u3',
    userName: 'Marek',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
    sportType: 'running',
    sportTitle: 'Bieganie • Park i bulwary',
    durationMinutes: 42,
    photoUrl: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=800&q=80',
    selfieUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    notes: 'Szybka 8-ka z rana w deszczu, nie ma wymówek 🌧️👟',
    createdAt: hoursAgo(7),
    reactions: [
      { emoji: '🔥', userIds: ['u1'] },
    ],
    comments: [
      {
        id: 'c3',
        userId: 'u1',
        userName: 'Filip',
        userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
        text: 'Szacun za wyjście w taką ulewę 🏃‍♂️',
        createdAt: hoursAgo(5),
      },
    ],
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
    reactions: [
      { emoji: '🔥', userIds: ['u2', 'u3'] },
    ],
    comments: [],
  },
  {
    id: 'w4',
    userId: 'u3',
    userName: 'Marek',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
    sportType: 'gym',
    sportTitle: 'Siłownia • Martwe ciągi',
    durationMinutes: 75,
    photoUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
    selfieUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    notes: 'Leg day zrobiony, jutro nie wstaję z łóżka',
    createdAt: daysAgo(2, 20),
    reactions: [
      { emoji: '🔥', userIds: ['u1', 'u2'] },
    ],
    comments: [],
  },
  {
    id: 'w5',
    userId: 'u2',
    userName: 'Tomek',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
    sportType: 'cycling',
    sportTitle: 'Rower • Pętla za miasto',
    durationMinutes: 60,
    photoUrl: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80',
    selfieUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    notes: 'Pierwszy trening w tym tygodniu, walczę żeby zejść z tablicy wstydu!',
    createdAt: daysAgo(2, 17),
    reactions: [
      { emoji: '🔥', userIds: ['u1', 'u3'] },
    ],
    comments: [],
  },
];
