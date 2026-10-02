# Lernwege – lernwege.edutecsol.ch

Differenzierte, interaktive Lernseiten für die Schweizer Berufsbildung (EDUTECSOL).

- **Öffentlich** (`public/`): Startseite mit Beispielseiten, Prompt-Generator, Master-Prompt – alle bisherigen URLs bleiben gleich.
- **Geschützt** (`/app`, `/admin`): Login mit Microsoft 365 oder Passwort. Nur in der Benutzerverwaltung freigeschaltete E-Mail-Adressen kommen hinein.

## Stack

Next.js 15 (App Router) · Auth.js v5 (Microsoft Entra ID + Credentials) · Neon Postgres · Vercel (Auto-Deploy bei Push auf `main`).

## Einmalige Einrichtung

### 1. Datenbank (Neon über Vercel Marketplace)

1. Vercel → Projekt `edutecsol-lernseiten` → Tab **Storage** → **Create Database** → **Neon** → Region Frankfurt → anlegen.
2. Beim Verbinden alle Environments anhaken. Vercel setzt `DATABASE_URL` automatisch.
3. Lokal die Env-Vars holen und Tabellen anlegen:

```bash
npx vercel env pull .env.local
npm run db:migrate
```

### 2. Microsoft-365-Login (App-Registrierung in Entra ID)

1. [portal.azure.com](https://portal.azure.com) → **Microsoft Entra ID** → **App-Registrierungen** → **Neue Registrierung**.
2. Name: `Lernwege EDUTECSOL`. Kontotypen: **Konten in einem beliebigen Organisationsverzeichnis (mehrinstanzenfähig)**.
3. Umleitungs-URI (Typ **Web**):
   - `https://lernwege.edutecsol.ch/api/auth/callback/microsoft-entra-id`
   - zusätzlich `http://localhost:3000/api/auth/callback/microsoft-entra-id` (für lokal)
4. Nach dem Anlegen: **Anwendungs-ID (Client)** kopieren → `AUTH_MICROSOFT_ENTRA_ID_ID`.
5. **Zertifikate & Geheimnisse** → **Neuer geheimer Clientschlüssel** (24 Monate) → **Wert** sofort kopieren → `AUTH_MICROSOFT_ENTRA_ID_SECRET`.
6. **API-Berechtigungen**: `openid`, `profile`, `email`, `User.Read` (Standard, Microsoft Graph) sind ausreichend.

Env-Vars in Vercel setzen (Production, Preview, Development):

```bash
npx vercel env add AUTH_MICROSOFT_ENTRA_ID_ID
npx vercel env add AUTH_MICROSOFT_ENTRA_ID_SECRET
npx vercel env add ADMIN_EMAILS
```

`ADMIN_EMAILS` = eigene M365-Adresse(n), Komma-getrennt. Diese werden beim ersten Login automatisch als Admin angelegt.
`AUTH_SECRET` und `AUTH_MICROSOFT_ENTRA_ID_ISSUER` sind bereits gesetzt.

Nach dem Setzen einmal neu deployen (Vercel → Deployments → Redeploy) oder einen Commit pushen.

### 3. Erster Login

1. `https://lernwege.edutecsol.ch/login` → **Mit Microsoft 365 anmelden**.
2. Danach unter **Benutzer** (`/admin/benutzer`) weitere Zugänge anlegen: E-Mail, optional Passwort (für Lehrpersonen ohne M365), optional «gültig bis».

## Lokal entwickeln

```bash
npm install
npx vercel env pull .env.local
npm run dev
```

## Struktur

| Pfad | Zweck |
|---|---|
| `public/*.html` | Statische Startseite, Generatoren, Beispielseiten |
| `app/login` | Login-Seite (M365 + Passwort) |
| `app/app` | Geschützter Mitgliederbereich |
| `app/admin/benutzer` | Benutzerverwaltung (nur Admin) |
| `auth.ts`, `auth.config.ts` | Auth.js-Konfiguration |
| `lib/users.ts` | Benutzer-Logik (Postgres, bcrypt) |
| `db/schema.sql` | Tabellen; `npm run db:migrate` legt sie an |
| `content/` | Master-Prompt-Quelle (Markdown) |
