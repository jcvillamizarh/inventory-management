CREATE TABLE "daily_closures" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"user_id" uuid NOT NULL,
	"closure_date" date DEFAULT now() NOT NULL,
	"initial_stock" numeric(10, 2) NOT NULL,
	"total_entries" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"physical_stock" numeric(10, 2) NOT NULL,
	"calculated_consumption" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_entries" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"provider_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"user_id" uuid NOT NULL,
	"package_quantity" integer NOT NULL,
	"package_content" numeric(10, 2) NOT NULL,
	"total_base_qty" numeric(10, 2) NOT NULL,
	"net_cost" numeric(12, 2) NOT NULL,
	"entry_date" date DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"category" varchar(20) NOT NULL,
	"type" varchar(20) NOT NULL,
	"unit_base" varchar(20) NOT NULL,
	"stock_minimo" numeric(10, 2),
	CONSTRAINT "products_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "providers" (
	"id" serial PRIMARY KEY NOT NULL,
	"nit_cedula" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"phone" varchar(20),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "providers_nit_cedula_unique" UNIQUE("nit_cedula")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(50) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"role" varchar(20) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "daily_closures" ADD CONSTRAINT "daily_closures_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_closures" ADD CONSTRAINT "daily_closures_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_entries" ADD CONSTRAINT "inventory_entries_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_entries" ADD CONSTRAINT "inventory_entries_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_entries" ADD CONSTRAINT "inventory_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;