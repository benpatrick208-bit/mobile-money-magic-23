import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Account = {
  id: string;
  name: string;
  kind: string;
  mask: string;
  balance_cents: number;
  is_frozen: boolean;
  frozen_at: string | null;
};

export type Transaction = {
  id: string;
  account_id: string;
  description: string;
  merchant: string | null;
  category: string;
  amount_cents: number;
  status: string;
  occurred_at: string;
};

/** Creates the member's profile + starter accounts on first sign-in. */
export function useProvisionMember() {
  return useQuery({
    queryKey: ["provision"],
    staleTime: Infinity,
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      const { error } = await supabase.rpc("provision_member", {
        p_full_name: (user?.user_metadata?.["full_name"] as string) ?? "",
        p_email: user?.email ?? "",
      });
      if (error) throw error;
      return true;
    },
  });
}

export function useAccounts() {
  const provisioned = useProvisionMember();
  return useQuery({
    queryKey: ["accounts"],
    enabled: provisioned.isSuccess,
    queryFn: async (): Promise<Account[]> => {
      const { data, error } = await supabase
        .from("accounts")
        .select("id, name, kind, mask, balance_cents")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useRecentTransactions(limit = 6) {
  const provisioned = useProvisionMember();
  return useQuery({
    queryKey: ["transactions", "recent", limit],
    enabled: provisioned.isSuccess,
    queryFn: async (): Promise<Transaction[]> => {
      const { data, error } = await supabase
        .from("transactions")
        .select("id, account_id, description, merchant, category, amount_cents, status, occurred_at")
        .order("occurred_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useProfile() {
  const provisioned = useProvisionMember();
  return useQuery({
    queryKey: ["profile"],
    enabled: provisioned.isSuccess,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, preferred_currency, pin_set_at")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

/** True when the member has a transaction PIN on file. */
export function usePinStatus() {
  const profile = useProfile();
  return {
    isLoading: profile.isLoading,
    hasPin: !!profile.data?.pin_set_at,
  };
}
