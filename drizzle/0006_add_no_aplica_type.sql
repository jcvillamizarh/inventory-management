-- Add NO_APLICA to the type check constraint
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_type_check;
ALTER TABLE products ADD CONSTRAINT products_type_check CHECK (type IN ('SECO_NO_PERECEDERO', 'PERECEDERO', 'NO_APLICA'));

-- Update stock_minimo check constraint to include NO_APLICA
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_stock_minimo_check;
ALTER TABLE products ADD CONSTRAINT products_stock_minimo_check CHECK (
  (type = 'SECO_NO_PERECEDERO' AND stock_minimo IS NOT NULL AND stock_minimo > 0) OR 
  (type = 'PERECEDERO' AND stock_minimo IS NULL) OR 
  (type = 'NO_APLICA' AND stock_minimo IS NULL)
);
