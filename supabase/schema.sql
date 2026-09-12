-- ============================================
-- SchulApp Database Schema
-- Ausfuehren im Supabase SQL Editor
-- ============================================

-- Profiles (erweitert Supabase Auth)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text not null,
  role text not null check (role in ('parent', 'teacher', 'admin')),
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Profiles sind fuer eingeloggte Nutzer sichtbar"
  on public.profiles for select
  using (auth.role() = 'authenticated');

create policy "Nutzer koennen eigenes Profil bearbeiten"
  on public.profiles for update
  using (auth.uid() = id);

-- Trigger: Profil automatisch bei Registrierung anlegen
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', 'Neuer Nutzer'),
    coalesce(new.raw_user_meta_data->>'role', 'parent')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Schwarzes Brett
create table public.board_posts (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  pinned boolean default false,
  created_at timestamptz default now()
);

alter table public.board_posts enable row level security;

create policy "Alle eingeloggten Nutzer koennen Beitraege lesen"
  on public.board_posts for select
  using (auth.role() = 'authenticated');

create policy "Alle eingeloggten Nutzer koennen Beitraege erstellen"
  on public.board_posts for insert
  with check (auth.uid() = author_id);

create policy "Autoren und Admins koennen Beitraege loeschen"
  on public.board_posts for delete
  using (
    auth.uid() = author_id
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins koennen Beitraege bearbeiten (pinnen)"
  on public.board_posts for update
  using (
    auth.uid() = author_id
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ============================================
-- Test-Daten (optional, zum Ausprobieren)
-- Erst einen User in Supabase Auth anlegen,
-- dann hier die ID einsetzen.
-- ============================================
-- insert into public.board_posts (title, content, author_id)
-- values
--   ('Willkommen!', 'Das ist das neue Schwarze Brett der Schule.', '<user-id>'),
--   ('Elternabend am 20.10.', 'Bitte alle kommen! Raum 203, 19 Uhr.', '<user-id>');
