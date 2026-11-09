import React, { useState, useRef, useEffect, useCallback } from 'react';
import { User, SportType } from '../types';
import { X, RefreshCw, Check, AlertCircle, FlipHorizontal } from 'lucide-react';

interface AddWorkoutModalProps {
  currentUser: User;
  users: User[];
  isOpen: boolean;
  onClose: () => void;
  onSaveWorkout: (workout: {
    userId: string;
    userName: string;
    userAvatar: string;
    sportType: SportType;
    sportTitle: string;
    durationMinutes: number;
    photoUrl: string;
    selfieUrl?: string;
    notes?: string;
    taggedUserIds?: string[];
    taggedUserNames?: string[];
  }) => void;
}

const SPORTS: { type: SportType; label: string; icon: string; defaultTitle: string }[] = [
  { type: 'gym', label: 'Siłownia', icon: '🏋️', defaultTitle: 'Siłownia • Trening siłowy' },
  { type: 'running', label: 'Bieganie', icon: '🏃', defaultTitle: 'Bieganie • Cardio' },
  { type: 'cycling', label: 'Rower', icon: '🚴', defaultTitle: 'Rower • Trasa' },
  { type: 'squash', label: 'Squash', icon: '🎾', defaultTitle: 'Squash • Mecz' },
  { type: 'swimming', label: 'Basen', icon: '🏊', defaultTitle: 'Basen • Pływanie' },
  { type: 'home', label: 'W domu', icon: '🧘', defaultTitle: 'Trening w domu' },
];

