# SchulApp

Die einfache Schul-App. 4 Funktionen, die richtig gut funktionieren — statt 40, die alle nerven.

**Schwarzes Brett** · **Stundenplan** · **Krankmeldung** · **Chat**

## Tech Stack

- [Next.js](https://nextjs.org) — React Framework
- [Supabase](https://supabase.com) — Backend (Auth, DB, Realtime)
- [Tailwind CSS](https://tailwindcss.com) — Styling
- [Lucide Icons](https://lucide.dev) — Icons

## Schnellstart

```bash
# 1. Dependencies installieren
npm install

# 2. Env-Datei anlegen
cp .env.example .env.local
# Supabase URL und Key eintragen (siehe SETUP.md)

# 3. Starten
npm run dev
```

Vollstaendige Anleitung inkl. Supabase-Setup: **[SETUP.md](./SETUP.md)**

## Features

| Feature | Eltern | Lehrkraft | Admin |
|---------|--------|-----------|-------|
| Brett lesen/posten | Ja | Ja | Ja |
| Brett pinnen | — | — | Ja |
| Stundenplan sehen | Eigene Kinder | Eigene Klassen | Alle |
| Kind krankmelden | Ja | — | — |
| Krankmeldung sehen | Eigene Kinder | Eigene Schueler | Alle |
| Chat | Ja | Ja | Ja |

## Sicherheit

- Row Level Security auf allen Tabellen
- Supabase Auth mit E-Mail/Passwort
- EU-Hosting (Frankfurt) moeglich
- Kein Tracking, keine Cookies ausser Auth

## Lizenz

MIT
