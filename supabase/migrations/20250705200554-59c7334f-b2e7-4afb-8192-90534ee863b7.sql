-- Fix cart quantity field to support decimal values
-- This resolves the error when adding products with decimal conversion values to cart

ALTER TABLE public.cart_items 
ALTER COLUMN quantity TYPE numeric USING quantity::numeric;

-- Add a comment to document the change
COMMENT ON COLUMN public.cart_items.quantity IS 'Product quantity - supports decimal values for products with conversion factors';