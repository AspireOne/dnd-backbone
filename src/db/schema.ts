import {
  integer,
  pgTable,
  serial,
  smallint,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

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
    /*userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),*/
    statsId: integer("stats_id"),
    threadId: varchar("thread_id", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  } /*,
  (sessions) => {
    return {
      userIdIndex: uniqueIndex("user_id_idx").on(sessions.userId),
    };
  },*/,
);

export const stats = pgTable("stats", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id")
    .references(() => sessions.id, { onDelete: "cascade" })
    .notNull(),
  health: smallint("health").default(100).notNull(),
  mana: smallint("mana").default(100).notNull(),
  speed: smallint("speed").default(50).notNull(),
  strength: smallint("strength").default(50).notNull(),
});

export const inventoryItems = pgTable("inventory_items", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id")
    .references(() => sessions.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  quantity: smallint("quantity").notNull(),
  icon: varchar("icon", { length: 255 }).notNull(),
});

export const sessionsRelations = relations(sessions, ({ many, one }) => ({
  stats: one(stats, { fields: [sessions.id], references: [stats.id] }),
  //inventoryItems: many(inventoryItems),
}));

/*export const statsRelations = relations(stats, ({ one }) => ({
  session: one(sessions, {
    fields: [stats.sessionId],
    references: [sessions.statsId],
  }),
}));*/

export type User = typeof users.$inferSelect;
export type DbSession = typeof sessions.$inferSelect;
export type Stats = typeof stats.$inferSelect;
export type InventoryItem = typeof inventoryItems.$inferSelect;
