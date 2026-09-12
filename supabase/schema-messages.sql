-- ============================================
-- SchulApp: Nachrichten / Chat
-- Ausfuehren im Supabase SQL Editor
-- NACH schema.sql und schema-sick-notes.sql
-- ============================================

-- Konversationen (1:1 zwischen zwei Nutzern)
create table public.conversations (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now()
);

alter table public.conversations enable row level security;

-- Teilnehmer einer Konversation
create table public.conversation_participants (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  unique(conversation_id, user_id)
);

alter table public.conversation_participants enable row level security;

create policy "Nutzer sehen eigene Konversationen"
  on public.conversations for select
  using (
    exists (
      select 1 from public.conversation_participants
      where conversation_id = conversations.id and user_id = auth.uid()
    )
  );

create policy "Eingeloggte Nutzer koennen Konversationen erstellen"
  on public.conversations for insert
  with check (auth.role() = 'authenticated');

create policy "Nutzer sehen eigene Teilnahmen"
  on public.conversation_participants for select
  using (
    exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = conversation_participants.conversation_id
      and cp.user_id = auth.uid()
    )
  );

create policy "Eingeloggte Nutzer koennen Teilnahmen erstellen"
  on public.conversation_participants for insert
  with check (auth.role() = 'authenticated');

-- Nachrichten
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);

alter table public.messages enable row level security;

create policy "Teilnehmer sehen Nachrichten ihrer Konversationen"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversation_participants
      where conversation_id = messages.conversation_id
      and user_id = auth.uid()
    )
  );

create policy "Teilnehmer koennen Nachrichten senden"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversation_participants
      where conversation_id = messages.conversation_id
      and user_id = auth.uid()
    )
  );

-- Hilfsfunktion: letzte Nachricht pro Konversation (fuer Vorschau)
create or replace function public.get_latest_message(conv_id uuid)
returns table(content text, created_at timestamptz, sender_id uuid) as $$
  select content, created_at, sender_id
  from public.messages
  where conversation_id = conv_id
  order by created_at desc
  limit 1;
$$ language sql security definer;

-- ============================================
-- WICHTIG: Supabase Realtime aktivieren
-- Im Dashboard unter Database > Replication:
-- Tabelle "messages" fuer Realtime aktivieren
-- ============================================
