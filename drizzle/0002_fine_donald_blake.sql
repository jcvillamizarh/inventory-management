ALTER TABLE "inventory_entries" ADD COLUMN "expiration_date" date NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory_entries" ADD COLUMN "batch_number" varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory_entries" ADD COLUMN "quantity_units" numeric(10, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory_entries" DROP COLUMN "package_quantity";--> statement-breakpoint
ALTER TABLE "inventory_entries" DROP COLUMN "package_content";--> statement-breakpoint
ALTER TABLE "inventory_entries" DROP COLUMN "total_base_qty";