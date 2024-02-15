ALTER TABLE "inventories" RENAME TO "inventory_items";--> statement-breakpoint
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_inventory_id_inventories_id_fk";
--> statement-breakpoint
ALTER TABLE "inventory_items" ADD COLUMN "session_id" integer;--> statement-breakpoint
ALTER TABLE "sessions" DROP COLUMN IF EXISTS "inventory_id";