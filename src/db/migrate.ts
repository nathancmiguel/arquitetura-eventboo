import { migrate } from "drizzle-orm/bun-sqlite/migrator";

import { db } from "./index.ts";

migrate(db, { migrationsFolder: "./drizzle" });
console.log("Migrações aplicadas.");
