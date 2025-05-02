
CREATE OR REPLACE FUNCTION update_user_points(user_id UUID, points_to_add INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET saldo_pontos = COALESCE(saldo_pontos, 0) + points_to_add
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