export const AddWorkoutModal: React.FC<AddWorkoutModalProps> = ({
  currentUser,
  users,
  isOpen,
  onClose,
  onSaveWorkout,
}) => {
  const [step, setStep] = useState<'viewfinder' | 'review'>('viewfinder');
  const [activeFacing, setActiveFacing] = useState<'environment' | 'user'>('environment');
  const [backPhoto, setBackPhoto] = useState<string | null>(null);
  const [frontPhoto, setFrontPhoto] = useState<string | null>(null);
  const [isSwapped, setIsSwapped] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSnapping, setIsSnapping] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);

  const [selectedSport, setSelectedSport] = useState<SportType>('gym');
  const [notes, setNotes] = useState<string>('');
  const [selectedBuddyIds, setSelectedBuddyIds] = useState<string[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Uruchamianie aktywnej kamery (zabezpieczone limitem czasu, bez zawieszania interfejsu)
  const startCamera = useCallback(async (facing: 'environment' | 'user') => {
    stopStream();
    setCameraError(null);
    setIsLoading(true);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Brak obsługi aparatu w przeglądarce.');
      setIsLoading(false);
      return;
    }

    try {
      const getMediaPromise = navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Limit czasu inicjalizacji kamery.')), 2000)
      );

      const stream = await Promise.race([getMediaPromise, timeoutPromise]);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('webkit-playsinline', 'true');
        try {
          await videoRef.current.play();
        } catch {
          // Autoplay policy bypass
        }
      }
    } catch (err: any) {
      setCameraError('Aparat niedostępny: ' + (err.message || 'Brak uprawnień'));
    } finally {
      setIsLoading(false);
    }
  }, [stopStream]);

  useEffect(() => {
    if (isOpen) {
      setStep('viewfinder');
      setBackPhoto(null);
      setFrontPhoto(null);
      setSelectedBuddyIds([]);
      setNotes('');
      startCamera(activeFacing);
    } else {
      stopStream();
    }
    return () => {
      stopStream();
    };
  }, [isOpen, activeFacing, startCamera, stopStream]);

  // Feature 7: Retro Watermark stamp onto photo
  const stampWatermarkOnPhoto = async (
    imgDataUrl: string,
    sportLabel: string
  ): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(imgDataUrl);
          return;
        }

        ctx.drawImage(img, 0, 0);

        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const stampText = `${day}.${month} • ${hours}:${minutes} • ${sportLabel.toUpperCase()}`;

        // Dynamic responsive retro font
        const fontSize = Math.max(20, Math.round(canvas.width * 0.04));
        ctx.save();
        ctx.font = `900 ${fontSize}px ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.textBaseline = 'bottom';
        ctx.textAlign = 'left';

        const paddingX = Math.round(canvas.width * 0.05);
        const paddingY = canvas.height - Math.round(canvas.height * 0.035);

        // Crisp BeReal style shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 2;

        ctx.fillStyle = '#ffffff';
        ctx.fillText(stampText, paddingX, paddingY);
        ctx.restore();

        resolve(canvas.toDataURL('image/jpeg', 0.92));
      };
      img.onerror = () => resolve(imgDataUrl);
      img.src = imgDataUrl;
    });
  };

  // Przełączanie aktywnej kamery w wizjerze (kliknięcie w okienko)
  const toggleFacingInViewfinder = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveFacing((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Pobieranie klatki z aktualnego wideo wykadrowanej do formatu 3:4
  const getFrame = (video: HTMLVideoElement, mirror = false): string | null => {
    if (video.videoWidth === 0 || video.videoHeight === 0) return null;
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1440; // 3:4 proporcja pionowa
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Obliczanie wycinka źródła wideo w formacie 3:4
    const targetAspect = 3 / 4;
    const srcAspect = video.videoWidth / video.videoHeight;
    let sx = 0,
      sy = 0,
      sw = video.videoWidth,
      sh = video.videoHeight;

    if (srcAspect > targetAspect) {
      sw = video.videoHeight * targetAspect;
      sx = (video.videoWidth - sw) / 2;
    } else {
      sh = video.videoWidth / targetAspect;
      sy = (video.videoHeight - sh) / 2;
    }

    if (mirror) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.92);
  };

  // BŁYSKAWICZNY DUAL-SNAP (1 KLIK ROBI OBA ZDJĘCIA)
  const handleDualSnap = async () => {
    if (isSnapping) return;
    setIsSnapping(true);

    try {
      // 1. Zrzut z kamery, którą aktualnie celujesz
      const firstShot = videoRef.current ? getFrame(videoRef.current, activeFacing === 'user') : null;
      const otherFacing = activeFacing === 'environment' ? 'user' : 'environment';

      // 2. Automatyczny natychmiastowy przeskok do drugiej kamery (<250ms)
      let secondShot: string | null = null;
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
        }
        const secondStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: otherFacing } },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = secondStream;
          await videoRef.current.play();
          // Krótka pauza 180ms na ustabilizowanie sensora
          await new Promise((r) => setTimeout(r, 180));
          secondShot = getFrame(videoRef.current, otherFacing === 'user');
        }
        secondStream.getTracks().forEach((t) => t.stop());
      } catch (err) {
        console.error('Błąd drugiej kamery:', err);
      }

      // Fallback jeśli kamera nie zwróciła klatki (np. w testach lub braku uprawnień sprzętowych)
      const fallbackShot = () => {
        const c = document.createElement('canvas');
        c.width = 1080;
        c.height = 1440;
        const cx = c.getContext('2d');
        if (cx) {
          cx.fillStyle = '#10222b';
          cx.fillRect(0, 0, 1080, 1440);
          cx.fillStyle = '#6ea900';
          cx.font = 'bold 44px sans-serif';
          cx.textAlign = 'center';
          cx.fillText('BeMe WORKOUT SNAP 📸', 540, 720);
        }
        return c.toDataURL('image/jpeg', 0.9);
      };

      const validFirst = firstShot || fallbackShot();
      const validSecond = secondShot || validFirst;

      // Przypisanie: ujęcie treningu jako back, selfie jako front
      if (activeFacing === 'environment') {
        setBackPhoto(validFirst);
        setFrontPhoto(validSecond);
      } else {
        setFrontPhoto(validFirst);
        setBackPhoto(validSecond);
      }

      stopStream();
      setStep('review');
    } finally {
      setIsSnapping(false);
    }
  };

  const handlePublish = async () => {
    if (!backPhoto || isPublishing) return;
    setIsPublishing(true);

    try {
      const sportConfig = SPORTS.find((s) => s.type === selectedSport) || SPORTS[0];

      const rawMain = isSwapped ? (frontPhoto || backPhoto) : backPhoto;
      const rawSelfie = isSwapped ? backPhoto : (frontPhoto || undefined);

      // Feature 7: Retro Watermark stamp onto final picture
      const finalMain = await stampWatermarkOnPhoto(rawMain, sportConfig.label);

      // Feature 5: Resolve tagged gym buddies
      const taggedUsers = users.filter((u) => selectedBuddyIds.includes(u.id));
      const taggedUserNames = taggedUsers.map((u) => u.name);

      onSaveWorkout({
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatar,
        sportType: selectedSport,
        sportTitle: sportConfig.defaultTitle,
        durationMinutes: 0,
        photoUrl: finalMain,
        selfieUrl: rawSelfie,
        notes: notes.trim() || undefined,
        taggedUserIds: selectedBuddyIds.length > 0 ? selectedBuddyIds : undefined,
        taggedUserNames: taggedUserNames.length > 0 ? taggedUserNames : undefined,
      });
      onClose();
    } finally {
      setIsPublishing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between overflow-hidden animate-in fade-in duration-200 select-none">
      {/* 1. EKRAN WIZJERA KAMERY */}
      {step === 'viewfinder' && (
        <div className="relative h-full w-full flex flex-col justify-between bg-black overflow-hidden p-3 pt-6 pb-6">
          {/* Top Bar: Zamknij (X) oraz napis UŚMIECHNIJ SIĘ 🧀 */}
          <div className="relative z-20 flex items-center justify-between px-2">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center border border-white/20 active:scale-90 transition-transform"
            >
              <X size={20} />
            </button>

            {/* UŚMIECHNIJ SIĘ 🧀 */}
            <div className="bg-black/65 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/25 flex items-center gap-1.5 shadow-xl">
              <span className="text-xs font-black text-white tracking-widest">
                UŚMIECHNIJ SIĘ
              </span>
              <span className="text-xl leading-none">🧀</span>
            </div>

            <div className="w-10 h-10" />
          </div>

          {/* Ramka kadru 3:4 */}
          <div className="relative w-full max-w-[390px] max-h-[calc(100dvh-190px)] aspect-[3/4] mx-auto rounded-3xl overflow-hidden shadow-2xl bg-zinc-900 border border-white/20 my-auto">
            {/* Obraz z aktywnej kamery w kadrze 3:4 */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover ${
                activeFacing === 'user' ? 'scale-x-[-1]' : ''
              }`}
            />

            {/* Okienko w rogu z możliwością natychmiastowej zamiany kamer */}
            <button
              onClick={toggleFacingInViewfinder}
              title="Kliknij, aby przełączyć podgląd przód/tył"
              className="absolute top-3.5 left-3.5 z-20 w-22 h-30 rounded-2xl overflow-hidden border-2 border-white/60 shadow-2xl bg-[#10222b]/85 backdrop-blur-md flex flex-col items-center justify-center p-2 text-center group active:scale-95 transition-transform"
            >
              <div className="w-8 h-8 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white mb-1 group-hover:scale-110 transition-transform">
                <FlipHorizontal size={16} className="text-[#6ea900]" />
              </div>
              <span className="text-[10px] font-black text-white leading-tight">
                {activeFacing === 'environment' ? 'SELFIE' : 'TRENING'}
              </span>
              <span className="text-[8px] text-[#6ea900] font-bold mt-0.5">
                Stuknij 🔄
              </span>
            </button>

            {/* Czysty kadr bez gradientów */}

            {/* Ładowanie */}
            {isLoading && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/70">
                <div className="w-10 h-10 border-4 border-[#6ea900] border-t-transparent rounded-full animate-spin mb-3" />
                <span className="text-white text-xs font-bold">Włączanie aparatu...</span>
              </div>
            )}

            {/* Błysk migawki */}
            {isSnapping && (
              <div className="absolute inset-0 z-40 bg-white animate-in fade-in duration-75 flex items-center justify-center">
                <span className="text-black font-black text-2xl tracking-wider">📸 CYK!</span>
              </div>
            )}
          </div>

          {/* Komunikat błędu */}
          {cameraError && (
            <div className="relative z-30 mx-4 p-4 rounded-2xl bg-[#a10b2b]/95 text-white text-xs text-center border border-white/20 shadow-2xl space-y-2">
              <div className="flex items-center justify-center gap-1.5 font-bold text-sm">
                <AlertCircle size={16} /> Błąd aparatu
              </div>
              <p className="leading-snug">{cameraError}</p>
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  onClick={() => startCamera(activeFacing)}
                  className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white font-bold rounded-xl text-xs active:scale-95"
                >
                  Spróbuj ponownie
                </button>
                <button
                  onClick={handleDualSnap}
                  className="px-3 py-1.5 bg-[#6ea900] text-black font-extrabold rounded-xl text-xs active:scale-95 shadow-md"
                >
                  Użyj ujęcia zastępczego 📸
                </button>
              </div>
            </div>
          )}

          {/* Dolny pasek: Migawka + Przycisk zmiany kamery tuż pod kciukiem */}
          <div className="relative z-20 pb-4 px-8 flex flex-col items-center gap-2">
            <span className="text-xs font-black text-white drop-shadow-md tracking-wide">
              1 KLIK = ZDJĘCIE Z OBU STRON 📸
            </span>

            <div className="w-full flex items-center justify-center gap-6">
              {/* Lewy odstęp dla idealnego wycentrowania migawki */}
              <div className="w-12 h-12" />

              {/* GŁÓWNA BIAŁA MIGAWKA */}
              <button
                onClick={handleDualSnap}
                disabled={isSnapping}
                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1 active:scale-90 transition-transform shadow-2xl shadow-white/40 disabled:opacity-50"
              >
                <div className="w-full h-full rounded-full bg-white active:bg-zinc-300 transition-colors" />
              </button>

              {/* PRZYCISK ZMIANY KAMERY OBOK MIGAWKI POD KCIUKIEM */}
              <button
                onClick={toggleFacingInViewfinder}
                title="Zmień kamerę (przód/tył)"
                className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/25 text-white flex items-center justify-center shadow-xl active:scale-90 transition-all hover:border-[#6ea900]"
              >
                <RefreshCw size={22} className="text-[#6ea900]" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. EKRAN PODGLĄDU I PUBLIKACJI */}
      {step === 'review' && backPhoto && (
        <div className="relative h-full w-full flex flex-col justify-between bg-black overflow-hidden p-3 pt-6 pb-2">
          {/* Top Bar */}
          <div className="relative z-20 flex items-center justify-between px-2 pb-2">
            <button
              onClick={() => {
                setBackPhoto(null);
                setFrontPhoto(null);
                setStep('viewfinder');
                startCamera(activeFacing);
              }}
              className="px-4 py-2 rounded-full bg-black/65 backdrop-blur-md text-white text-xs font-bold border border-white/20 active:scale-95 transition-transform flex items-center gap-1.5 shadow-lg"
            >
              <RefreshCw size={14} /> Powtórz ujęcia
            </button>

            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-black/65 backdrop-blur-md text-white flex items-center justify-center border border-white/20"
            >
              <X size={18} />
            </button>
          </div>

          {/* Ramka kadru 3:4 z pojedynczym kliknięciem do zamiany */}
          <div
            onClick={() => setIsSwapped(!isSwapped)}
            title="Kliknij, aby zamienić ujęcia miejscami"
            className="relative w-full max-w-[390px] max-h-[calc(100dvh-320px)] aspect-[3/4] mx-auto rounded-3xl overflow-hidden shadow-2xl bg-[#10222b] border border-white/20 cursor-pointer select-none my-auto"
          >
            <img
              src={isSwapped ? (frontPhoto || backPhoto) : backPhoto}
              alt="Trening"
              className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
            />

            {/* PiP Drugie Zdjęcie w rogu 3:4 */}
            {(frontPhoto || backPhoto) && (
              <div
                className="absolute top-3.5 left-3.5 z-20 w-22 h-30 rounded-2xl overflow-hidden border-2 border-white/60 shadow-2xl"
              >
                <img
                  src={isSwapped ? backPhoto : (frontPhoto || backPhoto)}
                  alt="Selfie"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/25 flex items-center justify-center text-white text-[10px] font-bold">
                  🔄
                </div>
              </div>
            )}

            {/* Feature 7: Retro Watermark Preview Badge */}
            <div className="absolute top-3.5 right-3.5 z-20 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white font-black text-[11px] tracking-wider shadow-xl flex items-center gap-1.5 pointer-events-none">
              <span className="text-[#6ea900]">●</span>
              <span>
                {new Date().toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' })} • {new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          {/* Dolny Panel: POWIĘKSZONE KAFELKI, OZNACZANIE I OKNO OPISU (Płaski solidny ciemny panel) */}
          <div className="relative z-20 p-5 pb-8 space-y-4 bg-[#10222b] border-t border-[#0d2b52] max-h-[75vh] overflow-y-auto no-scrollbar shadow-2xl">
            {/* POWIĘKSZONE KAFELKI SPORTU */}
            <div>
              <span className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                Wybierz sport:
              </span>
              <div className="grid grid-cols-3 gap-2.5">
                {SPORTS.map((sport) => {
                  const isSelected = selectedSport === sport.type;
                  return (
                    <button
                      key={sport.type}
                      type="button"
                      onClick={() => setSelectedSport(sport.type)}
                      className={`py-3.5 px-3 rounded-2xl font-bold flex flex-col items-center gap-1.5 transition-all active:scale-95 ${
                        isSelected
                          ? 'bg-[#6ea900] text-black shadow-lg shadow-[#6ea900]/40 scale-[1.02] border-2 border-white'
                          : 'bg-[#152b36] border border-[#0d2b52] text-white hover:border-[#6ea900]/50'
                      }`}
                    >
                      <span className="text-3xl">{sport.icon}</span>
                      <span className="text-xs font-black">{sport.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Feature 5: OZNACZANIE KUMPLA Z SIŁKI 👥 */}
            {users.filter((u) => u.id !== currentUser.id).length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    Trenowaliście razem? Oznacz kumpla 👥
                  </span>
                  {selectedBuddyIds.length > 0 && (
                    <span className="text-xs text-[#6ea900] font-bold bg-[#6ea900]/15 px-2.5 py-0.5 rounded-full border border-[#6ea900]/30">
                      Oznaczono ({selectedBuddyIds.length})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                  {users
                    .filter((u) => u.id !== currentUser.id)
                    .map((buddy) => {
                      const isSelected = selectedBuddyIds.includes(buddy.id);
                      return (
                        <button
                          key={buddy.id}
                          type="button"
                          onClick={() => {
                            setSelectedBuddyIds((prev) =>
                              isSelected ? prev.filter((id) => id !== buddy.id) : [...prev, buddy.id]
                            );
                          }}
                          className={`flex items-center gap-2 px-3.5 py-2 rounded-full border text-xs font-bold transition-all shrink-0 active:scale-95 ${
                            isSelected
                              ? 'bg-[#6ea900]/25 border-[#6ea900] text-[#9be819] shadow-md shadow-[#6ea900]/25'
                              : 'bg-[#152b36] border-[#0d2b52] text-zinc-300 hover:border-zinc-400'
                          }`}
                        >
                          <img
                            src={buddy.avatar}
                            alt={buddy.name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <span>{buddy.name}</span>
                          {isSelected && <span className="text-xs font-black">✓</span>}
                        </button>
                      );
                    })}
                </div>
                {selectedBuddyIds.length > 0 && (
                  <p className="text-xs text-[#9be819] font-medium mt-1">
                    💡 Trening zaliczy się automatycznie do passy oznaczonego kumpla!
                  </p>
                )}
              </div>
            )}

            {/* POWIĘKSZONE OKNO DO OPISU OPCJONALNEGO (TEXTAREA) */}
            <div>
              <span className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                Opis (opcjonalny):
              </span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Napisz parę słów: jak poszło, co było robione..."
                rows={2}
                className="w-full bg-[#152b36] border border-[#0d2b52] rounded-2xl p-3.5 text-base text-white placeholder-zinc-500 focus:outline-none focus:border-[#6ea900] resize-none shadow-inner"
              />
            </div>

            {/* PRZYCISK PUBLIKACJI - płaski, solidny, wyrazisty pod kciuk */}
            <button
              onClick={handlePublish}
              disabled={isPublishing}
              className="w-full py-4 rounded-2xl bg-[#6ea900] text-black font-black text-base hover:bg-[#84ca00] active:scale-[0.98] transition-all shadow-2xl shadow-[#6ea900]/40 flex items-center justify-center gap-2 border-2 border-black disabled:opacity-50"
            >
              {isPublishing ? (
                <>
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Stemplowanie zdjęcia BeMe...
                </>
              ) : (
                <>
                  <Check size={20} strokeWidth={3} />
                  Wrzuć trening do ekipy! 🔥
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
