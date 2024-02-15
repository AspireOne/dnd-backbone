ALTER TABLE "inventory_items" ALTER COLUMN "session_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "thread_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "stats" ALTER COLUMN "health" SET DEFAULT 100;--> statement-breakpoint
ALTER TABLE "stats" ALTER COLUMN "mana" SET DEFAULT 100;--> statement-breakpoint
ALTER TABLE "stats" ALTER COLUMN "speed" SET DEFAULT 50;--> statement-breakpoint
ALTER TABLE "stats" ALTER COLUMN "strength" SET DEFAULT 50;--> statement-breakpoint
ALTER TABLE "stats" ADD COLUMN "session_id" integer NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stats" ADD CONSTRAINT "stats_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
