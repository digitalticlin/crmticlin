-- RPC adicional para verificar se pode usar trial gratuito
CREATE OR REPLACE FUNCTION can_use_free_trial(p_user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Já usou trial?
  IF EXISTS (
    SELECT 1 FROM free_trial_usage
    WHERE user_id = p_user_id
  ) THEN
    RETURN FALSE;
  END IF;

  -- Já teve plano pago?
  IF EXISTS (
    SELECT 1 FROM plan_subscriptions
    WHERE user_id = p_user_id
    AND plan_type != 'free_200'
    AND status IN ('active', 'past_due', 'canceled')
  ) THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;