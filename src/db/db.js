import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
export const dbClient = postgres(process.env.DATABASE_URL, {});
export const db = drizzle(dbClient, { schema: schema });
//# sourceMappingURL=db.js.map