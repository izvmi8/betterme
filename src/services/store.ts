import { User, Workout, PushNotification, Comment } from '../types';
import { INITIAL_USERS, INITIAL_WORKOUTS } from '../data/mockData';
import { supabase, isSupabaseConfigured, uploadMedia } from './supabaseClient';
import { sendSystemNotification } from './notifications';

const USERS_KEY = 'beme_users_v4';
const WORKOUTS_KEY = 'beme_workouts_v4';
const CURRENT_USER_ID_KEY = 'beme_current_user_id';
const OFFLINE_QUEUE_KEY = 'beme_offline_queue';

type Listener = () => void;
type NotificationListener = (notification: PushNotification) => void;

class Store {
  private listeners: Listener[] = [];
  private notificationListeners: NotificationListener[] = [];
  private isSupabaseSyncing = false;

  constructor() {
    this.init();
    if (isSupabaseConfigured()) {
      this.initSupabase();
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.flushOfflineQueue();
      });
    }
  }

  private init() {
    // Wyczyść ewentualne stare klucze z mockami
    try {
      localStorage.removeItem('betterme_users_v2');
      localStorage.removeItem('betterme_workouts_v2');
    } catch {}

    const existingUsers = localStorage.getItem(USERS_KEY);
    if (!existingUsers) {
      localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
    } else {
      // Usuń legacy Tomek, Marek, Wiktor jeśli zostali zapisani wcześniej
      const parsed: User[] = JSON.parse(existingUsers);
      const cleaned = parsed.filter((u) => !['u2', 'u3', 'u4'].includes(u.id));
      if (cleaned.length === 0) {
        localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
      } else {
        localStorage.setItem(USERS_KEY, JSON.stringify(cleaned));
      }
    }

    const existingWorkouts = localStorage.getItem(WORKOUTS_KEY);
    if (!existingWorkouts) {
      localStorage.setItem(WORKOUTS_KEY, JSON.stringify(INITIAL_WORKOUTS));
    } else {
      const parsedW: Workout[] = JSON.parse(existingWorkouts);
      const cleanedW = parsedW.filter((w) => !['u2', 'u3', 'u4'].includes(w.userId));
      localStorage.setItem(WORKOUTS_KEY, JSON.stringify(cleanedW));
    }

    if (!localStorage.getItem(CURRENT_USER_ID_KEY)) {
      localStorage.setItem(CURRENT_USER_ID_KEY, 'u1'); // Domyślnie Filip
    }
  }

  // Synchronizacja z Supabase (Live Backend)
  private async initSupabase() {
    if (!supabase || !isSupabaseConfigured()) return;

    // Usuń z Supabase stare profile z poprzedniego seeda (Tomek, Marek, Wiktor)
    try {
      await supabase.from('users').delete().in('id', ['u2', 'u3', 'u4']);
      await supabase.from('workouts').delete().in('user_id', ['u2', 'u3', 'u4']);
    } catch (err) {
      // Ignoruj błąd jeśli tabele lub relacje były już wyczyszczone
    }

    await this.syncFromSupabase();

    // Nasłuchiwanie zmian Realtime
    try {
      supabase
        .channel('betterme_live')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'workouts' }, () => {
          this.syncFromSupabase();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'reactions' }, () => {
          this.syncFromSupabase();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => {
          this.syncFromSupabase();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
          this.syncFromSupabase();
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'nudges' }, (payload) => {
          const nudge = payload.new as any;
          const currentUserId = this.getCurrentUser().id;
          if (nudge.target_id === currentUserId) {
            const sender = this.getUsers().find((u) => u.id === nudge.sender_id);
            this.triggerPush({
              id: 'nudge_' + Date.now(),
              title: `📢 ${sender?.name || 'Kumpel'} kopnął Cię w tyłek!`,
              body: `„Ruszaj na trening, bo w niedzielę stawiasz pizzę całej ekipie 🍕!”`,
              time: 'Teraz',
              icon: sender?.avatar,
            });
          }
        })
        .subscribe();
    } catch (err) {
      console.warn('Realtime channel warning:', err);
    }
  }

  public async syncFromSupabase(): Promise<void> {
    if (!supabase || !isSupabaseConfigured() || this.isSupabaseSyncing) return;
    this.isSupabaseSyncing = true;

    try {
      // 1. Pobierz użytkowników
      const { data: dbUsers } = await supabase.from('users').select('*');
      if (dbUsers && dbUsers.length > 0) {
        const mappedUsers: User[] = dbUsers.map((u: any) => ({
          id: u.id,
          name: u.name,
          avatar: u.avatar,
          pin: u.pin || '1234',
          currentStreak: u.current_streak || 0,
          allTimeWorkouts: u.all_time_workouts || 0,
          allTimeMinutes: u.all_time_minutes || 0,
          longestStreak: u.longest_streak || 0,
        }));
        localStorage.setItem(USERS_KEY, JSON.stringify(mappedUsers));
      }

      // 2. Pobierz treningi z powiązanymi reakcjami i komentarzami
      const { data: dbWorkouts } = await supabase
        .from('workouts')
        .select('*')
        .order('created_at', { ascending: false });

      if (dbWorkouts) {
        const { data: dbReactions } = await supabase.from('reactions').select('*');
        const { data: dbComments } = await supabase
          .from('comments')
          .select('*')
          .order('created_at', { ascending: true });

        const mappedWorkouts: Workout[] = dbWorkouts.map((w: any) => {
          // Zgrupuj reakcje
          const workoutReactions = (dbReactions || [])
            .filter((r: any) => r.workout_id === w.id)
            .reduce((acc: any[], r: any) => {
              const existing = acc.find((item) => item.emoji === r.emoji);
              if (existing) {
                existing.userIds.push(r.user_id);
              } else {
                acc.push({ emoji: r.emoji, userIds: [r.user_id] });
              }
              return acc;
            }, []);

          // Zgrupuj komentarze
          const workoutComments: Comment[] = (dbComments || [])
            .filter((c: any) => c.workout_id === w.id)
            .map((c: any) => ({
              id: c.id,
              userId: c.user_id,
              userName: c.user_name,
              userAvatar: c.user_avatar,
              text: c.text || undefined,
              audioUrl: c.audio_url || undefined,
              audioDuration: c.audio_duration || undefined,
              createdAt: c.created_at,
            }));

          return {
            id: w.id,
            userId: w.user_id,
            userName: w.user_name,
            userAvatar: w.user_avatar,
            sportType: w.sport_type,
            sportTitle: w.sport_title,
            durationMinutes: w.duration_minutes || 0,
            photoUrl: w.photo_url,
            selfieUrl: w.selfie_url || undefined,
            notes: w.notes || undefined,
            taggedUserIds: w.tagged_user_ids || [],
            taggedUserNames: w.tagged_user_names || [],
            createdAt: w.created_at,
            reactions: workoutReactions,
            comments: workoutComments,
          };
        });

        localStorage.setItem(WORKOUTS_KEY, JSON.stringify(mappedWorkouts));
      }

      this.notify();
    } catch (err) {
      console.error('Błąd synchronizacji z Supabase:', err);
    } finally {
      this.isSupabaseSyncing = false;
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
    sendSystemNotification(notification.title, notification.body, notification.icon);
  }

  // Offline queue for gym basements with poor connectivity
  private queueOfflineWorkout(workout: Workout): void {
    try {
      const existing = localStorage.getItem(OFFLINE_QUEUE_KEY);
      const queue: Workout[] = existing ? JSON.parse(existing) : [];
      queue.push(workout);
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    } catch {
      // Ignore localStorage errors
    }
  }

  public async flushOfflineQueue(): Promise<void> {
    if (!supabase || !isSupabaseConfigured() || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      return;
    }

    try {
      const existing = localStorage.getItem(OFFLINE_QUEUE_KEY);
      if (!existing) return;

      const queue: Workout[] = JSON.parse(existing);
      if (queue.length === 0) return;

      const remaining: Workout[] = [];

      for (const w of queue) {
        try {
          let photoUrl = w.photoUrl;
          let selfieUrl = w.selfieUrl;

          if (photoUrl && photoUrl.startsWith('data:')) {
            photoUrl = await uploadMedia(photoUrl, `main_${w.id}.jpg`);
          }
          if (selfieUrl && selfieUrl.startsWith('data:')) {
            selfieUrl = await uploadMedia(selfieUrl, `selfie_${w.id}.jpg`);
          }

          await supabase.from('workouts').upsert({
            id: w.id,
            user_id: w.userId,
            user_name: w.userName,
            user_avatar: w.userAvatar,
            sport_type: w.sportType,
            sport_title: w.sportTitle,
            duration_minutes: w.durationMinutes || 0,
            photo_url: photoUrl,
            selfie_url: selfieUrl || null,
            notes: w.notes || null,
            tagged_user_ids: w.taggedUserIds || [],
            tagged_user_names: w.taggedUserNames || [],
            created_at: w.createdAt,
          });
        } catch {
          remaining.push(w);
        }
      }

      if (remaining.length === 0) {
        localStorage.removeItem(OFFLINE_QUEUE_KEY);
      } else {
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
      }
    } catch {
      // Ignore queue processing errors
    }
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

  public createUser(name: string, pin: string, avatar: string): User {
    const newUser: User = {
      id: 'u_' + Date.now(),
      name: name.trim(),
      pin: pin.trim() || '1234',
      avatar: avatar.trim(),
      currentStreak: 0,
      allTimeWorkouts: 0,
      allTimeMinutes: 0,
      longestStreak: 0,
    };

    const users = [...this.getUsers(), newUser];
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    localStorage.setItem(CURRENT_USER_ID_KEY, newUser.id);
    this.notify();

    if (supabase && isSupabaseConfigured()) {
      (async () => {
        try {
          let finalAvatar = newUser.avatar;
          if (finalAvatar.startsWith('data:')) {
            finalAvatar = await uploadMedia(finalAvatar, `avatar_${newUser.id}.jpg`);
          }
          await supabase.from('users').insert({
            id: newUser.id,
            name: newUser.name,
            avatar: finalAvatar,
            pin: newUser.pin,
            current_streak: 0,
            all_time_workouts: 0,
            all_time_minutes: 0,
            longest_streak: 0,
          });
        } catch (err) {
          console.error('Błąd zapisu użytkownika do Supabase:', err);
        }
      })();
    }

    return newUser;
  }

  public updateUser(
    userId: string,
    data: Partial<Pick<User, 'name' | 'pin' | 'avatar'>>
  ): User {
    const users = this.getUsers().map((u) => {
      if (u.id === userId) {
        return {
          ...u,
          name: data.name !== undefined && data.name.trim() !== '' ? data.name.trim() : u.name,
          pin: data.pin !== undefined && data.pin.trim() !== '' ? data.pin.trim() : u.pin,
          avatar: data.avatar !== undefined && data.avatar.trim() !== '' ? data.avatar : u.avatar,
        };
      }
      return u;
    });

    const updatedUser = users.find((u) => u.id === userId) || this.getCurrentUser();
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    // Zaktualizuj dane autora w jego dotychczasowych treningach
    const workouts = this.getWorkouts().map((w) => {
      if (w.userId === userId) {
        return {
          ...w,
          userName: updatedUser.name,
          userAvatar: updatedUser.avatar,
        };
      }
      return w;
    });
    localStorage.setItem(WORKOUTS_KEY, JSON.stringify(workouts));

    this.notify();

    if (supabase && isSupabaseConfigured()) {
      (async () => {
        try {
          let finalAvatar = data.avatar;
          if (finalAvatar && finalAvatar.startsWith('data:')) {
            finalAvatar = await uploadMedia(finalAvatar, `avatar_${userId}.jpg`);
          }
          const updates: any = {};
          if (data.name !== undefined && data.name.trim() !== '') updates.name = data.name.trim();
          if (data.pin !== undefined && data.pin.trim() !== '') updates.pin = data.pin.trim();
          if (finalAvatar !== undefined && finalAvatar.trim() !== '') updates.avatar = finalAvatar;

          await supabase.from('users').update(updates).eq('id', userId);

          if (data.name || finalAvatar) {
            const workoutUpdates: any = {};
            if (data.name) workoutUpdates.user_name = data.name.trim();
            if (finalAvatar) workoutUpdates.user_avatar = finalAvatar;
            await supabase.from('workouts').update(workoutUpdates).eq('user_id', userId);
          }
        } catch (err) {
          console.error('Błąd aktualizacji użytkownika w Supabase:', err);
        }
      })();
    }

    return updatedUser;
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
    return this.getWorkouts().filter(
      (w) => w.userId === userId || w.taggedUserIds?.includes(userId)
    );
  }

  public addWorkout(
    workoutData: Omit<Workout, 'id' | 'createdAt' | 'reactions' | 'comments'>
  ): Workout {
    const currentUser = this.getCurrentUser();
    const workoutId = 'w_' + Date.now();
    const createdAt = new Date().toISOString();

    const newWorkout: Workout = {
      ...workoutData,
      id: workoutId,
      createdAt,
      reactions: [],
      comments: [],
    };

    // 1. Optymistyczny zapis lokalny
    const workouts = [newWorkout, ...this.getWorkouts()];
    localStorage.setItem(WORKOUTS_KEY, JSON.stringify(workouts));

    // Aktualizacja statystyk lokalnie
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

    // 2. Asynchroniczny zapis w Supabase (jeśli skonfigurowany)
    if (supabase && isSupabaseConfigured()) {
      (async () => {
        try {
          // Upload zdjęć do Supabase Storage
          let photoUrl = workoutData.photoUrl;
          let selfieUrl = workoutData.selfieUrl;

          if (photoUrl.startsWith('data:')) {
            photoUrl = await uploadMedia(photoUrl, `main_${workoutId}.jpg`);
          }
          if (selfieUrl && selfieUrl.startsWith('data:')) {
            selfieUrl = await uploadMedia(selfieUrl, `selfie_${workoutId}.jpg`);
          }

          await supabase.from('workouts').insert({
            id: workoutId,
            user_id: currentUser.id,
            user_name: currentUser.name,
            user_avatar: currentUser.avatar,
            sport_type: workoutData.sportType,
            sport_title: workoutData.sportTitle,
            duration_minutes: workoutData.durationMinutes || 0,
            photo_url: photoUrl,
            selfie_url: selfieUrl || null,
            notes: workoutData.notes || null,
            tagged_user_ids: workoutData.taggedUserIds || [],
            tagged_user_names: workoutData.taggedUserNames || [],
            created_at: createdAt,
          });

          // Zaktualizuj statystyki użytkowników w bazie
          for (const uid of usersToCredit) {
            const userObj = users.find((u) => u.id === uid);
            if (userObj) {
              await supabase
                .from('users')
                .update({ all_time_workouts: userObj.allTimeWorkouts })
                .eq('id', uid);
            }
          }
        } catch (err) {
          console.error('Błąd zapisu treningu do Supabase (kolejkowanie offline):', err);
          this.queueOfflineWorkout(newWorkout);
        }
      })();
    } else if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.queueOfflineWorkout(newWorkout);
    }

    return newWorkout;
  }

  public toggleReaction(workoutId: string, emoji: string): void {
    const currentUser = this.getCurrentUser();
    let isAdding = true;

    const workouts = this.getWorkouts().map((w) => {
      if (w.id !== workoutId) return w;

      const existingReactionIndex = w.reactions.findIndex((r) => r.emoji === emoji);
      let updatedReactions = [...w.reactions];

      if (existingReactionIndex > -1) {
        const reaction = updatedReactions[existingReactionIndex];
        const userHasReacted = reaction.userIds.includes(currentUser.id);

        if (userHasReacted) {
          isAdding = false;
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

    // Asynchroniczny zapis w Supabase
    if (supabase && isSupabaseConfigured()) {
      (async () => {
        try {
          if (isAdding) {
            await supabase.from('reactions').insert({
              workout_id: workoutId,
              user_id: currentUser.id,
              emoji,
            });
          } else {
            await supabase
              .from('reactions')
              .delete()
              .eq('workout_id', workoutId)
              .eq('user_id', currentUser.id)
              .eq('emoji', emoji);
          }
        } catch (err) {
          console.error('Błąd aktualizacji reakcji w Supabase:', err);
        }
      })();
    }
  }

  public addComment(workoutId: string, text: string): void {
    const currentUser = this.getCurrentUser();
    const commentId = 'c_' + Date.now();
    const createdAt = new Date().toISOString();

    const newComment: Comment = {
      id: commentId,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      text: text.trim(),
      createdAt,
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

    // Asynchroniczny zapis w Supabase
    if (supabase && isSupabaseConfigured()) {
      (async () => {
        try {
          await supabase.from('comments').insert({
            id: commentId,
            workout_id: workoutId,
            user_id: currentUser.id,
            user_name: currentUser.name,
            user_avatar: currentUser.avatar,
            text: text.trim(),
            created_at: createdAt,
          });
        } catch (err) {
          console.error('Błąd zapisu komentarza do Supabase:', err);
        }
      })();
    }
  }

  public addAudioComment(workoutId: string, audioUrl: string, audioDuration: number): void {
    const currentUser = this.getCurrentUser();
    const commentId = 'c_' + Date.now();
    const createdAt = new Date().toISOString();

    const newComment: Comment = {
      id: commentId,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      audioUrl,
      audioDuration,
      createdAt,
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

    // Asynchroniczny zapis w Supabase
    if (supabase && isSupabaseConfigured()) {
      (async () => {
        try {
          let permanentAudioUrl = audioUrl;
          if (audioUrl.startsWith('data:') || audioUrl.startsWith('blob:')) {
            permanentAudioUrl = await uploadMedia(audioUrl, `audio_${commentId}.webm`, 'audio/webm');
          }

          await supabase.from('comments').insert({
            id: commentId,
            workout_id: workoutId,
            user_id: currentUser.id,
            user_name: currentUser.name,
            user_avatar: currentUser.avatar,
            audio_url: permanentAudioUrl,
            audio_duration: audioDuration,
            created_at: createdAt,
          });
        } catch (err) {
          console.error('Błąd zapisu komentarza audio do Supabase:', err);
        }
      })();
    }
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

    // Asynchroniczny zapis w Supabase
    if (supabase && isSupabaseConfigured()) {
      (async () => {
        try {
          await supabase.from('nudges').insert({
            sender_id: currentUser.id,
            target_id: targetUserId,
          });
        } catch (err) {
          console.error('Błąd zapisu pogańca w Supabase:', err);
        }
      })();
    }
  }
}

export const store = new Store();
