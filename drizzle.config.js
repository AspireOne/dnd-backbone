import { defineConfig } from "drizzle-kit";
export default defineConfig({
    schema: "./src/db/schema.ts",
    out: "./src/db/migrations",
    driver: 'pg',
    dbCredentials: {
        connectionString: process.env.DATABASE_URL,
        host: process.env.DB_HOST,
        password: process.env.DB_PASSWORD,
        user: process.env.DB_USER,
    },
    verbose: true,
    strict: true,
});
//# sourceMappingURL=drizzle.config.js.map