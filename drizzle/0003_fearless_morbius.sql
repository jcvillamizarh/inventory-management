ALTER TABLE "providers" DROP CONSTRAINT "providers_nit_cedula_unique";--> statement-breakpoint
ALTER TABLE "providers" ALTER COLUMN "nit_cedula" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "providers" ADD COLUMN "address" varchar(200);