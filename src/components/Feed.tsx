import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Workout, User } from '../types';
import { Flame, Dumbbell, MessageSquare, Send, X, Mic, Square, Play } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';

interface FeedProps {
  workouts: Workout[];
  currentUser: User;
  onToggleReaction: (workoutId: string, emoji: string) => void;
  onAddComment: (workoutId: string, text: string) => void;
  onAddAudioComment: (workoutId: string, audioUrl: string, duration: number) => void;
  onSelectUser: (userId: string) => void;
  onOpenAddModal: () => void;
  onVisibleAuthorChange: (authorId: string) => void;
  onModalToggle?: (isOpen: boolean) => void;
}

export const Feed: React.FC<FeedProps> = ({
  workouts,
  currentUser,
  onToggleReaction,
  onAddComment,
  onAddAudioComment,
  onSelectUser,
  onOpenAddModal,
  onVisibleAuthorChange,
  onModalToggle,
}) => {
  const [swappedCards, setSwappedCards] = useState<Record<string, boolean>>({});
  const [showHeartAnim, setShowHeartAnim] = useState<string | null>(null);
  const [activeCommentsWorkoutId, setActiveCommentsWorkoutId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<string>('');

  // Audio comments state
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordDuration, setRecordDuration] = useState<number>(0);
  const [playingAudioCommentId, setPlayingAudioCommentId] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<any>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef<{ id: string; time: number }>({ id: '', time: 0 });
  const clickTimeoutRef = useRef<Record<string, any>>({});

  // Notify parent modal state to lock screen carousel navigation
  useEffect(() => {
    onModalToggle?.(!!activeCommentsWorkoutId);
  }, [activeCommentsWorkoutId, onModalToggle]);

  // IntersectionObserver to accurately detect which workout (and author) is visible
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const cards = container.querySelectorAll<HTMLElement>('[data-workout-id]');
    if (cards.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.55) {
            const authorId = entry.target.getAttribute('data-author-id');
            if (authorId) {
              onVisibleAuthorChange(authorId);
              // Subtle haptic tick for that tactile potentiometer click feel
              if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                try {
                  navigator.vibrate(10);
                } catch {
                  // Ignore if unsupported
                }
              }
            }
          }
        });
      },
      {
        root: container,
        threshold: [0.55, 0.75],
      }
    );

    cards.forEach((card) => observer.observe(card));

    return () => {
      observer.disconnect();
    };
  }, [workouts, onVisibleAuthorChange]);

  // Clean up any pending single-tap swap timers on unmount
  useEffect(() => {
    return () => {
      Object.values(clickTimeoutRef.current).forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const toggleSwap = (workoutId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSwappedCards((prev) => ({
      ...prev,
      [workoutId]: !prev[workoutId],
    }));
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(15);
      } catch {
        // Ignore if unsupported
      }
    }
  };

  // Jednorazowe kliknięcie w ekran = zamiana kamer przód/tył; dwuklik = reakcja ogniem 🔥
  const handleScreenClick = (workoutId: string) => {
    const now = Date.now();
    if (lastTapRef.current.id === workoutId && now - lastTapRef.current.time < 300) {
      // Wykryto podwójne stuknięcie: anuluj timer zamiany i wystrzel ogień
      if (clickTimeoutRef.current[workoutId]) {
        clearTimeout(clickTimeoutRef.current[workoutId]);
        delete clickTimeoutRef.current[workoutId];
      }
      lastTapRef.current = { id: '', time: 0 };

      onToggleReaction(workoutId, '🔥');
      setShowHeartAnim(workoutId);
      setTimeout(() => setShowHeartAnim(null), 850);
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([20, 50]);
        } catch {
          // Ignore
        }
      }
    } else {
      // Pojedyncze stuknięcie: zaplanuj zamianę kamer po krótkiej pauzie (250ms)
      lastTapRef.current = { id: workoutId, time: now };
      clickTimeoutRef.current[workoutId] = setTimeout(() => {
        toggleSwap(workoutId);
        delete clickTimeoutRef.current[workoutId];
        lastTapRef.current = { id: '', time: 0 };
      }, 250);
    }
  };

  const handleSendComment = (e: React.FormEvent, workoutId: string) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(workoutId, commentText);
    setCommentText('');
  };

  // Feature 6: Voice Notes in Comments
  const startRecordingAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || 'audio/webm',
        });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          if (activeCommentsWorkoutId && base64Audio) {
            onAddAudioComment(activeCommentsWorkoutId, base64Audio, Math.max(1, recordDuration));
          }
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordDuration(0);

      recordTimerRef.current = setInterval(() => {
        setRecordDuration((prev) => {
          if (prev >= 14) {
            stopRecordingAudio();
            return 15;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Mikrofon niedostępny:', err);
      alert('Nie udało się włączyć mikrofonu. Upewnij się, że masz przyznane uprawnienia.');
    }
  };

  const stopRecordingAudio = () => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const togglePlayAudio = (commentId: string, audioUrl: string) => {
    if (playingAudioCommentId === commentId) {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }
      setPlayingAudioCommentId(null);
      return;
    }

    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }

    const audio = new Audio(audioUrl);
    activeAudioRef.current = audio;
    setPlayingAudioCommentId(commentId);

    audio.onended = () => {
      setPlayingAudioCommentId(null);
      activeAudioRef.current = null;
    };
    audio.onerror = () => {
      setPlayingAudioCommentId(null);
      activeAudioRef.current = null;
    };

    audio.play().catch((err) => {
      console.error('Błąd odtwarzania audio:', err);
      setPlayingAudioCommentId(null);
    });
  };

  // Stop audio and recording if comments closed
  useEffect(() => {
    if (!activeCommentsWorkoutId) {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }
      setPlayingAudioCommentId(null);
      if (isRecording) {
        stopRecordingAudio();
      }
    }
  }, [activeCommentsWorkoutId, isRecording]);

  const getTimeAgo = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: pl });
    } catch {
      return 'niedawno';
    }
  };

  const activeCommentsWorkout = workouts.find((w) => w.id === activeCommentsWorkoutId);

  if (workouts.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center bg-black">
        <div className="w-20 h-20 rounded-full bg-[#152b36] border border-[#0d2b52] flex items-center justify-center text-[#6ea900] mb-4">
          <Dumbbell size={36} />
        </div>
        <h3 className="text-xl font-black text-white mb-2">Pusto na tablicy</h3>
        <p className="text-zinc-400 text-sm max-w-xs mb-6">
          Nikt dzisiaj jeszcze nie wrzucił treningu.
        </p>
        <button
          onClick={onOpenAddModal}
          className="px-6 py-3 rounded-full bg-[#6ea900] text-black font-extrabold text-sm shadow-xl shadow-[#6ea900]/30 active:scale-95"
        >
          Dodaj trening
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar select-none bg-black"
    >
      {workouts.map((w, index) => {
        const isSwapped = !!swappedCards[w.id];
        const mainImg = isSwapped ? w.selfieUrl || w.photoUrl : w.photoUrl;
        const pipImg = isSwapped ? w.photoUrl : w.selfieUrl;

        const flameReaction = w.reactions.find((r) => r.emoji === '🔥');
        const hasFlamed = flameReaction?.userIds.includes(currentUser.id);
        const flameCount = flameReaction?.userIds.length || 0;
        const commentsCount = w.comments?.length || 0;

        return (
          <div
            key={w.id}
            data-workout-id={w.id}
            data-author-id={w.userId}
            onClick={() => handleScreenClick(w.id)}
            className="relative h-full w-full snap-start snap-always shrink-0 flex flex-col justify-center items-center px-3 pt-14 pb-20 bg-black overflow-hidden cursor-pointer"
          >
            {/* Wrapper o szerokości karty */}
            <div className="w-full max-w-[420px] flex flex-col items-start gap-2 select-none">
              {/* Belka autora NAD zdjęciem (dokładnie jak w prawym projekcie) */}
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-white/15 text-white shadow-lg pointer-events-auto">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectUser(w.userId);
                  }}
                  className="font-black text-sm text-white hover:underline flex items-center gap-1.5"
                >
                  <img
                    src={w.userAvatar}
                    alt={w.userName}
                    className="w-5 h-5 rounded-full object-cover border border-[#6ea900]"
                  />
                  <span>@{w.userName}</span>
                </button>

                {/* Feature 5: Oznaczony kumpel */}
                {w.taggedUserNames && w.taggedUserNames.length > 0 && (
                  <span className="text-xs text-[#9be819] font-black flex items-center gap-1">
                    <span>z</span>
                    {w.taggedUserNames.map((name, i) => {
                      const buddyId = w.taggedUserIds?.[i];
                      return (
                        <button
                          key={i}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (buddyId) onSelectUser(buddyId);
                          }}
                          className="underline hover:text-white transition-colors"
                        >
                          @{name}
                        </button>
                      );
                    })}
                  </span>
                )}

                <span className="text-xs text-zinc-400">
                  • {getTimeAgo(w.createdAt)}
                </span>
              </div>

              {/* Ramka zdjęcia w proporcjach 3:4 */}
              <div className="relative w-full max-h-[calc(100dvh-185px)] aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl shadow-black/90 bg-[#10222b] border border-[#0d2b52]">
                {/* Główne zdjęcie w formacie 3:4 */}
                <img
                  src={mainImg}
                  alt={w.sportTitle}
                  className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
                  loading={index < 2 ? 'eager' : 'lazy'}
                />

                {/* Drugie ujęcie w rogu kadru 3:4 (PiP) - oryginalny kompaktowy format BeReal 3:4 */}
                {pipImg && (
                  <button
                    onClick={(e) => toggleSwap(w.id, e)}
                    title="Kliknij, aby zamienić kamery miejscami"
                    className="absolute top-3 left-3 z-20 w-24 h-32 rounded-2xl overflow-hidden border-2 border-white/80 shadow-2xl active:scale-95 transition-transform group cursor-pointer"
                  >
                    <img
                      src={pipImg}
                      alt="Druga kamera"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[11px] font-bold transition-opacity">
                      🔄
                    </div>
                  </button>
                )}

                {/* Animacja ognia przy dwukliku */}
                {showHeartAnim === w.id && (
                  <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none animate-in zoom-in-50 fade-in duration-200">
                    <div className="w-24 h-24 rounded-full bg-[#a10b2b]/90 backdrop-blur-md flex items-center justify-center shadow-2xl shadow-[#a10b2b]">
                      <Flame size={54} className="fill-[#ff4d6d] text-white animate-bounce" />
                    </div>
                  </div>
                )}

                {/* Prawy pasek akcji: TYLKO Ogień 🔥 i Komentarze 💬 (brak awatara, jak w prawym projekcie) */}
                <div className="absolute right-3.5 bottom-3.5 z-20 flex flex-col items-center gap-3.5 pointer-events-auto">
                  {/* Reakcja ognia 🔥 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleReaction(w.id, '🔥');
                    }}
                    className="flex flex-col items-center gap-1 active:scale-125 transition-transform"
                  >
                    <div
                      className={`w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-xl ${
                        hasFlamed
                          ? 'bg-[#a10b2b] text-white shadow-[#a10b2b]/60 scale-105'
                          : 'bg-[#10222b]/90 text-white hover:bg-[#152b36] border border-white/20'
                      }`}
                    >
                      <Flame size={26} className={hasFlamed ? 'fill-white' : ''} />
                    </div>
                    <span className="text-xs font-black text-white drop-shadow-md">
                      {flameCount > 0 ? flameCount : 'Ogień'}
                    </span>
                  </button>

                  {/* Przycisk czatu / komentarzy 💬 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveCommentsWorkoutId(w.id);
                    }}
                    className="flex flex-col items-center gap-1 active:scale-125 transition-transform"
                  >
                    <div className="w-14 h-14 rounded-full bg-[#10222b]/90 backdrop-blur-md flex items-center justify-center text-white hover:bg-[#152b36] border border-white/20 shadow-xl">
                      <MessageSquare size={24} />
                    </div>
                    <span className="text-xs font-black text-white drop-shadow-md">
                      {commentsCount > 0 ? commentsCount : 'Czat'}
                    </span>
                  </button>
                </div>

                {/* Tytuł i opis na dole wycentrowane w czystym pasku (dokładnie jak w prawym projekcie) */}
                <div className="absolute bottom-4 inset-x-4 z-20 flex justify-center pointer-events-none">
                  <div className="p-2.5 px-4 rounded-xl bg-black/75 backdrop-blur-md border border-white/10 shadow-2xl text-center max-w-[75%] pointer-events-auto">
                    <div className="text-sm font-black text-white leading-tight">
                      {w.sportTitle}
                    </div>
                    {w.notes && (
                      <div className="text-xs text-zinc-300 leading-snug mt-0.5 font-normal line-clamp-2">
                        {w.notes}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Slide-Up Comments Drawer rendered via portal to escape 400vw carousel transform */}
      {activeCommentsWorkout &&
        createPortal(
          <div
            onClick={() => setActiveCommentsWorkoutId(null)}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-[#152b36] border-t border-[#0d2b52] rounded-t-3xl max-w-md w-full h-[65vh] flex flex-col shadow-2xl p-4 pointer-events-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#0d2b52]">
                <div className="flex items-center gap-2.5">
                  <MessageSquare size={20} className="text-[#6ea900]" />
                  <h3 className="font-black text-base text-white">
                    Komentarze ({activeCommentsWorkout.comments?.length || 0})
                  </h3>
                </div>
                <button
                  onClick={() => setActiveCommentsWorkoutId(null)}
                  className="w-11 h-11 rounded-2xl bg-[#1b3644] border border-[#0d2b52] text-zinc-300 hover:text-white flex items-center justify-center transition-colors active:scale-95"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-3 space-y-3">
                {(!activeCommentsWorkout.comments || activeCommentsWorkout.comments.length === 0) ? (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-400 text-sm">
                    Brak komentarzy. Bądź pierwszy i nagraj lub napisz coś miłego!
                  </div>
                ) : (
                  activeCommentsWorkout.comments.map((comment) => (
                    <div key={comment.id} className="flex items-start gap-3">
                      <img
                        src={comment.userAvatar}
                        alt={comment.userName}
                        className="w-10 h-10 rounded-full object-cover border border-[#0d2b52] shrink-0"
                      />
                      <div className="bg-[#10222b] border border-[#0d2b52] rounded-2xl p-3 flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-black text-sm text-white">{comment.userName}</span>
                          <span className="text-xs text-zinc-400">
                            {getTimeAgo(comment.createdAt)}
                          </span>
                        </div>

                        {/* Feature 6: Voice Note Player or Text Comment */}
                        {comment.audioUrl ? (
                          <div className="flex items-center gap-3 mt-1.5 bg-[#152b36] border border-[#0d2b52] rounded-xl p-2.5">
                            <button
                              type="button"
                              onClick={() => togglePlayAudio(comment.id, comment.audioUrl!)}
                              className="w-10 h-10 rounded-full bg-[#6ea900] text-black flex items-center justify-center shrink-0 active:scale-90 transition-transform shadow-md shadow-[#6ea900]/30"
                            >
                              {playingAudioCommentId === comment.id ? (
                                <Square size={16} className="fill-black" />
                              ) : (
                                <Play size={16} className="fill-black ml-0.5" />
                              )}
                            </button>
                            <div className="flex-1 flex items-center gap-2">
                              <div className="flex items-center gap-0.5 h-5">
                                {[45, 80, 100, 60, 90, 40, 95, 65, 75, 50].map((h, i) => (
                                  <div
                                    key={i}
                                    className={`w-1 rounded-full transition-all duration-150 ${
                                      playingAudioCommentId === comment.id
                                        ? 'bg-[#6ea900] animate-pulse'
                                        : 'bg-zinc-600'
                                    }`}
                                    style={{
                                      height: `${playingAudioCommentId === comment.id ? h : 35}%`,
                                    }}
                                  />
                                ))}
                              </div>
                              <span className="text-xs font-bold text-zinc-300 ml-1">
                                🎙️ {comment.audioDuration ? `0:0${comment.audioDuration}` : 'Głosówka'}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-zinc-100 leading-snug">{comment.text}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Input Bar with Voice Note Recorder & Text */}
              <div className="pt-3 border-t border-[#0d2b52]">
                {isRecording ? (
                  <div className="flex items-center justify-between bg-[#a10b2b]/20 border border-[#a10b2b] rounded-2xl p-3 animate-pulse">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3.5 h-3.5 rounded-full bg-[#a10b2b] animate-ping" />
                      <span className="text-sm font-black text-white">
                        Nagrywanie: 0:{recordDuration < 10 ? '0' : ''}{recordDuration} / 0:15
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={stopRecordingAudio}
                      className="px-4 py-2.5 rounded-xl bg-[#6ea900] text-black font-extrabold text-sm active:scale-95 shadow-lg"
                    >
                      Wyślij 🚀
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => handleSendComment(e, activeCommentsWorkout.id)}
                    className="flex items-center gap-2.5"
                  >
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Napisz lub nagraj komentarz..."
                      className="flex-1 bg-[#10222b] border border-[#0d2b52] rounded-2xl px-4 py-3.5 text-base text-white placeholder-zinc-500 focus:outline-none focus:border-[#6ea900]"
                    />

                    {/* Feature 6: Mic Button for Voice Note */}
                    <button
                      type="button"
                      onClick={startRecordingAudio}
                      title="Nagraj krótką notatkę głosową"
                      className="w-12 h-12 rounded-2xl bg-[#1b3644] border border-[#0d2b52] text-zinc-300 hover:text-white hover:border-[#6ea900] flex items-center justify-center transition-all shrink-0 active:scale-90"
                    >
                      <Mic size={20} className="text-[#6ea900]" />
                    </button>

                    <button
                      type="submit"
                      disabled={!commentText.trim()}
                      className="w-12 h-12 rounded-2xl bg-[#6ea900] text-black flex items-center justify-center disabled:opacity-40 transition-opacity shrink-0 active:scale-90 shadow-lg shadow-[#6ea900]/25"
                    >
                      <Send size={18} />
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
