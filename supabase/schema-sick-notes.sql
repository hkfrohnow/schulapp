-- ============================================
-- SchulApp: Krankmeldung
-- Ausfuehren im Supabase SQL Editor
-- NACH schema.sql
-- ============================================

-- Schueler (verknuepft Kinder mit Eltern)
create table public.students (
  id uuid default gen_random_uuid() primary key,
  first_name text not null,
  last_name text not null,
  class_name text not null,        -- z.B. "2a", "3b"
  parent_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now()
);

alter table public.students enable row level security;

create policy "Eltern sehen eigene Kinder"
  on public.students for select
  using (
    parent_id = auth.uid()
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('teacher', 'admin')
    )
  );

create policy "Admins koennen Schueler anlegen"
  on public.students for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Lehrer-Schueler-Zuordnung (welche Lehrkraft unterrichtet welchen Schueler)
create table public.student_teachers (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.students(id) on delete cascade not null,
  teacher_id uuid references public.profiles(id) on delete cascade not null,
  subject text,                     -- z.B. "Mathe", "Deutsch"
  unique(student_id, teacher_id)
);

alter table public.student_teachers enable row level security;

create policy "Lehrkraefte und Admins sehen Zuordnungen"
  on public.student_teachers for select
  using (
    teacher_id = auth.uid()
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins koennen Zuordnungen erstellen"
  on public.student_teachers for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Krankmeldungen
create table public.sick_notes (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.students(id) on delete cascade not null,
  reported_by uuid references public.profiles(id) on delete cascade not null,
  start_date date not null,
  end_date date not null,
  reason text not null default 'Krankheit',
  notes text,                       -- optionale Zusatzinfos
  status text not null default 'active' check (status in ('active', 'recovered')),
  created_at timestamptz default now()
);

alter table public.sick_notes enable row level security;

-- Eltern sehen Krankmeldungen ihrer eigenen Kinder
create policy "Eltern sehen eigene Krankmeldungen"
  on public.sick_notes for select
  using (
    reported_by = auth.uid()
    or exists (
      select 1 from public.student_teachers st
      join public.students s on s.id = sick_notes.student_id
      where st.teacher_id = auth.uid() and st.student_id = s.id
    )
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Eltern koennen Krankmeldungen fuer eigene Kinder erstellen
create policy "Eltern koennen Krankmeldungen erstellen"
  on public.sick_notes for insert
  with check (
    auth.uid() = reported_by
    and exists (
      select 1 from public.students
      where id = student_id and parent_id = auth.uid()
    )
  );

-- Eltern koennen eigene Krankmeldungen aktualisieren (z.B. Gesundmeldung)
create policy "Eltern koennen eigene Krankmeldungen aktualisieren"
  on public.sick_notes for update
  using (
    reported_by = auth.uid()
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ============================================
-- Test-Daten (IDs anpassen!)
-- ============================================
-- insert into public.students (first_name, last_name, class_name, parent_id)
-- values ('Henri', 'Mustermann', '2a', '<eltern-user-id>');
--
-- insert into public.student_teachers (student_id, teacher_id, subject)
-- values ('<henri-student-id>', '<lehrer-user-id>', 'Deutsch');
