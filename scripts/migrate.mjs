// Legt die Tabellen an (idempotent). Aufruf: npm run db:migrate
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL fehlt (.env.local)"); process.exit(1); }
const sql = neon(url);
const ddl = readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8");
for (const stmt of ddl.split(";").map(s => s.trim()).filter(Boolean)) {
  await sql.query(stmt);
}
console.log("Schema angelegt/aktuell.");
