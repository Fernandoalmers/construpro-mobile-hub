
-- Trigger function to update product inventory when order items are created
CREATE OR REPLACE FUNCTION public.update_inventory_on_order_item()
RETURNS TRIGGER AS $$
BEGIN
  -- Update product inventory by reducing it by the quantity ordered
  UPDATE public.produtos
  SET estoque = GREATEST(0, estoque - NEW.quantidade)
  WHERE id = NEW.produto_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function to register points earned from orders
CREATE OR REPLACE FUNCTION public.register_points_on_order()
RETURNS TRIGGER AS $$
DECLARE
  points_registered BOOLEAN;
BEGIN
  -- Skip if no points to award or points are zero/negative
  IF NEW.pontos_ganhos IS NULL OR NEW.pontos_ganhos <= 0 THEN
    RETURN NEW;
  END IF;
  
  -- Check if points were already registered for this order to avoid duplicates
  SELECT EXISTS (
    SELECT 1 FROM public.points_transactions 
    WHERE referencia_id = NEW.id AND tipo = 'compra'
  ) INTO points_registered;
  
  -- Only register points if not already registered
  IF NOT points_registered THEN
    -- Add points transaction record
    INSERT INTO public.points_transactions (
      user_id, 
      pontos, 
      tipo, 
      descricao, 
      referencia_id
    ) VALUES (
      NEW.cliente_id,
      NEW.pontos_ganhos,
      'compra',
      'Pontos por compra #' || NEW.id,
      NEW.id
    );
    
    -- Update user points balance
    PERFORM public.update_user_points(NEW.cliente_id, NEW.pontos_ganhos);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on order_items table to update inventory
DROP TRIGGER IF EXISTS update_inventory_trigger ON public.order_items;
CREATE TRIGGER update_inventory_trigger
AFTER INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.update_inventory_on_order_item();

-- Create trigger on orders table to register points
DROP TRIGGER IF EXISTS register_points_trigger ON public.orders;
CREATE TRIGGER register_points_trigger
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.register_points_on_order();
