-- Trigger function to increment bricks counters
CREATE OR REPLACE FUNCTION increment_bricks()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. Increment the set's bricks_recibidos
  UPDATE public.sets
  SET bricks_recibidos = bricks_recibidos + 1
  WHERE id = NEW.set_id;

  -- 2. Increment the user's total_bricks_recibidos
  -- First we need to find the user_id of the set owner
  UPDATE public.usuarios_perfil
  SET total_bricks_recibidos = total_bricks_recibidos + 1
  WHERE id = (SELECT usuario_id FROM public.sets WHERE id = NEW.set_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_brick_inserted ON public.bricks_recibidos;
CREATE TRIGGER on_brick_inserted
AFTER INSERT ON public.bricks_recibidos
FOR EACH ROW EXECUTE FUNCTION increment_bricks();
