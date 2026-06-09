CREATE TABLE "stock_movements" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"user_id" uuid NOT NULL,
	"movement_type" varchar(20) NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"reference_id" integer,
	"reference_type" varchar(50),
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"notes" text
);
--> statement-breakpoint
ALTER TABLE "daily_closures" ADD COLUMN "closure_timestamp" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "daily_closures" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;