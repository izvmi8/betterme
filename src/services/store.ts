import { User, Workout, PushNotification, Comment } from '../types';
import { INITIAL_USERS, INITIAL_WORKOUTS } from '../data/mockData';

const USERS_KEY = 'betterme_users_v2';
const WORKOUTS_KEY = 'betterme_workouts_v2';
const CURRENT_USER_ID_KEY = 'betterme_current_user_id';

type Listener = () => void;
type NotificationListener = (notification: PushNotification) => void;

class Store {
  private listeners: Listener[] = [];
  private notificationListeners: NotificationListener[] = [];

  constructor() {
    this.init();
  }

  private init() {
    if (!localStorage.getItem(USERS_KEY)) {
      localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
    }
    if (!localStorage.getItem(WORKOUTS_KEY)) {
      localStorage.setItem(WORKOUTS_KEY, JSON.stringify(INITIAL_WORKOUTS));
    }
    if (!localStorage.getItem(CURRENT_USER_ID_KEY)) {
      localStorage.setItem(CURRENT_USER_ID_KEY, 'u1'); // Default to Filip
    }
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public subscribeNotifications(listener: NotificationListener): () => void {
    this.notificationListeners.push(listener);
    return () => {
      this.notificationListeners = this.notificationListeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public triggerPush(notification: PushNotification) {
    this.notificationListeners.forEach((l) => l(notification));
  }

  // Users
  public getUsers(): User[] {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : INITIAL_USERS;
  }

  public getCurrentUser(): User {
    const users = this.getUsers();
    const id = localStorage.getItem(CURRENT_USER_ID_KEY) || 'u1';
    return users.find((u) => u.id === id) || users[0];
  }

  public setCurrentUser(userId: string): void {
    localStorage.setItem(CURRENT_USER_ID_KEY, userId);
    this.notify();
  }

  // Workouts
  public getWorkouts(): Workout[] {
    const data = localStorage.getItem(WORKOUTS_KEY);
    return data ? JSON.parse(data) : INITIAL_WORKOUTS;
  }

  public getThisWeekWorkouts(): Workout[] {
    const all = this.getWorkouts();
    const now = new Date();
    const day = now.getDay();
    const diffToMonday = (day === 0 ? -6 : 1) - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    return all.filter((w) => new Date(w.createdAt) >= monday);
  }

  public getUserWorkouts(userId: string): Workout[] {
    // Return workouts authored by or tagged with this user
    return this.getWorkouts().filter(
      (w) => w.userId === userId || w.taggedUserIds?.includes(userId)
    );
  }

  public addWorkout(workoutData: Omit<Workout, 'id' | 'createdAt' | 'reactions' | 'comments'>): Workout {
    const currentUser = this.getCurrentUser();
    const newWorkout: Workout = {
      ...workoutData,
      id: 'w_' + Date.now(),
      createdAt: new Date().toISOString(),
      reactions: [],
      comments: [],
    };

    const workouts = [newWorkout, ...this.getWorkouts()];
    localStorage.setItem(WORKOUTS_KEY, JSON.stringify(workouts));

    // Update user stats for author AND all tagged buddies!
    const usersToCredit = [currentUser.id, ...(workoutData.taggedUserIds || [])];
    const users = this.getUsers().map((u) => {
      if (usersToCredit.includes(u.id)) {
        return {
          ...u,
          allTimeWorkouts: u.allTimeWorkouts + 1,
        };
      }
      return u;
    });
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    const taggedText = workoutData.taggedUserNames?.length
      ? ` razem z ${workoutData.taggedUserNames.join(', ')}`
      : '';

    this.triggerPush({
      id: 'push_' + Date.now(),
      title: `${currentUser.name}${taggedText} wrzucił trening! 🔥`,
      body: `${workoutData.sportTitle}. Wejdź i zostaw ogień!`,
      time: 'Teraz',
      icon: currentUser.avatar,
    });

    this.notify();
    return newWorkout;
  }

  public toggleReaction(workoutId: string, emoji: string): void {
    const currentUser = this.getCurrentUser();
    const workouts = this.getWorkouts().map((w) => {
      if (w.id !== workoutId) return w;

      const existingReactionIndex = w.reactions.findIndex((r) => r.emoji === emoji);
      let updatedReactions = [...w.reactions];

      if (existingReactionIndex > -1) {
        const reaction = updatedReactions[existingReactionIndex];
        const userHasReacted = reaction.userIds.includes(currentUser.id);

        if (userHasReacted) {
          const newUserIds = reaction.userIds.filter((id) => id !== currentUser.id);
          if (newUserIds.length === 0) {
            updatedReactions.splice(existingReactionIndex, 1);
          } else {
            updatedReactions[existingReactionIndex] = { ...reaction, userIds: newUserIds };
          }
        } else {
          updatedReactions[existingReactionIndex] = {
            ...reaction,
            userIds: [...reaction.userIds, currentUser.id],
          };
        }
      } else {
        updatedReactions.push({ emoji, userIds: [currentUser.id] });
      }

      return { ...w, reactions: updatedReactions };
    });

    localStorage.setItem(WORKOUTS_KEY, JSON.stringify(workouts));
    this.notify();
  }

  public addComment(workoutId: string, text: string): void {
    const currentUser = this.getCurrentUser();
    const newComment: Comment = {
      id: 'c_' + Date.now(),
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };

    const workouts = this.getWorkouts().map((w) => {
      if (w.id === workoutId) {
        return {
          ...w,
          comments: [...(w.comments || []), newComment],
        };
      }
      return w;
    });

    localStorage.setItem(WORKOUTS_KEY, JSON.stringify(workouts));
    this.notify();
  }

  public addAudioComment(workoutId: string, audioUrl: string, audioDuration: number): void {
    const currentUser = this.getCurrentUser();
    const newComment: Comment = {
      id: 'c_' + Date.now(),
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      audioUrl,
      audioDuration,
      createdAt: new Date().toISOString(),
    };

    const workouts = this.getWorkouts().map((w) => {
      if (w.id === workoutId) {
        return {
          ...w,
          comments: [...(w.comments || []), newComment],
        };
      }
      return w;
    });

    localStorage.setItem(WORKOUTS_KEY, JSON.stringify(workouts));
    this.notify();
  }

  // Feature 1: Pogań lenia (Nudge)
  public nudgeUser(targetUserId: string): void {
    const currentUser = this.getCurrentUser();
    const targetUser = this.getUsers().find((u) => u.id === targetUserId);
    if (!targetUser) return;

    this.triggerPush({
      id: 'nudge_' + Date.now(),
      title: `📢 ${currentUser.name} kopnął ${targetUser.name} w tyłek!`,
      body: `„Ruszaj na trening, bo w niedzielę stawiasz pizzę całej ekipie 🍕!”`,
      time: 'Teraz',
      icon: currentUser.avatar,
    });
  }
}

export const store = new Store();
