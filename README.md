# 🏋️‍♂️ BeMe - BeReal dla Twojej Ekipy Treningowej

Aplikacja motywacyjna dla paczki znajomych łącząca mechanikę BeReal (podwójny aparat w 3:4, jednoczesne selfie i ujęcie treningu) z elementami grywalizacji (passa 3/3 w tygodniu, Karta Hańby, Spotify Wrapped ekipy).

---

## 🚀 Główne Funkcjonalności

1. **Dual-Camera BeReal Snap**:
   - Jeden klik wykonuje zdjęcie z obu kamer w formacie 3:4.
   - Płynny podgląd PiP z możliwością natychmiastowej zamiany kamer jednym stuknięciem w ekran.
   - Automatyczny retro stempel wodny na zdjęciu (data, godzina, dyscyplina).
2. **Tablica Treningowa (Feed)**:
   - Pionowy feed w stylu BeReal.
   - Reakcja ogniem 🔥 przez podwójne stuknięcie w ekran lub przycisk.
   - Komentarze tekstowe oraz **notatki głosowe audio (Voice Notes)** z bezpośrednim odsłuchem.
3. **Grywalizacja i Odpowiedzialność**:
   - Cel tygodniowy: minimum 3 treningi w tygodniu (od poniedziałku do niedzieli).
   - Oznaczanie kumpla z treningu (**Gym Buddy**) – zalicza trening obu osobom!
   - Przycisk **"📢 Pogań lenia"** z natychmiastowym powiadomieniem.
   - **Karta Hańby Tygodnia** – oficjalny raport karny z możliwością skopiowania i wklejenia na Messengera ("w niedzielę stawiasz pizzę 🍕").
   - **Spotify Wrapped Ekipy** – 3-slajdowe miesięczne podsumowanie (Dzik Miesiąca, Król Kanapy, Najchętniej uprawiany sport).
4. **Wielu Użytkowników & PIN**:
   - Szybkie przełączanie profili w ekipie (Filip, Tomek, Marek, Wiktor) zabezpieczone 4-cyfrowym kodem PIN.

---

## 🛠️ Stack Technologiczny

* **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons.
* **Backend & Baza Danych**: Supabase (PostgreSQL, Realtime, Storage).
* **Testy**: Vitest, React Testing Library, Puppeteer E2E.

---

## ⚡ Błyskawiczna Konfiguracja Supabase

1. Załóż darmowy projekt na [supabase.com](https://supabase.com).
2. Przejdź do **SQL Editor** i wklej zawartość pliku `supabase/schema.sql`, a następnie kliknij **Run**.
3. W ustawieniach projektu (**Project Settings -> API**) skopiuj:
   * **Project URL**
   * **Project API Anon Key**
4. Utwórz plik `.env` na wzór `.env.example`:
   ```env
   VITE_SUPABASE_URL=https://twoj-projekt.supabase.co
   VITE_SUPABASE_ANON_KEY=twoj-anon-klucz
   ```
5. Uruchom aplikację:
   ```bash
   npm install
   npm run dev
   ```
