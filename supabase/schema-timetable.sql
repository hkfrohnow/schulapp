-- ============================================
-- SchulApp: Stundenplan
-- Ausfuehren im Supabase SQL Editor
-- NACH schema.sql und schema-sick-notes.sql
-- ============================================

-- Stundenplan-Eintraege (pro Klasse)
create table public.timetable_entries (
  id uuid default gen_random_uuid() primary key,
  class_name text not null,             -- z.B. "2a" — verknuepft mit students.class_name
  day_of_week int not null check (day_of_week between 1 and 5),  -- 1=Mo, 5=Fr
  period int not null check (period between 1 and 8),            -- Schulstunde
  start_time time not null,
  end_time time not null,
  subject text not null,
  teacher_id uuid references public.profiles(id) on delete set null,
  room text,
  created_at timestamptz default now(),
  unique(class_name, day_of_week, period)
);

alter table public.timetable_entries enable row level security;

-- Alle eingeloggten Nutzer koennen den Stundenplan lesen
-- (Eltern sehen nur die Klasse ihres Kindes — das filtern wir im Frontend,
--  die DB-Policy ist bewusst offen, da Stundenplaene kein Geheimnis sind)
create policy "Eingeloggte Nutzer sehen Stundenplaene"
  on public.timetable_entries for select
  using (auth.role() = 'authenticated');

-- Nur Admins koennen Stundenplaene erstellen/bearbeiten
create policy "Admins erstellen Stundenplaene"
  on public.timetable_entries for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins bearbeiten Stundenplaene"
  on public.timetable_entries for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins loeschen Stundenplaene"
  on public.timetable_entries for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ============================================
-- Beispiel-Stundenplan Klasse 2a
-- (teacher_id anpassen!)
-- ============================================
-- insert into public.timetable_entries
--   (class_name, day_of_week, period, start_time, end_time, subject, room) values
--   ('2a', 1, 1, '08:00', '08:45', 'Deutsch',     'R.101'),
--   ('2a', 1, 2, '08:50', '09:35', 'Mathe',       'R.101'),
--   ('2a', 1, 3, '09:55', '10:40', 'Sachkunde',   'R.101'),
--   ('2a', 1, 4, '10:45', '11:30', 'Sport',       'Halle'),
--   ('2a', 2, 1, '08:00', '08:45', 'Mathe',       'R.101'),
--   ('2a', 2, 2, '08:50', '09:35', 'Deutsch',     'R.101'),
--   ('2a', 2, 3, '09:55', '10:40', 'Kunst',       'R.204'),
--   ('2a', 2, 4, '10:45', '11:30', 'Musik',       'R.105'),
--   ('2a', 3, 1, '08:00', '08:45', 'Deutsch',     'R.101'),
--   ('2a', 3, 2, '08:50', '09:35', 'Englisch',    'R.101'),
--   ('2a', 3, 3, '09:55', '10:40', 'Mathe',       'R.101'),
--   ('2a', 3, 4, '10:45', '11:30', 'Sachkunde',   'R.101'),
--   ('2a', 4, 1, '08:00', '08:45', 'Mathe',       'R.101'),
--   ('2a', 4, 2, '08:50', '09:35', 'Deutsch',     'R.101'),
--   ('2a', 4, 3, '09:55', '10:40', 'Religion',    'R.110'),
--   ('2a', 4, 4, '10:45', '11:30', 'Sport',       'Halle'),
--   ('2a', 5, 1, '08:00', '08:45', 'Englisch',    'R.101'),
--   ('2a', 5, 2, '08:50', '09:35', 'Mathe',       'R.101'),
--   ('2a', 5, 3, '09:55', '10:40', 'Kunst',       'R.204');
