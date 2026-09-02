CREATE TABLE public.external_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_account_id UUID NOT NULL REFERENCES public.accounts(id),
  recipient_name TEXT NOT NULL,
  bank_name TEXT,
  account_number TEXT NOT NULL,
  amount_cents BIGINT NOT NULL,
  memo TEXT,
  status TEXT NOT NULL DEFAULT 'sent',
  transaction_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.external_transfers TO authenticated;
GRANT ALL ON public.external_transfers TO service_role;

ALTER TABLE public.external_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own external transfers" ON public.external_transfers
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX external_transfers_user_idx ON public.external_transfers (user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.perform_external_transfer(
  p_from uuid,
  p_account_number text,
  p_recipient_name text,
  p_amount bigint,
  p_bank_name text DEFAULT NULL,
  p_memo text DEFAULT NULL,
  p_pin text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid UUID := auth.uid();
  v_acct public.accounts;
  v_pin_hash TEXT;
  v_txn UUID;
  v_id UUID;
  v_number TEXT := regexp_replace(COALESCE(p_account_number, ''), '[^0-9]', '', 'g');
  v_name TEXT := NULLIF(TRIM(COALESCE(p_recipient_name, '')), '');
  v_bank TEXT := NULLIF(TRIM(COALESCE(p_bank_name, '')), '');
  v_memo TEXT := NULLIF(TRIM(COALESCE(p_memo, '')), '');
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Amount must be greater than zero'; END IF;
  IF v_number !~ '^[0-9]{9,10}$' THEN RAISE EXCEPTION 'Account number must be 9 or 10 digits'; END IF;
  IF v_name IS NULL THEN RAISE EXCEPTION 'Recipient name is required'; END IF;

  SELECT pin_hash INTO v_pin_hash FROM public.profiles WHERE id = v_uid;
  IF v_pin_hash IS NOT NULL THEN
    IF p_pin IS NULL OR md5(p_pin || v_uid::text) <> v_pin_hash THEN
      RAISE EXCEPTION 'Incorrect transaction PIN';
    END IF;
  END IF;

  SELECT * INTO v_acct FROM public.accounts WHERE id = p_from AND user_id = v_uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Source account not found'; END IF;
  IF v_acct.balance_cents < p_amount THEN RAISE EXCEPTION 'Insufficient funds'; END IF;

  UPDATE public.accounts SET balance_cents = balance_cents - p_amount WHERE id = p_from;

  INSERT INTO public.transactions (user_id, account_id, description, merchant, category, amount_cents, status)
  VALUES (v_uid, p_from, LEFT(COALESCE(v_memo, 'Transfer to ' || v_name), 140),
          COALESCE(v_bank, 'External bank'), 'transfer', -p_amount, 'posted')
  RETURNING id INTO v_txn;

  INSERT INTO public.external_transfers (user_id, from_account_id, recipient_name, bank_name, account_number, amount_cents, memo, transaction_id)
  VALUES (v_uid, p_from, v_name, v_bank, v_number, p_amount, v_memo, v_txn)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$function$;