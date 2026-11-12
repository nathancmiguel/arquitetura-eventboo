import { defineConfig } from "drizzle-kit";

// O drizzle-kit só lê o schema para gerar as migrações SQL.
// A aplicação das migrações é feita por src/db/migrate.ts (migrator do bun-sqlite).
export default defineConfig({
	out: "./drizzle",
	schema: "./src/db/schema.ts",
	dialect: "sqlite",
	dbCredentials: {
		url: process.env.DATABASE_URL ?? "dev.db",
	},
});
