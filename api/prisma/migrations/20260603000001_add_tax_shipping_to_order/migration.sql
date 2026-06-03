-- Add cost breakdown fields to Order table for NJ tax and shipping tracking
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "subtotal" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "taxAmount" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "shippingCost" DECIMAL(10,2) NOT NULL DEFAULT 0;
