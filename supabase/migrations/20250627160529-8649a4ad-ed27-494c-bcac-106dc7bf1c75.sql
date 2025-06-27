
-- Add show_in_vitrine field to coupons table
ALTER TABLE public.coupons 
ADD COLUMN show_in_vitrine BOOLEAN NOT NULL DEFAULT false;

-- Add comment to document the field purpose
COMMENT ON COLUMN public.coupons.show_in_vitrine IS 'Controls whether coupon appears in user vitrine (does not affect checkout validation)';
