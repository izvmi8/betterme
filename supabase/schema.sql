-- ============================================================
-- BETTERME SUPABASE SCHEMA & SEED
-- Skopiuj i wklej ten plik do: Supabase Dashboard -> SQL Editor -> Run
-- ============================================================

-- 1. Tabela Użytkowników
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  avatar TEXT NOT NULL,
  pin TEXT NOT NULL DEFAULT '1234',
  current_streak INTEGER NOT NULL DEFAULT 0,
  all_time_workouts INTEGER NOT NULL DEFAULT 0,
  all_time_minutes INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Tabela Treningów (Workouts)
CREATE TABLE IF NOT EXISTS public.workouts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_avatar TEXT NOT NULL,
  sport_type TEXT NOT NULL,
  sport_title TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  photo_url TEXT NOT NULL,
  selfie_url TEXT,
  notes TEXT,
  tagged_user_ids TEXT[] DEFAULT '{}',
  tagged_user_names TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Tabela Reakcji (Ogień 🔥, etc.)
CREATE TABLE IF NOT EXISTS public.reactions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  workout_id TEXT NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL DEFAULT '🔥',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (workout_id, user_id, emoji)
);

-- 4. Tabela Komentarzy (Tekstowe oraz głosowe notatki audio)
CREATE TABLE IF NOT EXISTS public.comments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  workout_id TEXT NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_avatar TEXT NOT NULL,
  text TEXT,
  audio_url TEXT,
  audio_duration REAL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Tabela Powiadomień i Pogań (Nudges)
CREATE TABLE IF NOT EXISTS public.nudges (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  sender_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  target_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================
-- BEZPIECZEŃSTWO ROW LEVEL SECURITY (RLS)
-- Umożliwiamy pełny odczyt i zapis dla członków paczki (anon / public)
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nudges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Publiczny dostęp do users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Publiczny dostęp do workouts" ON public.workouts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Publiczny dostęp do reactions" ON public.reactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Publiczny dostęp do comments" ON public.comments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Publiczny dostęp do nudges" ON public.nudges FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- SUPABASE REALTIME
-- Transmisja na żywo do wszystkich telefonów przy nowym treningu/reakcji
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.workouts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.nudges;

-- ============================================================
-- STORAGE BUCKET NA ZDJĘCIA Z DUAL-CAMERA ('betterme-media')
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('betterme-media', 'betterme-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Publiczny dostęp do zdjęć"
ON storage.objects FOR ALL
USING (bucket_id = 'betterme-media')
WITH CHECK (bucket_id = 'betterme-media');

-- ============================================================
-- DANE POCZĄTKOWE (SEED USERS & WORKOUTS)
-- ============================================================

INSERT INTO public.users (id, name, avatar, pin, current_streak, all_time_workouts, all_time_minutes, longest_streak)
VALUES
  ('u1', 'Filip', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80', '1234', 4, 42, 2150, 6),
  ('u2', 'Tomek', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80', '1234', 3, 31, 1680, 5),
  ('u3', 'Marek', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80', '1234', 1, 18, 920, 3),
  ('u4', 'Wiktor', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=250&q=80', '1234', 0, 7, 340, 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.workouts (id, user_id, user_name, user_avatar, sport_type, sport_title, duration_minutes, photo_url, selfie_url, notes, tagged_user_ids, tagged_user_names, created_at)
VALUES
  (
    'w1',
    'u1',
    'Filip',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    'gym',
    'Siłownia • Push Day',
    60,
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    'Klatka + barki, rekord na ławie pobity 115kg 💪🔥',
    ARRAY['u2'],
    ARRAY['Tomek'],
    now() - interval '2 hours'
  ),
  (
    'w2',
    'u3',
    'Marek',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
    'running',
    'Bieganie • Park i bulwary',
    42,
    'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    'Szybka 8-ka z rana w deszczu, nie ma wymówek 🌧️👟',
    ARRAY[]::TEXT[],
    ARRAY[]::TEXT[],
    now() - interval '7 hours'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.reactions (id, workout_id, user_id, emoji)
VALUES
  ('r1', 'w1', 'u2', '🔥'),
  ('r2', 'w1', 'u3', '🔥'),
  ('r3', 'w2', 'u1', '🔥')
ON CONFLICT DO NOTHING;

INSERT INTO public.comments (id, workout_id, user_id, user_name, user_avatar, text, created_at)
VALUES
  ('c1', 'w1', 'u3', 'Marek', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80', 'Dobra forma byku, ile poszło w serii?', now() - interval '1 hour'),
  ('c2', 'w1', 'u2', 'Tomek', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80', 'Jutro lecimy razem!', now() - interval '1 hour'),
  ('c3', 'w2', 'u1', 'Filip', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80', 'Szacun za wyjście w taką ulewę 🏃‍♂️', now() - interval '5 hours')
ON CONFLICT DO NOTHING;
