export type SportType = 'gym' | 'running' | 'cycling' | 'squash' | 'swimming' | 'home' | 'other';

export interface User {
  id: string;
  name: string;
  avatar: string;
  pin: string;
  currentStreak: number; // in weeks with 3+ workouts
  allTimeWorkouts: number;
  allTimeMinutes: number;
  longestStreak: number;
}

export interface WorkoutReaction {
  emoji: string;
  userIds: string[];
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text?: string;
  audioUrl?: string; // Voice note
  audioDuration?: number;
  createdAt: string;
}

export interface Workout {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  sportType: SportType;
  sportTitle: string;
  durationMinutes: number;
  photoUrl: string; // main camera
  selfieUrl?: string; // front camera
  notes?: string;
  createdAt: string; // ISO string
  reactions: WorkoutReaction[];
  comments: Comment[];
  taggedUserIds?: string[]; // Gym Buddy tagging
  taggedUserNames?: string[];
}

export interface PushNotification {
  id: string;
  title: string;
  body: string;
  time: string;
  icon?: string;
}
