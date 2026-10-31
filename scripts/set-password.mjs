// Setzt für ein Konto ein neues Passwort (z. B. wenn es vergessen wurde).
// Liest die Datenbankadresse aus .env.test (PREVIEW_DATABASE_URL = Testplattform) oder .env.local (DATABASE_URL).
// Aufruf:  node scripts/set-password.mjs <E-Mail> [neues Passwort]
// Ohne zweites Argument wird ein zufälliges Passwort erzeugt und einmal angezeigt.
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
dotenv.config({ path: ".env.test" });
dotenv.config({ path: ".env.local" });

const [email, given] = process.argv.slice(2);
if (!email) { console.error("Aufruf: node scripts/set-password.mjs <E-Mail> [neues Passwort]"); process.exit(1); }
const url = process.env.PREVIEW_DATABASE_URL || process.env.DATABASE_URL;
if (!url) { console.error("Keine Datenbankadresse gefunden: PREVIEW_DATABASE_URL in .env.test oder DATABASE_URL in .env.local eintragen."); process.exit(1); }
const which = process.env.PREVIEW_DATABASE_URL ? "Testplattform (PREVIEW_DATABASE_URL)" : "DATABASE_URL";

const password = given || randomBytes(9).toString("base64url");
if (password.length < 8) { console.error("Passwort braucht mindestens 8 Zeichen."); process.exit(1); }
const sql = neon(url);
const rows = await sql`SELECT id, email, role FROM users WHERE lower(email) = lower(${email.trim()})`;
if (rows.length !== 1) { console.error(`Konto nicht gefunden: ${email}`); process.exit(1); }
const hash = await bcrypt.hash(password, 10);
await sql`UPDATE users SET password_hash = ${hash} WHERE id = ${rows[0].id}`;
console.log(`Passwort gesetzt für ${rows[0].email} (${rows[0].role}) in ${which}.`);
if (!given) console.log(`Neues Passwort (einmalig angezeigt): ${password}`);
console.log("Danach im Admin-Bereich unter Benutzer ein eigenes Passwort setzen.");
