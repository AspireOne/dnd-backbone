import {
  integer,
  pgTable,
  serial,
  smallint,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

// Example usages:
//
// export type User = typeof users.$inferSelect; // return type when queried
// export type NewUser = typeof users.$inferInsert; // insert type

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 255 }),
});

export const sessions = pgTable(
  "sessions",
  {
    id: serial("id").primaryKey(),
    createdAt: timestamp("created_at"),
    userId: integer("user_id").references(() => users.id),
    threadId: varchar("thread_id", { length: 255 }),
    inventoryId: integer("inventory_id").references(() => inventories.id),
    statsId: integer("stats_id").references(() => stats.id),
  },
  (sessions) => {
    return {
      userIdIndex: uniqueIndex("user_id_idx").on(sessions.userId),
    };
  },
);

export const stats = pgTable("stats", {
  id: serial("id").primaryKey(),
  health: smallint("health"),
  mana: smallint("mana"),
  speed: smallint("speed"),
  strength: smallint("strength"),
});

export const inventories = pgTable("inventories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }),
  // quantity - positive number 0-255
  quantity: smallint("quantity"),
  icon: varchar("icon", { length: 255 }),
});
