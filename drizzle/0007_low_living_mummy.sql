ALTER TABLE "inventory_entries" ALTER COLUMN "expiration_date" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory_entries" ALTER COLUMN "batch_number" DROP NOT NULL;