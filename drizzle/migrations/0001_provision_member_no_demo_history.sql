CREATE OR REPLACE FUNCTION public.provision_member(p_full_name text DEFAULT NULL::text, p_email text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid UUID := auth.uid();
  v_month DATE := date_trunc('month', CURRENT_DATE)::date;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  INSERT INTO public.profiles (id, full_name, email)
  VALUES (v_uid, coalesce(p_full_name, ''), coalesce(p_email, ''))
  ON CONFLICT (id) DO UPDATE
    SET full_name = CASE WHEN coalesce(public.profiles.full_name, '') = ''
                         THEN coalesce(p_full_name, '') ELSE public.profiles.full_name END,
        email = CASE WHEN coalesce(public.profiles.email, '') = ''
                     THEN coalesce(p_email, '') ELSE public.profiles.email END;

  IF EXISTS (SELECT 1 FROM public.accounts WHERE user_id = v_uid) THEN RETURN; END IF;

  INSERT INTO public.accounts (user_id, name, kind, mask, balance_cents)
  VALUES (v_uid, 'Everyday Checking', 'checking', '4821', 0);
  INSERT INTO public.accounts (user_id, name, kind, mask, balance_cents)
  VALUES (v_uid, 'Member Savings', 'savings', '9106', 0);

  INSERT INTO public.budgets (user_id, category, limit_cents, month) VALUES
    (v_uid, 'groceries', 45000, v_month),
    (v_uid, 'dining', 20000, v_month),
    (v_uid, 'transport', 15000, v_month),
    (v_uid, 'utilities', 25000, v_month),
    (v_uid, 'entertainment', 10000, v_month)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.payees (user_id, name, category, account_mask) VALUES
    (v_uid, 'Riverline Power', 'utilities', '2210'),
    (v_uid, 'Cascade Internet', 'utilities', '8834'),
    (v_uid, 'Sunrise Auto Loan', 'loans', '5540');
END;
$function$;