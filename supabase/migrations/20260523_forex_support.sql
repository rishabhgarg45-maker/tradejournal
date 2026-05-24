-- Add forex/CFD support: allow fractional quantities for forex lots
ALTER TABLE trades ALTER COLUMN quantity TYPE DECIMAL(12, 2);
