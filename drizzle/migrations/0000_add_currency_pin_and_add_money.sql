-- Member preferences: display currency + transaction PIN
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_currency TEXT NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS pin_hash TEXT,
  ADD COLUMN IF NOT EXISTS pin_set_at TIMESTAMPTZ;

-- Set or replace the member's 4-6 digit transaction PIN (hashed with a per-user salt)
CREATE OR REPLACE FUNCTION public.set_transaction_pin(p_pin TEXT, p_current_pin TEXT DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_existing TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_pin IS NULL OR p_pin !~ '^[0-9]{4,6}$' THEN
    RAISE EXCEPTION 'PIN must be 4 to 6 digits';
  END IF;

  SELECT pin_hash INTO v_existing FROM public.profiles WHERE id = v_uid;

  IF v_existing IS NOT NULL THEN
    IF p_current_pin IS NULL OR md5(p_current_pin || v_uid::text) <> v_existing THEN
      RAISE EXCEPTION 'Current PIN is incorrect';
    END IF;
  END IF;

  UPDATE public.profiles
     SET pin_hash = md5(p_pin || v_uid::text),
         pin_set_at = now()
   WHERE id = v_uid;
END;
$$;

-- Verify a PIN attempt
CREATE OR REPLACE FUNCTION public.verify_transaction_pin(p_pin TEXT)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
     WHERE id = auth.uid()
       AND pin_hash IS NOT NULL
       AND pin_hash = md5(p_pin || auth.uid()::text)
  );
$$;

-- Add money to an account (demo funding source), optionally PIN protected
CREATE OR REPLACE FUNCTION public.add_money(
  p_account UUID,
  p_amount BIGINT,
  p_source TEXT DEFAULT 'Linked debit card',
  p_pin TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_pin_hash TEXT;
  v_txn UUID;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than zero';
  END IF;
  IF p_amount > 2000000 THEN
    RAISE EXCEPTION 'Amount exceeds the $20,000 per-deposit limit';
  END IF;

  SELECT pin_hash INTO v_pin_hash FROM public.profiles WHERE id = v_uid;
  IF v_pin_hash IS NOT NULL THEN
    IF p_pin IS NULL OR md5(p_pin || v_uid::text) <> v_pin_hash THEN
      RAISE EXCEPTION 'Incorrect transaction PIN';
    END IF;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.accounts WHERE id = p_account AND user_id = v_uid) THEN
    RAISE EXCEPTION 'Account not found';
  END IF;

  UPDATE public.accounts
     SET balance_cents = balance_cents + p_amount
   WHERE id = p_account AND user_id = v_uid;

  INSERT INTO public.transactions (user_id, account_id, description, merchant, category, amount_cents, status)
  VALUES (v_uid, p_account, 'Added money', COALESCE(NULLIF(TRIM(p_source), ''), 'Linked debit card'), 'income', p_amount, 'posted')
  RETURNING id INTO v_txn;

  RETURN v_txn;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_transaction_pin(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_transaction_pin(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_money(UUID, BIGINT, TEXT, TEXT) TO authenticated;