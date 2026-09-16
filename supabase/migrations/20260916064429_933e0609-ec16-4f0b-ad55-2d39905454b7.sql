ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS is_frozen BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS frozen_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.set_account_frozen(p_account uuid, p_frozen boolean, p_pin text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid UUID := auth.uid();
  v_pin_hash TEXT;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT pin_hash INTO v_pin_hash FROM public.profiles WHERE id = v_uid;
  IF v_pin_hash IS NOT NULL THEN
    IF p_pin IS NULL OR md5(p_pin || v_uid::text) <> v_pin_hash THEN
      RAISE EXCEPTION 'Incorrect transaction PIN';
    END IF;
  END IF;

  UPDATE public.accounts
     SET is_frozen = COALESCE(p_frozen, false),
         frozen_at = CASE WHEN COALESCE(p_frozen, false) THEN now() ELSE NULL END
   WHERE id = p_account AND user_id = v_uid;

  IF NOT FOUND THEN RAISE EXCEPTION 'Account not found'; END IF;
  RETURN COALESCE(p_frozen, false);
END;
$function$;

CREATE OR REPLACE FUNCTION public.assert_account_active(p_account uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_frozen BOOLEAN;
BEGIN
  SELECT is_frozen INTO v_frozen FROM public.accounts WHERE id = p_account AND user_id = auth.uid();
  IF v_frozen THEN
    RAISE EXCEPTION 'This account is frozen. Unfreeze it to move money.';
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.add_money_v2(p_account uuid, p_amount bigint, p_source text DEFAULT 'Linked debit card'::text, p_pin text DEFAULT NULL::text, p_note text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid UUID := auth.uid();
  v_pin_hash TEXT;
  v_txn UUID;
  v_desc TEXT := COALESCE(NULLIF(TRIM(p_note), ''), 'Added money');
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Amount must be greater than zero'; END IF;

  SELECT pin_hash INTO v_pin_hash FROM public.profiles WHERE id = v_uid;
  IF v_pin_hash IS NOT NULL THEN
    IF p_pin IS NULL OR md5(p_pin || v_uid::text) <> v_pin_hash THEN
      RAISE EXCEPTION 'Incorrect transaction PIN';
    END IF;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.accounts WHERE id = p_account AND user_id = v_uid) THEN
    RAISE EXCEPTION 'Account not found';
  END IF;
  PERFORM public.assert_account_active(p_account);

  UPDATE public.accounts SET balance_cents = balance_cents + p_amount
   WHERE id = p_account AND user_id = v_uid;

  INSERT INTO public.transactions (user_id, account_id, description, merchant, category, amount_cents, status)
  VALUES (v_uid, p_account, LEFT(v_desc, 140), COALESCE(NULLIF(TRIM(p_source), ''), 'Linked debit card'), 'income', p_amount, 'posted')
  RETURNING id INTO v_txn;

  RETURN v_txn;
END;
$function$;

CREATE OR REPLACE FUNCTION public.perform_transfer(p_from uuid, p_to uuid, p_amount bigint, p_memo text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid UUID := auth.uid();
  v_from public.accounts;
  v_to public.accounts;
  v_id UUID;
  v_memo TEXT := NULLIF(TRIM(p_memo), '');
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Amount must be greater than zero'; END IF;
  IF p_from = p_to THEN RAISE EXCEPTION 'Choose two different accounts'; END IF;

  SELECT * INTO v_from FROM public.accounts WHERE id = p_from AND user_id = v_uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Source account not found'; END IF;
  SELECT * INTO v_to FROM public.accounts WHERE id = p_to AND user_id = v_uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Destination account not found'; END IF;
  IF v_from.is_frozen OR v_to.is_frozen THEN
    RAISE EXCEPTION 'This account is frozen. Unfreeze it to move money.';
  END IF;
  IF v_from.balance_cents < p_amount THEN RAISE EXCEPTION 'Insufficient funds'; END IF;

  UPDATE public.accounts SET balance_cents = balance_cents - p_amount WHERE id = p_from;
  UPDATE public.accounts SET balance_cents = balance_cents + p_amount WHERE id = p_to;

  INSERT INTO public.transactions (user_id, account_id, description, merchant, category, amount_cents, status)
  VALUES (v_uid, p_from, LEFT(COALESCE(v_memo, 'Transfer to ' || v_to.name), 140), 'Empower CU', 'transfer', -p_amount, 'posted');
  INSERT INTO public.transactions (user_id, account_id, description, merchant, category, amount_cents, status)
  VALUES (v_uid, p_to, LEFT(COALESCE(v_memo, 'Transfer from ' || v_from.name), 140), 'Empower CU', 'transfer', p_amount, 'posted');

  INSERT INTO public.transfers (user_id, from_account_id, to_account_id, amount_cents, memo)
  VALUES (v_uid, p_from, p_to, p_amount, v_memo) RETURNING id INTO v_id;
  RETURN v_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.perform_external_transfer(p_from uuid, p_account_number text, p_recipient_name text, p_amount bigint, p_bank_name text DEFAULT NULL::text, p_memo text DEFAULT NULL::text, p_pin text DEFAULT NULL::text)
 RETURNS uuid
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
  IF v_acct.is_frozen THEN RAISE EXCEPTION 'This account is frozen. Unfreeze it to move money.'; END IF;
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

CREATE OR REPLACE FUNCTION public.schedule_bill_payment(p_payee uuid, p_account uuid, p_amount bigint, p_due date, p_frequency text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid UUID := auth.uid();
  v_payee public.payees;
  v_acct public.accounts;
  v_id UUID;
  v_status TEXT := 'scheduled';
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Amount must be greater than zero'; END IF;
  IF p_frequency NOT IN ('once', 'monthly') THEN RAISE EXCEPTION 'Invalid frequency'; END IF;

  SELECT * INTO v_payee FROM public.payees WHERE id = p_payee AND user_id = v_uid;
  IF NOT FOUND THEN RAISE EXCEPTION 'Payee not found'; END IF;
  SELECT * INTO v_acct FROM public.accounts WHERE id = p_account AND user_id = v_uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Account not found'; END IF;
  IF v_acct.is_frozen THEN RAISE EXCEPTION 'This account is frozen. Unfreeze it to move money.'; END IF;

  IF p_due <= CURRENT_DATE THEN
    IF v_acct.balance_cents < p_amount THEN RAISE EXCEPTION 'Insufficient funds'; END IF;
    UPDATE public.accounts SET balance_cents = balance_cents - p_amount WHERE id = p_account;
    INSERT INTO public.transactions (user_id, account_id, description, merchant, category, amount_cents, status)
    VALUES (v_uid, p_account, 'Bill payment - ' || v_payee.name, v_payee.name, v_payee.category, -p_amount, 'posted');
    v_status := 'paid';
  END IF;

  INSERT INTO public.bill_payments (user_id, payee_id, account_id, amount_cents, due_date, frequency, status)
  VALUES (v_uid, p_payee, p_account, p_amount, p_due, p_frequency, v_status) RETURNING id INTO v_id;
  RETURN v_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.submit_check_deposit(p_account uuid, p_amount bigint, p_front text, p_back text, p_note text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid UUID := auth.uid();
  v_acct public.accounts;
  v_txn UUID;
  v_id UUID;
  v_note TEXT := NULLIF(TRIM(p_note), '');
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Amount must be greater than zero'; END IF;
  IF coalesce(p_front, '') = '' OR coalesce(p_back, '') = '' THEN RAISE EXCEPTION 'Both check images are required'; END IF;

  SELECT * INTO v_acct FROM public.accounts WHERE id = p_account AND user_id = v_uid;
  IF NOT FOUND THEN RAISE EXCEPTION 'Account not found'; END IF;
  IF v_acct.is_frozen THEN RAISE EXCEPTION 'This account is frozen. Unfreeze it to move money.'; END IF;

  INSERT INTO public.transactions (user_id, account_id, description, merchant, category, amount_cents, status)
  VALUES (v_uid, p_account, LEFT(COALESCE(v_note, 'Mobile check deposit'), 140), 'Empower CU', 'deposit', p_amount, 'pending')
  RETURNING id INTO v_txn;

  INSERT INTO public.check_deposits (user_id, account_id, amount_cents, front_path, back_path, note, transaction_id)
  VALUES (v_uid, p_account, p_amount, p_front, p_back, v_note, v_txn) RETURNING id INTO v_id;
  RETURN v_id;
END;
$function$;