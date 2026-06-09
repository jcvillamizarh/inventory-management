-- Add GRAMOS and MILILITROS to unitBase enum
-- This migration updates the CHECK constraint to include the new unit options

-- Drop the old CHECK constraint
ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_unitCheck";

-- Add the new CHECK constraint with GRAMOS and MILILITROS
ALTER TABLE "products" ADD CONSTRAINT "products_unitCheck" CHECK ("unit_base" IN ('KILOGRAMOS', 'LITROS', 'UNIDADES', 'GRAMOS', 'MILILITROS'));
