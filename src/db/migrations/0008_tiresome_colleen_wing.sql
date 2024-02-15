ALTER TABLE "sessions" DROP CONSTRAINT "sessions_user_id_users_id_fk";
--> statement-breakpoint
DROP INDEX IF EXISTS "user_id_idx";--> statement-breakpoint
ALTER TABLE "sessions" DROP COLUMN IF EXISTS "user_id";