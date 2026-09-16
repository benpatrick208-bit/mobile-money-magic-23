export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          balance_cents: number
          created_at: string
          frozen_at: string | null
          id: string
          is_frozen: boolean
          kind: string
          mask: string
          name: string
          user_id: string
        }
        Insert: {
          balance_cents?: number
          created_at?: string
          frozen_at?: string | null
          id?: string
          is_frozen?: boolean
          kind?: string
          mask?: string
          name: string
          user_id: string
        }
        Update: {
          balance_cents?: number
          created_at?: string
          frozen_at?: string | null
          id?: string
          is_frozen?: boolean
          kind?: string
          mask?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      bill_payments: {
        Row: {
          account_id: string
          amount_cents: number
          created_at: string
          due_date: string
          frequency: string
          id: string
          payee_id: string
          status: string
          user_id: string
        }
        Insert: {
          account_id: string
          amount_cents: number
          created_at?: string
          due_date: string
          frequency?: string
          id?: string
          payee_id: string
          status?: string
          user_id: string
        }
        Update: {
          account_id?: string
          amount_cents?: number
          created_at?: string
          due_date?: string
          frequency?: string
          id?: string
          payee_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bill_payments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_payments_payee_id_fkey"
            columns: ["payee_id"]
            isOneToOne: false
            referencedRelation: "payees"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          category: string
          created_at: string
          id: string
          limit_cents: number
          month: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          limit_cents?: number
          month: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          limit_cents?: number
          month?: string
          user_id?: string
        }
        Relationships: []
      }
      check_deposits: {
        Row: {
          account_id: string
          amount_cents: number
          back_path: string
          created_at: string
          front_path: string
          id: string
          note: string | null
          status: string
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          account_id: string
          amount_cents: number
          back_path: string
          created_at?: string
          front_path: string
          id?: string
          note?: string | null
          status?: string
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          account_id?: string
          amount_cents?: number
          back_path?: string
          created_at?: string
          front_path?: string
          id?: string
          note?: string | null
          status?: string
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "check_deposits_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      external_transfers: {
        Row: {
          account_number: string
          amount_cents: number
          bank_name: string | null
          created_at: string
          from_account_id: string
          id: string
          memo: string | null
          recipient_name: string
          status: string
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          account_number: string
          amount_cents: number
          bank_name?: string | null
          created_at?: string
          from_account_id: string
          id?: string
          memo?: string | null
          recipient_name: string
          status?: string
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          account_number?: string
          amount_cents?: number
          bank_name?: string | null
          created_at?: string
          from_account_id?: string
          id?: string
          memo?: string | null
          recipient_name?: string
          status?: string
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "external_transfers_from_account_id_fkey"
            columns: ["from_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      payees: {
        Row: {
          account_mask: string | null
          category: string
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          account_mask?: string | null
          category?: string
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          account_mask?: string | null
          category?: string
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          pin_hash: string | null
          pin_set_at: string | null
          preferred_currency: string
        }
        Insert: {
          created_at?: string
          email?: string
          full_name?: string
          id: string
          phone?: string | null
          pin_hash?: string | null
          pin_set_at?: string | null
          preferred_currency?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          pin_hash?: string | null
          pin_set_at?: string | null
          preferred_currency?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          account_id: string
          amount_cents: number
          category: string
          created_at: string
          description: string
          id: string
          merchant: string | null
          occurred_at: string
          status: string
          user_id: string
        }
        Insert: {
          account_id: string
          amount_cents: number
          category?: string
          created_at?: string
          description: string
          id?: string
          merchant?: string | null
          occurred_at?: string
          status?: string
          user_id: string
        }
        Update: {
          account_id?: string
          amount_cents?: number
          category?: string
          created_at?: string
          description?: string
          id?: string
          merchant?: string | null
          occurred_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      transfers: {
        Row: {
          amount_cents: number
          created_at: string
          from_account_id: string
          id: string
          memo: string | null
          to_account_id: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          from_account_id: string
          id?: string
          memo?: string | null
          to_account_id: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          from_account_id?: string
          id?: string
          memo?: string | null
          to_account_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfers_from_account_id_fkey"
            columns: ["from_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_to_account_id_fkey"
            columns: ["to_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_money: {
        Args: {
          p_account: string
          p_amount: number
          p_pin?: string
          p_source?: string
        }
        Returns: string
      }
      add_money_v2: {
        Args: {
          p_account: string
          p_amount: number
          p_note?: string
          p_pin?: string
          p_source?: string
        }
        Returns: string
      }
      assert_account_active: { Args: { p_account: string }; Returns: undefined }
      perform_external_transfer: {
        Args: {
          p_account_number: string
          p_amount: number
          p_bank_name?: string
          p_from: string
          p_memo?: string
          p_pin?: string
          p_recipient_name: string
        }
        Returns: string
      }
      perform_transfer: {
        Args: {
          p_amount: number
          p_from: string
          p_memo?: string
          p_to: string
        }
        Returns: string
      }
      provision_member: {
        Args: { p_email?: string; p_full_name?: string }
        Returns: undefined
      }
      schedule_bill_payment: {
        Args: {
          p_account: string
          p_amount: number
          p_due: string
          p_frequency: string
          p_payee: string
        }
        Returns: string
      }
      set_account_frozen: {
        Args: { p_account: string; p_frozen: boolean; p_pin?: string }
        Returns: boolean
      }
      set_transaction_pin: {
        Args: { p_current_pin?: string; p_pin: string }
        Returns: undefined
      }
      submit_check_deposit: {
        Args: {
          p_account: string
          p_amount: number
          p_back: string
          p_front: string
          p_note?: string
        }
        Returns: string
      }
      verify_transaction_pin: { Args: { p_pin: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
