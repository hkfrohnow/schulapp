# SchulApp Setup

## 1. Supabase Projekt anlegen

1. Gehe zu https://supabase.com und erstelle ein kostenloses Konto
2. Erstelle ein neues Projekt (Region: Frankfurt / eu-central-1)
3. Kopiere die **Project URL** und den **anon public key** aus Settings > API

## 2. Datenbank einrichten

Im Supabase Dashboard unter **SQL Editor** die Schemas in dieser Reihenfolge ausfuehren:

1. `supabase/schema.sql` — Basis (Profiles, Schwarzes Brett)
2. `supabase/schema-sick-notes.sql` — Krankmeldungen, Schueler, Lehrer-Zuordnung
3. `supabase/schema-messages.sql` — Chat / Nachrichten
4. `supabase/schema-timetable.sql` — Stundenplan

## 3. Realtime aktivieren

Im Supabase Dashboard unter **Database > Replication**:
- Tabelle `messages` fuer Realtime aktivieren (Toggle anklicken)
- Das ermoeglicht Live-Chat ohne Seite neu zu laden

## 4. Environment Variables setzen

Bearbeite `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://dein-projekt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=dein-anon-key
```

## 5. Test-User anlegen

Im Supabase Dashboard unter **Authentication > Users** drei User anlegen:

### Admin (Schulleitung)
- E-Mail: admin@schule.de / Passwort: test1234
- Metadata: `{"full_name": "Frau Schmidt", "role": "admin"}`

### Lehrkraft
- E-Mail: lehrer@schule.de / Passwort: test1234
- Metadata: `{"full_name": "Herr Mueller", "role": "teacher"}`

### Elternteil
- E-Mail: eltern@schule.de / Passwort: test1234
- Metadata: `{"full_name": "Max Mustermann", "role": "parent"}`

## 6. Testdaten anlegen

Im SQL Editor (IDs der angelegten User einsetzen):

```sql
-- Kind dem Elternteil zuordnen
insert into students (first_name, last_name, class_name, parent_id)
values ('Henri', 'Mustermann', '2a', '<eltern-user-id>');

-- Lehrkraft dem Kind zuordnen
insert into student_teachers (student_id, teacher_id, subject)
values ('<henri-student-id>', '<lehrer-user-id>', 'Deutsch');

-- Stundenplan fuer Klasse 2a
insert into timetable_entries
  (class_name, day_of_week, period, start_time, end_time, subject, room) values
  ('2a', 1, 1, '08:00', '08:45', 'Deutsch',   'R.101'),
  ('2a', 1, 2, '08:50', '09:35', 'Mathe',     'R.101'),
  ('2a', 1, 3, '09:55', '10:40', 'Sachkunde', 'R.101'),
  ('2a', 1, 4, '10:45', '11:30', 'Sport',     'Halle'),
  ('2a', 2, 1, '08:00', '08:45', 'Mathe',     'R.101'),
  ('2a', 2, 2, '08:50', '09:35', 'Deutsch',   'R.101'),
  ('2a', 2, 3, '09:55', '10:40', 'Kunst',     'R.204'),
  ('2a', 2, 4, '10:45', '11:30', 'Musik',     'R.105'),
  ('2a', 3, 1, '08:00', '08:45', 'Deutsch',   'R.101'),
  ('2a', 3, 2, '08:50', '09:35', 'Englisch',  'R.101'),
  ('2a', 3, 3, '09:55', '10:40', 'Mathe',     'R.101'),
  ('2a', 3, 4, '10:45', '11:30', 'Sachkunde', 'R.101'),
  ('2a', 4, 1, '08:00', '08:45', 'Mathe',     'R.101'),
  ('2a', 4, 2, '08:50', '09:35', 'Deutsch',   'R.101'),
  ('2a', 4, 3, '09:55', '10:40', 'Religion',  'R.110'),
  ('2a', 4, 4, '10:45', '11:30', 'Sport',     'Halle'),
  ('2a', 5, 1, '08:00', '08:45', 'Englisch',  'R.101'),
  ('2a', 5, 2, '08:50', '09:35', 'Mathe',     'R.101'),
  ('2a', 5, 3, '09:55', '10:40', 'Kunst',     'R.204');
```

## 7. App starten

```bash
npm run dev
```

Oeffne http://localhost:3000 und melde dich mit einem der Test-User an.

## Features

| Feature | Status | Beschreibung |
|---------|--------|-------------|
| Schwarzes Brett | Fertig | Infos von jedem an alle, Admins koennen pinnen |
| Krankmeldung | Fertig | Eltern melden krank, Lehrkraefte sehen ihre Schueler |
| Nachrichten | Fertig | 1:1 Chat mit Echtzeit-Updates via Supabase Realtime |
| Stundenplan | Fertig | Wochenansicht mit Farbcodes, mobil als Tagesansicht |

## Rollen & Berechtigungen

| Aktion | Eltern | Lehrkraft | Admin |
|--------|--------|-----------|-------|
| Brett lesen | Ja | Ja | Ja |
| Brett posten | Ja | Ja | Ja |
| Brett pinnen | Nein | Nein | Ja |
| Kind krankmelden | Eigene | Nein | Nein |
| Krankmeldung sehen | Eigene Kinder | Eigene Schueler | Alle |
| Gesundmelden | Eigene Kinder | Nein | Alle |
| Chat starten | Ja | Ja | Ja |
| Chat-Nachrichten | Eigene Chats | Eigene Chats | Eigene Chats |
