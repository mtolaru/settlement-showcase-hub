export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      settlements: {
        Row: {
          amount: number
          attorney: string
          attorney_email: string | null
          case_description: string | null
          created_at: string
          description: string | null
          firm: string
          firm_website: string | null
          hidden: boolean | null
          id: number
          initial_offer: number | null
          location: string
          medical_expenses: number | null
          payment_completed: boolean | null
          photo_url: string | null
          policy_limit: number | null
          settlement_date: string | null
          settlement_phase: string | null
          temporary_id: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          amount: number
          attorney: string
          attorney_email?: string | null
          case_description?: string | null
          created_at?: string
          description?: string | null
          firm: string
          firm_website?: string | null
          hidden?: boolean | null
          id?: number
          initial_offer?: number | null
          location: string
          medical_expenses?: number | null
          payment_completed?: boolean | null
          photo_url?: string | null
          policy_limit?: number | null
          settlement_date?: string | null
          settlement_phase?: string | null
          temporary_id?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          attorney?: string
          attorney_email?: string | null
          case_description?: string | null
          created_at?: string
          description?: string | null
          firm?: string
          firm_website?: string | null
          hidden?: boolean | null
          id?: number
          initial_offer?: number | null
          location?: string
          medical_expenses?: number | null
          payment_completed?: boolean | null
          photo_url?: string | null
          policy_limit?: number | null
          settlement_date?: string | null
          settlement_phase?: string | null
          temporary_id?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          customer_id: string | null
          ends_at: string | null
          id: string
          is_active: boolean | null
          payment_id: string | null
          starts_at: string
          temporary_id: string | null
          user_id: string | null
        }
        Insert: {
          customer_id?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          payment_id?: string | null
          starts_at?: string
          temporary_id?: string | null
          user_id?: string | null
        }
        Update: {
          customer_id?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          payment_id?: string | null
          starts_at?: string
          temporary_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      subscription_tier: "professional"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
