
export interface Settlement {
  id: number;
  amount: number;
  type: string;
  firm: string;
  firmWebsite?: string;
  attorney: string;
  location: string;
  created_at: string;
  settlement_date: string | null;
  description: string | null;
  case_description: string | null;
  initial_offer: number | null;
  policy_limit: number | null;
  medical_expenses: number | null;
  settlement_phase: string | null;
  temporary_id?: string;
  user_id?: string;
  payment_completed?: boolean;
  photo_url?: string;
}
