import "dotenv/config";
import { db, dbClient } from "./db";
import { migrate } from "drizzle-orm/postgres-js/migrator";

// This will run migrations on the database, skipping the ones already applied
async function execute() {
  await migrate(db, {
    migrationsFolder: "src/db/migrations",
  });
  // Don't forget to close the connection, otherwise the script will hang
  await dbClient.end();
}
execute();
