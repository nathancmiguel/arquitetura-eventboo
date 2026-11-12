import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";

import * as schema from "./schema.ts";

// Driver nativo do Bun. O Bun carrega o .env sozinho.
const sqlite = new Database(process.env.DATABASE_URL ?? "dev.db", {
	create: true,
});
sqlite.exec("PRAGMA journal_mode = WAL;");
sqlite.exec("PRAGMA foreign_keys = ON;");
sqlite.exec("PRAGMA busy_timeout = 5000;");

export const db = drizzle(sqlite, { schema });
export type BancoDeDados = typeof db;
