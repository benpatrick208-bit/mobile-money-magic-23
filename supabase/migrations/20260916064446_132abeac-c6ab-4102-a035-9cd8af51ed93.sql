REVOKE ALL ON FUNCTION public.assert_account_active(uuid) FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.set_account_frozen(uuid, boolean, text) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_account_frozen(uuid, boolean, text) TO authenticated;